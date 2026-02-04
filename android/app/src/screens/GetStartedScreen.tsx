import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
  Platform,
  Image,  // Add this import
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors } from '../config/colors';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'GetStarted'>;
};

const { width, height } = Dimensions.get('window');

const GetStartedScreen: React.FC<Props> = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.backgroundCircle} />
      
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Animated.View 
            style={[
              styles.iconContainer,
              {
                transform: [{ scale: pulseAnim }],
              }
            ]}
          >
            <View style={styles.iconCircle}>
              {/* Replace emoji with Image component */}
              <Image
                source={require('../assets/images/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <View style={styles.iconPulse} />
          </Animated.View>

          <Text style={styles.appName}>Disastour</Text>
          <Text style={styles.tagline}>Stay Prepared, Stay Safe</Text>
        </View>

        {/* Value Props */}
        <View style={styles.valueSection}>
          <ValueItem icon="📍" text="Real-time disaster alerts" />
          <ValueItem icon="🗺️" text="Location awareness" />
          <ValueItem icon="🛡️" text="Emergency preparedness" />
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <TouchableOpacity
            style={styles.signUpButton}
            onPress={() => navigation.navigate('SignUp')}
            activeOpacity={0.9}
          >
            <Text style={styles.signUpButtonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => navigation.navigate('SignIn')}
            activeOpacity={0.7}
          >
            <Text style={styles.signInButtonText}>
              Already have an account? <Text style={styles.signInLink}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const ValueItem: React.FC<{ icon: string; text: string }> = ({ icon, text }) => (
  <View style={styles.valueItem}>
    <Text style={styles.valueIcon}>{icon}</Text>
    <Text style={styles.valueText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundCircle: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 0.75,
    backgroundColor: '#3B82F6',
    opacity: 0.05,
    top: -width * 0.5,
    left: -width * 0.25,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? height * 0.12 : height * 0.05,
    paddingBottom: Platform.OS === 'ios' ? 48 : 32,
  },
  heroSection: {
    alignItems: 'center',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 32,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  iconPulse: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#3B82F6',
    opacity: 0.2,
    transform: [{ scale: 1.3 }],
  },
  // Replace icon style with logo style
  logo: {
    width: 120,
    height: 120,
    borderRadius: 100,  // Half of width/height to make it circular
    overflow: 'hidden',
  },
  appName: {
    fontSize: 48,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 12,
    letterSpacing: -1.5,
  },
  tagline: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: '500',
  },
  valueSection: {
    gap: 24,
  },
  valueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  valueIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  valueText: {
    fontSize: 16,
    color: '#334155',
    fontWeight: '600',
  },
  ctaSection: {
    gap: 16,
  },
  signUpButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  signInButton: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  signInButtonText: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
  },
  signInLink: {
    color: '#3B82F6',
    fontWeight: '700',
  },
});

export default GetStartedScreen;