import React, { useState, useEffect } from 'react';
import { StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, View, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText, ThemedView, Button, Card } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import * as api from '@/services/api';
import { spacing } from '@/constants/Spacing';
import { useThemeColor } from '@/hooks/useThemeColor';
import { UUID, Protocol, UserProtocolWithProtocol } from '@/services/api';

// Add the missing calculation functions
const calculateProgress = (userProtocol: UserProtocolWithProtocol) => {
  if (!userProtocol || !userProtocol.protocol) {
    return 0;
  }
  
  const startDate = new Date(userProtocol.start_date);
  const today = new Date();
  const totalDays = userProtocol.protocol.duration_days || 30; // Default to 30 if not specified
  
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
  if (!userProtocol || !userProtocol.protocol) {
    return 0;
  }
  
  const startDate = new Date(userProtocol.start_date);
  const today = new Date();
  const totalDays = userProtocol.protocol.duration_days || 30; // Default to 30 if not specified
  
  const daysPassed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, totalDays - daysPassed);
};

export default function ProtocolDetailsScreen() {
  console.log('Rendering ProtocolDetailsScreen');
  const params = useLocalSearchParams();
  const id = params.id as string;
  
  console.log('Protocol ID from params:', id);
  
  const [userProtocol, setUserProtocol] = useState<UserProtocolWithProtocol | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get theme colors
  const primaryColor = useThemeColor({}, 'primary') as string;
  const secondaryColor = useThemeColor({}, 'secondary') as string;
  const backgroundColor = useThemeColor({}, 'backgroundSecondary') as string;
  const successColor = useThemeColor({}, 'success') as string;
  const errorColor = useThemeColor({}, 'error') as string;

  // Define styles with access to theme colors
  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingTop: Platform.OS === 'ios' ? spacing['3xl'] : spacing.lg,
      paddingBottom: spacing.sm,
    },
    backButton: {
      padding: spacing.xs,
      marginRight: spacing.sm,
    },
    title: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    loadingText: {
      marginTop: spacing.md,
    },
    errorCard: {
      margin: spacing.lg,
      padding: spacing.lg,
      alignItems: 'center',
    },
    errorText: {
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    contentContainer: {
      padding: spacing.md,
    },
    sectionTitle: {
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    descriptionText: {
      marginBottom: spacing.md,
      color: secondaryColor,
    },
    infoCard: {
      marginBottom: spacing.md,
      backgroundColor: backgroundColor,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    infoLabel: {
      color: secondaryColor,
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: spacing.xs,
    },
    progressContainer: {
      marginTop: spacing.md,
    },
    progressBar: {
      height: 8,
      borderRadius: 4,
      backgroundColor: primaryColor,
    },
    progressBackground: {
      height: 8,
      borderRadius: 4,
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
      marginBottom: spacing.xs,
    },
    progressText: {
      textAlign: 'right',
      color: secondaryColor,
    },
    metricsCard: {
      marginBottom: spacing.md,
      backgroundColor: backgroundColor,
    },
    metricRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    metricIcon: {
      marginRight: spacing.sm,
    },
    metricName: {
      flex: 1,
      color: primaryColor,
    },
    buttonContainer: {
      padding: spacing.md,
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    button: {
      flex: 1,
      marginHorizontal: spacing.xs,
    },
    completeButton: {
      backgroundColor: successColor,
    },
    abandonButton: {
      backgroundColor: errorColor,
    },
    buttonText: {
      color: primaryColor,
    },
    chartContainer: {
      marginTop: spacing.md,
      marginBottom: spacing.lg,
      height: 200,
    },
    chartTitle: {
      marginBottom: spacing.sm,
      color: primaryColor,
    },
    chartLegend: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: spacing.sm,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: spacing.sm,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: spacing.xs,
    },
    legendText: {
      color: secondaryColor,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: spacing.md,
      paddingBottom: spacing['3xl'],
    },
    protocolCard: {
      marginHorizontal: spacing.md,
      marginBottom: spacing.md,
    },
    protocolHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    protocolName: {
      flex: 1,
    },
    statusText: {
      marginLeft: spacing.xs,
    },
    progressFill: {
      height: '100%',
      backgroundColor: primaryColor,
    },
    progressCard: {
      borderRadius: spacing.md,
      padding: spacing.md,
      marginBottom: spacing.md,
      backgroundColor: backgroundColor,
    },
    progressBarContainer: {
      marginBottom: spacing.md,
    },
    daysContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.xs,
    },
    dayInfo: {
      alignItems: 'center',
    },
    dayNumber: {
      fontSize: 24,
      fontWeight: '700',
      color: secondaryColor,
      marginBottom: spacing.xs,
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
      color: secondaryColor,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    completedDate: {
      fontSize: 14,
      color: secondaryColor,
    },
    abandonedContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
    },
    abandonedText: {
      fontSize: 18,
      fontWeight: '600',
      color: secondaryColor,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    abandonedDate: {
      fontSize: 14,
      color: secondaryColor,
    },
  });

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

  // Get status color based on protocol status
  const getStatusColor = () => {
    if (!userProtocol) return primaryColor;
    
    switch (userProtocol.status) {
      case 'completed':
        return successColor;
      case 'abandoned':
        return errorColor;
      default:
        return primaryColor;
    }
  };

  // Get formatted status text
  const getStatusText = () => {
    if (!userProtocol) return 'Active';
    
    // Capitalize first letter and replace underscores with spaces
    return userProtocol.status.charAt(0).toUpperCase() + 
           userProtocol.status.slice(1).replace(/_/g, ' ');
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
            <Ionicons name="chevron-back" size={24} color={primaryColor} />
          </TouchableOpacity>
          <ThemedText variant="headingLarge" style={styles.title}>
            Protocol Details
          </ThemedText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
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
            <Ionicons name="chevron-back" size={24} color={primaryColor} />
          </TouchableOpacity>
          <ThemedText variant="headingLarge" style={styles.title}>
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
          <Ionicons name="chevron-back" size={24} color={primaryColor} />
        </TouchableOpacity>
        <ThemedText variant="headingLarge" style={styles.title}>
          Protocol Details
        </ThemedText>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Protocol Header */}
        <Card style={styles.protocolCard}>
          <View style={styles.protocolHeader}>
            <ThemedText variant="headingMedium" style={styles.protocolName}>
              {userProtocol.protocol?.name || 'Unknown Protocol'}
            </ThemedText>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
            <ThemedText variant="bodyMedium" style={styles.statusText}>
              {getStatusText()}
            </ThemedText>
          </View>
          
          <ThemedText variant="bodyMedium" style={styles.descriptionText}>
            {userProtocol.protocol?.description || 'No description available'}
          </ThemedText>
          
          {userProtocol.protocol?.duration_days && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBackground}>
                <View 
                  style={[
                    styles.progressBar, 
                    { width: `${calculateProgress(userProtocol) * 100}%` }
                  ]} 
                />
              </View>
              <ThemedText variant="bodySmall" style={styles.progressText}>
                {calculateDaysPassed(userProtocol)} days completed / {calculateDaysLeft(userProtocol)} days left
              </ThemedText>
            </View>
          )}
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
                      { width: `${calculateProgress(userProtocol) * 100}%` }
                    ]} 
                  />
                </View>
                <ThemedText variant="bodySmall" style={styles.progressText}>
                  {Math.round(calculateProgress(userProtocol) * 100)}% Complete
                </ThemedText>
              </View>
              
              <View style={styles.daysContainer}>
                <View style={styles.dayInfo}>
                  <ThemedText variant="headingSmall" style={styles.dayNumber}>
                    {calculateDaysPassed(userProtocol)}
                  </ThemedText>
                  <ThemedText variant="caption" secondary>
                    Days Passed
                  </ThemedText>
                </View>
                
                <View style={styles.dayInfo}>
                  <ThemedText variant="headingSmall" style={styles.dayNumber}>
                    {calculateDaysLeft(userProtocol)}
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