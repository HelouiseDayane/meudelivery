// Teste para verificar se o PWA está funcionando corretamente
// Execute este código no console do navegador (F12)

console.log('🍰 === TESTE PWA BRUNO CAKES ===');

// 1. Verificar se o Service Worker está registrado
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log('📱 Service Workers registrados:', registrations.length);
    registrations.forEach((registration, index) => {
      console.log(`SW ${index + 1}:`, registration.scope);
      console.log('Estado:', registration.active ? 'Ativo' : 'Inativo');
    });
  });
} else {
  console.log('❌ Service Worker não suportado neste navegador');
}

// 2. Verificar se o Manifest está carregado
fetch('/src/public/manifest.json')
  .then(response => response.json())
  .then(manifest => {
    console.log('📋 Manifest carregado:', manifest.name);
    console.log('Ícones:', manifest.icons?.length || 0);
  })
  .catch(error => {
    console.log('❌ Erro ao carregar manifest:', error);
  });

// 3. Verificar se pode ser instalado
if ('BeforeInstallPromptEvent' in window || 'onbeforeinstallprompt' in window) {
  console.log('✅ Suporte a instalação PWA detectado');
} else {
  console.log('⚠️ Instalação PWA pode não estar disponível');
}

// 4. Verificar se já está instalado
const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
const isInWebAppChrome = window.navigator.standalone === true;
if (isInStandaloneMode || isInWebAppChrome) {
  console.log('✅ PWA já está instalado e rodando em modo standalone');
} else {
  console.log('📱 PWA rodando no navegador (não instalado)');
}

// 5. Verificar se é dispositivo móvel
const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent);
console.log('📱 Dispositivo móvel:', isMobile ? 'Sim' : 'Não');

// 6. Verificar HTTPS (necessário para PWA)
console.log('🔒 HTTPS:', location.protocol === 'https:' ? 'Sim' : 'Não (necessário em produção)');

console.log('🍰 === FIM DO TESTE ===');