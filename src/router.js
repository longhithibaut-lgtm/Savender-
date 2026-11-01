import { useSyncExternalStore } from 'react'

// Minimal hash-based router. Routes look like "#/", "#/book/<id>",
// "#/bookings", "#/redeem", "#/admin".
function currentHash() {
  return window.location.hash.replace(/^#/, '') || '/'
}

function subscribe(cb) {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

export function useRoute() {
  const path = useSyncExternalStore(subscribe, currentHash, currentHash)
  const parts = path.split('/').filter(Boolean)
  return { path, parts }
}

export function navigate(to) {
  window.location.hash = to
}
