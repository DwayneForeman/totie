import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/Button';
import colors from '@/constants/colors';
import { Link2, Camera, Mic, PenLine, Search, Sparkles } from 'lucide-react-native';

const STEPS = [
  {
    id: 1,
    title: 'Tell us what you have',
    subtitle: 'In your kitchen',
    methods: [
      { icon: Camera, label: 'Photo scan' },
      { icon: Mic, label: 'Say it' },
      { icon: Search, label: 'Search' },
    ],
    color: '#FFF3E0',
    iconColor: '#E65100',
  },
  {
    id: 2,
    title: 'Add your recipes',
    subtitle: 'From anywhere',
    methods: [
      { icon: Link2, label: 'Paste a link' },
      { icon: Camera, label: 'Screenshot' },
      { icon: Mic, label: 'Voice' },
      { icon: PenLine, label: 'Manual' },
    ],
    color: '#E3F2FD',
    iconColor: '#1976D2',
  },
  {
    id: 3,
    title: 'We do the magic',
    subtitle: 'Mix & match meals for you',
    methods: [
      { icon: Sparkles, label: 'AI matching' },
    ],
    color: colors.primaryLight,
    iconColor: colors.primary,
  },
];

export default function HowItWorks() {
  const router = useRouter();
  
  const headerAnim = useRef(new Animated.Value(0)).current;
  const step1Anim = useRef(new Animated.Value(0)).current;
  const step2Anim = useRef(new Animated.Value(0)).current;
  const step3Anim = useRef(new Animated.Value(0)).current;
  const totieAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  
  const floatAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;

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
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.sequence([
      Animated.spring(headerAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 12,
        bounciness: 8,
      }),
      Animated.spring(step1Anim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 10,
        bounciness: 10,
      }),
      Animated.spring(step2Anim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 10,
        bounciness: 10,
      }),
      Animated.spring(step3Anim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 10,
        bounciness: 10,
      }),
      Animated.parallel([
        Animated.spring(totieAnim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 8,
          bounciness: 12,
        }),
        Animated.timing(buttonAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const stepAnims = [step1Anim, step2Anim, step3Anim];

  return (
    <View style={styles.container}>
      <View style={styles.bgPattern} pointerEvents="none">
        <Animated.View style={[styles.bgCircle, styles.bgCircle1, {
          transform: [
            { translateY: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 15] }) },
          ],
        }]} />
        <Animated.View style={[styles.bgCircle, styles.bgCircle2, {
          transform: [
            { translateX: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) },
          ],
        }]} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Animated.Text style={[styles.headline, {
            opacity: headerAnim,
            transform: [
              { translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) },
            ],
          }]}>
            Here{"'"}s how{'\n'}it works
          </Animated.Text>

          <View style={styles.stepsContainer}>
            {STEPS.map((step, index) => (
              <Animated.View 
                key={step.id}
                style={[styles.stepCard, {
                  opacity: stepAnims[index],
                  transform: [
                    { scale: stepAnims[index] },
                    { translateX: stepAnims[index].interpolate({ inputRange: [0, 1], outputRange: [index % 2 === 0 ? -30 : 30, 0] }) },
                  ],
                }]}
              >
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{step.id}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
                  <View style={styles.methodsRow}>
                    {step.methods.map((method, mIndex) => (
                      <View key={mIndex} style={[styles.methodBadge, { backgroundColor: step.color }]}>
                        <method.icon size={14} color={step.iconColor} strokeWidth={2.5} />
                        <Text style={[styles.methodText, { color: step.iconColor }]}>{method.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </Animated.View>
            ))}
          </View>

          <Animated.View style={[styles.totieSection, {
            opacity: totieAnim,
            transform: [
              { scale: totieAnim },
              { translateY: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) },
            ],
          }]}>
            <Image
              source={{ uri: 'https://r2-pub.rork.com/attachments/7kh2kny7y4aoan2iczpas' }}
              style={styles.totie}
              resizeMode="contain"
            />
            <Animated.Text style={[styles.sparkle, styles.sparkle1, {
              opacity: sparkleAnim,
              transform: [{ scale: sparkleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] }) }],
            }]}>✨</Animated.Text>
            <Animated.Text style={[styles.sparkle, styles.sparkle2, {
              opacity: sparkleAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.6] }),
              transform: [{ scale: sparkleAnim.interpolate({ inputRange: [0, 1], outputRange: [1.2, 0.8] }) }],
            }]}>⭐</Animated.Text>
          </Animated.View>

          <View style={styles.footer}>
            <Button
              title="Got it! 👍"
              onPress={() => router.push('/onboarding/eating-habits')}
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
  bgCircle: {
    position: 'absolute',
    borderRadius: 200,
  },
  bgCircle1: {
    width: 180,
    height: 180,
    backgroundColor: colors.primaryLight,
    top: -60,
    right: -60,
    opacity: 0.5,
  },
  bgCircle2: {
    width: 120,
    height: 120,
    backgroundColor: colors.comic.yellow,
    bottom: 150,
    left: -40,
    opacity: 0.3,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  headline: {
    fontSize: 32,
    fontWeight: '900' as const,
    lineHeight: 40,
    color: colors.text,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  stepsContainer: {
    gap: 14,
  },
  stepCard: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    shadowColor: colors.black,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: colors.white,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: colors.text,
    marginBottom: 2,
  },
  stepSubtitle: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  methodsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 4,
  },
  methodText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  totieSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    position: 'relative',
  },
  totie: {
    width: 90,
    height: 90,
  },
  sparkle: {
    position: 'absolute',
    fontSize: 24,
  },
  sparkle1: {
    top: 10,
    right: '30%',
  },
  sparkle2: {
    bottom: 20,
    left: '35%',
  },
  footer: {
    paddingBottom: 32,
  },
});
