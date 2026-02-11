import React, { useEffect, useRef, useCallback, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated, Easing, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import colors from '@/constants/colors';

export default function Welcome() {
  const router = useRouter();
  
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslate = useRef(new Animated.Value(30)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(0.8)).current;
  const premiumOpacity = useRef(new Animated.Value(0)).current;
  const premiumScale = useRef(new Animated.Value(0.5)).current;
  
  const circle1Anim = useRef(new Animated.Value(0)).current;
  const circle2Anim = useRef(new Animated.Value(0)).current;
  const circle3Anim = useRef(new Animated.Value(0)).current;
  const star1Anim = useRef(new Animated.Value(0)).current;
  const star2Anim = useRef(new Animated.Value(0)).current;
  const star1Rotate = useRef(new Animated.Value(0)).current;
  const star2Rotate = useRef(new Animated.Value(0)).current;
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  
  const [displayedText, setDisplayedText] = useState('');
  
  const [textPhase, setTextPhase] = useState<'waiting' | 'typing-fake' | 'deleting' | 'typing-real' | 'done'>('waiting');
  const [showCursor, setShowCursor] = useState(true);
  
  const fakeText = "Let's order takeout";
  const realTextLine1 = "We've Got";
  const realTextLine2 = "Food @ Home";

  // Cursor blink effect
  useEffect(() => {
    if (textPhase === 'done' || textPhase === 'waiting') {
      setShowCursor(false);
      return;
    }
    setShowCursor(true);
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);
    return () => clearInterval(cursorInterval);
  }, [textPhase]);

  // Initial delay before typing starts
  useEffect(() => {
    if (textPhase === 'waiting') {
      const startDelay = setTimeout(() => {
        setTextPhase('typing-fake');
      }, 300);
      return () => clearTimeout(startDelay);
    }
  }, [textPhase]);

  // Typewriter effect
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    
    if (textPhase === 'typing-fake') {
      if (displayedText.length < fakeText.length) {
        timeout = setTimeout(() => {
          setDisplayedText(fakeText.slice(0, displayedText.length + 1));
        }, 40);
      } else {
        timeout = setTimeout(() => {
          setTextPhase('deleting');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }, 1800);
      }
    } else if (textPhase === 'deleting') {
      if (displayedText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayedText(displayedText.slice(0, -1));
          if (displayedText.length % 3 === 0) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        }, 35);
      } else {
        // Start typing real text
        timeout = setTimeout(() => {
          setTextPhase('typing-real');
        }, 300);
      }
    } else if (textPhase === 'typing-real') {
      const fullRealText = realTextLine1 + '\n' + realTextLine2;
      if (displayedText.length < fullRealText.length) {
        timeout = setTimeout(() => {
          const nextChar = fullRealText[displayedText.length];
          setDisplayedText(fullRealText.slice(0, displayedText.length + 1));
          if (nextChar !== '\n') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          // Extra punch on special characters
          if (nextChar === '@' || nextChar === '!' || displayedText.length === fullRealText.length - 1) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          }
        }, 55);
      } else {
        // Done!
        timeout = setTimeout(() => {
          setTextPhase('done');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 200);
      }
    }
    
    return () => clearTimeout(timeout);
  }, [displayedText, textPhase]);

  useEffect(() => {
    // Explosive haptic when Totie first appears
    const triggerTotieHaptics = async () => {
      await new Promise(resolve => setTimeout(resolve, 600));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await new Promise(resolve => setTimeout(resolve, 80));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await new Promise(resolve => setTimeout(resolve, 80));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };
    triggerTotieHaptics();

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
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(circle2Anim, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(circle3Anim, {
          toValue: 1,
          duration: 5000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(circle3Anim, {
          toValue: 0,
          duration: 5000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(star1Anim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(star1Anim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(star2Anim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(star2Anim, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(star1Rotate, {
        toValue: 1,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(star2Rotate, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

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
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.sequence([
      Animated.parallel([
        Animated.spring(premiumScale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 8,
          bounciness: 12,
        }),
        Animated.timing(premiumOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(200),
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 6,
          bounciness: 14,
        }),
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(100),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(titleTranslate, {
          toValue: 0,
          useNativeDriver: true,
          speed: 10,
          bounciness: 6,
        }),
      ]),
      Animated.delay(100),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(buttonScale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 8,
          bounciness: 10,
        }),
      ]),
    ]).start();
  }, [
    buttonOpacity,
    buttonScale,
    circle1Anim,
    circle2Anim,
    circle3Anim,
    floatAnim,
    logoRotate,
    logoScale,
    premiumOpacity,
    premiumScale,
    pulseAnim,
    star1Anim,
    star1Rotate,
    star2Anim,
    star2Rotate,
    taglineOpacity,
    titleOpacity,
    titleTranslate,
  ]);

  const handlePress = useCallback(() => {
    console.log('[Welcome] Continue button PRESSED at', new Date().toISOString());
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push('/onboarding/hook');
  }, [router]);

  const circle1Transform = {
    transform: [
      { translateX: circle1Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }) },
      { translateY: circle1Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 15] }) },
      { scale: circle1Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.1, 1] }) },
    ],
  };

  const circle2Transform = {
    transform: [
      { translateX: circle2Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -15] }) },
      { translateY: circle2Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }) },
      { scale: circle2Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.15, 1] }) },
    ],
  };

  const circle3Transform = {
    transform: [
      { translateX: circle3Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 25] }) },
      { translateY: circle3Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) },
    ],
  };

  const star1Transform = {
    transform: [
      { translateY: star1Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -15] }) },
      { scale: star1Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.3, 1] }) },
      { rotate: star1Rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
    ],
    opacity: star1Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.7, 1, 0.7] }),
  };

  const star2Transform = {
    transform: [
      { translateY: star2Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] }) },
      { scale: star2Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.2, 1] }) },
      { rotate: star2Rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] }) },
    ],
    opacity: star2Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 1, 0.6] }),
  };

  const logoTransform = {
    transform: [
      { scale: logoScale },
      { rotate: logoRotate.interpolate({ inputRange: [0, 1], outputRange: ['-10deg', '0deg'] }) },
      { translateY: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) },
    ],
  };

  return (
    <View style={styles.container}>
      <View style={styles.bgPattern} pointerEvents="none">
        <Animated.View style={[styles.circle, styles.circle1, circle1Transform]} />
        <Animated.View style={[styles.circle, styles.circle2, circle2Transform]} />
        <Animated.View style={[styles.circle, styles.circle3, circle3Transform]} />
        <Animated.View style={[styles.star, styles.star1, star1Transform]}>
          <Text style={styles.starText}>✦</Text>
        </Animated.View>
        <Animated.View style={[styles.star, styles.star2, star2Transform]}>
          <Text style={styles.starText}>✧</Text>
        </Animated.View>
        <Animated.View style={[styles.star, styles.star3, { 
          transform: [
            { translateY: star1Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 10] }) },
            { scale: star2Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.8, 1.1, 0.8] }) },
          ],
          opacity: star2Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 0.9, 0.5] }),
        }]}>
          <Text style={styles.starText}>⭐</Text>
        </Animated.View>
        <Animated.View style={[styles.star, styles.star4, { 
          transform: [
            { translateX: circle2Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) },
            { translateY: circle1Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 8] }) },
          ],
          opacity: circle1Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.4, 0.8, 0.4] }),
        }]}>
          <Text style={styles.starText}>💫</Text>
        </Animated.View>
      </View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Animated.View style={[styles.premiumBadge, { 
            opacity: premiumOpacity, 
            transform: [{ scale: premiumScale }] 
          }]}>
            <Text style={styles.premiumText}>PREMIUM</Text>
          </Animated.View>

          <View style={styles.logoSection}>
            <Animated.View style={logoTransform}>
              <Image
                source={{ uri: 'https://r2-pub.rork.com/attachments/7kh2kny7y4aoan2iczpas' }}
                style={styles.totie}
                resizeMode="contain"
              />
            </Animated.View>

            <Image
              source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/f5n83b7ugnr5yuwf67xnn' }}
              style={styles.brandLogo}
              resizeMode="contain"
            />
            
            <Animated.View style={[styles.titleWrap, { 
              opacity: titleOpacity, 
              transform: [{ translateY: titleTranslate }] 
            }]}>
              {textPhase === 'waiting' || textPhase === 'typing-fake' || textPhase === 'deleting' ? (
                <View style={styles.typewriterContainer}>
                  <Text style={styles.fakeTitle}>
                    {displayedText}
                    <Text style={[styles.cursor, { opacity: showCursor ? 1 : 0 }]}>|</Text>
                  </Text>
                </View>
              ) : (
                <View style={styles.typewriterContainer}>
                  {displayedText.split('\n').map((line, index) => (
                    <Text 
                      key={index} 
                      style={index === 0 ? styles.title : styles.titleAccent}
                    >
                      {line}
                      {index === displayedText.split('\n').length - 1 && textPhase !== 'done' && (
                        <Text style={[styles.cursor, styles.accentCursor, { opacity: showCursor ? 1 : 0 }]}>|</Text>
                      )}
                    </Text>
                  ))}
                </View>
              )}
            </Animated.View>

            <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
              Cook more. Save more.{'\n'}Stress less.
            </Animated.Text>
          </View>

          <View style={styles.bottomSection}>
            <Animated.View style={{ 
              opacity: buttonOpacity, 
              transform: [{ scale: buttonScale }] 
            }}>
              <TouchableOpacity
                onPress={handlePress}
                activeOpacity={0.8}
                delayPressIn={0}
                style={styles.tapHint}
                testID="welcome-continue-button"
              >
                <Text style={styles.tapText}>Tap here to continue</Text>
              </TouchableOpacity>
            </Animated.View>
            <Text style={styles.termsText}>
              By tapping continue you agree to our{' '}
              <Text style={styles.termsLink} onPress={() => Linking.openURL('https://totieapp.com/terms')}>Terms</Text> and{' '}
              <Text style={styles.termsLink} onPress={() => Linking.openURL('https://totieapp.com/privacy')}>Privacy Policy</Text>
            </Text>
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
  },
  circle1: {
    width: 300,
    height: 300,
    backgroundColor: colors.primaryLight,
    top: -100,
    right: -100,
    opacity: 0.5,
  },
  circle2: {
    width: 200,
    height: 200,
    backgroundColor: colors.comic.yellow,
    bottom: 100,
    left: -80,
    opacity: 0.3,
  },
  circle3: {
    width: 150,
    height: 150,
    backgroundColor: colors.primary,
    bottom: -50,
    right: -30,
    opacity: 0.2,
  },
  star: {
    position: 'absolute',
  },
  star1: {
    top: 120,
    left: 30,
  },
  star2: {
    top: 200,
    right: 40,
  },
  star3: {
    top: 300,
    left: 60,
  },
  star4: {
    bottom: 250,
    right: 60,
  },
  starText: {
    fontSize: 32,
    color: colors.comic.yellow,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  premiumBadge: {
    backgroundColor: colors.black,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginTop: 20,
  },
  premiumText: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: colors.comic.yellow,
    letterSpacing: 2,
  },
  logoSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  totie: {
    width: 260,
    height: 260,
    marginBottom: -30,
  },
  brandLogo: {
    width: 260,
    height: 72,
    marginTop: -4,
    marginBottom: 20,
  },
  titleWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.text,
    textAlign: 'center',
  },
  titleAccent: {
    fontSize: 36,
    fontWeight: '900' as const,
    color: colors.primary,
    textAlign: 'center',
  },
  typewriterContainer: {
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
  },
  fakeTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  cursor: {
    fontSize: 28,
    fontWeight: '400' as const,
    color: colors.textSecondary,
  },
  accentCursor: {
    fontSize: 36,
    color: colors.primary,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  bottomSection: {
    paddingBottom: 40,
    alignItems: 'center',
    width: '100%',
  },
  tapHint: {
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.black,
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 60,
    shadowColor: colors.black,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  tapText: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: colors.white,
    textAlign: 'center',
  },
  termsText: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 16,
    paddingHorizontal: 20,
  },
  termsLink: {
    color: colors.text,
    fontWeight: '600' as const,
    textDecorationLine: 'underline' as const,
  },
});
