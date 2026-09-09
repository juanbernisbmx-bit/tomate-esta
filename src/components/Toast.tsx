import { useEffect } from 'react';
import { View } from 'react-native';
import { Button, Copy } from './ui';
import { colors, styles } from './theme';
export function Toast({
  toast,
  onUndo,
  onClose,
  offset = 80,
}: {
  toast: { id: string; text: string; undoId?: string; hint?: string } | null;
  onUndo: (id: string) => void;
  onClose: () => void;
  offset?: number;
}) {
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(onClose, 6000);
    return () => clearTimeout(id);
  }, [toast, onClose]);
  if (!toast) return null;
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[
        styles.row,
        {
          position: 'absolute',
          bottom: offset,
          left: 14,
          right: 14,
          backgroundColor: colors.surface2,
          borderColor: colors.line,
          borderWidth: 1,
          borderRadius: 22,
          padding: 14,
        },
      ]}
    >
      <View style={styles.fill}>
        <Copy style={{ fontSize: 12 }}>{toast.text}</Copy>
        {toast.hint && <Copy style={{ fontSize: 11, color: colors.amber }}>{toast.hint}</Copy>}
      </View>
      {toast.undoId ? (
        <Button
          compact
          variant="dark"
          onPress={() => {
            onUndo(toast.undoId!);
            onClose();
          }}
        >
          Deshacer
        </Button>
      ) : (
        <Button compact variant="ghost" accessibilityLabel="Cerrar aviso" onPress={onClose}>
          ×
        </Button>
      )}
    </View>
  );
}
