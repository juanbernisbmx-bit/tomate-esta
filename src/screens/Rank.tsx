import { useEffect, useRef, useState } from 'react';
import { AppState, Share, View } from 'react-native';
import { Button, Card, Chip, Copy, Disclaimer, Kicker, Page, Stat, Title } from '../components/ui';
import { colors, styles } from '../components/theme';
import { pollGroup, USING_MOCKS } from '../api/client';
import { fmtAgo, fmtBac, plural } from '../lib/format';
import { useActions, useApp } from '../state/store';
import { useGroupStats } from '../state/selectors';
export function Rank() {
  const { group } = useApp();
  const { setGroup, go, showToast } = useActions();
  const { rows, totalTragos, now } = useGroupStats();
  const [mode, setMode] = useState<'ahora' | 'tragos'>('ahora');
  const [error, setError] = useState('');
  const [updated, setUpdated] = useState<number | null>(null);
  const current = useRef(group);
  current.current = group;
  useEffect(() => {
    if (!group || USING_MOCKS) return;
    let cancelled = false;
    let busy = false;
    const refresh = async () => {
      if (busy || AppState.currentState !== 'active' || !current.current) return;
      busy = true;
      const code = current.current.code;
      try {
        const result = await pollGroup(current.current);
        if (!cancelled && current.current?.code === code) {
          setGroup(result);
          setError('');
          setUpdated(Date.now());
        }
      } catch {
        if (!cancelled) setError('Sin conexión al grupo. Mostramos los últimos datos recibidos.');
      } finally {
        busy = false;
      }
    };
    void refresh();
    const id = setInterval(() => void refresh(), 45000);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void refresh();
    });
    return () => {
      cancelled = true;
      clearInterval(id);
      sub.remove();
    };
  }, [group?.code, setGroup]);
  if (!group)
    return (
      <Page style={{ gap: 20 }}>
        <Title>Tu grupo</Title>
        <Copy>
          Tu registro personal está disponible. Podés unirte a un grupo para acompañarse durante la
          noche.
        </Copy>
        <Button onPress={() => go('group')}>Unirme o crear grupo</Button>
        <Disclaimer />
      </Page>
    );
  return (
    <Page>
      <Kicker color={colors.amber}>Acompañarse, sin competir</Kicker>
      <Title>El grupo</Title>
      <Copy style={{ color: colors.muted }}>
        {group.name} · código {group.code}
      </Copy>
      <Copy style={styles.small}>Tus registros se guardan en este dispositivo.</Copy>
      <Copy style={[styles.small, { marginTop: 12 }]}>
        {USING_MOCKS
          ? 'Demo · personas y registros de ejemplo'
          : updated
            ? `Actualizado ${fmtAgo(updated, now)} · cada 45 s`
            : 'Consultando el grupo…'}
      </Copy>
      {error ? (
        <Copy accessibilityRole="alert" style={{ color: colors.amber }}>
          {error}
        </Copy>
      ) : null}
      <View style={[styles.row, { marginVertical: 18 }]}>
        <Chip active={mode === 'ahora'} onPress={() => setMode('ahora')}>
          Estimación actual
        </Chip>
        <Chip active={mode === 'tragos'} onPress={() => setMode('tragos')}>
          Registros
        </Chip>
      </View>
      <View style={styles.stack}>
        {rows.map((row) => (
          <Card key={row.id} style={row.me ? styles.selected : undefined}>
            <View style={styles.between}>
              <View style={styles.fill}>
                <Title
                  style={{ fontSize: 24, lineHeight: 32, color: row.me ? colors.lime : colors.ink }}
                >
                  {row.name}
                  {row.me && row.name !== 'Vos' ? ' · vos' : ''}
                </Title>
                <Copy style={styles.small}>
                  {row.lastAt ? fmtAgo(row.lastAt, now) : 'Sin registros'}
                </Copy>
              </View>
              <Title style={{ fontSize: 28, color: row.me ? colors.lime : colors.ink }}>
                {mode === 'tragos' ? row.tragos : `${fmtBac(row.bac)} %`}
              </Title>
            </View>
            <Copy style={styles.small}>
              {row.lastLabel} · {plural(row.tragos, 'registro')}
            </Copy>
          </Card>
        ))}
      </View>
      <View style={[styles.row, { marginTop: 18 }]}>
        <Stat value={rows.length} label="Personas" />
        <Stat value={totalTragos} label="Registros del grupo" />
      </View>
      <Card style={{ marginTop: 18 }}>
        <Kicker>La vuelta</Kicker>
        <Copy>
          Acuerden cómo vuelven y acompañen a quien necesite ayuda. Las estimaciones pueden diferir
          mucho de los valores reales.
        </Copy>
      </Card>
      <View style={styles.section}>
        <Button
          variant="dark"
          onPress={async () => {
            try {
              await Share.share({
                message: `Sumate a ${group.name} en Tomate con el código ${group.code}.`,
              });
            } catch {
              showToast('No se pudo abrir el menú para compartir.');
            }
          }}
        >
          Compartir código
        </Button>
        <Button compact variant="ghost" onPress={() => go('group')}>
          Cambiar de grupo
        </Button>
      </View>
      <Disclaimer />
    </Page>
  );
}
