import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createObserver } from '../opencode/observer.mjs';
import { opencodeEnvironment, readOpencodeState, watchOpencode, opencodeStatePath } from '../opencode.mjs';
import { terminalCommand } from '../agents.mjs';
import { Sessions } from '../sessions.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const id = 'ses_test123', directory = path.join(root, '.cache');
const v1 = (type, properties) => ({ type, properties });
const v2 = (type, data, id = 'evt_new') => ({ type, data, id, created: 200 });
function observer(nativeId) {
  const states = [];
  const send = createObserver({ directory, nativeId, chatId: 'chat-a', launchId: 'launch-a', startedAt: 100, save: state => states.push(state) });
  return { send, states, state: () => states.at(-1) };
}

test('OpenCode v1 binds only its root session and observes final answers, permissions and interruptions', () => {
  const { send, states, state } = observer();
  send(v1('session.created', { info: { id: 'ses_child', directory, parentID: id } }));
  send(v1('session.created', { info: { id, directory: path.join(directory, 'other') } }));
  assert.equal(states.length, 0);
  send(v1('session.created', { info: { id, directory } }));
  assert.equal(state().nativeId, id);
  send(v1('session.status', { sessionID: 'ses_other', status: { type: 'busy' } }));
  assert.equal(state().activity, 'idle');
  send(v1('session.status', { sessionID: id, status: { type: 'busy' } }));
  assert.equal(state().activity, 'working');
  send(v1('message.updated', { info: { id: 'msg_tool', sessionID: id, role: 'assistant', finish: 'tool-calls', time: { completed: 300 } } }));
  assert.equal(state().completion, null);
  send(v1('permission.asked', { sessionID: id }));
  assert.equal(state().activity, 'waiting');
  send(v1('permission.replied', { sessionID: id }));
  assert.equal(state().activity, 'working');
  send(v1('message.updated', { info: { id: 'msg_answer', sessionID: id, role: 'assistant', finish: 'stop', time: { completed: 400 } } }));
  send(v1('session.idle', { sessionID: id }));
  assert.equal(state().completion, 'msg_answer');
  const count = states.length;
  send(v1('session.status', { sessionID: id, status: { type: 'idle' } }));
  assert.equal(states.length, count);
  send(v1('session.status', { sessionID: id, status: { type: 'busy' } }));
  send(v1('session.error', { sessionID: id, error: { name: 'MessageAbortedError' } }));
  send(v1('session.idle', { sessionID: id }));
  assert.equal(state().activity, 'idle');
  assert.equal(state().completion, 'msg_answer', 'interruption is not a completed answer');
});

test('OpenCode v2 ignores old events and child sessions; resume works without a creation event', () => {
  const { send, state, states } = observer();
  send({ ...v2('session.created', { sessionID: id, location: { directory } }), created: 50 });
  send(v2('session.created', { sessionID: 'ses_child', parentID: id, location: { directory } }));
  assert.equal(states.length, 0);
  send(v2('session.created', { sessionID: id, location: { directory } }));
  send(v2('session.execution.started', { sessionID: id }));
  assert.equal(state().activity, 'working');
  send(v2('session.execution.succeeded', { sessionID: 'ses_child' }, 'evt_child'));
  assert.equal(state().completion, null);
  send(v2('session.execution.succeeded', { sessionID: id }, 'evt_answer'));
  assert.equal(state().completion, 'evt_answer');
  send(v2('session.execution.started', { sessionID: id }));
  send(v2('session.execution.failed', { sessionID: id, error: {} }));
  assert.equal(state().activity, 'waiting');
  assert.equal(state().completion, 'evt_answer');
  send(v2('session.execution.interrupted', { sessionID: id }));
  assert.equal(state().activity, 'idle');
  const resumed = observer(id);
  resumed.send(v2('session.execution.started', { sessionID: id }));
  resumed.send(v2('session.execution.succeeded', { sessionID: id }, 'evt_resumed'));
  assert.equal(resumed.state().completion, 'evt_resumed');
});

