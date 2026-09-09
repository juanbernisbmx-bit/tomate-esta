import { useState } from 'react';
import { View } from 'react-native';
import {
  Button,
  Card,
  Chip,
  Copy,
  Disclaimer,
  Input,
  Kicker,
  NumberPicker,
  Page,
  Sheet,
  Stat,
  Title,
} from '../components/ui';
import { colors, styles } from '../components/theme';
import { fmtBac, fmtNum, plural, pluralWord } from '../lib/format';
import type { Sexo } from '../lib/types';
import { useActions, useApp } from '../state/store';
import { useGroupStats } from '../state/selectors';
export function Profile() {
  const { profile, history, tragos } = useApp();
  const { setProfile, go, reset } = useActions();
  const { bac } = useGroupStats();
  const [deleting, setDeleting] = useState(false);
  const total = history.reduce((sum, h) => sum + h.tragos, 0) + tragos.length;
  const nights = history.length + (tragos.length ? 1 : 0);
  const series = [
    ...history
      .slice(0, 6)
      .reverse()
      .map((h) => h.tragos),
    tragos.length,
  ];
  const bars = [...Array<number | null>(7 - series.length).fill(null), ...series];
  const max = Math.max(1, ...series);
  return (
    <Page>
      <Title>{profile.nombre || 'Vos'}</Title>
      <Copy style={{ color: colors.muted }}>
        {profile.peso} kg · {profile.edad} años
      </Copy>
      <View style={[styles.row, { marginTop: 20 }]}>
        <Stat value={nights} label={pluralWord(nights, 'Noche registrada', 'Noches registradas')} />
        <Stat value={fmtBac(bac)} label="Estimación · %" />
      </View>
      <View style={[styles.row, { marginTop: 10 }]}>
        <Stat value={total} label={pluralWord(total, 'Registro total', 'Registros totales')} />
        <Stat value={fmtNum(total / Math.max(1, nights))} label="Registros / noche" />
      </View>
      <View style={styles.section}>
        <Kicker>Últimas noches · cantidad de registros</Kicker>
        <View
          accessibilityLabel={`Registros de las últimas noches: ${series.join(', ')}`}
          style={{ height: 120, flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}
        >
          {bars.map((b, i) => (
            <View key={i} style={{ flex: 1, gap: 4, alignItems: 'center' }}>
              <Copy style={styles.small}>{b ?? '—'}</Copy>
              <View
                style={{
                  width: '100%',
                  height: b == null ? 5 : Math.max(5, (b / max) * 84),
                  backgroundColor: i === 6 ? colors.lime : colors.line,
                  borderRadius: 5,
                }}
              />
            </View>
          ))}
        </View>
        <Copy style={styles.small}>
          La última barra es la noche actual. El historial conserva hasta 30 noches.
        </Copy>
      </View>
      <Card style={{ marginTop: 22 }}>
        <Kicker>Tu perfil</Kicker>
        <Input
          accessibilityLabel="Tu nombre"
          value={profile.nombre}
          maxLength={30}
          onChangeText={(nombre) => setProfile({ nombre })}
        />
        <NumberPicker
          label="Peso en kg"
          value={profile.peso}
          min={40}
          max={200}
          onChange={(peso) => setProfile({ peso })}
        />
        <NumberPicker
          label="Edad en años"
          value={profile.edad}
          min={18}
          max={99}
          onChange={(edad) => setProfile({ edad })}
        />
        <Kicker>Sexo · solo para el cálculo</Kicker>
        <View style={styles.wrap}>
          {(
            [
              { id: 'H', label: 'Hombre' },
              { id: 'M', label: 'Mujer' },
              { id: 'X', label: 'Prefiero no decir' },
            ] as { id: Sexo; label: string }[]
          ).map((s) => (
            <Chip
              key={s.id}
              active={profile.sexo === s.id}
              onPress={() => setProfile({ sexo: s.id })}
            >
              {s.label}
            </Chip>
          ))}
        </View>
      </Card>
      {history.length > 0 && (
        <View style={styles.section}>
          <Kicker>Historial</Kicker>
          {history.slice(0, 7).map((h) => (
            <Card key={h.id}>
              <Copy>
                {new Date(h.closedAt).toLocaleDateString('es-AR')} · {plural(h.tragos, 'registro')}
              </Copy>
              <Copy style={styles.small}>{Math.round(h.grams)} g de alcohol puro registrados</Copy>
            </Card>
          ))}
        </View>
      )}
      <View style={styles.section}>
        <Button variant="dark" onPress={() => go('recap')}>
          Ver resumen y cerrar noche
        </Button>
        <Button compact variant="ghost" onPress={() => setDeleting(true)}>
          Borrar mis datos locales
        </Button>
      </View>
      <Disclaimer />
      <Sheet open={deleting} onClose={() => setDeleting(false)} title="Borrar datos locales">
        <Copy>
          Se borrarán de este dispositivo tu perfil, grupo, vasos, registros e historial. Esta
          acción no se puede deshacer.
        </Copy>
        <Button
          variant="danger"
          onPress={() => {
            setDeleting(false);
            reset();
          }}
        >
          Borrar todo de este dispositivo
        </Button>
        <Button variant="dark" onPress={() => setDeleting(false)}>
          Cancelar
        </Button>
      </Sheet>
    </Page>
  );
}
