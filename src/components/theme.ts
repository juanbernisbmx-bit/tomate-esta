import { StyleSheet } from 'react-native';
export const colors = {
  night: '#0A0908',
  surface: '#141210',
  surface2: '#1C1916',
  ink: '#FAF7F2',
  muted: '#A39E95',
  line: '#302C27',
  lime: '#C6F24E',
  amber: '#FFB020',
  red: '#E8402A',
  violet: '#9B7BFF',
  sky: '#5AC8FA',
};
export const styles = StyleSheet.create({
  fill: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  stack: { gap: 14 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  section: { marginTop: 22, gap: 12 },
  small: { fontSize: 12, lineHeight: 18, color: colors.muted },
  center: { alignItems: 'center', justifyContent: 'center' },
  selected: { borderColor: colors.lime, backgroundColor: '#232A15' },
});
