import assert from 'node:assert/strict';
import test from 'node:test';
import { DRINK_TYPES, PRESETS, clampAbv, drinkType } from '../src/lib/catalog';
import { gramsOf } from '../src/lib/alcohol';

test('cada bebida propone un volumen y una graduación creíbles', () => {
  for (const d of DRINK_TYPES) {
    const [min, max] = d.abvRange;
    assert.ok(min < max, `${d.id}: el rango tiene que ir de menor a mayor`);
    assert.ok(
      d.abv >= min && d.abv <= max,
      `${d.id}: la graduación por defecto cae fuera de rango`,
    );
    assert.ok(d.ml >= 15 && d.ml <= 1500, `${d.id}: el volumen típico sale del slider`);
  }
  // El default de cada bebida tiene que dar una dosis razonable, no un vaso de
  // 350 ml de tequila: ningún preset supera los 60 g de alcohol puro.
  for (const d of DRINK_TYPES) {
    const g = gramsOf(d.ml, d.abv);
    assert.ok(g < 60, `${d.id}: ${g.toFixed(0)} g es demasiado para un default`);
  }
  assert.equal(drinkType('shot').ml, 45, 'un shot son 45 ml, no el vaso anterior');
});

test('la graduación se acota al rango de la bebida', () => {
  assert.equal(clampAbv('cerveza', 73), 12, 'una cerveza no puede quedar al 73 %');
  assert.equal(clampAbv('cerveza', 0), 3);
  assert.equal(clampAbv('shot', 40), 40, 'un valor válido pasa intacto');
  assert.equal(clampAbv('vino', Number.NaN), drinkType('vino').abv, 'sin número, el default');
  for (const d of DRINK_TYPES) {
    const [min, max] = d.abvRange;
    for (const v of [-10, 0, d.abv, 999]) {
      const c = clampAbv(d.id, v);
      assert.ok(c >= min && c <= max, `${d.id}: clamp de ${v} dio ${c}`);
    }
  }
});

test('los presets del catálogo respetan el rango de su bebida', () => {
  for (const p of PRESETS) {
    assert.equal(clampAbv(p.kind, p.abv), p.abv, `${p.id}: la graduación se sale del rango`);
  }
});
