import { useRef, useState } from 'react';
import { Share, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Card, Copy, Disclaimer, Kicker, Page, Stat, Title } from '../components/ui';
import { colors, styles } from '../components/theme';
import { bacFromGrams } from '../lib/alcohol';
import { fmtMl, plural } from '../lib/format';
import { useActions, useApp } from '../state/store';
export function Recap() {
  const { profile, tragos, group } = useApp();
  const { closeNight, go, showToast } = useActions();
  const [sharing, setSharing] = useState(false);
  const closing = useRef(false);
  const grams = tragos.reduce((sum, t) => sum + t.grams, 0);
  const ml = tragos.reduce((sum, t) => sum + t.ml, 0);
  const close = () => {
    if (closing.current) return;
    closing.current = true;
    if (tragos.length)
      closeNight({
        peakBac: bacFromGrams(grams, profile.peso, profile.sexo),
        tragos: tragos.length,
        grams,
      });
    showToast(
      tragos.length ? 'Noche guardada en tu historial.' : 'No había registros para guardar.',
    );
    go('home');
  };
  return (
    <Page style={{ gap: 18 }}>
      <Kicker color={colors.amber}>Resumen de la noche</Kicker>
      <Title>Tu registro</Title>
      <LinearGradient
        colors={[colors.amber, '#DB8D25']}
        style={{ borderRadius: 22, padding: 22, gap: 10 }}
      >
        <Title style={{ color: colors.night, fontSize: 32 }}>Volvé con cuidado</Title>
        <Copy style={{ color: colors.night }}>Elegí una vuelta segura y acompañá a tu grupo.</Copy>
      </LinearGradient>
      <View style={styles.row}>
        <Stat value={tragos.length} label="Registros" />
        <Stat value={fmtMl(ml)} label="Volumen total" />
        <Stat value={Math.round(grams)} label="Alcohol · g" />
      </View>
      <Card>
        <Kicker>El detalle</Kicker>
        <Copy>
          {plural(
            new Set(tragos.map((t) => t.label)).size,
            'tipo de vaso registrado',
            'tipos de vaso registrados',
          )}{' '}
          en {group?.name ?? 'tu noche'}.
        </Copy>
        <Copy style={{ color: colors.muted }}>
          Cerrar la noche archiva los registros y limpia la pantalla actual. No significa que el
          alcohol se haya eliminado de tu cuerpo.
        </Copy>
      </Card>
      <Button
        variant="ink"
        disabled={sharing}
        onPress={async () => {
          setSharing(true);
          try {
            await Share.share({
              title: 'Tomate · mi registro',
              message: `Mi registro en Tomate: ${plural(tragos.length, 'bebida')}, ${fmtMl(ml)} en total. Si tomaste, no manejes.`,
            });
          } catch {
            showToast('No se pudo abrir el menú para compartir.');
          } finally {
            setSharing(false);
          }
        }}
      >
        {sharing ? 'Abriendo…' : 'Compartir resumen'}
      </Button>
      <Button onPress={close}>Guardar y cerrar noche</Button>
      <Button compact variant="ghost" onPress={() => go('home')}>
        Volver a mi registro
      </Button>
      <Disclaimer />
    </Page>
  );
}
