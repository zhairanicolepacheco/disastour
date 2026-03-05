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

interface AddFriendModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: FriendData) => void;
}

export interface FriendData {
  email?: string;
  phoneNumber?: string;
  nickname?: string;
}

const AddFriendModal: React.FC<AddFriendModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);

  const normalizePhoneNumber = (phone: string): string => {
    // Remove all spaces and special characters
    let normalized = phone.replace(/[\s\-\(\)]/g, '');
    
    // Convert 09 format to +63
    if (normalized.startsWith('09')) {
      normalized = '+63' + normalized.substring(1);
    }
    
    // Ensure it starts with +63
    if (!normalized.startsWith('+63') && normalized.length === 10) {
      normalized = '+63' + normalized;
    }
    
    return normalized;
  };

  const detectInputType = (input: string): 'email' | 'phone' | 'invalid' => {
    const trimmed = input.trim();
    
    // Email detection
    if (trimmed.includes('@') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return 'email';
    }
    
    // Phone detection
    if (trimmed.startsWith('+63') || trimmed.startsWith('09') || /^\d{10,}$/.test(trimmed)) {
      return 'phone';
    }
    
    return 'invalid';
  };

  const handleSubmit = async () => {
    console.log('🔍 === ADD FRIEND DEBUG START ===');
    
    if (!searchInput.trim()) {
      Alert.alert('Error', 'Please enter an email address or phone number');
      return;
    }

    const inputType = detectInputType(searchInput);
    
    if (inputType === 'invalid') {
      Alert.alert('Error', 'Please enter a valid email address or phone number');
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

      console.log('👤 Current User:', currentUser.uid);
      console.log('📝 Input:', searchInput);
      console.log('🔍 Detected Type:', inputType);

      let searchField: string;
      let searchValue: string;

      if (inputType === 'email') {
        searchField = 'email';
        searchValue = searchInput.trim().toLowerCase();
        
        // Check if trying to add yourself
        if (searchValue === currentUser.email?.toLowerCase()) {
          Alert.alert('Error', 'You cannot add yourself as a friend');
          setLoading(false);
          return;
        }
      } else {
        searchField = 'phoneNumber';
        searchValue = normalizePhoneNumber(searchInput);
        
        console.log('📱 Normalized Phone:', searchValue);
        
        // Check if trying to add yourself
        if (searchValue === currentUser.phoneNumber) {
          Alert.alert('Error', 'You cannot add yourself as a friend');
          setLoading(false);
          return;
        }
      }

      console.log('🔍 Searching:', searchField, '==', searchValue);

      // Search for user in Firestore
      const usersSnapshot = await firestore()
        .collection('users')
        .where(searchField, '==', searchValue)
        .get();

      console.log('📊 Users found:', usersSnapshot.size);

      if (usersSnapshot.empty) {
        console.log('❌ No user found');
        Alert.alert(
          'User Not Found',
          `No user found with ${inputType === 'email' ? 'email' : 'phone number'}: ${searchValue}\n\nThey need to create an account first.`
        );
        setLoading(false);
        return;
      }

      const targetUserDoc = usersSnapshot.docs[0];
      const targetUserId = targetUserDoc.id;
      const targetUserData = targetUserDoc.data();

      console.log('✅ Found user:', targetUserId);
      console.log('📄 User data:', {
        displayName: targetUserData.displayName,
        email: targetUserData.email,
        phoneNumber: targetUserData.phoneNumber,
      });

      // Check if already friends
      const existingFriend = await firestore()
        .collection('friends')
        .doc(currentUser.uid)
        .collection('userFriends')
        .doc(targetUserId)
        .get();

      if (existingFriend.exists()) {
        Alert.alert('Error', 'This person is already your friend');
        setLoading(false);
        return;
      }

      // Check if request already exists
      const existingRequest = await firestore()
        .collection('friend_requests')
        .where('fromUserId', '==', currentUser.uid)
        .where('toUserId', '==', targetUserId)
        .where('status', '==', 'pending')
        .get();

      if (!existingRequest.empty) {
        Alert.alert('Error', 'You already sent a friend request to this person');
        setLoading(false);
        return;
      }

      console.log('📝 Creating friend request...');

      // Create friend request
      const requestData = {
        fromUserId: currentUser.uid,
        fromUserName: currentUser.displayName || 'User',
        fromUserEmail: currentUser.email || null,
        fromUserPhone: currentUser.phoneNumber || null,
        toUserId: targetUserId,
        toUserName: targetUserData.displayName || 'User',
        toUserEmail: targetUserData.email || null,
        toUserPhone: targetUserData.phoneNumber || null,
        nickname: nickname.trim() || null,
        status: 'pending',
        createdAt: firestore.FieldValue.serverTimestamp(),
      };

      const requestRef = await firestore()
        .collection('friend_requests')
        .add(requestData);

      console.log('✅ Friend request created:', requestRef.id);

      // Create notification for target user
      console.log('🔔 Creating notification...');

      const notificationData = {
        userId: targetUserId,
        type: 'friend_request',
        title: 'New Friend Request',
        message: `${currentUser.displayName || 'Someone'} wants to add you as a friend`,
        fromUserId: currentUser.uid,
        fromUserName: currentUser.displayName || 'User',
        read: false,
        createdAt: firestore.FieldValue.serverTimestamp(),
      };

      const notificationRef = await firestore()
        .collection('notifications')
        .add(notificationData);

      console.log('✅ Notification created:', notificationRef.id);
      console.log('📬 Notification sent to user:', targetUserId);

      Alert.alert(
        'Request Sent!',
        `Friend request sent to ${targetUserData.displayName || searchValue}. They will be added once they accept.`
      );

      // Call onSubmit callback
      onSubmit({
        email: inputType === 'email' ? searchValue : undefined,
        phoneNumber: inputType === 'phone' ? searchValue : undefined,
        nickname: nickname.trim(),
      });

      // Reset form
      setSearchInput('');
      setNickname('');
      setLoading(false);
      
      console.log('🎉 === ADD FRIEND SUCCESS ===');
      
    } catch (error: any) {
      console.error('❌ ERROR:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
      });
      Alert.alert('Error', `Failed to send friend request: ${error.message}`);
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSearchInput('');
    setNickname('');
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
            <Text style={styles.modalTitle}>Add Friend</Text>
            <TouchableOpacity onPress={handleClose} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>👥</Text>
              <Text style={styles.infoText}>
                Enter their email address or phone number. The system will automatically detect which one you entered and enable location tracking once they accept.
              </Text>
            </View>

            <View style={styles.form}>
              {/* Smart Email/Phone Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email or Phone Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="friend@email.com or +63 912 345 6789"
                  value={searchInput}
                  onChangeText={setSearchInput}
                  keyboardType="default"
                  autoCapitalize="none"
                  editable={!loading}
                  placeholderTextColor="#94A3B8"
                />
                <Text style={styles.helperText}>
                  📧 Email format: user@email.com{'\n'}
                  📱 Phone format: +63 XXX XXX XXXX or 09XX XXX XXXX
                </Text>
              </View>

              {/* Nickname Input (Optional) */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nickname (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Best Friend, Roommate"
                  value={nickname}
                  onChangeText={setNickname}
                  editable={!loading}
                  placeholderTextColor="#94A3B8"
                />
                <Text style={styles.helperText}>
                  Give them a custom name for easy identification
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
              style={[styles.button, styles.submitButton, loading && styles.buttonDisabled]}
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
    marginBottom: 24,
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
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 16,
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
  buttonDisabled: {
    opacity: 0.6,
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
    backgroundColor: '#3B82F6',
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default AddFriendModal;