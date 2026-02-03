import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// VAPID public key - must match the private key in edge functions
const VAPID_PUBLIC_KEY = 'BKc60amu85SyngPaw0VW7sjlucTzCFM7gROQYNWPBOXXZcZPRue6n6dhPl24cTJu2c-ezSL2TQVhphK3HAvVeE';

export interface NotificationSettings {
  id: string;
  user_id: string | null;
  timezone: string;
  enabled: boolean;
  morning_enabled: boolean;
  morning_time: string;
  midday_enabled: boolean;
  midday_time: string;
  evening_enabled: boolean;
  evening_time: string;
  message_morning: string;
  message_midday: string;
  message_evening: string;
  created_at: string;
  updated_at: string;
}

export interface PushSubscriptionData {
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent?: string;
}

// Detect if running as PWA (standalone mode)
export function isPWA(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

// Detect iOS
export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

// Detect if push is supported
export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

// Get notification permission status
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

// Convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Get current user ID
async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export function useNotifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch notification settings
  const { data: settings, isLoading: settingsLoading, refetch: refetchSettings } = useQuery({
    queryKey: ['notification-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      // Create default settings if none exist
      if (!data) {
        const userId = await getCurrentUserId();
        const { data: newSettings, error: createError } = await supabase
          .from('notification_settings')
          .insert({ user_id: userId })
          .select()
          .single();

        if (createError) throw createError;
        return newSettings as NotificationSettings;
      }

      return data as NotificationSettings;
    },
  });

  // Update notification settings
  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<NotificationSettings>) => {
      if (!settings?.id) throw new Error('No settings found');

      const { data, error } = await supabase
        .from('notification_settings')
        .update(updates)
        .eq('id', settings.id)
        .select()
        .single();

      if (error) throw error;
      return data as NotificationSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
    },
  });

  // Check current subscription status
  const checkSubscription = useCallback(async () => {
    if (!isPushSupported()) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
      return !!subscription;
    } catch {
      setIsSubscribed(false);
      return false;
    }
  }, []);

  // Register service worker
  const registerServiceWorker = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return null;

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      console.log('[Notifications] Service worker registered:', registration.scope);
      return registration;
    } catch (error) {
      console.error('[Notifications] Service worker registration failed:', error);
      return null;
    }
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!isPushSupported()) {
      toast({
        title: 'Não suportado',
        description: 'Push notifications não são suportadas neste navegador.',
        variant: 'destructive',
      });
      return false;
    }

    setIsLoading(true);

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        toast({
          title: 'Permissão negada',
          description: 'Você precisa permitir notificações nas configurações do navegador.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push manager
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      });

      // Extract keys
      const p256dh = subscription.getKey('p256dh');
      const auth = subscription.getKey('auth');

      if (!p256dh || !auth) {
        throw new Error('Failed to get subscription keys');
      }

      const userId = await getCurrentUserId();
      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        p256dh: btoa(String.fromCharCode(...new Uint8Array(p256dh))),
        auth: btoa(String.fromCharCode(...new Uint8Array(auth))),
        user_agent: navigator.userAgent,
      };

      // Save to database
      const { error } = await supabase.from('push_subscriptions').upsert(
        {
          endpoint: subscriptionData.endpoint,
          p256dh: subscriptionData.p256dh,
          auth: subscriptionData.auth,
          user_agent: subscriptionData.user_agent,
          user_id: userId,
        },
        {
          onConflict: 'endpoint',
        }
      );

      if (error) {
        console.error('[Notifications] Failed to save subscription:', error);
        // Try insert instead
        await supabase.from('push_subscriptions').insert({
          endpoint: subscriptionData.endpoint,
          p256dh: subscriptionData.p256dh,
          auth: subscriptionData.auth,
          user_agent: subscriptionData.user_agent,
          user_id: userId,
        });
      }

      setIsSubscribed(true);
      toast({
        title: 'Notificações ativadas!',
        description: 'Você receberá lembretes nos horários configurados.',
      });

      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('[Notifications] Subscription failed:', error);
      toast({
        title: 'Erro ao ativar',
        description: 'Não foi possível ativar as notificações. Tente novamente.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return false;
    }
  }, [toast]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Remove from database
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', subscription.endpoint);

        // Unsubscribe from push manager
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      toast({
        title: 'Notificações desativadas',
        description: 'Você não receberá mais lembretes push.',
      });

      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('[Notifications] Unsubscribe failed:', error);
      setIsLoading(false);
      return false;
    }
  }, [toast]);

  // Send test notification
  const sendTestNotification = useCallback(async () => {
    if (!isSubscribed) {
      toast({
        title: 'Não inscrito',
        description: 'Ative as notificações primeiro.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Use local notification for testing
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification('Blueprint - Teste', {
        body: 'As notificações estão funcionando! 🎉',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'test-notification',
        data: { url: '/today' },
      });

      toast({
        title: 'Notificação enviada!',
        description: 'Verifique as notificações do dispositivo.',
      });
    } catch (error) {
      console.error('[Notifications] Test notification failed:', error);
      toast({
        title: 'Erro no teste',
        description: 'Não foi possível enviar a notificação de teste.',
        variant: 'destructive',
      });
    }
  }, [isSubscribed, toast]);

  // Initialize on mount
  useEffect(() => {
    registerServiceWorker().then(() => {
      checkSubscription();
    });
  }, [registerServiceWorker, checkSubscription]);

  return {
    settings,
    settingsLoading,
    updateSettings,
    refetchSettings,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    sendTestNotification,
    checkSubscription,
    isPWA: isPWA(),
    isIOS: isIOS(),
    isPushSupported: isPushSupported(),
    permission: getNotificationPermission(),
  };
}
