import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextProps,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors, styles } from './theme';

export function Copy({ style, ...props }: TextProps) {
  return (
    <Text
      {...props}
      style={[
        { fontFamily: 'SpaceGrotesk', color: colors.ink, fontSize: 14, lineHeight: 21 },
        style,
      ]}
    />
  );
}
export function Title({ style, ...props }: TextProps) {
  return (
    <Text
      accessibilityRole="header"
      {...props}
      style={[
        {
          fontFamily: 'Anton',
          color: colors.ink,
          fontSize: 38,
          lineHeight: 46,
          textTransform: 'uppercase',
        },
        style,
      ]}
    />
  );
}
export function Kicker({
  children,
  color = colors.muted,
}: {
  children: ReactNode;
  color?: string;
}) {
  return (
    <Copy style={{ color, fontSize: 11, letterSpacing: 1.8, textTransform: 'uppercase' }}>
      {children}
    </Copy>
  );
}
export function Button({
  children,
  onPress,
  variant = 'lime',
  disabled,
  compact,
  style,
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress: () => void;
  variant?: 'lime' | 'amber' | 'dark' | 'ghost' | 'danger' | 'ink';
  disabled?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const bg = {
    lime: colors.lime,
    amber: colors.amber,
    dark: colors.surface,
    ghost: 'transparent',
    danger: colors.red,
    ink: colors.ink,
  }[variant];
  const fg = ['lime', 'amber', 'ink'].includes(variant) ? colors.night : colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          borderRadius: 30,
          minHeight: 46,
          paddingVertical: compact ? 11 : 16,
          paddingHorizontal: compact ? 16 : 22,
          alignItems: 'center',
          justifyContent: 'center',
          borderColor: variant === 'dark' ? colors.line : 'transparent',
          borderWidth: 1,
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <Text
        style={{
          color: fg,
          fontFamily: compact ? 'SpaceGrotesk' : 'Anton',
          fontSize: compact ? 13 : 20,
          textAlign: 'center',
        }}
      >
        {children}
      </Text>
    </Pressable>
  );
}
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View
      style={[
        {
          padding: 16,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: 18,
          gap: 10,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function Stat({
  value,
  label,
  color = colors.ink,
}: {
  value: ReactNode;
  label: string;
  color?: string;
}) {
  return (
    <Card style={{ flex: 1, minWidth: 0, padding: 12, alignSelf: 'stretch' }}>
      <Title style={{ fontSize: 27, lineHeight: 34, color }}>{value}</Title>
      <Kicker>{label}</Kicker>
    </Card>
  );
}
export function Page({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.fill}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[{ padding: 22, paddingBottom: 32, flexGrow: 1 }, style]}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
export function Input({ style, ...props }: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.muted}
      selectionColor={colors.lime}
      {...props}
      style={[
        {
          borderWidth: 1,
          borderColor: colors.line,
          backgroundColor: colors.surface,
          borderRadius: 14,
          padding: 15,
          color: colors.ink,
          fontFamily: 'SpaceGrotesk',
          fontSize: 17,
          minHeight: 52,
        },
        style,
      ]}
    />
  );
}
export function Chip({
  active,
  children,
  onPress,
}: {
  active?: boolean;
  children: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={({ pressed }) => ({
        minHeight: 44,
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 24,
        backgroundColor: active ? colors.ink : colors.surface,
        borderWidth: 1,
        borderColor: colors.line,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Copy style={{ color: active ? colors.night : colors.ink, fontSize: 12 }}>{children}</Copy>
    </Pressable>
  );
}
export function NumberPicker({
  value,
  min,
  max,
  step = 1,
  label,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  label: string;
  onChange: (value: number) => void;
}) {
  return (
    <View style={{ gap: 8 }}>
      <View style={styles.between}>
        <Kicker>{label}</Kicker>
        <Title style={{ color: colors.lime, fontSize: 32 }}>{value.toLocaleString('es-AR')}</Title>
      </View>
      <View style={styles.row}>
        <Button
          compact
          variant="dark"
          accessibilityLabel={`Disminuir ${label}`}
          disabled={value <= min}
          onPress={() => onChange(Math.max(min, value - step))}
        >
          −
        </Button>
        <Slider
          style={{ flex: 1, height: 44 }}
          minimumValue={min}
          maximumValue={max}
          step={step}
          value={value}
          onValueChange={onChange}
          minimumTrackTintColor={colors.lime}
          maximumTrackTintColor={colors.line}
          thumbTintColor={colors.lime}
          accessibilityLabel={label}
        />
        <Button
          compact
          variant="dark"
          accessibilityLabel={`Aumentar ${label}`}
          disabled={value >= max}
          onPress={() => onChange(Math.min(max, value + step))}
        >
          +
        </Button>
      </View>
    </View>
  );
}
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000099' }}>
        <Pressable
          accessibilityLabel="Cerrar"
          accessibilityRole="button"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ height: '90%' }}
        >
          <View
            accessibilityViewIsModal
            style={{
              flex: 1,
              backgroundColor: colors.night,
              borderTopLeftRadius: 26,
              borderTopRightRadius: 26,
              paddingBottom: insets.bottom,
            }}
          >
            <View style={[styles.between, { padding: 20 }]}>
              <Title style={{ flex: 1, fontSize: 25, lineHeight: 32 }}>{title}</Title>
              <Button compact variant="dark" onPress={onClose}>
                Cerrar
              </Button>
            </View>
            <ScrollView
              style={{ flex: 1 }}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ padding: 20, paddingTop: 0, gap: 12 }}
            >
              {children}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
