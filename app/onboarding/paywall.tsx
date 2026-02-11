import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Easing, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Button from '@/components/Button';
import colors from '@/constants/colors';
import { Check, Lock, Crown } from 'lucide-react-native';
import { useApp } from '@/context/AppContext';

const FEATURES = [
  { name: 'Basic pantry tracking', free: true, premium: true },
  { name: 'Save recipes from links', free: false, premium: true },
  { name: 'Screenshot → DIY recipe', free: false, premium: true },
  { name: 'AI fridge scanning', free: false, premium: true },
  { name: 'Smart grocery lists', free: false, premium: true },
  { name: 'Unlimited recipe storage', free: false, premium: true },
  { name: 'Savings tracker & stats', free: false, premium: true },
];

export default function Paywall() {
  const router = useRouter();
  const { upgradeToPremium } = useApp();

  const headerAnim = useRef(new Animated.Value(0)).current;
  const totieAnim = useRef(new Animated.Value(0)).current;
  const tableAnim = useRef(new Animated.Value(0)).current;
  const plansAnim = useRef(new Animated.Value(0)).current;
  const buttonsAnim = useRef(new Animated.Value(0)).current;

  const floatAnim = useRef(new Animated.Value(0)).current;
  const crownAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(crownAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(crownAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.sequence([
      Animated.parallel([
        Animated.spring(headerAnim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 12,
          bounciness: 8,
        }),
        Animated.spring(totieAnim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 10,
          bounciness: 12,
        }),
      ]),
      Animated.spring(tableAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 10,
        bounciness: 8,
      }),
      Animated.spring(plansAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 10,
        bounciness: 8,
      }),
      Animated.timing(buttonsAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSubscribe = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await upgradeToPremium();
    router.push('/onboarding/review-request');
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/onboarding/review-request');
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.header, {
            opacity: headerAnim,
            transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
          }]}>
            <Text style={styles.headline}>Unlock the{'\n'}full kitchen</Text>
          </Animated.View>

          <Animated.View style={[styles.totieSection, {
            opacity: totieAnim,
            transform: [
              { scale: totieAnim },
              { translateY: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) },
            ],
          }]}>
            <Image
              source={{ uri: 'https://r2-pub.rork.com/attachments/7kh2kny7y4aoan2iczpas' }}
              style={styles.totie}
              resizeMode="contain"
            />
            <Animated.View style={[styles.crownBadge, {
              transform: [
                { rotate: crownAnim.interpolate({ inputRange: [0, 1], outputRange: ['-5deg', '5deg'] }) },
                { scale: crownAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.1, 1] }) },
              ],
            }]}>
              <Crown size={20} color={colors.comic.yellow} fill={colors.comic.yellow} />
            </Animated.View>
          </Animated.View>

          <Animated.View style={[styles.tableCard, {
            opacity: tableAnim,
            transform: [{ scale: tableAnim }],
          }]}>
            <View style={styles.tableHeader}>
              <View style={styles.tableHeaderCell} />
              <Text style={styles.tableHeaderText}>Free</Text>
              <View style={styles.premiumHeader}>
                <Text style={styles.premiumHeaderText}>Premium</Text>
              </View>
            </View>

            {FEATURES.map((feature, index) => (
              <View key={index} style={[styles.tableRow, index === FEATURES.length - 1 && styles.tableRowLast]}>
                <Text style={styles.featureName}>{feature.name}</Text>
                <View style={styles.tableCell}>
                  {feature.free ? (
                    <Check size={18} color={colors.primary} strokeWidth={3} />
                  ) : (
                    <Lock size={16} color={colors.textMuted} strokeWidth={2} />
                  )}
                </View>
                <View style={[styles.tableCell, styles.premiumCell]}>
                  <Check size={18} color={colors.primary} strokeWidth={3} />
                </View>
              </View>
            ))}
          </Animated.View>

          <Animated.View style={[styles.planSection, {
            opacity: plansAnim,
            transform: [{ translateY: plansAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
          }]}>
            <View style={styles.planCard}>
              <View style={styles.planBadge}>
                <Text style={styles.planBadgeText}>7-DAY FREE TRIAL</Text>
              </View>
              <View style={styles.planContent}>
                <View style={styles.planInfo}>
                  <Text style={styles.planLabel}>Monthly Premium</Text>
                  <Text style={styles.planSubLabel}>Full access to everything</Text>
                </View>
                <View style={styles.planPricing}>
                  <Text style={styles.planPrice}>$9.99</Text>
                  <Text style={styles.planPeriod}>/month</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          <Animated.View style={[styles.trustSection, { opacity: buttonsAnim }]}>
            <Text style={styles.trustItem}>✓ Cancel anytime</Text>
            <Text style={styles.trustItem}>✓ 7-day free trial</Text>
          </Animated.View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Start Free Trial"
            onPress={handleSubscribe}
          />
          <Pressable onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Continue with Free</Text>
          </Pressable>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    flexGrow: 1,
  },
  header: {
    marginBottom: 16,
  },
  headline: {
    fontSize: 30,
    fontWeight: '900' as const,
    lineHeight: 38,
    color: colors.text,
    textAlign: 'center',
  },
  totieSection: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  totie: {
    width: 80,
    height: 80,
  },
  crownBadge: {
    position: 'absolute',
    top: -10,
    right: '32%',
    backgroundColor: colors.black,
    borderRadius: 20,
    padding: 8,
  },
  tableCard: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.black,
    backgroundColor: colors.backgroundWarm,
  },
  tableHeaderCell: {
    flex: 1,
    padding: 12,
  },
  tableHeaderText: {
    width: 60,
    fontSize: 13,
    fontWeight: '700' as const,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  premiumHeader: {
    width: 80,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  premiumHeaderText: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: colors.white,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  featureName: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.text,
  },
  tableCell: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  premiumCell: {
    width: 80,
    backgroundColor: colors.primaryLight,
  },
  planSection: {
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 16,
    padding: 18,
    position: 'relative',
  },
  planBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    left: '50%',
    marginLeft: -70,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  planBadgeText: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: colors.white,
    letterSpacing: 0.5,
  },
  planContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  planInfo: {
    flex: 1,
  },
  planLabel: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: colors.text,
  },
  planSubLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    marginTop: 2,
  },
  planPricing: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: colors.text,
  },
  planPeriod: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  trustSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 16,
  },
  trustItem: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    gap: 8,
  },
  skipButton: {
    alignItems: 'center',
    padding: 10,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
});
