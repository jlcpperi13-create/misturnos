// ================================================================
// sw.js — Service worker de MisTurnos
// Sirve para recibir los CSV desde el menú "Compartir" de Android.
// Este archivo va en la MISMA carpeta que index.html y manifest.json.
// ================================================================

const VERSION = 'misturnos-v1';          // súbelo (v2, v3...) cada vez que cambies este archivo
const CACHE_COMPARTIDOS = 'misturnos-compartidos';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Llega un archivo desde "Compartir → MisTurnos"
  if (event.request.method === 'POST' && url.pathname.endsWith('/compartir')) {
    event.respondWith((async () => {
      try {
        const datos = await event.request.formData();
        const archivos = datos.getAll('csv');
        const cache = await caches.open(CACHE_COMPARTIDOS);
        let i = 0;
        for (const f of archivos) {
          if (!f || typeof f === 'string') continue;
          const clave = new URL(`compartido-${Date.now()}-${i++}`, self.registration.scope).href;
          await cache.put(clave, new Response(f, {
            headers: { 'X-Nombre': encodeURIComponent(f.name || 'turno.csv') }
          }));
        }
      } catch (e) {
        // Si algo falla, abrimos la app igualmente
      }
      const destino = new URL('./?compartido=1', self.registration.scope).href;
      return Response.redirect(destino, 303);
    })());
  }
  // Todo lo demás pasa normal, sin tocarlo.
});
