import { useEffect, useRef, useState } from 'react'
import type { AgentInfo, ChatSession } from './types'
import { api, reportError } from './client'
import { chatActivityLabel } from './chatActivity'
import { Icon } from './Icons'
import SessionLogo from './SessionLogo'
import { groupedChats, tabColors, type TabGroup } from './chatOrder'

type Drag = { id: string; pinned: boolean; startX: number; startY: number; moving: boolean }
type Drop = { id: string; position: 'before' | 'after' } | { group: string }
type Menu = { kind: 'tab'; item: ChatSession; x: number; y: number } | { kind: 'group'; group: TabGroup; x: number; y: number }

function Swatches({ label, value, onChange }: { label: string; value: string | null; onChange: (value: string | null) => void }) {
  return <div className="swatches" role="group" aria-label={label}>
    <button type="button" className={`tab-color-swatch no-color ${!value ? 'selected' : ''}`} aria-label={`No ${label.toLowerCase()}`} aria-pressed={!value} title={label === 'Group color' ? 'Automatic' : 'No color'} onClick={() => onChange(null)} />
    {tabColors.map(color => <button key={color.value} type="button" className={`tab-color-swatch ${value === color.value ? 'selected' : ''}`} style={{ '--swatch': color.value } as React.CSSProperties} aria-label={`${color.name} ${label.toLowerCase()}`} aria-pressed={value === color.value} title={color.name} onClick={() => onChange(color.value)} />)}
  </div>
}

