import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/Button';
import ProgressBar from '@/components/ProgressBar';
import colors from '@/constants/colors';
import { useOnboarding } from '@/context/OnboardingContext';
import { Check } from 'lucide-react-native';

const PAIN_POINTS = [
  { id: 'dont-know', emoji: '🤷', label: 'I don\'t know what I have at home' },
  { id: 'overwhelming', emoji: '😫', label: 'Grocery shopping feels overwhelming' },
  { id: 'forget', emoji: '📱', label: 'I save recipes but forget about them' },
  { id: 'start', emoji: '🍳', label: 'I don\'t know where to start' },
  { id: 'delivery', emoji: '🛵', label: 'I order delivery too much' },
  { id: 'time', emoji: '⏰', label: 'I don\'t have enough time' },
];

export default function PainPoints() {
  const router = useRouter();
  const { updateOnboardingData } = useOnboarding();
  const [selected, setSelected] = useState<string[]>([]);

  const toggleSelection = (id: string) => {
    setSelected(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleNext = () => {
    updateOnboardingData({ painPoints: selected });
    router.push('/onboarding/exciting');
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.progressWrap}>
          <ProgressBar progress={4} total={12} />
        </View>
        
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" nestedScrollEnabled={true} bounces={true}>
          <View style={styles.header}>
            <Image
              source={{ uri: 'https://r2-pub.rork.com/attachments/7kh2kny7y4aoan2iczpas' }}
              style={styles.totie}
              resizeMode="contain"
            />
            <View style={styles.speechBubbleWrap}>
              <View style={styles.speechTail}>
                <View style={styles.speechTailInner} />
              </View>
              <View style={styles.speechBubble}>
                <Text style={styles.question}>What&apos;s holding you back from cooking more?</Text>
                <Text style={styles.hint}>Select all that apply</Text>
              </View>
            </View>
          </View>

          <View style={styles.options}>
            {PAIN_POINTS.map(point => (
              <Pressable
                key={point.id}
                style={[
                  styles.optionCard,
                  selected.includes(point.id) && styles.optionCardSelected
                ]}
                onPress={() => toggleSelection(point.id)}
              >
                <Text style={styles.optionEmoji}>{point.emoji}</Text>
                <Text style={[
                  styles.optionLabel,
                  selected.includes(point.id) && styles.optionLabelSelected
                ]}>
                  {point.label}
                </Text>
                <View style={[
                  styles.checkbox,
                  selected.includes(point.id) && styles.checkboxSelected
                ]}>
                  {selected.includes(point.id) && (
                    <Check size={14} color={colors.white} strokeWidth={3} />
                  )}
                </View>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.skipButton} onPress={handleNext}>
            <Text style={styles.skipText}>Nothing from above</Text>
          </Pressable>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Next"
            onPress={handleNext}
            disabled={selected.length === 0}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  progressWrap: {
    paddingHorizontal: 24,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
    marginBottom: 24,
    gap: 8,
  },
  totie: {
    width: 70,
    height: 70,
    marginTop: 8,
  },
  speechBubbleWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  speechTail: {
    width: 12,
    height: 20,
    marginTop: 14,
    marginRight: -1,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  speechTailInner: {
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderTopColor: 'transparent',
    borderBottomWidth: 8,
    borderBottomColor: 'transparent',
    borderRightWidth: 10,
    borderRightColor: colors.black,
  },
  speechBubble: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: colors.black,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
    elevation: 2,
  },
  question: {
    fontSize: 18,
    fontWeight: '700' as const,
    lineHeight: 26,
    color: colors.text,
  },
  hint: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  options: {
    marginBottom: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  optionEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  optionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  optionLabelSelected: {
    color: colors.primary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
});
