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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import PhoneInput from 'react-native-phone-number-input';
import { RootStackParamList } from '../navigation/RootNavigator';
import { authService } from '../services/authService';
import { colors } from '../config/colors';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SignIn'>;
};

type AuthMethod = 'email' | 'phone';

const SignInScreen: React.FC<Props> = ({ navigation }) => {
  // Tab state
  const [authMethod, setAuthMethod] = useState<AuthMethod>('email');

  // Email states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Phone states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');
  const [phoneValid, setPhoneValid] = useState(false);
  
  // Common states
  const [loading, setLoading] = useState(false);

  // Email validation
  const validateEmailInputs = () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return false;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return false;
    }
    return true;
  };

  // Phone validation
  const validatePhoneInputs = () => {
    if (!formattedPhone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return false;
    }
    if (!formattedPhone.startsWith('+63')) {
      Alert.alert('Error', 'Please enter a valid Philippine phone number');
      return false;
    }
    if (formattedPhone.length < 13) {
      Alert.alert('Error', 'Please enter a complete phone number');
      return false;
    }
    return true;
  };

  // Email sign in
  const handleEmailSignIn = async () => {
    if (!validateEmailInputs()) return;

    setLoading(true);
    const result = await authService.signIn(email, password);

    if (result && result.success) {
      Alert.alert('Success', 'Signed in successfully!');
    } else if (result && result.emailNotVerified) {
      Alert.alert(
        'Email Not Verified',
        'Please verify your email before signing in. Would you like us to resend the verification email?',
        [
          { text: 'Cancel', onPress: () => {} },
          {
            text: 'Resend Email',
            onPress: () => resendVerificationEmail(),
          },
        ]
      );
    } else {
      Alert.alert('Sign In Failed', result?.error || 'An error occurred');
    }
    setLoading(false);
  };

  // Resend verification email
  const resendVerificationEmail = async () => {
    setLoading(true);
    const result = await authService.resendVerificationEmail();
    if (result && result.success) {
      Alert.alert('Success', 'Verification email resent!');
    } else {
      Alert.alert('Error', result?.error || 'An error occurred');
    }
    setLoading(false);
  };

  // Phone sign in - send code and navigate to verification screen
  const handlePhoneSendCode = async () => {
    if (!validatePhoneInputs()) return;

    setLoading(true);
    console.log('📱 Sending code to:', formattedPhone);
    
    const result = await authService.signInWithPhone(formattedPhone);

    if (result && result.success) {
      setLoading(false);
      // Navigate to dedicated PhoneVerificationScreen
      navigation.navigate('PhoneVerification', {
        phoneNumber: formattedPhone,
        confirmation: result.confirmation,
        isSignUp: false, // This is sign in, not sign up
      });
    } else {
      setLoading(false);
      Alert.alert('Error', result?.error || 'Failed to send verification code');
    }
  };

  // Main sign in screen with tabs
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
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to continue</Text>
            </View>

            {/* Auth Method Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, authMethod === 'email' && styles.tabActive]}
                onPress={() => setAuthMethod('email')}
              >
                <Text style={styles.tabIcon}>📧</Text>
                <Text style={[styles.tabText, authMethod === 'email' && styles.tabTextActive]}>
                  Email
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tab, authMethod === 'phone' && styles.tabActive]}
                onPress={() => setAuthMethod('phone')}
              >
                <Text style={styles.tabIcon}>📱</Text>
                <Text style={[styles.tabText, authMethod === 'phone' && styles.tabTextActive]}>
                  Phone
                </Text>
              </TouchableOpacity>
            </View>

            {/* Email Form */}
            {authMethod === 'email' && (
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="your@email.com"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    editable={!loading}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    editable={!loading}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.signInButton, loading && styles.buttonDisabled]}
                  onPress={handleEmailSignIn}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.signInButtonText}>Sign In with Email</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Phone Form */}
            {authMethod === 'phone' && (
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone Number</Text>
                  <View style={styles.phoneInputContainer}>
                    <PhoneInput
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      onChangeFormattedText={(text) => {
                        setFormattedPhone(text);
                        setPhoneValid(text.length >= 13);
                      }}
                      defaultCode="PH"
                      layout="first"
                      containerStyle={styles.phoneContainer}
                      textContainerStyle={styles.phoneTextContainer}
                      textInputStyle={styles.phoneTextInput}
                      codeTextStyle={styles.phoneCodeText}
                      flagButtonStyle={styles.phoneFlagButton}
                      countryPickerButtonStyle={styles.phoneCountryPicker}
                      placeholder="912 345 6789"
                    />
                  </View>
                  <Text style={styles.phoneHint}>
                    Format: +63 XXX XXX XXXX
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.signInButton, 
                    (loading || !phoneValid) && styles.buttonDisabled
                  ]}
                  onPress={handlePhoneSendCode}
                  disabled={loading || !phoneValid}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.signInButtonText}>Send Verification Code</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.phoneInfoCard}>
                  <Text style={styles.phoneInfoIcon}>💡</Text>
                  <Text style={styles.phoneInfoText}>
                    We'll send a 6-digit verification code to your phone number via SMS.
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text style={styles.footerLink}>Sign Up</Text>
              </TouchableOpacity>
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
    paddingTop: 20,
    paddingBottom: 32,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '400',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 32,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabIcon: {
    fontSize: 18,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#1E293B',
    fontWeight: '700',
  },
  form: {
    gap: 24,
    marginBottom: 32,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
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
  phoneInputContainer: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
  },
  phoneContainer: {
    width: '100%',
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  phoneTextContainer: {
    backgroundColor: 'transparent',
    paddingVertical: 0,
  },
  phoneTextInput: {
    fontSize: 16,
    color: '#1E293B',
    paddingVertical: 16,
  },
  phoneCodeText: {
    fontSize: 16,
    color: '#1E293B',
  },
  phoneFlagButton: {
    paddingLeft: 12,
  },
  phoneCountryPicker: {
    paddingRight: 8,
  },
  phoneHint: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  phoneInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  phoneInfoIcon: {
    fontSize: 20,
  },
  phoneInfoText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
  signInButton: {
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
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 15,
    color: '#64748B',
  },
  footerLink: {
    fontSize: 15,
    color: '#3B82F6',
    fontWeight: '700',
  },
});

export default SignInScreen;