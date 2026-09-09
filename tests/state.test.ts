import assert from 'node:assert/strict';
import test from 'node:test';
import { initialState, reducer } from '../src/state/model';
import { createWriteQueue, decodeSavedState, serializeState } from '../src/state/persistence';
import { gramsOf, bacAt, bacBreakdown } from '../src/lib/alcohol';
import { DEFAULT_VESSEL } from '../src/lib/catalog';
import { plural, pluralWord } from '../src/lib/format';
import type { Trago } from '../src/lib/types';
const at = 1_700_000_000_000;
const trago: Trago = {
  id: 't1',
  at,
  label: 'Cerveza',
  ml: 330,
  abv: 5,
  kind: 'cerveza',
  grams: gramsOf(330, 5),
  via: 'boton',
};
test('registrar, deshacer, cerrar y restaurar conserva los datos de la noche', () => {
  let state = reducer(initialState, { type: 'onboarded' });
  state = reducer(state, { type: 'addTrago', trago });
  state = reducer(state, { type: 'addTrago', trago: { ...trago, id: 't2' } });
  state = reducer(state, { type: 'undoTrago', id: 't1' });
  assert.deepEqual(
    state.tragos.map((t) => t.id),
    ['t2'],
  );
  state = reducer(state, { type: 'screen', screen: 'scan' });
  state = reducer(state, { type: 'toast', text: 'Registrado', undoId: 't2' });
  const restored = decodeSavedState(serializeState(state));
  assert.equal(restored.screen, 'home');
  assert.equal(restored.toast, null);
  assert.deepEqual(restored.tragos, state.tragos);
  const closed = reducer(restored, {
    type: 'closeNight',
    summary: { id: 'n1', closedAt: at + 5000, peakBac: 0.3, grams: trago.grams, tragos: 1 },
  });
  assert.equal(closed.tragos.length, 0);
  assert.equal(decodeSavedState(serializeState(closed)).history[0].tragos, 1);
  assert.equal(closed.vessel.id, DEFAULT_VESSEL.id);
  assert.deepEqual(reducer(closed, { type: 'reset' }), initialState);
});
test('storage corrupto o datos inválidos no rompen la app ni producen NaN', () => {
  assert.deepEqual(decodeSavedState('{oops'), initialState);
  const restored = decodeSavedState(
    JSON.stringify({
      profile: { nombre: 'A', peso: 0, edad: 20, sexo: 'H' },
      onboarded: true,
      tragos: [null, { ...trago, grams: -1 }],
      history: [false],
    }),
  );
  assert.equal(restored.profile.peso, 70);
  assert.equal(restored.onboarded, false);
  assert.equal(restored.tragos.length, 0);
  assert.equal(restored.history.length, 0);
});
test('recupera historial legado y conserva fotos del vaso', () => {
  const restored = decodeSavedState(
    JSON.stringify({
      ...initialState,
      onboarded: true,
      screen: 'recap',
      vessel: { ...DEFAULT_VESSEL, source: 'scan', photo: 'data:image/jpeg;base64,example' },
      history: [{ id: 'old', closedAt: at, peakBac: 0.4, grams: 20, tragos: 2, puesto: 1 }],
    }),
  );
  assert.equal(restored.history.length, 1);
  assert.match(restored.vessel.photo!, /^data:image/);
  assert.equal(restored.screen, 'home');
});
test('escrituras lentas no sobrescriben el reset y la cola se recupera de errores', async () => {
  const writes: string[] = [];
  let release!: () => void;
  const blocked = new Promise<void>((resolve) => {
    release = resolve;
  });
  const enqueue = createWriteQueue(async (raw) => {
    if (raw === 'old') await blocked;
    if (raw === 'fail') throw new Error('full');
    writes.push(raw);
  });
  const old = enqueue('old');
  const reset = enqueue('reset');
  await Promise.resolve();
  assert.deepEqual(writes, []);
  release();
  await Promise.all([old, reset]);
  assert.deepEqual(writes, ['old', 'reset']);
  await assert.rejects(enqueue('fail'));
  await enqueue('recovered');
  assert.equal(writes.at(-1), 'recovered');
});
test('un registro recién cargado aparece como pendiente, sin subir inmediatamente el valor actual', () => {
  const fresh = bacBreakdown([trago], initialState.profile, at);
  assert.equal(fresh.current, 0);
  assert.ok(fresh.pending > 0);
  const later = bacBreakdown([trago], initialState.profile, at + 20 * 60000);
  assert.ok(later.current > 0);
  assert.equal(later.pending, 0);
  assert.equal(later.current, bacAt([trago], initialState.profile, at + 20 * 60000));
  assert.equal(bacAt([trago], initialState.profile, at + 24 * 3600000), 0);
  assert.equal(bacAt([trago], initialState.profile, at - 1), 0);
});
test('los contadores concuerdan en singular y plural', () => {
  assert.equal(plural(1, 'registro'), '1 registro');
  assert.equal(plural(0, 'registro'), '0 registros');
  assert.equal(plural(2, 'registro'), '2 registros');
  assert.equal(
    plural(1, 'tipo de vaso registrado', 'tipos de vaso registrados'),
    '1 tipo de vaso registrado',
  );
  assert.equal(
    plural(3, 'tipo de vaso registrado', 'tipos de vaso registrados'),
    '3 tipos de vaso registrados',
  );
});

test('las etiquetas de los contadores concuerdan con su número', () => {
  assert.equal(pluralWord(1, 'Registro'), 'Registro');
  assert.equal(pluralWord(0, 'Registro'), 'Registros');
  assert.equal(pluralWord(2, 'Registro'), 'Registros');
  assert.equal(pluralWord(1, 'Noche registrada', 'Noches registradas'), 'Noche registrada');
  assert.equal(pluralWord(3, 'Noche registrada', 'Noches registradas'), 'Noches registradas');
  // plural() sigue apoyándose en el mismo criterio.
  assert.equal(plural(1, 'registro'), '1 registro');
  assert.equal(plural(2, 'registro'), '2 registros');
});
