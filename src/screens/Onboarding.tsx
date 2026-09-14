import { useState } from 'react';
import { View } from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import {
  Button,
  Card,
  Copy,
  Disclaimer,
  Kicker,
  NumberPicker,
  Page,
  Title,
} from '../components/ui';
import { colors, styles } from '../components/theme';
import type { Profile, Sexo } from '../lib/types';
const SEXOS: { id: Sexo; label: string; hint: string }[] = [
  { id: 'H', label: 'Hombre', hint: 'Factor de distribución 0,68' },
  { id: 'M', label: 'Mujer', hint: 'Factor de distribución 0,55' },
  { id: 'X', label: 'Prefiero no decir', hint: 'Usamos un promedio de 0,615' },
];
export function Onboarding({
  profile,
  onChange,
  onDone,
  onExit,
}: {
  profile: Profile;
  onChange: (patch: Partial<Profile>) => void;
  onDone: () => void;
  onExit: () => void;
}) {
  const [step, setStep] = useState(0);
  const [adult, setAdult] = useState(false);
  const [busy, setBusy] = useState(false);
  const [, requestPermission] = useCameraPermissions();
  const titles = ['Tu peso', 'Sexo', 'Edad', 'Foto al vaso'];
  const hints = [
    'El peso se usa en la estimación. Podés ajustarlo desde tu perfil.',
    'Este dato aproxima el agua corporal. No se muestra a otros integrantes.',
    'Tomate es para mayores de 18 años.',
    'Elegís la bebida y sacás una foto. También pedimos tu ubicación una sola vez, para "Pedir un Uber" y "Solicitar rescate" más adelante.',
  ];
  const next = async () => {
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    setBusy(true);
    try {
      // Se piden juntas, una sola vez, acá al final del onboarding: así "Pedir
      // un Uber" y "Solicitar rescate" ya tienen el permiso de ubicación
      // concedido de entrada y no lo vuelven a preguntar más adelante.
      await Promise.allSettled([requestPermission(), Location.requestForegroundPermissionsAsync()]);
    } finally {
      setBusy(false);
      onDone();
    }
  };
  return (
    <Page style={{ gap: 22 }}>
      <View style={styles.row}>
        <Button compact variant="dark" onPress={() => (step ? setStep(step - 1) : onExit())}>
          Atrás
        </Button>
        <View style={[styles.row, styles.fill]}>
          {titles.map((t, i) => (
            <View
              key={t}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 4,
                backgroundColor: i <= step ? colors.lime : colors.line,
              }}
            />
          ))}
        </View>
        <Copy>{step + 1}/4</Copy>
      </View>
      <View style={{ gap: 8 }}>
        <Kicker color={colors.amber}>Calibración · paso {step + 1}</Kicker>
        <Title>{titles[step]}</Title>
        <Copy style={{ color: colors.muted }}>{hints[step]}</Copy>
      </View>
      {step === 0 && (
        <Card>
          <NumberPicker
            label="Peso en kg"
            value={profile.peso}
            min={40}
            max={200}
            onChange={(peso) => onChange({ peso })}
          />
        </Card>
      )}
      {step === 1 && (
        <View style={styles.stack}>
          {SEXOS.map((s) => (
            <Card key={s.id} style={profile.sexo === s.id ? styles.selected : undefined}>
              <Button
                variant={profile.sexo === s.id ? 'lime' : 'dark'}
                onPress={() => onChange({ sexo: s.id })}
              >
                {s.label}
              </Button>
              <Copy style={styles.small}>{s.hint}</Copy>
            </Card>
          ))}
        </View>
      )}
      {step === 2 && (
        <View style={styles.stack}>
          <NumberPicker
            label="Edad en años"
            value={profile.edad}
            min={18}
            max={99}
            onChange={(edad) => onChange({ edad })}
          />
          <Button compact variant={adult ? 'lime' : 'dark'} onPress={() => setAdult(!adult)}>
            {adult ? '✓ Confirmo que soy mayor de 18' : 'Confirmar que soy mayor de 18'}
          </Button>
        </View>
      )}
      {step === 3 && (
        <Card>
          <Copy>1. Elegís qué estás tomando.</Copy>
          <Copy>2. Fotografías el recipiente completo.</Copy>
          <Copy>3. Revisás las medidas y guardás tu vaso predeterminado.</Copy>
          <Copy style={styles.small}>
            También vamos a pedirte la ubicación, para "Pedir un Uber" y "Solicitar rescate" sin
            preguntar de nuevo cada vez. Ambos permisos son opcionales: podés cargar medidas a
            mano y seguir usando la app sin ubicación.
          </Copy>
        </Card>
      )}
      <View style={{ flex: 1 }} />
      <Disclaimer />
      <Button disabled={busy || (step === 2 && !adult)} onPress={() => void next()}>
        {busy ? 'Abriendo permisos…' : step === 3 ? 'Permitir cámara y ubicación' : 'Seguir'}
      </Button>
      {step === 3 && (
        <Button compact variant="ghost" disabled={busy} onPress={onDone}>
          Ahora no
        </Button>
      )}
    </Page>
  );
}
