import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
} from 'react-native';

interface AddContactModalProps {
  visible: boolean;
  onClose: () => void;
  onAddFamily: () => void;
  onAddFriend: () => void;
}

const AddContactModal: React.FC<AddContactModalProps> = ({
  visible,
  onClose,
  onAddFamily,
  onAddFriend,
}) => {
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
            <Text style={styles.modalTitle}>Add Contact</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSubtitle}>
            Add someone to track during emergencies
          </Text>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.familyButton]}
              onPress={onAddFamily}
            >
              <View style={styles.modalButtonIcon}>
                <Text style={styles.modalButtonEmoji}>👨‍👩‍👧‍👦</Text>
              </View>
              <View style={styles.modalButtonContent}>
                <Text style={styles.modalButtonTitle}>Add Family Member</Text>
                <Text style={styles.modalButtonDescription}>
                  Add a family member to track
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.friendButton]}
              onPress={onAddFriend}
            >
              <View style={styles.modalButtonIcon}>
                <Text style={styles.modalButtonEmoji}>👥</Text>
              </View>
              <View style={styles.modalButtonContent}>
                <Text style={styles.modalButtonTitle}>Add Friend</Text>
                <Text style={styles.modalButtonDescription}>
                  Add a friend to track
                </Text>
              </View>
            </TouchableOpacity>
          </View>
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1E293B',
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
  modalSubtitle: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 24,
  },
  modalButtons: {
    gap: 16,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
  },
  familyButton: {
    backgroundColor: '#DCFCE7',
    borderColor: '#10B981',
  },
  friendButton: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
  },
  modalButtonIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modalButtonEmoji: {
    fontSize: 28,
  },
  modalButtonContent: {
    flex: 1,
  },
  modalButtonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  modalButtonDescription: {
    fontSize: 14,
    color: '#64748B',
  },
});

export default AddContactModal;