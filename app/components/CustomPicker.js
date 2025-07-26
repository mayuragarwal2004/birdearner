// components/PickerModal.js
import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { AntDesign } from '@expo/vector-icons';

export default function PickerModal({
  items,
  value,
  onValueChange,
  placeholder = 'Select an option',
  label = '',
  style = {},
  innerStyle = {},
  textStyle = {},
}) {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedLabel = items.find((item) => item.value === value)?.label;

  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity
        style={[styles.inputBox, innerStyle]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.selectedText, !value && styles.placeholderText, textStyle]}>
          {selectedLabel || placeholder}
        </Text>
        <AntDesign name="down" size={16} color="#555" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <FlatList
              data={items}
              keyExtractor={(item) => item.value.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => {
                    onValueChange(item.value);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.optionText}>{item.label}</Text>
                </TouchableOpacity>
              )}
              ListFooterComponent={<View style={{ height: 20 }} />}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 10,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    color: '#444',
  },
  inputBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedText: {
    fontSize: 16,
    color: '#000',
  },
  placeholderText: {
    color: '#888',
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '60%',
    paddingVertical: 12,
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
});
