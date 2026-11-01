import { useSyncExternalStore } from 'react'
import { subscribe, getState } from './store.js'

// Re-render any component when the store changes.
export function useStore() {
  return useSyncExternalStore(subscribe, getState, getState)
}
