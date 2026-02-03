import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  StatusBar,
  Platform,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getAuth } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { authService } from '../services/authService';
import { colors } from '../config/colors';

// Import modals
import AddContactModal from '../components/modals/AddContactModal';
import AddFamilyModal, { FamilyMemberData } from '../components/modals/AddFamilyModal';
import AddFriendModal, { FriendData } from '../components/modals/AddFriendModal';

interface Contact {
  id: string;
  name: string;
  type: 'family' | 'friend';
  avatar: string;
}

interface UserProfile {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  contactNumber: string | null;
  address: string | null;
}

const ProfileScreen = ({ navigation }: any) => {
  const [showFamily, setShowFamily] = useState(true);
  const [showFriends, setShowFriends] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadUserProfile = async () => {
    const authInstance = getAuth();
    const user = authInstance.currentUser;

    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      const userDoc = await firestore()
        .collection('users')
        .doc(user.uid)
        .get();

      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserProfile({
          displayName: data?.displayName || user.displayName || null,
          email: data?.email || user.email || null,
          photoURL: data?.photoURL || user.photoURL || null,
          contactNumber: data?.contactNumber || data?.phoneNumber || null,
          address: data?.address || null,
        });
      } else {
        setUserProfile({
          displayName: user.displayName || null,
          email: user.email || null,
          photoURL: user.photoURL || null,
          contactNumber: null,
          address: null,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      const authInstance = getAuth();
      const user = authInstance.currentUser;
      setUserProfile({
        displayName: user?.displayName || null,
        email: user?.email || null,
        photoURL: user?.photoURL || null,
        contactNumber: null,
        address: null,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserProfile();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadUserProfile();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserProfile();
    setRefreshing(false);
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

  const contacts: Contact[] = [
    { id: '1', name: 'lastikman', type: 'family', avatar: '👤' },
    { id: '2', name: 'bakitman', type: 'friend', avatar: '👤' },
  ];

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await authService.signOut();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Profile</Text>

          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.editIcon}>✏️</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Avatar */}
        <View style={styles.avatarSection}>
          {userProfile?.photoURL ? (
            <Image 
              source={{ uri: userProfile.photoURL }} 
              style={styles.avatarLarge}
            />
          ) : (
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>
                {userProfile?.displayName?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          <Text style={styles.userName}>
            {userProfile?.displayName || 'User'}
          </Text>
          <Text style={styles.userEmail}>{userProfile?.email}</Text>
        </View>

        {/* User Details Section */}
        <View style={styles.detailsSection}>
          <View style={styles.detailCard}>
            <Text style={styles.detailLabel}>Full Name</Text>
            <Text style={styles.detailValue}>
              {userProfile?.displayName || 'Not set'}
            </Text>
          </View>

          <View style={styles.detailCard}>
            <Text style={styles.detailLabel}>Email</Text>
            <Text style={styles.detailValue}>
              {userProfile?.email || 'Not set'}
            </Text>
          </View>

          <View style={styles.detailCard}>
            <Text style={styles.detailLabel}>Contact Number</Text>
            <Text style={styles.detailValue}>
              {userProfile?.contactNumber || 'Not set'}
            </Text>
          </View>

          <View style={styles.detailCard}>
            <Text style={styles.detailLabel}>Address</Text>
            <Text style={[styles.detailValue, !userProfile?.address && styles.detailValueEmpty]}>
              {userProfile?.address || 'Not set'}
            </Text>
          </View>
        </View>

        {/* Family Section */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => setShowFamily(!showFamily)}
          >
            <Text style={styles.sectionTitle}>
              Family ({contacts.filter(c => c.type === 'family').length})
            </Text>
            <Text style={styles.collapseIcon}>{showFamily ? '▼' : '▶'}</Text>
          </TouchableOpacity>

          {showFamily && (
            <View style={styles.contactsList}>
              {contacts
                .filter(c => c.type === 'family')
                .map(contact => (
                  <View key={contact.id} style={styles.contactCard}>
                    <View style={styles.contactAvatar}>
                      <Text style={styles.contactAvatarText}>
                        {contact.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.contactName}>{contact.name}</Text>
                  </View>
                ))}
            </View>
          )}
        </View>

        {/* Friends Section */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => setShowFriends(!showFriends)}
          >
            <Text style={styles.sectionTitle}>
              Friends ({contacts.filter(c => c.type === 'friend').length})
            </Text>
            <Text style={styles.collapseIcon}>{showFriends ? '▼' : '▶'}</Text>
          </TouchableOpacity>

          {showFriends && (
            <View style={styles.contactsList}>
              {contacts
                .filter(c => c.type === 'friend')
                .map(contact => (
                  <View key={contact.id} style={styles.contactCard}>
                    <View style={styles.contactAvatar}>
                      <Text style={styles.contactAvatarText}>
                        {contact.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.contactName}>{contact.name}</Text>
                  </View>
                ))}
            </View>
          )}
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity 
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => navigation.navigate('Hotline')}
        >
          <Text style={styles.navIcon}>📞</Text>
          <Text style={styles.navLabel}>Hotline</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => navigation.navigate('Home')}
        >
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

        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => navigation.navigate('CheckIn')}
        >
          <Text style={styles.navIcon}>✓</Text>
          <Text style={styles.navLabel}>Check-in</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => navigation.navigate('Notifications')}
        >
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
    color: '#1E293B',
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  editButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIcon: {
    fontSize: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 24,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 16,
  },
  avatarLargeText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#64748B',
  },
  detailsSection: {
    marginHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  detailCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  detailValueEmpty: {
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  collapseIcon: {
    fontSize: 14,
    color: '#64748B',
  },
  contactsList: {
    gap: 12,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  signOutButton: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  signOutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 48,
    paddingHorizontal: 8,
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

export default ProfileScreen;