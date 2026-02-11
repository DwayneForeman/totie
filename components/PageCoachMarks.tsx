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
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '@/constants/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface PageCoachStep {
  id: string;
  title: string;
  message: string;
  emoji: string;
}

interface PageCoachMarksProps {
  visible: boolean;
  onComplete: () => void;
  steps: PageCoachStep[];
  pageTitle: string;
}

export default function PageCoachMarks({ visible, onComplete, steps, pageTitle }: PageCoachMarksProps) {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);

  const overlayAnim = useRef(new Animated.Value(0)).current;
  const tooltipAnim = useRef(new Animated.Value(0)).current;
  const emojiScaleAnim = useRef(new Animated.Value(0)).current;

  const showTooltip = useCallback(() => {
    tooltipAnim.setValue(0);
    emojiScaleAnim.setValue(0);

    Animated.parallel([
      Animated.spring(tooltipAnim, {
        toValue: 1,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.spring(emojiScaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
        delay: 200,
      }),
    ]).start();

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [tooltipAnim, emojiScaleAnim]);

  useEffect(() => {
    if (visible) {
      setCurrentStep(0);
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        showTooltip();
      });
    } else {
      overlayAnim.setValue(0);
      tooltipAnim.setValue(0);
      emojiScaleAnim.setValue(0);
      setCurrentStep(0);
    }
  }, [visible, overlayAnim, tooltipAnim, emojiScaleAnim, showTooltip]);

  const handleNext = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (currentStep < steps.length - 1) {
      Animated.timing(tooltipAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setCurrentStep(prev => prev + 1);
        showTooltip();
      });
    } else {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      onComplete();
    }
  }, [currentStep, steps.length, tooltipAnim, showTooltip, onComplete]);

  const handleSkip = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onComplete();
  }, [onComplete]);

  if (!visible || steps.length === 0) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: overlayAnim }]}
      >
        <View style={styles.overlay} />

        <Animated.View
          style={[
            styles.tooltipContainer,
            {
              top: Math.max(SCREEN_HEIGHT / 2 - 160, insets.top + 40),
              opacity: tooltipAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }),
              transform: [
                {
                  translateY: tooltipAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [40, 0],
                  }),
                },
                {
                  scale: tooltipAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.92, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.tooltipCard}>
            <View style={styles.headerRow}>
              <View style={styles.avatarRow}>
                <Image
                  source={{ uri: 'https://r2-pub.rork.com/attachments/7kh2kny7y4aoan2iczpas' }}
                  style={styles.totieAvatar}
                  resizeMode="contain"
                />
                <View style={styles.pageBadge}>
                  <Text style={styles.pageBadgeText}>{pageTitle}</Text>
                </View>
              </View>
              <View style={styles.stepDots}>
                {steps.map((_, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.dot,
                      idx === currentStep && styles.dotActive,
                      idx < currentStep && styles.dotDone,
                    ]}
                  />
                ))}
              </View>
            </View>

            <Animated.View
              style={[
                styles.emojiWrap,
                {
                  transform: [
                    {
                      scale: emojiScaleAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0, 1.3, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.emoji}>{step.emoji}</Text>
            </Animated.View>

            <Text style={styles.title}>{step.title}</Text>
            <Text style={styles.message}>{step.message}</Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity onPress={handleSkip} style={styles.skipBtn} activeOpacity={0.7}>
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.nextBtn, isLast && styles.finishBtn]}
                onPress={handleNext}
                activeOpacity={0.8}
              >
                <Text style={styles.nextText}>
                  {isLast ? 'Got it!' : 'Next'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
  },
  tooltipContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
  },
  tooltipCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: colors.black,
    padding: 22,
    shadowColor: colors.black,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 10,
  },
  headerRow: {
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
    width: 40,
    height: 40,
  },
  pageBadge: {
    backgroundColor: colors.secondaryLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1.5,
    borderColor: colors.secondary,
  },
  pageBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: colors.secondary,
    letterSpacing: 0.5,
  },
  stepDots: {
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderLight,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 20,
  },
  dotDone: {
    backgroundColor: colors.mint,
  },
  emojiWrap: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.accentLight,
    borderWidth: 2,
    borderColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emoji: {
    fontSize: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipBtn: {
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  nextBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: colors.black,
    paddingVertical: 13,
    paddingHorizontal: 30,
    shadowColor: colors.black,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  finishBtn: {
    backgroundColor: colors.mint,
  },
  nextText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: colors.white,
  },
});
