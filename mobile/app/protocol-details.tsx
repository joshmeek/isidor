import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  ActivityIndicator, 
  ScrollView, 
  View, 
  Text, 
  TouchableOpacity, 
  Platform, 
  Alert,
  RefreshControl
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText, ThemedView, Button, Card } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import * as api from '@/services/api';
import { spacing } from '@/constants/Spacing';
import { useThemeColor } from '@/hooks/useThemeColor';
import { UUID, Protocol, UserProtocolWithProtocol } from '@/services/api';

// Helper functions for calculations
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
};

const calculateProgress = (userProtocol: UserProtocolWithProtocol) => {
  if (!userProtocol || !userProtocol.protocol) return 0;
  
  const startDate = new Date(userProtocol.start_date);
  const today = new Date();
  const totalDays = userProtocol.protocol.duration_days || 30;
  
  const daysPassed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  return Math.min(1, Math.max(0, daysPassed / totalDays));
};

const calculateDaysPassed = (userProtocol: UserProtocolWithProtocol) => {
  if (!userProtocol) return 0;
  
  const startDate = new Date(userProtocol.start_date);
  const today = new Date();
  
  return Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
};

const calculateDaysLeft = (userProtocol: UserProtocolWithProtocol) => {
  if (!userProtocol || !userProtocol.protocol) return 0;
  
  const startDate = new Date(userProtocol.start_date);
  const today = new Date();
  const totalDays = userProtocol.protocol.duration_days || 30;
  
  const daysPassed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, totalDays - daysPassed);
};

