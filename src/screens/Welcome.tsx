import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Copy, Disclaimer, Page, Title } from '../components/ui';
import { colors } from '../components/theme';
export function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <Page style={{ justifyContent: 'flex-end', gap: 22 }}>
      <View style={{ flex: 1, minHeight: 160, justifyContent: 'center' }}>
        <LinearGradient
          colors={[colors.amber, '#C97A06']}
          style={{ width: 94, height: 124, borderRadius: 16, padding: 7 }}
        >
          <View style={{ height: 35, borderRadius: 7, backgroundColor: colors.ink }} />
          <View
            style={{ marginTop: 6, height: 5, backgroundColor: '#00000022', borderRadius: 5 }}
          />
        </LinearGradient>
      </View>
      <Title style={{ fontSize: 76, lineHeight: 86 }}>
        Tomate<Title style={{ fontSize: 76, color: colors.red }}>.</Title>
      </Title>
      <Copy style={{ color: colors.muted, fontSize: 16, lineHeight: 25, maxWidth: 330 }}>
        Registrá lo que tomás, conocé tus estimaciones y cuidá la vuelta con tu grupo.
      </Copy>
      <Button onPress={onStart}>Empezar mi registro</Button>
      <Disclaimer />
    </Page>
  );
}
