import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Image, Linking, StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import {
  Button,
  Card,
  Chip,
  Copy,
  Disclaimer,
  GlassIcon,
  Kicker,
  NumberPicker,
  Page,
  Title,
} from '../components/ui';
import { colors, styles } from '../components/theme';
import { analyzeGlass, USING_MOCKS } from '../api/client';
import { DRINK_TYPES, ML_RANGE, clampAbv, drinkType } from '../lib/catalog';
import { gramsOf } from '../lib/alcohol';
import { fmtGrams, fmtMl, uid } from '../lib/format';
import type { DrinkKind, ScanResult, Vessel } from '../lib/types';
import { useActions, useApp } from '../state/store';
type Phase = 'kind' | 'camera' | 'analyzing' | 'result';
export function Scan() {
  const { vessel } = useApp();
  const { go, setVessel, addTrago, showToast } = useActions();
  const [phase, setPhase] = useState<Phase>('kind');
  const [kind, setKind] = useState<DrinkKind>(vessel.kind);
  const [abv, setAbv] = useState(() => clampAbv(vessel.kind, vessel.abv));
  const [ml, setMl] = useState(vessel.ml);
  const [photo, setPhoto] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [manual, setManual] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(AppState.currentState === 'active');
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const mounted = useRef(true);
  const busy = useRef(false);
  const saved = useRef(false);
  useEffect(() => {
    mounted.current = true;
    const sub = AppState.addEventListener('change', (s) => {
      setActive(s === 'active');
      setReady(false);
      if (s === 'active') void getPermission();
    });
    return () => {
      mounted.current = false;
      sub.remove();
    };
  }, [getPermission]);
  const manualEntry = () => {
    setManual(true);
    setError('');
    setResult(null);
    setPhoto(null);
    setPhase('result');
  };
  const shoot = async () => {
    if (busy.current || !ready || !camera.current) return;
    busy.current = true;
    setError('');
    try {
      const shot = await camera.current.takePictureAsync({ quality: 0.8 });
      if (!shot || !mounted.current) return;
      setPhase('analyzing');
      const context = ImageManipulator.manipulate(shot.uri);
      let rendered: Awaited<ReturnType<typeof context.renderAsync>> | null = null;
      let base64: string | null | undefined;
      try {
        context.resize({ width: Math.min(640, shot.width) });
        rendered = await context.renderAsync();
        base64 = (
          await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.7, base64: true })
        ).base64;
      } finally {
        // Si el redimensionado o el guardado fallan, las imágenes nativas hay
        // que soltarlas igual.
        rendered?.release();
        context.release();
      }
      if (!base64) throw new Error('No pudimos preparar la foto.');
      const data = `data:image/jpeg;base64,${base64}`;
      if (!mounted.current) return;
      setPhoto(data);
      const r = await analyzeGlass(data, kind);
      if (!mounted.current) return;
      setResult(r);
      setMl(r.ml);
      setAbv(clampAbv(kind, r.abv));
      setManual(false);
      setPhase('result');
    } catch (e) {
      if (mounted.current) {
        setError(e instanceof Error ? e.message : 'Falló el escaneo. Intentá de nuevo.');
        setReady(false);
        setPhase('camera');
      }
    } finally {
      busy.current = false;
    }
  };
  const save = (add: boolean) => {
    if (saved.current) return;
    saved.current = true;
    const v: Vessel = {
      id: uid('v'),
      label: manual
        ? `${drinkType(kind).label} ${fmtMl(ml)}`
        : (result?.vesselLabel ?? drinkType(kind).label),
      ml,
      kind,
      abv,
      source: manual || USING_MOCKS ? 'manual' : 'scan',
      photo: photo ?? undefined,
      confidence: !manual && !USING_MOCKS ? result?.confidence : undefined,
      hint: result?.note,
    };
    setVessel(v);
    if (add) {
      const t = addTrago(v, manual ? 'preset' : 'scan');
      showToast(`Registraste ${v.label}`, { undoId: t.id, hint: 'Si tomaste, no manejes.' });
    } else showToast(`Tu vaso ahora es ${v.label}`);
    go('home');
  };
  return (
    <Page style={{ gap: 18 }}>
      <View style={styles.between}>
        <Kicker color={colors.amber}>
          {phase === 'kind'
            ? 'Paso 1 · Bebida'
            : phase === 'result'
              ? 'Revisá las medidas'
              : 'Paso 2 · Foto'}
        </Kicker>
        <Button compact variant="ghost" onPress={() => go('home')}>
          Cancelar
        </Button>
      </View>
      <Title>
        {phase === 'kind' ? '¿Qué estás tomando?' : phase === 'result' ? 'Tu vaso' : 'Foto al vaso'}
      </Title>
      {USING_MOCKS && (
        <Copy style={{ color: colors.amber }}>Demo: el análisis es simulado, no mide la foto.</Copy>
      )}
      {phase === 'kind' && (
        <>
          <Copy style={{ color: colors.muted }}>
            La bebida define la graduación sugerida. Una foto no permite conocer cuánto alcohol
            contiene.
          </Copy>
          <View style={styles.stack}>
            {DRINK_TYPES.map((d) => (
              <Card key={d.id} style={kind === d.id ? styles.selected : undefined}>
                <View style={styles.row}>
                  <GlassIcon kind={d.id} />
                  <View style={styles.fill}>
                    <Button
                      variant={kind === d.id ? 'lime' : 'dark'}
                      onPress={() => {
                        setKind(d.id);
                        setAbv(d.abv);
                        setMl(d.ml);
                      }}
                    >
                      {d.label}
                    </Button>
                    <Copy style={styles.small}>{d.hint}</Copy>
                  </View>
                </View>
              </Card>
            ))}
          </View>
          <Button
            onPress={() => {
              setReady(false);
              setPhase('camera');
            }}
          >
            Seguir con la foto
          </Button>
          <Button variant="dark" onPress={manualEntry}>
            Ingresar medidas a mano
          </Button>
        </>
      )}
      {(phase === 'camera' || phase === 'analyzing') && (
        <>
          <Copy style={{ color: colors.muted }}>
            Encuadrá el recipiente completo, con buena luz. Bebida:{' '}
            {drinkType(kind).label.toLowerCase()}.
          </Copy>
          <View
            style={{
              height: 340,
              borderRadius: 24,
              overflow: 'hidden',
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.line,
            }}
          >
            {phase === 'camera' && permission?.granted && active ? (
              <CameraView
                key={error}
                ref={camera}
                facing="back"
                mode="picture"
                autofocus="on"
                style={StyleSheet.absoluteFill}
                onCameraReady={() => setReady(true)}
                onMountError={() => {
                  setReady(false);
                  setError('La cámara no está disponible. Podés cargar las medidas a mano.');
                }}
              />
            ) : (
              <View style={[styles.fill, styles.center, { padding: 24, gap: 20 }]}>
                {phase === 'analyzing' ? (
                  <>
                    <ActivityIndicator size="large" color={colors.lime} />
                    <Copy>Analizando el vaso…</Copy>
                  </>
                ) : (
                  <>
                    <GlassIcon kind={kind} size={110} />
                    <Copy style={{ textAlign: 'center' }}>
                      {permission?.granted
                        ? 'La cámara se activa al volver a la app.'
                        : 'Habilitá la cámara para fotografiar tu vaso.'}
                    </Copy>
                  </>
                )}
              </View>
            )}
          </View>
          {error ? (
            <Copy accessibilityRole="alert" style={{ color: colors.amber }}>
              {error}
            </Copy>
          ) : null}
          {phase === 'camera' && (
            <>
              {!permission?.granted ? (
                <Button
                  onPress={async () => {
                    try {
                      if (permission?.canAskAgain === false) await Linking.openSettings();
                      else await requestPermission();
                    } catch {
                      setError('No pudimos abrir los permisos de cámara.');
                    }
                  }}
                >
                  {permission?.canAskAgain === false ? 'Abrir ajustes' : 'Permitir cámara'}
                </Button>
              ) : (
                <Button disabled={!ready || !active} onPress={() => void shoot()}>
                  Sacar foto
                </Button>
              )}
              <Button variant="dark" onPress={manualEntry}>
                Ingresar medidas a mano
              </Button>
              <Button
                compact
                variant="ghost"
                onPress={() => {
                  setError('');
                  setPhase('kind');
                }}
              >
                Cambiar bebida
              </Button>
            </>
          )}
        </>
      )}
      {phase === 'result' && (
        <>
          {photo && (
            <Image
              source={{ uri: photo }}
              style={{ height: 200, borderRadius: 20 }}
              resizeMode="cover"
              accessibilityLabel="Foto del vaso capturado"
            />
          )}
          <Card>
            <Title style={{ fontSize: 26, lineHeight: 34 }}>
              {manual ? 'Medidas manuales' : result?.vesselLabel}
            </Title>
            <Copy style={styles.small}>
              {manual
                ? 'Cargá el volumen consumido y la graduación indicada en la etiqueta.'
                : result?.note}
            </Copy>
            {!manual && !USING_MOCKS && (
              <Copy style={styles.small}>
                Confianza del modelo: {result?.confidence} %. No garantiza precisión.
              </Copy>
            )}
          </Card>
          <NumberPicker
            label="Volumen en ml"
            min={ML_RANGE[0]}
            max={ML_RANGE[1]}
            step={5}
            value={ml}
            onChange={setMl}
          />
          <View style={styles.wrap}>
            {[45, 150, 330, 473, 500, 1000].map((v) => (
              <Chip key={v} active={ml === v} onPress={() => setMl(v)}>
                {fmtMl(v)}
              </Chip>
            ))}
          </View>
          <NumberPicker
            label="Graduación % vol"
            min={drinkType(kind).abvRange[0]}
            max={drinkType(kind).abvRange[1]}
            step={0.5}
            value={abv}
            onChange={setAbv}
          />
          <Card>
            <Kicker>Alcohol puro estimado</Kicker>
            <Title style={{ color: colors.amber }}>{fmtGrams(gramsOf(ml, abv))}</Title>
          </Card>
          <Button onPress={() => save(true)}>Guardar y registrar</Button>
          <Button variant="dark" onPress={() => save(false)}>
            Solo usar como mi vaso
          </Button>
          <Button
            compact
            variant="ghost"
            onPress={() => {
              setError('');
              setReady(false);
              setPhoto(null);
              setResult(null);
              setManual(false);
              setPhase('camera');
            }}
          >
            {photo ? 'Volver a sacar foto' : 'Sacar una foto del vaso'}
          </Button>
          <Disclaimer />
        </>
      )}
    </Page>
  );
}
