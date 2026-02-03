import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuth } from '@react-native-firebase/auth';
import { colors } from '../config/colors';

// Import modals
import AddContactModal from '../components/modals/AddContactModal';
import AddFamilyModal, { FamilyMemberData } from '../components/modals/AddFamilyModal';
import AddFriendModal, { FriendData } from '../components/modals/AddFriendModal';

interface CheckInHistory {
  id: string;
  location: string;
  date: string;
  time: string;
  status: 'safe' | 'warning' | 'danger';
}

const CheckInScreen = ({ navigation }: any) => {
  const authInstance = getAuth();
  const user = authInstance.currentUser;
  const [loading, setLoading] = useState(false);
  const [lastCheckIn, setLastCheckIn] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);

  // Modal handlers
  const handleAddFamily = () => {
    setShowAddModal(false);
    setTimeout(() => setShowAddFamilyModal(true), 300);
  };

  const handleAddFriend = () => {
    setShowAddModal(false);
    setTimeout(() => setShowAddFriendModal(true), 300);
  };

  const handleFamilySubmit = (data: FamilyMemberData) => {
    console.log('Family member added:', data);
    Alert.alert('Success', `${data.name} has been added to your family contacts`);
    setShowAddFamilyModal(false);
    // TODO: Add to database/state
  };

  const handleFriendSubmit = (data: FriendData) => {
    console.log('Friend added:', data);
    Alert.alert('Success', `Request sent to ${data.name}`);
    setShowAddFriendModal(false);
    // TODO: Add to database/state
  };

  const checkInHistory: CheckInHistory[] = [
    {
      id: '1',
      location: 'Barangay Lalaan 2',
      date: 'Jan 28, 2026',
      time: '2:30 PM',
      status: 'safe',
    },
    {
      id: '2',
      location: 'Barangay Hall',
      date: 'Jan 27, 2026',
      time: '10:15 AM',
      status: 'safe',
    },
  ];

  const handleCheckIn = async (status: 'safe' | 'warning' | 'danger') => {
    setLoading(true);
    
    setTimeout(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
      
      setLastCheckIn(`${timeStr} - ${status.toUpperCase()}`);
      setLoading(false);
      
      Alert.alert(
        'Check-In Successful',
        `You've checked in as ${status.toUpperCase()}. Your emergency contacts will be notified.`,
        [{ text: 'OK' }]
      );
    }, 1500);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe':
        return '#10B981';
      case 'warning':
        return '#F59E0B';
      case 'danger':
        return '#EF4444';
      default:
        return '#64748B';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe':
        return '✓';
      case 'warning':
        return '⚠';
      case 'danger':
        return '!';
      default:
        return '•';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Safety Check-In</Text>

          <View style={styles.placeholder} />
        </View>

        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.displayName?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
            <View style={styles.statusInfo}>
              <Text style={styles.userName}>{user?.displayName || 'User'}</Text>
              <Text style={styles.locationText}>📍 Barangay Lalaan 2</Text>
            </View>
          </View>

          {lastCheckIn && (
            <View style={styles.lastCheckInBadge}>
              <Text style={styles.lastCheckInLabel}>Last Check-In</Text>
              <Text style={styles.lastCheckInText}>{lastCheckIn}</Text>
            </View>
          )}
        </View>

        {/* Check-In Buttons */}
        <View style={styles.checkInSection}>
          <Text style={styles.sectionTitle}>How are you?</Text>
          <Text style={styles.sectionSubtitle}>
            Let your emergency contacts know your status
          </Text>

          <TouchableOpacity
            style={[styles.checkInButton, styles.safeButton]}
            onPress={() => handleCheckIn('safe')}
            disabled={loading}
          >
            <View style={styles.checkInIconContainer}>
              <Text style={styles.checkInIcon}>✓</Text>
            </View>
            <View style={styles.checkInContent}>
              <Text style={styles.checkInTitle}>I'm Safe</Text>
              <Text style={styles.checkInDescription}>
                Everything is okay
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.checkInButton, styles.warningButton]}
            onPress={() => handleCheckIn('warning')}
            disabled={loading}
          >
            <View style={styles.checkInIconContainer}>
              <Text style={styles.checkInIcon}>⚠</Text>
            </View>
            <View style={styles.checkInContent}>
              <Text style={styles.checkInTitle}>Need Attention</Text>
              <Text style={styles.checkInDescription}>
                Requires monitoring
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.checkInButton, styles.dangerButton]}
            onPress={() => handleCheckIn('danger')}
            disabled={loading}
          >
            <View style={styles.checkInIconContainer}>
              <Text style={styles.checkInIcon}>!</Text>
            </View>
            <View style={styles.checkInContent}>
              <Text style={styles.checkInTitle}>Emergency</Text>
              <Text style={styles.checkInDescription}>
                Need immediate help
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Check-In History */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Recent Check-Ins</Text>

          {checkInHistory.map(item => (
            <View key={item.id} style={styles.historyCard}>
              <View
                style={[
                  styles.historyStatus,
                  { backgroundColor: getStatusColor(item.status) },
                ]}
              >
                <Text style={styles.historyStatusIcon}>
                  {getStatusIcon(item.status)}
                </Text>
              </View>

              <View style={styles.historyInfo}>
                <Text style={styles.historyLocation}>{item.location}</Text>
                <View style={styles.historyMeta}>
                  <Text style={styles.historyDate}>{item.date}</Text>
                  <Text style={styles.historyDot}>•</Text>
                  <Text style={styles.historyTime}>{item.time}</Text>
                </View>
              </View>

              <View
                style={[
                  styles.historyBadge,
                  { backgroundColor: getStatusColor(item.status) + '15' },
                ]}
              >
                <Text
                  style={[
                    styles.historyBadgeText,
                    { color: getStatusColor(item.status) },
                  ]}
                >
                  {item.status}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Hotline')}>
          <Text style={styles.navIcon}>📞</Text>
          <Text style={styles.navLabel}>Hotline</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.navIcon}>📍</Text>
          <Text style={styles.navLabel}>Location</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItemCenter}
          onPress={() => setShowAddModal(true)}
        >
          <View style={styles.centerButton}>
            <Text style={styles.centerIcon}>+</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('CheckIn')}>
          <Text style={[styles.navIcon, styles.navIconActive]}>✓</Text>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Check-in</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Notifications')}>
          <Text style={styles.navIcon}>🔔</Text>
          <Text style={styles.navLabel}>Alerts</Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <AddContactModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddFamily={handleAddFamily}
        onAddFriend={handleAddFriend}
      />

      <AddFamilyModal
        visible={showAddFamilyModal}
        onClose={() => setShowAddFamilyModal(false)}
        onSubmit={handleFamilySubmit}
      />

      <AddFriendModal
        visible={showAddFriendModal}
        onClose={() => setShowAddFriendModal(false)}
        onSubmit={handleFriendSubmit}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'ios' ? 100 : 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#3B82F6',
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  placeholder: {
    width: 40,
  },
  statusCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#64748B',
  },
  lastCheckInBadge: {
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  lastCheckInLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  lastCheckInText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  checkInSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
  },
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  safeButton: {
    backgroundColor: '#10B981',
  },
  warningButton: {
    backgroundColor: '#F59E0B',
  },
  dangerButton: {
    backgroundColor: '#EF4444',
  },
  checkInIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  checkInIcon: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  checkInContent: {
    flex: 1,
  },
  checkInTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  checkInDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  historySection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  historyStatus: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyStatusIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  historyInfo: {
    flex: 1,
  },
  historyLocation: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  historyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyDate: {
    fontSize: 13,
    color: '#64748B',
  },
  historyDot: {
    fontSize: 13,
    color: '#64748B',
    marginHorizontal: 8,
  },
  historyTime: {
    fontSize: 13,
    color: '#64748B',
  },
  historyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  historyBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 8,
    paddingBottom: Platform.OS === 'ios' ? 34 : 48,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  navItemCenter: {
    flex: 1,
    alignItems: 'center',
    marginTop: -32,
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
    opacity: 0.6,
  },
  navIconActive: {
    opacity: 1,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  navLabelActive: {
    color: '#3B82F6',
    fontWeight: '700',
  },
  centerButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  centerIcon: {
    fontSize: 36,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default CheckInScreen;