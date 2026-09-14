import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Button, Card, Copy, Disclaimer, Input, Kicker, Page, Title } from '../components/ui';
import { colors } from '../components/theme';
import { login, register, USING_MOCKS } from '../api/client';
import { useActions } from '../state/store';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Pantalla de login/registro. Es SOLO frontend por ahora: valida los datos y
 * llama a `login`/`register` de `api/client.ts`, pero esas funciones no pegan
 * a ningún backend real hasta que exista `EXPO_PUBLIC_API_URL` — mientras
 * tanto simulan éxito para poder probar el flujo completo.
 */
export function Login() {
  const { go, showToast } = useActions();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (loading) return;
    setError('');
    if (!EMAIL_RE.test(email.trim())) {
      setError('Ingresá un email válido.');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña necesita al menos 8 caracteres.');
      return;
    }
    if (mode === 'register' && password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') await login(email.trim(), password);
      else await register(email.trim(), password);
      showToast(mode === 'login' ? 'Sesión iniciada' : 'Cuenta creada', {
        hint: USING_MOCKS ? 'Demo local: todavía no hay backend conectado.' : undefined,
      });
      go('profile');
    } catch {
      setError(
        mode === 'login'
          ? 'No pudimos iniciar sesión. Revisá tus datos o tu conexión.'
          : 'No pudimos crear la cuenta. Intentá de nuevo.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page style={{ gap: 20 }}>
      <Kicker color={colors.amber}>Tu cuenta</Kicker>
      <Title>{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</Title>
      <Copy style={{ color: colors.muted }}>
        {mode === 'login'
          ? 'Entrá con tu email y tu contraseña.'
          : 'Registrate para sincronizar tu perfil entre dispositivos.'}
      </Copy>

      {USING_MOCKS && (
        <Card>
          <Copy style={{ color: colors.amber }}>
            Modo demo: todavía no hay backend conectado. Esta pantalla valida los datos, pero no
            crea una cuenta real todavía.
          </Copy>
        </Card>
      )}

      <View style={{ gap: 12 }}>
        <Input
          accessibilityLabel="Email"
          placeholder="tu@email.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
        />
        <Input
          accessibilityLabel="Contraseña"
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType={mode === 'login' ? 'password' : 'newPassword'}
        />
        {mode === 'register' && (
          <Input
            accessibilityLabel="Confirmar contraseña"
            placeholder="Repetí la contraseña"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            textContentType="newPassword"
          />
        )}
      </View>

      {error ? (
        <Copy accessibilityRole="alert" style={{ color: colors.amber }}>
          {error}
        </Copy>
      ) : null}

      {loading && <ActivityIndicator color={colors.lime} />}

      <Button disabled={loading} onPress={() => void submit()}>
        {loading
          ? mode === 'login'
            ? 'Ingresando…'
            : 'Creando cuenta…'
          : mode === 'login'
            ? 'Iniciar sesión'
            : 'Crear cuenta'}
      </Button>

      <Button
        compact
        variant="ghost"
        disabled={loading}
        onPress={() => {
          setError('');
          setMode(mode === 'login' ? 'register' : 'login');
        }}
      >
        {mode === 'login' ? '¿No tenés cuenta? Creála' : '¿Ya tenés cuenta? Iniciá sesión'}
      </Button>

      <Button compact variant="ghost" disabled={loading} onPress={() => go('profile')}>
        Volver
      </Button>

      <Disclaimer />
    </Page>
  );
}
