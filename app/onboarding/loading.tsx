import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import colors from '@/constants/colors';
import { Check, Circle } from 'lucide-react-native';

const STEPS = [
  { id: 1, label: 'Analyzing your habits' },
  { id: 2, label: 'Calculating your savings' },
  { id: 3, label: 'Finding recipes you can make' },
  { id: 4, label: 'Building your plan' },
];

const TESTIMONIALS = [
  { name: 'Sarah K.', text: 'This app actually got me cooking again!', rating: 5 },
  { name: 'Mike T.', text: 'Saved $200 in my first month!', rating: 5 },
  { name: 'Jess R.', text: 'Finally using the recipes I save', rating: 5 },
  { name: 'David L.', text: 'The delivery craving feature is genius', rating: 5 },
];

export default function Loading() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  const headlineOpacity = useRef(new Animated.Value(0)).current;
  const headlineTranslate = useRef(new Animated.Value(-20)).current;
  const circleScale = useRef(new Animated.Value(0)).current;
  const circlePulse = useRef(new Animated.Value(1)).current;
  const dotsAnim = useRef(new Animated.Value(0)).current;
  
  const stepAnims = useRef(STEPS.map(() => new Animated.Value(0))).current;
  const testimonialAnims = useRef(TESTIMONIALS.map(() => new Animated.Value(0))).current;
  
  const bgCircle1 = useRef(new Animated.Value(0)).current;
  const bgCircle2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgCircle1, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bgCircle1, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bgCircle2, {
          toValue: 1,
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bgCircle2, {
          toValue: 0,
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(circlePulse, {
          toValue: 1.05,
          duration: 800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(circlePulse, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(dotsAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(dotsAnim, {
          toValue: 2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(dotsAnim, {
          toValue: 3,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(dotsAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.sequence([
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
      Animated.spring(circleScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 8,
        bounciness: 12,
      }),
      Animated.stagger(100, stepAnims.map(anim => 
        Animated.spring(anim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 12,
          bounciness: 8,
        })
      )),
      Animated.stagger(150, testimonialAnims.map(anim =>
        Animated.spring(anim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 10,
          bounciness: 6,
        })
      )),
    ]).start();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 60);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 100,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  useEffect(() => {
    if (progress >= 25 && currentStep < 1) {
      setCurrentStep(1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (progress >= 50 && currentStep < 2) {
      setCurrentStep(2);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (progress >= 75 && currentStep < 3) {
      setCurrentStep(3);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (progress >= 100) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        router.push('/onboarding/paywall');
      }, 2000);
    }
  }, [progress, currentStep, router]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.bgPattern} pointerEvents="none">
        <Animated.View style={[styles.bgCircle, styles.bgCircle1, {
          transform: [
            { translateX: bgCircle1.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }) },
            { translateY: bgCircle1.interpolate({ inputRange: [0, 1], outputRange: [0, 15] }) },
            { scale: bgCircle1.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.1, 1] }) },
          ],
        }]} />
        <Animated.View style={[styles.bgCircle, styles.bgCircle2, {
          transform: [
            { translateX: bgCircle2.interpolate({ inputRange: [0, 1], outputRange: [0, -15] }) },
            { translateY: bgCircle2.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }) },
          ],
        }]} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.topSection}>
            <Animated.Text style={[styles.headline, {
              opacity: headlineOpacity,
              transform: [{ translateY: headlineTranslate }],
            }]}>
              Personalizing{'\n'}your kitchen...
            </Animated.Text>

            <View style={styles.progressContainer}>
              <Animated.View style={[styles.progressCircle, {
                transform: [
                  { scale: Animated.multiply(circleScale, circlePulse) },
                ],
              }]}>
                <Text style={styles.progressText}>{Math.round(progress)}%</Text>
              </Animated.View>
              <View style={styles.progressBarBg}>
                <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
              </View>
            </View>

            <View style={styles.stepsList}>
              {STEPS.map((step, index) => (
                <Animated.View 
                  key={step.id} 
                  style={[styles.stepRow, {
                    opacity: stepAnims[index],
                    transform: [
                      { translateX: stepAnims[index].interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) },
                    ],
                  }]}
                >
                  <Animated.View style={[
                    styles.stepIcon,
                    index < currentStep && styles.stepIconComplete,
                    index === currentStep && styles.stepIconActive,
                  ]}>
                    {index < currentStep ? (
                      <Check size={14} color={colors.white} strokeWidth={3} />
                    ) : index === currentStep ? (
                      <Animated.View style={[styles.stepDot, {
                        transform: [{
                          scale: circlePulse.interpolate({ inputRange: [1, 1.05], outputRange: [1, 1.3] })
                        }],
                      }]} />
                    ) : (
                      <Circle size={14} color={colors.border} strokeWidth={2} />
                    )}
                  </Animated.View>
                  <Text style={[
                    styles.stepLabel,
                    index < currentStep && styles.stepLabelComplete,
                    index === currentStep && styles.stepLabelActive,
                  ]}>
                    {step.label}
                  </Text>
                  {index === currentStep && (
                    <Text style={styles.stepProcessing}>...</Text>
                  )}
                </Animated.View>
              ))}
            </View>
          </View>

          <View style={styles.testimonialsSection}>
            <Text style={styles.testimonialsTitle}>What people are saying</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.testimonialsScroll}
            >
              {TESTIMONIALS.map((testimonial, index) => (
                <Animated.View 
                  key={index} 
                  style={[styles.testimonialCard, {
                    opacity: testimonialAnims[index],
                    transform: [
                      { scale: testimonialAnims[index] },
                      { translateY: testimonialAnims[index].interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
                    ],
                  }]}
                >
                  <Text style={styles.testimonialText}>{`"${testimonial.text}"`}</Text>
                  <View style={styles.testimonialFooter}>
                    <Text style={styles.testimonialStars}>⭐⭐⭐⭐⭐</Text>
                    <Text style={styles.testimonialName}>— {testimonial.name}</Text>
                  </View>
                </Animated.View>
              ))}
            </ScrollView>
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
  bgCircle: {
    position: 'absolute',
    borderRadius: 200,
  },
  bgCircle1: {
    width: 200,
    height: 200,
    backgroundColor: colors.primaryLight,
    top: -50,
    right: -50,
    opacity: 0.5,
  },
  bgCircle2: {
    width: 150,
    height: 150,
    backgroundColor: colors.comic.yellow,
    bottom: 150,
    left: -50,
    opacity: 0.3,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topSection: {
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  headline: {
    fontSize: 32,
    fontWeight: '800' as const,
    lineHeight: 40,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 40,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  progressCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.white,
    borderWidth: 4,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  progressText: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: colors.primary,
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  stepsList: {
    gap: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconComplete: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepIconActive: {
    borderColor: colors.primary,
    borderWidth: 3,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  stepLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.textMuted,
  },
  stepLabelComplete: {
    color: colors.primary,
    fontWeight: '600' as const,
  },
  stepLabelActive: {
    color: colors.text,
    fontWeight: '700' as const,
  },
  stepProcessing: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: '700' as const,
  },
  testimonialsSection: {
    paddingBottom: 32,
  },
  testimonialsTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  testimonialsScroll: {
    paddingHorizontal: 24,
    gap: 12,
  },
  testimonialCard: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 16,
    padding: 16,
    width: 260,
    shadowColor: colors.black,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  testimonialText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  testimonialFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  testimonialStars: {
    fontSize: 12,
  },
  testimonialName: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
});
