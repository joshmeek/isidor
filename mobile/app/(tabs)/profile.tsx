import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Switch, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  console.log('Rendering ProfileScreen');
  const { user, logout } = useAuth();
  
  // Settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [healthKitSync, setHealthKitSync] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [aiInteraction, setAiInteraction] = useState('balanced');

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
      <View style={styles.header}>
        <ThemedText style={styles.title}>Profile</ThemedText>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* User Info Section */}
        <View style={styles.section}>
          <View style={styles.userInfoContainer}>
            <View style={styles.avatarContainer}>
              <ThemedText style={styles.avatarText}>
                {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
              </ThemedText>
            </View>
            <View style={styles.userDetails}>
              <ThemedText style={styles.userName}>
                {user?.email ? user.email.split('@')[0] : 'User'}
              </ThemedText>
              <ThemedText style={styles.userEmail}>
                {user?.email || 'No email available'}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Settings</ThemedText>
          
          {/* Notifications */}
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="notifications-outline" size={20} color="#0a7ea4" />
              <ThemedText style={styles.settingLabel}>Notifications</ThemedText>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#d1d1d1', true: '#0a7ea4' }}
              thumbColor="#fff"
            />
          </View>
          
          {/* HealthKit Sync */}
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="heart-outline" size={20} color="#0a7ea4" />
              <ThemedText style={styles.settingLabel}>HealthKit Sync</ThemedText>
            </View>
            <Switch
              value={healthKitSync}
              onValueChange={setHealthKitSync}
              trackColor={{ false: '#d1d1d1', true: '#0a7ea4' }}
              thumbColor="#fff"
            />
          </View>
          
          {/* Dark Mode */}
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="moon-outline" size={20} color="#0a7ea4" />
              <ThemedText style={styles.settingLabel}>Dark Mode</ThemedText>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#d1d1d1', true: '#0a7ea4' }}
              thumbColor="#fff"
            />
          </View>
          
          {/* AI Interaction Level */}
          <View style={styles.aiSettingContainer}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="analytics-outline" size={20} color="#0a7ea4" />
              <ThemedText style={styles.settingLabel}>AI Interaction Level</ThemedText>
            </View>
            
            <View style={styles.aiLevelContainer}>
              <TouchableOpacity
                style={[
                  styles.aiLevelButton,
                  aiInteraction === 'minimal' && styles.aiLevelButtonActive,
                ]}
                onPress={() => handleAiInteractionChange('minimal')}
              >
                <ThemedText
                  style={[
                    styles.aiLevelButtonText,
                    aiInteraction === 'minimal' && styles.aiLevelButtonTextActive,
                  ]}
                >
                  Minimal
                </ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.aiLevelButton,
                  aiInteraction === 'balanced' && styles.aiLevelButtonActive,
                ]}
                onPress={() => handleAiInteractionChange('balanced')}
              >
                <ThemedText
                  style={[
                    styles.aiLevelButtonText,
                    aiInteraction === 'balanced' && styles.aiLevelButtonTextActive,
                  ]}
                >
                  Balanced
                </ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.aiLevelButton,
                  aiInteraction === 'proactive' && styles.aiLevelButtonActive,
                ]}
                onPress={() => handleAiInteractionChange('proactive')}
              >
                <ThemedText
                  style={[
                    styles.aiLevelButtonText,
                    aiInteraction === 'proactive' && styles.aiLevelButtonTextActive,
                  ]}
                >
                  Proactive
                </ThemedText>
              </TouchableOpacity>
            </View>
            
            <ThemedText style={styles.aiLevelDescription}>
              {aiInteraction === 'minimal' && 'Minimal AI interaction with basic insights only.'}
              {aiInteraction === 'balanced' && 'Balanced AI interaction with regular insights and suggestions.'}
              {aiInteraction === 'proactive' && 'Proactive AI interaction with frequent insights and recommendations.'}
            </ThemedText>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>About</ThemedText>
          
          <TouchableOpacity style={styles.aboutRow}>
            <View style={styles.aboutLabelContainer}>
              <Ionicons name="information-circle-outline" size={20} color="#0a7ea4" />
              <ThemedText style={styles.aboutLabel}>About Isidor</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.aboutRow}>
            <View style={styles.aboutLabelContainer}>
              <Ionicons name="shield-outline" size={20} color="#0a7ea4" />
              <ThemedText style={styles.aboutLabel}>Privacy Policy</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.aboutRow}>
            <View style={styles.aboutLabelContainer}>
              <Ionicons name="document-text-outline" size={20} color="#0a7ea4" />
              <ThemedText style={styles.aboutLabel}>Terms of Service</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#999" />
          </TouchableOpacity>
          
          <View style={styles.versionContainer}>
            <ThemedText style={styles.versionText}>Version 1.0.0</ThemedText>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#e74c3c" />
          <ThemedText style={styles.logoutButtonText}>Logout</ThemedText>
        </TouchableOpacity>
        
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
    marginBottom: 16,
  },
  scrollView: {
    flex: 1,
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
    marginBottom: 16,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  userDetails: {
    marginLeft: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    marginLeft: 12,
  },
  aiSettingContainer: {
    paddingVertical: 12,
  },
  aiLevelContainer: {
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 8,
    gap: 8,
  },
  aiLevelButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#0a7ea4',
  },
  aiLevelButtonActive: {
    backgroundColor: '#0a7ea4',
  },
  aiLevelButtonText: {
    fontSize: 14,
    color: '#0a7ea4',
    fontWeight: '500',
  },
  aiLevelButtonTextActive: {
    color: '#fff',
  },
  aiLevelDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  aboutLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aboutLabel: {
    fontSize: 16,
    marginLeft: 12,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  versionText: {
    fontSize: 12,
    color: '#999',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginLeft: 8,
  },
  spacer: {
    height: 40,
  },
}); 