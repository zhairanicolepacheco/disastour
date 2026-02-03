import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  updateProfile,
  reload,
} from '@react-native-firebase/auth';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';
import { getFirestore, collection, doc, setDoc, getDoc, serverTimestamp } from '@react-native-firebase/firestore';

class AuthService {
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

  async uploadProfileImage(userId: string, imageUri: string) {
    try {
      console.log('📤 Uploading profile image for user:', userId);
      console.log('📁 Image URI:', imageUri);

      // Use the namespaced API for storage (it's still supported)
      const filename = `profile_${userId}_${Date.now()}.jpg`;
      const reference = storage().ref(`profile_images/${filename}`);

      // Upload file using putFile (React Native specific method)
      const task = reference.putFile(imageUri);

      // Optional: Track upload progress
      task.on('state_changed', (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log(`📊 Upload progress: ${progress.toFixed(0)}%`);
      });

      // Wait for upload to complete
      await task;
      console.log('✅ Image uploaded to storage');

      // Get the download URL
      const downloadURL = await reference.getDownloadURL();
      console.log('✅ Got download URL:', downloadURL);

      return { success: true, imageUrl: downloadURL };
    } catch (error: any) {
      console.error('❌ Image upload error:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      
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
        case 'storage/object-not-found':
          errorMessage = 'File not found';
          break;
        case 'storage/invalid-argument':
          errorMessage = 'Invalid file path or URI';
          break;
        default:
          errorMessage = error.message || errorMessage;
      }

      return { success: false, error: errorMessage };
    }
  }

  // NEW METHOD: Get user profile from Firestore
  async getUserProfile(userId: string) {
    try {
      console.log('📖 Fetching user profile:', userId);

      const firestoreInstance = getFirestore();
      const usersCollection = collection(firestoreInstance, 'users');
      const userDocRef = doc(usersCollection, userId);

      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        console.log('✅ User profile found');
        return userDoc.data();
      } else {
        console.log('⚠️ No user profile found in Firestore');
        return null;
      }
    } catch (error: any) {
      console.error('❌ Error fetching user profile:', error);
      
      let errorMessage = 'Failed to fetch user profile';
      
      switch (error.code) {
        case 'permission-denied':
          errorMessage = 'Not authorized to access this profile';
          break;
        case 'network-request-failed':
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
    email: string;
    address: string;
    phoneNumber: string;
    photoURL?: string | null;
  }) {
    try {
      console.log('💾 Updating user profile:', userId);

      const firestoreInstance = getFirestore();
      const usersCollection = collection(firestoreInstance, 'users');
      const userDocRef = doc(usersCollection, userId);

      // Update Firestore document with merge
      await setDoc(userDocRef, {
        displayName: profileData.displayName,
        email: profileData.email,
        address: profileData.address,
        phoneNumber: profileData.phoneNumber,
        photoURL: profileData.photoURL || null,
        updatedAt: serverTimestamp(),
      }, { merge: true });

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

      // Use the new modular API: reload() function instead of currentUser.reload()
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