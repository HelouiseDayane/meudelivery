import React from 'react';
import { ExpirationNotification } from './components/ExpirationNotification';
import { useExpiration } from './hooks/useExpiration';

// Teste do sistema de expiração
function TestExpiration() {
  // Simular uma data de expiração em 30 segundos
  const expiresAt = new Date(Date.now() + 30 * 1000).toISOString();

  const {
    timeLeft,
    isExpired,
    formattedTime,
    isWarning,
    isCritical
  } = useExpiration({
    expiresAt,
    onExpired: () => {
      console.log('Produto expirado!');
    },
    onWarning: (minutesLeft) => {
      console.log(`Aviso: ${minutesLeft} minutos restantes`);
    }
  });

  return (
    <div style={{ padding: '20px' }}>
      <h1>Teste do Sistema de Expiração</h1>
      <div>
        <p><strong>Tempo restante:</strong> {formattedTime}</p>
        <p><strong>É aviso:</strong> {isWarning ? 'Sim' : 'Não'}</p>
        <p><strong>É crítico:</strong> {isCritical ? 'Sim' : 'Não'}</p>
        <p><strong>Expirou:</strong> {isExpired ? 'Sim' : 'Não'}</p>
      </div>

      <ExpirationNotification
        timeLeft={formattedTime}
        isWarning={isWarning}
        isCritical={isCritical}
        isExpired={isExpired}
        type="cart"
        onExpired={() => console.log('Botão de expiração clicado')}
      />
    </div>
  );
}

export default TestExpiration;