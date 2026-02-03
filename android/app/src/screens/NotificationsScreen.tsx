import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../config/colors';

// Import modals
import AddContactModal from '../components/modals/AddContactModal';
import AddFamilyModal, { FamilyMemberData } from '../components/modals/AddFamilyModal';
import AddFriendModal, { FriendData } from '../components/modals/AddFriendModal';

interface Notification {
  id: string;
  type: 'alert' | 'checkin' | 'location' | 'update';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const NotificationsScreen = ({ navigation }: any) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'all' | 'unread'>('all');
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
  
  const notifications: Notification[] = [
    {
      id: '1',
      type: 'alert',
      title: 'Severe Weather Alert',
      message: 'Typhoon warning in your area. Stay safe indoors.',
      time: '2 hours ago',
      read: false,
    },
    {
      id: '2',
      type: 'checkin',
      title: 'Check-In Reminder',
      message: 'bakitman checked in as SAFE from Toledo Barangay Hall',
      time: '5 hours ago',
      read: false,
    },
    {
      id: '3',
      type: 'location',
      title: 'Location Update',
      message: 'lastikman shared their location at Charm Hotel',
      time: '1 day ago',
      read: true,
    },
    {
      id: '4',
      type: 'update',
      title: 'App Update Available',
      message: 'New features and improvements are available',
      time: '2 days ago',
      read: true,
    },
    {
      id: '5',
      type: 'alert',
      title: 'Emergency Advisory',
      message: 'Evacuation centers opened in affected areas',
      time: '3 days ago',
      read: true,
    },
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return '⚠️';
      case 'checkin':
        return '✅';
      case 'location':
        return '📍';
      case 'update':
        return '🔔';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'alert':
        return '#EF4444';
      case 'checkin':
        return '#10B981';
      case 'location':
        return '#3B82F6';
      case 'update':
        return '#F59E0B';
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
                You're all caught up! Check back later for updates.
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
              >
                <View
                  style={[
                    styles.notificationIcon,
                    {
                      backgroundColor:
                        getNotificationColor(notification.type) + '20',
                    },
                  ]}
                >
                  <Text style={styles.notificationIconText}>
                    {getNotificationIcon(notification.type)}
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
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Mark All as Read</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, styles.clearButton]}>
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
              <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
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

// Keep all existing styles (they remain unchanged)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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