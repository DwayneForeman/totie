import React, { useCallback } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import colors from '@/constants/colors';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export default function Button({
  onPress,
  title,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  testID,
}: ButtonProps) {
  const isPrimary = variant === 'primary';

  const handlePress = useCallback(() => {
    console.log('[Button] PRESSED:', title, 'at', new Date().toISOString());
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {
      console.log('[Button] haptics error', e);
    }
    onPress();
  }, [onPress, title]);

  return (
    <TouchableOpacity
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      delayPressIn={0}
      style={[
        styles.button,
        isPrimary ? styles.primaryButton : styles.secondaryButton,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator color={isPrimary ? colors.white : colors.text} />
        ) : (
          <Text
            style={[
              styles.text,
              isPrimary ? styles.primaryText : styles.secondaryText,
            ]}
          >
            {title}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 32,
    borderWidth: 2,
    borderColor: colors.black,
    shadowColor: colors.black,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.white,
  },
  disabled: {
    opacity: 0.5,
    shadowOpacity: 0,
  },
  text: {
    fontSize: 17,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  primaryText: {
    color: colors.white,
  },
  secondaryText: {
    color: colors.text,
  },
});
