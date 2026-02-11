import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Easing, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/Button';
import colors from '@/constants/colors';
import { FolderOpen, Flame, BookOpen, ShoppingCart, ArrowRight } from 'lucide-react-native';

const FEATURES = [
  {
    id: 1,
    icon: FolderOpen,
    title: 'Recipes scattered everywhere?',
    subtitle: 'One place for all your recipes',
    iconBg: '#E8F4FF',
    iconColor: '#2D7DD2',
  },
  {
    id: 2,
    icon: Flame,
    title: 'Saving but never cooking?',
    subtitle: 'We match recipes to what you have',
    iconBg: '#FFE8E2',
    iconColor: colors.primary,
  },
  {
    id: 3,
    icon: BookOpen,
    title: 'Cookbooks collecting dust?',
    subtitle: 'Search them by ingredient',
    iconBg: '#FFF3E0',
    iconColor: '#E67E22',
  },
  {
    id: 4,
    icon: ShoppingCart,
    title: 'See a recipe video?',
    subtitle: 'Video → ingredients → groceries → cook',
    iconBg: '#E8F5E9',
    iconColor: '#27AE60',
    showTotie: true,
  },
];

export default function Features() {
  const router = useRouter();

  const headerAnim = useRef(new Animated.Value(0)).current;
  const card1Anim = useRef(new Animated.Value(0)).current;
  const card2Anim = useRef(new Animated.Value(0)).current;
  const card3Anim = useRef(new Animated.Value(0)).current;
  const card4Anim = useRef(new Animated.Value(0)).current;
  const totieAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.sequence([
      Animated.spring(headerAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 14,
        bounciness: 6,
      }),
      Animated.stagger(100, [
        Animated.spring(card1Anim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 12,
          bounciness: 6,
        }),
        Animated.spring(card2Anim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 12,
          bounciness: 6,
        }),
        Animated.spring(card3Anim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 12,
          bounciness: 6,
        }),
        Animated.spring(card4Anim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 12,
          bounciness: 6,
        }),
      ]),
      Animated.parallel([
        Animated.spring(totieAnim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 8,
          bounciness: 14,
        }),
        Animated.timing(buttonAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const cardAnims = [card1Anim, card2Anim, card3Anim, card4Anim];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View style={{
            opacity: headerAnim,
            transform: [
              { translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-25, 0] }) },
            ],
          }}>
            <Text style={styles.headline}>
              Here's how{'\n'}
              <Text style={styles.headlineAccent}>Totie helps</Text>
            </Text>
          </Animated.View>

          <View style={styles.cardsContainer}>
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              const isLastCard = feature.showTotie;
              return (
                <Animated.View
                  key={feature.id}
                  style={[
                    styles.featureCard,
                    {
                      transform: [
                        { scale: cardAnims[index] },
                        { translateY: cardAnims[index].interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
                      ],
                      opacity: cardAnims[index],
                    },
                  ]}
                >
                  <View style={[styles.iconBadge, { backgroundColor: feature.iconBg }]}>
                    <Icon size={18} color={feature.iconColor} strokeWidth={2.5} />
                  </View>
                  <View style={styles.cardContent}>
                    <View style={styles.titleRow}>
                      <Text style={styles.cardTitle}>{feature.title}</Text>
                      <ArrowRight size={16} color={colors.text} strokeWidth={2} />
                    </View>
                    <Text style={styles.cardSubtitle}>{feature.subtitle}</Text>
                  </View>
                  {isLastCard && (
                    <Animated.View style={[styles.totieContainer, {
                      opacity: totieAnim,
                      transform: [
                        { scale: totieAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) },
                        { translateY: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) },
                      ],
                    }]}>
                      <Image
                        source={{ uri: 'https://r2-pub.rork.com/attachments/7kh2kny7y4aoan2iczpas' }}
                        style={styles.totieImage}
                        resizeMode="contain"
                      />
                      <View style={styles.emojiCircle}>
                        <Text style={styles.totieEmoji}>😄</Text>
                      </View>
                    </Animated.View>
                  )}
                </Animated.View>
              );
            })}
          </View>

          <Animated.View style={[styles.footer, {
            opacity: buttonAnim,
            transform: [
              { translateY: buttonAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
            ],
          }]}>
            <Button
              title="Let's go! 🚀"
              onPress={() => router.push('/onboarding/profile-summary')}
            />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF7F4',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  headline: {
    fontSize: 32,
    fontWeight: '800' as const,
    lineHeight: 40,
    color: colors.text,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 28,
  },
  headlineAccent: {
    color: colors.text,
  },
  cardsContainer: {
    gap: 14,
  },
  featureCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    minHeight: 100,
    position: 'relative',
    overflow: 'visible',
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardContent: {
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.primary,
    letterSpacing: -0.1,
  },
  totieContainer: {
    position: 'absolute',
    bottom: -8,
    right: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  totieImage: {
    width: 56,
    height: 56,
  },
  emojiCircle: {
    backgroundColor: colors.white,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  totieEmoji: {
    fontSize: 14,
  },
  footer: {
    marginTop: 'auto' as const,
    paddingTop: 24,
    paddingBottom: 32,
  },
});
