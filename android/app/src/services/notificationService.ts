import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { Platform, PermissionsAndroid } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import Sound from 'react-native-sound';

type SoundType = 'safe' | 'warning' | 'danger' | 'general';

class NotificationService {
  private sounds: Map<SoundType, Sound> = new Map();

  constructor() {
    this.initializeSounds();
  }

  // Initialize all notification sounds
  private initializeSounds() {
    Sound.setCategory('Playback');

    this.loadSound('safe', 'safe_checkin.mp3');

    this.loadSound('warning', 'warning_checkin.mp3');

    this.loadSound('danger', 'danger_checkin.mp3');

    this.loadSound('general', 'general_notification.mp3');
  }

  // Load individual sound
  private loadSound(type: SoundType, filename: string) {
    const sound = new Sound(
      filename,
      Sound.MAIN_BUNDLE,
      (error) => {
        if (error) {
          console.log(`Failed to load ${type} sound:`, error);
          return;
        }
        console.log(`${type} sound loaded successfully`);
      }
    );
    this.sounds.set(type, sound);
  }

  // Play specific sound based on type
  playSoundForType(type: SoundType) {
    const sound = this.sounds.get(type);
    if (sound) {
      sound.setVolume(1.0);
      sound.play((success) => {
        if (!success) {
          console.log(`Failed to play ${type} sound`);
        } else {
          console.log(`Playing ${type} sound`);
        }
      });
    } else {
      console.log(`Sound for ${type} not found`);
    }
  }

  // Stop all sounds
  stopAllSounds() {
    this.sounds.forEach((sound, type) => {
      sound.stop();
    });
  }

