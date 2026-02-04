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

interface FamilyRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserEmail: string;
  toUserId: string;
  relationship: string;
  nickname?: string;
  phoneNumber?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: any;
}

const FamilyRequestsScreen = ({ navigation }: any) => {
  const authInstance = getAuth();
  const user = authInstance.currentUser;
  const [requests, setRequests] = useState<FamilyRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Listen to family requests in real-time
    const unsubscribe = firestore()
      .collection('family_requests')
      .where('toUserId', '==', user.uid)
      .where('status', '==', 'pending')
      .onSnapshot(
        (snapshot) => {
          const pendingRequests: FamilyRequest[] = [];
          snapshot.forEach((doc) => {
            pendingRequests.push({
              id: doc.id,
              ...doc.data(),
            } as FamilyRequest);
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
          console.error('Error fetching family requests:', error);
          Alert.alert(
            'Database Error',
            'Failed to load family requests. Please try again later.',
            [{ text: 'OK' }]
          );
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [user]);

  const acceptRequest = async (request: FamilyRequest) => {
    try {
      // Create family relationship (bidirectional)
      const batch = firestore().batch();

      // Add family member for current user
      const family1Ref = firestore()
        .collection('family')
        .doc(user!.uid)
        .collection('userFamily')
        .doc(request.fromUserId);

      batch.set(family1Ref, {
        userId: request.fromUserId,
        userName: request.fromUserName,
        userEmail: request.fromUserEmail,
        relationship: request.relationship,
        nickname: request.nickname || null,
        phoneNumber: request.phoneNumber || null,
        canTrack: true,
        addedAt: firestore.FieldValue.serverTimestamp(),
      });

      // Determine reciprocal relationship
      const reciprocalRelationship = getReciprocalRelationship(request.relationship);

      // Add family member for requester
      const family2Ref = firestore()
        .collection('family')
        .doc(request.fromUserId)
        .collection('userFamily')
        .doc(user!.uid);

      batch.set(family2Ref, {
        userId: user!.uid,
        userName: user!.displayName || 'User',
        userEmail: user!.email || '',
        relationship: reciprocalRelationship,
        nickname: null,
        phoneNumber: null,
        canTrack: true,
        addedAt: firestore.FieldValue.serverTimestamp(),
      });

      // Update request status
      const requestRef = firestore()
        .collection('family_requests')
        .doc(request.id);

      batch.update(requestRef, {
        status: 'accepted',
        acceptedAt: firestore.FieldValue.serverTimestamp(),
      });

      // Send notification to requester
      const notificationRef = firestore().collection('notifications').doc();
      batch.set(notificationRef, {
        userId: request.fromUserId,
        type: 'family_accepted',
        title: 'Family Request Accepted',
        message: `${user!.displayName || 'Someone'} accepted your family request`,
        fromUserId: user!.uid,
        fromUserName: user!.displayName || 'User',
        read: false,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      await batch.commit();

      const displayName = request.nickname || request.fromUserName;
      Alert.alert(
        'Family Member Added',
        `${displayName} is now in your family contacts!`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error accepting family request:', error);
      Alert.alert('Error', 'Failed to accept family request. Please try again.');
    }
  };

  const rejectRequest = async (requestId: string, userName: string, nickname?: string) => {
    const displayName = nickname || userName;
    Alert.alert(
      'Reject Request',
      `Are you sure you want to reject ${displayName}'s family request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await firestore()
                .collection('family_requests')
                .doc(requestId)
                .update({
                  status: 'rejected',
                  rejectedAt: firestore.FieldValue.serverTimestamp(),
                });

              Alert.alert(
                'Request Rejected',
                'Family request has been rejected.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('Error rejecting family request:', error);
              Alert.alert('Error', 'Failed to reject family request. Please try again.');
            }
          },
        },
      ]
    );
  };

  const getReciprocalRelationship = (relationship: string): string => {
    const reciprocalMap: { [key: string]: string } = {
      'Parent': 'Child',
      'Child': 'Parent',
      'Sibling': 'Sibling',
      'Spouse': 'Spouse',
      'Grandparent': 'Grandchild',
      'Grandchild': 'Grandparent',
      'Aunt/Uncle': 'Niece/Nephew',
      'Cousin': 'Cousin',
      'Other': 'Other',
    };

    return reciprocalMap[relationship] || 'Other';
  };

  const getRelationshipEmoji = (relationship: string): string => {
    const emojiMap: { [key: string]: string } = {
      'Parent': '👨‍👩',
      'Child': '👶',
      'Sibling': '👫',
      'Spouse': '💑',
      'Grandparent': '👴👵',
      'Grandchild': '👧👦',
      'Aunt/Uncle': '👨‍👩',
      'Cousin': '👥',
      'Other': '👤',
    };

    return emojiMap[relationship] || '👤';
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>👨‍👩‍👧‍👦</Text>
      <Text style={styles.emptyTitle}>No Family Requests</Text>
      <Text style={styles.emptyText}>
        You don't have any pending family requests
      </Text>
    </View>
  );

  const renderRequest = ({ item }: { item: FamilyRequest }) => {
    const displayName = item.nickname || item.fromUserName;
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {displayName?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <View style={styles.cardInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{displayName || 'Unknown User'}</Text>
              {item.nickname && (
                <View style={styles.nicknameBadge}>
                  <Text style={styles.nicknameBadgeText}>Nickname</Text>
                </View>
              )}
            </View>
            {item.nickname && (
              <Text style={styles.realName}>Real name: {item.fromUserName}</Text>
            )}
            <Text style={styles.email}>{item.fromUserEmail}</Text>
            <View style={styles.relationshipBadge}>
              <Text style={styles.relationshipEmoji}>
                {getRelationshipEmoji(item.relationship)}
              </Text>
              <Text style={styles.relationshipLabel}>{item.relationship}</Text>
            </View>
            {item.phoneNumber && (
              <Text style={styles.phone}>📞 {item.phoneNumber}</Text>
            )}
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.rejectButton]}
            onPress={() => rejectRequest(item.id, item.fromUserName, item.nickname)}
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
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
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

        <Text style={styles.headerTitle}>Family Requests</Text>

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
    backgroundColor: '#10B981',
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginRight: 8,
  },
  nicknameBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  nicknameBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#166534',
  },
  realName: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 2,
  },
  email: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 6,
  },
  relationshipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  relationshipEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  relationshipLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  phone: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
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

export default FamilyRequestsScreen;