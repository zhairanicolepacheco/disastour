import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuth } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { colors } from '../config/colors';

// Import modals
import AddContactModal from '../components/modals/AddContactModal';
import AddFamilyModal, { FamilyMemberData } from '../components/modals/AddFamilyModal';
import AddFriendModal, { FriendData } from '../components/modals/AddFriendModal';

interface Notification {
  id: string;
  type: 'alert' | 'checkin' | 'location' | 'update' | 'friend_request' | 'family_request' | 'friend_accepted' | 'family_accepted';
  title: string;
  message: string;
  time: string;
  read: boolean;
  status?: 'safe' | 'warning' | 'danger';
  fromUserId?: string;
  fromUserName?: string;
  location?: string;
  createdAt: any;
}

const NotificationsScreen = ({ navigation }: any) => {
  const authInstance = getAuth();
  const user = authInstance.currentUser;
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [friendRequestCount, setFriendRequestCount] = useState(0);
  const [familyRequestCount, setFamilyRequestCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Listen to notifications in real-time
    const unsubscribe = firestore()
      .collection('notifications')
      .where('userId', '==', user.uid)
      .onSnapshot(
        (snapshot) => {
          const notifs: Notification[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            notifs.push({
              id: doc.id,
              type: data.type || 'update',
              title: data.title || '',
              message: data.message || '',
              time: formatTime(data.createdAt),
              read: data.read || false,
              status: data.status,
              fromUserId: data.fromUserId,
              fromUserName: data.fromUserName,
              location: data.location,
              createdAt: data.createdAt,
            });
          });

          // Sort by createdAt descending
          notifs.sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || 0;
            const bTime = b.createdAt?.toMillis?.() || 0;
            return bTime - aTime;
          });

          setNotifications(notifs);
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching notifications:', error);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Listen to friend requests count
    const friendUnsubscribe = firestore()
      .collection('friend_requests')
      .where('toUserId', '==', user.uid)
      .where('status', '==', 'pending')
      .onSnapshot((snapshot) => {
        setFriendRequestCount(snapshot.size);
      });

    // Listen to family requests count
    const familyUnsubscribe = firestore()
      .collection('family_requests')
      .where('toUserId', '==', user.uid)
      .where('status', '==', 'pending')
      .onSnapshot((snapshot) => {
        setFamilyRequestCount(snapshot.size);
      });

    return () => {
      friendUnsubscribe();
      familyUnsubscribe();
    };
  }, [user]);

  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'Just now';

    const now = new Date();
    const time = timestamp.toDate();
    const diff = Math.floor((now.getTime() - time.getTime()) / 1000); // seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
    
    return time.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: time.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await firestore()
        .collection('notifications')
        .doc(notificationId)
        .update({ read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const batch = firestore().batch();
      const unreadNotifs = notifications.filter(n => !n.read);

      unreadNotifs.forEach(notif => {
        const ref = firestore().collection('notifications').doc(notif.id);
        batch.update(ref, { read: true });
      });

      await batch.commit();
      Alert.alert('Success', 'All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      Alert.alert('Error', 'Failed to mark notifications as read');
    }
  };

  const clearAll = async () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to delete all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              const batch = firestore().batch();
              notifications.forEach(notif => {
                const ref = firestore().collection('notifications').doc(notif.id);
                batch.delete(ref);
              });
              await batch.commit();
              Alert.alert('Success', 'All notifications cleared');
            } catch (error) {
              console.error('Error clearing notifications:', error);
              Alert.alert('Error', 'Failed to clear notifications');
            }
          },
        },
      ]
    );
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

  const getNotificationIcon = (type: string, status?: string) => {
    if (type === 'checkin') {
      switch (status) {
        case 'safe':
          return '✅';
        case 'warning':
          return '⚠️';
        case 'danger':
          return '🆘';
        default:
          return '✅';
      }
    }
    
    switch (type) {
      case 'alert':
        return '⚠️';
      case 'location':
        return '📍';
      case 'update':
        return '🔔';
      case 'friend_request':
        return '👥';
      case 'family_request':
        return '👨‍👩‍👧‍👦';
      case 'friend_accepted':
        return '✅';
      case 'family_accepted':
        return '✅';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type: string, status?: string) => {
    if (type === 'checkin') {
      switch (status) {
        case 'safe':
          return '#10B981';
        case 'warning':
          return '#F59E0B';
        case 'danger':
          return '#EF4444';
        default:
          return '#10B981';
      }
    }
    
    switch (type) {
      case 'alert':
        return '#EF4444';
      case 'location':
        return '#3B82F6';
      case 'update':
        return '#F59E0B';
      case 'friend_request':
      case 'friend_accepted':
        return '#3B82F6';
      case 'family_request':
      case 'family_accepted':
        return '#10B981';
      default:
        return '#64748B';
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (selectedTab === 'unread') {
      return !notif.read;
    }
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Notifications</Text>

        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Request Cards */}
        <View style={styles.requestsSection}>
          <TouchableOpacity
            style={styles.requestCard}
            onPress={() => navigation.navigate('FriendRequests')}
          >
            <View style={styles.requestIcon}>
              <Text style={styles.requestIconText}>👥</Text>
            </View>
            <View style={styles.requestInfo}>
              <Text style={styles.requestTitle}>Friend Requests</Text>
              <Text style={styles.requestSubtitle}>
                {friendRequestCount === 0 
                  ? 'No pending requests' 
                  : `${friendRequestCount} pending request${friendRequestCount > 1 ? 's' : ''}`
                }
              </Text>
            </View>
            {friendRequestCount > 0 && (
              <View style={styles.requestBadge}>
                <Text style={styles.requestBadgeText}>{friendRequestCount}</Text>
              </View>
            )}
            <Text style={styles.requestArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.requestCard}
            onPress={() => navigation.navigate('FamilyRequests')}
          >
            <View style={[styles.requestIcon, { backgroundColor: '#DCFCE7' }]}>
              <Text style={styles.requestIconText}>👨‍👩‍👧‍👦</Text>
            </View>
            <View style={styles.requestInfo}>
              <Text style={styles.requestTitle}>Family Requests</Text>
              <Text style={styles.requestSubtitle}>
                {familyRequestCount === 0 
                  ? 'No pending requests' 
                  : `${familyRequestCount} pending request${familyRequestCount > 1 ? 's' : ''}`
                }
              </Text>
            </View>
            {familyRequestCount > 0 && (
              <View style={[styles.requestBadge, { backgroundColor: '#10B981' }]}>
                <Text style={styles.requestBadgeText}>{familyRequestCount}</Text>
              </View>
            )}
            <Text style={styles.requestArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Notification Toggle */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>Push Notifications</Text>
            <Text style={styles.toggleSubtitle}>
              Receive alerts and updates
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#E2E8F0', true: '#3B82F6' }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#E2E8F0"
          />
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'all' && styles.tabActive]}
            onPress={() => setSelectedTab('all')}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === 'all' && styles.tabTextActive,
              ]}
            >
              All ({notifications.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, selectedTab === 'unread' && styles.tabActive]}
            onPress={() => setSelectedTab('unread')}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === 'unread' && styles.tabTextActive,
              ]}
            >
              Unread ({unreadCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Notifications List */}
        <View style={styles.notificationsSection}>
          {filteredNotifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptyText}>
                {selectedTab === 'unread' 
                  ? "You're all caught up! No unread notifications."
                  : "You don't have any notifications yet."}
              </Text>
            </View>
          ) : (
            filteredNotifications.map(notification => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationCard,
                  !notification.read && styles.notificationUnread,
                ]}
                onPress={() => {
                  if (!notification.read) {
                    markAsRead(notification.id);
                  }
                }}
              >
                <View
                  style={[
                    styles.notificationIcon,
                    {
                      backgroundColor:
                        getNotificationColor(notification.type, notification.status) + '20',
                    },
                  ]}
                >
                  <Text style={styles.notificationIconText}>
                    {getNotificationIcon(notification.type, notification.status)}
                  </Text>
                </View>

                <View style={styles.notificationContent}>
                  <View style={styles.notificationHeader}>
                    <Text style={styles.notificationTitle}>
                      {notification.title}
                    </Text>
                    {!notification.read && (
                      <View style={styles.unreadDot} />
                    )}
                  </View>
                  <Text style={styles.notificationMessage}>
                    {notification.message}
                  </Text>
                  {notification.location && (
                    <Text style={styles.notificationLocation}>
                      📍 {notification.location}
                    </Text>
                  )}
                  <Text style={styles.notificationTime}>
                    {notification.time}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Quick Actions */}
        {filteredNotifications.length > 0 && (
          <View style={styles.actionsSection}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={markAllAsRead}
              disabled={unreadCount === 0}
            >
              <Text style={[
                styles.actionButtonText,
                unreadCount === 0 && styles.actionButtonDisabled
              ]}>
                Mark All as Read
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.clearButton]}
              onPress={clearAll}
            >
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
          </View>
        )}
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
          <Text style={styles.navIcon}>✓</Text>
          <Text style={styles.navLabel}>Check-in</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Text style={[styles.navIcon, styles.navIconActive]}>🔔</Text>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Alerts</Text>
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  requestsSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 12,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  requestIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  requestIconText: {
    fontSize: 24,
  },
  requestInfo: {
    flex: 1,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  requestSubtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  requestBadge: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginRight: 8,
  },
  requestBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  requestArrow: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: '700',
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  toggleInfo: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  toggleSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  notificationsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notificationUnread: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationIconText: {
    fontSize: 20,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 6,
  },
  notificationLocation: {
    fontSize: 13,
    color: '#3B82F6',
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 12,
    color: '#94A3B8',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  actionsSection: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  clearButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
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
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: '30%',
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
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

export default NotificationsScreen;