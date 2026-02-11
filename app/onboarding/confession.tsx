import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/Button';
import colors from '@/constants/colors';

export default function Confession() {
  const router = useRouter();

  const totieScale = useRef(new Animated.Value(0)).current;
  const totieFloat = useRef(new Animated.Value(0)).current;
  const headlineScale = useRef(new Animated.Value(0.8)).current;
  const headlineOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0)).current;
  const cardRotate = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  
  const bubble1Anim = useRef(new Animated.Value(0)).current;
  const bubble2Anim = useRef(new Animated.Value(0)).current;
  const bubble3Anim = useRef(new Animated.Value(0)).current;
  
  const bubble1Float = useRef(new Animated.Value(0)).current;
  const bubble2Float = useRef(new Animated.Value(0)).current;
  const bubble3Float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
        Animated.timing(bubble1Float, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bubble1Float, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bubble2Float, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bubble2Float, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bubble3Float, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bubble3Float, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 600);

    Animated.sequence([
      Animated.parallel([
        Animated.spring(bubble1Anim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 8,
          bounciness: 14,
          delay: 0,
        }),
        Animated.spring(bubble2Anim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 8,
          bounciness: 14,
          delay: 150,
        }),
        Animated.spring(bubble3Anim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 8,
          bounciness: 14,
          delay: 300,
        }),
      ]),
      Animated.spring(totieScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 8,
        bounciness: 12,
      }),
      Animated.parallel([
        Animated.spring(headlineScale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 10,
          bounciness: 8,
        }),
        Animated.timing(headlineOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
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
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [
    bubble1Anim,
    bubble1Float,
    bubble2Anim,
    bubble2Float,
    bubble3Anim,
    bubble3Float,
    buttonOpacity,
    cardRotate,
    cardScale,
    headlineOpacity,
    headlineScale,
    totieFloat,
    totieScale,
  ]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.topSection}>
            <View style={styles.thoughtBubbles} pointerEvents="none">
              <Animated.View pointerEvents="none" style={[styles.thoughtBubble, styles.bubble1, {
                transform: [
                  { scale: bubble1Anim },
                  { translateY: bubble1Float.interpolate({ inputRange: [0, 1], outputRange: [0, -12] }) },
                  { rotate: bubble1Float.interpolate({ inputRange: [0, 1], outputRange: ['-10deg', '-5deg'] }) },
                ],
                opacity: bubble1Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.6] }),
              }]}>
                <Text style={styles.bubbleText}>🍜</Text>
              </Animated.View>
              <Animated.View pointerEvents="none" style={[styles.thoughtBubble, styles.bubble2, {
                transform: [
                  { scale: bubble2Anim },
                  { translateY: bubble2Float.interpolate({ inputRange: [0, 1], outputRange: [0, -15] }) },
                  { rotate: bubble2Float.interpolate({ inputRange: [0, 1], outputRange: ['5deg', '12deg'] }) },
                ],
                opacity: bubble2Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.7] }),
              }]}>
                <Text style={styles.bubbleText}>🍕</Text>
              </Animated.View>
              <Animated.View pointerEvents="none" style={[styles.thoughtBubble, styles.bubble3, {
                transform: [
                  { scale: bubble3Anim },
                  { translateY: bubble3Float.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) },
                  { rotate: bubble3Float.interpolate({ inputRange: [0, 1], outputRange: ['-3deg', '3deg'] }) },
                ],
                opacity: bubble3Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] }),
              }]}>
                <Text style={styles.bubbleText}>🌮</Text>
              </Animated.View>
            </View>

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

            <Animated.Text style={[styles.headline, {
              opacity: headlineOpacity,
              transform: [{ scale: headlineScale }],
            }]}>
              It{"'"}s not your fault.
            </Animated.Text>
            
            <Animated.View style={[styles.messageCard, {
              transform: [
                { scale: cardScale },
                { rotate: cardRotate.interpolate({ inputRange: [0, 1], outputRange: ['-5deg', '0deg'] }) },
              ],
            }]}>
              <Text style={styles.message}>
                The gap between{'\n'}
                <Text style={styles.messageHighlight}>{"\"I want to make this\""}</Text>
                {'\n'}and{'\n'}
                <Text style={styles.messageHighlight}>{"\"it's on the table\""}</Text>
                {'\n'}is REAL.
              </Text>
            </Animated.View>
          </View>

          <View style={styles.bottomSection}>
            <Button
              title="So true 😮‍💨"
              onPress={() => router.push('/onboarding/villain')}
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
  thoughtBubbles: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    height: 100,
  },
  thoughtBubble: {
    position: 'absolute',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 20,
    padding: 12,
  },
  bubble1: {
    left: 20,
    top: 0,
  },
  bubble2: {
    right: 40,
    top: 20,
  },
  bubble3: {
    left: '40%',
    top: 50,
  },
  bubbleText: {
    fontSize: 24,
  },
  totie: {
    width: 170,
    height: 170,
    marginBottom: 20,
  },
  headline: {
    fontSize: 36,
    fontWeight: '900' as const,
    lineHeight: 44,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  messageCard: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 20,
    padding: 24,
    shadowColor: colors.black,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  message: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 28,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  messageHighlight: {
    color: colors.primary,
    fontWeight: '800' as const,
  },
  bottomSection: {
    paddingBottom: 32,
  },
});