export default function ChatTabs({ items, selectedId, agents, groups, collapsed, groupColors, choose, close, toggleGroup, collapseOthers, setGroupColor }: {
  items: ChatSession[]; selectedId?: string; agents: AgentInfo[]; groups: string[]; collapsed: string[]; groupColors: Record<string, string>
  choose: (id: string) => void; close: (id: string) => void; toggleGroup: (name: string) => void; collapseOthers: (name: string) => void; setGroupColor: (name: string, value: string | null) => void
}) {
  const gesture = useRef<Drag | null>(null)
  const drop = useRef<Drop | null>(null)
  const suppressClick = useRef(false)
  const [dragging, setDragging] = useState<{ id: string; x: number; y: number } | null>(null)
  const [target, setTarget] = useState<Drop | null>(null)
  const [menu, setMenu] = useState<Menu | null>(null)
  const [draft, setDraft] = useState('')
  const [rename, setRename] = useState<string | null>(null)
  const clear = () => { gesture.current = null; drop.current = null; setDragging(null); setTarget(null) }
  const clearRef = useRef(clear)
  useEffect(() => { clearRef.current = clear })
  useEffect(() => {
    const cancel = (event: KeyboardEvent) => { if (event.key === 'Escape') clearRef.current() }
    window.addEventListener('keydown', cancel)
    return () => window.removeEventListener('keydown', cancel)
  }, [])
  useEffect(() => {
    if (!menu) return
    const dismiss = (event: Event) => { if (event.type === 'resize' || !(event.target as HTMLElement | null)?.closest?.('.tab-menu')) setMenu(null) }
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenu(null) }
    window.addEventListener('pointerdown', dismiss)
    window.addEventListener('keydown', escape)
    window.addEventListener('resize', dismiss)
    return () => { window.removeEventListener('pointerdown', dismiss); window.removeEventListener('keydown', escape); window.removeEventListener('resize', dismiss) }
  }, [menu])
  const grouped = groupedChats(items, groupColors)
  const openMenu = (event: React.MouseEvent, value: Menu) => { event.preventDefault(); event.stopPropagation(); setDraft(''); setRename(null); setMenu(value) }
  const patch = (id: string, data: object) => { setMenu(null); api(`/sessions/${id}`, data, 'PATCH').catch(reportError) }
  const ungroup = (group: TabGroup) => { setMenu(null); Promise.all(group.items.map(item => api(`/sessions/${item.id}`, { group: null }, 'PATCH'))).catch(reportError) }
  function begin(event: React.PointerEvent<HTMLButtonElement>, item: ChatSession) {
    if (event.button !== 0) return
    suppressClick.current = false
    gesture.current = { id: item.id, pinned: item.pinned, startX: event.clientX, startY: event.clientY, moving: false }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  function move(event: React.PointerEvent<HTMLButtonElement>) {
    const current = gesture.current
    if (!current) return
    if (!current.moving && Math.hypot(event.clientX - current.startX, event.clientY - current.startY) < 6) return
    current.moving = true; suppressClick.current = true
    setDragging({ id: current.id, x: event.clientX, y: event.clientY })
    const point = document.elementFromPoint(event.clientX, event.clientY)
    const element = point?.closest<HTMLElement>('[data-chat-tab]')
    const item = items.find(item => item.id === element?.dataset.chatTab)
    let next: Drop | null = null
    if (element && item && item.id !== current.id && item.pinned === current.pinned) {
      const rect = element.getBoundingClientRect()
      next = { id: item.id, position: event.clientX >= rect.left + rect.width / 2 ? 'after' : 'before' }
    } else {
      // A group header, or a collapsed group, accepts the tab as its newest member.
      const name = point?.closest<HTMLElement>('[data-chat-group]')?.dataset.chatGroup
      const group = name ? grouped.find(group => group.name === name && group.pinned === current.pinned) : undefined
      if (group && !group.items.some(item => item.id === current.id)) next = { group: group.name! }
    }
    drop.current = next; setTarget(next)
  }
  function finish() {
    const current = gesture.current, destination = drop.current
    clear()
    if (!current?.moving || !destination) return
    if ('group' in destination) api(`/sessions/${current.id}`, { group: destination.group }, 'PATCH').catch(reportError)
    else api(`/sessions/${current.id}/reorder`, { targetId: destination.id, position: destination.position }).catch(reportError)
  }
  const dragged = items.find(item => item.id === dragging?.id)
  const renderTab = (item: ChatSession) => <div key={item.id} data-chat-tab={item.id} className={`chat-tab ${selectedId === item.id ? 'selected' : ''} ${item.tabColor ? 'has-color' : ''} ${dragging?.id === item.id ? 'dragging' : ''} ${target && 'id' in target && target.id === item.id ? `drop-${target.position}` : ''}`} style={{ '--tab-accent': item.tabColor || '#dfa3b8' } as React.CSSProperties} onContextMenu={event => openMenu(event, { kind: 'tab', item, x: event.clientX, y: event.clientY })}>
    <button role="tab" aria-selected={selectedId === item.id} onClick={event => { if (!suppressClick.current || event.detail === 0) choose(item.id) }} onPointerDown={event => begin(event, item)} onPointerMove={move} onPointerUp={finish} onPointerCancel={clear} onLostPointerCapture={clear}
      className="chat-tab-select" aria-label={`${item.name} · ${chatActivityLabel(item)}`} title={`${agents.find(a => a.id === item.agent)?.label} · ${item.name}${item.group ? ` · ${item.group}` : ''}\n${chatActivityLabel(item)}\nDrag to reorder ${item.pinned ? 'pinned' : 'unpinned'} tabs · right-click for options\n${item.cwd}`}>
      <span style={{ color: agents.find(a => a.id === item.agent)?.color }}><SessionLogo session={item} /></span><span className="chat-tab-name">{item.name}</span>{item.pinned && <span className="tab-pinned" title="Pinned in History"><Icon name="pin" size={11} /></span>}
    </button>
    <button className="chat-tab-close" onClick={() => close(item.id)} aria-label={`Close ${item.name}`} title="Close tab · keep in History"><Icon name="close" size={12} /></button>
  </div>
  return <div className={`chat-tabs ${dragging ? 'is-reordering' : ''}`} role="tablist" aria-label="Agent chats">
    {grouped.map(group => {
      if (!group.name) return group.items.map(renderTab)
      const folded = collapsed.includes(group.name)
      return <div key={`group:${group.pinned}:${group.name}`} data-chat-group={group.name} className={`chat-tab-group ${folded ? 'collapsed' : ''} ${group.working ? 'working' : ''} ${target && 'group' in target && target.group === group.name ? 'drop-into' : ''}`} style={{ '--tab-accent': group.color } as React.CSSProperties}>
        <button type="button" className="chat-group-chip" aria-expanded={!folded} aria-label={`${group.name} group · ${group.items.length} tabs${group.unread ? ' · unread result' : ''}`} title={`${group.name} · ${group.items.length} tabs\nClick to ${folded ? 'expand' : 'collapse'} · right-click for color and options · drop a tab here to add it`} onClick={() => toggleGroup(group.name!)} onContextMenu={event => openMenu(event, { kind: 'group', group, x: event.clientX, y: event.clientY })}>
          <span className="chip-caret" aria-hidden="true">{folded ? '▸' : '▾'}</span><span className="chip-name">{group.name}</span><small>{group.items.length}</small>{group.unread && <i className="chip-unread" title="Unread result" />}{group.working && <i className="chip-working" title="Working" />}
        </button>
        {group.items.filter(item => !folded || item.id === selectedId).map(renderTab)}
      </div>
    })}
    {dragging && dragged && <div className="chat-tab-ghost" style={{ left: dragging.x + 13, top: dragging.y + 13, color: dragged.tabColor || '#d8c9da' }} aria-hidden="true"><SessionLogo session={dragged} /><span>{dragged.name}</span>{dragged.pinned && <Icon name="pin" size={12} />}</div>}
    {menu && <div className="tab-menu" role="menu" style={{ left: Math.max(4, Math.min(menu.x, window.innerWidth - 260)), top: Math.max(4, Math.min(menu.y, window.innerHeight - (menu.kind === 'tab' ? 470 : 250))) }}>
      {menu.kind === 'tab' ? <>
        <strong>{menu.item.name}</strong>
        {rename === null ? <button type="button" role="menuitem" onClick={() => setRename(menu.item.name)}>Rename chat</button> : <form className="tab-menu-rename" onSubmit={event => { event.preventDefault(); if (rename.trim()) patch(menu.item.id, { name: rename.trim() }) }}><input autoFocus value={rename} maxLength={100} aria-label="English chat name" onChange={event => setRename(event.target.value)} /><button type="submit">Save</button></form>}
        <button type="button" role="menuitem" onClick={() => patch(menu.item.id, { pinned: !menu.item.pinned })}>{menu.item.pinned ? 'Unpin from History' : 'Pin in History'}</button>
        <span>Tab color</span>
        <Swatches label="Tab color" value={menu.item.tabColor} onChange={value => patch(menu.item.id, { tabColor: value })} />
        <span>{menu.item.group ? 'Move to group' : 'Add to group'}</span>
        {groups.filter(name => name !== menu.item.group).map(name => <button key={name} type="button" role="menuitem" onClick={() => patch(menu.item.id, { group: name })}>{name}</button>)}
        <form onSubmit={event => { event.preventDefault(); if (draft.trim()) patch(menu.item.id, { group: draft.trim() }) }}><input placeholder="New group…" aria-label="New group name" value={draft} maxLength={60} onChange={event => setDraft(event.target.value)} /><button type="submit" disabled={!draft.trim()}>Add</button></form>
        {menu.item.group && <button type="button" role="menuitem" onClick={() => patch(menu.item.id, { group: null })}>Remove from {menu.item.group}</button>}
        <hr />
        <button type="button" role="menuitem" onClick={() => { setMenu(null); api('/reveal', { path: menu.item.cwd }).catch(reportError) }}>Show working folder</button>
        <button type="button" role="menuitem" title="Clear visible scrollback; keep the agent conversation" onClick={() => { setMenu(null); api(`/sessions/${menu.item.id}/clear`, {}).catch(reportError) }}>Clear terminal scrollback</button>
        <hr />
        <button type="button" role="menuitem" onClick={() => { setMenu(null); close(menu.item.id) }}>Close tab · keep in History</button>
      </> : <>
        <strong>{menu.group.name}</strong>
        <button type="button" role="menuitem" onClick={() => { setMenu(null); toggleGroup(menu.group.name!) }}>{collapsed.includes(menu.group.name!) ? 'Expand group' : 'Collapse group'}</button>
        <button type="button" role="menuitem" onClick={() => { setMenu(null); collapseOthers(menu.group.name!) }}>Collapse other groups</button>
        <span>Group color</span>
        <Swatches label="Group color" value={groupColors[menu.group.name!] || null} onChange={value => { setMenu(null); setGroupColor(menu.group.name!, value) }} />
        <hr />
        <button type="button" role="menuitem" onClick={() => ungroup(menu.group)}>Ungroup {menu.group.items.length} {menu.group.items.length === 1 ? 'tab' : 'tabs'}</button>
      </>}
    </div>}
  </div>
}
