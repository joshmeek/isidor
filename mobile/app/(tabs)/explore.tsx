import { StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Collapsible } from '@/components/Collapsible';

export default function ExploreScreen() {
  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Isidor Protocols</ThemedText>
        <ThemedText style={styles.subtitle}>
          Structured frameworks for health optimization
        </ThemedText>
      </ThemedView>

      <Collapsible title="Sleep Optimization Protocol">
        <ThemedText>
          The Sleep Optimization Protocol helps you improve sleep quality through consistent schedules,
          environment optimization, and habit tracking.
        </ThemedText>
        <ThemedView style={styles.bulletPoints}>
          <ThemedText>• Tracks sleep duration and quality</ThemedText>
          <ThemedText>• Analyzes sleep consistency</ThemedText>
          <ThemedText>• Identifies optimal bedtime windows</ThemedText>
          <ThemedText>• Measures deep sleep improvements</ThemedText>
        </ThemedView>
      </Collapsible>

      <Collapsible title="Activity Building Protocol">
        <ThemedText>
          The Activity Building Protocol helps you gradually increase physical activity
          while maintaining proper recovery balance.
        </ThemedText>
        <ThemedView style={styles.bulletPoints}>
          <ThemedText>• Progressive activity targets</ThemedText>
          <ThemedText>• Recovery quality assessment</ThemedText>
          <ThemedText>• Strain vs recovery balance</ThemedText>
          <ThemedText>• Activity type effectiveness</ThemedText>
        </ThemedView>
      </Collapsible>

      <Collapsible title="Recovery Protocol">
        <ThemedText>
          The Recovery Protocol helps you optimize your body's recovery processes
          through targeted interventions and tracking.
        </ThemedText>
        <ThemedView style={styles.bulletPoints}>
          <ThemedText>• HRV monitoring</ThemedText>
          <ThemedText>• Sleep quality analysis</ThemedText>
          <ThemedText>• Stress management techniques</ThemedText>
          <ThemedText>• Recovery activity recommendations</ThemedText>
        </ThemedView>
      </Collapsible>

      <ThemedView style={styles.featureSection}>
        <ThemedText type="subtitle">Key Features</ThemedText>
        <ThemedView style={styles.feature}>
          <ThemedText type="defaultSemiBold">AI-Driven Analysis</ThemedText>
          <ThemedText>Personalized insights based on your unique patterns</ThemedText>
        </ThemedView>
        <ThemedView style={styles.feature}>
          <ThemedText type="defaultSemiBold">Privacy-First Design</ThemedText>
          <ThemedText>Your health data remains secure and private</ThemedText>
        </ThemedView>
        <ThemedView style={styles.feature}>
          <ThemedText type="defaultSemiBold">User Autonomy</ThemedText>
          <ThemedText>You control how much AI interacts with you</ThemedText>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    alignItems: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  bulletPoints: {
    marginTop: 8,
    marginLeft: 8,
  },
  featureSection: {
    padding: 16,
    marginTop: 16,
  },
  feature: {
    marginBottom: 16,
  },
});
