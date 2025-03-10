import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import api from '../services/api';
import { API_HOST, API_BASE_URL } from '../config/environment';

// Define the screens
const HomeScreen = () => {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check backend connection on app load
  useEffect(() => {
    const checkBackendConnection = async () => {
      try {
        // Try to connect to the backend health check endpoint
        // This is a simple GET request that doesn't require authentication
        await fetch(`http://${API_HOST}/api/v1/health`);
        setBackendStatus('connected');
        setErrorMessage(null);
      } catch (error) {
        setBackendStatus('error');
        setErrorMessage('Could not connect to backend. Make sure the backend server is running and API_HOST is set correctly.');
        console.error('Backend connection error:', error);
      }
    };

    checkBackendConnection();
  }, []);

  // Function to retry backend connection
  const retryConnection = () => {
    setBackendStatus('checking');
    setErrorMessage(null);
    
    // Trigger the useEffect again
    const checkBackendConnection = async () => {
      try {
        await fetch(`http://${API_HOST}/api/v1/health`);
        setBackendStatus('connected');
        setErrorMessage(null);
      } catch (error) {
        setBackendStatus('error');
        setErrorMessage('Could not connect to backend. Make sure the backend server is running and API_HOST is set correctly.');
        console.error('Backend connection error:', error);
      }
    };
    
    checkBackendConnection();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>ISIDOR</Text>
          <Text style={styles.subtitle}>AI-Driven Life Protocol System</Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome to Isidor</Text>
          <Text style={styles.cardText}>
            This is a minimal implementation to verify the build process on your iPhone.
            The app will help you optimize fitness, nutrition, sleep, and overall well-being.
          </Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Development Status</Text>
          <Text style={styles.cardText}>
            This is a development build. The full implementation will include:
            {'\n'}- HealthKit integration
            {'\n'}- AI-driven insights
            {'\n'}- Protocol management
            {'\n'}- Data visualization
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Backend Connection</Text>
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusIndicator, 
              backendStatus === 'connected' ? styles.statusConnected : 
              backendStatus === 'error' ? styles.statusError : 
              styles.statusChecking
            ]} />
            <Text style={styles.statusText}>
              {backendStatus === 'connected' ? 'Connected to backend' : 
               backendStatus === 'error' ? 'Connection error' : 
               'Checking connection...'}
            </Text>
          </View>
          <Text style={styles.apiHostText}>API Host: {API_HOST}</Text>
          {errorMessage && (
            <Text style={styles.errorText}>{errorMessage}</Text>
          )}
          {backendStatus === 'error' && (
            <TouchableOpacity style={styles.retryButton} onPress={retryConnection}>
              <Text style={styles.retryButtonText}>Retry Connection</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const ProfileScreen = () => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
    <Text>Profile Screen</Text>
  </View>
);

// Define the stack navigator
const Stack = createNativeStackNavigator();

// Main navigation component
export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ 
            title: 'Isidor',
            headerStyle: {
              backgroundColor: '#f5f5f7',
            },
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }} 
        />
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen} 
          options={{ title: 'My Profile' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  scrollContainer: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginVertical: 30,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1e1e1e',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginTop: 5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  cardText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusConnected: {
    backgroundColor: '#4CAF50',
  },
  statusError: {
    backgroundColor: '#F44336',
  },
  statusChecking: {
    backgroundColor: '#FFC107',
  },
  statusText: {
    fontSize: 16,
    color: '#555',
  },
  apiHostText: {
    fontSize: 14,
    color: '#777',
    marginTop: 5,
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    marginTop: 5,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
}); 