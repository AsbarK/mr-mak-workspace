import { useSyncExternalStore } from 'react'

export type MobileView = 'list' | 'chat' | 'results'
interface Navigation { view: MobileView; history: boolean }
export interface ChatPosition { mode?: 'messages' | 'terminal'; top?: number; follow?: boolean }
const navigationKey = 'mrmak.mobile.navigation'
function read(key: string): unknown { try { return JSON.parse(localStorage.getItem(key) || 'null') } catch { return null } }
function save(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* Keep in-memory navigation when storage is unavailable. */ } }
function initialNavigation(): Navigation {
  const value = read(navigationKey) as Partial<Navigation> | null
  if (value && ['list', 'chat', 'results'].includes(value.view || '') && typeof value.history === 'boolean') return { view: value.view!, history: value.history }
  return { view: localStorage.getItem('mrmak.mobile.selected') ? 'chat' : 'list', history: false }
}
let navigation = initialNavigation()
const listeners = new Set<() => void>()
function update(value: Partial<Navigation>) { navigation = { ...navigation, ...value }; save(navigationKey, navigation); listeners.forEach(listener => listener()) }
export function useMobileNavigation() { return useSyncExternalStore(listener => { listeners.add(listener); return () => { listeners.delete(listener) } }, () => navigation) }
export function setMobileView(view: MobileView) { update({ view }) }
export function setMobileHistory(history: boolean) { update({ history }) }
export function resetMobileNavigation() { navigation = { view: 'list', history: false }; listeners.forEach(listener => listener()) }
export function mobileChatPosition(id: string): ChatPosition {
  const value = read(`mrmak.mobile.position.${id}`) as ChatPosition | null
  if (!value || typeof value !== 'object') return {}
  return { mode: value.mode === 'terminal' || value.mode === 'messages' ? value.mode : undefined, top: Number.isFinite(value.top) && value.top! >= 0 ? value.top : undefined, follow: typeof value.follow === 'boolean' ? value.follow : undefined }
}
export function saveMobileChatPosition(id: string, value: ChatPosition) { save(`mrmak.mobile.position.${id}`, { ...mobileChatPosition(id), ...value }) }
