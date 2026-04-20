import { ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';

const BRAND = {
  background: '#F5F1E8',
  primary: '#0001fc',
  accent: '#7A1F1F',
  card: '#ffffff',
};

type MenuItem = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onPress?: () => void | Promise<void>;
  group?: 'primary' | 'secondary';
};

const MENU_ITEMS: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'speedometer-outline', group: 'primary' },
  { id: 'courses', label: 'Courses', icon: 'school-outline', group: 'primary' },
  { id: 'experiences', label: 'Experiences', icon: 'images-outline', group: 'primary' },
  { id: 'about', label: 'About Centre', icon: 'information-circle-outline', group: 'primary' },
  { id: 'contact', label: 'Contact & Location', icon: 'call-outline', group: 'primary' },
  { id: 'faq', label: 'FAQ', icon: 'help-circle-outline', group: 'secondary' },
  { id: 'policies', label: 'Policies', icon: 'document-text-outline', group: 'secondary' },
];

export default function MenuScreen() {
  return (
    <ScrollView style={[styles.screen, { backgroundColor: BRAND.background }]} contentContainerStyle={styles.content}>
      <ThemedText style={[styles.title, { color: BRAND.primary }]}>TRSC SkillKita</ThemedText>
      <ThemedText style={styles.subtitle}>
        Quick access to key sections of Tawau Resources &amp; Skills Centre.
      </ThemedText>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Main</ThemedText>
        </View>

        {MENU_ITEMS.filter((item) => item.group !== 'secondary').map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            onPress={() => {
              // TODO: wire to matching screens when available
            }}
            style={({ pressed }) => [
              styles.itemRow,
              { backgroundColor: pressed ? 'rgba(0,0,0,0.04)' : 'transparent' },
            ]}>
            <View style={styles.itemLeft}>
              <View style={[styles.iconPill, { backgroundColor: 'rgba(0,1,252,0.06)' }]}>
                <Ionicons name={item.icon} size={18} color={BRAND.primary} />
              </View>
              <ThemedText style={styles.itemLabel}>{item.label}</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#A3A3A3" />
          </Pressable>
        ))}
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Support</ThemedText>
        </View>

        {MENU_ITEMS.filter((item) => item.group === 'secondary').map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            onPress={() => {
              // TODO: wire to matching screens when available
            }}
            style={({ pressed }) => [
              styles.itemRow,
              { backgroundColor: pressed ? 'rgba(0,0,0,0.04)' : 'transparent' },
            ]}>
            <View style={styles.itemLeft}>
              <View style={[styles.iconPill, { backgroundColor: 'rgba(122,31,31,0.06)' }]}>
                <Ionicons name={item.icon} size={18} color={BRAND.accent} />
              </View>
              <ThemedText style={styles.itemLabel}>{item.label}</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#A3A3A3" />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: '#5C5C5C',
    marginBottom: 18,
  },
  card: {
    backgroundColor: BRAND.card,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  sectionHeader: {
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    color: '#7A7A7A',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderRadius: 12,
    paddingHorizontal: 6,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconPill: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
});

