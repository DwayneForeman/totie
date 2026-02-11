import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/Button';
import SelectionCard from '@/components/SelectionCard';
import ProgressBar from '@/components/ProgressBar';
import colors from '@/constants/colors';
import { useOnboarding } from '@/context/OnboardingContext';

type Spend = '0-25' | '25-50' | '50-100' | '100+' | null;

export default function WeeklySpend() {
  const router = useRouter();
  const { updateOnboardingData } = useOnboarding();
  const [selected, setSelected] = useState<Spend>(null);

  const handleNext = () => {
    if (selected) {
      updateOnboardingData({ weeklySpend: selected });
      router.push('/onboarding/spending-stats');
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.progressWrap}>
          <ProgressBar progress={2} total={5} />
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
                <Text style={styles.question}>How much do you spend on delivery per week?</Text>
              </View>
            </View>
          </View>

          <View style={styles.options}>
            <SelectionCard
              emoji="💵"
              title="$0 - $25"
              selected={selected === '0-25'}
              onPress={() => setSelected('0-25')}
            />
            <SelectionCard
              emoji="💰"
              title="$25 - $50"
              selected={selected === '25-50'}
              onPress={() => setSelected('25-50')}
            />
            <SelectionCard
              emoji="💸"
              title="$50 - $100"
              selected={selected === '50-100'}
              onPress={() => setSelected('50-100')}
            />
            <SelectionCard
              emoji="🤑"
              title="$100+"
              selected={selected === '100+'}
              onPress={() => setSelected('100+')}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Next"
            onPress={handleNext}
            disabled={!selected}
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
