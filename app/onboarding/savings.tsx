import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/Button';
import colors from '@/constants/colors';
import { useOnboarding } from '@/context/OnboardingContext';

export default function Savings() {
  const router = useRouter();
  const { calculatedStats } = useOnboarding();

  const boomScale = useRef(new Animated.Value(0)).current;
  const boomRotate = useRef(new Animated.Value(0)).current;
  const totieScale = useRef(new Animated.Value(0)).current;
  const totieFloat = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0)).current;
  const yearCardScale = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  
  const savingsPulse = useRef(new Animated.Value(1)).current;
  
  const circle1Anim = useRef(new Animated.Value(0)).current;
  const circle2Anim = useRef(new Animated.Value(0)).current;
  const circle3Anim = useRef(new Animated.Value(0)).current;
  const circle4Anim = useRef(new Animated.Value(0)).current;
  
  const confetti1Anim = useRef(new Animated.Value(0)).current;
  const confetti2Anim = useRef(new Animated.Value(0)).current;
  const confetti3Anim = useRef(new Animated.Value(0)).current;
  const confetti4Anim = useRef(new Animated.Value(0)).current;
  const confetti5Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(circle1Anim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(circle1Anim, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(circle2Anim, {
          toValue: 1,
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(circle2Anim, {
          toValue: 0,
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(circle3Anim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(circle3Anim, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(circle4Anim, {
          toValue: 1,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(circle4Anim, {
          toValue: 0,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(totieFloat, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(totieFloat, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(savingsPulse, {
          toValue: 1.08,
          duration: 600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(savingsPulse, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    [confetti1Anim, confetti2Anim, confetti3Anim, confetti4Anim, confetti5Anim].forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 1500 + index * 200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 1500 + index * 200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Animated.sequence([
      Animated.parallel([
        Animated.spring(boomScale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 6,
          bounciness: 16,
        }),
        Animated.timing(boomRotate, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.back(2)),
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(totieScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 8,
        bounciness: 14,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 8,
        bounciness: 12,
      }),
      Animated.spring(yearCardScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 10,
        bounciness: 10,
      }),
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.backgroundPattern}>
        <Animated.View style={[styles.patternCircle, styles.circle1, {
          transform: [
            { translateX: circle1Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }) },
            { translateY: circle1Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 15] }) },
            { scale: circle1Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.2, 1] }) },
          ],
        }]} />
        <Animated.View style={[styles.patternCircle, styles.circle2, {
          transform: [
            { translateX: circle2Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -15] }) },
            { translateY: circle2Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }) },
            { scale: circle2Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.15, 1] }) },
          ],
        }]} />
        <Animated.View style={[styles.patternCircle, styles.circle3, {
          transform: [
            { translateX: circle3Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 18] }) },
            { translateY: circle3Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -12] }) },
          ],
        }]} />
        <Animated.View style={[styles.patternCircle, styles.circle4, {
          transform: [
            { translateX: circle4Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] }) },
            { translateY: circle4Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 10] }) },
            { scale: circle4Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.1, 1] }) },
          ],
        }]} />
      </View>
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.celebration}>
            <Animated.View style={[styles.boomBadge, {
              transform: [
                { scale: boomScale },
                { rotate: boomRotate.interpolate({ inputRange: [0, 1], outputRange: ['15deg', '-5deg'] }) },
              ],
            }]}>
              <Text style={styles.boomText}>BOOM!</Text>
            </Animated.View>
            
            <Animated.View style={{
              transform: [
                { scale: totieScale },
                { translateY: totieFloat.interpolate({ inputRange: [0, 1], outputRange: [0, -12] }) },
              ],
            }}>
              <Image
                source={{ uri: 'https://r2-pub.rork.com/attachments/7kh2kny7y4aoan2iczpas' }}
                style={styles.totie}
                resizeMode="contain"
              />
            </Animated.View>

            <Animated.View style={[styles.mainCard, {
              transform: [{ scale: cardScale }],
            }]}>
              <Text style={styles.mainLabel}>Cooking 3 meals per week</Text>
              <Animated.Text style={[styles.savingsAmount, {
                transform: [{ scale: savingsPulse }],
              }]}>${calculatedStats.monthlySavings}</Animated.Text>
              <Text style={styles.savingsLabel}>saved per month</Text>
            </Animated.View>
            
            <Animated.View style={[styles.yearCard, {
              transform: [{ scale: yearCardScale }],
            }]}>
              <Text style={styles.yearText}>That{"'"}s </Text>
              <Text style={styles.yearAmount}>${calculatedStats.yearlySavings.toLocaleString()}</Text>
              <Text style={styles.yearText}> per year! 💰</Text>
            </Animated.View>
          </View>

          <View style={styles.confettiContainer}>
            <Animated.Text style={[styles.confetti, styles.confetti1, {
              transform: [
                { translateY: confetti1Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] }) },
                { rotate: confetti1Anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '30deg'] }) },
                { scale: confetti1Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.3, 1] }) },
              ],
              opacity: confetti1Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.7, 1, 0.7] }),
            }]}>✨</Animated.Text>
            <Animated.Text style={[styles.confetti, styles.confetti2, {
              transform: [
                { translateY: confetti2Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -15] }) },
                { rotate: confetti2Anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-25deg'] }) },
                { scale: confetti2Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.4, 1] }) },
              ],
              opacity: confetti2Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 1, 0.6] }),
            }]}>🎉</Animated.Text>
            <Animated.Text style={[styles.confetti, styles.confetti3, {
              transform: [
                { translateY: confetti3Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -18] }) },
                { rotate: confetti3Anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '20deg'] }) },
                { scale: confetti3Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.2, 1] }) },
              ],
              opacity: confetti3Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 1, 0.5] }),
            }]}>⭐</Animated.Text>
            <Animated.Text style={[styles.confetti, styles.confetti4, {
              transform: [
                { translateY: confetti4Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -12] }) },
                { rotate: confetti4Anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-15deg'] }) },
              ],
              opacity: confetti4Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 1, 0.6] }),
            }]}>💫</Animated.Text>
            <Animated.Text style={[styles.confetti, styles.confetti5, {
              transform: [
                { translateY: confetti5Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -16] }) },
                { scale: confetti5Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.5, 1] }) },
              ],
              opacity: confetti5Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.7, 1, 0.7] }),
            }]}>🔥</Animated.Text>
          </View>

          <View style={styles.footer}>
            <Button
              title="Get my personal plan"
              onPress={() => router.push('/onboarding/loading')}
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
    backgroundColor: colors.comic.yellow,
  },
  backgroundPattern: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  patternCircle: {
    position: 'absolute',
    borderRadius: 200,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  circle1: {
    width: 200,
    height: 200,
    top: -50,
    left: -50,
  },
  circle2: {
    width: 150,
    height: 150,
    top: 100,
    right: -30,
  },
  circle3: {
    width: 100,
    height: 100,
    bottom: 200,
    left: -20,
  },
  circle4: {
    width: 180,
    height: 180,
    bottom: -40,
    right: -40,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  celebration: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
  },
  boomBadge: {
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.black,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 24,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  boomText: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: colors.white,
    letterSpacing: 2,
  },
  totie: {
    width: 180,
    height: 180,
    marginBottom: 20,
  },
  mainCard: {
    backgroundColor: colors.white,
    borderWidth: 3,
    borderColor: colors.black,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  mainLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  savingsAmount: {
    fontSize: 56,
    fontWeight: '900' as const,
    color: colors.primary,
    lineHeight: 60,
  },
  savingsLabel: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
  },
  yearCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  yearText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  yearAmount: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: colors.secondary,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  confetti: {
    position: 'absolute',
    fontSize: 28,
  },
  confetti1: {
    top: '12%',
    left: '8%',
  },
  confetti2: {
    top: '8%',
    right: '12%',
  },
  confetti3: {
    top: '35%',
    left: '5%',
  },
  confetti4: {
    top: '30%',
    right: '8%',
  },
  confetti5: {
    top: '55%',
    right: '15%',
  },
  footer: {
    paddingBottom: 32,
  },
});
