import React, { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Root layout with auth provider
export default function RootLayout() {
  const [loaded, error] = useFonts({
    // Add your custom fonts here
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

// Navigation component that handles auth state
function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const colorScheme = useColorScheme() ?? 'light';

  console.log('RootLayoutNav - Auth state:', { isAuthenticated, isLoading, segments });

  useEffect(() => {
    if (!isLoading) {
      // Check if the user is on an auth screen
      const isAuthScreen = segments[0] === 'login' || segments[0] === 'network-check';
      // Check if user is on a valid non-tab screen
      const isValidScreen = ['profile', 'protocol-details', 'create-protocol'].includes(segments[0] || '');
      
      console.log('Navigation check:', { 
        isAuthenticated, 
        isAuthScreen,
        isValidScreen,
        segments 
      });

      if (isAuthenticated) {
        if (isAuthScreen) {
          // If authenticated and on auth screen, redirect to tabs
          console.log('Redirecting from auth screen to tabs');
          router.replace('/(tabs)');
        }
      } else if (!isAuthScreen) {
        // If not authenticated and not on auth screen, redirect to login
        console.log('Redirecting to login');
        router.replace('/login');
      }
    }
  }, [isAuthenticated, isLoading, segments, router]);

  if (isLoading) {
    // Show loading screen while checking auth state
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen
        name="(tabs)"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="profile"
        options={{ 
          headerShown: false,
          presentation: 'modal'
        }}
      />
      <Stack.Screen
        name="protocol-details"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="create-protocol"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="network-check"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="login"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}

// Tab bar icon component
function TabBarIcon(props: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}) {
  return <Ionicons size={24} style={{ marginBottom: -3 }} {...props} />;
}
