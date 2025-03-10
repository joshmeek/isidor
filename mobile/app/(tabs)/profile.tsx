import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Switch, Alert, ScrollView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText, ThemedView, Button, Card } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { spacing } from '@/constants/Spacing';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function ProfileScreen() {
  console.log('Rendering ProfileScreen');
  const { user, logout } = useAuth();
  
  // Get theme colors
  const primaryColor = useThemeColor({}, 'primary') as string;
  const secondaryColor = useThemeColor({}, 'secondary') as string;
  const backgroundColor = useThemeColor({}, 'backgroundSecondary') as string;
  const errorColor = useThemeColor({}, 'error') as string;
  
  // Settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [healthKitSync, setHealthKitSync] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [aiInteraction, setAiInteraction] = useState('balanced');

  // Define styles with access to theme colors
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
    userInfoCard: {
      marginBottom: spacing.md,
      borderRadius: spacing.md,
      padding: spacing.md,
      backgroundColor: backgroundColor,
    },
    userInfoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatarContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: primaryColor,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    avatarText: {
      color: 'white',
      fontSize: 24,
    },
    userDetails: {
      flex: 1,
    },
    userName: {
      marginBottom: spacing.xs,
    },
    userEmail: {
      fontSize: 14,
    },
    sectionTitle: {
      marginTop: spacing.lg,
      marginBottom: spacing.md,
    },
    settingsCard: {
      marginBottom: spacing.md,
      borderRadius: spacing.md,
      padding: spacing.md,
      backgroundColor: backgroundColor,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
    },
    settingLabelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    settingLabel: {
      marginLeft: spacing.sm,
    },
    aiCard: {
      marginBottom: spacing.md,
      borderRadius: spacing.md,
      padding: spacing.md,
      backgroundColor: backgroundColor,
    },
    aiDescription: {
      marginBottom: spacing.md,
    },
    aiLevelsContainer: {
      flexDirection: 'row',
      marginBottom: spacing.md,
    },
    aiLevelButton: {
      flex: 1,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs,
      borderRadius: spacing.sm,
      borderWidth: 1,
      borderColor: primaryColor,
      backgroundColor: backgroundColor,
      marginHorizontal: spacing.xs,
      alignItems: 'center',
      justifyContent: 'center',
    },
    aiLevelButtonActive: {
      backgroundColor: primaryColor,
    },
    aiLevelButtonText: {
      color: primaryColor,
      fontSize: 14,
      fontWeight: '500',
    },
    aiLevelButtonTextActive: {
      color: 'white',
    },
    aiLevelDescription: {
      textAlign: 'center',
      marginTop: spacing.sm,
    },
    aiLevelDescriptionActive: {
      color: 'white',
    },
    logoutButton: {
      marginTop: spacing.md,
      backgroundColor: errorColor,
    },
    accountCard: {
      marginBottom: spacing.md,
      borderRadius: spacing.md,
      padding: spacing.md,
      backgroundColor: backgroundColor,
    },
    footerContainer: {
      marginTop: spacing.xl,
      alignItems: 'center',
    },
    appInfo: {
      alignItems: 'center',
      marginTop: spacing.xl,
    },
    appVersion: {
      marginBottom: spacing.xs,
      color: secondaryColor,
    },
    appCopyright: {
      color: secondaryColor,
    },
  });

  // Handle logout
  const handleLogout = () => {
    console.log('Logout button pressed');
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: () => {
            console.log('Confirming logout');
            logout();
          },
          style: 'destructive',
        },
      ]
    );
  };

  // Handle AI interaction level change
  const handleAiInteractionChange = (level: string) => {
    console.log('Changing AI interaction level to:', level);
    setAiInteraction(level);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText variant="displaySmall" style={styles.title}>
          Profile
        </ThemedText>

        {/* User Info Section */}
        <Card style={styles.userInfoCard}>
          <View style={styles.userInfoContainer}>
            <View style={styles.avatarContainer}>
              <ThemedText variant="displayMedium" style={styles.avatarText}>
                {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
              </ThemedText>
            </View>
            <View style={styles.userDetails}>
              <ThemedText variant="headingMedium" style={styles.userName}>
                {user?.email ? user.email.split('@')[0] : 'User'}
              </ThemedText>
              <ThemedText variant="bodyMedium" secondary style={styles.userEmail}>
                {user?.email || 'No email available'}
              </ThemedText>
            </View>
          </View>
        </Card>

        {/* Settings Section */}
        <ThemedText variant="headingMedium" style={styles.sectionTitle}>
          Settings
        </ThemedText>
        
        <Card style={styles.settingsCard}>
          {/* Notifications */}
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="notifications" size={20} color={primaryColor} />
              <ThemedText variant="bodyMedium" style={styles.settingLabel}>
                Notifications
              </ThemedText>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#d1d1d1', true: primaryColor }}
              thumbColor="#fff"
            />
          </View>
          
          {/* HealthKit Sync */}
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="heart" size={20} color={primaryColor} />
              <ThemedText variant="bodyMedium" style={styles.settingLabel}>
                HealthKit Sync
              </ThemedText>
            </View>
            <Switch
              value={healthKitSync}
              onValueChange={setHealthKitSync}
              trackColor={{ false: '#d1d1d1', true: primaryColor }}
              thumbColor="#fff"
            />
          </View>
          
          {/* Dark Mode */}
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="moon" size={20} color={primaryColor} />
              <ThemedText variant="bodyMedium" style={styles.settingLabel}>
                Dark Mode
              </ThemedText>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#d1d1d1', true: primaryColor }}
              thumbColor="#fff"
            />
          </View>
        </Card>

        {/* AI Interaction Section */}
        <ThemedText variant="headingMedium" style={styles.sectionTitle}>
          AI Interaction
        </ThemedText>
        
        <Card style={styles.aiCard}>
          <ThemedText variant="bodyMedium" secondary style={styles.aiDescription}>
            Choose how proactive you want Isidor's AI to be in providing insights and recommendations.
          </ThemedText>
          
          <View style={styles.aiLevelsContainer}>
            <TouchableOpacity
              style={[
                styles.aiLevelButton,
                aiInteraction === 'minimal' && styles.aiLevelButtonActive,
              ]}
              onPress={() => handleAiInteractionChange('minimal')}
            >
              <Ionicons 
                name="analytics" 
                size={24} 
                color={aiInteraction === 'minimal' ? '#fff' : primaryColor} 
              />
              <ThemedText
                variant="labelMedium"
                style={[
                  styles.aiLevelButtonText,
                  aiInteraction === 'minimal' && styles.aiLevelButtonTextActive,
                ]}
              >
                Minimal
              </ThemedText>
              <ThemedText
                variant="caption"
                style={[
                  styles.aiLevelDescription,
                  aiInteraction === 'minimal' && styles.aiLevelDescriptionActive,
                ]}
              >
                Data only, no suggestions
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.aiLevelButton,
                aiInteraction === 'balanced' && styles.aiLevelButtonActive,
              ]}
              onPress={() => handleAiInteractionChange('balanced')}
            >
              <Ionicons 
                name="analytics" 
                size={24} 
                color={aiInteraction === 'balanced' ? '#fff' : primaryColor} 
              />
              <ThemedText
                variant="labelMedium"
                style={[
                  styles.aiLevelButtonText,
                  aiInteraction === 'balanced' && styles.aiLevelButtonTextActive,
                ]}
              >
                Balanced
              </ThemedText>
              <ThemedText
                variant="caption"
                style={[
                  styles.aiLevelDescription,
                  aiInteraction === 'balanced' && styles.aiLevelDescriptionActive,
                ]}
              >
                Occasional insights
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.aiLevelButton,
                aiInteraction === 'proactive' && styles.aiLevelButtonActive,
              ]}
              onPress={() => handleAiInteractionChange('proactive')}
            >
              <Ionicons 
                name="analytics" 
                size={24} 
                color={aiInteraction === 'proactive' ? '#fff' : primaryColor} 
              />
              <ThemedText
                variant="labelMedium"
                style={[
                  styles.aiLevelButtonText,
                  aiInteraction === 'proactive' && styles.aiLevelButtonTextActive,
                ]}
              >
                Proactive
              </ThemedText>
              <ThemedText
                variant="caption"
                style={[
                  styles.aiLevelDescription,
                  aiInteraction === 'proactive' && styles.aiLevelDescriptionActive,
                ]}
              >
                Regular suggestions
              </ThemedText>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Account Section */}
        <ThemedText variant="headingMedium" style={styles.sectionTitle}>
          Account
        </ThemedText>
        
        <Card style={styles.accountCard}>
          <Button
            title="Logout"
            onPress={handleLogout}
            variant="destructive"
            leftIcon="log-out"
            fullWidth
          />
        </Card>
        
        {/* App Info */}
        <View style={styles.appInfo}>
          <ThemedText variant="caption" secondary style={styles.appVersion}>
            Isidor v1.0.0
          </ThemedText>
          <ThemedText variant="caption" secondary style={styles.appCopyright}>
            © 2025 Isidor
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
} 