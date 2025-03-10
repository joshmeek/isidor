import React, { useState, useEffect } from 'react';
import { StyleSheet, ActivityIndicator, RefreshControl, ScrollView, TouchableOpacity, View, Dimensions, Text } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import * as api from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Types for protocols
interface Protocol {
  id: string;
  name: string;
  description: string;
  target_metrics: string[];
  duration_type: string;
  duration_days: number;
}

// Types for user protocols
interface UserProtocol {
  id: string;
  user_id: string;
  protocol_id: string;
  start_date: string;
  end_date?: string;
  status: string;
  protocol?: Protocol;
}

export default function ProtocolsScreen() {
  const { user } = useAuth();
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [userProtocols, setUserProtocols] = useState<UserProtocol[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'available' | 'enrolled'>('enrolled');

  // Function to load data
  const loadData = async () => {
    try {
      console.log('Loading protocols data...');
      setError(null);
      setIsLoading(true);

      // Fetch available protocols
      console.log('Fetching available protocols');
      const protocolsResponse = await api.getProtocols();
      setProtocols(protocolsResponse);
      console.log('Received', protocolsResponse.length, 'available protocols');

      // Fetch user protocols
      console.log('Fetching user protocols');
      const userProtocolsResponse = await api.getUserProtocols();
      setUserProtocols(userProtocolsResponse);
      console.log('Received', userProtocolsResponse.length, 'user protocols');

      setIsLoading(false);
    } catch (err) {
      console.error('Error loading protocols data:', err);
      setError('Failed to load protocols. Please try again.');
      setIsLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Refresh function for pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadData().then(() => setRefreshing(false));
  };

  // Function to enroll in a protocol
  const enrollInProtocol = async (protocolId: string) => {
    try {
      setIsLoading(true);
      await api.enrollInProtocol(protocolId);
      
      // Reload data after enrolling
      await loadData();
      
      // Switch to enrolled tab
      setActiveTab('enrolled');
    } catch (err) {
      console.error('Error enrolling in protocol:', err);
      setError('Failed to enroll in protocol. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user is enrolled in a protocol
  const isEnrolled = (protocolId: string) => {
    return userProtocols.some(up => up.protocol_id === protocolId);
  };

  // Render available protocols
  const renderAvailableProtocols = () => {
    if (protocols.length === 0) {
      return (
        <ThemedView style={styles.emptyContainer}>
          <Ionicons name="list-outline" size={48} color="#999" />
          <ThemedText style={styles.emptyText}>No available protocols</ThemedText>
        </ThemedView>
      );
    }

    return (
      <View style={styles.protocolsContainer}>
        {protocols.map((protocol) => (
          <View key={protocol.id} style={styles.protocolCard}>
            <ThemedText style={styles.protocolTitle}>{protocol.name}</ThemedText>
            <ThemedText style={styles.protocolDescription}>{protocol.description}</ThemedText>
            
            <View style={styles.protocolDetails}>
              <View style={styles.detailItem}>
                <Ionicons name="time-outline" size={16} color="#0a7ea4" />
                <ThemedText style={styles.detailText}>
                  {protocol.duration_type === 'fixed' 
                    ? `${protocol.duration_days} days` 
                    : 'Ongoing'}
                </ThemedText>
              </View>
              
              <View style={styles.detailItem}>
                <Ionicons name="analytics-outline" size={16} color="#0a7ea4" />
                <ThemedText style={styles.detailText}>
                  {protocol.target_metrics.join(', ')}
                </ThemedText>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[
                styles.enrollButton,
                isEnrolled(protocol.id) && styles.enrolledButton
              ]}
              onPress={() => enrollInProtocol(protocol.id)}
              disabled={isEnrolled(protocol.id)}
            >
              <ThemedText style={styles.enrollButtonText}>
                {isEnrolled(protocol.id) ? 'Enrolled' : 'Enroll'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  // Render enrolled protocols
  const renderEnrolledProtocols = () => {
    if (userProtocols.length === 0) {
      return (
        <ThemedView style={styles.emptyContainer}>
          <Ionicons name="list-outline" size={48} color="#999" />
          <ThemedText style={styles.emptyText}>You haven't enrolled in any protocols yet</ThemedText>
          <TouchableOpacity 
            style={styles.browseButton}
            onPress={() => setActiveTab('available')}
          >
            <ThemedText style={styles.browseButtonText}>Browse Protocols</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      );
    }

    return (
      <View style={styles.protocolsContainer}>
        {userProtocols.map((userProtocol) => (
          <TouchableOpacity 
            key={userProtocol.id} 
            style={styles.userProtocolCard}
            onPress={() => {
              // Navigate to protocol detail screen
              console.log('Navigating to protocol details with ID:', userProtocol.id);
              router.push({
                pathname: "/protocol-details",
                params: { id: userProtocol.id }
              });
            }}
          >
            <LinearGradient
              colors={['#1a2a6c', '#b21f1f']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.protocolStatusBar}
            />
            
            <View style={styles.userProtocolContent}>
              <View style={styles.protocolCardHeader}>
                <ThemedText style={styles.protocolCardTitle}>
                  {userProtocol.protocol?.name || 'Unnamed Protocol'}
                </ThemedText>
                <View style={styles.statusBadge}>
                  <ThemedText style={styles.statusText}>
                    {userProtocol.status}
                  </ThemedText>
                </View>
              </View>
              
              <ThemedText style={styles.protocolCardDescription}>
                {userProtocol.protocol?.description || 'No description available'}
              </ThemedText>
              
              <View style={styles.protocolCardDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="calendar-outline" size={16} color="#0a7ea4" />
                  <ThemedText style={styles.detailText}>
                    Started: {new Date(userProtocol.start_date).toLocaleDateString()}
                  </ThemedText>
                </View>
                
                {userProtocol.end_date && (
                  <View style={styles.detailItem}>
                    <Ionicons name="calendar-outline" size={16} color="#0a7ea4" />
                    <ThemedText style={styles.detailText}>
                      Ends: {new Date(userProtocol.end_date).toLocaleDateString()}
                    </ThemedText>
                  </View>
                )}
                
                {userProtocol.protocol?.target_metrics && (
                  <View style={styles.detailItem}>
                    <Ionicons name="analytics-outline" size={16} color="#0a7ea4" />
                    <ThemedText style={styles.detailText}>
                      Metrics: {userProtocol.protocol.target_metrics.join(', ')}
                    </ThemedText>
                  </View>
                )}
              </View>
              
              <View style={styles.viewDetailsContainer}>
                <Ionicons name="chevron-forward" size={16} color="#0a7ea4" />
                <ThemedText style={styles.viewDetailsText}>View Details</ThemedText>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Show loading indicator
  if (isLoading && !refreshing) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <ThemedText style={styles.loadingText}>Loading protocols...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Protocols</ThemedText>
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'enrolled' && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab('enrolled')}
        >
          <ThemedText
            style={[
              styles.tabButtonText,
              activeTab === 'enrolled' && styles.activeTabButtonText,
            ]}
          >
            My Protocols
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'available' && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab('available')}
        >
          <ThemedText
            style={[
              styles.tabButtonText,
              activeTab === 'available' && styles.activeTabButtonText,
            ]}
          >
            Available
          </ThemedText>
        </TouchableOpacity>
      </View>
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#e74c3c" />
            <ThemedText style={styles.errorText}>{error}</ThemedText>
            <TouchableOpacity style={styles.retryButton} onPress={loadData}>
              <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          activeTab === 'enrolled' ? renderEnrolledProtocols() : renderAvailableProtocols()
        )}
        
        <View style={styles.spacer} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginTop: 40,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTabButton: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabButtonText: {
    color: '#0a7ea4',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  browseButton: {
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  protocolsContainer: {
    marginTop: 8,
  },
  protocolCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  protocolTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  protocolDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  protocolDetails: {
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  enrollButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  enrolledButton: {
    backgroundColor: '#27ae60',
  },
  enrollButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  userProtocolCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  protocolStatusBar: {
    height: 8,
  },
  userProtocolContent: {
    padding: 16,
  },
  protocolCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  protocolCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  protocolCardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  protocolCardDetails: {
    marginBottom: 12,
  },
  viewDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  viewDetailsText: {
    color: '#0a7ea4',
    fontWeight: '600',
    marginLeft: 4,
  },
  spacer: {
    height: 40,
  },
}); 