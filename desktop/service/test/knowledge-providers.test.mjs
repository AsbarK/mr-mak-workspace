import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { MarkdownKnowledgeProvider } from '../knowledge/providers.mjs';

test('Markdown knowledge provider searches and retrieves source-scoped documents', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'mrmak-knowledge-'));
  await mkdir(path.join(root, 'notes'));
  await writeFile(path.join(root, 'notes', 'project.md'), '# Project context\n\nGodot and Linux notes.\n');
  const provider = new MarkdownKnowledgeProvider(root);
  const hits = await provider.search('Linux');
  assert.equal(hits.length, 1);
  assert.equal(hits[0].ref, 'notes/project.md');
  assert.equal(hits[0].title, 'Project context');
  const document = await provider.retrieve(hits[0].ref);
  assert.match(document.text, /Godot and Linux/);
  await assert.rejects(provider.retrieve('../outside.md'), /leaves its provider root/);
});
