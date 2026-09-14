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
import { gramsOf, hoursToSober, levelOf } from '../lib/alcohol';
import {
  fmtAbv,
  fmtAgo,
  fmtBac,
  fmtClock,
  fmtGrams,
  fmtHours,
  fmtMl,
  pluralWord,
} from '../lib/format';
import type { Vessel } from '../lib/types';
import { useActions, useApp } from '../state/store';
import { requestUberRide } from '../lib/uber';
import { requestRescue } from '../lib/rescue';
import { useGroupStats } from '../state/selectors';
import { USING_MOCKS } from '../api/client';
export function Home() {
  const { profile, group, vessel, tragos } = useApp();
  const { go, setVessel, addTrago, undoTrago, restoreTrago, showToast } = useActions();
  const { bac, subiendo, total, now, previaDesde } = useGroupStats();
  // Cuándo volvés a cero contando lo que todavía tenés por absorber: es el dato
  // con el que se planifica la vuelta.
  const aCero = hoursToSober(bac + subiendo);
  const [sheet, setSheet] = useState(false);
  const [rideBusy, setRideBusy] = useState(false);
  const [rescueBusy, setRescueBusy] = useState(false);
  const level = levelOf(bac);
  const register = (v: Vessel = vessel, via: 'boton' | 'preset' = 'boton') => {
    const t = addTrago(v, via);
    showToast(`Registraste ${v.label}`, { undoId: t.id, hint: 'Si tomaste, no manejes.' });
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
        <Copy style={styles.small}>
          {tragos.length ? 'Inicio de tu registro' : 'El grupo arrancó'} ·{' '}
          {fmtClock(tragos.length ? tragos[0].at : previaDesde)}
        </Copy>
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
              {fmtBac(bac)} %
            </Title>
          </View>
          {subiendo > 0.005 && (
            <Copy style={{ color: colors.night, fontSize: 12 }}>
              ≈ {fmtBac(subiendo)} % pendiente de absorción
            </Copy>
          )}
          {aCero > 0 && (
            <Copy style={{ color: colors.night, fontSize: 12 }}>
              Volvés a cero en aproximadamente {fmtHours(aCero)}. No es una autorización para
              manejar.
            </Copy>
          )}
        </LinearGradient>
        <View style={styles.row}>
          <Stat value={tragos.length} label={pluralWord(tragos.length, 'Registro')} />
          <Stat value={total} label={pluralWord(total, 'Persona')} />
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
          <Copy style={{ color: colors.lime }}>{fmtGrams(gramsOf(vessel.ml, vessel.abv))}</Copy>
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
                  {fmtMl(t.ml)} · {fmtGrams(t.grams)} · {fmtAgo(t.at, now)}
                </Copy>
              </View>
              <Button
                compact
                variant="ghost"
                accessibilityLabel={`Eliminar ${t.label}`}
                onPress={() => {
                  undoTrago(t.id);
                  showToast(`Eliminaste ${t.label}`, { restore: t });
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
        <Button variant="dark" onPress={() => go('recap')}>
          Ver resumen y cerrar noche
        </Button>
        <Button
          variant="danger"
          disabled={rescueBusy}
          onPress={async () => {
            setRescueBusy(true);
            try {
              await requestRescue({ nombre: profile.nombre, groupCode: group?.code }, showToast);
            } finally {
              setRescueBusy(false);
            }
          }}
        >
          {rescueBusy ? 'Pidiendo ayuda…' : 'Solicitar rescate'}
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
