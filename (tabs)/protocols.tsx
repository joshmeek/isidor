import React, { useEffect, useState } from 'react';
import { StyleSheet, ActivityIndicator, RefreshControl, ScrollView, TouchableOpacity, View, Dimensions } from 'react-native';
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
      setError(null);
      setIsLoading(true);

      // Fetch available protocols
      const protocolsResponse = await api.getProtocols();
      setProtocols(protocolsResponse);

      // Fetch user protocols
      const userProtocolsResponse = await api.getUserProtocols();
      setUserProtocols(userProtocolsResponse);

      setIsLoading(false);
    } catch (err) {
      console.error('Error loading protocols:', err);
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
      
      // Reload data to show updated enrollment
      await loadData();
      
      // Switch to enrolled tab
      setActiveTab('enrolled');
    } catch (err) {
      console.error('Error enrolling in protocol:', err);
      setError('Failed to enroll in protocol. Please try again.');
      setIsLoading(false);
    }
  };

  // Check if user is already enrolled in a protocol
  const isEnrolled = (protocolId: string) => {
    return userProtocols.some(up => up.protocol_id === protocolId);
  };

  // Render available protocols
  const renderAvailableProtocols = () => {
    if (protocols.length === 0) {
      return (
        <ThemedView style={styles.emptyContainer}>
          <Ionicons name="list-outline" size={48} color="#999" />
          <ThemedText style={styles.emptyText}>No protocols available</ThemedText>
        </ThemedView>
      );
    }

    return (
      <View style={styles.protocolsContainer}>
        {protocols.map((protocol) => (
          <View key={protocol.id} style={styles.protocolCard}>
            <View style={styles.protocolCardHeader}>
              <ThemedText style={styles.protocolCardTitle}>
                {protocol.name}
              </ThemedText>
              <View style={styles.durationBadge}>
                <ThemedText style={styles.durationText}>
                  {protocol.duration_days} days
                </ThemedText>
              </View>
            </View>
            
            <ThemedText style={styles.protocolCardDescription}>
              {protocol.description}
            </ThemedText>
            
            <View style={styles.targetMetricsContainer}>
              <ThemedText style={styles.targetMetricsTitle}>Target Metrics:</ThemedText>
              <View style={styles.metricsRow}>
                {protocol.target_metrics.map((metric, index) => (
                  <View key={index} style={styles.metricBadge}>
                    <ThemedText style={styles.metricText}>
                      {metric}
                    </ThemedText>
                  </View>
                ))}
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
                {isEnrolled(protocol.id) ? 'Already Enrolled' : 'Enroll Now'}
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
              // router.push({
              //   pathname: 'protocols/[id]',
              //   params: { id: userProtocol.id }
              // });
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
              
              <View style={styles.dateContainer}>
                <ThemedText style={styles.dateLabel}>Started:</ThemedText>
                <ThemedText style={styles.dateValue}>{userProtocol.start_date}</ThemedText>
                
                {userProtocol.end_date && (
                  <>
                    <ThemedText style={styles.dateLabel}>Ends:</ThemedText>
                    <ThemedText style={styles.dateValue}>{userProtocol.end_date}</ThemedText>
                  </>
                )}
              </View>
              
              <View style={styles.protocolCardFooter}>
                <ThemedText style={styles.viewDetailsText}>View Details</ThemedText>
                <Ionicons name="chevron-forward" size={16} color="#999" />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Protocols</ThemedText>
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
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0a7ea4" />
          <ThemedText style={styles.loadingText}>Loading protocols...</ThemedText>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#e74c3c" />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {activeTab === 'enrolled' ? renderEnrolledProtocols() : renderAvailableProtocols()}
          <View style={styles.spacer} />
        </ScrollView>
      )}
    </ThemedView>
  );
}

const { width } = Dimensions.get('window');

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
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 8,
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
    backgroundColor: '#0a7ea4',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabButtonText: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  protocolsContainer: {
    flexDirection: 'column',
    gap: 16,
  },
  protocolCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userProtocolCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  protocolStatusBar: {
    width: 8,
  },
  userProtocolContent: {
    flex: 1,
    padding: 16,
  },
  protocolCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  protocolCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  protocolCardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  durationBadge: {
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  durationText: {
    fontSize: 12,
    color: '#0a7ea4',
    fontWeight: '500',
  },
  statusBadge: {
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#0a7ea4',
    fontWeight: '500',
  },
  targetMetricsContainer: {
    marginBottom: 16,
  },
  targetMetricsTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricBadge: {
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  metricText: {
    fontSize: 12,
    color: '#0a7ea4',
  },
  enrollButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  enrolledButton: {
    backgroundColor: '#ccc',
  },
  enrollButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  dateContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  dateLabel: {
    fontSize: 12,
    color: '#999',
    marginRight: 4,
    width: 60,
  },
  dateValue: {
    fontSize: 12,
    color: '#666',
    marginRight: 16,
  },
  protocolCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#0a7ea4',
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
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  browseButton: {
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  spacer: {
    height: 40,
  },
}); 