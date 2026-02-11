import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/Button';
import SelectionCard from '@/components/SelectionCard';
import ProgressBar from '@/components/ProgressBar';
import { useOnboarding } from '@/context/OnboardingContext';
import colors from '@/constants/colors';

export default function Diet() {
  const router = useRouter();
  const { updateOnboardingData } = useOnboarding();
  const [selected, setSelected] = useState<string>('Balanced');

  const handleNext = () => {
    updateOnboardingData({ diet: selected });
    router.push('/onboarding/household');
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.progressWrap}>
          <ProgressBar progress={3} total={5} />
        </View>
        
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
                <Text style={styles.question}>Any dietary preferences?</Text>
              </View>
            </View>
          </View>

          <View style={styles.options}>
            <SelectionCard
              emoji="🍽️"
              title="Balanced (no restrictions)"
              selected={selected === 'Balanced'}
              onPress={() => setSelected('Balanced')}
            />
            <SelectionCard
              emoji="🥬"
              title="Vegetarian"
              selected={selected === 'Vegetarian'}
              onPress={() => setSelected('Vegetarian')}
            />
            <SelectionCard
              emoji="🌱"
              title="Vegan"
              selected={selected === 'Vegan'}
              onPress={() => setSelected('Vegan')}
            />
            <SelectionCard
              emoji="🥩"
              title="Paleo"
              selected={selected === 'Paleo'}
              onPress={() => setSelected('Paleo')}
            />
            <SelectionCard
              emoji="🥑"
              title="Keto"
              selected={selected === 'Keto'}
              onPress={() => setSelected('Keto')}
            />
            <SelectionCard
              emoji="💪"
              title="High protein"
              selected={selected === 'High protein'}
              onPress={() => setSelected('High protein')}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Next"
            onPress={handleNext}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
    marginBottom: 32,
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
    fontSize: 20,
    fontWeight: '700' as const,
    lineHeight: 28,
    color: colors.text,
  },
  options: {
    marginBottom: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
});
