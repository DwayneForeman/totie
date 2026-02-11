import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/Button';
import colors from '@/constants/colors';

export default function Hook() {
  const router = useRouter();

  const totieScale = useRef(new Animated.Value(0)).current;
  const totieFloat = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0)).current;
  const cardRotate = useRef(new Animated.Value(0)).current;
  const headlineOpacity = useRef(new Animated.Value(0)).current;
  const headlineTranslate = useRef(new Animated.Value(20)).current;
  const subtextOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  
  const circle1Anim = useRef(new Animated.Value(0)).current;
  const circle2Anim = useRef(new Animated.Value(0)).current;
  const questionAnim = useRef(new Animated.Value(0)).current;
  
  const numberPulse = useRef(new Animated.Value(1)).current;
  
  const sharpieOpacity = useRef(new Animated.Value(0)).current;
  const sharpieScale = useRef(new Animated.Value(0.5)).current;
  const sharpieWiggle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(circle1Anim, {
          toValue: 1,
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(circle1Anim, {
          toValue: 0,
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(circle2Anim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(circle2Anim, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(totieFloat, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(totieFloat, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(questionAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(questionAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(numberPulse, {
          toValue: 1.1,
          duration: 800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(numberPulse, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(sharpieWiggle, {
          toValue: 1,
          duration: 150,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(sharpieWiggle, {
          toValue: -1,
          duration: 150,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(sharpieWiggle, {
          toValue: 0,
          duration: 150,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.delay(3000),
      ])
    ).start();

    // Explosive haptic burst when Totie appears
    const triggerExplosiveHaptics = async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await new Promise(resolve => setTimeout(resolve, 60));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await new Promise(resolve => setTimeout(resolve, 60));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await new Promise(resolve => setTimeout(resolve, 100));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };
    triggerExplosiveHaptics();

    Animated.sequence([
      Animated.spring(totieScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 8,
        bounciness: 12,
      }),
      Animated.delay(100),
      Animated.parallel([
        Animated.spring(cardScale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 10,
          bounciness: 10,
        }),
        Animated.timing(cardRotate, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.back(2)),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(sharpieOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(sharpieScale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 8,
          bounciness: 10,
        }),
      ]),
      Animated.delay(100),
      Animated.parallel([
        Animated.timing(headlineOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(headlineTranslate, {
          toValue: 0,
          useNativeDriver: true,
          speed: 12,
          bounciness: 6,
        }),
      ]),
      Animated.timing(subtextOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [
    buttonOpacity,
    cardRotate,
    cardScale,
    circle1Anim,
    circle2Anim,
    headlineOpacity,
    headlineTranslate,
    numberPulse,
    questionAnim,
    sharpieOpacity,
    sharpieScale,
    sharpieWiggle,
    subtextOpacity,
    totieFloat,
    totieScale,
  ]);

  return (
    <View style={styles.container}>
      <View style={styles.bgPattern} pointerEvents="none">
        <Animated.View style={[styles.decorCircle, {
          transform: [
            { translateX: circle1Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 15] }) },
            { translateY: circle1Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }) },
            { scale: circle1Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.15, 1] }) },
          ],
        }]} />
        <Animated.View style={[styles.decorCircle2, {
          transform: [
            { translateX: circle2Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] }) },
            { translateY: circle2Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 15] }) },
            { scale: circle2Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.1, 1] }) },
          ],
        }]} />
        
        <Animated.Text style={[styles.floatingQuestion, styles.q1, {
          transform: [
            { translateY: questionAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) },
            { rotate: questionAnim.interpolate({ inputRange: [0, 1], outputRange: ['-5deg', '5deg'] }) },
          ],
          opacity: questionAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.4, 0.8, 0.4] }),
        }]}>?</Animated.Text>
        <Animated.Text style={[styles.floatingQuestion, styles.q2, {
          transform: [
            { translateY: questionAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 12] }) },
            { rotate: questionAnim.interpolate({ inputRange: [0, 1], outputRange: ['10deg', '-10deg'] }) },
          ],
          opacity: questionAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 0.7, 0.3] }),
        }]}>?</Animated.Text>
        <Animated.Text style={[styles.floatingQuestion, styles.q3, {
          transform: [
            { translateY: questionAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) },
            { scale: questionAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.2, 1] }) },
          ],
          opacity: questionAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 0.9, 0.5] }),
        }]}>?</Animated.Text>
      </View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.topSection}>
            <Animated.View style={{
              transform: [
                { scale: totieScale },
                { translateY: totieFloat.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) },
              ],
            }}>
              <Image
                source={{ uri: 'https://r2-pub.rork.com/attachments/7kh2kny7y4aoan2iczpas' }}
                style={styles.totie}
                resizeMode="contain"
              />
            </Animated.View>
            
            <View style={styles.statCardContainer}>
              <Animated.View style={[styles.sharpieAnnotation, {
                opacity: sharpieOpacity,
                transform: [
                  { scale: sharpieScale },
                  { rotate: sharpieWiggle.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-3deg', '-8deg', '-13deg'] }) },
                ],
              }]}>
                <Text style={styles.sharpieText}>is this you?</Text>
                <Text style={styles.sharpieArrow}>↘</Text>
              </Animated.View>
              
              <Animated.View style={[styles.statCard, {
                transform: [
                  { scale: cardScale },
                  { rotate: cardRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-2deg'] }) },
                ],
              }]}>
                <Animated.Text style={[styles.statNumber, { transform: [{ scale: numberPulse }] }]}>47</Animated.Text>
                <Text style={styles.statLabel}>recipes saved</Text>
              </Animated.View>
            </View>
            
            <Animated.Text style={[styles.headline, {
              opacity: headlineOpacity,
              transform: [{ translateY: headlineTranslate }],
            }]}>
              You have saved{'\n'}so many recipes...
            </Animated.Text>
            
            <Animated.Text style={[styles.subtext, { opacity: subtextOpacity }]}>
              But how many did you actually make? 🤔
            </Animated.Text>
          </View>

          <View style={styles.bottomSection}>
            <Button
              testID="onboarding-hook-continue"
              title="Be honest..."
              onPress={() => {
                console.log('[Onboarding] Hook continue pressed -> /onboarding/confession');
                router.push('/onboarding/confession');
              }}
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
  bgPattern: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
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
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  decorCircle: {
    position: 'absolute',
    top: 40,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.comic.yellow,
    opacity: 0.3,
  },
  decorCircle2: {
    position: 'absolute',
    top: 100,
    left: -40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
  },
  floatingQuestion: {
    position: 'absolute',
    fontSize: 48,
    fontWeight: '900' as const,
    color: colors.primary,
  },
  q1: {
    top: '20%',
    right: 30,
  },
  q2: {
    top: '35%',
    left: 20,
  },
  q3: {
    top: '50%',
    right: 50,
  },
  totie: {
    width: 180,
    height: 180,
    marginBottom: 20,
  },
  statCardContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 24,
  },
  sharpieAnnotation: {
    position: 'absolute',
    top: -55,
    left: -90,
    zIndex: 10,
  },
  sharpieText: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: '#1a1a1a',
    fontStyle: 'italic',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  sharpieArrow: {
    fontSize: 36,
    fontWeight: '900' as const,
    color: '#1a1a1a',
    marginLeft: 50,
    marginTop: -6,
  },
  statCard: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    shadowColor: colors.black,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  statNumber: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: colors.primary,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  headline: {
    fontSize: 32,
    fontWeight: '800' as const,
    lineHeight: 40,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtext: {
    fontSize: 18,
    fontWeight: '500' as const,
    lineHeight: 26,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  bottomSection: {
    paddingBottom: 32,
  },
});
