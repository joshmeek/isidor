import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Platform, Text } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import * as api from '@/services/api';
import { router } from 'expo-router';
import { API_URL } from '@/services/api';

export default function NetworkCheckScreen() {
  const [apiUrl, setApiUrl] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<string>('');
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  useEffect(() => {
    // Get API URL from the api module
    setApiUrl(API_URL);

    // Get device info
    const info = `${Platform.OS} ${Platform.Version} (${__DEV__ ? 'Development' : 'Production'})`;
    setDeviceInfo(info);

    // Check connectivity on mount
    checkConnectivity();
  }, []);

  const checkConnectivity = async () => {
    setIsChecking(true);
    setErrorDetails(null);
    
    try {
      // First check basic API health
      const apiHealthy = await api.checkApiHealth();
      
      if (!apiHealthy) {
        setIsConnected(false);
        setErrorDetails('Could not connect to the API. The server might be down or the URL might be incorrect.');
        setIsChecking(false);
        return;
      }
      
      // Then check authentication if API is healthy
      const connected = await api.checkApiConnectivity();
      setIsConnected(connected);
      
      if (!connected) {
        setErrorDetails('Connected to API but authentication endpoints are not available. You may need to check your backend configuration.');
      } else {
        console.log('Network check: API connectivity successful');
      }
    } catch (error) {
      setIsConnected(false);
      setErrorDetails(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsChecking(false);
    }
  };

  const goToLogin = () => {
    router.replace('/login');
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Network Connectivity</ThemedText>
        <ThemedText style={styles.subtitle}>Check your connection to the API</ThemedText>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Device Information</ThemedText>
        <ThemedView style={styles.infoRow}>
          <ThemedText>Device:</ThemedText>
          <ThemedText type="defaultSemiBold">{deviceInfo}</ThemedText>
        </ThemedView>
        <ThemedView style={styles.infoRow}>
          <ThemedText>API URL:</ThemedText>
          <ThemedText type="defaultSemiBold">{apiUrl}</ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">API Connectivity</ThemedText>
        
        <ThemedView style={styles.statusContainer}>
          {isChecking ? (
            <ThemedText>Checking connectivity...</ThemedText>
          ) : isConnected === null ? (
            <ThemedText>Not checked yet</ThemedText>
          ) : isConnected ? (
            <ThemedText style={styles.successText}>✓ Connected to API</ThemedText>
          ) : (
            <ThemedText style={styles.errorText}>✗ Cannot connect to API</ThemedText>
          )}
        </ThemedView>

        {errorDetails && (
          <ThemedView style={styles.errorDetails}>
            <ThemedText style={styles.errorText}>{errorDetails}</ThemedText>
          </ThemedView>
        )}

        <TouchableOpacity 
          style={styles.button} 
          onPress={checkConnectivity}
          disabled={isChecking}
        >
          <Text style={styles.buttonText}>Check Again</Text>
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Troubleshooting</ThemedText>
        <ThemedText style={styles.troubleshootingText}>
          1. Make sure your backend server is running
        </ThemedText>
        <ThemedText style={styles.troubleshootingText}>
          2. If using a physical device, update the MANUAL_IP in services/api.ts
        </ThemedText>
        <ThemedText style={styles.troubleshootingText}>
          3. Ensure your device and computer are on the same network
        </ThemedText>
        <ThemedText style={styles.troubleshootingText}>
          4. Check that the API endpoints are correct (/api/v1/docs, not /docs)
        </ThemedText>
        <ThemedText style={styles.troubleshootingText}>
          5. Try using ngrok for external access (see API_SETUP.md)
        </ThemedText>
      </ThemedView>

      <TouchableOpacity 
        style={styles.loginButton} 
        onPress={goToLogin}
      >
        <Text style={styles.buttonText}>Go to Login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 60,
    padding: 16,
  },
  subtitle: {
    marginTop: 8,
    textAlign: 'center',
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statusContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  successText: {
    color: '#4caf50',
    fontWeight: 'bold',
  },
  errorText: {
    color: '#f44336',
  },
  errorDetails: {
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 4,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#0a7ea4',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  loginButton: {
    backgroundColor: '#0a7ea4',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 32,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  troubleshootingText: {
    marginVertical: 4,
  },
}); 