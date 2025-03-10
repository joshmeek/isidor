import React from 'react';
import { Tabs, usePathname } from 'expo-router';
import { useColorScheme, Platform, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { spacing } from '@/constants/Spacing';

// Tab bar icon component
function TabBarIcon(props: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  size?: number;
}) {
  const { size = 24, ...rest } = props;
  return <Ionicons size={size} style={{ marginBottom: -3 }} {...rest} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const pathname = usePathname();
  
  console.log('TabLayout rendering, current path:', pathname);

  // Get colors from theme
  const colors = Colors[colorScheme as 'light' | 'dark'];
  const tabBackground = colors.tabBackground;
  const tabActiveTintColor = colors.primary;
  const tabInactiveTintColor = colors.tabIconDefault;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tabActiveTintColor,
        tabBarInactiveTintColor: tabInactiveTintColor,
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: 88,
          paddingBottom: Platform.OS === 'ios' ? 30 : 5,
          paddingTop: 10,
          backgroundColor: tabBackground,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -3 },
              shadowOpacity: 0.05,
              shadowRadius: 6,
            },
            android: {
              elevation: 8,
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
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon 
              name={focused ? "heart" : "heart-outline"} 
              color={color} 
              size={focused ? 26 : 24}
            />
          ),
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
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon 
              name={focused ? "person" : "person-outline"} 
              color={color} 
              size={focused ? 26 : 24}
            />
          ),
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