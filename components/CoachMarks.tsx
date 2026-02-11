import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  Platform,
  LayoutRectangle,
} from 'react-native';
import Svg, { Defs, Mask, Rect, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '@/constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CoachStep {
  id: string;
  title: string;
  message: string;
  emoji: string;
}

const COACH_STEPS: CoachStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Totie!',
    message: "I'm your cooking sidekick! Let me walk you through how to go from ingredients to a home-cooked meal 🏠",
    emoji: '👋',
  },
  {
    id: 'my-kitchen',
    title: 'Step 1: Stock Your Kitchen',
    message: "Start here! Add what's in your fridge & pantry. This is how I know what you have to cook with 🧊",
    emoji: '🥬',
  },
  {
    id: 'add-recipe',
    title: 'Step 2: Save Recipes',
    message: "Found a recipe you love? Paste a link or type it in. I'll match it with your kitchen ingredients! 📖",
    emoji: '➕',
  },
  {
    id: 'cook-now',
    title: 'Step 3: Cook Now!',
    message: "Once your kitchen is stocked and recipes are saved, tap here to see what you can cook right now — no extra shopping needed! 🍳",
    emoji: '👨‍🍳',
  },
  {
    id: 'snap-craving',
    title: 'Wait, there\'s more! 🤩',
    message: "See a meal on DoorDash or Instagram? Snap a photo and I'll turn it into a recipe you can make at home — no delivery fees! 📸",
    emoji: '🤖',
  },
  {
    id: 'complete',
    title: "You're all set!",
    message: "Stock your kitchen → Save recipes → Cook! It's that simple 🔥",
    emoji: '🎉',
  },
];

export interface SpotlightRefs {
  snapCraving?: LayoutRectangle;
  addRecipe?: LayoutRectangle;
  myKitchen?: LayoutRectangle;
  cookNow?: LayoutRectangle;
}

interface CoachMarksProps {
  visible: boolean;
  onComplete: () => void;
  spotlightRefs?: SpotlightRefs;
  onStepChange?: (stepId: string) => void;
}

