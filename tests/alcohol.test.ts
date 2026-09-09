import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ABSORPTION_MIN,
  ELIMINATION_PER_HOUR,
  bacAt,
  bacBreakdown,
  bacFromGrams,
  bacOfMember,
  LEVELS,
  bacPeakOfNight,
  gramsOf,
  hoursToSober,
  levelOf,
  pacePerHour,
} from '../src/lib/alcohol';
import type { Member, Profile, Trago } from '../src/lib/types';

const now = 1_700_000_000_000;
const MIN = 60_000;
const perfil: Profile = { nombre: 'Vos', peso: 70, edad: 24, sexo: 'H' };
/** Vaso de trago: 350 ml al 9 %, unos 24,9 g de alcohol puro. */
const VASO = gramsOf(350, 9);
const hace = (min: number, id = `t${min}`): Trago => ({
  id,
  at: now - min * MIN,
  label: 'Vaso de trago',
  ml: 350,
  kind: 'trago',
  abv: 9,
  grams: VASO,
  via: 'boton',
});
const cerca = (a: number, b: number, msg: string) =>
  assert.ok(Math.abs(a - b) < 0.005, `${msg}: ${a.toFixed(3)} vs ${b.toFixed(3)}`);

test('un bajón largo no se come lo que se tomó después', () => {
  // Una birra temprano en casa y un fernet recién en el boliche: el primero ya
  // se eliminó entero, así que no puede descontar nada del segundo.
  const solo = bacAt([hace(30)], perfil, now);
  const conElViejo = bacAt([hace(480), hace(30)], perfil, now);
  cerca(conElViejo, solo, 'el trago de hace 8 h no debería restar');
  assert.ok(conElViejo > 0.4, `debería estar bien arriba de cero, dio ${conElViejo}`);
});

test('deshacer un registro viejo no sube la estimación', () => {
  const todos = [hace(300), hace(60), hace(30)];
  const sinElPrimero = todos.slice(1);
  assert.ok(
    bacAt(todos, perfil, now) >= bacAt(sinElPrimero, perfil, now) - 0.0001,
    'borrar un trago nunca puede aumentar el %',
  );
  cerca(bacAt(todos, perfil, now), bacAt(sinElPrimero, perfil, now), 'el de hace 5 h ya no aporta');
});

test('con el mismo consumo, un integrante y vos dan el mismo número', () => {
  for (const min of [0, 5, 10, 20, 60, 240]) {
    const mio = bacAt([hace(min)], perfil, now);
    const suyo = bacOfMember(
      {
        id: 'a',
        name: 'A',
        ini: 'A',
        color: '#fff',
        grams: VASO,
        peso: perfil.peso,
        sexo: perfil.sexo,
        tragos: 1,
        startedAt: now - min * MIN,
        lastAt: now - min * MIN,
        lastLabel: 'x',
      },
      now,
    );
    cerca(suyo, mio, `a los ${min} min el integrante y yo deberían coincidir`);
  }
});

test('un integrante con una noche larga que acaba de tomar no queda en cero', () => {
  const m: Member = {
    id: 'b',
    name: 'B',
    ini: 'B',
    color: '#fff',
    grams: VASO,
    peso: 70,
    sexo: 'H',
    tragos: 1,
    startedAt: now - 6 * 60 * MIN,
    lastAt: now - MIN,
    lastLabel: 'recién',
  };
  assert.ok(bacOfMember(m, now) > 0, 'tomó hace un minuto: no puede dar 0');
  const sinRegistros: Member = { ...m, grams: 0, tragos: 0, lastAt: 0 };
  assert.equal(bacOfMember(sinRegistros, now), 0);
});

test('la absorción y la eliminación siguen las constantes documentadas', () => {
  const pico = bacFromGrams(VASO, perfil.peso, perfil.sexo);
  // A mitad de la absorción va la mitad, menos lo que ya eliminó el hígado.
  const mitad = bacAt([hace(ABSORPTION_MIN / 2)], perfil, now);
  cerca(mitad, pico / 2 - (ELIMINATION_PER_HOUR * (ABSORPTION_MIN / 2)) / 60, 'media absorción');
  // Terminada la absorción baja en línea recta hasta cero, y se queda ahí.
  const fin = bacAt([hace(ABSORPTION_MIN)], perfil, now);
  cerca(fin, pico - (ELIMINATION_PER_HOUR * ABSORPTION_MIN) / 60, 'fin de la absorción');
  assert.equal(bacAt([hace(24 * 60)], perfil, now), 0, 'un día después: cero');
});

