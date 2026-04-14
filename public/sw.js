// Quest Board Service Worker
// Minimal SW for PWA installability — no offline caching for MVP

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  // Pass through all requests to network
  return
})
