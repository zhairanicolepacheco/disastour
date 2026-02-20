import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { Platform, PermissionsAndroid } from 'react-native';
import firestore from '@react-native-firebase/firestore';

class NotificationService {
  // Request notification permission (Android 13+)
  async requestPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    // Android 13+ requires runtime permission
    if (Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    
    // Android 12 and below - notifications are allowed by default
    return true;
  }

  // Get FCM token and save to Firestore
  async getFCMToken(userId: string): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      console.log('FCM Token:', token);
      
      // Save token to Firestore - use set with merge to create if doesn't exist
      await firestore()
        .collection('users')
        .doc(userId)
        .set({
          fcmToken: token,
          lastTokenUpdate: firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  // Create notification channels (Android only)
  async createNotificationChannels() {
    await notifee.createChannel({
      id: 'default',
      name: 'Default Notifications',
      importance: AndroidImportance.HIGH,
      sound: 'default',
    });

    await notifee.createChannel({
      id: 'emergency',
      name: 'Emergency Alerts',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
      vibrationPattern: [300, 500, 300, 500],
    });

    await notifee.createChannel({
      id: 'checkin',
      name: 'Check-in Updates',
      importance: AndroidImportance.DEFAULT,
    });

    await notifee.createChannel({
      id: 'requests',
      name: 'Friend & Family Requests',
      importance: AndroidImportance.DEFAULT,
    });
  }

  // Display local notification
  async displayNotification(
    title: string,
    body: string,
    data?: any,
    channelId: 'default' | 'emergency' | 'checkin' | 'requests' = 'default'
  ) {
    try {
      await notifee.displayNotification({
        title,
        body,
        data,
        android: {
          channelId,
          importance: channelId === 'emergency' ? AndroidImportance.HIGH : AndroidImportance.DEFAULT,
          pressAction: {
            id: 'default',
            launchActivity: 'default',
          },
          smallIcon: 'ic_launcher',
          color: '#3B82F6',
        },
      });
    } catch (error) {
      console.error('Error displaying notification:', error);
    }
  }

  // Handle foreground messages
  setupForegroundHandler() {
    return messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground notification received:', remoteMessage);

      const { title, body } = remoteMessage.notification || {};
      const data = remoteMessage.data;

      if (title && body) {
        await this.displayNotification(
          title,
          body,
          data,
          (data?.type as any) || 'default'
        );
      }
    });
  }

  // Handle background/quit state messages
  setupBackgroundHandler() {
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Background notification received:', remoteMessage);
      
      const { title, body } = remoteMessage.notification || {};
      const data = remoteMessage.data;

      if (title && body) {
        await this.displayNotification(
          title,
          body,
          data,
          (data?.type as any) || 'default'
        );
      }
    });
  }

  // Handle notification tap
  setupNotificationOpenedHandler(navigation: any) {
    // When app is in background
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification opened app from background:', remoteMessage);
      
      const data = remoteMessage.data;
      if (data?.screen) {
        navigation.navigate(data.screen);
      }
    });

    // When app was closed/quit
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('Notification opened app from quit state:', remoteMessage);
          
          const data = remoteMessage.data;
          if (data?.screen) {
            setTimeout(() => {
              navigation.navigate(data.screen);
            }, 1000);
          }
        }
      });
  }

  // Initialize everything
  async initialize(userId: string, navigation?: any) {
    console.log('Initializing notification service...');

    // Request permission
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      console.log('Notification permission denied');
      return false;
    }

    // Create channels
    await this.createNotificationChannels();

    // Get and save FCM token
    await this.getFCMToken(userId);

    // Setup handlers
    this.setupForegroundHandler();
    this.setupBackgroundHandler();
    
    if (navigation) {
      this.setupNotificationOpenedHandler(navigation);
    }

    // Listen for token refresh
    messaging().onTokenRefresh((token) => {
      console.log('FCM token refreshed:', token);
      firestore()
        .collection('users')
        .doc(userId)
        .set({
          fcmToken: token,
          lastTokenUpdate: firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
    });

    console.log('Notification service initialized successfully');
    return true;
  }

  // Send test notification
  async sendTestNotification() {
    await this.displayNotification(
      'Test Notification',
      'This is a test notification from Disastour',
      { type: 'test' },
      'default'
    );
  }
}

export default new NotificationService();