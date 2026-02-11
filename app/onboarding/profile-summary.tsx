import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/Button';
import colors from '@/constants/colors';
import { useOnboarding } from '@/context/OnboardingContext';

export default function ProfileSummary() {
  const router = useRouter();
  const { onboardingData, calculatedStats } = useOnboarding();

  const displayData = useMemo(() => {
    const dietMap: Record<string, string> = {
      'Balanced': 'Balanced',
      'Vegetarian': 'Vegetarian',
      'Vegan': 'Vegan',
      'Keto': 'Keto',
      'Paleo': 'Paleo',
      'High protein': 'High protein',
      '': 'Balanced',
    };

    const weeklySpendMap: Record<string, string> = {
      '0-25': '~$25/week',
      '25-50': '~$50/week',
      '50-100': '~$75/week',
      '100+': '~$100+/week',
    };

    const householdMap: Record<string, string> = {
      '1': '1 person',
      '2': '2 people',
      '3-4': '3-4 people',
      '5+': '5+ people',
    };

    const goalMap: Record<string, string> = {
      'what-i-have': 'Use what I have',
      'delivery-to-diy': 'DIY cravings',
      'organize': 'Get organized',
      'grocery': 'Smarter shopping',
    };

    return {
      diet: dietMap[onboardingData.diet || ''] || 'Balanced',
      deliverySpend: weeklySpendMap[onboardingData.weeklySpend || ''] || '~$50/week',
      household: householdMap[onboardingData.householdSize || ''] || '2 people',
      goal: goalMap[onboardingData.mostExciting || ''] || 'Cook more',
    };
  }, [onboardingData]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.topSection}>
            <View style={styles.headerRow}>
              <Image
                source={{ uri: 'https://r2-pub.rork.com/attachments/7kh2kny7y4aoan2iczpas' }}
                style={styles.totie}
                resizeMode="contain"
              />
              <View style={styles.sparkles}>
                <Text style={styles.sparkle}>✨</Text>
                <Text style={styles.sparkle}>💫</Text>
              </View>
            </View>

            <Text style={styles.headline}>Your Kitchen Profile</Text>

            <View style={styles.profileCard}>
              <View style={styles.profileRow}>
                <Text style={styles.profileEmoji}>🍽️</Text>
                <Text style={styles.profileLabel}>Diet</Text>
                <Text style={styles.profileValue}>{displayData.diet}</Text>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.profileRow}>
                <Text style={styles.profileEmoji}>🛵</Text>
                <Text style={styles.profileLabel}>Delivery spend</Text>
                <Text style={styles.profileValue}>{displayData.deliverySpend}</Text>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.profileRow}>
                <Text style={styles.profileEmoji}>👥</Text>
                <Text style={styles.profileLabel}>Household</Text>
                <Text style={styles.profileValue}>{displayData.household}</Text>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.profileRow}>
                <Text style={styles.profileEmoji}>🎯</Text>
                <Text style={styles.profileLabel}>Goal</Text>
                <Text style={styles.profileValue}>{displayData.goal}</Text>
              </View>
            </View>

            <View style={styles.savingsPreview}>
              <Text style={styles.savingsLabel}>Estimated monthly savings</Text>
              <View style={styles.savingsAmountRow}>
                <Text style={styles.savingsAmount}>~${calculatedStats.monthlySavings}</Text>
                <Text style={styles.savingsEmoji}>💰</Text>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <Button
              title="See my plan"
              onPress={() => router.push('/onboarding/savings')}
            />
          </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  topSection: {
    flex: 1,
    paddingTop: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  totie: {
    width: 100,
    height: 100,
  },
  sparkles: {
    position: 'absolute',
    right: 60,
    top: -10,
    flexDirection: 'row',
    gap: 8,
  },
  sparkle: {
    fontSize: 24,
  },
  headline: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  profileCard: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: colors.black,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  profileEmoji: {
    fontSize: 24,
    width: 36,
  },
  profileLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  profileValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  savingsPreview: {
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  savingsLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  savingsAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  savingsAmount: {
    fontSize: 40,
    fontWeight: '900' as const,
    color: colors.primary,
  },
  savingsEmoji: {
    fontSize: 32,
  },
  footer: {
    paddingBottom: 32,
  },
});
