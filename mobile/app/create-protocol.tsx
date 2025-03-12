import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText, ThemedView, Button, Card, TextInput } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import * as api from '@/services/api';
import { spacing } from '@/constants/Spacing';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function CreateProtocolScreen() {
  const primaryColor = useThemeColor({}, 'primary') as string;
  const errorColor = useThemeColor({}, 'error') as string;

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [targetMetrics, setTargetMetrics] = useState('');
  const [steps, setSteps] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [expectedOutcomes, setExpectedOutcomes] = useState('');
  const [category, setCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate required fields
      if (!name || !description || !durationDays || !targetMetrics) {
        setError('Please fill in all required fields');
        return;
      }

      // Create protocol object with today's date as start date
      const protocol: api.ProtocolCreateAndEnroll = {
        name,
        description,
        duration_days: parseInt(durationDays),
        target_metrics: targetMetrics.split(',').map(m => m.trim()),
        steps: steps.split('\n').filter(s => s.trim()),
        recommendations: recommendations.split('\n').filter(r => r.trim()),
        expected_outcomes: expectedOutcomes.split('\n').filter(o => o.trim()),
        category: category || undefined,
        start_date: new Date().toISOString().split('T')[0]
      };

      // Create protocol and enroll user in one step
      await api.createAndEnrollProtocol(protocol);
      
      // Navigate back to protocols page with enrolled tab active
      router.replace('/(tabs)/protocols?tab=enrolled');
    } catch (err) {
      console.error('Error creating protocol:', err);
      setError('Failed to create protocol. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Button
            title="Back"
            variant="ghost"
            leftIcon="chevron-back"
            onPress={() => router.back()}
            style={styles.backButton}
          />
          <ThemedText variant="displaySmall" style={styles.title}>
            Create Custom Protocol
          </ThemedText>
        </View>

        <Card style={styles.formCard}>
          <TextInput
            label="Protocol Name *"
            placeholder="Enter protocol name"
            value={name}
            onChangeText={setName}
          />

          <TextInput
            label="Description *"
            placeholder="Enter protocol description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />

          <TextInput
            label="Duration (days) *"
            placeholder="Enter duration in days"
            value={durationDays}
            onChangeText={setDurationDays}
            keyboardType="number-pad"
          />

          <TextInput
            label="Target Metrics *"
            placeholder="Enter metrics (comma-separated)"
            value={targetMetrics}
            onChangeText={setTargetMetrics}
            helper="e.g., sleep, activity, heart_rate"
          />

          <TextInput
            label="Steps"
            placeholder="Enter protocol steps (one per line)"
            value={steps}
            onChangeText={setSteps}
            multiline
            numberOfLines={4}
          />

          <TextInput
            label="Recommendations"
            placeholder="Enter recommendations (one per line)"
            value={recommendations}
            onChangeText={setRecommendations}
            multiline
            numberOfLines={4}
          />

          <TextInput
            label="Expected Outcomes"
            placeholder="Enter expected outcomes (one per line)"
            value={expectedOutcomes}
            onChangeText={setExpectedOutcomes}
            multiline
            numberOfLines={4}
          />

          <TextInput
            label="Category"
            placeholder="Enter protocol category"
            value={category}
            onChangeText={setCategory}
          />

          {error && (
            <ThemedText style={[styles.errorText, { color: errorColor }]}>
              {error}
            </ThemedText>
          )}

          <Button
            title="Create Protocol"
            variant="primary"
            size="lg"
            leftIcon="add-circle"
            onPress={handleCreate}
            isLoading={isLoading}
            disabled={isLoading}
            style={styles.createButton}
          />
        </Card>
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
  header: {
    marginTop: Platform.OS === 'ios' ? spacing.xl : spacing.md,
    marginBottom: spacing.lg,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  title: {
    marginBottom: spacing.md,
  },
  formCard: {
    padding: spacing.lg,
  },
  errorText: {
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  createButton: {
    marginTop: spacing.md,
  },
}); 