export default function CoachMarks({ visible, onComplete, spotlightRefs, onStepChange }: CoachMarksProps) {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);
  const [phase, setPhase] = useState<'spotlight' | 'tooltip'>('spotlight');
  const [showConfetti, setShowConfetti] = useState(false);
  
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const spotlightScaleAnim = useRef(new Animated.Value(0)).current;
  const spotlightPulseAnim = useRef(new Animated.Value(1)).current;
  const tooltipAnim = useRef(new Animated.Value(0)).current;
  
  const pulseAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  
  const confettiAnims = useRef(
    Array.from({ length: 20 }, () => ({
      x: new Animated.Value(SCREEN_WIDTH / 2),
      y: new Animated.Value(SCREEN_HEIGHT / 2),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
      scale: new Animated.Value(1),
    }))
  ).current;

  const getSpotlightArea = useCallback(() => {
    const step = COACH_STEPS[currentStep];
    if (!spotlightRefs) return null;

    const padding = 10;
    const getCircularRect = (rect: LayoutRectangle | undefined) => {
      if (!rect || rect.width === 0) return null;
      const size = Math.max(rect.width, rect.height) + padding * 2;
      const centerX = rect.x + rect.width / 2;
      const centerY = rect.y + rect.height / 2;
      return {
        x: centerX - size / 2,
        y: centerY - size / 2,
        width: size,
        height: size,
      };
    };

    switch (step.id) {
      case 'my-kitchen':
        return getCircularRect(spotlightRefs.myKitchen);
      case 'cook-now':
        return getCircularRect(spotlightRefs.cookNow);
      case 'add-recipe':
        return getCircularRect(spotlightRefs.addRecipe);
      case 'snap-craving':
        return getCircularRect(spotlightRefs.snapCraving);
      default:
        return null;
    }
  }, [currentStep, spotlightRefs]);

  const stopPulseAnimation = useCallback(() => {
    if (pulseAnimRef.current) {
      pulseAnimRef.current.stop();
      pulseAnimRef.current = null;
    }
  }, []);

  const runPulseAnimation = useCallback(() => {
    stopPulseAnimation();
    spotlightPulseAnim.setValue(1);
    
    pulseAnimRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(spotlightPulseAnim, {
          toValue: 1.05,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(spotlightPulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimRef.current.start();
  }, [spotlightPulseAnim, stopPulseAnimation]);

  const showSpotlightPhase = useCallback(() => {
    setPhase('spotlight');
    tooltipAnim.setValue(0);
    spotlightScaleAnim.setValue(0);
    
    Animated.spring(spotlightScaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 80,
      useNativeDriver: true,
    }).start();
    
    runPulseAnimation();
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    setTimeout(() => {
      setPhase('tooltip');
      Animated.spring(tooltipAnim, {
        toValue: 1,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }).start();
    }, 800);
  }, [tooltipAnim, spotlightScaleAnim, runPulseAnimation]);

  useEffect(() => {
    if (visible) {
      setCurrentStep(0);
      setShowConfetti(false);
      setPhase('spotlight');
      
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        const step = COACH_STEPS[0];
        if (step.id === 'welcome') {
          setPhase('tooltip');
          Animated.spring(tooltipAnim, {
            toValue: 1,
            friction: 8,
            tension: 50,
            useNativeDriver: true,
          }).start();
        } else {
          showSpotlightPhase();
        }
      });
    } else {
      stopPulseAnimation();
      overlayAnim.setValue(0);
      tooltipAnim.setValue(0);
      spotlightScaleAnim.setValue(0);
      setCurrentStep(0);
      setShowConfetti(false);
    }
  }, [visible, overlayAnim, showSpotlightPhase, tooltipAnim, spotlightScaleAnim, stopPulseAnimation]);

  const triggerConfetti = useCallback(() => {
    setShowConfetti(true);
    stopPulseAnimation();
    
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    confettiAnims.forEach((anim, idx) => {
      const startX = SCREEN_WIDTH / 2;
      const startY = SCREEN_HEIGHT / 2 - 50;
      const angle = (idx / confettiAnims.length) * Math.PI * 2;
      const distance = 120 + Math.random() * 80;
      const endX = startX + Math.cos(angle) * distance;
      const endY = startY + Math.sin(angle) * distance - 80;
      
      anim.x.setValue(startX);
      anim.y.setValue(startY);
      anim.rotate.setValue(0);
      anim.opacity.setValue(1);
      anim.scale.setValue(0);
      
      Animated.parallel([
        Animated.spring(anim.scale, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(anim.x, {
          toValue: endX,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(anim.y, {
          toValue: endY,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(anim.rotate, {
          toValue: 360 * (Math.random() > 0.5 ? 1 : -1) * 2,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(400),
          Animated.timing(anim.opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });
  }, [confettiAnims, stopPulseAnimation]);

  const handleNext = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    stopPulseAnimation();
    
    if (currentStep < COACH_STEPS.length - 1) {
      Animated.timing(tooltipAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);
        onStepChange?.(COACH_STEPS[nextStep].id);
        
        if (COACH_STEPS[nextStep].id === 'complete') {
          triggerConfetti();
          setTimeout(() => {
            Animated.spring(tooltipAnim, {
              toValue: 1,
              friction: 8,
              tension: 50,
              useNativeDriver: true,
            }).start();
          }, 200);
        } else {
          showSpotlightPhase();
        }
      });
    } else {
      onComplete();
    }
  }, [currentStep, tooltipAnim, showSpotlightPhase, triggerConfetti, onComplete, stopPulseAnimation, onStepChange]);

  const handleSkip = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    stopPulseAnimation();
    onComplete();
  }, [onComplete, stopPulseAnimation]);

  if (!visible) return null;

  const step = COACH_STEPS[currentStep];
  const spotlight = getSpotlightArea();
  const hasSpotlight = spotlight && step.id !== 'welcome' && step.id !== 'complete';

  const confettiColors = [
    colors.primary,
    colors.comic.yellow,
    colors.mint,
    colors.comic.pink,
    colors.comic.blue,
    '#FF6B6B',
    '#4ECDC4',
  ];

  const TOOLTIP_HEIGHT = 220;
  const MIN_TOP = insets.top + 20;

  const isBottomIcon = step.id === 'my-kitchen' || step.id === 'cook-now';

  const getTooltipStyle = () => {
    if (!hasSpotlight || !spotlight || showConfetti) {
      return {
        top: Math.max(SCREEN_HEIGHT / 2 - TOOLTIP_HEIGHT / 2, MIN_TOP),
        left: 20,
        right: 20,
      };
    }

    // For bottom row icons, always position tooltip at TOP of screen
    if (isBottomIcon) {
      return {
        top: MIN_TOP + 20,
        left: 20,
        right: 20,
      };
    }
    
    // For top row icons, position tooltip at BOTTOM of screen (above tab bar)
    return {
      bottom: insets.bottom + 100,
      left: 20,
      right: 20,
    };
  };

  const renderSpotlightOverlay = () => {
    if (!hasSpotlight || !spotlight) {
      return <View style={styles.fullOverlay} />;
    }

    const centerX = spotlight.x + spotlight.width / 2;
    const centerY = spotlight.y + spotlight.height / 2;
    const radius = spotlight.width / 2;

    return (
      <>
        {/* SVG overlay with circular cutout */}
        <Svg style={StyleSheet.absoluteFill} width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
          <Defs>
            <Mask id="spotlightMask">
              <Rect x="0" y="0" width={SCREEN_WIDTH} height={SCREEN_HEIGHT} fill="white" />
              <Circle cx={centerX} cy={centerY} r={radius} fill="black" />
            </Mask>
          </Defs>
          <Rect
            x="0"
            y="0"
            width={SCREEN_WIDTH}
            height={SCREEN_HEIGHT}
            fill="rgba(0, 0, 0, 0.85)"
            mask="url(#spotlightMask)"
          />
        </Svg>
        
        {/* Circular spotlight ring */}
        <Animated.View 
          style={[
            styles.spotlightRing,
            {
              top: spotlight.y,
              left: spotlight.x,
              width: spotlight.width,
              height: spotlight.height,
              borderRadius: spotlight.width / 2,
              opacity: spotlightScaleAnim,
              transform: [
                { scale: Animated.multiply(spotlightScaleAnim, spotlightPulseAnim) },
              ],
            },
          ]}
        />
      </>
    );
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View 
        style={[StyleSheet.absoluteFill, { opacity: overlayAnim }]}
        pointerEvents="box-none"
      >
        {!showConfetti ? renderSpotlightOverlay() : <View style={styles.fullOverlay} />}

        {showConfetti && (
          <>
            {confettiAnims.map((anim, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.confetti,
                  {
                    backgroundColor: confettiColors[index % confettiColors.length],
                    transform: [
                      { translateX: anim.x },
                      { translateY: anim.y },
                      { scale: anim.scale },
                      { rotate: anim.rotate.interpolate({
                        inputRange: [0, 360],
                        outputRange: ['0deg', '360deg'],
                      })},
                    ],
                    opacity: anim.opacity,
                  },
                ]}
              />
            ))}
          </>
        )}

        <Animated.View
          style={[
            styles.tooltip,
            getTooltipStyle(),
            {
              opacity: phase === 'tooltip' || showConfetti || step.id === 'welcome' ? tooltipAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }) : 0,
              transform: [
                { 
                  translateY: tooltipAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  })
                },
                {
                  scale: tooltipAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  })
                },
              ],
            },
          ]}
          pointerEvents={phase === 'tooltip' || showConfetti || step.id === 'welcome' ? 'auto' : 'none'}
        >
          {showConfetti ? (
            <View style={styles.celebrationContent}>
              <Image
                source={{ uri: 'https://r2-pub.rork.com/attachments/7kh2kny7y4aoan2iczpas' }}
                style={styles.celebrationTotie}
                resizeMode="contain"
              />
              <Text style={styles.celebrationTitle}>You&apos;re all set! 🎉</Text>
              <Text style={styles.celebrationMessage}>Let&apos;s cook something amazing</Text>
              <TouchableOpacity
                style={styles.finishButton}
                onPress={onComplete}
                activeOpacity={0.8}
              >
                <Text style={styles.finishButtonText}>Got it!</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.tooltipHeader}>
                <View style={styles.avatarRow}>
                  <Image
                    source={{ uri: 'https://r2-pub.rork.com/attachments/7kh2kny7y4aoan2iczpas' }}
                    style={styles.totieAvatar}
                    resizeMode="contain"
                  />
                  <View style={styles.emojiPill}>
                    <Text style={styles.emoji}>{step.emoji}</Text>
                  </View>
                </View>
                <View style={styles.stepPill}>
                  {COACH_STEPS.slice(0, -1).map((_, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.stepDot,
                        idx === currentStep && styles.stepDotActive,
                        idx < currentStep && styles.stepDotCompleted,
                      ]}
                    />
                  ))}
                </View>
              </View>

              <Text style={styles.tooltipTitle}>{step.title}</Text>
              <Text style={styles.tooltipMessage}>{step.message}</Text>

              <View style={styles.buttonRow}>
                <TouchableOpacity onPress={handleSkip} style={styles.skipButton} activeOpacity={0.7}>
                  <Text style={styles.skipText}>Skip tour</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={handleNext}
                  activeOpacity={0.8}
                >
                  <Text style={styles.nextText}>
                    {currentStep === COACH_STEPS.length - 2 ? 'Finish' : 'Next'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },

  spotlightRing: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: colors.comic.yellow,
    backgroundColor: 'transparent',
    shadowColor: colors.comic.yellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 10,
  },

  tooltip: {
    position: 'absolute',
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: colors.black,
    padding: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 10,
  },
  tooltipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  totieAvatar: {
    width: 48,
    height: 48,
  },
  emojiPill: {
    backgroundColor: colors.accentLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: colors.black,
  },
  emoji: {
    fontSize: 18,
  },
  stepPill: {
    flexDirection: 'row',
    gap: 6,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderLight,
  },
  stepDotActive: {
    backgroundColor: colors.primary,
    width: 18,
  },
  stepDotCompleted: {
    backgroundColor: colors.mint,
  },
  tooltipTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: colors.text,
    marginBottom: 8,
  },
  tooltipMessage: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  nextButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: colors.black,
    paddingVertical: 14,
    paddingHorizontal: 32,
    shadowColor: colors.black,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  nextText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: colors.white,
  },
  confetti: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  celebrationContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  celebrationTotie: {
    width: 90,
    height: 90,
    marginBottom: 12,
  },
  celebrationTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: colors.text,
    marginBottom: 6,
  },
  celebrationMessage: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  finishButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: colors.black,
    paddingVertical: 14,
    paddingHorizontal: 48,
    shadowColor: colors.black,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  finishButtonText: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: colors.white,
  },
});
