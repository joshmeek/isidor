import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, NativeModules } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ui';
import useHealthKit from '@/hooks/useHealthKit';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/useThemeColor';

// Check if the native module is available
const hasNativeModule = NativeModules.AppleHealthKit !== null && NativeModules.AppleHealthKit !== undefined;

interface HealthKitSyncProps {
  onSync?: () => void;
}

const HealthKitSync: React.FC<HealthKitSyncProps> = ({ onSync }) => {
  const { user } = useAuth();
  const {
    isAvailable,
    hasPermissions,
    isLoading,
    error,
    steps,
    distance,
    flightsClimbed,
    activeEnergyBurned,
    syncWithHealthKit,
  } = useHealthKit();

  // Get theme colors
  const primaryColor = useThemeColor({}, 'primary') as string;
  const secondaryColor = useThemeColor({}, 'secondary') as string;
  const backgroundColor = useThemeColor({}, 'backgroundSecondary') as string;
  const textColor = useThemeColor({}, 'text') as string;

  // Handle sync button press
  const handleSync = async () => {
    if (!user || !user.id) {
      return;
    }
    
    await syncWithHealthKit(user.id);
    
    if (onSync) {
      onSync();
    }
  };

  // If not on iOS, show a message
  if (Platform.OS !== 'ios') {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <ThemedText style={styles.title}>Apple HealthKit</ThemedText>
        <ThemedText style={styles.message}>
          Apple HealthKit is only available on iOS devices.
        </ThemedText>
      </View>
    );
  }

  // If the native module is not available, show a message
  if (!hasNativeModule) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <ThemedText style={styles.title}>Apple HealthKit</ThemedText>
        <ThemedText style={styles.error}>
          HealthKit integration is not available.
        </ThemedText>
      </View>
    );
  }

  // If HealthKit is not available, show a message
  if (!isAvailable) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <ThemedText style={styles.title}>Apple HealthKit</ThemedText>
        <ThemedText style={styles.message}>
          HealthKit is not available on this device.
        </ThemedText>
      </View>
    );
  }

  // If there's an error, show it
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <ThemedText style={styles.title}>Apple HealthKit</ThemedText>
        <ThemedText style={styles.error}>Error: {error}</ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Apple HealthKit</ThemedText>
        <TouchableOpacity
          style={[styles.syncButton, { backgroundColor: primaryColor }]}
          onPress={handleSync}
          disabled={isLoading || !hasPermissions}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Ionicons name="sync" size={16} color="white" />
              <ThemedText style={styles.syncButtonText} lightColor="white" darkColor="white">
                Sync
              </ThemedText>
            </>
          )}
        </TouchableOpacity>
      </View>

      {!hasPermissions ? (
        <View style={styles.messageContainer}>
          <ThemedText style={styles.message}>
            Please grant permission to access your health data.
          </ThemedText>
          <TouchableOpacity
            style={[styles.permissionButton, { backgroundColor: primaryColor }]}
            onPress={handleSync}
            disabled={isLoading}
          >
            <ThemedText style={styles.permissionButtonText} lightColor="white" darkColor="white">
              Grant Permissions
            </ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.dataContainer}>
          <View style={styles.dataRow}>
            <View style={styles.dataItem}>
              <ThemedText style={styles.dataLabel}>Steps</ThemedText>
              <ThemedText style={styles.dataValue}>{steps}</ThemedText>
            </View>
            <View style={styles.dataItem}>
              <ThemedText style={styles.dataLabel}>Distance</ThemedText>
              <ThemedText style={styles.dataValue}>{(distance / 1000).toFixed(2)} km</ThemedText>
            </View>
          </View>
          <View style={styles.dataRow}>
            <View style={styles.dataItem}>
              <ThemedText style={styles.dataLabel}>Flights Climbed</ThemedText>
              <ThemedText style={styles.dataValue}>{flightsClimbed}</ThemedText>
            </View>
            <View style={styles.dataItem}>
              <ThemedText style={styles.dataLabel}>Active Calories</ThemedText>
              <ThemedText style={styles.dataValue}>{activeEnergyBurned.toFixed(0)}</ThemedText>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  syncButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  messageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  message: {
    textAlign: 'center',
    marginBottom: 16,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 12,
  },
  codeBlock: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  code: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
  },
  permissionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  permissionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dataContainer: {
    marginTop: 8,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dataItem: {
    flex: 1,
    alignItems: 'center',
  },
  dataLabel: {
    fontSize: 12,
    marginBottom: 4,
    opacity: 0.7,
  },
  dataValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HealthKitSync; 