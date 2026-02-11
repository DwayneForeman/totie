import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Easing, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Button from '@/components/Button';
import colors from '@/constants/colors';
import { Star, Heart } from 'lucide-react-native';

export default function ReviewRequest() {
  const router = useRouter();
  
  const totieAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const textAnim = useRef(new Animated.Value(0)).current;
  const starsAnim = useRef(new Animated.Value(0)).current;
  const buttonsAnim = useRef(new Animated.Value(0)).current;
  
  const star1Anim = useRef(new Animated.Value(0)).current;
  const star2Anim = useRef(new Animated.Value(0)).current;
  const star3Anim = useRef(new Animated.Value(0)).current;
  const star4Anim = useRef(new Animated.Value(0)).current;
  const star5Anim = useRef(new Animated.Value(0)).current;
  
  const heartAnim = useRef(new Animated.Value(0)).current;
  const sparkle1Anim = useRef(new Animated.Value(0)).current;
  const sparkle2Anim = useRef(new Animated.Value(0)).current;

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
        Animated.timing(heartAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(heartAnim, {
          toValue: 0,
          duration: 800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkle1Anim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(sparkle1Anim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkle2Anim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(sparkle2Anim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.sequence([
      Animated.spring(totieAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 8,
        bounciness: 14,
      }),
      Animated.spring(textAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 10,
        bounciness: 8,
      }),
      Animated.spring(starsAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 8,
        bounciness: 10,
      }),
      Animated.stagger(100, [
        Animated.spring(star1Anim, { toValue: 1, useNativeDriver: true, speed: 12, bounciness: 14 }),
        Animated.spring(star2Anim, { toValue: 1, useNativeDriver: true, speed: 12, bounciness: 14 }),
        Animated.spring(star3Anim, { toValue: 1, useNativeDriver: true, speed: 12, bounciness: 14 }),
        Animated.spring(star4Anim, { toValue: 1, useNativeDriver: true, speed: 12, bounciness: 14 }),
        Animated.spring(star5Anim, { toValue: 1, useNativeDriver: true, speed: 12, bounciness: 14 }),
      ]),
      Animated.timing(buttonsAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleRate = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push('/onboarding/name');
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/onboarding/name');
  };

  const starAnims = [star1Anim, star2Anim, star3Anim, star4Anim, star5Anim];

  return (
    <View style={styles.container}>
      <View style={styles.bgPattern} pointerEvents="none">
        <Animated.Text style={[styles.bgEmoji, styles.bgEmoji1, {
          opacity: sparkle1Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 0.7, 0.3] }),
          transform: [
            { translateY: sparkle1Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) },
            { rotate: sparkle1Anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '20deg'] }) },
          ],
        }]}>⭐</Animated.Text>
        <Animated.Text style={[styles.bgEmoji, styles.bgEmoji2, {
          opacity: sparkle2Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.4, 0.8, 0.4] }),
          transform: [
            { translateY: sparkle2Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -15] }) },
          ],
        }]}>✨</Animated.Text>
        <Animated.Text style={[styles.bgEmoji, styles.bgEmoji3, {
          opacity: sparkle1Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.2, 0.6, 0.2] }),
          transform: [
            { scale: sparkle1Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.8, 1.2, 0.8] }) },
          ],
        }]}>💫</Animated.Text>
      </View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.mainContent}>
            <Animated.View style={[styles.totieContainer, {
              opacity: totieAnim,
              transform: [
                { scale: totieAnim },
                { translateY: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) },
              ],
            }]}>
              <Image
                source={{ uri: 'https://r2-pub.rork.com/attachments/7kh2kny7y4aoan2iczpas' }}
                style={styles.totie}
                resizeMode="contain"
              />
              <Animated.View style={[styles.heartBubble, {
                transform: [{ scale: heartAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] }) }],
              }]}>
                <Heart size={20} color="#E53935" fill="#E53935" />
              </Animated.View>
            </Animated.View>

            <Animated.View style={[styles.textContainer, {
              opacity: textAnim,
              transform: [{ translateY: textAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            }]}>
              <Text style={styles.headline}>Enjoying the app?</Text>
              <Text style={styles.subtext}>
                Your review helps other home cooks{'\n'}discover us. It only takes a sec! 🙏
              </Text>
            </Animated.View>

            <Animated.View style={[styles.starsContainer, {
              opacity: starsAnim,
              transform: [{ scale: starsAnim }],
            }]}>
              <View style={styles.starsRow}>
                {starAnims.map((anim, index) => (
                  <Animated.View key={index} style={{
                    transform: [{ scale: anim }],
                  }}>
                    <Pressable 
                      onPress={handleRate}
                      style={styles.starButton}
                    >
                      <Star size={44} color={colors.comic.yellow} fill={colors.comic.yellow} />
                    </Pressable>
                  </Animated.View>
                ))}
              </View>
              <Text style={styles.tapHint}>Tap to rate</Text>
            </Animated.View>
          </View>

          <View style={styles.footer}>
            <Button
              title="Rate on App Store ⭐"
              onPress={handleRate}
            />
            <Pressable onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Maybe later</Text>
            </Pressable>
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
  bgEmoji: {
    position: 'absolute',
    fontSize: 40,
  },
  bgEmoji1: {
    top: 80,
    left: 30,
  },
  bgEmoji2: {
    top: 120,
    right: 40,
  },
  bgEmoji3: {
    bottom: 200,
    left: 50,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  totieContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  totie: {
    width: 180,
    height: 180,
  },
  heartBubble: {
    position: 'absolute',
    top: -5,
    right: -10,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 20,
    padding: 8,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headline: {
    fontSize: 32,
    fontWeight: '900' as const,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtext: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  starsContainer: {
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  starButton: {
    padding: 4,
  },
  tapHint: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textMuted,
  },
  footer: {
    paddingBottom: 32,
    gap: 12,
  },
  skipButton: {
    alignItems: 'center',
    padding: 12,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
});
