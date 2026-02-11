import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/Button';
import colors from '@/constants/colors';

export default function Promise() {
  const router = useRouter();

  const totieScale = useRef(new Animated.Value(0)).current;
  const totieFloat = useRef(new Animated.Value(0)).current;
  const headlineOpacity = useRef(new Animated.Value(0)).current;
  const headlineTranslate = useRef(new Animated.Value(30)).current;
  const cardScale = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  
  const circle1Anim = useRef(new Animated.Value(0)).current;
  const circle2Anim = useRef(new Animated.Value(0)).current;
  
  const sparkle1Anim = useRef(new Animated.Value(0)).current;
  const sparkle2Anim = useRef(new Animated.Value(0)).current;
  const sparkle3Anim = useRef(new Animated.Value(0)).current;
  
  const firePulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(circle1Anim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(circle1Anim, {
          toValue: 0,
          duration: 4000,
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
        Animated.timing(sparkle1Anim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(sparkle1Anim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkle2Anim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(sparkle2Anim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkle3Anim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(sparkle3Anim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(firePulse, {
          toValue: 1.2,
          duration: 400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(firePulse, {
          toValue: 1,
          duration: 400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 800);

    Animated.sequence([
      Animated.spring(totieScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 8,
        bounciness: 14,
      }),
      Animated.parallel([
        Animated.timing(headlineOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(headlineTranslate, {
          toValue: 0,
          useNativeDriver: true,
          speed: 10,
          bounciness: 6,
        }),
      ]),
      Animated.spring(cardScale, {
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
      <View style={styles.bgPattern} pointerEvents="none">
        <Animated.View style={[styles.circle, styles.circle1, {
          transform: [
            { translateX: circle1Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 25] }) },
            { translateY: circle1Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }) },
            { scale: circle1Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.15, 1] }) },
          ],
        }]} />
        <Animated.View style={[styles.circle, styles.circle2, {
          transform: [
            { translateX: circle2Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] }) },
            { translateY: circle2Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 15] }) },
            { scale: circle2Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.1, 1] }) },
          ],
        }]} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.topSection}>
            <View style={styles.sparkles}>
              <Animated.Text style={[styles.sparkle, {
                transform: [
                  { translateY: sparkle1Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -15] }) },
                  { scale: sparkle1Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.4, 1] }) },
                  { rotate: sparkle1Anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '20deg'] }) },
                ],
                opacity: sparkle1Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 1, 0.6] }),
              }]}>✨</Animated.Text>
              <Animated.Text style={[styles.sparkle, styles.sparkle2, {
                transform: [
                  { translateY: sparkle2Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] }) },
                  { scale: sparkle2Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.3, 1] }) },
                  { rotate: sparkle2Anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-15deg'] }) },
                ],
                opacity: sparkle2Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 1, 0.5] }),
              }]}>💫</Animated.Text>
              <Animated.Text style={[styles.sparkle, styles.sparkle3, {
                transform: [
                  { translateY: sparkle3Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -12] }) },
                  { scale: sparkle3Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.5, 1] }) },
                ],
                opacity: sparkle3Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.7, 1, 0.7] }),
              }]}>⭐</Animated.Text>
            </View>

            <Animated.View style={{
              transform: [
                { scale: totieScale },
                { translateY: totieFloat.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) },
              ],
            }}>
              <Image
                source={{ uri: 'https://r2-pub.rork.com/attachments/7kh2kny7y4aoan2iczpas' }}
                style={styles.totie}
                resizeMode="contain"
              />
            </Animated.View>

            <Animated.Text style={[styles.headline, {
              opacity: headlineOpacity,
              transform: [{ translateY: headlineTranslate }],
            }]}>
              What if you{'\n'}
              <Text style={styles.headlineAccent}>actually cooked</Text>
              {'\n'}what you{"'"}ve been craving?
            </Animated.Text>
            
            <Animated.View style={[styles.promiseCard, {
              transform: [{ scale: cardScale }],
            }]}>
              <Text style={styles.promiseText}>
                No more {"\"I'll make it someday.\""}
              </Text>
              <View style={styles.fireRow}>
                <Text style={styles.promiseHighlight}>Let{"'"}s make it TODAY. </Text>
                <Animated.Text style={[styles.fireEmoji, { transform: [{ scale: firePulse }] }]}>🔥</Animated.Text>
              </View>
            </Animated.View>
          </View>

          <View style={styles.bottomSection}>
            <Button
              title="I'm in! 💪"
              onPress={() => router.push('/onboarding/how-it-works')}
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
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: colors.primaryLight,
  },
  circle1: {
    width: 250,
    height: 250,
    top: -80,
    left: -80,
    opacity: 0.5,
  },
  circle2: {
    width: 200,
    height: 200,
    bottom: 100,
    right: -60,
    opacity: 0.4,
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
  sparkles: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    height: 60,
  },
  sparkle: {
    position: 'absolute',
    fontSize: 28,
    left: 40,
    top: 10,
  },
  sparkle2: {
    left: 'auto',
    right: 50,
    top: 20,
  },
  sparkle3: {
    left: '45%',
    top: 0,
  },
  totie: {
    width: 200,
    height: 200,
    marginBottom: 28,
  },
  headline: {
    fontSize: 30,
    fontWeight: '800' as const,
    lineHeight: 40,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  headlineAccent: {
    color: colors.primary,
  },
  promiseCard: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  promiseText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  fireRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promiseHighlight: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: colors.text,
    textAlign: 'center',
  },
  fireEmoji: {
    fontSize: 24,
  },
  bottomSection: {
    paddingBottom: 32,
  },
});
