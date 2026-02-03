import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';

interface AddFamilyModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: FamilyMemberData) => void;
}

export interface FamilyMemberData {
  name: string;
  relationship: string;
  phoneNumber: string;
  address: string;
}

const relationships = [
  'Parent',
  'Sibling',
  'Spouse',
  'Child',
  'Grandparent',
  'Grandchild',
  'Other',
];

const AddFamilyModal: React.FC<AddFamilyModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    if (!relationship) {
      Alert.alert('Error', 'Please select a relationship');
      return;
    }
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter a phone number');
      return;
    }

    onSubmit({
      name: name.trim(),
      relationship,
      phoneNumber: phoneNumber.trim(),
      address: address.trim(),
    });

    // Reset form
    setName('');
    setRelationship('');
    setPhoneNumber('');
    setAddress('');
  };

  const handleClose = () => {
    setName('');
    setRelationship('');
    setPhoneNumber('');
    setAddress('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Family Member</Text>
            <TouchableOpacity onPress={handleClose} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.form}>
              {/* Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter full name"
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Relationship Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Relationship *</Text>
                <View style={styles.relationshipGrid}>
                  {relationships.map((rel) => (
                    <TouchableOpacity
                      key={rel}
                      style={[
                        styles.relationshipChip,
                        relationship === rel && styles.relationshipChipActive,
                      ]}
                      onPress={() => setRelationship(rel)}
                    >
                      <Text
                        style={[
                          styles.relationshipText,
                          relationship === rel && styles.relationshipTextActive,
                        ]}
                      >
                        {rel}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Phone Number Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+63 912 345 6789"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Address Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Address (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter address"
                  value={address}
                  onChangeText={setAddress}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>Add Family Member</Text>
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
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
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
  form: {
    gap: 20,
    marginBottom: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1E293B',
  },
  textArea: {
    height: 80,
    paddingTop: 14,
  },
  relationshipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relationshipChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  relationshipChipActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  relationshipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  relationshipTextActive: {
    color: '#FFFFFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
  },
  submitButton: {
    backgroundColor: '#10B981',
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default AddFamilyModal;