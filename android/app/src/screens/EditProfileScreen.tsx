import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuth } from '@react-native-firebase/auth';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { authService } from '../services/authService';
import { colors } from '../config/colors';

// Define the user data interface
interface UserProfileData {
  displayName?: string;
  email?: string;
  address?: string;
  phoneNumber?: string;
  photoURL?: string | null;
  updatedAt?: any;
  createdAt?: any;
}

const EditProfileScreen = ({ navigation }: any) => {
  const authInstance = getAuth();
  const user = authInstance.currentUser;

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [originalData, setOriginalData] = useState<UserProfileData | null>(null);

  // Fetch existing user data on mount
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setFetchingData(true);
      
      // Get data from Firebase Auth
      const authData: UserProfileData = {
        displayName: user?.displayName || '',
        email: user?.email || '',
        photoURL: user?.photoURL || null,
      };

      // Try to get additional data from Firestore
      const userData = await authService.getUserProfile(user?.uid || '');
      
      if (userData) {
        // Cast the userData to our interface
        const firestoreData = userData as UserProfileData;
        
        setOriginalData(firestoreData);
        setName(firestoreData.displayName || authData.displayName || '');
        setEmail(firestoreData.email || authData.email || '');
        setAddress(firestoreData.address || '');
        setContactNo(firestoreData.phoneNumber || '');
        setProfileImage(firestoreData.photoURL || authData.photoURL || null);
      } else {
        // Fallback to auth data if no database record exists
        setOriginalData(authData);
        setName(authData.displayName || '');
        setEmail(authData.email || '');
        setProfileImage(authData.photoURL || null);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Fallback to Firebase Auth data
      setName(user?.displayName || '');
      setEmail(user?.email || '');
      setProfileImage(user?.photoURL || null);
    } finally {
      setFetchingData(false);
    }
  };

  const handleImagePicker = () => {
    Alert.alert(
      'Update Profile Picture',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: () => openCamera(),
        },
        {
          text: 'Choose from Library',
          onPress: () => openGallery(),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const openCamera = async () => {
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
        includeBase64: false,
      });

      if (result.assets && result.assets[0].uri) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const openGallery = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
        includeBase64: false,
      });

      if (result.assets && result.assets[0].uri) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to open gallery');
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setLoading(true);
    try {
      // Prepare the updated data, merging with original data
      let updatedData: UserProfileData = {
        ...originalData, // Preserve all existing data
        displayName: name.trim(),
        email: email, // Email usually shouldn't change
        address: address.trim(),
        phoneNumber: contactNo.trim(),
      };

      // Upload profile image if changed
      if (profileImage && profileImage !== originalData?.photoURL) {
        setUploadingImage(true);
        const uploadResult = await authService.uploadProfileImage(
          user?.uid || '',
          profileImage
        );
        setUploadingImage(false);

        if (uploadResult.success) {
          updatedData.photoURL = uploadResult.imageUrl;
        } else {
          // Keep the old photo URL if upload fails
          updatedData.photoURL = originalData?.photoURL;
          Alert.alert('Warning', 'Failed to upload image, but other changes will be saved');
        }
      } else {
        // Keep existing photo URL
        updatedData.photoURL = originalData?.photoURL;
      }

      // Update profile with merged data
      const result = await authService.updateUserProfile(
        user?.uid || '',
        {
          displayName: updatedData.displayName || '',
          email: updatedData.email || '',
          address: updatedData.address || '',
          phoneNumber: updatedData.phoneNumber || '',
          photoURL: updatedData.photoURL || null,
        }
      );

      if (result.success) {
        Alert.alert('Success', 'Profile updated successfully!');
        navigation.goBack();
      } else {
        Alert.alert('Error', result.error || 'Failed to update profile');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An error occurred');
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  if (fetchingData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingScreen}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Edit Profile</Text>

            <View style={{ width: 40 }} />
          </View>

          {/* Profile Avatar */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              style={styles.imageContainer}
              onPress={handleImagePicker}
              activeOpacity={0.7}
            >
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.avatarLarge} />
              ) : (
                <View style={styles.avatarLarge}>
                  <Text style={styles.avatarLargeText}>
                    {name?.charAt(0).toUpperCase() || '?'}
                  </Text>
                </View>
              )}
              <View style={styles.editBadge}>
                <Text style={styles.editIcon}>📷</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor="#94A3B8"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              </View>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={email}
                placeholder="Email address"
                placeholderTextColor="#94A3B8"
                editable={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter your address"
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contact Number</Text>
              <TextInput
                style={styles.input}
                value={contactNo}
                onChangeText={setContactNo}
                placeholder="Enter contact number"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                editable={!loading}
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, (loading || uploadingImage) && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={loading || uploadingImage}
          >
            {loading || uploadingImage ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#FFFFFF" />
                {uploadingImage && (
                  <Text style={styles.uploadingText}>Uploading image...</Text>
                )}
              </View>
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
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
    color: '#3B82F6',
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 32,
  },
  imageContainer: {
    position: 'relative',
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#3B82F6',
  },
  avatarLargeText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  editIcon: {
    fontSize: 16,
  },
  form: {
    marginHorizontal: 32,
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  verifiedBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1E293B',
  },
  disabledInput: {
    backgroundColor: '#F1F5F9',
    color: '#64748B',
  },
  textarea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  saveButton: {
    marginHorizontal: 32,
    marginTop: 32,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  uploadingText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default EditProfileScreen;