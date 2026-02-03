import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  StatusBar,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuth } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { colors } from '../config/colors';

interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserEmail: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: any;
}

const FriendRequestsScreen = ({ navigation }: any) => {
  const authInstance = getAuth();
  const user = authInstance.currentUser;
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Listen to friend requests in real-time
    // Removed orderBy to avoid composite index requirement
    const unsubscribe = firestore()
      .collection('friend_requests')
      .where('toUserId', '==', user.uid)
      .where('status', '==', 'pending')
      .onSnapshot(
        (snapshot) => {
          const pendingRequests: FriendRequest[] = [];
          snapshot.forEach((doc) => {
            pendingRequests.push({
              id: doc.id,
              ...doc.data(),
            } as FriendRequest);
          });
          
          // Sort in JavaScript instead of Firestore
          pendingRequests.sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || 0;
            const bTime = b.createdAt?.toMillis?.() || 0;
            return bTime - aTime; // Descending order (newest first)
          });
          
          setRequests(pendingRequests);
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching friend requests:', error);
          Alert.alert(
            'Database Error',
            'Failed to load friend requests. Please try again later.',
            [{ text: 'OK' }]
          );
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [user]);

  const acceptRequest = async (request: FriendRequest) => {
    try {
      // Create friend relationship (bidirectional)
      const batch = firestore().batch();

      // Add friend for current user
      const friend1Ref = firestore()
        .collection('friends')
        .doc(user!.uid)
        .collection('userFriends')
        .doc(request.fromUserId);

      batch.set(friend1Ref, {
        userId: request.fromUserId,
        userName: request.fromUserName,
        userEmail: request.fromUserEmail,
        canTrack: true,
        addedAt: firestore.FieldValue.serverTimestamp(),
      });

      // Add friend for requester
      const friend2Ref = firestore()
        .collection('friends')
        .doc(request.fromUserId)
        .collection('userFriends')
        .doc(user!.uid);

      batch.set(friend2Ref, {
        userId: user!.uid,
        userName: user!.displayName || 'User',
        userEmail: user!.email || '',
        canTrack: true,
        addedAt: firestore.FieldValue.serverTimestamp(),
      });

      // Update request status
      const requestRef = firestore()
        .collection('friend_requests')
        .doc(request.id);

      batch.update(requestRef, {
        status: 'accepted',
        acceptedAt: firestore.FieldValue.serverTimestamp(),
      });

      await batch.commit();

      Alert.alert(
        'Friend Added',
        `${request.fromUserName} is now your friend!`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error accepting friend request:', error);
      Alert.alert('Error', 'Failed to accept friend request. Please try again.');
    }
  };

  const rejectRequest = async (requestId: string, userName: string) => {
    Alert.alert(
      'Reject Request',
      `Are you sure you want to reject ${userName}'s friend request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await firestore()
                .collection('friend_requests')
                .doc(requestId)
                .update({
                  status: 'rejected',
                  rejectedAt: firestore.FieldValue.serverTimestamp(),
                });

              Alert.alert(
                'Request Rejected',
                'Friend request has been rejected.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('Error rejecting friend request:', error);
              Alert.alert('Error', 'Failed to reject friend request. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>👥</Text>
      <Text style={styles.emptyTitle}>No Friend Requests</Text>
      <Text style={styles.emptyText}>
        You don't have any pending friend requests
      </Text>
    </View>
  );

  const renderRequest = ({ item }: { item: FriendRequest }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.fromUserName?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.name}>{item.fromUserName || 'Unknown User'}</Text>
          <Text style={styles.email}>{item.fromUserEmail}</Text>
          <Text style={styles.text}>wants to track your location</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.rejectButton]}
          onPress={() => rejectRequest(item.id, item.fromUserName)}
        >
          <Text style={styles.rejectText}>Reject</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.acceptButton]}
          onPress={() => acceptRequest(item)}
        >
          <Text style={styles.acceptText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Friend Requests</Text>

        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={renderRequest}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#1E293B',
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  placeholder: {
    width: 40,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  email: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  text: {
    fontSize: 13,
    color: '#64748B',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  acceptText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  rejectText: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
});

export default FriendRequestsScreen;