// Bruno Cake PWA Service Worker
const CACHE_NAME = 'bruno-cakes-v1';
const CACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/assets/index-BCPJtEbs.js',
  '/assets/index-CPnmURed.css'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('Bruno Cake Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Bruno Cake Service Worker: Caching assets');
        return cache.addAll(CACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch(err => console.log('Bruno Cake Service Worker: Cache failed', err))
  );
  // Força update automático do SW
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Bruno Cake Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Bruno Cake Service Worker: Clearing old cache');
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
  // Força update automático do SW
  self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip API requests
  if (event.request.url.includes('/api/')) return;
  
  // Skip ALL development files and Vite resources
  if (event.request.url.includes('/src/') || 
      event.request.url.includes('?v=') ||
      event.request.url.includes('?t=') ||
      event.request.url.includes('@vite') ||
      event.request.url.includes('__vite') ||
      event.request.url.includes('node_modules') ||
      event.request.url.includes('.vite') ||
      event.request.url.includes('hot') ||
      event.request.url.includes('hmr')) {
    // Just fetch without caching for development resources
    event.respondWith(fetch(event.request));
    return;
  }
      
  //console.log('SW: Handling request for:', event.request.url);
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se for JS ou CSS e não encontrar, retorna mensagem amigável
        if (!response && (event.request.destination === 'script' || event.request.destination === 'style')) {
          return new Response('O sistema foi atualizado! Por favor, recarregue a página.', {
            status: 503,
            statusText: 'Atualização necessária',
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        }
        // Para documentos (HTML), retorna index.html como fallback
        if (!response && event.request.destination === 'document') {
          return caches.match('/');
        }
        // Para outros casos, retorna cache ou busca na rede
        return response || fetch(event.request);
      })
      .catch(err => {
        console.log('SW: Fetch failed for:', event.request.url, err);
        // Se for JS ou CSS, retorna mensagem amigável
        if (event.request.destination === 'script' || event.request.destination === 'style') {
          return new Response('O sistema foi atualizado! Por favor, recarregue a página.', {
            status: 503,
            statusText: 'Atualização necessária',
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        }
        // Para documentos (HTML), retorna index.html como fallback
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      })
  );
});

// Background sync for offline orders (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Bruno Cake Service Worker: Background sync triggered');
  }
});

// Push notifications (future enhancement)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação do Bruno Cake',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('Bruno Cake', options)
  );
});

console.log('Bruno Cake Service Worker loaded successfully! 🍰');