test('OpenCode configuration keeps provider, model, plugin and permission choices; invalid overrides fail explicitly', () => {
  for (const major of [1, 2]) {
    const key = major === 1 ? 'plugin' : 'plugins';
    const config = { [key]: ['existing-plugin'], model: 'my-provider/my-model', permissions: [{ effect: 'deny' }], custom: true };
    const env = { OPENCODE_CONFIG_CONTENT: JSON.stringify(config), PROVIDER_SENTINEL: 'untouched' };
    const result = opencodeEnvironment(env, { stateDir: directory, session: { id: 'chat', nativeId: id }, major, launchId: 'launch' });
    const actual = JSON.parse(result.OPENCODE_CONFIG_CONTENT);
    assert.deepEqual(actual, { ...config, [key]: ['existing-plugin', new URL(major === 2 ? '../opencode/v2/' : '../opencode/v1.mjs', import.meta.url).href] });
    assert.equal(result.PROVIDER_SENTINEL, 'untouched');
    assert.equal(result.MRMAK_OPENCODE_SESSION_ID, id);
    assert.deepEqual(JSON.parse(env.OPENCODE_CONFIG_CONTENT), config, 'caller env is not mutated');
  }
  for (const bad of ['{broken', '[]', 'null', '{"plugin":false}']) {
    assert.throws(() => opencodeEnvironment({ OPENCODE_CONFIG_CONTENT: bad }, { stateDir: directory, session: { id: 'chat' }, major: 1 }));
  }
  assert.throws(() => opencodeEnvironment({}, { stateDir: directory, session: { id: 'chat', nativeId: '--bad' }, major: 1 }));
});

test('OpenCode launch flags preserve native permissions and never pass Codex reasoning flags', async () => {
  await mkdir(directory, { recursive: true });
  const bin = await mkdtemp(path.join(directory, 'opencode-bin-'));
  await writeFile(path.join(bin, process.platform === 'win32' ? 'opencode.cmd' : 'opencode'), '');
  const previous = process.env.PATH;
  process.env.PATH = bin + path.delimiter + (previous || '');
  try {
    for (const major of [1, 2]) for (const bypass of [false, true]) {
      const command = terminalCommand('opencode', { opencodeMajor: major, bypass, resumeId: id, effort: 'xhigh' });
      const launch = process.platform === 'win32' ? Buffer.from(command.args.at(-1), 'base64').toString('utf16le') : command.args.join(' ');
      assert.match(launch, /--session/); assert.ok(launch.includes(id));
      assert.equal(launch.includes('--standalone'), major === 2);
      assert.equal(launch.includes('--auto'), bypass);
      assert.doesNotMatch(launch, /--effort|model_reasoning_effort|xhigh/);
    }
  } finally { if (previous === undefined) delete process.env.PATH; else process.env.PATH = previous; }
});

test('OpenCode recovery is per chat, rejects stale activity and resumes the same native ID after restart', async () => {
  await mkdir(directory, { recursive: true });
  const repo = await mkdtemp(path.join(directory, 'opencode-history-'));
  const sessions = await new Sessions(repo, repo).init();
  const item = sessions.make({ id: 'chat-a', agent: 'opencode', name: 'Model Review', cwd: repo, open: false, hasConversation: true });
  sessions.items.set(item.id, item);
  const file = opencodeStatePath(repo, item.id);
  const state = { chatId: item.id, nativeId: id, launchId: 'old', revision: 1, activity: 'working', completion: null };
  const updates = [];
  let stop;
  let restored;
  try {
    await writeFile(file, JSON.stringify({ ...state, chatId: 'other' }));
    assert.equal(await readOpencodeState(repo, item.id), null);
    await writeFile(file, JSON.stringify(state));
    stop = watchOpencode(repo, item, 'new', value => updates.push(value));
    await new Promise(resolve => setTimeout(resolve, 350)); assert.equal(updates.length, 0);
    await writeFile(file, JSON.stringify({ ...state, launchId: 'new', revision: 2 }));
    for (let i = 0; i < 30 && !updates.length; i++) await new Promise(resolve => setTimeout(resolve, 50));
    assert.equal(updates.length, 1);
    await sessions.recoverNative(item); assert.equal(item.nativeId, id);
    assert.equal(item.effort, undefined);
    await sessions.close();
    restored = await new Sessions(repo, repo).init();
    const launches = [];
    restored.launch = async (session, resumeId) => launches.push({ agent: session.agent, resumeId });
    await restored.resume(item.id);
    assert.deepEqual(launches, [{ agent: 'opencode', resumeId: id }]);
  } finally { stop?.(); await sessions.close(); await restored?.close(); }
});
