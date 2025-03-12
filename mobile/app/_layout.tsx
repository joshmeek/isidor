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
      // Check if user is already in the tabs directory
      const isInTabsDirectory = segments[0] === '(tabs)';
      // Check if user is on the protocol details or create protocol screen
      const isProtocolScreen = segments[0] === 'protocol-details' || segments[0] === 'create-protocol';
      
      console.log('Navigation check:', { 
        isAuthenticated, 
        isAuthScreen, 
        isInTabsDirectory, 
        isProtocolScreen,
        segments 
      });

      if (isAuthenticated && !isAuthScreen && !isInTabsDirectory && !isProtocolScreen) {
        // Only redirect to tabs if not already in tabs and not on protocol details or create protocol
        console.log('Redirecting to tabs');
        router.replace('/(tabs)');
      } else if (!isAuthenticated && !isAuthScreen) {
        // Redirect to login if not authenticated and not on an auth screen
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
    <>
      {isAuthenticated ? (
        <Stack initialRouteName="(tabs)">
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="protocol-details" 
            options={{ 
              headerShown: false,
              presentation: 'card' 
            }} 
          />
          <Stack.Screen 
            name="create-protocol" 
            options={{ 
              headerShown: false,
              presentation: 'card' 
            }} 
          />
        </Stack>
      ) : (
        // Non-authenticated user sees auth stack
        <Stack>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="network-check" options={{ headerShown: false }} />
        </Stack>
      )}
      <StatusBar style="auto" />
    </>
  );
}

// Tab bar icon component
function TabBarIcon(props: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}) {
  return <Ionicons size={24} style={{ marginBottom: -3 }} {...props} />;
}
