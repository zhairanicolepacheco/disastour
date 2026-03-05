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

  // Second useEffect - Auth listener
  useEffect(() => {
    const authInstance = getAuth();
    const subscriber = onAuthStateChanged(authInstance, async (user) => {
      setUser(user);

      if (user) {
        const isEmailUser = user.email && user.emailVerified;
        const isPhoneUser = user.phoneNumber && !user.email;

        if (isEmailUser || isPhoneUser) {
          try {
            const userDoc = await firestore()
              .collection('users')
              .doc(user.uid)
              .get();

            const userData = userDoc.data();
            const profileComplete =
              !!userData &&
              !!userData.displayName &&
              userData.displayName.trim() !== '';

            setHasProfile(profileComplete);
          } catch (error) {
            console.error('Error checking user profile:', error);
            setHasProfile(false);
          }
        } else {
          setHasProfile(null);
        }
      } else {
        setHasProfile(null);
      }

      setInitializing(false);
    });

    return subscriber;
  }, []);

  // Derived auth state
  const isEmailUser = user?.email && user?.emailVerified;
  const isPhoneUser = user?.phoneNumber && !user?.email;
  const isAuthenticated = !!(isEmailUser || isPhoneUser);

  // Wait until everything is resolved before rendering the navigator
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

  // Determine which branch we're in, then derive the correct initialRouteName
  // so it always refers to a screen that exists in the rendered stack.
  const unauthenticated = !user || (!user.emailVerified && !user.phoneNumber);
  const needsProfile = isAuthenticated && !hasProfile;
  const fullyReady = isAuthenticated && hasProfile;

  const getInitialRouteName = (): keyof RootStackParamList => {
    if (unauthenticated) {
      return hasSeenPermission ? 'GetStarted' : 'LocationPermission';
    }
    if (needsProfile) {
      return 'ProfileDetails';
    }
    return 'MapHome';
  };

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={getInitialRouteName()}
        screenOptions={{ headerShown: false }}
      >
        {unauthenticated ? (
          // ── Branch 1: not logged in / email unverified ──────────────────
          <>
            <Stack.Screen name="LocationPermission" component={LocationPermissionScreen} />
            <Stack.Screen name="GetStarted" component={GetStartedScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="SignIn" component={SignInScreen} />
            <Stack.Screen
              name="PhoneVerification"
              component={PhoneVerificationScreen}
              options={{ headerShown: false, gestureEnabled: false }}
            />
          </>
        ) : needsProfile ? (
          // ── Branch 2: authenticated but profile incomplete ──────────────
          <>
            <Stack.Screen
              name="ProfileDetails"
              component={ProfileDetailsScreen}
              initialParams={{ userId: user.uid }}
              options={{ gestureEnabled: false }}
            />
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
          // ── Branch 3: fully authenticated with profile ──────────────────
          <>
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