export function Disclaimer() {
  return (
    <Copy style={[styles.small, { marginTop: 18, textAlign: 'center' }]}>
      Estimación orientativa, no una medición ni un consejo médico. No permite decidir si podés
      manejar. Si tomaste, no manejes.
    </Copy>
  );
}
export function GlassIcon({ kind, size = 44 }: { kind: string; size?: number }) {
  const fill =
    (
      {
        cerveza: colors.amber,
        trago: colors.red,
        vino: colors.violet,
        shot: colors.lime,
      } as Record<string, string>
    )[kind] ?? colors.sky;
  return (
    <Svg width={size * 0.72} height={size} viewBox="0 0 32 44">
      {kind === 'vino' || kind === 'espumante' ? (
        <>
          <Path d="M7 4h18l-2 14a7 7 0 0 1-14 0L7 4Z" fill="#ffffff18" stroke="#ffffff66" />
          <Path d="M8.6 10h14.8l-1.3 8a7 7 0 0 1-12.2 0L8.6 10Z" fill={fill} />
          <Path d="M16 25v13M11 39h10" stroke="#ffffff66" strokeWidth={1.6} />
        </>
      ) : (
        <>
          <Rect
            x={6}
            y={kind === 'shot' ? 16 : 4}
            width={20}
            height={kind === 'shot' ? 24 : 36}
            rx={4}
            fill="#ffffff18"
            stroke="#ffffff66"
          />
          <Rect
            x={8}
            y={kind === 'shot' ? 25 : 15}
            width={16}
            height={kind === 'shot' ? 13 : 23}
            rx={3}
            fill={fill}
          />
          <Rect x={8} y={kind === 'shot' ? 25 : 15} width={16} height={4} rx={2} fill="#ffffff88" />
        </>
      )}
    </Svg>
  );
}
export function CameraIcon({ size = 24, color = colors.night }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 8a2 2 0 0 1 2-2h3l1-2h6l1 2h3a2 2 0 0 1 2 2v11H3V8Z"
        stroke={color}
        strokeWidth={2}
      />
      <Circle cx={12} cy={12.5} r={3.5} stroke={color} strokeWidth={2} />
    </Svg>
  );
}
export { SafeAreaView };
