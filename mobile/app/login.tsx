import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  Text, 
  View,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { router, useNavigation } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TextInput } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import * as api from '@/services/api';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearError, isAuthenticated } = useAuth();
  const navigation = useNavigation();
  const [networkError, setNetworkError] = useState<string | null>(null);
  
  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  // Start animations when component mounts
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

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
          console.log('API connectivity check successful');
        }
      } catch (err) {
        console.error('Error checking API connectivity:', err);
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
    <View style={styles.container}>
      <LinearGradient
        colors={['#f8fafc', '#f1f5f9']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.contentWrapper}
        >
          <View style={styles.scrollContainer}>
            <Animated.View 
              style={[
                styles.content,
                { opacity: fadeAnim }
              ]}
            >
              <Text style={styles.title}>isidor</Text>
              
              <Text style={styles.subtitle}>
                AI-powered protocols for human optimization
              </Text>
              
              <Text style={styles.secondarySubtitle}>
                Powered by data, controlled by you
              </Text>

              <View style={styles.formContainer}>
                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                {networkError && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{networkError}</Text>
                    <TouchableOpacity onPress={goToNetworkCheck}>
                      <Text style={styles.linkText}>Check Network Settings</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.inputWrapper}>
                  <TextInput
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!isLoading}
                    placeholderTextColor="#94a3b8"
                    inputStyle={styles.customInput}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <TextInput
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    editable={!isLoading}
                    placeholderTextColor="#94a3b8"
                    inputStyle={styles.customInput}
                  />
                </View>

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
                  <Text style={styles.networkCheckText}>Network Connectivity Check</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  contentWrapper: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    fontSize: 64,
    fontWeight: '200',
    color: '#1e293b',
    marginBottom: 16,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 18,
    color: '#334155',
    fontWeight: '300',
    textAlign: 'center',
    marginBottom: 4,
  },
  secondarySubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '300',
    textAlign: 'center',
    marginBottom: 40,
  },
  formContainer: {
    width: '100%',
    maxWidth: 320,
  },
  errorContainer: {
    width: '100%',
    backgroundColor: 'rgba(254, 226, 226, 0.8)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 14,
  },
  linkText: {
    color: '#2563eb',
    marginTop: 8,
    fontSize: 14,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  customInput: {
    height: 50,
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#334155',
    borderWidth: 1,
    borderColor: 'rgba(203, 213, 225, 0.5)',
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  button: {
    height: 50,
    backgroundColor: '#334155',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonDisabled: {
    backgroundColor: '#94a3b8',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  networkCheckButton: {
    marginTop: 24,
    padding: 8,
    alignItems: 'center',
  },
  networkCheckText: {
    color: '#64748b',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
}); 