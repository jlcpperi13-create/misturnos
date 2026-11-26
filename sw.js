const CACHE='misturnos-v1';
const FILES=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
// Red primero (para recibir actualizaciones), caché si no hay conexión
// ================================================================
// MisTurnos — recibir CSV desde el menú "Compartir" de Android
// Pega esto en tu sw.js ANTES de cualquier otro
// self.addEventListener('fetch', ...) que ya tengas.
// ================================================================

const CACHE_COMPARTIDOS = 'misturnos-compartidos';

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method === 'POST' && url.pathname.endsWith('/compartir')) {
    // Que ningún otro listener de fetch toque esta petición
    event.stopImmediatePropagation();

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
});

// ⚠️ IMPORTANTE: si en tu evento 'activate' borras las cachés antiguas,
// excluye 'misturnos-compartidos' para no borrar los archivos recibidos.
// Ejemplo:
//   keys.filter(k => k !== CACHE_ACTUAL && k !== CACHE_COMPARTIDOS)
//       .map(k => caches.delete(k))

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))));
});
