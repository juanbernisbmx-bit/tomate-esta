import assert from 'node:assert/strict';
import test from 'node:test';
import { apiFetch, createGroup, fetchGroup, pollGroup } from '../src/api/client';
test('API tolera respuestas 204, cuerpos vacíos y errores HTTP', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response(null, { status: 204 });
    assert.equal(await apiFetch('/test'), undefined);
    globalThis.fetch = async () => new Response('', { status: 200 });
    assert.equal(await apiFetch('/test'), undefined);
    globalThis.fetch = async () => new Response('{"ml":330}', { status: 200 });
    assert.deepEqual(await apiFetch('/test'), { ml: 330 });
    globalThis.fetch = async () => new Response(null, { status: 503 });
    await assert.rejects(apiFetch('/test'), /503/);
  } finally {
    globalThis.fetch = original;
  }
});
test('los grupos demo se pueden crear y el poll no inventa consumos nuevos', async () => {
  const group = await fetchGroup('TMT4');
  assert.equal(group.code, 'TMT4');
  assert.deepEqual(await pollGroup(group), group);
  const created = await createGroup('Amigos');
  assert.equal(created.name, 'Amigos');
  assert.equal(created.code.length, 4);
  assert.equal(created.members.length, 0);
});
