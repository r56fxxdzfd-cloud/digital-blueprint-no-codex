import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// VAPID configuration
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") || "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:notifications@blueprint.app";

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  type?: string;
}

interface PushSubscription {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_id: string | null;
}

// Base64 URL encode/decode helpers
function base64UrlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(input: string): Uint8Array {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const binaryString = atob(base64 + padding);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Create VAPID JWT token
async function createVapidJwt(endpoint: string): Promise<string> {
  const audience = new URL(endpoint).origin;
  const expiration = Math.floor(Date.now() / 1000) + 12 * 60 * 60; // 12 hours

  const header = { typ: "JWT", alg: "ES256" };
  const payload = {
    aud: audience,
    exp: expiration,
    sub: VAPID_SUBJECT,
  };

  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import the private key
  const privateKeyBytes = base64UrlDecode(VAPID_PRIVATE_KEY);
  
  // Create the key for signing - need to use pkcs8 format for ECDSA private keys
  // First, we need to construct a proper PKCS8 key from the raw 32-byte private key
  const pkcs8Header = new Uint8Array([
    0x30, 0x41, 0x02, 0x01, 0x00, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86, 0x48,
    0xce, 0x3d, 0x02, 0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03,
    0x01, 0x07, 0x04, 0x27, 0x30, 0x25, 0x02, 0x01, 0x01, 0x04, 0x20
  ]);
  
  const pkcs8Key = new Uint8Array(pkcs8Header.length + privateKeyBytes.length);
  pkcs8Key.set(pkcs8Header);
  pkcs8Key.set(privateKeyBytes, pkcs8Header.length);

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    pkcs8Key.buffer as ArrayBuffer,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  // Sign the token
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: { name: "SHA-256" } },
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  // Convert signature from DER to raw format if needed and encode
  const signatureB64 = base64UrlEncode(new Uint8Array(signature));

  return `${unsignedToken}.${signatureB64}`;
}

// Encrypt the payload using ECDH and AES-GCM (simplified ECE)
async function encryptPayload(
  payload: string,
  p256dhKey: string,
  authSecret: string
): Promise<{ encrypted: Uint8Array; salt: Uint8Array; localPublicKey: Uint8Array }> {
  // Generate local key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );

  // Export local public key
  const localPublicKeyRaw = await crypto.subtle.exportKey("raw", localKeyPair.publicKey);
  const localPublicKey = new Uint8Array(localPublicKeyRaw);

  // Import subscriber's public key
  const subscriberPublicKeyBytes = base64UrlDecode(p256dhKey);
  const subscriberPublicKey = await crypto.subtle.importKey(
    "raw",
    subscriberPublicKeyBytes.buffer as ArrayBuffer,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // Derive shared secret
  const sharedSecretBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: subscriberPublicKey },
    localKeyPair.privateKey,
    256
  );
  const sharedSecret = new Uint8Array(sharedSecretBits);

  // Auth secret
  const authSecretBytes = base64UrlDecode(authSecret);

  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Derive encryption key using HKDF
  const authInfo = new TextEncoder().encode("Content-Encoding: auth\0");
  const keyInfo = new TextEncoder().encode("Content-Encoding: aes128gcm\0");

  // Import shared secret as key material
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    sharedSecret,
    { name: "HKDF" },
    false,
    ["deriveBits", "deriveKey"]
  );

  // Derive PRK
  const prk = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: authSecretBytes.buffer as ArrayBuffer,
      info: authInfo,
    },
    keyMaterial,
    256
  );

  // Derive content encryption key
  const prkKey = await crypto.subtle.importKey(
    "raw",
    prk,
    { name: "HKDF" },
    false,
    ["deriveBits", "deriveKey"]
  );

  const cek = await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: salt,
      info: keyInfo,
    },
    prkKey,
    { name: "AES-GCM", length: 128 },
    false,
    ["encrypt"]
  );

  // Derive nonce
  const nonceInfo = new TextEncoder().encode("Content-Encoding: nonce\0");
  const nonceBits = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: salt,
      info: nonceInfo,
    },
    prkKey,
    96
  );
  const nonce = new Uint8Array(nonceBits);

  // Pad and encrypt payload
  const payloadBytes = new TextEncoder().encode(payload);
  const paddedPayload = new Uint8Array(payloadBytes.length + 2);
  paddedPayload.set(payloadBytes);
  paddedPayload[payloadBytes.length] = 2; // Delimiter
  paddedPayload[payloadBytes.length + 1] = 0; // Padding

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce },
    cek,
    paddedPayload
  );

  return {
    encrypted: new Uint8Array(encrypted),
    salt,
    localPublicKey,
  };
}

