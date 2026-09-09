import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { DRINK_TYPES, ML_RANGE, PRESETS, clampAbv, drinkType } from '../lib/catalog';
import { gramsOf } from '../lib/alcohol';
import { fmtAbv, fmtMl, uid } from '../lib/format';
import type { DrinkKind, Vessel } from '../lib/types';
import { Button, Card, Chip, Copy, GlassIcon, Kicker, NumberPicker, Sheet, Title } from './ui';
import { colors, styles } from './theme';
export function VesselSheet({
  open,
  onClose,
  current,
  onPick,
  onPickAndAdd,
}: {
  open: boolean;
  onClose: () => void;
  current: Vessel;
  onPick: (v: Vessel) => void;
  onPickAndAdd: (v: Vessel) => void;
}) {
  const [kind, setKind] = useState<DrinkKind | 'todos'>('todos');
  const [customOpen, setCustomOpen] = useState(false);
  const [ml, setMl] = useState(current.ml);
  const [customKind, setCustomKind] = useState(current.kind);
  const [abv, setAbv] = useState(() => clampAbv(current.kind, current.abv));
  const choose = (v: Vessel, add = false) => {
    (add ? onPickAndAdd : onPick)(v);
    onClose();
  };
  const custom = (): Vessel => ({
    id: uid('v'),
    label: `${drinkType(customKind).label} ${fmtMl(ml)}`,
    ml,
    kind: customKind,
    abv,
    source: 'manual',
  });
  return (
    <Sheet open={open} onClose={onClose} title="Elegí tu vaso">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        <Chip active={kind === 'todos'} onPress={() => setKind('todos')}>
          Todos
        </Chip>
        {DRINK_TYPES.map((d) => (
          <Chip key={d.id} active={kind === d.id} onPress={() => setKind(d.id)}>
            {d.label}
          </Chip>
        ))}
      </ScrollView>
      {PRESETS.filter((p) => kind === 'todos' || p.kind === kind).map((p) => (
        <Card key={p.id} style={[styles.row, current.id === p.id && styles.selected]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Usar ${p.label}`}
            onPress={() => choose(p)}
            style={[styles.row, styles.fill, { minHeight: 52 }]}
          >
            <GlassIcon kind={p.kind} size={38} />
            <View style={styles.fill}>
              <Title style={{ fontSize: 19, lineHeight: 26 }}>{p.label}</Title>
              <Copy style={styles.small}>
                {fmtMl(p.ml)} · {fmtAbv(p.abv)}
              </Copy>
            </View>
          </Pressable>
          <Button compact onPress={() => choose(p, true)}>
            Registrar
          </Button>
        </Card>
      ))}
      <Button variant="dark" onPress={() => setCustomOpen(!customOpen)}>
        {customOpen ? 'Ocultar medidas' : 'Vaso a medida'}
      </Button>
      {customOpen && (
        <Card>
          <Kicker>Bebida</Kicker>
          <View style={styles.wrap}>
            {DRINK_TYPES.map((d) => (
              <Chip
                key={d.id}
                active={customKind === d.id}
                onPress={() => {
                  setCustomKind(d.id);
                  setAbv(d.abv);
                  setMl(d.ml);
                }}
              >
                {d.label}
              </Chip>
            ))}
          </View>
          <NumberPicker
            label="Volumen en ml"
            min={ML_RANGE[0]}
            max={ML_RANGE[1]}
            step={5}
            value={ml}
            onChange={setMl}
          />
          <View style={styles.wrap}>
            {[45, 150, 330, 473, 500, 750, 1000].map((v) => (
              <Chip key={v} active={ml === v} onPress={() => setMl(v)}>
                {fmtMl(v)}
              </Chip>
            ))}
          </View>
          <NumberPicker
            label="Graduación % vol"
            min={drinkType(customKind).abvRange[0]}
            max={drinkType(customKind).abvRange[1]}
            step={0.5}
            value={abv}
            onChange={setAbv}
          />
          <Copy style={{ color: colors.muted }}>
            {Math.round(gramsOf(ml, abv))} g de alcohol puro. Registrá solo el volumen que tomaste
            vos.
          </Copy>
          <Button variant="dark" onPress={() => choose(custom())}>
            Usar como mi vaso
          </Button>
          <Button onPress={() => choose(custom(), true)}>Guardar y registrar</Button>
        </Card>
      )}
    </Sheet>
  );
}
