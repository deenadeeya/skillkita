// (tabs)/_layout.tsx
import { StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const TAB_RED = '#7A1F1F';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: TAB_RED,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '700',
        },
        headerShadowVisible: false,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.55)',
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: TAB_RED,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: 'rgba(255,255,255,0.12)',
          elevation: 0,
          shadowOpacity: 0,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'TRSC SkillKita',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}