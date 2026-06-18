import { Bell, BellOff, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Props {
  usuarioId?: string;
}

export function PushNotificationButton({ usuarioId }: Props) {
  const { isSubscribed, isLoading, isSupported, subscribe, unsubscribe } =
    usePushNotifications(usuarioId);

  if (!isSupported) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={isSubscribed ? unsubscribe : subscribe}
          disabled={isLoading}
          className="relative"
        >
          {isSubscribed ? (
            <BellRing className="h-5 w-5 text-accent" />
          ) : (
            <Bell className="h-5 w-5 text-muted-foreground" />
          )}
          {isSubscribed && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-accent" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {isSubscribed ? 'Desativar notificações' : 'Ativar notificações push'}
      </TooltipContent>
    </Tooltip>
  );
}
