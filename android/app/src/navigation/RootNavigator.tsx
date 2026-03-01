'use client';

import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { colors } from '../config/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LocationPermissionScreen from '../screens/LocationPermissionScreen';
import GetStartedScreen from '../screens/GetStartedScreen';
import SignUpScreen from '../screens/SignUpScreen';
import SignInScreen from '../screens/SignInScreen';
import PhoneVerificationScreen from '../screens/PhoneVerificationScreen';
import ProfileDetailsScreen from '../screens/ProfileDetailsScreen';
import MapHomeScreen from '../screens/MapHomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';

import HotlineScreen from '../screens/HotlineScreen';
import CheckInScreen from '../screens/CheckInScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import FriendRequestsScreen from '../screens/FriendRequestsScreen';
import FamilyRequestsScreen from '../screens/FamilyRequestsScreen';

export type RootStackParamList = {
  LocationPermission: undefined;
  GetStarted: undefined;
  SignUp: undefined;
  SignIn: undefined;
  PhoneVerification: {
    phoneNumber: string;
    confirmation: any;
    isSignUp?: boolean;
  };
  ProfileDetails: { userId: string };
  Home: undefined;
  MapHome: undefined;
  Profile: undefined;
  EditProfile: undefined;
  Hotline: undefined;
  CheckIn: undefined;
  Notifications: undefined;
  FriendRequests: undefined;
  FamilyRequests: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [hasSeenPermission, setHasSeenPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // First useEffect - Check AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem('hasSeenLocationPermission').then(value => {
      setHasSeenPermission(value === 'true');
      setIsLoading(false);
    });
  }, []);

  // Second useEffect - Auth listener (UPDATED for phone auth)
  useEffect(() => {
    const authInstance = getAuth();
    const subscriber = onAuthStateChanged(authInstance, async (user) => {
      setUser(user);

      if (user) {
        // User is authenticated (either email verified OR phone auth)
        const isEmailUser = user.email && user.emailVerified;
        const isPhoneUser = user.phoneNumber && !user.email;
        
        console.log('Auth State:', {
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
          phoneNumber: user.phoneNumber,
          isEmailUser,
          isPhoneUser
        });
        
        // Check if authenticated (email verified OR phone user)
        if (isEmailUser || isPhoneUser) {
          // Check if user has completed profile
          try {
            const userDoc = await firestore()
              .collection('users')
              .doc(user.uid)
              .get();

            const userData = userDoc.data();
            
            // Check if profile is complete (has displayName and at least some profile data)
            const profileComplete = userData && 
              userData.displayName && 
              userData.displayName.trim() !== '';

            setHasProfile(profileComplete);
            
            console.log('Profile Check:', {
              uid: user.uid,
              authMethod: isEmailUser ? 'email' : 'phone',
              displayName: userData?.displayName,
              hasUserData: !!userData,
              profileComplete
            });
          } catch (error) {
            console.error('Error checking user profile:', error);
            setHasProfile(false);
          }
        } else {
          // Email user but not verified yet
          console.log('User not authenticated - email not verified');
          setHasProfile(null);
        }
      } else {
        console.log('No user signed in');
        setHasProfile(null);
      }

      setInitializing(false);
    });

    return subscriber;
  }, []);

  // Show loading screen while checking AsyncStorage or initializing auth
  // Wait for profile check if user is authenticated (email verified OR phone user)
  const isAuthenticated = user && (user.emailVerified || (user.phoneNumber && !user.email));
  const shouldWaitForProfileCheck = isAuthenticated && hasProfile === null;
  
  if (isLoading || initializing || shouldWaitForProfileCheck) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.white,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const getInitialRouteName = () => {
    console.log('getInitialRouteName - State:', {
      hasUser: !!user,
      email: user?.email,
      emailVerified: user?.emailVerified,
      phoneNumber: user?.phoneNumber,
      hasProfile,
      hasSeenPermission
    });

    // Not logged in
    if (!user) {
      return hasSeenPermission ? "GetStarted" : "LocationPermission";
    }

    // Check if authenticated (email verified OR phone user)
    const isEmailUser = user.email && user.emailVerified;
    const isPhoneUser = user.phoneNumber && !user.email;
    const isAuthenticated = isEmailUser || isPhoneUser;
    
    console.log('Auth Check:', { isEmailUser, isPhoneUser, isAuthenticated });

    if (!isAuthenticated) {
      // User exists but not authenticated yet (email not verified)
      return hasSeenPermission ? "GetStarted" : "LocationPermission";
    }

    // Authenticated - check profile
    if (hasProfile === false) {
      console.log('→ Navigating to ProfileDetails (no profile)');
      return "ProfileDetails";
    } else if (hasProfile === true) {
      console.log('→ Navigating to Home (profile complete)');
      return "Home";
    } else {
      // hasProfile is null - still loading, should not reach here
      console.log('→ hasProfile is null, showing loading...');
      return "GetStarted"; // Fallback
    }
  };

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={getInitialRouteName()} screenOptions={{ headerShown: false }}>
        {!user || (!user.emailVerified && !user.phoneNumber) ? (
          // Not logged in or email not verified (and not phone user)
          <>
            <Stack.Screen name="LocationPermission" component={LocationPermissionScreen} />
            <Stack.Screen name="GetStarted" component={GetStartedScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="SignIn" component={SignInScreen} />
            <Stack.Screen
              name="PhoneVerification"
              component={PhoneVerificationScreen}
              options={{ 
                headerShown: false,
                gestureEnabled: false, // Prevent swipe back
              }}
            />
          </>
        ) : !hasProfile ? (
          // Authenticated but profile incomplete - force ProfileDetailsScreen
          <>
            <Stack.Screen
              name="ProfileDetails"
              component={ProfileDetailsScreen}
              initialParams={{ userId: user.uid }}
              options={{ gestureEnabled: false }}
            />
            {/* Hidden screens for navigation after profile completion */}
            <Stack.Screen name="Home" component={MapHomeScreen} />
            <Stack.Screen name="MapHome" component={MapHomeScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="Hotline" component={HotlineScreen} />
            <Stack.Screen name="CheckIn" component={CheckInScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="FriendRequests" component={FriendRequestsScreen} />
            <Stack.Screen name="FamilyRequests" component={FamilyRequestsScreen} />
          </>
        ) : (
          // Authenticated + profile complete - full app access
          <>
            <Stack.Screen name="Home" component={MapHomeScreen} />
            <Stack.Screen name="MapHome" component={MapHomeScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="ProfileDetails" component={ProfileDetailsScreen} />
            <Stack.Screen name="Hotline" component={HotlineScreen} />
            <Stack.Screen name="CheckIn" component={CheckInScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="FriendRequests" component={FriendRequestsScreen} />
            <Stack.Screen name="FamilyRequests" component={FamilyRequestsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};