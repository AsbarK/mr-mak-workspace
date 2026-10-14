// Exercise tab groups in the real Chats window: header chips, collapse that
// survives a reload, the tab right-click menu, dropping a tab on a chip and the
// New chat group picker. Terminals are fakes; no user chats or logins are used.
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createService } from '../server.mjs';
import { launchBrowser } from './browser.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
await mkdir(path.join(root, '.cache'), { recursive: true });
const repo = await mkdtemp(path.join(root, '.cache/groups-ui-'));
const chats = [['g-0', 'Director', 'ThugLife'], ['g-1', 'Network', 'ThugLife'], ['g-2', 'Animator', null], ['g-3', 'Combat', 'Dungeon']].map(([id, name, group], tabOrder) => ({
  id, name, group, tabOrder, agent: 'codex', cwd: repo, nativeId: null, hasConversation: false, open: true, pinned: false, status: 'stopped', createdAt: '2026-10-14T08:00:00Z', updatedAt: `2026-10-14T08:0${tabOrder}:00Z`, cols: 80, rows: 24,
}));
await mkdir(path.join(repo, 'workspace'));
await writeFile(path.join(repo, 'workspace/workspace.json'), '{"entities":[]}');
await mkdir(path.join(repo, '.mrmak'));
await writeFile(path.join(repo, '.mrmak/sessions.json'), JSON.stringify(chats));
let service, browser;
try {
  service = await createService({ repo, uiDir: path.join(root, 'dist'), mcpOptions: { home: repo, env: {} } });
  service.sessions.launch = session => {
    session.status = 'running'; session.restoreError = null;
    let onExit;
    session.process = { resize() {}, write() {}, onExit(callback) { onExit = callback; return { dispose() {} }; }, kill() { session.process = null; session.status = 'stopped'; onExit?.(); } };
    service.sessions.changed(session);
  };
  browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 900, height: 600 } });
  page.setDefaultTimeout(8000);
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  const names = () => page.locator('.chat-tabs .chat-tab-name').allTextContents();
  const groupNames = group => page.locator(`.chat-tab-group[data-chat-group="${group}"] .chat-tab-name`).allTextContents();
  const chip = group => page.locator(`.chat-tab-group[data-chat-group="${group}"] .chat-group-chip`);
  const tab = name => page.locator('.chat-tab').filter({ hasText: name }).first();

  await page.goto(service.urls.chats);
  await page.locator('.chat-tab-group').nth(1).waitFor();
  assert.deepEqual(await names(), ['Director', 'Network', 'Animator', 'Combat']);
  assert.deepEqual(await page.locator('.chat-group-chip .chip-name').allTextContents(), ['ThugLife', 'Dungeon']);
  assert.deepEqual(await page.locator('.chat-group-chip small').allTextContents(), ['2', '1']);

  // Collapse hides every member except the selected one, and the choice survives a reload.
  await chip('ThugLife').click();
  await page.locator('.chat-tab-group.collapsed').waitFor();
  assert.deepEqual(await names(), ['Director', 'Animator', 'Combat']);
  await page.reload();
  await page.locator('.chat-tab-group.collapsed').waitFor();
  assert.deepEqual(await names(), ['Director', 'Animator', 'Combat']);
  await chip('ThugLife').click();
  await page.locator('.chat-tab-group.collapsed').waitFor({ state: 'detached' });
  assert.deepEqual(await names(), ['Director', 'Network', 'Animator', 'Combat']);

  // Right-click: move an ungrouped tab into an existing group, then into a new one, then ungroup from the chip.
  await tab('Animator').click({ button: 'right' });
  await page.locator('.tab-menu').waitFor();
  assert.deepEqual(await page.locator('.tab-menu [role=menuitem]').allTextContents(), ['Dungeon', 'ThugLife', 'Close tab · keep in History'], 'groups are offered most recently active first');
  await page.locator('.tab-menu [role=menuitem]', { hasText: 'Dungeon' }).click();
  await page.locator('.chat-tab-group[data-chat-group="Dungeon"] .chat-tab').nth(1).waitFor();
  assert.deepEqual(await groupNames('Dungeon'), ['Combat', 'Animator'], 'joining places the tab after the last member');
  assert.equal(service.sessions.get('g-2').group, 'Dungeon');
  await tab('Animator').click({ button: 'right' });
  await page.locator('.tab-menu input').fill('Research');
  await page.locator('.tab-menu input').press('Enter');
  await chip('Research').waitFor();
  assert.deepEqual(await groupNames('Research'), ['Animator']);
  assert.deepEqual(await names(), ['Director', 'Network', 'Combat', 'Animator']);
  await chip('Research').click({ button: 'right' });
  await page.locator('.tab-menu [role=menuitem]', { hasText: 'Ungroup 1 tab' }).click();
  await chip('Research').waitFor({ state: 'detached' });
  assert.equal(service.sessions.get('g-2').group, null);
  assert.equal(await page.locator('.chat-tab-group').count(), 2);

  // Drag a tab onto a group chip.
  const from = await tab('Animator').locator('.chat-tab-select').boundingBox();
  const to = await chip('ThugLife').boundingBox();
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  for (let step = 1; step <= 12; step++) await page.mouse.move(from.x + (to.x + to.width / 2 - from.x) * step / 12, from.y + (to.y + to.height / 2 - from.y) * step / 12);
  await page.locator('.chat-tab-group.drop-into').waitFor();
  await page.mouse.up();
  await page.locator('.chat-tab-group[data-chat-group="ThugLife"] .chat-tab').nth(2).waitFor();
  assert.deepEqual(await groupNames('ThugLife'), ['Director', 'Network', 'Animator']);

  // New chat offers the known groups and files the new tab under the chosen one.
  await page.getByRole('button', { name: 'New chat', exact: true }).click();
  const picker = page.locator('.desk-dialog select[aria-label="Group"]');
  assert.deepEqual(await picker.locator('option').allTextContents(), ['No group', 'Dungeon', 'ThugLife', 'New group…']);
  await page.locator('.desk-dialog input[placeholder*="Dream Game"]').fill('Producer');
  await picker.selectOption('ThugLife');
  await page.getByRole('button', { name: 'Open chat' }).click();
  await page.locator('.chat-tab-group[data-chat-group="ThugLife"] .chat-tab').filter({ hasText: 'Producer' }).waitFor();
  const created = service.sessions.list().find(item => item.name === 'Producer');
  assert.equal(created.group, 'ThugLife');
  assert.deepEqual(await groupNames('ThugLife'), ['Director', 'Network', 'Animator', 'Producer']);

  // The chat options menu carries the same picker and can clear the group.
  await page.getByRole('button', { name: 'Chat options' }).click();
  await page.locator('.chat-options select[aria-label="Group"]').selectOption('');
  await page.locator('.chat-tab-group[data-chat-group="ThugLife"] .chat-tab').filter({ hasText: 'Producer' }).waitFor({ state: 'detached' });
  assert.equal(service.sessions.get(created.id).group, null);
  assert.equal(await page.locator('.desktop-error').count(), 0);
  assert.deepEqual(errors, []);
  await page.screenshot({ path: path.join(repo, 'groups.png') });
  console.log(`Groups UI passed: chips, collapse across reload, right-click moves, new group, ungroup, drop on chip, New chat picker and options picker. Screenshot: ${path.join(repo, 'groups.png')}`);
} finally {
  await browser?.close(); await service?.close();
}
