import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const OfflineInfoModal: React.FC<Props> = ({ visible, onClose }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>📡 Offline Mode</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <Text style={styles.sectionTitle}>✅ Available Offline:</Text>
            <Text style={styles.item}>• View map and risk areas</Text>
            <Text style={styles.item}>• See evacuation centers</Text>
            <Text style={styles.item}>• View last known family/friend locations</Text>
            <Text style={styles.item}>• Browse cached notifications</Text>
            <Text style={styles.item}>• Access emergency hotlines</Text>

            <Text style={styles.sectionTitle}>❌ Requires Internet:</Text>
            <Text style={styles.item}>• Real-time location updates</Text>
            <Text style={styles.item}>• Turn-by-turn directions</Text>
            <Text style={styles.item}>• Check-in submissions</Text>
            <Text style={styles.item}>• Push notifications</Text>
            <Text style={styles.item}>• Send friend/family requests</Text>

            <View style={styles.note}>
              <Text style={styles.noteText}>
                💡 Tip: The app caches data when online so you can access it later offline.
              </Text>
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.okButton} onPress={onClose}>
            <Text style={styles.okButtonText}>Got It</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  closeButton: {
    fontSize: 24,
    color: '#64748B',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 12,
  },
  item: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
    paddingLeft: 8,
  },
  note: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  noteText: {
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 20,
  },
  okButton: {
    backgroundColor: '#3B82F6',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  okButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default OfflineInfoModal;