import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const VAPID_PUBLIC_KEY = 'BCInmnJAyqh14yN_povOfWlqOFgsO7D1aZog9MFjo7G1gAFvXtAQq84y_Am5HgaC_tO9P8UYagVqRcXsoBC2FEA';

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

export function usePushNotifications(usuarioId?: string) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isInIframe = (() => {
    try { return window.self !== window.top; } catch { return true; }
  })();

  const isPreviewHost =
    window.location.hostname.includes('id-preview--') ||
    window.location.hostname.includes('lovableproject.com');

  const isSupported = 'serviceWorker' in navigator && 'PushManager' in window && !isInIframe && !isPreviewHost;

  useEffect(() => {
    if (!isSupported) return;
    setPermission(Notification.permission);
    checkSubscription();
  }, []);

  async function checkSubscription() {
    if (!isSupported) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    } catch {
      // ignore
    }
  }

  async function subscribe() {
    if (!isSupported) {
      toast.error('Notificações push não são suportadas neste navegador/contexto.');
      return;
    }

    setIsLoading(true);
    try {
      // Register SW
      await navigator.serviceWorker.register('/sw.js');
      const reg = await navigator.serviceWorker.ready;

      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== 'granted') {
        toast.error('Permissão de notificação negada.');
        setIsLoading(false);
        return;
      }

      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      });

      const subJson = sub.toJSON();

      // Save to database
      await supabase.from('push_subscriptions').upsert(
        {
          endpoint: subJson.endpoint!,
          p256dh: subJson.keys!.p256dh!,
          auth: subJson.keys!.auth!,
          usuario_id: usuarioId || null,
        },
        { onConflict: 'endpoint' }
      );

      setIsSubscribed(true);
      toast.success('Notificações push ativadas! 🔔');
    } catch (error) {
      console.error('Push subscription error:', error);
      toast.error('Erro ao ativar notificações.');
    } finally {
      setIsLoading(false);
    }
  }

  async function unsubscribe() {
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', sub.endpoint);
      }
      setIsSubscribed(false);
      toast.success('Notificações desativadas.');
    } catch (error) {
      console.error('Unsubscribe error:', error);
      toast.error('Erro ao desativar notificações.');
    } finally {
      setIsLoading(false);
    }
  }

  return {
    permission,
    isSubscribed,
    isLoading,
    isSupported,
    subscribe,
    unsubscribe,
  };
}
