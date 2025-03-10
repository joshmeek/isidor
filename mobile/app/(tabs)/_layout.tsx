import React from 'react';
import { Tabs, usePathname } from 'expo-router';
import { useColorScheme, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

// Tab bar icon component
function TabBarIcon(props: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}) {
  return <Ionicons size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const pathname = usePathname();
  
  console.log('TabLayout rendering, current path:', pathname);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme as 'light' | 'dark'].tint,
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: 60,
          paddingBottom: Platform.OS === 'ios' ? 10 : 5,
        },
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <TabBarIcon name="analytics-outline" color={color} />,
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
          tabBarIcon: ({ color }) => <TabBarIcon name="list-outline" color={color} />,
          tabBarLabel: 'Protocols',
        }}
        listeners={{
          tabPress: e => {
            console.log('Protocols tab pressed');
          },
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          title: 'Health',
          tabBarIcon: ({ color }) => <TabBarIcon name="heart-outline" color={color} />,
          tabBarLabel: 'Health',
        }}
        listeners={{
          tabPress: e => {
            console.log('Health tab pressed');
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabBarIcon name="person-outline" color={color} />,
          tabBarLabel: 'Profile',
        }}
        listeners={{
          tabPress: e => {
            console.log('Profile tab pressed');
          },
        }}
      />
    </Tabs>
  );
} 