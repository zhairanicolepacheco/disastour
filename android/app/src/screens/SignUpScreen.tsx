import React, { useState, useEffect } from 'react';
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
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getAuth } from '@react-native-firebase/auth';
import PhoneInput from 'react-native-phone-number-input';
import { RootStackParamList } from '../navigation/RootNavigator';
import { authService } from '../services/authService';
import { colors } from '../config/colors';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SignUp'>;
};

type AuthMethod = 'email' | 'phone';

const SignUpScreen: React.FC<Props> = ({ navigation }) => {
  // Tab state
  const [authMethod, setAuthMethod] = useState<AuthMethod>('email');

  // Email states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Phone states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');
  const [phoneValid, setPhoneValid] = useState(false);
  
  // Common states
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [checkingNow, setCheckingNow] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Email verification polling
  useEffect(() => {
    if (!emailSent) return;

    let intervalId: ReturnType<typeof setInterval>;
    let attempts = 0;
    const maxAttempts = 120;

    const checkVerification = async () => {
      try {
        attempts++;
        console.log(`🔄 Checking verification (attempt ${attempts})...`);

        const result = await authService.checkEmailVerified();
        
        if (result.verified) {
          console.log('✅ EMAIL VERIFIED!');
          
          if (intervalId) clearInterval(intervalId);
          
          const authInstance = getAuth();
          const currentUser = authInstance.currentUser;
          
          if (currentUser) {
            Alert.alert(
              'Email Verified! ✅',
              'Your email has been verified successfully. Please wait while we redirect you...',
              [{ text: 'OK' }]
            );

            setTimeout(async () => {
              try {
                await authService.signOut();
                const signInResult = await authService.signIn(
                  currentUser.email || email,
                  password
                );
                
                if (!signInResult.success) {
                  Alert.alert(
                    'Success!',
                    'Your email is verified! Please sign in to continue.',
                    [
                      {
                        text: 'Sign In',
                        onPress: () => navigation.navigate('SignIn'),
                      },
                    ]
                  );
                }
              } catch (error) {
                console.error('Error during sign-in after verification:', error);
                Alert.alert(
                  'Success!',
                  'Your email is verified! Please sign in to continue.',
                  [
                    {
                      text: 'Sign In',
                      onPress: () => navigation.navigate('SignIn'),
                    },
                  ]
                );
              }
            }, 1000);
          }
        } else if (attempts >= maxAttempts) {
          console.log('⏱️ Max attempts reached');
          if (intervalId) clearInterval(intervalId);
        }
      } catch (error) {
        console.error('Error checking verification:', error);
      }
    };

    setTimeout(checkVerification, 2000);
    intervalId = setInterval(checkVerification, 3000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [emailSent, email, password, navigation]);

  // Email validation
  const validateEmailInputs = () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return false;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter a password');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
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

  // Email signup
  const handleEmailSignUp = async () => {
    if (!validateEmailInputs()) return;

    setLoading(true);
    const result = await authService.signUp(email, password);

    if (result && result.success) {
      setEmailSent(true);
      Alert.alert(
        'Success',
        'Verification email sent! Please check your inbox and click the verification link.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Sign Up Failed', result?.error || 'An error occurred');
    }
    setLoading(false);
  };

  // Phone signup - send code and navigate to verification screen
  const handlePhoneSendCode = async () => {
    if (!validatePhoneInputs()) return;

    setLoading(true);
    console.log('📱 Sending code to:', formattedPhone);
    
    const result = await authService.signUpWithPhone(formattedPhone);

    if (result && result.success) {
      setLoading(false);
      navigation.navigate('PhoneVerification', {
        phoneNumber: formattedPhone,
        confirmation: result.confirmation,
        isSignUp: true,
      });
    } else {
      setLoading(false);
      Alert.alert('Error', result?.error || 'Failed to send verification code');
    }
  };

  // Resend email
  const handleResendEmail = async () => {
    setLoading(true);
    const result = await authService.resendVerificationEmail();
    if (result && result.success) {
      Alert.alert('Success', 'Verification email resent! Please check your inbox.');
    } else {
      Alert.alert('Error', result?.error || 'An error occurred');
    }
    setLoading(false);
  };

  // Manual check email
  const handleManualCheck = async () => {
    setCheckingNow(true);
    try {
      const result = await authService.checkEmailVerified();
      
      if (result.verified) {
        const authInstance = getAuth();
        const currentUser = authInstance.currentUser;
        
        Alert.alert(
          'Email Verified! ✅',
          'Your email has been verified successfully. Signing you in...',
          [{ text: 'OK' }]
        );

        setTimeout(async () => {
          try {
            await authService.signOut();
            const signInResult = await authService.signIn(
              currentUser?.email || email,
              password
            );
            
            if (!signInResult.success) {
              Alert.alert(
                'Success!',
                'Your email is verified! Please sign in to continue.',
                [
                  {
                    text: 'Sign In',
                    onPress: () => navigation.navigate('SignIn'),
                  },
                ]
              );
            }
          } catch (error) {
            Alert.alert(
              'Success!',
              'Your email is verified! Please sign in to continue.',
              [
                {
                  text: 'Sign In',
                  onPress: () => navigation.navigate('SignIn'),
                },
              ]
            );
          }
        }, 500);
      } else {
        Alert.alert(
          'Not Verified Yet',
          'Your email is not verified yet. Please check your inbox and spam folder.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to check verification status');
    } finally {
      setCheckingNow(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await handleManualCheck();
    setRefreshing(false);
  };

  // Render email verification screen
  if (emailSent) {
    const authInstance = getAuth();
    const currentUser = authInstance.currentUser;
    const displayEmail = currentUser?.email || email;

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#3B82F6']}
              tintColor="#3B82F6"
            />
          }
        >
          <View style={styles.content}>
            <TouchableOpacity 
              onPress={() => {
                setEmailSent(false);
                setEmail('');
                setPassword('');
                setConfirmPassword('');
              }}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>

            <View style={styles.verificationSection}>
              <View style={styles.iconContainer}>
                <View style={styles.iconCircle}>
                  <Text style={styles.icon}>📧</Text>
                </View>
              </View>
              
              <Text style={styles.verificationTitle}>Check Your Email</Text>
              <Text style={styles.verificationSubtitle}>
                We sent a verification link to
              </Text>
              <View style={styles.emailBadge}>
                <Text style={styles.emailText}>{displayEmail}</Text>
              </View>

              <View style={styles.instructionCard}>
                <Text style={styles.instructionText}>
                  Click the link in your email to verify your account. Once verified, you'll automatically be signed in.
                </Text>
              </View>

              <View style={styles.steps}>
                <Step number="1" text="Check your email inbox (and spam folder)" />
                <Step number="2" text="Click the verification link" />
                <Step number="3" text="Wait for automatic sign-in" />
              </View>

              <TouchableOpacity
                style={styles.checkButton}
                onPress={handleManualCheck}
                disabled={checkingNow}
              >
                {checkingNow ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.checkButtonText}>Check Verification Status</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleResendEmail}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#3B82F6" />
                ) : (
                  <>
                    <Text style={styles.resendButtonIcon}>📨</Text>
                    <Text style={styles.resendButtonText}>Resend Verification Email</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.helpCard}>
                <Text style={styles.helpTitle}>💡 Didn't receive the email?</Text>
                <Text style={styles.helpText}>
                  • Check your spam/junk folder{'\n'}
                  • Make sure the email address is correct{'\n'}
                  • Click "Resend" to get a new email{'\n'}
                  • Wait a few minutes and check again
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Main signup screen with tabs
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
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Get started with Disastour</Text>
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
                    placeholder="At least 6 characters"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    editable={!loading}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Re-enter your password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    editable={!loading}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.signUpButton, loading && styles.buttonDisabled]}
                  onPress={handleEmailSignUp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.signUpButtonText}>Create Account with Email</Text>
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
                    styles.signUpButton, 
                    (loading || !phoneValid) && styles.buttonDisabled
                  ]}
                  onPress={handlePhoneSendCode}
                  disabled={loading || !phoneValid}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.signUpButtonText}>Send Verification Code</Text>
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
              <Text style={styles.footerText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const Step: React.FC<{ number: string; text: string }> = ({ number, text }) => (
  <View style={styles.step}>
    <View style={styles.stepNumber}>
      <Text style={styles.stepNumberText}>{number}</Text>
    </View>
    <Text style={styles.stepText}>{text}</Text>
  </View>
);

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
    paddingTop: 0,
    paddingBottom: 32,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 32,
    zIndex: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
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
  signUpButton: {
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
  signUpButtonText: {
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
  // Email verification screen
  verificationSection: {
    alignItems: 'center',
    paddingTop: 40,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  icon: {
    fontSize: 40,
  },
  verificationTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 8,
    letterSpacing: -1,
  },
  verificationSubtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 12,
  },
  emailBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 32,
  },
  emailText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  instructionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '100%',
  },
  instructionText: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
    textAlign: 'center',
  },
  steps: {
    width: '100%',
    gap: 16,
    marginBottom: 24,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: '#334155',
    fontWeight: '500',
  },
  checkButton: {
    backgroundColor: '#10B981',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  checkButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  resendButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  resendButtonIcon: {
    fontSize: 16,
  },
  resendButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '700',
  },
  helpCard: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  helpTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 12,
  },
  helpText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 22,
  },
});

export default SignUpScreen;