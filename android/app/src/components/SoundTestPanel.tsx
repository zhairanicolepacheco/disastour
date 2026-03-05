/**
 * SoundTestPanel
 * Drop this anywhere in your app during development to test all notification sounds.
 * Remove or wrap in __DEV__ before shipping.
 *
 * Usage in NotificationsScreen (just before the closing </SafeAreaView>):
 *   {__DEV__ && <SoundTestPanel />}
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import notificationService from '../services/notificationService';

const TESTS = [
  {
    label: '✅ Safe Check-In',
    description: 'safe_checkin.mp3 + local notification',
    color: '#10B981',
    action: () => notificationService.sendTestSafeNotification(),
  },
  {
    label: '⚠️ Warning Alert',
    description: 'warning_checkin.mp3 + local notification',
    color: '#F59E0B',
    action: () => notificationService.sendTestWarningNotification(),
  },
  {
    label: '🆘 Emergency',
    description: 'danger_checkin.mp3 + local notification',
    color: '#EF4444',
    action: () => notificationService.sendTestDangerNotification(),
  },
  {
    label: '🔔 General',
    description: 'general_notification.mp3 + local notification',
    color: '#3B82F6',
    action: () => notificationService.sendTestGeneralNotification(),
  },
  {
    label: '🔊 Safe (sound only)',
    description: 'Plays sound without showing a notification',
    color: '#10B981',
    action: () => notificationService.playSoundForType('safe'),
  },
  {
    label: '🔊 Warning (sound only)',
    description: 'Plays sound without showing a notification',
    color: '#F59E0B',
    action: () => notificationService.playSoundForType('warning'),
  },
  {
    label: '🔊 Danger (sound only)',
    description: 'Plays sound without showing a notification',
    color: '#EF4444',
    action: () => notificationService.playSoundForType('danger'),
  },
  {
    label: '🔊 General (sound only)',
    description: 'Plays sound without showing a notification',
    color: '#3B82F6',
    action: () => notificationService.playSoundForType('general'),
  },
] as const;

const SoundTestPanel = () => {
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);

  const run = async (index: number) => {
    setLoadingIndex(index);
    try {
      await TESTS[index].action();
    } catch (e: any) {
      Alert.alert('Test failed', e?.message ?? String(e));
    } finally {
      // Small delay so user can see the spinner
      setTimeout(() => setLoadingIndex(null), 600);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🧪 Sound Test Panel</Text>
        <Text style={styles.subtitle}>DEV ONLY — remove before release</Text>
      </View>

      <Text style={styles.sectionLabel}>Full notification (sound + banner)</Text>
      {TESTS.slice(0, 4).map((test, i) => (
        <TouchableOpacity
          key={i}
          style={[styles.button, { borderLeftColor: test.color }]}
          onPress={() => run(i)}
          disabled={loadingIndex !== null}
        >
          <View style={styles.buttonContent}>
            <Text style={styles.buttonLabel}>{test.label}</Text>
            <Text style={styles.buttonDesc}>{test.description}</Text>
          </View>
          {loadingIndex === i ? (
            <ActivityIndicator size="small" color={test.color} />
          ) : (
            <Text style={[styles.arrow, { color: test.color }]}>▶</Text>
          )}
        </TouchableOpacity>
      ))}

      <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Sound only (no banner)</Text>
      {TESTS.slice(4).map((test, i) => (
        <TouchableOpacity
          key={i + 4}
          style={[styles.button, { borderLeftColor: test.color }]}
          onPress={() => run(i + 4)}
          disabled={loadingIndex !== null}
        >
          <View style={styles.buttonContent}>
            <Text style={styles.buttonLabel}>{test.label}</Text>
            <Text style={styles.buttonDesc}>{test.description}</Text>
          </View>
          {loadingIndex === i + 4 ? (
            <ActivityIndicator size="small" color={test.color} />
          ) : (
            <Text style={[styles.arrow, { color: test.color }]}>▶</Text>
          )}
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={styles.stopButton}
        onPress={() => notificationService.stopAllSounds()}
      >
        <Text style={styles.stopButtonText}>⏹ Stop All Sounds</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFF8E1',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFC107',
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonContent: {
    flex: 1,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  buttonDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  arrow: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  stopButton: {
    marginTop: 8,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  stopButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default SoundTestPanel;