import AsyncStorage from '@react-native-async-storage/async-storage';

interface CachedLocation {
  id: string;  // Added to match LocationUser
  userId: string;
  name: string;
  location: string;
  type: 'family' | 'friend';
  latitude: number;
  longitude: number;
  avatar: string;
  lastUpdated: number; // timestamp
}

interface CachedUserData {
  locations: CachedLocation[];
  lastSync: number;
}

class OfflineStorageService {
  private LOCATION_KEY = '@disastour_cached_locations';
  private USER_PROFILE_KEY = '@disastour_user_profile';
  private LAST_SYNC_KEY = '@disastour_last_sync';

  // Save user locations to cache
  async cacheUserLocations(locations: CachedLocation[]): Promise<void> {
    try {
      const data: CachedUserData = {
        locations,
        lastSync: Date.now(),
      };
      await AsyncStorage.setItem(this.LOCATION_KEY, JSON.stringify(data));
      console.log('✅ Cached', locations.length, 'user locations');
    } catch (error) {
      console.error('❌ Error caching locations:', error);
    }
  }

  // Get cached locations
  async getCachedLocations(): Promise<CachedLocation[]> {
    try {
      const data = await AsyncStorage.getItem(this.LOCATION_KEY);
      if (data) {
        const parsed: CachedUserData = JSON.parse(data);
        console.log('✅ Retrieved', parsed.locations.length, 'cached locations');
        return parsed.locations;
      }
      return [];
    } catch (error) {
      console.error('❌ Error retrieving cached locations:', error);
      return [];
    }
  }

  // Get last sync time
  async getLastSyncTime(): Promise<number | null> {
    try {
      const data = await AsyncStorage.getItem(this.LOCATION_KEY);
      if (data) {
        const parsed: CachedUserData = JSON.parse(data);
        return parsed.lastSync;
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting last sync time:', error);
      return null;
    }
  }

  // Cache user profile
  async cacheUserProfile(profile: any): Promise<void> {
    try {
      await AsyncStorage.setItem(this.USER_PROFILE_KEY, JSON.stringify(profile));
      console.log('✅ Cached user profile');
    } catch (error) {
      console.error('❌ Error caching profile:', error);
    }
  }

  // Get cached user profile
  async getCachedUserProfile(): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(this.USER_PROFILE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('❌ Error retrieving cached profile:', error);
      return null;
    }
  }

  // Clear all cache
  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.LOCATION_KEY,
        this.USER_PROFILE_KEY,
        this.LAST_SYNC_KEY,
      ]);
      console.log('✅ Cache cleared');
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
    }
  }
}

export const offlineStorage = new OfflineStorageService();