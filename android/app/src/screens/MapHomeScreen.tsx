import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  PermissionsAndroid,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE, Circle, Polyline } from 'react-native-maps';
import MapClusteringView from 'react-native-map-clustering';
import Geolocation from '@react-native-community/geolocation';
import { getAuth } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { colors } from '../config/colors';
import { offlineStorage } from '../services/offlineStorage';

// Import modals
import AddContactModal from '../components/modals/AddContactModal';
import AddFamilyModal, { FamilyMemberData } from '../components/modals/AddFamilyModal';
import AddFriendModal, { FriendData } from '../components/modals/AddFriendModal';
import EvacuationCenterModal, { EvacuationCenter } from '../components/modals/EvacuationCenterModal';

type FilterType = 'all' | 'family' | 'friends' | 'evacuation';

interface LocationUser {
  id: string;
  name: string;
  location: string;
  type: 'family' | 'friend';
  latitude: number;
  longitude: number;
  avatar: string;
}

interface RiskArea {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  riskLevel: 'high' | 'medium' | 'low';
  disasterType: 'flood' | 'earthquake' | 'fire';
  temperature?: number;
  humidity?: number;
  lastUpdated?: string;
}

// Silang, Cavite Center (covers whole municipality)
const SILANG_CAVITE = {
  latitude: 14.2167,
  longitude: 120.9833,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

const MapHomeScreen = ({ navigation }: any) => {
  const authInstance = getAuth();
  const user = authInstance.currentUser;
  const mapRef = useRef<MapView>(null);

  // State hooks
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState<EvacuationCenter | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [showingRoute, setShowingRoute] = useState(false);
  const [locationUsers, setLocationUsers] = useState<LocationUser[]>([]);
  
  // Offline mode state
  const [isOnline, setIsOnline] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [showOfflineNotice, setShowOfflineNotice] = useState(false);

  useEffect(() => {
    requestLocationPermission();
    
    // Update location every 30 seconds (only when online)
    const locationInterval = setInterval(() => {
      if (isOnline) {
        getCurrentLocation();
      }
    }, 30000);

    return () => {
      clearInterval(locationInterval);
    };
  }, [isOnline]);

  useEffect(() => {
    // Network status listener
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = (state.isConnected && state.isInternetReachable) ?? false;
      setIsOnline(online);
      
      if (!online) {
        setShowOfflineNotice(true);
        loadCachedData();
      } else {
        setShowOfflineNotice(false);
      }
    });

    // Load last sync time
    loadLastSyncTime();

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.uid || !isOnline) {
      if (!isOnline) {
        loadCachedData();
      }
      return;
    }

    const unsubscribers: (() => void)[] = [];

    // Fetch family members
    const familyUnsubscribe = firestore()
      .collection('family')
      .doc(user.uid)
      .collection('userFamily')
      .onSnapshot(
        (snapshot) => {
          snapshot.docs.forEach((doc) => {
            const familyData = doc.data();
            const familyUserId = doc.id;

            const locationUnsubscribe = firestore()
              .collection('user_locations')
              .doc(familyUserId)
              .onSnapshot(
                (locationDoc) => {
                  if (locationDoc.exists()) {
                    const locationData = locationDoc.data();
                    if (locationData?.latitude && locationData?.longitude) {
                      setLocationUsers((prev) => {
                        const filtered = prev.filter((u) => u.id !== familyUserId);
                        return [
                          ...filtered,
                          {
                            id: familyUserId,
                            name: familyData.nickname || familyData.userName || 'Family Member',
                            location: locationData.address || 'Unknown location',
                            type: 'family',
                            latitude: locationData.latitude,
                            longitude: locationData.longitude,
                            avatar: '👤',
                          },
                        ];
                      });
                    }
                  } else {
                    setLocationUsers((prev) => prev.filter((u) => u.id !== familyUserId));
                  }
                },
                (error) => {
                  console.error('Error fetching family location:', error);
                }
              );

            unsubscribers.push(locationUnsubscribe);
          });
        },
        (error) => {
          console.error('Error fetching family members:', error);
        }
      );

    unsubscribers.push(familyUnsubscribe);

    // Fetch friends
    const friendsUnsubscribe = firestore()
      .collection('friends')
      .doc(user.uid)
      .collection('userFriends')
      .onSnapshot(
        (snapshot) => {
          snapshot.docs.forEach((doc) => {
            const friendData = doc.data();
            const friendUserId = doc.id;

            const locationUnsubscribe = firestore()
              .collection('user_locations')
              .doc(friendUserId)
              .onSnapshot(
                (locationDoc) => {
                  if (locationDoc.exists()) {
                    const locationData = locationDoc.data();
                    if (locationData?.latitude && locationData?.longitude) {
                      setLocationUsers((prev) => {
                        const filtered = prev.filter((u) => u.id !== friendUserId);
                        return [
                          ...filtered,
                          {
                            id: friendUserId,
                            name: friendData.nickname || friendData.userName || 'Friend',
                            location: locationData.address || 'Unknown location',
                            type: 'friend',
                            latitude: locationData.latitude,
                            longitude: locationData.longitude,
                            avatar: '👤',
                          },
                        ];
                      });
                    }
                  } else {
                    setLocationUsers((prev) => prev.filter((u) => u.id !== friendUserId));
                  }
                },
                (error) => {
                  console.error('Error fetching friend location:', error);
                }
              );

            unsubscribers.push(locationUnsubscribe);
          });
        },
        (error) => {
          console.error('Error fetching friends:', error);
        }
      );

    unsubscribers.push(friendsUnsubscribe);

    // Periodically cache data while online
    const cacheInterval = setInterval(() => {
      cacheCurrentData();
    }, 60000);

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      clearInterval(cacheInterval);
      cacheCurrentData();
    };
  }, [user?.uid, isOnline]);

  const loadCachedData = async () => {
    try {
      const cachedLocations = await offlineStorage.getCachedLocations();
      if (cachedLocations.length > 0) {
        // Transform CachedLocation to LocationUser format
        const users = cachedLocations.map(cached => ({
          id: cached.id,
          name: cached.name,
          location: cached.location,
          type: cached.type,
          latitude: cached.latitude,
          longitude: cached.longitude,
          avatar: cached.avatar,
        }));
        setLocationUsers(users);
        console.log('✅ Loaded', users.length, 'cached locations');
      }
    } catch (error) {
      console.error('Error loading cached data:', error);
    }
  };

  const loadLastSyncTime = async () => {
    try {
      const timestamp = await offlineStorage.getLastSyncTime();
      if (timestamp) {
        setLastSyncTime(new Date(timestamp));
      }
    } catch (error) {
      console.error('Error loading last sync time:', error);
    }
  };

  const cacheCurrentData = async () => {
    try {
      if (locationUsers.length > 0) {
        // Transform LocationUser to CachedLocation format
        const cachedLocations = locationUsers.map(user => ({
          id: user.id,
          userId: user.id,
          name: user.name,
          location: user.location,
          type: user.type,
          latitude: user.latitude,
          longitude: user.longitude,
          avatar: user.avatar,
          lastUpdated: Date.now(),
        }));
        await offlineStorage.cacheUserLocations(cachedLocations);
      }
    } catch (error) {
      console.error('Error caching data:', error);
    }
  };

  const formatLastSync = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const OfflineBanner = () => (
    <View style={styles.offlineBanner}>
      <View style={styles.offlineBannerContent}>
        <Text style={styles.offlineIcon}>📡</Text>
        <View style={styles.offlineTextContainer}>
          <Text style={styles.offlineTitle}>Offline Mode</Text>
          <Text style={styles.offlineSubtitle}>
            Showing last known locations
            {lastSyncTime && ` • Last updated ${formatLastSync(lastSyncTime)}`}
          </Text>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.offlineButton}
        onPress={() => setShowOfflineNotice(false)}
      >
        <Text style={styles.offlineButtonText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'Disastour needs access to your location for emergency alerts',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getCurrentLocation();
        }
      } catch (err) {
        console.warn(err);
      }
    } else {
      getCurrentLocation();
    }
  };

  const getCurrentLocation = () => {
    if (!isOnline) return;

    Geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setUserLocation(newLocation);
        console.log('Location fetched:', newLocation);
        
        if (user?.uid) {
          firestore()
            .collection('user_locations')
            .doc(user.uid)
            .set({
              latitude: newLocation.latitude,
              longitude: newLocation.longitude,
              address: 'Silang, Cavite',
              updatedAt: firestore.FieldValue.serverTimestamp(),
            })
            .catch((error) => {
              console.error('Error updating location:', error);
            });
        }
      },
      (error) => {
        console.log('Location error:', error);
        Geolocation.getCurrentPosition(
          (position) => {
            const newLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            setUserLocation(newLocation);
            console.log('Location fetched (retry):', newLocation);
            
            if (user?.uid) {
              firestore()
                .collection('user_locations')
                .doc(user.uid)
                .set({
                  latitude: newLocation.latitude,
                  longitude: newLocation.longitude,
                  address: 'Silang, Cavite',
                  updatedAt: firestore.FieldValue.serverTimestamp(),
                })
                .catch((error) => {
                  console.error('Error updating location:', error);
                });
            }
          },
          (retryError) => {
            console.log('Location retry error:', retryError);
          },
          { enableHighAccuracy: false, timeout: 30000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 }
    );
  };

  const recenterMap = () => {
    if (showingRoute) {
      setShowingRoute(false);
      setRouteCoordinates([]);
      setTimeout(() => {
        mapRef.current?.animateToRegion(SILANG_CAVITE, 1000);
      }, 50);
    } else {
      mapRef.current?.animateToRegion(SILANG_CAVITE, 1000);
    }
  };

  const getDirections = async (destinationLat: number, destinationLng: number) => {
    if (!isOnline) {
      Alert.alert(
        'Offline Mode',
        'Turn-by-turn directions require internet connection. You can still view the location on the map.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!userLocation) {
      Geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setUserLocation(newLocation);
          fetchRoute(newLocation, destinationLat, destinationLng);
        },
        (error) => {
          console.log('Location error:', error);
          Alert.alert(
            'Location Error',
            'Could not get your location. Please enable location services and try again.',
            [{ text: 'OK' }]
          );
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
      return;
    }
    
    fetchRoute(userLocation, destinationLat, destinationLng);
  };

  const fetchRoute = async (
    origin: { latitude: number; longitude: number },
    destinationLat: number,
    destinationLng: number
  ) => {
    try {
      const apiKey = 'AIzaSyCv0rkk-slYFrm2obp30OUUurIanvZC--c';
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destinationLat},${destinationLng}&mode=driving&alternatives=false&key=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.routes && data.routes.length > 0) {
        const points = decodePolyline(data.routes[0].overview_polyline.points);
        setRouteCoordinates(points);
        setShowingRoute(true);
        
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(points, {
            edgePadding: { top: 120, right: 80, bottom: 200, left: 80 },
            animated: true,
          });
        }, 300);
      } else {
        console.error('Directions API error:', data.status, data.error_message);
        
        const fallbackPoints = [
          { latitude: origin.latitude, longitude: origin.longitude },
          { latitude: destinationLat, longitude: destinationLng },
        ];
        setRouteCoordinates(fallbackPoints);
        setShowingRoute(true);
        
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(fallbackPoints, {
            edgePadding: { top: 120, right: 80, bottom: 200, left: 80 },
            animated: true,
          });
        }, 300);
      }
    } catch (error) {
      console.error('Error fetching directions:', error);
      
      const fallbackPoints = [
        { latitude: origin.latitude, longitude: origin.longitude },
        { latitude: destinationLat, longitude: destinationLng },
      ];
      setRouteCoordinates(fallbackPoints);
      setShowingRoute(true);
      
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(fallbackPoints, {
          edgePadding: { top: 120, right: 80, bottom: 200, left: 80 },
          animated: true,
        });
      }, 300);
    }
  };

  const decodePolyline = (encoded: string) => {
    const points = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charAt(index++).charCodeAt(0) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charAt(index++).charCodeAt(0) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }
    return points;
  };

  const handleShowRoute = (center: EvacuationCenter) => {
    getDirections(center.latitude, center.longitude);
  };

  const refreshLocation = () => {
    if (!isOnline) {
      Alert.alert(
        'Offline Mode',
        'You are currently offline. Real-time location updates are not available. Showing last known locations from cache.',
        [{ text: 'OK' }]
      );
      return;
    }
    getCurrentLocation();
    Alert.alert('Refreshing Location', 'Getting your current location...');
  };

  const handleAddFamily = () => {
    setShowAddModal(false);
    setTimeout(() => setShowAddFamilyModal(true), 300);
  };

  const handleAddFriend = () => {
    setShowAddModal(false);
    setTimeout(() => setShowAddFriendModal(true), 300);
  };

  const handleFamilySubmit = (data: FamilyMemberData) => {
    console.log('Family member added:', data);
    Alert.alert('Success', `${data.nickname} has been added to your family contacts`);
    setShowAddFamilyModal(false);
  };

  const handleFriendSubmit = (data: FriendData) => {
    console.log('Friend added:', data);
    Alert.alert('Success', `Request sent to ${data.nickname}`);
    setShowAddFriendModal(false);
  };

  // Risk Areas - Flood, Earthquake, Fire
  const riskAreas: RiskArea[] = [
    // FLOOD RISK AREAS
    {
      id: 'flood1',
      name: 'Barangay Biga I (Flood Zone)',
      latitude: 14.1580,
      longitude: 120.9620,
      radius: 400,
      riskLevel: 'high',
      disasterType: 'flood',
      lastUpdated: '2 hours ago',
    },
    {
      id: 'flood2',
      name: 'Barangay Lumil (Flood Prone)',
      latitude: 14.2150,
      longitude: 120.9750,
      radius: 450,
      riskLevel: 'high',
      disasterType: 'flood',
      lastUpdated: '1 hour ago',
    },
    {
      id: 'flood3',
      name: 'Barangay Pooc I (Low-lying Area)',
      latitude: 14.1620,
      longitude: 120.9590,
      radius: 350,
      riskLevel: 'medium',
      disasterType: 'flood',
      lastUpdated: '3 hours ago',
    },
    {
      id: 'flood4',
      name: 'Barangay Kaong (River Area)',
      latitude: 14.1850,
      longitude: 120.9680,
      radius: 300,
      riskLevel: 'medium',
      disasterType: 'flood',
      lastUpdated: '2 hours ago',
    },
    {
      id: 'flood5',
      name: 'Barangay Anahaw I (Creek Overflow)',
      latitude: 14.2100,
      longitude: 120.9900,
      radius: 380,
      riskLevel: 'high',
      disasterType: 'flood',
      lastUpdated: '30 minutes ago',
    },
    // EARTHQUAKE RISK AREAS
    {
      id: 'quake1',
      name: 'Barangay Biga II (Fault Line)',
      latitude: 14.1650,
      longitude: 120.9700,
      radius: 500,
      riskLevel: 'high',
      disasterType: 'earthquake',
      lastUpdated: 'Active',
    },
    {
      id: 'quake2',
      name: 'Barangay Narra I (Seismic Zone)',
      latitude: 14.2400,
      longitude: 121.0000,
      radius: 600,
      riskLevel: 'high',
      disasterType: 'earthquake',
      lastUpdated: 'Active',
    },
    {
      id: 'quake3',
      name: 'Barangay Biluso (Unstable Ground)',
      latitude: 14.1800,
      longitude: 120.9550,
      radius: 450,
      riskLevel: 'medium',
      disasterType: 'earthquake',
      lastUpdated: 'Monitored',
    },
    {
      id: 'quake4',
      name: 'Barangay Malabag (Near Fault)',
      latitude: 14.2200,
      longitude: 120.9650,
      radius: 400,
      riskLevel: 'medium',
      disasterType: 'earthquake',
      lastUpdated: 'Monitored',
    },
    // FIRE RISK AREAS
    {
      id: 'fire1',
      name: 'Barangay Poblacion (Dense Housing)',
      latitude: 14.2167,
      longitude: 120.9833,
      radius: 350,
      riskLevel: 'high',
      disasterType: 'fire',
      temperature: 34,
      humidity: 45,
      lastUpdated: 'Real-time',
    },
    {
      id: 'fire2',
      name: 'Barangay Aga (Dry Vegetation)',
      latitude: 14.2500,
      longitude: 120.9900,
      radius: 400,
      riskLevel: 'high',
      disasterType: 'fire',
      temperature: 36,
      humidity: 40,
      lastUpdated: 'Real-time',
    },
    {
      id: 'fire3',
      name: 'Barangay Tibig (Forest Area)',
      latitude: 14.1900,
      longitude: 121.0100,
      radius: 500,
      riskLevel: 'medium',
      disasterType: 'fire',
      temperature: 32,
      humidity: 55,
      lastUpdated: 'Real-time',
    },
    {
      id: 'fire4',
      name: 'Barangay Maguyam (Grassland)',
      latitude: 14.2300,
      longitude: 120.9500,
      radius: 380,
      riskLevel: 'medium',
      disasterType: 'fire',
      temperature: 33,
      humidity: 50,
      lastUpdated: 'Real-time',
    },
    {
      id: 'fire5',
      name: 'Barangay Toledo (Industrial)',
      latitude: 14.1750,
      longitude: 120.9800,
      radius: 320,
      riskLevel: 'high',
      disasterType: 'fire',
      temperature: 35,
      humidity: 42,
      lastUpdated: 'Real-time',
    },
  ];

  // Evacuation Centers - 20 locations across Silang
  const evacuationCenters: EvacuationCenter[] = [
    // LALAAN AREA
    {
      id: 'ec1',
      name: 'Rogationist College',
      address: 'Km 52 Aguinaldo Hwy, Lalaan II, Silang, Cavite',
      latitude: 14.14948449482489,
      longitude: 120.95596752549143,
    },
    {
      id: 'ec2',
      name: 'Lalaan Central School',
      address: 'Public school near Aguinaldo Highway, Lalaan II',
      latitude: 14.159473704166015,
      longitude: 120.95818961493147,
    },
    {
      id: 'ec3',
      name: 'Lalaan 1st Covered Court',
      address: 'Lalaan I, Silang, Cavite',
      latitude: 14.1605,
      longitude: 120.9572,
    },
    // POBLACION AREA (CENTER)
    {
      id: 'ec4',
      name: 'Silang Municipal Hall',
      address: 'Poblacion, Silang, Cavite',
      latitude: 14.2167,
      longitude: 120.9833,
    },
    {
      id: 'ec5',
      name: 'Silang Public Market Covered Court',
      address: 'Near Public Market, Poblacion',
      latitude: 14.2175,
      longitude: 120.9840,
    },
    {
      id: 'ec6',
      name: 'St. Mary Magdalene Church',
      address: 'Church Plaza, Poblacion',
      latitude: 14.2160,
      longitude: 120.9825,
    },
    // NORTHERN SILANG
    {
      id: 'ec7',
      name: 'Barangay Anahaw I Covered Court',
      address: 'Anahaw I, Silang, Cavite',
      latitude: 14.2100,
      longitude: 120.9900,
    },
    {
      id: 'ec8',
      name: 'Barangay Aga Barangay Hall',
      address: 'Aga, Silang, Cavite',
      latitude: 14.2500,
      longitude: 120.9900,
    },
    {
      id: 'ec9',
      name: 'Barangay Narra I Multi-Purpose Hall',
      address: 'Narra I, Silang, Cavite',
      latitude: 14.2400,
      longitude: 121.0000,
    },
    // EASTERN SILANG
    {
      id: 'ec10',
      name: 'Barangay Tibig Covered Court',
      address: 'Tibig, Silang, Cavite',
      latitude: 14.1900,
      longitude: 121.0100,
    },
    {
      id: 'ec11',
      name: 'Barangay Biga II Evacuation Center',
      address: 'Biga II, Silang, Cavite',
      latitude: 14.1650,
      longitude: 120.9700,
    },
    // WESTERN SILANG
    {
      id: 'ec12',
      name: 'Barangay Maguyam Barangay Hall',
      address: 'Maguyam, Silang, Cavite',
      latitude: 14.2300,
      longitude: 120.9500,
    },
    {
      id: 'ec13',
      name: 'Barangay Biluso Covered Court',
      address: 'Biluso, Silang, Cavite',
      latitude: 14.1800,
      longitude: 120.9550,
    },
    // SOUTHERN SILANG
    {
      id: 'ec14',
      name: 'Barangay Balubad Covered Court',
      address: 'Balubad, Silang, Cavite',
      latitude: 14.1555,
      longitude: 120.9595,
    },
    {
      id: 'ec15',
      name: 'Barangay Toledo Elementary School',
      address: 'Toledo, Silang, Cavite',
      latitude: 14.1750,
      longitude: 120.9800,
    },
    {
      id: 'ec16',
      name: 'Barangay Lumil Barangay Hall',
      address: 'Lumil, Silang, Cavite',
      latitude: 14.2150,
      longitude: 120.9750,
    },
    // ADDITIONAL CENTERS
    {
      id: 'ec17',
      name: 'Barangay Kaong Multi-Purpose Hall',
      address: 'Kaong, Silang, Cavite',
      latitude: 14.1850,
      longitude: 120.9680,
    },
    {
      id: 'ec18',
      name: 'Barangay Malabag Covered Court',
      address: 'Malabag, Silang, Cavite',
      latitude: 14.2200,
      longitude: 120.9650,
    },
    {
      id: 'ec19',
      name: 'Barangay Putingkahoy Covered Court',
      address: 'Putingkahoy, Silang, Cavite',
      latitude: 14.1640,
      longitude: 120.9610,
    },
    {
      id: 'ec20',
      name: 'Barangay Banaba Barangay Hall',
      address: 'Banaba, Silang, Cavite',
      latitude: 14.1621,
      longitude: 120.9560,
    },
  ];

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return 'rgba(239, 68, 68, 0.3)';
      case 'medium':
        return 'rgba(245, 158, 11, 0.3)';
      case 'low':
        return 'rgba(251, 191, 36, 0.3)';
      default:
        return 'rgba(156, 163, 175, 0.3)';
    }
  };

  const getRiskStrokeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#FBFB24';
      default:
        return '#9CA3AF';
    }
  };

  const filteredUsers = locationUsers.filter((u) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'family') return u.type === 'family';
    if (selectedFilter === 'friends') return u.type === 'friend';
    return false;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Offline Banner */}
      {!isOnline && showOfflineNotice && <OfflineBanner />}
      
      {/* Map Container */}
      <View style={styles.mapContainer}>
        <MapClusteringView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={SILANG_CAVITE}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={false}
          clusterColor="#3B82F6"
          clusterTextColor="#FFFFFF"
          clusterFontFamily="System"
          radius={60}
          extent={512}
          minZoom={0}
          maxZoom={20}
        >
          {/* Risk Area Circles */}
          {riskAreas.map((area) => (
            <Circle
              key={area.id}
              center={{
                latitude: area.latitude,
                longitude: area.longitude,
              }}
              radius={area.radius}
              fillColor={getRiskColor(area.riskLevel)}
              strokeColor={getRiskStrokeColor(area.riskLevel)}
              strokeWidth={2}
            />
          ))}

          {/* Risk Area Markers with Disaster Type Icons */}
          {riskAreas.map((area) => (
            <Marker
              key={`marker-${area.id}`}
              coordinate={{
                latitude: area.latitude,
                longitude: area.longitude,
              }}
              title={area.name}
              description={`${area.disasterType.toUpperCase()} Risk - ${area.riskLevel.toUpperCase()}${
                area.disasterType === 'fire' 
                  ? `\n🌡️ ${area.temperature}°C | 💧 ${area.humidity}%` 
                  : area.lastUpdated 
                    ? `\n⏱️ ${area.lastUpdated}` 
                    : ''
              }`}
            >
              <View style={styles.riskMarker}>
                <View
                  style={[
                    styles.riskIcon,
                    area.riskLevel === 'high'
                      ? styles.riskHighIcon
                      : area.riskLevel === 'medium'
                      ? styles.riskMediumIcon
                      : styles.riskLowIcon,
                  ]}
                >
                  <Text style={styles.riskIconText}>
                    {area.disasterType === 'flood' ? '🌊' : 
                     area.disasterType === 'earthquake' ? '🌋' : 
                     '🔥'}
                  </Text>
                </View>
              </View>
            </Marker>
          ))}

          {/* User Location Markers */}
          {selectedFilter !== 'evacuation' &&
            filteredUsers.map((locUser) => (
              <Marker
                key={locUser.id}
                coordinate={{
                  latitude: locUser.latitude,
                  longitude: locUser.longitude,
                }}
                title={locUser.name}
                description={locUser.location}
              >
                <View style={styles.markerContainer}>
                  <View
                    style={[
                      styles.marker,
                      locUser.type === 'family'
                        ? styles.markerFamily
                        : styles.markerFriend,
                    ]}
                  >
                    <Text style={styles.markerText}>
                      {locUser.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                </View>
              </Marker>
            ))}

          {/* Evacuation Center Markers */}
          {selectedFilter === 'evacuation' &&
            evacuationCenters.map((center) => (
              <Marker
                key={center.id}
                coordinate={{
                  latitude: center.latitude,
                  longitude: center.longitude,
                }}
                onPress={() => setSelectedCenter(center)}
              >
                <View style={styles.evacuationMarker}>
                  <View style={styles.evacuationIcon}>
                    <Text style={styles.evacuationIconText}>🆘</Text>
                  </View>
                </View>
              </Marker>
            ))}

          {/* Route Polyline */}
          {showingRoute && routeCoordinates.length > 0 && (
            <Polyline
              key={`route-${showingRoute}-${routeCoordinates.length}`}
              coordinates={routeCoordinates}
              strokeColor="#3B82F6"
              strokeWidth={4}
              lineDashPattern={[0]}
            />
          )}
          
          {/* Starting Point Marker (User Location) */}
          {showingRoute && userLocation && (
            <Marker
              key={`user-marker-${showingRoute}`}
              coordinate={userLocation}
              title="Your Location"
              description="Starting point"
            >
              <View style={styles.userLocationMarker}>
                <View style={styles.userLocationInner}>
                  <Text style={styles.userLocationText}>📍</Text>
                </View>
              </View>
            </Marker>
          )}

          {/* Silang Center Marker */}
          <Marker
            coordinate={SILANG_CAVITE}
            title="Silang, Cavite"
            description="Municipality Center"
          >
            <View style={styles.barangayMarker}>
              <Text style={styles.barangayMarkerText}>🏛️</Text>
            </View>
          </Marker>
        </MapClusteringView>

        {/* Top Right Actions */}
        <View style={styles.topActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={styles.avatarSmall}>
              <Text style={styles.avatarSmallText}>
                {user?.displayName?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Recenter Button */}
        <TouchableOpacity style={styles.recenterButton} onPress={recenterMap}>
          <Text style={styles.recenterIcon}>{showingRoute ? '✕' : '🎯'}</Text>
        </TouchableOpacity>

        {/* Location Badge */}
        <TouchableOpacity 
          style={[styles.locationBadge, !isOnline && styles.locationBadgeOffline]}
          onPress={refreshLocation}
          activeOpacity={0.7}
        >
          <Text style={styles.locationBadgeText}>
            {!isOnline 
              ? '📡 Offline Mode'
              : showingRoute 
                ? '🗺️ Route Active' 
                : userLocation 
                  ? '📍 Silang, Cavite' 
                  : '📍 Getting Location...'}
          </Text>
          {!isOnline && (
            <Text style={styles.locationSubtext}>
              Real-time updates unavailable
            </Text>
          )}
        </TouchableOpacity>

        {/* Risk Legend */}
        <View style={styles.riskLegend}>
          <Text style={styles.legendTitle}>Disaster Risks</Text>
          <View style={styles.legendItem}>
            <Text style={styles.legendText}>🌊 Flood Zone</Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={styles.legendText}>🌋 Earthquake</Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={styles.legendText}>🔥 Fire Risk</Text>
          </View>
          <View style={styles.legendSeparator} />
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendSubtext}>High</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendSubtext}>Medium</Text>
          </View>
        </View>
      </View>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        <View style={styles.sheetHandle} />

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedFilter === 'all' && styles.filterChipActive,
            ]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === 'all' && styles.filterTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedFilter === 'family' && styles.filterChipActive,
            ]}
            onPress={() => setSelectedFilter('family')}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === 'family' && styles.filterTextActive,
              ]}
            >
              Family
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedFilter === 'friends' && styles.filterChipActive,
            ]}
            onPress={() => setSelectedFilter('friends')}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === 'friends' && styles.filterTextActive,
              ]}
            >
              Friends
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              styles.evacuationChip,
              selectedFilter === 'evacuation' && styles.evacuationChipActive,
            ]}
            onPress={() => setSelectedFilter('evacuation')}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === 'evacuation' && styles.evacuationTextActive,
              ]}
            >
              🆘 Evacuation
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* User List */}
        {selectedFilter !== 'evacuation' && (
          <ScrollView style={styles.contentList} showsVerticalScrollIndicator={false}>
            {filteredUsers.map((locUser) => (
              <TouchableOpacity
                key={locUser.id}
                style={styles.userCard}
                onPress={() => {
                  mapRef.current?.animateToRegion(
                    {
                      latitude: locUser.latitude,
                      longitude: locUser.longitude,
                      latitudeDelta: 0.005,
                      longitudeDelta: 0.005,
                    },
                    1000
                  );
                }}
              >
                <View style={styles.userInfo}>
                  <View style={styles.userHeader}>
                    <Text style={styles.userName}>{locUser.name}</Text>
                    <View
                      style={[
                        styles.userTypeBadge,
                        locUser.type === 'family'
                          ? styles.familyBadge
                          : styles.friendBadge,
                      ]}
                    >
                      <Text style={styles.userTypeText}>
                        {locUser.type === 'family' ? 'Family' : 'Friend'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.userLocation}>📍 {locUser.location}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Evacuation Centers List */}
        {selectedFilter === 'evacuation' && (
          <ScrollView style={styles.contentList} showsVerticalScrollIndicator={false}>
            <Text style={styles.listTitle}>Safety Evacuation Centers</Text>
            {evacuationCenters.map((center) => (
              <TouchableOpacity
                key={center.id}
                style={styles.evacuationCard}
                onPress={() => setSelectedCenter(center)}
              >
                <View style={styles.evacuationCardHeader}>
                  <View style={styles.evacuationCardLeft}>
                    <Text style={styles.evacuationName}>{center.name}</Text>
                    <Text style={styles.evacuationAddress}>📍 {center.address}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Hotline')}
        >
          <Text style={styles.navIcon}>📞</Text>
          <Text style={styles.navLabel}>Hotline</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('MapHome')}
        >
          <Text style={[styles.navIcon, styles.navIconActive]}>📍</Text>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Location</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItemCenter}
          onPress={() => setShowAddModal(true)}
        >
          <View style={styles.centerButton}>
            <Text style={styles.centerIcon}>+</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('CheckIn')}
        >
          <Text style={styles.navIcon}>✓</Text>
          <Text style={styles.navLabel}>Check-in</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Text style={styles.navIcon}>🔔</Text>
          <Text style={styles.navLabel}>Alerts</Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <AddContactModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddFamily={handleAddFamily}
        onAddFriend={handleAddFriend}
      />

      <AddFamilyModal
        visible={showAddFamilyModal}
        onClose={() => setShowAddFamilyModal(false)}
        onSubmit={handleFamilySubmit}
      />

      <AddFriendModal
        visible={showAddFriendModal}
        onClose={() => setShowAddFriendModal(false)}
        onSubmit={handleFriendSubmit}
      />

      <EvacuationCenterModal
        visible={selectedCenter !== null}
        center={selectedCenter}
        onClose={() => setSelectedCenter(null)}
        onShowRoute={handleShowRoute}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  offlineBanner: {
    backgroundColor: '#FEF3C7',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  offlineBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  offlineIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  offlineTextContainer: {
    flex: 1,
  },
  offlineTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2,
  },
  offlineSubtitle: {
    fontSize: 12,
    color: '#92400E',
    opacity: 0.8,
  },
  offlineButton: {
    padding: 8,
  },
  offlineButtonText: {
    fontSize: 18,
    color: '#92400E',
    fontWeight: '700',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  topActions: {
    position: 'absolute',
    top: 16,
    right: 16,
    gap: 12,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarSmallText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  recenterButton: {
    position: 'absolute',
    bottom: 180,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  recenterIcon: {
    fontSize: 24,
  },
  locationBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  locationBadgeOffline: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  locationBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  locationSubtext: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  riskLegend: {
    position: 'absolute',
    top: 70,
    left: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: '#64748B',
  },
  legendSeparator: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 6,
  },
  legendSubtext: {
    fontSize: 10,
    color: '#64748B',
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  markerFamily: {
    backgroundColor: '#10B981',
  },
  markerFriend: {
    backgroundColor: '#3B82F6',
  },
  markerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  barangayMarker: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  barangayMarkerText: {
    fontSize: 32,
  },
  riskMarker: {
    alignItems: 'center',
  },
  riskIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  riskHighIcon: {
    backgroundColor: '#EF4444',
  },
  riskMediumIcon: {
    backgroundColor: '#F59E0B',
  },
  riskLowIcon: {
    backgroundColor: '#FBB024',
  },
  riskIconText: {
    fontSize: 20,
  },
  evacuationMarker: {
    alignItems: 'center',
  },
  evacuationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  evacuationIconText: {
    fontSize: 24,
  },
  userLocationMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userLocationInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  userLocationText: {
    fontSize: 20,
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    maxHeight: '40%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    paddingRight: 20,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
  },
  evacuationChip: {
    borderWidth: 2,
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  evacuationChipActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  evacuationTextActive: {
    color: '#FFFFFF',
  },
  contentList: {
    flex: 1,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  userCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  userLocation: {
    fontSize: 14,
    color: '#64748B',
  },
  userTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  familyBadge: {
    backgroundColor: '#D1FAE5',
  },
  friendBadge: {
    backgroundColor: '#DBEAFE',
  },
  userTypeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
  },
  evacuationCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  evacuationCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  evacuationCardLeft: {
    flex: 1,
    marginRight: 12,
  },
  evacuationName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  evacuationAddress: {
    fontSize: 13,
    color: '#64748B',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 8,
    paddingBottom: Platform.OS === 'ios' ? 34 : 48,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  navItemCenter: {
    flex: 1,
    alignItems: 'center',
    marginTop: -32,
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
    opacity: 0.6,
  },
  navIconActive: {
    opacity: 1,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  navLabelActive: {
    color: '#3B82F6',
    fontWeight: '700',
  },
  centerButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  centerIcon: {
    fontSize: 36,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default MapHomeScreen;