// Build the aes128gcm encrypted body
function buildEncryptedBody(
  encrypted: Uint8Array,
  salt: Uint8Array,
  localPublicKey: Uint8Array
): Uint8Array {
  // aes128gcm format: salt (16) + rs (4) + idlen (1) + keyid (65) + ciphertext
  const rs = 4096;
  const body = new Uint8Array(16 + 4 + 1 + localPublicKey.length + encrypted.length);
  
  let offset = 0;
  body.set(salt, offset);
  offset += 16;
  
  // Record size (4 bytes, big endian)
  body[offset++] = (rs >> 24) & 0xff;
  body[offset++] = (rs >> 16) & 0xff;
  body[offset++] = (rs >> 8) & 0xff;
  body[offset++] = rs & 0xff;
  
  // Key ID length
  body[offset++] = localPublicKey.length;
  
  // Key ID (local public key)
  body.set(localPublicKey, offset);
  offset += localPublicKey.length;
  
  // Ciphertext
  body.set(encrypted, offset);
  
  return body;
}

// Send push notification to a single subscription
async function sendPushNotification(
  subscription: PushSubscription,
  payload: PushPayload
): Promise<{ success: boolean; error?: string; shouldRemove?: boolean }> {
  try {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.error("[Push] VAPID keys not configured");
      return { success: false, error: "VAPID keys not configured" };
    }

    console.log(`[Push] Sending to endpoint: ${subscription.endpoint.substring(0, 60)}...`);

    // Create VAPID JWT
    const vapidJwt = await createVapidJwt(subscription.endpoint);

    // Encrypt payload
    const payloadString = JSON.stringify(payload);
    const { encrypted, salt, localPublicKey } = await encryptPayload(
      payloadString,
      subscription.p256dh,
      subscription.auth
    );

    // Build encrypted body
    const body = buildEncryptedBody(encrypted, salt, localPublicKey);

    // Send request to push service
    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "aes128gcm",
        "Content-Length": body.length.toString(),
        "Authorization": `vapid t=${vapidJwt}, k=${VAPID_PUBLIC_KEY}`,
        "TTL": "86400", // 24 hours
        "Urgency": "normal",
      },
      body: body.buffer as ArrayBuffer,
    });

    console.log(`[Push] Response status: ${response.status}`);

    if (response.status === 201 || response.status === 200) {
      console.log("[Push] Successfully sent");
      return { success: true };
    } else if (response.status === 404 || response.status === 410) {
      // Subscription expired or unsubscribed
      console.log("[Push] Subscription expired, should remove");
      return { success: false, error: "Subscription expired", shouldRemove: true };
    } else {
      const errorText = await response.text();
      console.error(`[Push] Failed with status ${response.status}: ${errorText}`);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }
  } catch (error) {
    console.error(`[Push] Error:`, error);
    return { success: false, error: String(error) };
  }
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Security: Require service role key for this function
    // This prevents unauthorized push notification sending
    const authHeader = req.headers.get("Authorization");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!authHeader || authHeader !== `Bearer ${serviceRoleKey}`) {
      console.error("[Push] Unauthorized request - missing or invalid service role key");
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { user_id, payload, endpoints } = await req.json();

    console.log(`[Push] Request received - user_id: ${user_id || "all"}, endpoints: ${endpoints?.length || "all"}`);
    console.log(`[Push] VAPID configured: ${!!VAPID_PUBLIC_KEY && !!VAPID_PRIVATE_KEY}`);

    // Get target subscriptions
    let query = supabase.from("push_subscriptions").select("*");
    
    if (user_id) {
      query = query.eq("user_id", user_id);
    }
    
    if (endpoints && endpoints.length > 0) {
      query = query.in("endpoint", endpoints);
    }

    const { data: subscriptions, error: fetchError } = await query;

    if (fetchError) {
      console.error("[Push] Failed to fetch subscriptions:", fetchError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch subscriptions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("[Push] No subscriptions found");
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: "No subscriptions to send to" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Push] Found ${subscriptions.length} subscription(s)`);

    // Send to all subscriptions
    const results = await Promise.all(
      subscriptions.map((sub) => sendPushNotification(sub, payload))
    );

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success);

    // Remove expired subscriptions
    const expiredSubs = subscriptions.filter((_, i) => results[i].shouldRemove);
    if (expiredSubs.length > 0) {
      console.log(`[Push] Removing ${expiredSubs.length} expired subscription(s)`);
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("id", expiredSubs.map((s) => s.id));
    }

    // Log delivery
    for (let i = 0; i < subscriptions.length; i++) {
      const sub = subscriptions[i];
      const result = results[i];
      
      await supabase.from("notification_delivery_log").insert({
        user_id: sub.user_id,
        notification_type: payload.type || "manual",
        scheduled_for: new Date().toISOString(),
        sent_at: result.success ? new Date().toISOString() : null,
        status: result.success ? "sent" : "failed",
        error: result.error || null,
      });
    }

    console.log(`[Push] Completed - ${successful} sent, ${failed.length} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: successful,
        failed: failed.length,
        errors: failed.map((f) => f.error),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Push] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
