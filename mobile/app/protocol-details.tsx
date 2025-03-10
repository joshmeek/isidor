import React, { useState, useEffect } from 'react';
import { StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText, ThemedView, Button, Card } from '@/components/ui';
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

export default function ProtocolDetailsScreen() {
  console.log('Rendering ProtocolDetailsScreen');
  const params = useLocalSearchParams();
  const id = params.id as string;
  
  console.log('Protocol ID from params:', id);
  
  const [userProtocol, setUserProtocol] = useState<UserProtocol | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get theme colors
  const primaryColor = useThemeColor({}, 'primary') as string;
  const secondaryColor = useThemeColor({}, 'secondary') as string;
  const backgroundColor = useThemeColor({}, 'backgroundSecondary') as string;
  const successColor = useThemeColor({}, 'success') as string;
  const errorColor = useThemeColor({}, 'error') as string;

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

  // Add the missing calculation functions
  const calculateProgress = () => {
    if (!userProtocol || !userProtocol.protocol || userProtocol.protocol.duration_type !== 'fixed') {
      return 0;
    }
    
    const startDate = new Date(userProtocol.start_date);
    const today = new Date();
    const totalDays = userProtocol.protocol.duration_days;
    
    const daysPassed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.min(1, Math.max(0, daysPassed / totalDays));
  };

  const calculateDaysPassed = () => {
    if (!userProtocol) return 0;
    
    const startDate = new Date(userProtocol.start_date);
    const today = new Date();
    
    return Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  const calculateDaysLeft = () => {
    if (!userProtocol || !userProtocol.protocol || userProtocol.protocol.duration_type !== 'fixed') {
      return 0;
    }
    
    const startDate = new Date(userProtocol.start_date);
    const today = new Date();
    const totalDays = userProtocol.protocol.duration_days;
    
    const daysPassed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, totalDays - daysPassed);
  };

  const updateProtocolStatus = async (status: string) => {
    try {
      console.log(`Updating protocol status to: ${status}`);
      setIsLoading(true);
      
      // Here you would call your API to update the protocol status
      // For example: await api.updateProtocolStatus(userProtocol.id, status);
      
      // For now, let's just update the local state
      setUserProtocol(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status,
          end_date: new Date().toISOString().split('T')[0]
        };
      });
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error updating protocol status:', err);
      setError('Failed to update protocol status');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#0066CC" />
          </TouchableOpacity>
          <ThemedText variant="headingMedium" style={styles.title}>
            Protocol Details
          </ThemedText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
          <ThemedText variant="bodyMedium" style={styles.loadingText}>
            Loading protocol details...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error || !userProtocol) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#0066CC" />
          </TouchableOpacity>
          <ThemedText variant="headingMedium" style={styles.title}>
            Protocol Details
          </ThemedText>
        </View>
        <Card style={styles.errorCard}>
          <ThemedText variant="bodyMedium" style={styles.errorText}>
            {error || 'Protocol not found'}
          </ThemedText>
          <Button 
            title="Go Back" 
            onPress={handleBack} 
            variant="primary"
            size="md"
            leftIcon="arrow-back"
          />
        </Card>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#0066CC" />
        </TouchableOpacity>
        <ThemedText variant="headingMedium" style={styles.title}>
          Protocol Details
        </ThemedText>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Protocol Header */}
        <Card style={styles.protocolCard}>
          <View style={styles.protocolHeader}>
            <ThemedText variant="displaySmall" style={styles.protocolName}>
              {userProtocol.protocol?.name || 'Unnamed Protocol'}
            </ThemedText>
            <View style={[
              styles.statusBadge, 
              { 
                backgroundColor: 
                  userProtocol.status === 'completed' ? successColor :
                  userProtocol.status === 'abandoned' ? errorColor : 
                  primaryColor 
              }
            ]}>
              <ThemedText variant="labelSmall" style={styles.statusText}>
                {userProtocol.status.replace('_', ' ').toUpperCase()}
              </ThemedText>
            </View>
          </View>

          <ThemedText variant="bodyMedium" style={styles.protocolDescription}>
            {userProtocol.protocol?.description || 'No description available'}
          </ThemedText>

          {/* Protocol Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <ThemedText variant="labelMedium" style={styles.detailLabel}>
                Started:
              </ThemedText>
              <ThemedText variant="bodyMedium">
                {new Date(userProtocol.start_date).toLocaleDateString()}
              </ThemedText>
            </View>
            
            {userProtocol.end_date && (
              <View style={styles.detailRow}>
                <ThemedText variant="labelMedium" style={styles.detailLabel}>
                  Ends:
                </ThemedText>
                <ThemedText variant="bodyMedium">
                  {new Date(userProtocol.end_date).toLocaleDateString()}
                </ThemedText>
              </View>
            )}
            
            {userProtocol.protocol?.duration_type === 'fixed' && (
              <View style={styles.detailRow}>
                <ThemedText variant="labelMedium" style={styles.detailLabel}>
                  Duration:
                </ThemedText>
                <ThemedText variant="bodyMedium">
                  {userProtocol.protocol.duration_days} days
                </ThemedText>
              </View>
            )}
            
            {userProtocol.protocol?.target_metrics && (
              <View style={styles.detailRow}>
                <ThemedText variant="labelMedium" style={styles.detailLabel}>
                  Target Metrics:
                </ThemedText>
                <View style={styles.metricsContainer}>
                  {userProtocol.protocol.target_metrics.map((metric, index) => (
                    <View key={index} style={styles.metricBadge}>
                      <ThemedText variant="labelSmall" style={styles.metricText}>
                        {metric.replace('_', ' ').toUpperCase()}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </Card>

        {/* Progress Section */}
        <ThemedText variant="headingMedium" style={styles.sectionTitle}>
          Progress
        </ThemedText>
        
        <Card style={styles.progressCard}>
          {userProtocol.status === 'active' && (
            <>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${calculateProgress() * 100}%` }
                    ]} 
                  />
                </View>
                <ThemedText variant="bodySmall" style={styles.progressText}>
                  {Math.round(calculateProgress() * 100)}% Complete
                </ThemedText>
              </View>
              
              <View style={styles.daysContainer}>
                <View style={styles.dayInfo}>
                  <ThemedText variant="headingSmall" style={styles.dayNumber}>
                    {calculateDaysPassed()}
                  </ThemedText>
                  <ThemedText variant="caption" secondary>
                    Days Passed
                  </ThemedText>
                </View>
                
                <View style={styles.dayInfo}>
                  <ThemedText variant="headingSmall" style={styles.dayNumber}>
                    {calculateDaysLeft()}
                  </ThemedText>
                  <ThemedText variant="caption" secondary>
                    Days Left
                  </ThemedText>
                </View>
              </View>
              
              <View style={styles.buttonContainer}>
                {userProtocol.status === 'active' && (
                  <>
                    <Button
                      title="Complete Protocol"
                      onPress={() => updateProtocolStatus('completed')}
                      variant="primary"
                      leftIcon="checkmark-circle"
                      style={styles.actionButton}
                    />
                    <Button
                      title="Abandon Protocol"
                      onPress={() => updateProtocolStatus('abandoned')}
                      variant="destructive"
                      leftIcon="close-circle"
                      style={styles.actionButton}
                    />
                  </>
                )}
              </View>
            </>
          )}
          
          {userProtocol.status === 'completed' && (
            <View style={styles.completedContainer}>
              <Ionicons name="checkmark-circle" size={48} color={successColor} />
              <ThemedText variant="headingMedium" style={styles.completedText}>
                Protocol Completed
              </ThemedText>
              <ThemedText variant="bodyMedium" secondary style={styles.completedDate}>
                Completed on {new Date(userProtocol.end_date || '').toLocaleDateString()}
              </ThemedText>
            </View>
          )}
          
          {userProtocol.status === 'abandoned' && (
            <View style={styles.abandonedContainer}>
              <Ionicons name="close-circle" size={48} color={errorColor} />
              <ThemedText variant="headingMedium" style={styles.abandonedText}>
                Protocol Abandoned
              </ThemedText>
              <ThemedText variant="bodyMedium" secondary style={styles.abandonedDate}>
                Abandoned on {new Date(userProtocol.end_date || '').toLocaleDateString()}
              </ThemedText>
            </View>
          )}
        </Card>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  backButton: {
    marginRight: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing['3xl'],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    color: '#667085',
    textAlign: 'center',
  },
  errorCard: {
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    marginBottom: spacing.md,
    textAlign: 'center',
    color: '#667085',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  protocolCard: {
    borderRadius: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: '#FFFFFF',
  },
  protocolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  protocolName: {
    fontSize: 22,
    fontWeight: '700',
    flex: 1,
    color: '#000000',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.md,
    marginLeft: spacing.sm,
  },
  statusText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  protocolDescription: {
    fontSize: 16,
    lineHeight: 22,
    color: '#333333',
    marginBottom: spacing.md,
  },
  detailsContainer: {
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: spacing.sm,
    color: '#667085',
    width: 100,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  metricBadge: {
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.sm,
  },
  metricText: {
    color: '#0066CC',
    fontSize: 12,
    fontWeight: '500',
  },
  progressCard: {
    borderRadius: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: '#FFFFFF',
  },
  progressBarContainer: {
    marginBottom: spacing.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0066CC',
  },
  progressText: {
    marginTop: spacing.xs,
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    textAlign: 'right',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  dayInfo: {
    alignItems: 'center',
  },
  dayNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: spacing.xs,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  completedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  completedText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  completedDate: {
    fontSize: 14,
    color: '#667085',
  },
  abandonedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  abandonedText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  abandonedDate: {
    fontSize: 14,
    color: '#667085',
  },
}); 