import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/Button';
import ProgressBar from '@/components/ProgressBar';
import colors from '@/constants/colors';
import { TrendingUp, TrendingDown, Users, DollarSign } from 'lucide-react-native';
import { useOnboarding } from '@/context/OnboardingContext';

export default function SpendingStats() {
  const router = useRouter();
  const { calculatedStats } = useOnboarding();
  
  const headerAnim = useRef(new Animated.Value(0)).current;
  const card1Anim = useRef(new Animated.Value(0)).current;
  const card2Anim = useRef(new Animated.Value(0)).current;
  const card3Anim = useRef(new Animated.Value(0)).current;
  const insightAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const barAnim1 = useRef(new Animated.Value(0)).current;
  const barAnim2 = useRef(new Animated.Value(0)).current;
  const barAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 800);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 1600);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 2400);
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 3200);

    Animated.sequence([
      Animated.spring(headerAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 12,
        bounciness: 8,
      }),
      Animated.parallel([
        Animated.spring(card1Anim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 10,
          bounciness: 10,
        }),
        Animated.timing(barAnim1, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]),
      Animated.parallel([
        Animated.spring(card2Anim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 10,
          bounciness: 10,
        }),
        Animated.timing(barAnim2, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]),
      Animated.parallel([
        Animated.spring(card3Anim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 10,
          bounciness: 10,
        }),
        Animated.timing(barAnim3, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]),
      Animated.spring(insightAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 8,
        bounciness: 12,
      }),
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const barWidth1 = barAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', `${calculatedStats.deliveryBarPercent}%`],
  });

  const barWidth2 = barAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', `${calculatedStats.cookingBarPercent}%`],
  });

  const barWidth3 = barAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', `${calculatedStats.switchedPercent}%`],
  });

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.progressWrap}>
          <ProgressBar progress={4} total={12} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          <Animated.Text style={[styles.headline, {
            opacity: headerAnim,
            transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
          }]}>
            Based on your{'\n'}answers...
          </Animated.Text>

          <View style={styles.statsContainer}>
            <Animated.View style={[styles.statCard, {
              opacity: card1Anim,
              transform: [
                { scale: card1Anim },
                { translateX: card1Anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) },
              ],
            }]}>
              <View style={styles.statHeader}>
                <View style={[styles.iconWrap, { backgroundColor: '#FFEBEE' }]}>
                  <TrendingUp size={20} color="#E53935" strokeWidth={2.5} />
                </View>
                <Text style={styles.statLabel}>Avg delivery spend</Text>
              </View>
              <View style={styles.barContainer}>
                <Animated.View style={[styles.bar, styles.barRed, { width: barWidth1 }]} />
              </View>
              <Text style={styles.statValue}>${calculatedStats.monthlyDeliverySpend}/month</Text>
              <Text style={styles.statNote}>for people like you</Text>
            </Animated.View>

            <Animated.View style={[styles.statCard, {
              opacity: card2Anim,
              transform: [
                { scale: card2Anim },
                { translateX: card2Anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
              ],
            }]}>
              <View style={styles.statHeader}>
                <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight }]}>
                  <TrendingDown size={20} color={colors.primary} strokeWidth={2.5} />
                </View>
                <Text style={styles.statLabel}>With home cooking</Text>
              </View>
              <View style={styles.barContainer}>
                <Animated.View style={[styles.bar, styles.barGreen, { width: barWidth2 }]} />
              </View>
              <Text style={[styles.statValue, { color: colors.primary }]}>${calculatedStats.monthlyCookingCost}/month</Text>
              <Text style={styles.statNote}>same meals, way less</Text>
            </Animated.View>

            <Animated.View style={[styles.statCard, {
              opacity: card3Anim,
              transform: [
                { scale: card3Anim },
                { translateX: card3Anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) },
              ],
            }]}>
              <View style={styles.statHeader}>
                <View style={[styles.iconWrap, { backgroundColor: '#FFF3E0' }]}>
                  <Users size={20} color="#E65100" strokeWidth={2.5} />
                </View>
                <Text style={styles.statLabel}>Users who switched</Text>
              </View>
              <View style={styles.barContainer}>
                <Animated.View style={[styles.bar, styles.barOrange, { width: barWidth3 }]} />
              </View>
              <Text style={styles.statValue}>{calculatedStats.switchedPercent}%</Text>
              <Text style={styles.statNote}>reduced delivery by half</Text>
            </Animated.View>
          </View>

          <Animated.View style={[styles.insightCard, {
            opacity: insightAnim,
            transform: [{ scale: Animated.multiply(insightAnim, pulseAnim) }],
          }]}>
            <DollarSign size={24} color={colors.comic.yellow} strokeWidth={3} />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>You could save</Text>
              <Text style={styles.insightAmount}>${calculatedStats.monthlySavings}/month</Text>
            </View>
          </Animated.View>

          <View style={styles.footer}>
            <Button
              title="Show me how 💰"
              onPress={() => router.push('/onboarding/pain-points')}
            />
          </View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    flexGrow: 1,
  },
  headline: {
    fontSize: 28,
    fontWeight: '900' as const,
    lineHeight: 36,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  statsContainer: {
    gap: 14,
  },
  statCard: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 18,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  statLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  barContainer: {
    height: 10,
    backgroundColor: colors.border,
    borderRadius: 5,
    marginBottom: 8,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 5,
  },
  barRed: {
    backgroundColor: '#E53935',
  },
  barGreen: {
    backgroundColor: colors.primary,
  },
  barOrange: {
    backgroundColor: '#E65100',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: colors.text,
  },
  statNote: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.textMuted,
  },
  insightCard: {
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.black,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  insightContent: {
    marginLeft: 14,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.white,
    opacity: 0.9,
  },
  insightAmount: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: colors.white,
  },
  footer: {
    marginTop: 'auto' as const,
    paddingTop: 24,
    paddingBottom: 32,
  },
});
