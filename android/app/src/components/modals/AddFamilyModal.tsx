import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { getAuth } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

interface AddFamilyModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: FamilyMemberData) => void;
}

export interface FamilyMemberData {
  email?: string;
  phoneNumber?: string;
  relationship: string;
  nickname?: string;
  contactPhone?: string;
}

const relationships = [
  'Parent',
  'Sibling',
  'Spouse',
  'Child',
  'Grandparent',
  'Grandchild',
  'Aunt/Uncle',
  'Cousin',
  'Other',
];

type ContactMethod = 'email' | 'phone';

const AddFamilyModal: React.FC<AddFamilyModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [contactMethod, setContactMethod] = useState<ContactMethod>('email');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [relationship, setRelationship] = useState('');
  const [nickname, setNickname] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // Validate contact method input
    if (contactMethod === 'email') {
      if (!email.trim()) {
        Alert.alert('Error', 'Please enter an email address');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        Alert.alert('Error', 'Please enter a valid email address');
        return;
      }
    } else {
      if (!phoneNumber.trim()) {
        Alert.alert('Error', 'Please enter a phone number');
        return;
      }
      if (!phoneNumber.startsWith('+63')) {
        Alert.alert('Error', 'Please enter a valid Philippine phone number (+63)');
        return;
      }
      if (phoneNumber.length < 13) {
        Alert.alert('Error', 'Please enter a complete phone number');
        return;
      }
    }

    if (!relationship) {
      Alert.alert('Error', 'Please select a relationship');
      return;
    }

    setLoading(true);

    try {
      const authInstance = getAuth();
      const currentUser = authInstance.currentUser;

      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in');
        setLoading(false);
        return;
      }

      let targetUserDoc;
      let searchField;
      let searchValue;

      if (contactMethod === 'email') {
        const normalizedEmail = email.trim().toLowerCase();
        
        // Check if trying to add yourself
        if (normalizedEmail === currentUser.email?.toLowerCase()) {
          Alert.alert('Error', 'You cannot add yourself as a family member');
          setLoading(false);
          return;
        }

        searchField = 'email';
        searchValue = normalizedEmail;
      } else {
        const normalizedPhone = phoneNumber.trim();
        
        // Check if trying to add yourself
        if (normalizedPhone === currentUser.phoneNumber) {
          Alert.alert('Error', 'You cannot add yourself as a family member');
          setLoading(false);
          return;
        }

        searchField = 'phoneNumber';
        searchValue = normalizedPhone;
      }

      // Search for user by email or phone in Firestore
      const usersSnapshot = await firestore()
        .collection('users')
        .where(searchField, '==', searchValue)
        .get();

      if (usersSnapshot.empty) {
        Alert.alert(
          'User Not Found',
          `No user found with ${contactMethod === 'email' ? 'email' : 'phone number'} ${searchValue}. They need to create an account first.`
        );
        setLoading(false);
        return;
      }

      const targetUserDocSnap = usersSnapshot.docs[0];
      const targetUserId = targetUserDocSnap.id;
      const targetUserData = targetUserDocSnap.data();

      // Check if already family
      const existingFamily = await firestore()
        .collection('family')
        .doc(currentUser.uid)
        .collection('userFamily')
        .doc(targetUserId)
        .get();

      if (existingFamily.exists()) {
        Alert.alert('Error', 'This person is already in your family contacts');
        setLoading(false);
        return;
      }

      // Check if request already exists
      const existingRequest = await firestore()
        .collection('family_requests')
        .where('fromUserId', '==', currentUser.uid)
        .where('toUserId', '==', targetUserId)
        .where('status', '==', 'pending')
        .get();

      if (!existingRequest.empty) {
        Alert.alert('Error', 'You already sent a family request to this person');
        setLoading(false);
        return;
      }

      // Create family request
      await firestore().collection('family_requests').add({
        fromUserId: currentUser.uid,
        fromUserName: currentUser.displayName || 'User',
        fromUserEmail: currentUser.email || '',
        fromUserPhone: currentUser.phoneNumber || '',
        toUserId: targetUserId,
        toUserName: targetUserData.displayName || 'User',
        toUserEmail: targetUserData.email || '',
        toUserPhone: targetUserData.phoneNumber || '',
        relationship: relationship,
        nickname: nickname.trim() || null,
        contactPhone: contactPhone.trim() || null,
        status: 'pending',
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      // Send notification to the target user
      await firestore().collection('notifications').add({
        userId: targetUserId,
        type: 'family_request',
        title: 'New Family Request',
        message: `${currentUser.displayName || 'Someone'} wants to add you as their ${relationship}`,
        fromUserId: currentUser.uid,
        fromUserName: currentUser.displayName || 'User',
        relationship: relationship,
        read: false,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      const displayName = nickname.trim() || targetUserData.displayName || searchValue;
      Alert.alert(
        'Request Sent!',
        `Family request sent to ${displayName}. They will be added once they accept.`
      );

      // Call onSubmit callback
      onSubmit({
        email: contactMethod === 'email' ? searchValue : undefined,
        phoneNumber: contactMethod === 'phone' ? searchValue : undefined,
        relationship,
        nickname: nickname.trim(),
        contactPhone: contactPhone.trim(),
      });

      // Reset form
      setEmail('');
      setPhoneNumber('');
      setRelationship('');
      setNickname('');
      setContactPhone('');
      setContactMethod('email');
      setLoading(false);
    } catch (error: any) {
      console.error('Error sending family request:', error);
      Alert.alert('Error', 'Failed to send family request. Please try again.');
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setPhoneNumber('');
    setRelationship('');
    setNickname('');
    setContactPhone('');
    setContactMethod('email');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Family Member</Text>
            <TouchableOpacity onPress={handleClose} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>👨‍👩‍👧‍👦</Text>
              <Text style={styles.infoText}>
                Enter the {contactMethod === 'email' ? 'email' : 'phone number'} of your family member. They will receive a request and need to accept it.
              </Text>
            </View>

            {/* Contact Method Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, contactMethod === 'email' && styles.tabActive]}
                onPress={() => setContactMethod('email')}
                disabled={loading}
              >
                <Text style={styles.tabIcon}>📧</Text>
                <Text style={[styles.tabText, contactMethod === 'email' && styles.tabTextActive]}>
                  Email
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tab, contactMethod === 'phone' && styles.tabActive]}
                onPress={() => setContactMethod('phone')}
                disabled={loading}
              >
                <Text style={styles.tabIcon}>📱</Text>
                <Text style={[styles.tabText, contactMethod === 'phone' && styles.tabTextActive]}>
                  Phone
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              {/* Email or Phone Input */}
              {contactMethod === 'email' ? (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="family@example.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!loading}
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              ) : (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone Number *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="+63 912 345 6789"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    editable={!loading}
                    placeholderTextColor="#94A3B8"
                  />
                  <Text style={styles.helperText}>
                    Format: +63 XXX XXX XXXX
                  </Text>
                </View>
              )}

              {/* Relationship Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Relationship *</Text>
                <View style={styles.relationshipGrid}>
                  {relationships.map((rel) => (
                    <TouchableOpacity
                      key={rel}
                      style={[
                        styles.relationshipChip,
                        relationship === rel && styles.relationshipChipActive,
                      ]}
                      onPress={() => setRelationship(rel)}
                      disabled={loading}
                    >
                      <Text
                        style={[
                          styles.relationshipText,
                          relationship === rel && styles.relationshipTextActive,
                        ]}
                      >
                        {rel}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Nickname Input (Optional) */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nickname (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Mom, Dad, Big Sis"
                  value={nickname}
                  onChangeText={setNickname}
                  editable={!loading}
                  placeholderTextColor="#94A3B8"
                />
                <Text style={styles.helperText}>
                  Give them a custom name for easy identification
                </Text>
              </View>

              {/* Emergency Contact Phone (Optional) */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Emergency Contact Number (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+63 912 345 6789"
                  value={contactPhone}
                  onChangeText={setContactPhone}
                  keyboardType="phone-pad"
                  editable={!loading}
                  placeholderTextColor="#94A3B8"
                />
                <Text style={styles.helperText}>
                  For emergency contact purposes
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Send Request</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 48 : 32,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1E293B',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseIcon: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIcon: {
    fontSize: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabIcon: {
    fontSize: 16,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#1E293B',
    fontWeight: '700',
  },
  form: {
    gap: 20,
    marginBottom: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1E293B',
  },
  helperText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  relationshipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relationshipChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  relationshipChipActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  relationshipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  relationshipTextActive: {
    color: '#FFFFFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
  },
  submitButton: {
    backgroundColor: '#10B981',
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default AddFamilyModal;