import React, { useState, useEffect } from 'react';
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
import NetInfo from '@react-native-community/netinfo';

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

interface SafetyTip {
  id: string;
  category: 'earthquake' | 'flood' | 'fire' | 'typhoon' | 'general';
  icon: string;
  title: string;
  tips: string[];
}

const HotlineScreen = ({ navigation }: any) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [showSafetyGuide, setShowSafetyGuide] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = (state.isConnected && state.isInternetReachable) ?? false;
      setIsOnline(online);
    });

    return () => unsubscribe();
  }, []);

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
    Alert.alert('Success', `${data.nickname} has been added to your family contacts`);
    setShowAddFamilyModal(false);
  };

  const handleFriendSubmit = (data: FriendData) => {
    console.log('Friend added:', data);
    Alert.alert('Success', `Request sent to ${data.nickname}`);
    setShowAddFriendModal(false);
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
    {
      id: '8',
      name: 'NDRRMC Emergency Hotline',
      number: '(02) 8911-1406',
      icon: '🇵🇭',
      category: 'disaster',
      description: 'National Disaster Risk Reduction Management Council',
    },
    {
      id: '9',
      name: 'Bureau of Fire Protection',
      number: '(02) 8426-0219',
      icon: '🔥',
      category: 'fire',
      description: 'Fire emergencies and rescue',
    },
    {
      id: '10',
      name: 'PNP Emergency Hotline',
      number: '117',
      icon: '👮',
      category: 'emergency',
      description: 'Philippine National Police emergency line',
    },
  ];

  const safetyTips: SafetyTip[] = [
    {
      id: 'earthquake',
      category: 'earthquake',
      icon: '🌋',
      title: 'Earthquake Safety',
      tips: [
        'DROP, COVER, and HOLD ON during shaking',
        'Stay away from windows, mirrors, and heavy objects',
        'If outdoors, move away from buildings, trees, and power lines',
        'If driving, pull over and stay inside the vehicle',
        'After shaking stops, check for injuries and damage',
        'Expect aftershocks and be prepared to drop again',
        'Do not use elevators',
        'Turn off gas, water, and electricity if damage is suspected',
      ],
    },
    {
      id: 'earthquake-magnitude',
      category: 'earthquake',
      icon: '📊',
      title: 'Earthquake Magnitude Scale (Richter)',
      tips: [
        'Magnitude 1-2: Micro - Not felt, recorded by seismographs',
        'Magnitude 3-3.9: Minor - Often felt, rarely causes damage',
        'Magnitude 4-4.9: Light - Noticeable shaking, minor damage',
        'Magnitude 5-5.9: Moderate - Damage to poorly built structures',
        'Magnitude 6-6.9: Strong - Destructive in populated areas',
        'Magnitude 7-7.9: Major - Serious damage over large areas',
        'Magnitude 8+: Great - Devastating damage, felt for thousands of km',
      ],
    },
    {
      id: 'flood',
      category: 'flood',
      icon: '🌊',
      title: 'Flood Safety',
      tips: [
        'Move to higher ground immediately',
        'Never walk through moving water (6 inches can knock you down)',
        'Never drive through flooded roads (turn around, don\'t drown)',
        'Avoid contact with floodwater (may be contaminated)',
        'Disconnect electrical appliances before evacuation',
        'Bring important documents in waterproof containers',
        'Listen to local authorities for evacuation orders',
        'After flooding, check for structural damage before re-entering',
      ],
    },
    {
      id: 'flood-levels',
      category: 'flood',
      icon: '📏',
      title: 'Flood Warning Levels',
      tips: [
        'Level 1 (Low) - Water may overflow in low-lying areas',
        'Level 2 (Medium) - Flooding in flood-prone communities',
        'Level 3 (High) - Serious flooding, evacuate immediately',
        '6 inches of water - Can knock you down, stall vehicles',
        '1 foot of water - Can float many cars',
        '2 feet of water - Can carry away most vehicles including SUVs',
      ],
    },
    {
      id: 'fire',
      category: 'fire',
      icon: '🔥',
      title: 'Fire Safety',
      tips: [
        'Alert others and activate fire alarm immediately',
        'Evacuate using stairs, never use elevators',
        'Stay low under smoke (breathable air is near the floor)',
        'Feel doors before opening (if hot, use another exit)',
        'Stop, Drop, and Roll if clothes catch fire',
        'Have a family meeting point outside',
        'Call 911 or BFP once safely outside',
        'Never go back inside a burning building',
      ],
    },
    {
      id: 'fire-classes',
      category: 'fire',
      icon: '🧯',
      title: 'Fire Classifications',
      tips: [
        'Class A - Ordinary combustibles (wood, paper, cloth)',
        'Class B - Flammable liquids (gasoline, oil, grease)',
        'Class C - Electrical equipment (appliances, wiring)',
        'Class D - Combustible metals (magnesium, sodium)',
        'Class K - Cooking oils and fats (kitchen fires)',
        'Use appropriate extinguisher for each class',
        'Remember: PASS - Pull, Aim, Squeeze, Sweep',
      ],
    },
    {
      id: 'typhoon',
      category: 'typhoon',
      icon: '🌀',
      title: 'Typhoon/Storm Safety',
      tips: [
        'Monitor weather updates continuously',
        'Secure outdoor items that could become projectiles',
        'Stock emergency supplies (3-day minimum)',
        'Stay indoors, away from windows',
        'Unplug electrical appliances',
        'Fill bathtubs and containers with water',
        'Charge all devices and have backup batteries',
        'Know your evacuation routes and shelters',
      ],
    },
    {
      id: 'typhoon-signals',
      category: 'typhoon',
      icon: '⚠️',
      title: 'PAGASA Tropical Cyclone Wind Signals',
      tips: [
        'TCWS #1 - 39-61 km/h - Minimal to minor threat',
        'TCWS #2 - 62-88 km/h - Minor to moderate threat',
        'TCWS #3 - 89-117 km/h - Moderate to significant threat',
        'TCWS #4 - 118-184 km/h - Significant to severe threat',
        'TCWS #5 - 185+ km/h - Extreme threat to life and property',
        'Signal #3 and above: Classes and work suspended',
        'Signal #5: Catastrophic damage expected',
      ],
    },
    {
      id: 'general',
      category: 'general',
      icon: '🎒',
      title: 'Emergency Kit Essentials',
      tips: [
        'Water (1 gallon per person per day, 3-day supply)',
        'Non-perishable food (3-day supply)',
        'Battery-powered or hand-crank radio',
        'Flashlight and extra batteries',
        'First aid kit and medications',
        'Whistle to signal for help',
        'Dust masks and plastic sheeting',
        'Moist towelettes and garbage bags',
        'Wrench or pliers (to turn off utilities)',
        'Manual can opener',
        'Local maps and important documents',
        'Cell phone with chargers and backup battery',
      ],
    },
    {
      id: 'evacuation',
      category: 'general',
      icon: '🚶',
      title: 'Evacuation Preparedness',
      tips: [
        'Know multiple evacuation routes from your area',
        'Practice evacuation drills with family',
        'Keep vehicle fuel tank at least half full',
        'Designate an out-of-area contact person',
        'Plan for pets (shelters may not accept them)',
        'Keep copies of important documents in waterproof container',
        'Have cash on hand (ATMs may not work)',
        'Follow instructions from local authorities',
      ],
    },
  ];

  const categories = [
    { id: 'all', label: 'All', icon: '📋' },
    { id: 'emergency', label: 'Emergency', icon: '🚨' },
    { id: 'disaster', label: 'Disaster', icon: '⚠️' },
    { id: 'medical', label: 'Medical', icon: '🏥' },
    { id: 'fire', label: 'Fire', icon: '🔥' },
  ];

  const filteredContacts = emergencyContacts.filter(
    contact => selectedCategory === 'all' || contact.category === selectedCategory
  );

  const handleCall = (number: string, name: string) => {
    if (!isOnline) {
      // Still allow calls in offline mode (calls don't need internet)
      Alert.alert(
        'Offline Mode',
        'You are offline but can still make emergency calls.',
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
      return;
    }

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

  const renderMainContent = () => (
    <>
      {/* Offline Banner */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineIcon}>📡</Text>
          <View style={styles.offlineTextContainer}>
            <Text style={styles.offlineTitle}>Offline Mode</Text>
            <Text style={styles.offlineSubtitle}>
              Emergency calls still available
            </Text>
          </View>
        </View>
      )}

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

      {/* Quick Access to Safety Guide */}
      <TouchableOpacity
        style={styles.safetyGuideButton}
        onPress={() => setShowSafetyGuide(true)}
      >
        <View style={styles.safetyGuideIcon}>
          <Text style={styles.safetyGuideIconText}>📖</Text>
        </View>
        <View style={styles.safetyGuideContent}>
          <Text style={styles.safetyGuideTitle}>Disaster Safety Guide</Text>
          <Text style={styles.safetyGuideSubtitle}>
            Essential tips for earthquakes, floods, fires & more
          </Text>
        </View>
        <Text style={styles.safetyGuideArrow}>→</Text>
      </TouchableOpacity>

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

      {/* Quick Safety Tips */}
      <View style={styles.tipsSection}>
        <Text style={styles.sectionTitle}>Quick Safety Reminders</Text>
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
    </>
  );

  const renderSafetyGuide = () => (
    <>
      {/* Safety Guide Header */}
      <View style={styles.safetyHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setShowSafetyGuide(false)}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.safetyHeaderTitle}>Disaster Safety Guide</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Safety Tips Content */}
      <View style={styles.safetyContent}>
        {safetyTips.map(tip => (
          <View key={tip.id} style={styles.safetySection}>
            <View style={styles.safetySectionHeader}>
              <Text style={styles.safetySectionIcon}>{tip.icon}</Text>
              <Text style={styles.safetySectionTitle}>{tip.title}</Text>
            </View>
            <View style={styles.safetySectionContent}>
              {tip.tips.map((tipText, index) => (
                <View key={index} style={styles.safetyTipItem}>
                  <View style={styles.safetyTipBullet}>
                    <Text style={styles.safetyTipBulletText}>•</Text>
                  </View>
                  <Text style={styles.safetyTipText}>{tipText}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Emergency Kit Checklist */}
        <View style={styles.importantNote}>
          <Text style={styles.importantNoteIcon}>⚠️</Text>
          <View style={styles.importantNoteContent}>
            <Text style={styles.importantNoteTitle}>Important Reminder</Text>
            <Text style={styles.importantNoteText}>
              Prepare your emergency kit NOW. Don't wait for a disaster to happen. Review this guide regularly with your family.
            </Text>
          </View>
        </View>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      {!showSafetyGuide && (
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
      )}

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {showSafetyGuide ? renderSafetyGuide() : renderMainContent()}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  offlineBanner: {
    backgroundColor: '#FEF3C7',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  offlineIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  offlineTextContainer: {
    flex: 1,
  },
  offlineTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2,
  },
  offlineSubtitle: {
    fontSize: 12,
    color: '#92400E',
    opacity: 0.8,
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
    marginBottom: 16,
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
  safetyGuideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  safetyGuideIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  safetyGuideIconText: {
    fontSize: 24,
  },
  safetyGuideContent: {
    flex: 1,
  },
  safetyGuideTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  safetyGuideSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  safetyGuideArrow: {
    fontSize: 24,
    color: '#3B82F6',
    fontWeight: '700',
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
  // Safety Guide Styles
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  safetyHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  safetyContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  safetySection: {
    marginBottom: 32,
  },
  safetySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#E2E8F0',
  },
  safetySectionIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  safetySectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  safetySectionContent: {
    gap: 12,
  },
  safetyTipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  safetyTipBullet: {
    width: 20,
    marginTop: 2,
  },
  safetyTipBulletText: {
    fontSize: 18,
    color: '#3B82F6',
    fontWeight: '700',
  },
  safetyTipText: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 22,
  },
  importantNote: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FDE68A',
  },
  importantNoteIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  importantNoteContent: {
    flex: 1,
  },
  importantNoteTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 8,
  },
  importantNoteText: {
    fontSize: 14,
    color: '#92400E',
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