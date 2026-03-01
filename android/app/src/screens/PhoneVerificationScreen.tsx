import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { authService } from '../services/authService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PhoneVerification'>;
  route: {
    params: {
      phoneNumber: string;
      confirmation: any;
      isSignUp?: boolean;
    };
  };
};

const PhoneVerificationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { phoneNumber, confirmation, isSignUp = true } = route.params;
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(true);
  const [countdown, setCountdown] = useState(60);
  
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  // Countdown timer for resend button
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setResendDisabled(false);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Auto-focus first input on mount
  useEffect(() => {
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 500);
  }, []);

  const handleCodeChange = (text: string, index: number) => {
    // Only allow numbers
    if (text && !/^\d+$/.test(text)) return;

    const newCode = [...code];
    
    // Handle paste of full code
    if (text.length === 6) {
      const digits = text.split('').slice(0, 6);
      digits.forEach((digit, idx) => {
        newCode[idx] = digit;
      });
      setCode(newCode);
      inputRefs.current[5]?.focus();
      return;
    }

    // Handle single digit input
    newCode[index] = text;
    setCode(newCode);

    // Auto-focus next input
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const shakeInputs = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleVerifyCode = async () => {
    const fullCode = code.join('');
    
    if (fullCode.length !== 6) {
      Alert.alert('Incomplete Code', 'Please enter all 6 digits');
      shakeInputs();
      return;
    }

    setLoading(true);
    try {
      const result = await authService.verifyPhoneCode(confirmation, fullCode);

      if (result && result.success) {
        if (isSignUp) {
          Alert.alert(
            'Phone Verified! ✅',
            'Your phone number has been verified. Let\'s complete your profile.',
            [
              {
                text: 'Continue',
                onPress: () => {
                  // Navigate to profile details
                  navigation.reset({
                    index: 0,
                    routes: [
                      { 
                        name: 'ProfileDetails', 
                        params: { userId: result.userId } 
                      }
                    ],
                  });
                },
              },
            ]
          );
        } else {
          Alert.alert(
            'Success! ✅',
            'Signed in successfully!',
            [
              {
                text: 'OK',
                onPress: () => {
                  // Navigation handled by RootNavigator
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Home' }],
                  });
                },
              },
            ]
          );
        }
      } else {
        Alert.alert('Verification Failed', result?.error || 'Invalid code');
        // Clear code and shake
        setCode(['', '', '', '', '', '']);
        shakeInputs();
        inputRefs.current[0]?.focus();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to verify code');
      setCode(['', '', '', '', '', '']);
      shakeInputs();
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendDisabled) return;

    setLoading(true);
    try {
      const result = isSignUp 
        ? await authService.signUpWithPhone(phoneNumber)
        : await authService.signInWithPhone(phoneNumber);

      if (result && result.success) {
        // Update confirmation for the new code
        navigation.setParams({ 
          confirmation: result.confirmation 
        } as any);
        
        Alert.alert('Code Resent!', 'A new verification code has been sent to your phone.');
        setCountdown(60);
        setResendDisabled(true);
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        Alert.alert('Error', result?.error || 'Failed to resend code');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    Alert.alert(
      'Cancel Verification?',
      'Are you sure you want to go back? You\'ll need to enter your phone number again.',
      [
        { text: 'Stay', style: 'cancel' },
        { 
          text: 'Go Back', 
          style: 'destructive',
          onPress: () => navigation.goBack() 
        },
      ]
    );
  };

  const formatPhoneNumber = (phone: string) => {
    // Format +639123456789 to +63 912 345 6789
    if (phone.startsWith('+63')) {
      return `+63 ${phone.slice(3, 6)} ${phone.slice(6, 9)} ${phone.slice(9)}`;
    }
    return phone;
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
            {/* Back Button */}
            <TouchableOpacity 
              onPress={handleBack}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>

            {/* Icon */}
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <Text style={styles.icon}>📱</Text>
              </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>Enter Verification Code</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit code to
            </Text>
            <View style={styles.phoneBadge}>
              <Text style={styles.phoneText}>{formatPhoneNumber(phoneNumber)}</Text>
            </View>

            {/* Instruction */}
            <View style={styles.instructionCard}>
              <Text style={styles.instructionText}>
                Enter the verification code sent to your phone number via SMS.
              </Text>
            </View>

            {/* Code Input */}
            <Animated.View 
              style={[
                styles.codeContainer,
                { transform: [{ translateX: shakeAnimation }] }
              ]}
            >
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  style={[
                    styles.codeInput,
                    digit ? styles.codeInputFilled : {},
                  ]}
                  value={digit}
                  onChangeText={(text) => handleCodeChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  editable={!loading}
                />
              ))}
            </Animated.View>

            {/* Auto-verify hint */}
            <Text style={styles.autoHint}>
              Code will be verified automatically when complete
            </Text>

            {/* Verify Button */}
            <TouchableOpacity
              style={[
                styles.verifyButton,
                (loading || code.join('').length !== 6) && styles.buttonDisabled
              ]}
              onPress={handleVerifyCode}
              disabled={loading || code.join('').length !== 6}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.verifyButtonText}>Verify & Continue</Text>
              )}
            </TouchableOpacity>

            {/* Resend Section */}
            <View style={styles.resendSection}>
              <Text style={styles.resendText}>Didn't receive the code?</Text>
              <TouchableOpacity
                onPress={handleResendCode}
                disabled={resendDisabled || loading}
                style={styles.resendButton}
              >
                <Text style={[
                  styles.resendButtonText,
                  (resendDisabled || loading) && styles.resendButtonDisabled
                ]}>
                  {resendDisabled 
                    ? `Resend in ${countdown}s` 
                    : 'Resend Code'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Help Card */}
            <View style={styles.helpCard}>
              <Text style={styles.helpTitle}>💡 Troubleshooting</Text>
              <Text style={styles.helpText}>
                • Check your messages for the code{'\n'}
                • Make sure the phone number is correct{'\n'}
                • Wait up to 1 minute for the SMS{'\n'}
                • Check if your phone has signal{'\n'}
                • Try resending the code
              </Text>
            </View>

            {/* Code expires notice */}
            <View style={styles.expiryNotice}>
              <Text style={styles.expiryIcon}>⏱️</Text>
              <Text style={styles.expiryText}>
                Code expires in 10 minutes
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
    paddingTop: 20,
    paddingBottom: 32,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
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
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 12,
    letterSpacing: -1,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 12,
  },
  phoneBadge: {
    alignSelf: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 32,
  },
  phoneText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B82F6',
    letterSpacing: 1,
  },
  instructionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  instructionText: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
    textAlign: 'center',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
  codeInputFilled: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  autoHint: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  verifyButton: {
    backgroundColor: '#10B981',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  resendSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  resendText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendButtonText: {
    fontSize: 15,
    color: '#3B82F6',
    fontWeight: '700',
  },
  resendButtonDisabled: {
    color: '#94A3B8',
  },
  helpCard: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
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
  expiryNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  expiryIcon: {
    fontSize: 16,
  },
  expiryText: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '600',
  },
});

export default PhoneVerificationScreen;