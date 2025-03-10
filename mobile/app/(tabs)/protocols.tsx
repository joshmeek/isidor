import React, { useState, useEffect } from 'react';
import { StyleSheet, ActivityIndicator, RefreshControl, ScrollView, TouchableOpacity, View, Dimensions, Text } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText, ThemedView, Button, Card, MetricCard } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import * as api from '@/services/api';
import { spacing } from '@/constants/Spacing';
import { useThemeColor } from '@/hooks/useThemeColor';

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
        <Card style={styles.emptyCard}>
          <ThemedText variant="bodyMedium" style={styles.emptyText}>
            No available protocols found
          </ThemedText>
        </Card>
      );
    }

    return (
      <View style={styles.protocolsContainer}>
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
              default:
                return { name: 'analytics', color: primaryColor };
            }
          });

          return (
            <Card
              key={protocol.id}
              title={protocol.name}
              subtitle={`${protocol.duration_days} days`}
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
                {protocol.description}
              </ThemedText>
            </Card>
          );
        })}
      </View>
    );
  };

  // Render enrolled protocols
  const renderEnrolledProtocols = () => {
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
          const protocol = userProtocol.protocol;
          if (!protocol) return null;
          
          // Calculate progress
          const startDate = new Date(userProtocol.start_date);
          const endDate = userProtocol.end_date ? new Date(userProtocol.end_date) : null;
          const today = new Date();
          
          let progress = 0;
          let daysLeft = 0;
          
          if (protocol.duration_type === 'fixed' && protocol.duration_days > 0) {
            const totalDays = protocol.duration_days;
            const daysPassed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            daysLeft = Math.max(0, totalDays - daysPassed);
            progress = Math.min(1, Math.max(0, daysPassed / totalDays));
          }
          
          // Format status for display
          const statusText = userProtocol.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
          
          // Determine status color
          let statusColor = '#0066CC'; // Default blue
          if (userProtocol.status === 'completed') {
            statusColor = '#34C759'; // Green
          } else if (userProtocol.status === 'abandoned') {
            statusColor = '#FF3B30'; // Red
          }
          
          return (
            <Card
              key={userProtocol.id}
              title={protocol.name}
              subtitle={`Started: ${new Date(userProtocol.start_date).toLocaleDateString()}`}
              leftIcon={<Ionicons name="list" size={24} color={secondaryColor} />}
              style={styles.protocolCard}
              onPress={() => router.push(`/protocol-details?id=${userProtocol.id}`)}
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
                    onPress={() => router.push(`/protocol-details?id=${userProtocol.id}`)}
                  />
                </View>
              }
            >
              {protocol.duration_type === 'fixed' && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${progress * 100}%` },
                        userProtocol.status === 'completed' && styles.progressCompleted
                      ]} 
                    />
                  </View>
                  <ThemedText variant="bodySmall" secondary>
                    {userProtocol.status === 'completed' 
                      ? 'Completed' 
                      : userProtocol.status === 'abandoned'
                        ? 'Abandoned'
                        : `${daysLeft} days left`}
                  </ThemedText>
                </View>
              )}
            </Card>
          );
        })}
      </View>
    );
  };

  // Update the main UI structure
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
      >
        <ThemedText variant="displaySmall" style={styles.title}>
          Protocols
        </ThemedText>
        
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'enrolled' && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab('enrolled')}
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
            ]}
            onPress={() => setActiveTab('available')}
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

        {isLoading ? (
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
    marginTop: spacing.lg,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  activeTabButton: {
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
  },
  tabButtonText: {
    textAlign: 'center',
  },
  activeTabButtonText: {
    color: '#0066CC',
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
  protocolsContainer: {
    marginBottom: spacing.lg,
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
  },
  targetMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
    backgroundColor: '#0a7ea4',
  },
  progressCompleted: {
    backgroundColor: '#34C759',
  },
}); 