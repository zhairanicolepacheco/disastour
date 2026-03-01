import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  updateProfile,
  reload,
  PhoneAuthProvider,
  signInWithCredential,
} from '@react-native-firebase/auth';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';
import { getFirestore, collection, doc, setDoc, getDoc, serverTimestamp } from '@react-native-firebase/firestore';
import { offlineStorage } from './offlineStorage';

class AuthService {
  // ==================== EMAIL AUTHENTICATION ====================
  
  async signUp(email: string, password: string) {
    try {
      const authInstance = getAuth();
      const userCredential = await createUserWithEmailAndPassword(
        authInstance,
        email.trim().toLowerCase(),
        password
      );

      console.log('✅ User created:', userCredential.user.uid);
      console.log('📧 Sending verification email to:', userCredential.user.email);

      const actionCodeSettings = {
        url: 'https://disastour-88531.firebaseapp.com/__/auth/action',
        handleCodeInApp: false,
      };

      try {
        await sendEmailVerification(userCredential.user, actionCodeSettings);
        console.log('✅ Verification email sent successfully');
      } catch (emailError: any) {
        console.error('❌ Error sending verification email:', emailError);
        return {
          success: true,
          emailSendFailed: true,
          error: 'Account created but verification email failed. You can request a new one.',
        };
      }

      return { success: true };
    } catch (error: any) {
      console.error('❌ Sign up error:', error);
      
      let errorMessage = 'An error occurred during sign up';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already registered';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection';
          break;
        default:
          errorMessage = error.message || errorMessage;
      }

      return { success: false, error: errorMessage };
    }
  }

  async signIn(email: string, password: string) {
    try {
      const authInstance = getAuth();
      const userCredential = await signInWithEmailAndPassword(
        authInstance,
        email.trim().toLowerCase(),
        password
      );

      console.log('✅ User signed in:', userCredential.user.uid);

      if (!userCredential.user.emailVerified) {
        console.log('⚠️ Email not verified');
        await signOut(authInstance);
        return {
          success: false,
          emailNotVerified: true,
          error: 'Please verify your email before signing in',
        };
      }

      return { success: true };
    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      
      let errorMessage = 'An error occurred during sign in';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection';
          break;
        default:
          errorMessage = error.message || errorMessage;
      }

      return { success: false, error: errorMessage };
    }
  }

  async resendVerificationEmail() {
    try {
      const authInstance = getAuth();
      const currentUser = authInstance.currentUser;

      if (!currentUser) {
        console.log('❌ No current user found');
        return { success: false, error: 'No user is currently signed in' };
      }

      if (currentUser.emailVerified) {
        console.log('✅ Email already verified');
        return { success: false, error: 'Email is already verified' };
      }

      console.log('📧 Resending verification email to:', currentUser.email);

      const actionCodeSettings = {
        url: 'https://disastour-88531.firebaseapp.com/__/auth/action',
        handleCodeInApp: false,
      };

      await sendEmailVerification(currentUser, actionCodeSettings);
      console.log('✅ Verification email resent successfully');

      return { success: true };
    } catch (error: any) {
      console.error('❌ Resend verification error:', error);
      
      let errorMessage = 'Failed to resend verification email';
      
      switch (error.code) {
        case 'auth/too-many-requests':
          errorMessage = 'Too many requests. Please wait a few minutes and try again';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection';
          break;
        default:
          errorMessage = error.message || errorMessage;
      }

      return { success: false, error: errorMessage };
    }
  }

  // ==================== PHONE AUTHENTICATION ====================

  async signUpWithPhone(phoneNumber: string) {
    try {
      console.log('📱 Starting phone signup:', phoneNumber);
      const authInstance = getAuth();

      // Send verification code
      const confirmation = await authInstance.signInWithPhoneNumber(phoneNumber);
      
      console.log('✅ SMS sent successfully');
      
      return { 
        success: true, 
        verificationId: confirmation.verificationId,
        confirmation: confirmation // Store for verification
      };
    } catch (error: any) {
      console.error('❌ Phone signup error:', error);
      
      let errorMessage = 'Failed to send verification code';
      
      switch (error.code) {
        case 'auth/invalid-phone-number':
          errorMessage = 'Invalid phone number format. Use +63XXXXXXXXXX';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many attempts. Please try again later';
          break;
        case 'auth/quota-exceeded':
          errorMessage = 'SMS quota exceeded. Please try again tomorrow';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection';
          break;
        default:
          errorMessage = error.message || errorMessage;
      }

      return { success: false, error: errorMessage };
    }
  }

  async signInWithPhone(phoneNumber: string) {
    try {
      console.log('📱 Starting phone signin:', phoneNumber);
      const authInstance = getAuth();

      // Send verification code
      const confirmation = await authInstance.signInWithPhoneNumber(phoneNumber);
      
      console.log('✅ SMS sent successfully');
      
      return { 
        success: true, 
        verificationId: confirmation.verificationId,
        confirmation: confirmation
      };
    } catch (error: any) {
      console.error('❌ Phone signin error:', error);
      
      let errorMessage = 'Failed to send verification code';
      
      switch (error.code) {
        case 'auth/invalid-phone-number':
          errorMessage = 'Invalid phone number format. Use +63XXXXXXXXXX';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many attempts. Please try again later';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection';
          break;
        default:
          errorMessage = error.message || errorMessage;
      }

      return { success: false, error: errorMessage };
    }
  }

  async verifyPhoneCode(confirmation: any, code: string) {
    try {
      console.log('🔐 Verifying code:', code);
      
      // Confirm the verification code
      const result = await confirmation.confirm(code);
      
      console.log('✅ Phone verified successfully');
      console.log('✅ User ID:', result.user.uid);
      
      return { 
        success: true, 
        userId: result.user.uid,
        user: result.user
      };
    } catch (error: any) {
      console.error('❌ Code verification error:', error);
      
      let errorMessage = 'Invalid verification code';
      
      switch (error.code) {
        case 'auth/invalid-verification-code':
          errorMessage = 'Invalid code. Please check and try again';
          break;
        case 'auth/code-expired':
          errorMessage = 'Code expired. Please request a new one';
          break;
        case 'auth/session-expired':
          errorMessage = 'Session expired. Please start over';
          break;
        default:
          errorMessage = error.message || errorMessage;
      }

      return { success: false, error: errorMessage };
    }
  }

  // ==================== COMMON METHODS ====================

  async uploadProfileImage(userId: string, imageUri: string) {
    try {
      console.log('📤 Uploading profile image for user:', userId);
      console.log('📁 Image URI:', imageUri);

      const filename = `profile_${userId}_${Date.now()}.jpg`;
      const reference = storage().ref(`profile_images/${filename}`);

      const task = reference.putFile(imageUri);

      task.on('state_changed', (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log(`📊 Upload progress: ${progress.toFixed(0)}%`);
      });

      await task;
      console.log('✅ Image uploaded to storage');

      const downloadURL = await reference.getDownloadURL();
      console.log('✅ Got download URL:', downloadURL);

      return { success: true, imageUrl: downloadURL };
    } catch (error: any) {
      console.error('❌ Image upload error:', error);
      
      let errorMessage = 'Failed to upload image';
      
      switch (error.code) {
        case 'storage/unauthorized':
          errorMessage = 'Not authorized to upload images. Check Firebase Storage rules.';
          break;
        case 'storage/canceled':
          errorMessage = 'Upload canceled';
          break;
        case 'storage/unknown':
          errorMessage = 'Unknown error occurred during upload';
          break;
        default:
          errorMessage = error.message || errorMessage;
      }

      return { success: false, error: errorMessage };
    }
  }

  async getUserProfile(userId: string) {
    try {
      console.log('📖 Fetching user profile:', userId);

      const firestoreInstance = getFirestore();
      const usersCollection = collection(firestoreInstance, 'users');
      const userDocRef = doc(usersCollection, userId);

      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        console.log('✅ User profile found');
        const profileData = userDoc.data();
        
        // Cache profile data for offline access
        await offlineStorage.cacheUserProfile(profileData);
        
        return profileData;
      } else {
        console.log('⚠️ No user profile found in Firestore');
        
        // Try to load cached profile if offline
        const cachedProfile = await offlineStorage.getCachedUserProfile();
        if (cachedProfile) {
          console.log('✅ Loaded cached profile');
          return cachedProfile;
        }
        
        return null;
      }
    } catch (error: any) {
      console.error('❌ Error fetching user profile:', error);
      
      // If network error, try cached profile
      if (error.code === 'unavailable' || error.message.includes('network')) {
        const cachedProfile = await offlineStorage.getCachedUserProfile();
        if (cachedProfile) {
          console.log('✅ Using cached profile (offline)');
          return cachedProfile;
        }
      }
      
      let errorMessage = 'Failed to fetch user profile';
      
      switch (error.code) {
        case 'permission-denied':
          errorMessage = 'Not authorized to access this profile';
          break;
        case 'unavailable':
          errorMessage = 'Network error. Please check your connection';
          break;
        default:
          errorMessage = error.message || errorMessage;
      }

      throw new Error(errorMessage);
    }
  }

  async updateUserProfile(userId: string, profileData: {
    displayName: string;
    email?: string | null;
    phoneNumber?: string | null;
    address: string;
    contactNumber: string;
    photoURL?: string | null;
    authMethod?: 'email' | 'phone';
  }) {
    try {
      console.log('💾 Updating user profile:', userId);

      const firestoreInstance = getFirestore();
      const usersCollection = collection(firestoreInstance, 'users');
      const userDocRef = doc(usersCollection, userId);

      const updateData: any = {
        displayName: profileData.displayName,
        address: profileData.address,
        contactNumber: profileData.contactNumber,
        photoURL: profileData.photoURL || null,
        updatedAt: serverTimestamp(),
      };

      // Add email or phone based on auth method
      if (profileData.email) {
        updateData.email = profileData.email;
        updateData.authMethod = 'email';
      }
      if (profileData.phoneNumber) {
        updateData.phoneNumber = profileData.phoneNumber;
        updateData.authMethod = profileData.authMethod || 'phone';
      }

      await setDoc(userDocRef, updateData, { merge: true });

      // Update Firebase Auth profile
      const authInstance = getAuth();
      const currentUser = authInstance.currentUser;
      if (currentUser) {
        await updateProfile(currentUser, {
          displayName: profileData.displayName,
          photoURL: profileData.photoURL || null,
        });
      }

      console.log('✅ Profile updated successfully');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Profile update error:', error);
      
      let errorMessage = 'Failed to update profile';
      
      switch (error.code) {
        case 'permission-denied':
          errorMessage = 'Not authorized to update profile';
          break;
        case 'network-request-failed':
          errorMessage = 'Network error. Please check your connection';
          break;
        default:
          errorMessage = error.message || errorMessage;
      }

      return { success: false, error: errorMessage };
    }
  }

  async signOut() {
    try {
      const authInstance = getAuth();
      await signOut(authInstance);
      console.log('✅ User signed out successfully');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Sign out error:', error);
      return { success: false, error: error.message };
    }
  }

  async checkEmailVerified() {
    try {
      const authInstance = getAuth();
      const currentUser = authInstance.currentUser;
      
      if (!currentUser) {
        return { verified: false, error: 'No user signed in' };
      }

      await reload(currentUser);
      const user = authInstance.currentUser;

      return { 
        verified: user?.emailVerified || false,
        email: user?.email 
      };
    } catch (error: any) {
      console.error('❌ Error checking email verification:', error);
      return { verified: false, error: error.message };
    }
  }

  getCurrentUser(): FirebaseAuthTypes.User | null {
    const authInstance = getAuth();
    return authInstance.currentUser;
  }

  onAuthStateChanged(callback: (user: FirebaseAuthTypes.User | null) => void) {
    const authInstance = getAuth();
    return onAuthStateChanged(authInstance, callback);
  }
}

export const authService = new AuthService();