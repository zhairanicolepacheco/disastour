'use client';

import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import { colors } from '../config/colors';

import GetStartedScreen from '../screens/GetStartedScreen';
import SignUpScreen from '../screens/SignUpScreen';
import SignInScreen from '../screens/SignInScreen';
import ProfileDetailsScreen from '../screens/ProfileDetailsScreen';
import MapHomeScreen from '../screens/MapHomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';

import HotlineScreen from '../screens/HotlineScreen';
import CheckInScreen from '../screens/CheckInScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import FriendRequestsScreen from '../screens/FriendRequestsScreen';

export type RootStackParamList = {
  GetStarted: undefined;
  SignUp: undefined;
  SignIn: undefined;
  ProfileDetails: { userId: string };
  Home: undefined;
  MapHome: undefined;
  Profile: undefined;
  EditProfile: undefined;
  Hotline: undefined;
  CheckIn: undefined;
  Notifications: undefined;
  FriendRequests: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const authInstance = getAuth();
    const subscriber = onAuthStateChanged(authInstance, user => {
      setUser(user);
      setInitializing(false);
    });

    return subscriber;
  }, []);

  if (initializing) {
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

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user == null || !user.emailVerified ? (
          <>
            <Stack.Screen name="GetStarted" component={GetStartedScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="SignIn" component={SignInScreen} />
          </>
        ) : !user.displayName || user.displayName === '' ? (
          <>
            {/* ✅ Email verified but profile incomplete - show ProfileDetailsScreen first */}
            <Stack.Screen
              name="ProfileDetails"
              component={ProfileDetailsScreen}
              initialParams={{ userId: user.uid }}
            />
            {/* ✅ Hidden screens for navigation after profile completion */}
            <Stack.Screen name="Home" component={MapHomeScreen} />
            <Stack.Screen name="MapHome" component={MapHomeScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="Hotline" component={HotlineScreen} />
            <Stack.Screen name="CheckIn" component={CheckInScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="FriendRequests" component={FriendRequestsScreen} />
          </>
        ) : (
          <>
            {/* ✅ Email verified + profile complete - go directly to Home */}
            <Stack.Screen name="Home" component={MapHomeScreen} />
            <Stack.Screen name="MapHome" component={MapHomeScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="ProfileDetails" component={ProfileDetailsScreen} />
            <Stack.Screen name="Hotline" component={HotlineScreen} />
            <Stack.Screen name="CheckIn" component={CheckInScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="FriendRequests" component={FriendRequestsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};