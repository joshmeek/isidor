import React, { useState, useEffect } from 'react';
import { StyleSheet, ActivityIndicator, RefreshControl, ScrollView, TouchableOpacity, View, Dimensions, Text, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText, ThemedView, Button, Card, MetricCard } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import * as api from '@/services/api';
import { spacing } from '@/constants/Spacing';
import { useThemeColor } from '@/hooks/useThemeColor';

// Use the types from the API service
import { Protocol, UserProtocol, UserProtocolWithProtocol } from '@/services/api';

export default function ProtocolsScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const tabParam = params.tab as string;
  
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [userProtocols, setUserProtocols] = useState<UserProtocolWithProtocol[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'available' | 'enrolled'>(
    tabParam === 'available' ? 'available' : 'enrolled'
  );

  // Get theme colors
  const primaryColor = useThemeColor({}, 'primary') as string;
  const secondaryColor = useThemeColor({}, 'secondary') as string;
  const backgroundColor = useThemeColor({}, 'backgroundSecondary') as string;

  // Function to load data
  const loadData = async () => {
    try {
      console.log('Loading protocols data...');
      setError(null);
      setIsLoading(true);

      if (activeTab === 'enrolled') {
        // Fetch active user protocols
        console.log('Fetching active user protocols');
        const userProtocolsResponse = await api.getActiveProtocols();
        setUserProtocols(userProtocolsResponse);
        console.log('Received', userProtocolsResponse.length, 'active user protocols');
      } else {
        // Fetch available protocols
        console.log('Fetching available protocols');
        const protocolsResponse = await api.getProtocols();
        setProtocols(protocolsResponse);
        console.log('Received', protocolsResponse.length, 'available protocols');
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error loading protocols data:', err);
      
      // Check if it's an authentication error
      if (err instanceof api.ApiError && err.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else {
        setError('Failed to load protocols. Please try again.');
      }
      
      setIsLoading(false);
    }
  };

  // Load data when tab changes
  useEffect(() => {
    loadData();
  }, [activeTab]);

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
      console.log('Starting enrollment for protocol:', protocolId);
      setIsLoading(true);
      
      // Enroll in the protocol
      const result = await api.enrollInProtocol(protocolId);
      console.log('Enrollment successful:', result);
      
      // Reload data after enrolling
      await loadData();
      
      // Switch to enrolled tab
      setActiveTab('enrolled');
    } catch (err: any) {
      console.error('Error enrolling in protocol:', err);
      
      // Show a more detailed error message
      let errorMessage = 'Failed to enroll in protocol. Please try again.';
      if (err.message) {
        errorMessage = `Error: ${err.message}`;
      }
      if (err.status === 422) {
        errorMessage = 'Invalid protocol data. Please check the protocol details.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user is enrolled in a protocol
  const isEnrolled = (protocolId: string) => {
    return userProtocols.some(up => up.protocol?.id === protocolId);
  };

  // Function to handle tab change
  const handleTabChange = (tab: 'available' | 'enrolled') => {
    if (tab !== activeTab) {
      setActiveTab(tab);
      // Loading will be triggered by the useEffect that watches activeTab
    }
  };

  // Render available protocols
  const renderAvailableProtocols = () => {
    if (protocols.length === 0) {
      return (
        <Card style={styles.emptyCard}>
          <ThemedText variant="bodyMedium" style={styles.emptyText}>
            No available protocols found
          </ThemedText>
        </Card>
      );
    }

    return (
      <View style={styles.protocolsContainer}>
        <Card style={styles.createProtocolCard}>
          <Button
            title="Create Custom Protocol"
            variant="primary"
            size="md"
            leftIcon="add-circle"
            onPress={() => router.push('/create-protocol')}
            style={styles.createButton}
          />
          <ThemedText variant="bodySmall" secondary style={styles.createProtocolDescription}>
            Create your own custom protocol with personalized goals and metrics
          </ThemedText>
        </Card>

        {protocols.map((protocol) => {
          const alreadyEnrolled = isEnrolled(protocol.id);
          
          // Determine which metrics this protocol targets
          const targetIcons = protocol.target_metrics.map(metric => {
            switch (metric) {
              case 'sleep':
                return { name: 'moon', color: '#5E5CE6' };
              case 'activity':
                return { name: 'footsteps', color: '#FF9500' };
              case 'heart_rate':
                return { name: 'heart', color: '#FF2D55' };
              case 'mood':
                return { name: 'happy', color: '#34C759' };
              case 'weight':
                return { name: 'barbell', color: '#AF52DE' };
              case 'blood_pressure':
                return { name: 'pulse', color: '#FF3B30' };
              case 'calories':
                return { name: 'restaurant', color: '#FF9500' };
              case 'event':
                return { name: 'calendar', color: '#5856D6' };
              default:
                return { name: 'analytics', color: primaryColor };
            }
          });

          return (
            <Card
              key={protocol.id}
              title={protocol.name}
              subtitle={protocol.duration_days ? `${protocol.duration_days} days` : 'Ongoing'}
              leftIcon={<Ionicons name="list" size={24} color={secondaryColor} />}
              style={styles.protocolCard}
              onPress={() => router.push(`/protocol-details?id=${protocol.id}`)}
              footer={
                <View style={styles.protocolFooter}>
                  <View style={styles.targetMetrics}>
                    {targetIcons.map((icon, index) => (
                      <View key={index} style={styles.metricIconContainer}>
                        <Ionicons name={icon.name as any} size={16} color={icon.color} />
                      </View>
                    ))}
                  </View>
                  <Button
                    title={alreadyEnrolled ? "Enrolled" : "Enroll"}
                    variant={alreadyEnrolled ? "outline" : "primary"}
                    size="sm"
                    disabled={alreadyEnrolled}
                    onPress={() => !alreadyEnrolled && enrollInProtocol(protocol.id)}
                  />
                </View>
              }
            >
              <ThemedText variant="bodySmall" secondary numberOfLines={2} style={styles.protocolDescription}>
                {protocol.description || 'No description available'}
              </ThemedText>
            </Card>
          );
        })}
      </View>
    );
  };

  // Render enrolled protocols
  const renderEnrolledProtocols = () => {
    // Debug logging
    console.log('renderEnrolledProtocols called, userProtocols:', JSON.stringify(userProtocols));
    
    if (userProtocols.length === 0) {
      return (
        <Card style={styles.emptyCard}>
          <ThemedText variant="bodyMedium" style={styles.emptyText}>
            You haven't enrolled in any protocols yet
          </ThemedText>
          <Button
            title="Browse Protocols"
            variant="primary"
            size="md"
            leftIcon="list"
            style={styles.browseButton}
            onPress={() => setActiveTab('available')}
          />
        </Card>
      );
    }

    return (
      <View style={styles.protocolsContainer}>
        {userProtocols.map((userProtocol) => {
          // Debug logging for each protocol
          console.log('Processing userProtocol:', userProtocol.id, 'protocol property:', userProtocol.protocol ? 'exists' : 'undefined');
          
          // Use the protocol object if available, otherwise use the userProtocol directly
          const protocolName = userProtocol.protocol?.name || userProtocol.name || 'Unnamed Protocol';
          const protocolDescription = userProtocol.protocol?.description || userProtocol.description || 'No description available';
          
          // Calculate progress
          const startDate = new Date(userProtocol.start_date);
          const endDate = userProtocol.end_date ? new Date(userProtocol.end_date) : null;
          const today = new Date();
          
          let progress = 0;
          let daysLeft = 0;
          
          if (userProtocol.protocol?.duration_days && userProtocol.protocol.duration_days > 0) {
            const totalDays = userProtocol.protocol.duration_days;
            const daysPassed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            daysLeft = Math.max(0, totalDays - daysPassed);
            progress = Math.min(1, Math.max(0, daysPassed / totalDays));
          }
          
          // Format status for display
          const statusText = userProtocol.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
          
          // Determine status color
          let statusColor = '#0066CC'; // Default blue for active
          if (userProtocol.status === 'completed') {
            statusColor = '#34C759'; // Green
          } else if (userProtocol.status === 'cancelled' || userProtocol.status === 'paused') {
            statusColor = '#FF3B30'; // Red
          }
          
          return (
            <Card
              key={userProtocol.id}
              title={protocolName}
              subtitle={`Started: ${new Date(userProtocol.start_date).toLocaleDateString()}`}
              leftIcon={<Ionicons name="list" size={24} color={secondaryColor} />}
              style={styles.protocolCard}
              onPress={() => router.push(`/protocol-details?id=${userProtocol.id}&type=user`)}
              footer={
                <View style={styles.protocolFooter}>
                  <View style={styles.statusContainer}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <ThemedText variant="caption" style={{ color: statusColor }}>
                      {statusText}
                    </ThemedText>
                  </View>
                  <Button
                    title="View"
                    variant="outline"
                    size="sm"
                    rightIcon="chevron-forward"
                    onPress={() => router.push(`/protocol-details?id=${userProtocol.id}&type=user`)}
                  />
                </View>
              }
            >
              <ThemedText variant="bodySmall" secondary numberOfLines={2} style={styles.protocolDescription}>
                {protocolDescription}
              </ThemedText>
            </Card>
          );
        })}
      </View>
    );
  };

  // Render tab buttons
  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[
          styles.tabButton,
          activeTab === 'enrolled' && styles.activeTabButton,
          { borderTopLeftRadius: 8, borderBottomLeftRadius: 8 }
        ]}
        onPress={() => handleTabChange('enrolled')}
      >
        <ThemedText
          variant="labelMedium"
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
          { borderTopRightRadius: 8, borderBottomRightRadius: 8 }
        ]}
        onPress={() => handleTabChange('available')}
      >
        <ThemedText
          variant="labelMedium"
          style={[
            styles.tabButtonText,
            activeTab === 'available' && styles.activeTabButtonText,
          ]}
        >
          Available
        </ThemedText>
      </TouchableOpacity>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[primaryColor]} 
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <ThemedText variant="displaySmall" style={styles.title}>
          Protocols
        </ThemedText>
        
        {renderTabs()}

        {isLoading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={primaryColor} />
            <ThemedText variant="bodyMedium" style={styles.loadingText}>
              Loading protocols...
            </ThemedText>
          </View>
        ) : error ? (
          <Card style={styles.errorCard}>
            <ThemedText variant="bodyMedium" style={styles.errorText}>
              {error}
            </ThemedText>
            <Button
              title="Retry" 
              onPress={loadData}
              variant="primary"
              size="sm"
              leftIcon="refresh"
              style={styles.retryButton}
            />
          </Card>
        ) : (
          activeTab === 'enrolled' ? renderEnrolledProtocols() : renderAvailableProtocols()
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing['3xl'],
  },
  title: {
    marginBottom: spacing.md,
    marginTop: Platform.OS === 'ios' ? spacing['3xl'] : spacing.lg,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  activeTabButton: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButtonText: {
    textAlign: 'center',
    fontWeight: '500',
  },
  activeTabButtonText: {
    color: '#0066CC',
    fontWeight: '600',
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    textAlign: 'center',
  },
  errorCard: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.sm,
  },
  protocolsContainer: {
    flexDirection: 'column',
    gap: spacing.md,
  },
  protocolCard: {
    marginBottom: spacing.md,
  },
  protocolDescription: {
    marginBottom: spacing.sm,
  },
  protocolFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  targetMetrics: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  metricIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  browseButton: {
    marginTop: spacing.sm,
  },
  createProtocolCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  createButton: {
    marginBottom: spacing.sm,
  },
  createProtocolDescription: {
    opacity: 0.7,
  },
}); 