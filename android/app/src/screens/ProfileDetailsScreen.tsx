'use client';

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  StatusBar,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getAuth } from '@react-native-firebase/auth';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { RootStackParamList } from '../navigation/RootNavigator';
import { authService } from '../services/authService';
import { colors } from '../config/colors';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ProfileDetails'>;
  route: any;
};

const ProfileDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { userId } = route.params;
  const authInstance = getAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState(authInstance.currentUser?.email || '');
  const [address, setAddress] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const validateInputs = () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter your full name');
      return false;
    }
    if (!email.trim()) {
      Alert.alert('Required Field', 'Please enter your email');
      return false;
    }
    if (!address.trim()) {
      Alert.alert('Required Field', 'Please enter your address');
      return false;
    }
    if (!contactNo.trim()) {
      Alert.alert('Required Field', 'Please enter your contact number');
      return false;
    }
    if (contactNo.length < 10) {
      Alert.alert('Invalid Input', 'Please enter a valid contact number (at least 10 digits)');
      return false;
    }
    return true;
  };

  const handleImagePicker = () => {
    Alert.alert(
      'Upload Profile Picture',
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

  const handleCompleteProfile = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    try {
      // Upload profile image if selected (optional)
      let profileImageUrl = null;
      if (profileImage) {
        setUploadingImage(true);
        const uploadResult = await authService.uploadProfileImage(userId, profileImage);
        if (uploadResult.success) {
          profileImageUrl = uploadResult.imageUrl;
        }
        setUploadingImage(false);
      }

      // Update user profile
      const updateResult = await authService.updateUserProfile(userId, {
        displayName: name,
        email,
        address,
        phoneNumber: contactNo,
        photoURL: profileImageUrl,
      });

      if (updateResult.success) {
        Alert.alert('Success', 'Profile completed! Welcome to Disastour', [
          {
            text: 'OK',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              });
            },
          },
        ]);
      } else {
        Alert.alert('Error', updateResult.error);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              {/* Profile Picture Upload - Optional */}
              <TouchableOpacity 
                style={styles.imageContainer}
                onPress={handleImagePicker}
                activeOpacity={0.7}
              >
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.profileImage} />
                ) : (
                  <View style={styles.placeholderImage}>
                    <Text style={styles.placeholderIcon}>📷</Text>
                  </View>
                )}
                <View style={styles.editBadge}>
                  <Text style={styles.editIcon}>+</Text>
                </View>
              </TouchableOpacity>
              <Text style={styles.optionalText}>(Profile picture is optional)</Text>

              <Text style={styles.title}>Complete Your Profile</Text>
              <Text style={styles.subtitle}>
                Help us personalize your experience
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor="#94A3B8"
                  value={name}
                  onChangeText={setName}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Email Address *</Text>
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                </View>
                <TextInput
                  style={[styles.input, styles.disabledInput]}
                  placeholder="your@email.com"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  editable={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Address *</Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  placeholder="123 Main St, City, State, Country"
                  placeholderTextColor="#94A3B8"
                  value={address}
                  onChangeText={setAddress}
                  multiline
                  numberOfLines={3}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Contact Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+63 912 345 6789"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  value={contactNo}
                  onChangeText={setContactNo}
                  editable={!loading}
                />
              </View>

              <View style={styles.requiredNote}>
                <Text style={styles.requiredText}>* Required fields</Text>
              </View>

              <TouchableOpacity
                style={[styles.completeButton, (loading || uploadingImage) && styles.buttonDisabled]}
                onPress={handleCompleteProfile}
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
                  <Text style={styles.completeButtonText}>Complete Profile</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoText}>
                Your information is secure and will only be used for emergency alerts and location-based notifications.
              </Text>
            </View>
          </View>
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'ios' ? 48 : 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#3B82F6',
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#BFDBFE',
    borderStyle: 'dashed',
  },
  placeholderIcon: {
    fontSize: 40,
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
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  optionalText: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 8,
    letterSpacing: -1,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '400',
    textAlign: 'center',
  },
  form: {
    gap: 24,
    marginBottom: 24,
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
  requiredNote: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  requiredText: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '600',
    textAlign: 'center',
  },
  completeButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  completeButtonText: {
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
  infoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 20,
    textAlign: 'center',
  },
});

export default ProfileDetailsScreen;