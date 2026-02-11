import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import colors from "@/constants/colors";

export default function ModalScreen() {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={true}
      onRequestClose={() => router.back()}
    >
      <Pressable style={styles.overlay} onPress={() => router.back()}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Modal</Text>
          <Text style={styles.description}>
            This is an example modal. You can edit it in app/modal.tsx.
          </Text>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Pressable>

      <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    margin: 20,
    alignItems: "center",
    minWidth: 300,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
    color: colors.text,
    marginBottom: 16,
  },
  description: {
    textAlign: "center",
    marginBottom: 24,
    fontFamily: 'Nunito_400Regular',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  closeButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 100,
  },
  closeButtonText: {
    color: colors.white,
    fontFamily: 'Nunito_600SemiBold',
    textAlign: "center",
  },
});
