import React, { useState, useEffect } from 'react';
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
import firestore from '@react-native-firebase/firestore';
import Geolocation from '@react-native-community/geolocation';
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
  createdAt: any;
}

const CheckInScreen = ({ navigation }: any) => {
  const authInstance = getAuth();
  const user = authInstance.currentUser;
  const [loading, setLoading] = useState(false);
  const [checkInHistory, setCheckInHistory] = useState<CheckInHistory[]>([]);
  const [currentLocation, setCurrentLocation] = useState<string>('Barangay Lalaan 2');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadCheckInHistory();
      getCurrentLocation();
    }
  }, [user]);

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        // For now, we'll use the default location
        // In production, you'd reverse geocode the coordinates
        setCurrentLocation('Barangay Lalaan 2');
      },
      (error) => {
        console.log('Location error:', error);
        setCurrentLocation('Barangay Lalaan 2');
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 10000 }
    );
  };

  const loadCheckInHistory = async () => {
    try {
      const snapshot = await firestore()
        .collection('check_ins')
        .where('userId', '==', user!.uid)
        .get();

      const history: CheckInHistory[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        history.push({
          id: doc.id,
          location: data.location || 'Unknown',
          date: data.createdAt ? new Date(data.createdAt.toMillis()).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }) : '',
          time: data.createdAt ? new Date(data.createdAt.toMillis()).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          }) : '',
          status: data.status,
          createdAt: data.createdAt,
        });
      });

      // Sort by createdAt descending
      history.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      setCheckInHistory(history.slice(0, 10)); // Keep only last 10
    } catch (error) {
      console.error('Error loading check-in history:', error);
    }
  };

  const notifyContacts = async (status: 'safe' | 'warning' | 'danger') => {
    try {
      const batch = firestore().batch();
      const userName = user!.displayName || 'A contact';
      const statusEmoji = status === 'safe' ? '✅' : status === 'warning' ? '⚠️' : '🆘';
      const statusText = status === 'safe' ? 'SAFE' : status === 'warning' ? 'NEEDS ATTENTION' : 'EMERGENCY';

      // Get all friends
      const friendsSnapshot = await firestore()
        .collection('friends')
        .doc(user!.uid)
        .collection('userFriends')
        .get();

      friendsSnapshot.forEach((doc) => {
        const friendData = doc.data();
        const notificationRef = firestore().collection('notifications').doc();

        batch.set(notificationRef, {
          userId: friendData.userId,
          type: 'checkin',
          title: `${userName} checked in`,
          message: `${userName} checked in as ${statusText} from ${currentLocation}`,
          status: status,
          fromUserId: user!.uid,
          fromUserName: userName,
          location: currentLocation,
          read: false,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      });

      // Get all family members
      const familySnapshot = await firestore()
        .collection('family')
        .doc(user!.uid)
        .collection('userFamily')
        .get();

      familySnapshot.forEach((doc) => {
        const familyData = doc.data();
        const notificationRef = firestore().collection('notifications').doc();

        batch.set(notificationRef, {
          userId: familyData.userId,
          type: 'checkin',
          title: `${userName} checked in`,
          message: `${userName} checked in as ${statusText} from ${currentLocation}`,
          status: status,
          fromUserId: user!.uid,
          fromUserName: userName,
          location: currentLocation,
          read: false,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      });

      await batch.commit();
      console.log('Notifications sent to friends and family');
    } catch (error) {
      console.error('Error notifying contacts:', error);
    }
  };

  const handleCheckIn = async (status: 'safe' | 'warning' | 'danger') => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to check in');
      return;
    }

    setLoading(true);

    try {
      // Create check-in record
      const checkInRef = firestore().collection('check_ins').doc();
      await checkInRef.set({
        userId: user.uid,
        userName: user.displayName || 'User',
        userEmail: user.email || '',
        status: status,
        location: currentLocation,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      // Notify all friends and family
      await notifyContacts(status);

      // Reload history
      await loadCheckInHistory();

      setLoading(false);

      const statusText = status === 'safe' ? 'SAFE' : status === 'warning' ? 'NEEDS ATTENTION' : 'EMERGENCY';
      Alert.alert(
        'Check-In Successful',
        `You've checked in as ${statusText}. Your friends and family have been notified.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error during check-in:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to check in. Please try again.');
    }
  };

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
    setShowAddFamilyModal(false);
  };

  const handleFriendSubmit = (data: FriendData) => {
    console.log('Friend added:', data);
    setShowAddFriendModal(false);
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

        {/* Check-In Buttons */}
        <View style={styles.checkInSection}>
          <Text style={styles.sectionTitle}>How are you?</Text>
          <Text style={styles.sectionSubtitle}>
            Let your friends and family know your status
          </Text>

          <TouchableOpacity
            style={[styles.checkInButton, styles.safeButton]}
            onPress={() => handleCheckIn('safe')}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <View style={styles.checkInIconContainer}>
                  <Text style={styles.checkInIcon}>✓</Text>
                </View>
                <View style={styles.checkInContent}>
                  <Text style={styles.checkInTitle}>I'm Safe</Text>
                  <Text style={styles.checkInDescription}>
                    Everything is okay
                  </Text>
                </View>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.checkInButton, styles.warningButton]}
            onPress={() => handleCheckIn('warning')}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <View style={styles.checkInIconContainer}>
                  <Text style={styles.checkInIcon}>⚠</Text>
                </View>
                <View style={styles.checkInContent}>
                  <Text style={styles.checkInTitle}>Need Attention</Text>
                  <Text style={styles.checkInDescription}>
                    Requires monitoring
                  </Text>
                </View>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.checkInButton, styles.dangerButton]}
            onPress={() => handleCheckIn('danger')}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <View style={styles.checkInIconContainer}>
                  <Text style={styles.checkInIcon}>!</Text>
                </View>
                <View style={styles.checkInContent}>
                  <Text style={styles.checkInTitle}>Emergency</Text>
                  <Text style={styles.checkInDescription}>
                    Need immediate help
                  </Text>
                </View>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Check-In History */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Recent Check-Ins</Text>

          {checkInHistory.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyHistoryText}>No check-ins yet</Text>
            </View>
          ) : (
            checkInHistory.map(item => (
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
            ))
          )}
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
  checkInSection: {
    paddingHorizontal: 20,
    paddingTop: 32,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 24,
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
  emptyHistory: {
    padding: 40,
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: 14,
    color: '#94A3B8',
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
    paddingBottom: Platform.OS === 'ios' ? 34 : 6,
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