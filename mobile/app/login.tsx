import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, Text } from 'react-native';
import { router, useNavigation } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import * as api from '@/services/api';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearError, isAuthenticated } = useAuth();
  const navigation = useNavigation();
  const [networkError, setNetworkError] = useState<string | null>(null);

  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated]);

  // Check API connectivity on mount
  useEffect(() => {
    const checkConnectivity = async () => {
      try {
        // First check if the API is reachable at all
        const apiHealthy = await api.checkApiHealth();
        
        if (!apiHealthy) {
          setNetworkError('Cannot connect to the API server. Please check your network settings and make sure the backend is running.');
          return;
        }
        
        // Then check if authentication endpoints are working
        const isConnected = await api.checkApiConnectivity();
        if (!isConnected) {
          setNetworkError('Connected to API but authentication endpoints are not available. Please check your backend configuration.');
        } else {
          setNetworkError(null);
        }
      } catch (err) {
        setNetworkError('Error checking API connectivity. Please check your network settings.');
      }
    };

    checkConnectivity();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setNetworkError(null);

    try {
      await login(email, password);
      // Navigation is handled by the auth effect above
    } catch (err) {
      // Check if it's a network error
      if (err instanceof Error && err.message.includes('Network request failed')) {
        setNetworkError('Network error. Please check your connection and API settings.');
      }
      // Other errors are handled in the auth context
      console.error('Login failed:', err);
    }
  };

  const goToNetworkCheck = () => {
    router.push('/network-check');
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Isidor</ThemedText>
        <ThemedText style={styles.subtitle}>AI-Driven Life Protocol System</ThemedText>
      </ThemedView>

      <ThemedView style={styles.form}>
        <ThemedText type="subtitle">Login</ThemedText>
        
        {error && (
          <ThemedView style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </ThemedView>
        )}

        {networkError && (
          <ThemedView style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>{networkError}</ThemedText>
            <TouchableOpacity onPress={goToNetworkCheck}>
              <ThemedText style={styles.linkText}>Check Network Settings</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!isLoading}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!isLoading}
        />

        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.networkCheckButton} 
          onPress={goToNetworkCheck}
        >
          <ThemedText style={styles.networkCheckText}>Network Connectivity Check</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
    marginTop: 80,
  },
  subtitle: {
    marginTop: 8,
    textAlign: 'center',
  },
  form: {
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#0a7ea4',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: '#7fbfd1',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 4,
    marginBottom: 16,
  },
  errorText: {
    color: '#d32f2f',
  },
  linkText: {
    color: '#0a7ea4',
    textDecorationLine: 'underline',
    marginTop: 8,
  },
  networkCheckButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  networkCheckText: {
    color: '#0a7ea4',
    textDecorationLine: 'underline',
  },
}); 