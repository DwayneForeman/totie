import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/Button';
import colors from '@/constants/colors';
import { useOnboarding } from '@/context/OnboardingContext';

export default function Comparison() {
  const router = useRouter();
  const { calculatedStats } = useOnboarding();

  const headerAnim = useRef(new Animated.Value(0)).current;
  const graphAnim = useRef(new Animated.Value(0)).current;
  const statAnim = useRef(new Animated.Value(0)).current;
  const totieAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  
  const deliveryLine1 = useRef(new Animated.Value(0)).current;
  const deliveryLine2 = useRef(new Animated.Value(0)).current;
  const deliveryLine3 = useRef(new Animated.Value(0)).current;
  const deliveryLine4 = useRef(new Animated.Value(0)).current;
  
  const homeLine1 = useRef(new Animated.Value(0)).current;
  const homeLine2 = useRef(new Animated.Value(0)).current;
  const homeLine3 = useRef(new Animated.Value(0)).current;
  const homeLine4 = useRef(new Animated.Value(0)).current;
  
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 1800);

    Animated.sequence([
      Animated.spring(headerAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 12,
        bounciness: 8,
      }),
      Animated.spring(graphAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 10,
        bounciness: 10,
      }),
      Animated.stagger(150, [
        Animated.spring(deliveryLine1, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 12 }),
        Animated.spring(deliveryLine2, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 12 }),
        Animated.spring(deliveryLine3, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 12 }),
        Animated.spring(deliveryLine4, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 12 }),
      ]),
      Animated.stagger(150, [
        Animated.spring(homeLine1, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 12 }),
        Animated.spring(homeLine2, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 12 }),
        Animated.spring(homeLine3, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 12 }),
        Animated.spring(homeLine4, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 12 }),
      ]),
      Animated.spring(statAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 8,
        bounciness: 12,
      }),
      Animated.parallel([
        Animated.spring(totieAnim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 10,
          bounciness: 10,
        }),
        Animated.timing(buttonAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [
    buttonAnim,
    deliveryLine1,
    deliveryLine2,
    deliveryLine3,
    deliveryLine4,
    floatAnim,
    graphAnim,
    headerAnim,
    homeLine1,
    homeLine2,
    homeLine3,
    homeLine4,
    pulseAnim,
    statAnim,
    totieAnim,
  ]);

  

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.topSection}>
            <Animated.Text style={[styles.headline, {
              opacity: headerAnim,
              transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
            }]}>
              What spending less &{"\n"}winning looks like 💅
            </Animated.Text>

            <Animated.View style={[styles.graphCard, {
              opacity: graphAnim,
              transform: [{ scale: graphAnim }],
            }]}>
              <View style={styles.graphHeader}>
                <Text style={styles.graphTitle}>Your spending over time</Text>
              </View>
              
              <View style={styles.graph}>
                <View style={styles.yAxis}>
                  <Text style={styles.axisLabel}>$$$</Text>
                  <Text style={styles.axisLabel}>$$</Text>
                  <Text style={styles.axisLabel}>$</Text>
                </View>
                
                <View style={styles.graphLines}>
                  <View style={[styles.gridLine, { top: '0%' }]} />
                  <View style={[styles.gridLine, { top: '50%' }]} />
                  <View style={[styles.gridLine, { top: '100%' }]} />
                  
                  <View style={styles.deliveryLine}>
                    <Animated.View style={[styles.lineDot, styles.lineDot1, { opacity: deliveryLine1, transform: [{ scale: deliveryLine1 }] }]} />
                    <Animated.View style={[styles.lineDot, styles.lineDot2, { opacity: deliveryLine2, transform: [{ scale: deliveryLine2 }] }]} />
                    <Animated.View style={[styles.lineDot, styles.lineDot3, { opacity: deliveryLine3, transform: [{ scale: deliveryLine3 }] }]} />
                    <Animated.View style={[styles.lineDot, styles.lineDot4, { opacity: deliveryLine4, transform: [{ scale: deliveryLine4 }] }]} />
                  </View>
                  
                  <View style={styles.homeLine}>
                    <Animated.View style={[styles.homeLineDot, styles.homeLineDot1, { opacity: homeLine1, transform: [{ scale: homeLine1 }] }]} />
                    <Animated.View style={[styles.homeLineDot, styles.homeLineDot2, { opacity: homeLine2, transform: [{ scale: homeLine2 }] }]} />
                    <Animated.View style={[styles.homeLineDot, styles.homeLineDot3, { opacity: homeLine3, transform: [{ scale: homeLine3 }] }]} />
                    <Animated.View style={[styles.homeLineDot, styles.homeLineDot4, { opacity: homeLine4, transform: [{ scale: homeLine4 }] }]} />
                  </View>
                </View>
              </View>

              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.comic.red }]} />
                  <Text style={styles.legendText}>Delivery spending</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                  <Text style={styles.legendText}>With us</Text>
                </View>
              </View>
            </Animated.View>

            <View style={styles.statWithTotie}>
              <Animated.View style={[styles.statCard, {
                opacity: statAnim,
                transform: [{ scale: Animated.multiply(statAnim, pulseAnim) }],
              }]}>
                <Text style={styles.statPercent}>{calculatedStats.switchedPercent}%</Text>
                <Text style={styles.statText}>of our users cut their{'\n'}delivery spending in half</Text>
              </Animated.View>

              <Animated.View pointerEvents="none" style={[styles.totieFloating, {
                opacity: totieAnim,
                transform: [
                  { scale: totieAnim },
                  { translateY: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) },
                ],
              }]}>
                <Image
                  source={{ uri: 'https://r2-pub.rork.com/attachments/7kh2kny7y4aoan2iczpas' }}
                  style={styles.totie}
                  resizeMode="contain"
                />
                <View style={styles.thumbsUpBubble}>
                  <Text style={styles.thumbsUpText}>👍</Text>
                </View>
              </Animated.View>
            </View>

            <Animated.View style={[styles.savingsPreview, {
              opacity: buttonAnim,
              transform: [{ translateY: buttonAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            }]}>
              <View style={styles.savingsRow}>
                <Text style={styles.savingsLabel}>Your potential monthly savings</Text>
                <Text style={styles.savingsAmount}>${calculatedStats.monthlySavings}</Text>
              </View>
              <View style={styles.savingsDivider} />
              <View style={styles.savingsRow}>
                <Text style={styles.savingsLabel}>That is yearly</Text>
                <Text style={styles.savingsYearly}>${calculatedStats.yearlySavings.toLocaleString()}</Text>
              </View>
            </Animated.View>

          </View>
        </View>

        <View style={styles.footer}>
          <Button
            title="Nice 😎"
            onPress={() => router.push('/onboarding/features')}
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

  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topSection: {
    paddingTop: 16,
  },
  headline: {
    fontSize: 26,
    fontWeight: '800' as const,
    lineHeight: 34,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  graphCard: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  graphHeader: {
    marginBottom: 14,
  },
  graphTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  graph: {
    flexDirection: 'row',
    height: 110,
    marginBottom: 14,
  },
  yAxis: {
    width: 30,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  axisLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500' as const,
  },
  graphLines: {
    flex: 1,
    position: 'relative',
    marginLeft: 8,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.border,
  },
  deliveryLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  lineDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.comic.red,
    borderWidth: 2,
    borderColor: colors.white,
  },
  lineDot1: { left: '0%', top: '60%' },
  lineDot2: { left: '30%', top: '40%' },
  lineDot3: { left: '60%', top: '20%' },
  lineDot4: { left: '90%', top: '5%' },
  homeLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  homeLineDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.white,
  },
  homeLineDot1: { left: '0%', top: '60%' },
  homeLineDot2: { left: '30%', top: '62%' },
  homeLineDot3: { left: '60%', top: '65%' },
  homeLineDot4: { left: '90%', top: '68%' },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  statCard: {
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  statPercent: {
    fontSize: 36,
    fontWeight: '900' as const,
    color: colors.primary,
    marginRight: 16,
  },
  statText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
    lineHeight: 22,
  },
  statWithTotie: {
    position: 'relative',
    marginBottom: 100,
  },
  totieFloating: {
    position: 'absolute',
    right: 10,
    bottom: -110,
    alignItems: 'center',
    zIndex: -1,
  },
  totie: {
    width: 100,
    height: 100,
  },
  thumbsUpBubble: {
    position: 'absolute',
    left: -5,
    top: 0,
    backgroundColor: colors.comic.yellow,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 18,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  thumbsUpText: {
    fontSize: 20,
  },
  savingsPreview: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  savingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savingsLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  savingsAmount: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: colors.success,
  },
  savingsDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  savingsYearly: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.primary,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    position: 'relative',
    zIndex: 50,
    elevation: 50,
  },
});
