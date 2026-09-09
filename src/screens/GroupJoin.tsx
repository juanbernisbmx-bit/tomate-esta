import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Button, Card, Copy, Input, Kicker, Page, Title } from '../components/ui';
import { colors, styles } from '../components/theme';
import { createGroup, fetchGroup, USING_MOCKS } from '../api/client';
import type { Group } from '../lib/types';
export function GroupJoin({ onJoin, onSkip }: { onJoin: (g: Group) => void; onSkip: () => void }) {
  const [code, setCode] = useState(USING_MOCKS ? 'TMT4' : '');
  const [name, setName] = useState('Mi grupo');
  const [found, setFound] = useState<Group | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  useEffect(() => {
    let cancelled = false;
    setFound(null);
    setError('');
    setLoading(code.length === 4);
    if (code.length !== 4) return;
    const timer = setTimeout(() => {
      fetchGroup(code)
        .then((g) => {
          if (!cancelled) setFound(g);
        })
        .catch(() => {
          if (!cancelled) setError('No encontramos el grupo. Revisá el código y tu conexión.');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [code]);
  const create = async () => {
    if (creating) return;
    setCreating(true);
    setError('');
    try {
      const g = await createGroup(name.trim() || 'Mi grupo');
      if (active.current) onJoin(g);
    } catch {
      if (active.current) setError('No pudimos crear el grupo. Intentá de nuevo.');
    } finally {
      if (active.current) setCreating(false);
    }
  };
  return (
    <Page style={{ gap: 20 }}>
      <Kicker color={colors.amber}>Juntos, con cuidado</Kicker>
      <Title>Tu grupo</Title>
      <Copy style={{ color: colors.muted }}>
        Unite con el código que comparte tu grupo o llevá tu registro personal.
      </Copy>
      {USING_MOCKS && (
        <Card>
          <Copy style={{ color: colors.amber }}>
            Modo demo: los integrantes son de ejemplo. No se comparte información con otras
            personas.
          </Copy>
        </Card>
      )}
      <Input
        accessibilityLabel="Código del grupo"
        placeholder="CÓDIGO"
        value={code}
        maxLength={4}
        autoCapitalize="characters"
        autoCorrect={false}
        style={{ textAlign: 'center', fontSize: 32, letterSpacing: 14 }}
        onChangeText={(s) => {
          setFound(null);
          setCode(
            s
              .toUpperCase()
              .replace(/[^A-Z0-9]/g, '')
              .slice(0, 4),
          );
        }}
      />
      {loading && <ActivityIndicator color={colors.lime} />}
      {found && (
        <Card>
          <Kicker>Grupo encontrado</Kicker>
          <Title style={{ fontSize: 26 }}>{found.name}</Title>
          <Copy>{found.members.length + 1} integrantes</Copy>
        </Card>
      )}
      {error ? (
        <Copy accessibilityRole="alert" style={{ color: colors.amber }}>
          {error}
        </Copy>
      ) : null}
      <Button disabled={!found || loading || creating} onPress={() => found && onJoin(found)}>
        Unirme
      </Button>
      <View style={styles.section}>
        <Kicker>Crear un grupo</Kicker>
        <Input
          accessibilityLabel="Nombre del nuevo grupo"
          value={name}
          maxLength={40}
          onChangeText={setName}
        />
        <Button variant="dark" disabled={creating || !name.trim()} onPress={() => void create()}>
          {creating ? 'Creando…' : 'Crear grupo'}
        </Button>
      </View>
      <Button compact variant="ghost" disabled={creating} onPress={onSkip}>
        Seguir con mi registro
      </Button>
    </Page>
  );
}