test('lo pendiente de absorber se muestra aparte y nunca es negativo', () => {
  const recien = bacBreakdown([hace(1)], perfil, now);
  assert.ok(recien.pending > 0, 'recién tomado casi todo está por subir');
  cerca(recien.peak, recien.current + recien.pending, 'peak = current + pending');
  // El pico no es el bruto del vaso: durante los 20 min de absorción el hígado
  // ya viene descontando, así que llega algo por debajo.
  const bruto = bacFromGrams(VASO, perfil.peso, perfil.sexo);
  cerca(recien.peak, bruto - (ELIMINATION_PER_HOUR * ABSORPTION_MIN) / 60, 'pico del vaso');
  assert.ok(recien.peak < bruto, 'el pico nunca alcanza el bruto del vaso');
  const viejo = bacBreakdown([hace(120)], perfil, now);
  assert.equal(viejo.pending, 0, 'a las 2 h ya no queda nada por absorber');
  assert.ok(viejo.peak >= viejo.current);
});

test('un registro con fecha futura no cuenta hasta que llega su hora', () => {
  assert.equal(bacAt([hace(-10)], perfil, now), 0);
  assert.equal(bacBreakdown([hace(-10)], perfil, now).peak, 0);
  assert.equal(bacAt([], perfil, now), 0);
});

test('el ritmo mira las últimas dos horas y las horas a cero salen de la tasa', () => {
  assert.equal(pacePerHour([], perfil, now), 0, 'sin registros no hay ritmo');
  // Un trago viejo queda fuera de la ventana; los recientes sí cuentan.
  assert.equal(pacePerHour([hace(300)], perfil, now), 0, 'hace 5 h ya no entra');
  const rapido = pacePerHour([hace(30), hace(15)], perfil, now);
  const lento = pacePerHour([hace(115), hace(15)], perfil, now);
  assert.ok(rapido > lento, 'los mismos tragos más juntos son un ritmo más alto');

  cerca(hoursToSober(0.45), 0.45 / ELIMINATION_PER_HOUR, 'horas a cero');
  assert.equal(hoursToSober(0), 0);
});

test('el pico de la noche es el máximo que alcanzó, no el total sin eliminar', () => {
  // Cinco vasos repartidos en cinco horas: convertir los gramos de una tanda
  // daba un pico que nunca ocurrió, porque ignora lo que el hígado fue sacando.
  const noche = [hace(300), hace(240), hace(180), hace(120), hace(60)];
  const total = bacFromGrams(
    noche.reduce((s, t) => s + t.grams, 0),
    perfil.peso,
    perfil.sexo,
  );
  const pico = bacPeakOfNight(noche, perfil, now);
  assert.ok(pico < total, `el pico real (${pico.toFixed(2)}) no puede llegar al bruto`);
  assert.ok(pico >= bacAt(noche, perfil, now), 'nunca por debajo de la estimación actual');
  // Y es el máximo de la curva: ningún instante de la noche lo supera.
  for (let m = 0; m <= 300; m += 10) {
    assert.ok(bacAt(noche, perfil, now - m * MIN) <= pico + 0.0001, `superado a los ${m} min`);
  }
  assert.equal(bacPeakOfNight([], perfil, now), 0);
});

test('cada nivel se distingue del anterior a simple vista', () => {
  const vistos = new Map<string, string>();
  for (const l of LEVELS) {
    assert.ok(!vistos.has(l.color), `${l.key} repite el color de ${vistos.get(l.color)}`);
    vistos.set(l.color, l.key);
    assert.equal(l.gradient.length, 2, `${l.key}: el gradiente necesita dos colores`);
    assert.ok(l.gradient[0] === l.color, `${l.key}: el gradiente debería arrancar en su color`);
  }
  // Los umbrales siguen mandando: el cambio de color acompaña al de mensaje.
  assert.notEqual(levelOf(0.2).color, levelOf(0.4).color, '0,2 y 0,4 se ven igual');
  assert.notEqual(levelOf(0.4).color, levelOf(0.6).color, '0,4 y 0,6 se ven igual');
  assert.notEqual(levelOf(0.6).color, levelOf(0.9).color, '0,6 y 0,9 se ven igual');
});
