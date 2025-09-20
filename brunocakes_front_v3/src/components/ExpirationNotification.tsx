import React, { useEffect } from 'react';import React, { useEffect } from 'react';

import { toast } from 'sonner';import { toast } from 'sonner';

import { Alert, AlertDescription } from './ui/alert';import { Alert, AlertDescription } from './ui/alert';

import { Button } from './ui/button';import { Button } from './ui/button';

import { Clock, AlertTriangle, X } from 'lucide-react';import { Clock, AlertTriangle, X } from 'lucide-react';



interface ExpirationNotificationProps {interface ExpirationNotificationProps {

  timeRemaining: number;  timeRemaining: number;

  type: 'cart' | 'checkout';  type: 'cart' | 'checkout';

  onExtendTime?: () => void;  onExtendTime?: () => void;

  onDismiss?: () => void;  onDismiss?: () => void;

  isVisible: boolean;  isVisible: boolean;

  className?: string;  className?: string;

}}



export const ExpirationNotification: React.FC<ExpirationNotificationProps> = ({export const ExpirationNotification: React.FC<ExpirationNotificationProps> = ({

  timeRemaining,  timeRemaining,

  type,  type,

  onExtendTime,  onExtendTime,

  onDismiss,  onDismiss,

  isVisible,  isVisible,

  className = ''  className = ''

}) => {}) => {

  const formatTime = (ms: number) => {  const formatTime = (ms: number) => {

    const minutes = Math.floor(ms / (1000 * 60));    const minutes = Math.floor(ms / (1000 * 60));

    const seconds = Math.floor((ms % (1000 * 60)) / 1000);    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  };  };



  const isWarning = timeRemaining <= 2 * 60 * 1000; // 2 minutos  const isWarning = timeRemaining <= 2 * 60 * 1000; // 2 minutos

  const isCritical = timeRemaining <= 30 * 1000; // 30 segundos  const isCritical = timeRemaining <= 30 * 1000; // 30 segundos

  const isExpired = timeRemaining <= 0;  const isExpired = timeRemaining <= 0;



  useEffect(() => {  useEffect(() => {

    if (!isVisible || isExpired) return;    if (!isVisible || isExpired) return;



    // Notificações automáticas baseadas no tempo restante    // Notificações automáticas baseadas no tempo restante

    if (isCritical && timeRemaining > 0) {    if (isCritical && timeRemaining > 0) {

      toast.error(      toast.error(

        `🚨 Seu ${type === 'cart' ? 'carrinho' : 'checkout'} expira em ${formatTime(timeRemaining)}!`,        `🚨 Seu ${type === 'cart' ? 'carrinho' : 'checkout'} expira em ${formatTime(timeRemaining)}!`,

        {        {

          duration: 5000,          duration: 5000,

          action: onExtendTime ? {          action: onExtendTime ? {

            label: 'Estender tempo',            label: 'Estender tempo',

            onClick: onExtendTime            onClick: onExtendTime

          } : undefined,          } : undefined,

        }        }

      );      );

    } else if (isWarning && !isCritical) {    } else if (isWarning && !isCritical) {

      toast.warning(      toast.warning(

        `⚠️ Seu ${type === 'cart' ? 'carrinho' : 'checkout'} expira em ${formatTime(timeRemaining)}`,        `⚠️ Seu ${type === 'cart' ? 'carrinho' : 'checkout'} expira em ${formatTime(timeRemaining)}`,

        {        {

          duration: 4000,          duration: 4000,

          action: onExtendTime ? {          action: onExtendTime ? {

            label: 'Estender',            label: 'Estender',

            onClick: onExtendTime            onClick: onExtendTime

          } : undefined,          } : undefined,

        }        }

      );      );

    }    }

  }, [isCritical, isWarning, timeRemaining, type, onExtendTime, isVisible, isExpired]);  }, [isCritical, isWarning, timeRemaining, type, onExtendTime, isVisible, isExpired]);



  if (!isVisible || isExpired) return null;  if (!isVisible || isExpired) return null;



  return (  return (

    <Alert    <Alert

      className={`border-2 ${      className={`border-2 ${

        isCritical        isCritical

          ? 'border-red-500 bg-red-50'          ? 'border-red-500 bg-red-50'

          : isWarning          : isWarning

          ? 'border-yellow-500 bg-yellow-50'          ? 'border-yellow-500 bg-yellow-50'

          : 'border-blue-500 bg-blue-50'          : 'border-blue-500 bg-blue-50'

      } ${className}`}      } ${className}`}

    >    >

      <div className="flex items-center gap-2">      <div className="flex items-center gap-2">

        {isCritical ? (        {isCritical ? (

          <AlertTriangle className="h-4 w-4 text-red-600" />          <AlertTriangle className="h-4 w-4 text-red-600" />

        ) : (        ) : (

          <Clock className="h-4 w-4 text-blue-600" />          <Clock className="h-4 w-4 text-blue-600" />

        )}        )}

                

        <AlertDescription className={`flex-1 font-medium ${        <AlertDescription className={`flex-1 font-medium ${

          isCritical ? 'text-red-800' :          isCritical ? 'text-red-800' :

          isWarning ? 'text-yellow-800' :          isWarning ? 'text-yellow-800' :

          'text-blue-800'          'text-blue-800'

        }`}>        }`}>

          {isCritical ? (          {isCritical ? (

            <>🚨 Seu {type === 'cart' ? 'carrinho' : 'checkout'} expira em {formatTime(timeRemaining)}! Complete agora.</>            <>🚨 Seu {type === 'cart' ? 'carrinho' : 'checkout'} expira em {formatTime(timeRemaining)}! Complete agora.</>

          ) : isWarning ? (          ) : isWarning ? (

            <>⚠️ Seu {type === 'cart' ? 'carrinho' : 'checkout'} expira em {formatTime(timeRemaining)}. Finalize logo!</>            <>⚠️ Seu {type === 'cart' ? 'carrinho' : 'checkout'} expira em {formatTime(timeRemaining)}. Finalize logo!</>

          ) : (          ) : (

            <>⏰ Tempo restante: {formatTime(timeRemaining)} (10 min total)</>            <>⏰ Tempo restante: {formatTime(timeRemaining)} (10 min total)</>

          )}          )}

        </AlertDescription>        </AlertDescription>



        <div className="flex items-center gap-2">        <div className="flex items-center gap-2">

          {onExtendTime && (          {onExtendTime && (

            <Button            <Button

              size="sm"              size="sm"

              variant="outline"              variant="outline"

              onClick={onExtendTime}              onClick={onExtendTime}

              className="h-8 px-3"              className="h-8 px-3"

            >            >

              +10min              +10min

            </Button>            </Button>

          )}          )}

          {onDismiss && (          {onDismiss && (

            <Button            <Button

              size="sm"              size="sm"

              variant="ghost"              variant="ghost"

              onClick={onDismiss}              onClick={onDismiss}

              className="h-8 w-8 p-0"              className="h-8 w-8 p-0"

            >            >

              <X className="h-4 w-4" />              <X className="h-4 w-4" />

            </Button>            </Button>

          )}          )}

        </div>        </div>

      </div>      </div>

    </Alert>    </Alert>

  );  );

};};

}) => {

export default ExpirationNotification;  const typeText = type === 'cart' ? 'carrinho' : 'checkout';

  if (isExpired) {
    return (
      <Alert className="border-red-500 bg-red-50 mb-4">
        <X className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-700">
          <div className="flex justify-between items-center">
            <span>
              <strong>Tempo esgotado!</strong> Os produtos do seu {typeText} não estão mais reservados.
              {type === 'cart' && ' Por favor, adicione-os novamente ao carrinho.'}
              {type === 'checkout' && ' Por favor, refaça o pedido.'}
            </span>
            {onExpired && (
              <button
                onClick={onExpired}
                className="ml-4 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                {type === 'cart' ? 'Limpar Carrinho' : 'Voltar ao Menu'}
              </button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (isCritical) {
    return (
      <Alert className="border-red-400 bg-red-50 mb-4">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-700">
          <strong>Atenção!</strong> Seu {typeText} expira em <strong>{timeLeft}</strong>. 
          Complete seu pedido rapidamente!
        </AlertDescription>
      </Alert>
    );
  }

  if (isWarning) {
    return (
      <Alert className="border-yellow-400 bg-yellow-50 mb-4">
        <Clock className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-700">
          <strong>Aviso:</strong> Seu {typeText} expira em <strong>{timeLeft}</strong>. 
          Os produtos serão liberados para outros clientes.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};