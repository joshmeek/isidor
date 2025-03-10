import React, { useState, useEffect } from 'react';
import { StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
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

export default function ProtocolDetailsScreen() {
  console.log('Rendering ProtocolDetailsScreen');
  const params = useLocalSearchParams();
  const id = params.id as string;
  
  console.log('Protocol ID from params:', id);
  
  const [userProtocol, setUserProtocol] = useState<UserProtocol | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load protocol details
  useEffect(() => {
    const loadProtocolDetails = async () => {
      try {
        console.log('Loading protocol details for ID:', id);
        setIsLoading(true);
        setError(null);

        if (!id) {
          console.error('Protocol ID is missing');
          setError('Protocol ID is missing');
          setIsLoading(false);
          return;
        }

        // Fetch user protocol details
        console.log('Fetching user protocol details with ID:', id);
        const protocolDetails = await api.getUserProtocolDetails(id);
        console.log('Received protocol details:', JSON.stringify(protocolDetails, null, 2));
        setUserProtocol(protocolDetails);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading protocol details:', err);
        setError('Failed to load protocol details. Please try again.');
        setIsLoading(false);
      }
    };

    loadProtocolDetails();
  }, [id]);

  // Handle back button press
  const handleBack = () => {
    console.log('Navigating back');
    router.back();
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#0a7ea4" />
          </TouchableOpacity>
          <ThemedText style={styles.title}>Protocol Details</ThemedText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0a7ea4" />
          <ThemedText style={styles.loadingText}>Loading protocol details...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error || !userProtocol) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#0a7ea4" />
          </TouchableOpacity>
          <ThemedText style={styles.title}>Protocol Details</ThemedText>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#e74c3c" />
          <ThemedText style={styles.errorText}>{error || 'Protocol not found'}</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={handleBack}>
            <ThemedText style={styles.retryButtonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0a7ea4" />
        </TouchableOpacity>
        <ThemedText style={styles.title}>Protocol Details</ThemedText>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Protocol Header */}
        <LinearGradient
          colors={['#1a2a6c', '#b21f1f']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.protocolHeader}
        >
          <ThemedText style={styles.protocolName}>
            {userProtocol.protocol?.name || 'Unnamed Protocol'}
          </ThemedText>
          <View style={styles.statusBadge}>
            <ThemedText style={styles.statusText}>
              {userProtocol.status}
            </ThemedText>
          </View>
        </LinearGradient>

        {/* Protocol Details */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Description</ThemedText>
          <ThemedText style={styles.description}>
            {userProtocol.protocol?.description || 'No description available'}
          </ThemedText>
        </View>

        {/* Protocol Dates */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Timeline</ThemedText>
          <View style={styles.dateRow}>
            <View style={styles.dateIconContainer}>
              <Ionicons name="calendar-outline" size={20} color="#0a7ea4" />
            </View>
            <View style={styles.dateInfo}>
              <ThemedText style={styles.dateLabel}>Start Date</ThemedText>
              <ThemedText style={styles.dateValue}>{userProtocol.start_date}</ThemedText>
            </View>
          </View>
          {userProtocol.end_date && (
            <View style={styles.dateRow}>
              <View style={styles.dateIconContainer}>
                <Ionicons name="calendar-outline" size={20} color="#0a7ea4" />
              </View>
              <View style={styles.dateInfo}>
                <ThemedText style={styles.dateLabel}>End Date</ThemedText>
                <ThemedText style={styles.dateValue}>{userProtocol.end_date}</ThemedText>
              </View>
            </View>
          )}
          <View style={styles.dateRow}>
            <View style={styles.dateIconContainer}>
              <Ionicons name="time-outline" size={20} color="#0a7ea4" />
            </View>
            <View style={styles.dateInfo}>
              <ThemedText style={styles.dateLabel}>Duration</ThemedText>
              <ThemedText style={styles.dateValue}>
                {userProtocol.protocol?.duration_days || 0} days
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Target Metrics */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Target Metrics</ThemedText>
          <View style={styles.metricsContainer}>
            {userProtocol.protocol?.target_metrics?.map((metric, index) => (
              <View key={index} style={styles.metricBadge}>
                <ThemedText style={styles.metricText}>{metric}</ThemedText>
              </View>
            )) || (
              <ThemedText style={styles.noMetricsText}>No target metrics specified</ThemedText>
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              console.log('View Progress button pressed');
              // You can implement progress view here
            }}
          >
            <Ionicons name="analytics-outline" size={20} color="#fff" />
            <ThemedText style={styles.actionButtonText}>View Progress</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryActionButton]}
            onPress={() => {
              console.log('End Protocol button pressed');
              // You can implement protocol ending here
            }}
          >
            <Ionicons name="close-outline" size={20} color="#e74c3c" />
            <ThemedText style={styles.secondaryActionButtonText}>End Protocol</ThemedText>
          </TouchableOpacity>
        </View>

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
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  protocolHeader: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  protocolName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  statusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dateInfo: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    color: '#666',
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 2,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricBadge: {
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  metricText: {
    fontSize: 14,
    color: '#0a7ea4',
    fontWeight: '500',
  },
  noMetricsText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryActionButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#e74c3c',
  },
  secondaryActionButtonText: {
    color: '#e74c3c',
    fontWeight: 'bold',
    fontSize: 16,
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
  spacer: {
    height: 40,
  },
}); 