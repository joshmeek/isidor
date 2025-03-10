import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet } from 'react-native';
import { TabBarBackground } from '@/components/ui';
import { useThemeColor } from '@/hooks/useThemeColor';

// Tab bar icon component
function TabBarIcon(props: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  size?: number;
}) {
  return <Ionicons size={props.size || 24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  // Get theme colors
  const tabBackground = useThemeColor({}, 'tabBackground') as string;
  const tabIconDefault = useThemeColor({}, 'tabIconDefault') as string;
  const tabIconSelected = useThemeColor({}, 'tabIconSelected') as string;
  const cardBorder = useThemeColor({}, 'cardBorder') as string;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tabIconSelected,
        tabBarInactiveTintColor: tabIconDefault,
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: cardBorder,
          backgroundColor: tabBackground,
          height: 88,
          paddingBottom: 34,
          paddingTop: 8,
          ...Platform.select({
            ios: {
              shadowColor: 'rgba(0, 0, 0, 0.05)',
              shadowOffset: { width: 0, height: -3 },
              shadowOpacity: 1,
              shadowRadius: 4,
            },
            android: {
              elevation: 4,
            },
          }),
        },
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon 
              name={focused ? "analytics" : "analytics-outline"} 
              color={color} 
              size={focused ? 26 : 24}
            />
          ),
          tabBarLabel: 'Dashboard',
        }}
        listeners={{
          tabPress: e => {
            console.log('Dashboard tab pressed');
          },
        }}
      />
      <Tabs.Screen
        name="protocols"
        options={{
          title: 'Protocols',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon 
              name={focused ? "list" : "list-outline"} 
              color={color} 
              size={focused ? 26 : 24}
            />
          ),
          tabBarLabel: 'Protocols',
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          title: 'Health',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon 
              name={focused ? "heart" : "heart-outline"} 
              color={color} 
              size={focused ? 26 : 24}
            />
          ),
          tabBarLabel: 'Health',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon 
              name={focused ? "person" : "person-outline"} 
              color={color} 
              size={focused ? 26 : 24}
            />
          ),
          tabBarLabel: 'Profile',
        }}
      />
    </Tabs>
  );
} 