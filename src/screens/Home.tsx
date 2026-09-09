import { useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Button,
  Card,
  Chip,
  Copy,
  Disclaimer,
  GlassIcon,
  Kicker,
  Page,
  Stat,
  Title,
} from '../components/ui';
import { VesselSheet } from '../components/VesselSheet';
import { colors, styles } from '../components/theme';
import { FEATURED_PRESETS } from '../lib/catalog';
import { gramsOf, levelOf } from '../lib/alcohol';
import { fmtAbv, fmtAgo, fmtBac, fmtClock, fmtMl } from '../lib/format';
import type { Vessel } from '../lib/types';
import { useActions, useApp } from '../state/store';
import { requestUberRide } from '../lib/uber';
import { useGroupStats } from '../state/selectors';
import { USING_MOCKS } from '../api/client';
export function Home() {
  const { group, vessel, tragos } = useApp();
  const { go, setVessel, addTrago, undoTrago, showToast } = useActions();
  const { bac, subiendo, total, now, previaDesde } = useGroupStats();
  const [sheet, setSheet] = useState(false);
  const [rideBusy, setRideBusy] = useState(false);
  const level = levelOf(bac);
  const register = (v: Vessel = vessel, via: 'boton' | 'preset' = 'boton') => {
    const t = addTrago(v, via);
    showToast(`Registraste ${v.label}`, t.id, 'Si tomaste, no manejes.');
  };
  return (
    <Page>
      <View style={styles.between}>
        <Title style={{ fontSize: 25, lineHeight: 34, flex: 1 }}>
          {group?.name ?? 'Mi registro'}
        </Title>
        <Copy style={styles.small}>{fmtClock(now)}</Copy>
      </View>
      {previaDesde != null && (
        <Copy style={styles.small}>Inicio del registro · {fmtClock(previaDesde)}</Copy>
      )}
      {USING_MOCKS && (
        <Copy style={[styles.small, { color: colors.amber, marginTop: 8 }]}>
          Demo local · escaneo y grupo simulados
        </Copy>
      )}
      <View style={styles.section}>
        <Kicker>Estimación de alcohol en sangre</Kicker>
        <LinearGradient
          colors={level.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 20, borderRadius: 20, gap: 8 }}
        >
          <Title style={{ color: colors.night, fontSize: 33 }}>{level.name}</Title>
          <View style={styles.between}>
            <Copy style={{ color: colors.night, flex: 1, maxWidth: 190 }}>{level.sub}</Copy>
            <Title style={{ color: colors.night, fontSize: 43, lineHeight: 54 }}>
              {fmtBac(bac)} ‰
            </Title>
          </View>
          {subiendo > 0.005 && (
            <Copy style={{ color: colors.night, fontSize: 12 }}>
              ≈ {fmtBac(subiendo)} ‰ pendiente de absorción
            </Copy>
          )}
        </LinearGradient>
        <View style={styles.row}>
          <Stat value={tragos.length} label="Registros" />
          <Stat value={total} label="Personas" />
          <Stat
            value={Math.round(tragos.reduce((sum, t) => sum + t.grams, 0))}
            label="Alcohol · g"
          />
        </View>
      </View>
      <Card style={{ marginTop: 22 }}>
        <View style={styles.between}>
          <Kicker>Mi vaso</Kicker>
          <Button compact variant="dark" onPress={() => setSheet(true)}>
            Cambiar
          </Button>
        </View>
        <View style={styles.row}>
          {vessel.photo ? (
            <Image
              source={{ uri: vessel.photo }}
              style={{ width: 54, height: 54, borderRadius: 12 }}
              accessibilityLabel="Foto de tu vaso"
            />
          ) : (
            <GlassIcon kind={vessel.kind} size={50} />
          )}
          <View style={styles.fill}>
            <Title style={{ fontSize: 25, lineHeight: 32 }}>{vessel.label}</Title>
            <Copy style={styles.small}>
              {fmtMl(vessel.ml)} · {fmtAbv(vessel.abv)}
            </Copy>
          </View>
          <Copy style={{ color: colors.lime }}>{Math.round(gramsOf(vessel.ml, vessel.abv))} g</Copy>
        </View>
      </Card>
      <View style={{ gap: 10, marginTop: 12 }}>
        <Button onPress={() => register()}>+ Registrar trago</Button>
        <Button variant="dark" onPress={() => go('scan')}>
          Escanear vaso con IA
        </Button>
      </View>
      <View style={styles.section}>
        <Kicker>Sin foto</Kicker>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {FEATURED_PRESETS.map((p) => (
            <Chip
              key={p.id}
              active={p.id === vessel.id}
              onPress={() => {
                setVessel(p);
                showToast(`Tu vaso ahora es ${p.label}`);
              }}
            >
              {p.label}
            </Chip>
          ))}
          <Chip onPress={() => setSheet(true)}>Ver todos</Chip>
        </ScrollView>
      </View>
      <View style={styles.section}>
        <Kicker>La noche hasta ahora</Kicker>
        {tragos.length === 0 ? (
          <Copy style={{ color: colors.muted }}>Todavía no registraste bebidas.</Copy>
        ) : (
          [...tragos].reverse().map((t) => (
            <Card key={t.id} style={styles.row}>
              <GlassIcon kind={t.kind} size={30} />
              <View style={styles.fill}>
                <Copy>{t.label}</Copy>
                <Copy style={styles.small}>
                  {fmtMl(t.ml)} · {Math.round(t.grams)} g · {fmtAgo(t.at, now)}
                </Copy>
              </View>
              <Button
                compact
                variant="ghost"
                accessibilityLabel={`Eliminar ${t.label}`}
                onPress={() => {
                  undoTrago(t.id);
                  showToast(`Eliminaste ${t.label}`);
                }}
              >
                ×
              </Button>
            </Card>
          ))
        )}
      </View>
      <View style={styles.section}>
        <Button
          variant="dark"
          disabled={rideBusy}
          onPress={async () => {
            setRideBusy(true);
            try {
              await requestUberRide(showToast);
            } finally {
              setRideBusy(false);
            }
          }}
        >
          {rideBusy ? 'Abriendo Uber…' : 'Pedir un Uber'}
        </Button>
      </View>
      <Disclaimer />
      {sheet && (
        <VesselSheet
          open
          onClose={() => setSheet(false)}
          current={vessel}
          onPick={(v) => {
            setVessel(v);
            showToast(`Tu vaso ahora es ${v.label}`);
          }}
          onPickAndAdd={(v) => {
            setVessel(v);
            register(v, 'preset');
          }}
        />
      )}
    </Page>
  );
}
