import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
  Linking,
  Alert,
} from 'react-native';

export interface EvacuationCenter {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface EvacuationCenterModalProps {
  visible: boolean;
  center: EvacuationCenter | null;
  onClose: () => void;
  onShowRoute?: (center: EvacuationCenter) => void;
}

const EvacuationCenterModal: React.FC<EvacuationCenterModalProps> = ({
  visible,
  center,
  onClose,
  onShowRoute,
}) => {
  if (!center) return null;

  const handleGetDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${center.latitude},${center.longitude}`;
    Linking.openURL(url);
    onClose();
  };

  const handleShowRoute = () => {
    if (onShowRoute) {
      onShowRoute(center);
      onClose();
    }
  };

  const handleCheckIn = () => {
    Alert.alert(
      'Check-In Confirmation',
      `Check in at ${center.name}? Your emergency contacts will be notified.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Check In',
          onPress: () => {
            Alert.alert('Success', `Checked in at ${center.name}. Stay safe!`);
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{center.name}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.centerDetailCard}>
            <View style={styles.centerDetailRow}>
              <Text style={styles.centerDetailLabel}>📍 Address</Text>
              <Text style={styles.centerDetailValue}>{center.address}</Text>
            </View>
          </View>

          <View style={styles.centerActions}>
            <TouchableOpacity
              style={[styles.centerActionButton, styles.routeButton]}
              onPress={handleShowRoute}
            >
              <Text style={styles.centerActionIcon}>🗺️</Text>
              <Text style={styles.centerActionTextWhite}>Show Route</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.centerActionButton, styles.directionsButton]}
              onPress={handleGetDirections}
            >
              <Text style={styles.centerActionIcon}>📱</Text>
              <Text style={styles.centerActionText}>Google Maps</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.centerActionButton, styles.checkInButton, styles.fullWidthButton]}
            onPress={handleCheckIn}
          >
            <Text style={styles.centerActionIcon}>✓</Text>
            <Text style={styles.centerActionTextWhite}>Check In Here</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 48 : 32,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1E293B',
    flex: 1,
    marginRight: 12,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseIcon: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: '600',
  },
  centerDetailCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 16,
  },
  centerDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  centerDetailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  centerDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    textAlign: 'right',
  },
  centerActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  centerActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  routeButton: {
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  directionsButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  checkInButton: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  fullWidthButton: {
    flex: 0,
    width: '100%',
  },
  centerActionIcon: {
    fontSize: 18,
  },
  centerActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
  },
  centerActionTextWhite: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default EvacuationCenterModal;