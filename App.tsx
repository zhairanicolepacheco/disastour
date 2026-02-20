import React, { useEffect } from 'react';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './android/app/src/navigation/RootNavigator';
import notificationService from './android/app/src/services/notificationService';

export default function App() {
    useEffect(() => {
    const auth = getAuth();
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.emailVerified) {
        // Initialize notifications when user is logged in
        await notificationService.initialize(user.uid);
      }
    });

    return unsubscribe;
  }, []);
  
  return (
    <SafeAreaProvider>
      <RootNavigator />
    </SafeAreaProvider>
  );
}