  async requestPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        // Request notification permission for Android 13+
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            console.log('Notification permission denied');
            return false;
          }
        }
      }

      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Authorization status:', authStatus);
      }

      return enabled;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  async initialize(userId: string) {
    try {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.log('Notification permission not granted');
        return;
      }

      // Get FCM token
      const token = await messaging().getToken();
      console.log('FCM Token:', token);

      // Save token to Firestore
      await firestore()
        .collection('users')
        .doc(userId)
        .update({
          fcmToken: token,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

      // Create notification channels for Android
      await this.createNotificationChannels();

      // Handle foreground notifications
      this.setupForegroundHandler();

      // Handle background notifications
      this.setupBackgroundHandler();

      // Handle notification opened app
      this.setupNotificationOpenedHandler();

      console.log('Notification service initialized');
    } catch (error) {
      console.error('Error initializing notification service:', error);
    }
  }

  private async createNotificationChannels() {
    if (Platform.OS === 'android') {
      await notifee.createChannel({
        id: 'general',
        name: 'General Notifications',
        importance: AndroidImportance.DEFAULT,
        sound: 'general_notification',
      });

      await notifee.createChannel({
        id: 'safe',
        name: 'Safe Check-ins',
        importance: AndroidImportance.DEFAULT,
        sound: 'safe_checkin',
      });

      await notifee.createChannel({
        id: 'warning',
        name: 'Warning Alerts',
        importance: AndroidImportance.HIGH,
        sound: 'warning_checkin',
      });

      await notifee.createChannel({
        id: 'danger',
        name: 'Emergency Alerts',
        importance: AndroidImportance.HIGH,
        sound: 'danger_checkin',
      });

      console.log('Notification channels created');
    }
  }

  private setupForegroundHandler() {
    messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground notification:', remoteMessage);

      const notifType = remoteMessage.data?.type || 'general';
      const status = remoteMessage.data?.status;

      let soundType: SoundType = 'general';
      let channelId = 'general';

      if (notifType === 'checkin') {
        if (status === 'safe') {
          soundType = 'safe';
          channelId = 'safe';
        } else if (status === 'warning') {
          soundType = 'warning';
          channelId = 'warning';
        } else if (status === 'danger') {
          soundType = 'danger';
          channelId = 'danger';
        }
      }

      this.playSoundForType(soundType);

      await notifee.displayNotification({
        title: remoteMessage.notification?.title || 'New Notification',
        body: remoteMessage.notification?.body || '',
        android: {
          channelId: channelId,
          importance: channelId === 'danger' || channelId === 'warning' 
            ? AndroidImportance.HIGH 
            : AndroidImportance.DEFAULT,
          sound: this.getSoundFileName(soundType),
          pressAction: {
            id: 'default',
          },
          largeIcon: remoteMessage.notification?.android?.imageUrl,
        },
        ios: {
          sound: `${this.getSoundFileName(soundType)}.mp3`,
          foregroundPresentationOptions: {
            alert: true,
            badge: true,
            sound: true,
          },
        },
      });
    });
  }

  private setupBackgroundHandler() {
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Background notification:', remoteMessage);

      const notifType = remoteMessage.data?.type || 'general';
      const status = remoteMessage.data?.status;

      let soundType: SoundType = 'general';
      let channelId = 'general';

      if (notifType === 'checkin') {
        if (status === 'safe') {
          soundType = 'safe';
          channelId = 'safe';
        } else if (status === 'warning') {
          soundType = 'warning';
          channelId = 'warning';
        } else if (status === 'danger') {
          soundType = 'danger';
          channelId = 'danger';
        }
      }

      await notifee.displayNotification({
        title: remoteMessage.notification?.title || 'New Notification',
        body: remoteMessage.notification?.body || '',
        android: {
          channelId: channelId,
          importance: channelId === 'danger' || channelId === 'warning' 
            ? AndroidImportance.HIGH 
            : AndroidImportance.DEFAULT,
          sound: this.getSoundFileName(soundType),
          pressAction: {
            id: 'default',
          },
        },
        ios: {
          sound: `${this.getSoundFileName(soundType)}.mp3`,
        },
      });
    });
  }

  private setupNotificationOpenedHandler() {
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('Notification opened app from quit state:', remoteMessage);
        }
      });

    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification opened app from background:', remoteMessage);
    });

    notifee.onBackgroundEvent(async ({ type, detail }) => {
      if (type === EventType.PRESS) {
        console.log('Notifee notification pressed:', detail.notification);
      }
    });
  }

  private getSoundFileName(type: SoundType): string {
    const soundMap = {
      safe: 'safe_checkin',
      warning: 'warning_checkin',
      danger: 'danger_checkin',
      general: 'general_notification',
    };
    return soundMap[type];
  }

  async sendLocalNotification(
    title: string,
    body: string,
    type: 'general' | 'checkin',
    status?: 'safe' | 'warning' | 'danger',
    data?: any
  ) {
    try {
      let soundType: SoundType = 'general';
      let channelId = 'general';

      if (type === 'checkin' && status) {
        soundType = status;
        channelId = status;
      }

      this.playSoundForType(soundType);

      await notifee.displayNotification({
        title,
        body,
        data,
        android: {
          channelId: channelId,
          importance: channelId === 'danger' || channelId === 'warning'
            ? AndroidImportance.HIGH
            : AndroidImportance.DEFAULT,
          sound: this.getSoundFileName(soundType),
          pressAction: {
            id: 'default',
          },
        },
        ios: {
          sound: `${this.getSoundFileName(soundType)}.mp3`,
          foregroundPresentationOptions: {
            alert: true,
            badge: true,
            sound: true,
          },
        },
      });
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  }

  // Specific notification methods
  async sendSafeCheckIn(userName: string, location?: string) {
    await this.sendLocalNotification(
      '✅ Safe Check-In',
      `${userName} marked themselves as safe${location ? ` at ${location}` : ''}`,
      'checkin',
      'safe',
      { type: 'checkin', status: 'safe' }
    );
  }

  async sendWarningCheckIn(userName: string, location?: string) {
    await this.sendLocalNotification(
      '⚠️ Warning Alert',
      `${userName} needs assistance${location ? ` at ${location}` : ''}`,
      'checkin',
      'warning',
      { type: 'checkin', status: 'warning' }
    );
  }

  async sendDangerCheckIn(userName: string, location?: string) {
    await this.sendLocalNotification(
      '🆘 EMERGENCY!',
      `${userName} is in danger${location ? ` at ${location}` : ''}. Call emergency services!`,
      'checkin',
      'danger',
      { type: 'checkin', status: 'danger' }
    );
  }

  async sendFriendRequest(userName: string) {
    await this.sendLocalNotification(
      '👥 Friend Request',
      `${userName} wants to add you as a friend`,
      'general',
      undefined,
      { type: 'friend_request' }
    );
  }

  async sendFamilyRequest(userName: string, relationship: string) {
    await this.sendLocalNotification(
      '👨‍👩‍👧‍👦 Family Request',
      `${userName} wants to add you as their ${relationship}`,
      'general',
      undefined,
      { type: 'family_request' }
    );
  }

  async sendRequestAccepted(userName: string, type: 'friend' | 'family') {
    await this.sendLocalNotification(
      type === 'friend' ? '✅ Friend Added' : '✅ Family Added',
      `${userName} accepted your request`,
      'general',
      undefined,
      { type: `${type}_accepted` }
    );
  }

  async sendLocationUpdate(userName: string, location: string) {
    await this.sendLocalNotification(
      '📍 Location Update',
      `${userName} shared their location at ${location}`,
      'general',
      undefined,
      { type: 'location' }
    );
  }

  async sendGeneralNotification(title: string, message: string) {
    await this.sendLocalNotification(
      title,
      message,
      'general',
      undefined,
      { type: 'general' }
    );
  }

  // Test methods
  async sendTestSafeNotification() {
    await this.sendSafeCheckIn('Test User', 'Test Location');
  }

  async sendTestWarningNotification() {
    await this.sendWarningCheckIn('Test User', 'Test Location');
  }

  async sendTestDangerNotification() {
    await this.sendDangerCheckIn('Test User', 'Test Location');
  }

  async sendTestGeneralNotification() {
    await this.sendGeneralNotification('🧪 Test Notification', 'This is a test general notification');
  }

  // Clean up
  destroy() {
    this.sounds.forEach((sound, type) => {
      sound.release();
    });
    this.sounds.clear();
  }
}

export default new NotificationService();