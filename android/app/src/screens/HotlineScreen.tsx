import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import modals
import AddContactModal from '../components/modals/AddContactModal';
import AddFamilyModal, { FamilyMemberData } from '../components/modals/AddFamilyModal';
import AddFriendModal, { FriendData } from '../components/modals/AddFriendModal';

interface EmergencyContact {
  id: string;
  name: string;
  number: string;
  icon: string;
  category: string;
  description: string;
}

const HotlineScreen = ({ navigation }: any) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
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

  const emergencyContacts: EmergencyContact[] = [
    {
      id: '1',
      name: 'National Emergency Hotline',
      number: '911',
      icon: '🚨',
      category: 'emergency',
      description: 'Integrated Police, Fire, Medical emergencies',
    },
    {
      id: '2',
      name: 'Silang OMDRRMO Command Center',
      number: '0917-142-3776',
      icon: '🛡️',
      category: 'disaster',
      description: 'Disaster management and response coordination',
    },
    {
      id: '3',
      name: 'Silang OMDRRMO Operations (Globe)',
      number: '0935-601-6738',
      icon: '📱',
      category: 'disaster',
      description: 'Emergency operations support',
    },
    {
      id: '4',
      name: 'Silang OMDRRMO Operations (Smart)',
      number: '0922-384-6130',
      icon: '📱',
      category: 'disaster',
      description: 'Emergency operations support',
    },
    {
      id: '5',
      name: 'Silang OMDRRMO Landline',
      number: '(046) 414-3776',
      icon: '☎️',
      category: 'disaster',
      description: 'Direct landline for emergency coordination',
    },
    {
      id: '6',
      name: 'Philippine Red Cross – Silang Branch',
      number: '(046) 885-7481',
      icon: '🏥',
      category: 'medical',
      description: 'Medical assistance and rescue services',
    },
    {
      id: '7',
      name: 'Philippine Red Cross – Silang (Mobile)',
      number: '0916-474-3235',
      icon: '🏥',
      category: 'medical',
      description: 'Mobile emergency medical support',
    },
  ];

  const categories = [
    { id: 'all', label: 'All', icon: '📋' },
    { id: 'emergency', label: 'Emergency', icon: '🚨' },
    { id: 'disaster', label: 'Disaster', icon: '⚠️' },
    { id: 'medical', label: 'Medical', icon: '🏥' },
  ];

  const filteredContacts = emergencyContacts.filter(
    contact => selectedCategory === 'all' || contact.category === selectedCategory
  );

  const handleCall = (number: string, name: string) => {
    Alert.alert(
      'Call Emergency Hotline',
      `Do you want to call ${name}?\n\n${number}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => {
            Linking.openURL(`tel:${number}`);
          },
        },
      ]
    );
  };

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

        <Text style={styles.headerTitle}>Emergency Hotline</Text>

        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Emergency Banner */}
        <View style={styles.emergencyBanner}>
          <View style={styles.emergencyIcon}>
            <Text style={styles.emergencyIconText}>🚨</Text>
          </View>
          <View style={styles.emergencyContent}>
            <Text style={styles.emergencyTitle}>In Case of Emergency</Text>
            <Text style={styles.emergencyText}>
              Tap any number below to call immediately
            </Text>
          </View>
        </View>

        {/* Category Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.id && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.categoryTextActive,
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Hotline Cards */}
        <View style={styles.contactsSection}>
          <Text style={styles.sectionTitle}>
            Available Hotlines ({filteredContacts.length})
          </Text>

          {filteredContacts.map(contact => (
            <TouchableOpacity
              key={contact.id}
              style={styles.contactCard}
              onPress={() => handleCall(contact.number, contact.name)}
            >
              <View style={styles.contactIconContainer}>
                <Text style={styles.contactIcon}>{contact.icon}</Text>
              </View>

              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactDescription}>
                  {contact.description}
                </Text>
                <View style={styles.contactNumberBadge}>
                  <Text style={styles.phoneIcon}>📞</Text>
                  <Text style={styles.contactNumber}>{contact.number}</Text>
                </View>
              </View>

              <View style={styles.callButton}>
                <Text style={styles.callButtonText}>Call</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Safety Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Safety Tips</Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipIcon}>💡</Text>
            <Text style={styles.tipText}>
              Stay calm and speak clearly when calling emergency services
            </Text>
          </View>
          <View style={styles.tipCard}>
            <Text style={styles.tipIcon}>📍</Text>
            <Text style={styles.tipText}>
              Know your exact location before calling
            </Text>
          </View>
          <View style={styles.tipCard}>
            <Text style={styles.tipIcon}>🆘</Text>
            <Text style={styles.tipText}>
              Keep these numbers saved in your phone for quick access
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Hotline')}>
          <Text style={[styles.navIcon, styles.navIconActive]}>📞</Text>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Hotline</Text>
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

// Keep all existing styles...
const styles = StyleSheet.create({
  // ... (copy all your existing styles from the original HotlineScreen - they remain unchanged)
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
  emergencyBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  emergencyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  emergencyIconText: {
    fontSize: 28,
  },
  emergencyContent: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  emergencyText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: '#3B82F6',
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  contactsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contactIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactIcon: {
    fontSize: 24,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  contactDescription: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 6,
  },
  contactNumberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 4,
  },
  phoneIcon: {
    fontSize: 12,
  },
  contactNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
  },
  callButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  tipsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tipIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 20,
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

export default HotlineScreen;