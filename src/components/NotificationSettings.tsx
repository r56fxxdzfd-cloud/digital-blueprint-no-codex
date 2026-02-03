import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bell, 
  BellOff, 
  Smartphone, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  Sun,
  Clock,
  Moon,
  Send,
  Share
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useToast } from '@/hooks/use-toast';

export function NotificationSettings() {
  const { toast } = useToast();
  const {
    settings,
    settingsLoading,
    updateSettings,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    sendTestNotification,
    isPWA,
    isIOS,
    isPushSupported,
    permission,
  } = useNotifications();

  // Local state for form
  const [enabled, setEnabled] = useState(false);
  const [morningEnabled, setMorningEnabled] = useState(true);
  const [morningTime, setMorningTime] = useState('08:30');
  const [middayEnabled, setMiddayEnabled] = useState(false);
  const [middayTime, setMiddayTime] = useState('12:30');
  const [eveningEnabled, setEveningEnabled] = useState(true);
  const [eveningTime, setEveningTime] = useState('20:30');
  const [messageMorning, setMessageMorning] = useState('');
  const [messageMidday, setMessageMidday] = useState('');
  const [messageEvening, setMessageEvening] = useState('');

  // Sync from settings
  useEffect(() => {
    if (settings) {
      setEnabled(settings.enabled);
      setMorningEnabled(settings.morning_enabled);
      setMorningTime(settings.morning_time?.slice(0, 5) || '08:30');
      setMiddayEnabled(settings.midday_enabled);
      setMiddayTime(settings.midday_time?.slice(0, 5) || '12:30');
      setEveningEnabled(settings.evening_enabled);
      setEveningTime(settings.evening_time?.slice(0, 5) || '20:30');
      setMessageMorning(settings.message_morning || '');
      setMessageMidday(settings.message_midday || '');
      setMessageEvening(settings.message_evening || '');
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        enabled,
        morning_enabled: morningEnabled,
        morning_time: morningTime + ':00',
        midday_enabled: middayEnabled,
        midday_time: middayTime + ':00',
        evening_enabled: eveningEnabled,
        evening_time: eveningTime + ':00',
        message_morning: messageMorning,
        message_midday: messageMidday,
        message_evening: messageEvening,
      });
      toast({ title: 'Configurações de lembretes salvas!' });
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as configurações.',
        variant: 'destructive',
      });
    }
  };

  const handleEnableNotifications = async () => {
    const success = await subscribe();
    if (success) {
      setEnabled(true);
      await updateSettings.mutateAsync({ enabled: true });
    }
  };

  const handleDisableNotifications = async () => {
    await unsubscribe();
    setEnabled(false);
    await updateSettings.mutateAsync({ enabled: false });
  };

  if (settingsLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  // Show iOS PWA install instructions
  const showIOSInstallGuide = isIOS && !isPWA;
  
  // Show permission denied warning
  const showPermissionDenied = permission === 'denied';
  
  // Show unsupported warning
  const showUnsupported = !isPushSupported && !isIOS;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Lembretes
        </CardTitle>
        <CardDescription>
          Receba notificações para pausar e praticar durante o dia
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* iOS PWA Install Guide */}
        {showIOSInstallGuide && (
          <Alert className="border-warning/50 bg-warning/10">
            <Smartphone className="h-4 w-4 text-warning" />
            <AlertDescription className="text-sm">
              <p className="font-medium mb-2">Para receber notificações no iPhone:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Toque no botão <Share className="inline h-3 w-3 mx-1" /> <strong>Compartilhar</strong> no Safari</li>
                <li>Role e toque em <strong>"Adicionar à Tela de Início"</strong></li>
                <li>Abra o app Blueprint pela tela inicial</li>
                <li>Volte aqui e ative as notificações</li>
              </ol>
            </AlertDescription>
          </Alert>
        )}

        {/* Permission Denied Warning */}
        {showPermissionDenied && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <p className="font-medium mb-1">Notificações bloqueadas</p>
              <p className="text-xs">
                Vá em <strong>Configurações do navegador → Notificações</strong> e permita para este site.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Unsupported Warning */}
        {showUnsupported && (
          <Alert variant="destructive">
            <BellOff className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Seu navegador não suporta notificações push. Use Chrome, Edge ou Safari.
            </AlertDescription>
          </Alert>
        )}

        {/* Subscription Status */}
        {isPushSupported && !showIOSInstallGuide && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              {isSubscribed ? (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              ) : (
                <BellOff className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {isSubscribed ? 'Notificações ativadas' : 'Notificações desativadas'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isSubscribed 
                    ? 'Você receberá lembretes nos horários configurados' 
                    : 'Ative para receber lembretes mesmo com o app fechado'
                  }
                </p>
              </div>
            </div>
            <Button
              variant={isSubscribed ? 'outline' : 'default'}
              size="sm"
              onClick={isSubscribed ? handleDisableNotifications : handleEnableNotifications}
              disabled={isLoading || showPermissionDenied}
            >
              {isLoading ? 'Processando...' : isSubscribed ? 'Desativar' : 'Ativar'}
            </Button>
          </div>
        )}

        {/* PWA Installed Indicator */}
        {isPWA && (
          <Alert className="border-primary/50 bg-primary/10">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              App instalado como PWA – notificações funcionarão mesmo com o app fechado.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="notifications-enabled">Lembretes diários</Label>
            <p className="text-xs text-muted-foreground">
              Ative para configurar horários de lembrete
            </p>
          </div>
          <Switch
            id="notifications-enabled"
            checked={enabled}
            onCheckedChange={(checked) => {
              if (checked && !isSubscribed) {
                handleEnableNotifications();
              } else {
                setEnabled(checked);
              }
            }}
            disabled={!isSubscribed && !isPushSupported}
          />
        </div>

        {enabled && (
          <>
            {/* Morning Reminder */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-warning" />
                  <Label>Manhã</Label>
                </div>
                <Switch
                  checked={morningEnabled}
                  onCheckedChange={setMorningEnabled}
                />
              </div>
              {morningEnabled && (
                <div className="ml-6 space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs w-16">Horário:</Label>
                    <Input
                      type="time"
                      value={morningTime}
                      onChange={(e) => setMorningTime(e.target.value)}
                      className="w-28"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Mensagem:</Label>
                    <Input
                      value={messageMorning}
                      onChange={(e) => setMessageMorning(e.target.value)}
                      placeholder="Pausa rápida: faça sua visualização do dia."
                      maxLength={100}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Midday Reminder */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <Label>Meio do dia</Label>
                </div>
                <Switch
                  checked={middayEnabled}
                  onCheckedChange={setMiddayEnabled}
                />
              </div>
              {middayEnabled && (
                <div className="ml-6 space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs w-16">Horário:</Label>
                    <Input
                      type="time"
                      value={middayTime}
                      onChange={(e) => setMiddayTime(e.target.value)}
                      className="w-28"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Mensagem:</Label>
                    <Input
                      value={messageMidday}
                      onChange={(e) => setMessageMidday(e.target.value)}
                      placeholder="Volte ao centro: 60 segundos de presença."
                      maxLength={100}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Evening Reminder */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4 text-accent" />
                  <Label>Noite</Label>
                </div>
                <Switch
                  checked={eveningEnabled}
                  onCheckedChange={setEveningEnabled}
                />
              </div>
              {eveningEnabled && (
                <div className="ml-6 space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs w-16">Horário:</Label>
                    <Input
                      type="time"
                      value={eveningTime}
                      onChange={(e) => setEveningTime(e.target.value)}
                      className="w-28"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Mensagem:</Label>
                    <Input
                      value={messageEvening}
                      onChange={(e) => setMessageEvening(e.target.value)}
                      placeholder="Fechamento do dia: registre 1 insight e 1 ação."
                      maxLength={100}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Info about how it works */}
            <Alert className="bg-muted/50">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Os lembretes serão enviados nos horários configurados (fuso: America/Sao_Paulo). 
                {isIOS && ' No iPhone, garanta que o app está instalado como PWA.'}
              </AlertDescription>
            </Alert>

            {/* Save and Test Buttons */}
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} className="flex-1">
                Salvar Lembretes
              </Button>
              {isSubscribed && (
                <Button
                  variant="outline"
                  onClick={sendTestNotification}
                  disabled={isLoading}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Testar
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