export default function ProtocolDetailsScreen() {
  // Get theme colors - define all at the top level
  const primaryColor = useThemeColor({}, 'primary') as string;
  const secondaryColor = useThemeColor({}, 'secondary') as string;
  const backgroundColor = useThemeColor({}, 'backgroundSecondary') as string;
  const errorColor = useThemeColor({}, 'error') as string;
  const successColor = useThemeColor({}, 'success') as string;
  const textColor = useThemeColor({}, 'text') as string;
  
  // Get route params
  const params = useLocalSearchParams();
  const id = params.id as string;
  const type = params.type as string;
  
  // Component state
  const [userProtocol, setUserProtocol] = useState<api.UserProtocolWithProtocol | null>(null);
  const [progress, setProgress] = useState<api.UserProtocolProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [justUpdatedStatus, setJustUpdatedStatus] = useState(false);

  // Get status text based on protocol status
  const getStatusText = useCallback(() => {
    if (!userProtocol) return '';
    return userProtocol.status.charAt(0).toUpperCase() + 
           userProtocol.status.slice(1).replace(/_/g, ' ');
  }, [userProtocol]);

  // Get status color based on protocol status
  const getStatusColor = useCallback(() => {
    if (!userProtocol) return primaryColor;
    
    switch (userProtocol.status) {
      case 'active':
        return '#0066CC'; // Blue
      case 'completed':
        return '#34C759'; // Green
      case 'abandoned':
      case 'cancelled':
        return '#FF3B30'; // Red
      case 'paused':
        return '#FF9500'; // Orange
      default:
        return primaryColor;
    }
  }, [userProtocol, primaryColor]);

  // Load protocol details
  const loadProtocolDetails = useCallback(async () => {
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

      // Check if this is a user protocol or an available protocol
      if (type === 'user') {
        // Fetch user protocol details
        console.log('Fetching user protocol details with ID:', id);
        const protocolDetails = await api.getUserProtocolDetails(id);
        console.log('Received user protocol details:', JSON.stringify(protocolDetails, null, 2));
        
        setUserProtocol(protocolDetails);
        
        // Also fetch progress data
        try {
          const progressData = await api.getUserProtocolProgress(id);
          setProgress(progressData);
        } catch (progressErr) {
          console.error('Error loading protocol progress:', progressErr);
          // Non-critical error, don't show to user
        }
      } else {
        // Fetch available protocol details
        console.log('Fetching available protocol details with ID:', id);
        const protocolDetails = await api.getProtocolDetails(id);
        console.log('Received available protocol details:', JSON.stringify(protocolDetails, null, 2));
        
        // Create a user protocol object from the available protocol
        const userProtocolFromAvailable: api.UserProtocolWithProtocol = {
          id: '', // Will be assigned when enrolled
          user_id: '',
          name: protocolDetails.name,
          description: protocolDetails.description,
          start_date: new Date().toISOString().split('T')[0], // Today
          status: 'not_enrolled',
          target_metrics: protocolDetails.target_metrics,
          custom_fields: {},
          steps: protocolDetails.steps || [],
          recommendations: protocolDetails.recommendations || [],
          expected_outcomes: protocolDetails.expected_outcomes || [],
          category: protocolDetails.category,
          created_at: '',
          updated_at: '',
          protocol: protocolDetails
        };
        
        setUserProtocol(userProtocolFromAvailable);
      }
    } catch (err) {
      console.error('Error loading protocol details:', err);
      setError('Failed to load protocol details. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [id, type]);

  // Initial load
  useEffect(() => {
    loadProtocolDetails();
  }, [loadProtocolDetails]);

  // Handle pull-to-refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadProtocolDetails();
  }, [loadProtocolDetails]);

  // Handle back button press
  const handleBack = useCallback(() => {
    console.log('Navigating back');
    router.back();
  }, []);

  // Handle enrollment in protocol
  const handleEnrollment = useCallback(async () => {
    if (!userProtocol || !userProtocol.protocol) return;
    
    try {
      setIsUpdatingStatus(true);
      await api.enrollInProtocol(userProtocol.protocol.id);
      
      // Navigate back to protocols page with enrolled tab active
      router.replace('/(tabs)/protocols?tab=enrolled');
    } catch (err) {
      console.error('Error enrolling in protocol:', err);
      setError('Failed to enroll in protocol. Please try again.');
      setIsUpdatingStatus(false);
    }
  }, [userProtocol]);

  // Handle status update
  const handleStatusUpdate = useCallback(async (newStatus: string) => {
    if (!userProtocol) return;
    
    try {
      setIsUpdatingStatus(true);
      setError(null);
      
      // Make the API call directly without confirmation
      const updatedProtocol = await api.updateUserProtocolStatus(userProtocol.id, newStatus);
      
      // Update local state with new protocol status
      setUserProtocol(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status: newStatus,
          end_date: newStatus === 'completed' || newStatus === 'abandoned' 
            ? new Date().toISOString().split('T')[0] 
            : prev.end_date
        };
      });
      
      setJustUpdatedStatus(true);
    } catch (err) {
      console.error(`Error updating protocol status to ${newStatus}:`, err);
      setError(`Failed to update protocol status to ${newStatus}. Please try again.`);
    } finally {
      setIsUpdatingStatus(false);
    }
  }, [userProtocol]);

  // Render protocol actions
  const renderProtocolActions = useCallback(() => {
    if (!userProtocol) return null;

    if (userProtocol.status === 'not_enrolled') {
      return (
        <Card style={styles.actionsCard}>
          <ThemedText variant="bodyMedium" style={styles.sectionTitle}>
            Protocol Actions
          </ThemedText>
          <Button
            title="Enroll in Protocol"
            variant="primary"
            size="md"
            leftIcon="add-circle"
            style={styles.actionButton}
            onPress={handleEnrollment}
            isLoading={isUpdatingStatus}
            disabled={isUpdatingStatus}
          />
        </Card>
      );
    }

    if (userProtocol.status === 'active') {
      return (
        <Card style={styles.actionsCard}>
          <ThemedText variant="bodyMedium" style={styles.sectionTitle}>
            Protocol Actions
          </ThemedText>
          <View style={styles.buttonContainer}>
            <Button
              title="Mark as Completed"
              variant="primary"
              size="md"
              leftIcon="checkmark-circle"
              style={styles.actionButton}
              onPress={() => handleStatusUpdate('completed')}
              isLoading={isUpdatingStatus}
              disabled={isUpdatingStatus || justUpdatedStatus}
            />
            <Button
              title="Abandon Protocol"
              variant="destructive"
              size="md"
              leftIcon="close-circle"
              style={styles.actionButton}
              onPress={() => handleStatusUpdate('abandoned')}
              isLoading={isUpdatingStatus}
              disabled={isUpdatingStatus || justUpdatedStatus}
            />
          </View>
        </Card>
      );
    }

    return (
      <Card style={styles.actionsCard}>
        <ThemedText variant="bodyMedium" style={styles.sectionTitle}>
          Protocol Status
        </ThemedText>
        <View style={styles.statusMessageContainer}>
          <Ionicons 
            name={userProtocol.status === 'completed' ? "checkmark-circle" : "information-circle"} 
            size={24} 
            color={getStatusColor()} 
            style={styles.statusMessageIcon} 
          />
          <ThemedText variant="bodyMedium" style={[styles.statusMessage, { color: getStatusColor() }]}>
            {userProtocol.status === 'completed' 
              ? "You've successfully completed this protocol!" 
              : userProtocol.status === 'abandoned'
                ? "You've abandoned this protocol."
                : `This protocol is currently ${getStatusText().toLowerCase()}.`
            }
          </ThemedText>
        </View>
      </Card>
    );
  }, [userProtocol, isUpdatingStatus, justUpdatedStatus, handleStatusUpdate, handleEnrollment, getStatusColor, getStatusText]);

  // Render loading state
  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.safeArea} />
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={primaryColor} />
          <ThemedText variant="bodyMedium" style={{ color: primaryColor }}>Back</ThemedText>
        </TouchableOpacity>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <ThemedText variant="bodyMedium" style={styles.loadingText}>
            Loading protocol details...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  // Render error state
  if (error) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.safeArea} />
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={primaryColor} />
          <ThemedText variant="bodyMedium" style={{ color: primaryColor }}>Back</ThemedText>
        </TouchableOpacity>
        
        <Card style={styles.errorCard}>
          <Ionicons name="alert-circle" size={48} color={errorColor} style={styles.errorIcon} />
          <ThemedText variant="bodyLarge" style={styles.errorText}>
            {error}
          </ThemedText>
          <Button 
            title="Retry" 
            onPress={() => loadProtocolDetails()} 
            variant="primary"
            size="md"
            leftIcon="refresh"
            style={styles.retryButton}
          />
        </Card>
      </ThemedView>
    );
  }

  // Render protocol not found state
  if (!userProtocol) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.safeArea} />
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={primaryColor} />
          <ThemedText variant="bodyMedium" style={{ color: primaryColor }}>Back</ThemedText>
        </TouchableOpacity>
        
        <Card style={styles.errorCard}>
          <Ionicons name="document-text-outline" size={48} color={secondaryColor} style={styles.errorIcon} />
          <ThemedText variant="bodyLarge" style={styles.errorText}>
            Protocol not found
          </ThemedText>
          <Button 
            title="Go Back" 
            onPress={handleBack} 
            variant="primary"
            size="md"
            leftIcon="arrow-back"
            style={styles.retryButton}
          />
        </Card>
      </ThemedView>
    );
  }

  // Main content - protocol details
  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={primaryColor}
          />
        }
      >
        <View style={styles.safeArea} />
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={primaryColor} />
          <ThemedText variant="bodyMedium" style={{ color: primaryColor }}>Back</ThemedText>
        </TouchableOpacity>

        {/* Protocol header */}
        <View style={styles.header}>
          <ThemedText variant="displaySmall" style={styles.title}>
            {userProtocol.name || userProtocol.protocol?.name || "Protocol Name"}
          </ThemedText>
          
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor()}20` }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
            <ThemedText variant="labelMedium" style={{ color: getStatusColor() }}>
              {getStatusText()}
            </ThemedText>
          </View>
        </View>

        {/* Protocol progress - only show for active protocols */}
        {userProtocol.status === 'active' && userProtocol.protocol?.duration_days && (
          <Card style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <ThemedText variant="bodyMedium" style={styles.sectionTitle}>
                Progress
              </ThemedText>
              <ThemedText variant="labelMedium" style={styles.progressText}>
                {calculateDaysPassed(userProtocol)} days in / {calculateDaysLeft(userProtocol)} days left
              </ThemedText>
            </View>
            
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { width: `${calculateProgress(userProtocol) * 100}%`, backgroundColor: primaryColor }
                ]} 
              />
            </View>
          </Card>
        )}

        {/* Protocol details */}
        <Card style={styles.detailsCard}>
          <ThemedText variant="bodyMedium" style={styles.sectionTitle}>
            Description
          </ThemedText>
          <ThemedText variant="bodySmall" secondary style={styles.description}>
            {userProtocol.description || userProtocol.protocol?.description || 'No description available'}
          </ThemedText>
          
          <View style={styles.divider} />
          
          <ThemedText variant="bodyMedium" style={styles.sectionTitle}>
            Details
          </ThemedText>
          
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar" size={16} color={secondaryColor} style={styles.detailIcon} />
              <ThemedText variant="bodySmall" secondary>
                Started: {formatDate(userProtocol.start_date)}
              </ThemedText>
            </View>
            
            {userProtocol.end_date && (
              <View style={styles.detailItem}>
                <Ionicons name="flag" size={16} color={secondaryColor} style={styles.detailIcon} />
                <ThemedText variant="bodySmall" secondary>
                  Ended: {formatDate(userProtocol.end_date)}
                </ThemedText>
              </View>
            )}
            
            {userProtocol.protocol?.duration_days && (
              <View style={styles.detailItem}>
                <Ionicons name="time" size={16} color={secondaryColor} style={styles.detailIcon} />
                <ThemedText variant="bodySmall" secondary>
                  Duration: {userProtocol.protocol.duration_days} days
                </ThemedText>
              </View>
            )}
            
            {userProtocol.protocol?.target_metrics && userProtocol.protocol.target_metrics.length > 0 && (
              <View style={styles.detailItem}>
                <Ionicons name="analytics" size={16} color={secondaryColor} style={styles.detailIcon} />
                <ThemedText variant="bodySmall" secondary>
                  Targets: {userProtocol.protocol.target_metrics.join(', ')}
                </ThemedText>
              </View>
            )}
          </View>
        </Card>

        {/* Protocol steps - if available */}
        {userProtocol.steps && userProtocol.steps.length > 0 && (
          <Card style={styles.stepsCard}>
            <ThemedText variant="bodyMedium" style={styles.sectionTitle}>
              Protocol Steps
            </ThemedText>
            
            {userProtocol.steps.map((step, index) => (
              <View key={index} style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <ThemedText variant="labelMedium" style={styles.stepNumberText}>
                    {index + 1}
                  </ThemedText>
                </View>
                <ThemedText variant="bodySmall" secondary style={styles.stepText}>
                  {step}
                </ThemedText>
              </View>
            ))}
          </Card>
        )}

        {/* Protocol recommendations - if available */}
        {userProtocol.recommendations && userProtocol.recommendations.length > 0 && (
          <Card style={styles.recommendationsCard}>
            <ThemedText variant="bodyMedium" style={styles.sectionTitle}>
              Recommendations
            </ThemedText>
            
            {userProtocol.recommendations.map((recommendation, index) => (
              <View key={index} style={styles.recommendationItem}>
                <Ionicons name="checkmark-circle" size={20} color={primaryColor} style={styles.recommendationIcon} />
                <ThemedText variant="bodySmall" secondary style={styles.recommendationText}>
                  {recommendation}
                </ThemedText>
              </View>
            ))}
          </Card>
        )}

        {renderProtocolActions()}
        
        <View style={styles.bottomPadding} />
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
  },
  safeArea: {
    height: Platform.OS === 'ios' ? 50 : 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    marginBottom: spacing.sm,
    fontSize: 24,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.md,
    marginBottom: spacing.md,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  progressCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressText: {
    opacity: 0.7,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  detailsCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  stepsCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  recommendationsCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  actionsCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  description: {
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginVertical: spacing.md,
  },
  detailsGrid: {
    gap: spacing.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: spacing.xs,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    lineHeight: 20,
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    alignItems: 'flex-start',
  },
  recommendationIcon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  recommendationText: {
    flex: 1,
    lineHeight: 20,
  },
  buttonContainer: {
    gap: spacing.md,
  },
  actionButton: {
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    textAlign: 'center',
  },
  errorCard: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    margin: spacing.md,
  },
  errorIcon: {
    marginBottom: spacing.md,
  },
  errorText: {
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.md,
  },
  statusMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    padding: spacing.md,
    borderRadius: spacing.sm,
  },
  statusMessageIcon: {
    marginRight: spacing.sm,
  },
  statusMessage: {
    flex: 1,
  },
  bottomPadding: {
    height: 100,
  },
}); 