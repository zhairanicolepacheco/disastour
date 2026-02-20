import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../navigation/RootNavigator';
import messaging from '@react-native-firebase/messaging';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'LocationPermission'>;
};

const { width, height } = Dimensions.get('window');

type PermissionStatus = 'pending' | 'granted' | 'denied';

const LocationPermissionScreen: React.FC<Props> = ({ navigation }) => {
  const [requesting, setRequesting] = useState(false);
  const [locationStatus, setLocationStatus] = useState<PermissionStatus>('pending');
  const [notificationStatus, setNotificationStatus] = useState<PermissionStatus>('pending');

  useEffect(() => {
    checkExistingPermissions();
  }, []);

  const checkExistingPermissions = async () => {
    // Check location permission
    if (Platform.OS === 'android') {
      const locationGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      setLocationStatus(locationGranted ? 'granted' : 'pending');

      if (Platform.Version >= 33) {
        const notifGranted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        setNotificationStatus(notifGranted ? 'granted' : 'pending');
      }
    } else {
      // iOS - check notification permission
      const authStatus = await messaging().hasPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      setNotificationStatus(enabled ? 'granted' : 'pending');
    }
  };

  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'Disastour needs access to your location to provide emergency alerts and show nearby evacuation centers.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setLocationStatus('granted');
          
          // Test location
          Geolocation.getCurrentPosition(
            (position) => {
              console.log('Location obtained:', position);
            },
            (error) => {
              console.log('Location error:', error);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
          );
        } else {
          setLocationStatus('denied');
        }
      } else {
        // iOS - permission requested when actually using location
        setLocationStatus('granted');
      }
    } catch (err) {
      console.warn('Location permission error:', err);
      setLocationStatus('denied');
    }
  };

  const requestNotificationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: 'Notification Permission',
              message: 'Disastour needs to send you emergency alerts and disaster notifications.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );

          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            setNotificationStatus('granted');
          } else {
            setNotificationStatus('denied');
          }
        } else {
          // Android 12 and below - notifications are allowed by default
          setNotificationStatus('granted');
        }
      } else {
        // iOS
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        setNotificationStatus(enabled ? 'granted' : 'denied');
      }
    } catch (err) {
      console.warn('Notification permission error:', err);
      setNotificationStatus('denied');
    }
  };

  const handleAllowAll = async () => {
    setRequesting(true);

    // Request location first
    if (locationStatus !== 'granted') {
      await requestLocationPermission();
    }

    // Then request notifications
    if (notificationStatus !== 'granted') {
      await requestNotificationPermission();
    }

    setRequesting(false);

    // Save that user has seen this screen
    await AsyncStorage.setItem('hasSeenLocationPermission', 'true');

    // Navigate to next screen
    navigation.replace('GetStarted');
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Permissions?',
      'These permissions are important for emergency alerts and safety features. You can enable them later in app settings.',
      [
        {
          text: 'Go Back',
          style: 'cancel',
        },
        {
          text: 'Skip Anyway',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.setItem('hasSeenLocationPermission', 'true');
            navigation.replace('GetStarted');
          },
        },
      ]
    );
  };

  const allPermissionsGranted = locationStatus === 'granted' && notificationStatus === 'granted';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon Section */}
        <View style={styles.iconSection}>
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>🛡️</Text>
          </View>
          <View style={styles.iconPulse} />
        </View>

        {/* Text Section */}
        <View style={styles.textSection}>
          <Text style={styles.title}>Enable Safety Permissions</Text>
          <Text style={styles.subtitle}>
            To keep you safe during emergencies, we need:
          </Text>

          <View style={styles.permissionsSection}>
            {/* Location Permission Card */}
            <View style={styles.permissionCard}>
              <View style={styles.permissionHeader}>
                <View style={styles.permissionIconContainer}>
                  <Text style={styles.permissionIcon}>📍</Text>
                </View>
                <View style={styles.permissionInfo}>
                  <Text style={styles.permissionTitle}>Location Access</Text>
                  <Text style={styles.permissionStatus}>
                    {locationStatus === 'granted' ? 'Enabled' : 
                     locationStatus === 'denied' ? 'Denied' : 'Required'}
                  </Text>
                </View>
                {locationStatus !== 'granted' && (
                  <TouchableOpacity
                    style={styles.enableButton}
                    onPress={requestLocationPermission}
                  >
                    <Text style={styles.enableButtonText}>Enable</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.featuresList}>
                {/* <Text style={styles.featureItem}>• Real-time disaster alerts near you</Text> */}
                <Text style={styles.featureItem}>• Nearby evacuation centers</Text>
                <Text style={styles.featureItem}>• Family location sharing</Text>
                <Text style={styles.featureItem}>• Safety zone notifications</Text>
              </View>
            </View>

            {/* Notification Permission Card */}
            <View style={styles.permissionCard}>
              <View style={styles.permissionHeader}>
                <View style={styles.permissionIconContainer}>
                  <Text style={styles.permissionIcon}>🔔</Text>
                </View>
                <View style={styles.permissionInfo}>
                  <Text style={styles.permissionTitle}>Notifications</Text>
                  <Text style={styles.permissionStatus}>
                    {notificationStatus === 'granted' ? 'Enabled' : 
                     notificationStatus === 'denied' ? 'Denied' : 'Required'}
                  </Text>
                </View>
                {notificationStatus !== 'granted' && (
                  <TouchableOpacity
                    style={styles.enableButton}
                    onPress={requestNotificationPermission}
                  >
                    <Text style={styles.enableButtonText}>Enable</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.featuresList}>
                <Text style={styles.featureItem}>• Emergency alerts and warnings</Text>
                <Text style={styles.featureItem}>• Check-in reminders</Text>
                <Text style={styles.featureItem}>• Family safety updates</Text>
              </View>
            </View>
          </View>

          <View style={styles.privacyNote}>
            <Text style={styles.privacyIcon}>🔒</Text>
            <Text style={styles.privacyText}>
              Your data is encrypted and only used for emergency purposes. We never share your information with third parties.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Buttons Section */}
      <View style={styles.buttonsSection}>
        <TouchableOpacity
          style={[
            styles.allowButton,
            allPermissionsGranted && styles.allowButtonSuccess
          ]}
          onPress={handleAllowAll}
          disabled={requesting}
          activeOpacity={0.9}
        >
          <Text style={styles.allowButtonText}>
            {requesting ? 'Processing...' : 
             allPermissionsGranted ? 'Continue' : 'Enable All Permissions'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          disabled={requesting}
          activeOpacity={0.7}
        >
          <Text style={styles.skipButtonText}>Skip for Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 20 : 32,
    paddingBottom: 20,
  },
  iconSection: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  iconPulse: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#3B82F6',
    opacity: 0.3,
    transform: [{ scale: 1.4 }],
  },
  icon: {
    fontSize: 45,
  },
  textSection: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  permissionsSection: {
    gap: 16,
    marginBottom: 20,
  },
  permissionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  permissionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  permissionIcon: {
    fontSize: 24,
  },
  permissionInfo: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  permissionStatus: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  enableButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  enableButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  featuresList: {
    gap: 6,
    paddingLeft: 8,
  },
  featureItem: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  privacyNote: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'flex-start',
  },
  privacyIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
    fontWeight: '500',
  },
  buttonsSection: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
    paddingTop: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  allowButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  allowButtonSuccess: {
    backgroundColor: '#10B981',
  },
  allowButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  skipButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
});

export default LocationPermissionScreen;