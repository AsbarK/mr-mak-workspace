import test from 'node:test';
import assert from 'node:assert/strict';
import { invalidFilename, ptyOptions, shellCommand, shellLabel } from '../platform.mjs';

test('platform policy preserves POSIX names while retaining Windows-safe validation', () => {
  assert.equal(invalidFilename('notes:linux.md'), process.platform === 'win32');
  assert.equal(invalidFilename('notes.md'), false);
  assert.equal(invalidFilename('../escape.md'), true);
  assert.equal(shellLabel(), process.platform === 'win32' ? 'PowerShell' : 'Shell');
  assert.ok(shellCommand().file);
  assert.equal('useConpty' in ptyOptions({ cwd: process.cwd(), env: process.env, cols: 80, rows: 24 }), process.platform === 'win32');
});
