import React, { useCallback } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import colors from '@/constants/colors';

interface SelectionCardProps {
  title: string;
  subtitle?: string;
  emoji?: string;
  selected: boolean;
  onPress: () => void;
  multiSelect?: boolean;
}

export default function SelectionCard({ 
  title, 
  subtitle,
  emoji, 
  selected, 
  onPress,
}: SelectionCardProps) {
  const handlePress = useCallback(() => {
    console.log('[SelectionCard] PRESSED:', title, 'at', new Date().toISOString());
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  }, [onPress, title]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      delayPressIn={0}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={title}
      style={[
        styles.card,
        selected && styles.cardSelected,
      ]}
    >
      <View style={styles.content}>
        {emoji && (
          <View style={[styles.emojiWrap, selected && styles.emojiWrapSelected]}>
            <Text style={styles.emoji}>{emoji}</Text>
          </View>
        )}
        <View style={styles.textContent}>
          <Text style={[styles.title, selected && styles.titleSelected]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, selected && styles.subtitleSelected]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <Check size={16} color={colors.white} strokeWidth={3} />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.borderLight,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emojiWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.cardAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  emojiWrapSelected: {
    backgroundColor: colors.white,
  },
  emoji: {
    fontSize: 22,
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  titleSelected: {
    color: colors.primary,
    fontWeight: '700' as const,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    marginTop: 2,
  },
  subtitleSelected: {
    color: colors.primary,
    opacity: 0.8,
  },
  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  radioSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});
