import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/Button';
import ProgressBar from '@/components/ProgressBar';
import { useApp } from '@/context/AppContext';
import { useOnboarding } from '@/context/OnboardingContext';
import colors from '@/constants/colors';

export default function Name() {
  const router = useRouter();
  const { completeOnboarding } = useApp();
  const { onboardingData } = useOnboarding();
  const [name, setName] = useState<string>('');

  const handleComplete = async () => {
    if (name.trim()) {
      await completeOnboarding({
        eatingHabits: onboardingData.eatingHabits || 'delivery',
        deliveryFrequency: onboardingData.deliveryFrequency || '3-4',
        weeklySpend: onboardingData.weeklySpend || '50-100',
        painPoints: onboardingData.painPoints || [],
        mostExciting: onboardingData.mostExciting || 'what-i-have',
        diet: onboardingData.diet || 'Balanced',
        allergies: onboardingData.allergies || [],
        householdSize: onboardingData.householdSize || '1',
        userName: name.trim(),
      });
      router.replace('/home');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.inner}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.progressWrap}>
            <ProgressBar progress={5} total={5} />
          </View>
          
          <View style={styles.content}>
            <View style={styles.topSection}>
              <Text style={styles.headline}>Almost there!</Text>
              
              <View style={styles.questionSection}>
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
                  <Text style={styles.question}>What should I call you?</Text>
                </View>
              </View>
              </View>

              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  placeholder="Your name"
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={setName}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleComplete}
                />
              </View>
            </View>

            <View style={styles.footer}>
              <Button
                title="Let's cook! 🍳"
                onPress={handleComplete}
                disabled={!name.trim()}
              />
            </View>
          </View>
        </SafeAreaView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  progressWrap: {
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  topSection: {
    flex: 1,
    paddingTop: 24,
  },
  headline: {
    fontSize: 32,
    fontWeight: '800' as const,
    lineHeight: 40,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 32,
  },
  questionSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 32,
  },
  totie: {
    width: 80,
    height: 80,
  },
  speechBubbleWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginBottom: 12,
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
  inputWrap: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.black,
    overflow: 'hidden',
  },
  input: {
    padding: 18,
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
  },
  footer: {
    paddingBottom: 32,
  },
});
