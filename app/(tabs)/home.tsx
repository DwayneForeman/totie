import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Animated, Easing, Platform, LayoutRectangle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Refrigerator, ChefHat, Sparkles, TrendingUp, Link as LinkIcon, Check, Camera, ArrowRight, RotateCcw } from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import colors from '@/constants/colors';
import CoachMarks, { SpotlightRefs } from '@/components/CoachMarks';
import PremiumPaywall from '@/components/PremiumPaywall';

export default function HomeTab() {
  const router = useRouter();
  const { userProfile, recipes, pantryItems, isTutorialComplete, completeTutorial, isPremium, canSaveRecipeFromLink, incrementFreeRecipeSaves } = useApp();
  const [showTutorial, setShowTutorial] = useState(false);
  const [spotlightRefs, setSpotlightRefs] = useState<SpotlightRefs>({});
  const [showPremiumPaywall, setShowPremiumPaywall] = useState(false);
  const [paywallFeatureName, setPaywallFeatureName] = useState<string | undefined>(undefined);
  const scrollViewRef = useRef<ScrollView>(null);

  const addRecipeRef = useRef<View>(null);
  const myKitchenRef = useRef<View>(null);
  const cookNowRef = useRef<View>(null);
  const snapCravingRef = useRef<View>(null);
  const quickActionsScrollRef = useRef<ScrollView>(null);
  const name = userProfile?.userName || 'Chef';

  const fireShakeAnim = useRef(new Animated.Value(0)).current;
  const totieFloatAnim = useRef(new Animated.Value(0)).current;
  const [displayedText, setDisplayedText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  const hasPantry = pantryItems.length > 0;
  const hasRecipes = recipes.length > 0;
  const mealsCooked = userProfile?.mealsCooked || 0;

  const getCurrentStep = useCallback((): number => {
    if (!hasPantry) return 0;
    if (!hasRecipes) return 1;
    return 2;
  }, [hasPantry, hasRecipes]);

  const getTotieMessage = useCallback((): string => {
    if (!hasPantry) {
      return "First step — add what's already in your fridge or pantry! 🧊";
    }
    if (hasPantry && !hasRecipes) {
      return "Nice! Now add one recipe so I can match your kitchen. 📖";
    }
    if (hasRecipes && mealsCooked === 0) {
      return "You're ready! Tap Cook Now to see what you can make. 🍳";
    }
    return "Welcome back, chef! Tap Cook Now to find tonight's meal. 👨‍🍳";
  }, [hasPantry, hasRecipes, mealsCooked]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fireShakeAnim, {
          toValue: 1, duration: 100, easing: Easing.linear, useNativeDriver: true,
        }),
        Animated.timing(fireShakeAnim, {
          toValue: -1, duration: 100, easing: Easing.linear, useNativeDriver: true,
        }),
        Animated.timing(fireShakeAnim, {
          toValue: 1, duration: 100, easing: Easing.linear, useNativeDriver: true,
        }),
        Animated.timing(fireShakeAnim, {
          toValue: 0, duration: 100, easing: Easing.linear, useNativeDriver: true,
        }),
        Animated.delay(2000),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(totieFloatAnim, {
          toValue: -8, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true,
        }),
        Animated.timing(totieFloatAnim, {
          toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true,
        }),
      ])
    ).start();

    return () => {};
  }, [fireShakeAnim, totieFloatAnim]);

  useEffect(() => {
    const message = getTotieMessage();
    setDisplayedText('');
    setIsTypingComplete(false);

    let charIndex = 0;
    let isActive = true;

    const typingDelay = setTimeout(() => {
      const typingInterval = setInterval(() => {
        if (!isActive) { clearInterval(typingInterval); return; }
        if (charIndex < message.length) {
          setDisplayedText(message.slice(0, charIndex + 1));
          charIndex++;
          if (Platform.OS !== 'web') {
            Haptics.selectionAsync();
          }
        } else {
          clearInterval(typingInterval);
          setIsTypingComplete(true);
        }
      }, 40);
    }, 400);

    return () => {
      isActive = false;
      clearTimeout(typingDelay);
    };
  }, [getTotieMessage]);

  const fireShakeTransform = {
    transform: [
      { rotate: '3deg' as const },
      { translateX: fireShakeAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: [-2, 0, 2] }) },
      { rotate: fireShakeAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-1deg', '3deg', '7deg'] }) },
    ],
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const measureRefs = useCallback(() => {
    const measureElement = (ref: React.RefObject<View | null>): Promise<LayoutRectangle | null> => {
      return new Promise((resolve) => {
        if (ref.current) {
          ref.current.measureInWindow((x, y, width, height) => {
            if (x !== undefined && y !== undefined && width > 0 && height > 0) {
              resolve({ x, y, width, height });
            } else { resolve(null); }
          });
        } else { resolve(null); }
      });
    };

    Promise.all([
      measureElement(addRecipeRef),
      measureElement(myKitchenRef),
      measureElement(cookNowRef),
      measureElement(snapCravingRef),
    ]).then(([addRecipe, myKitchen, cookNow, snapCraving]) => {
      setSpotlightRefs({
        addRecipe: addRecipe || undefined,
        myKitchen: myKitchen || undefined,
        cookNow: cookNow || undefined,
        snapCraving: snapCraving || undefined,
      });
    });
  }, []);

  useEffect(() => {
    if (!isTutorialComplete) {
      const timer = setTimeout(() => {
        measureRefs();
        setTimeout(() => { setShowTutorial(true); }, 100);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isTutorialComplete, measureRefs]);

  const handleTutorialComplete = useCallback(() => {
    setShowTutorial(false);
    completeTutorial();
  }, [completeTutorial]);

  const currentStep = getCurrentStep();
  const allStepsDone = hasPantry && hasRecipes && mealsCooked > 0;

  const steps = [
    { label: 'Add Kitchen Items', done: hasPantry, active: currentStep === 0 },
    { label: 'Add a Recipe', done: hasRecipes, active: currentStep === 1 },
    { label: 'Cook Now', done: mealsCooked > 0, active: currentStep === 2 },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView ref={scrollViewRef} style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.name}>{name}!</Text>
            </View>
            <TouchableOpacity
              style={styles.streakBadgeWrapper}
              onPress={() => router.push('/gamification')}
              activeOpacity={0.8}
            >
              <Animated.View style={[styles.streakBadge, fireShakeTransform]}>
                <Text style={styles.streakText}>🔥 {userProfile?.currentStreak || 0}</Text>
              </Animated.View>
            </TouchableOpacity>
          </View>

          <View style={styles.totieSection}>
            <View style={styles.speechBubbleContainer}>
              <View style={styles.speechBubbleShadow} />
              <View style={styles.speechBubble}>
                <View style={styles.speechBubbleInner}>
                  <Text style={styles.speechText}>
                    {displayedText}
                    {!isTypingComplete && <Text style={styles.cursor}>|</Text>}
                  </Text>
                </View>
                <View style={styles.speechTailOuter} />
                <View style={styles.speechTailInner} />
              </View>
            </View>
            <Animated.Image
              source={{ uri: 'https://r2-pub.rork.com/attachments/7kh2kny7y4aoan2iczpas' }}
              style={[styles.totieImage, { transform: [{ translateY: Animated.add(totieFloatAnim, 20) }] }]}
              resizeMode="contain"
            />
          </View>

          {allStepsDone ? (
            <>
              <Text style={styles.sectionLabel}>WHAT&apos;S NEXT?</Text>
              <View style={styles.nextSessionCard}>
                <View style={styles.nextSessionTop}>
                  <View style={styles.nextSessionIconWrap}>
                    <ChefHat size={28} color={colors.white} strokeWidth={2.5} />
                  </View>
                  <View style={styles.nextSessionInfo}>
                    <Text style={styles.nextSessionTitle}>Ready to cook again?</Text>
                    <Text style={styles.nextSessionSubtitle}>{mealsCooked} meal{mealsCooked !== 1 ? 's' : ''} cooked so far — keep the streak!</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.nextSessionBtn}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (!isPremium) {
                      setPaywallFeatureName('Cook Now');
                      setShowPremiumPaywall(true);
                      return;
                    }
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push('/cook-now');
                  }}
                >
                  <Text style={styles.nextSessionBtnText}>Start Cooking</Text>
                  <ArrowRight size={18} color={colors.white} strokeWidth={2.5} />
                </TouchableOpacity>
                <View style={styles.nextSessionSecondaryRow}>
                  <TouchableOpacity
                    style={styles.nextSessionSecondaryBtn}
                    activeOpacity={0.7}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push('/kitchen');
                    }}
                  >
                    <RotateCcw size={14} color={colors.secondary} strokeWidth={2.5} />
                    <Text style={styles.nextSessionSecondaryText}>Update Kitchen</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.nextSessionSecondaryBtn}
                    activeOpacity={0.7}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push('/recipes?openAdd=link');
                    }}
                  >
                    <LinkIcon size={14} color={colors.secondary} strokeWidth={2.5} />
                    <Text style={styles.nextSessionSecondaryText}>Add Recipe</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.sectionLabel}>START HERE</Text>
              <View style={styles.stepsCard}>
                {steps.map((step, idx) => (
                  <TouchableOpacity
                    key={step.label}
                    style={[styles.stepRow, idx < steps.length - 1 && styles.stepRowBorder, step.active && !step.done && styles.stepRowActive]}
                    activeOpacity={0.7}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      if (idx === 0) router.push('/kitchen');
                      else if (idx === 1) router.push('/recipes?openAdd=link');
                      else {
                        if (!isPremium) {
                          setPaywallFeatureName('Cook Now');
                          setShowPremiumPaywall(true);
                          return;
                        }
                        router.push('/cook-now');
                      }
                    }}
                  >
                    <View style={[
                      styles.stepIndicator,
                      step.done && styles.stepIndicatorDone,
                      step.active && !step.done && styles.stepIndicatorActive,
                    ]}>
                      {step.done ? (
                        <Check size={14} color={colors.white} strokeWidth={3} />
                      ) : (
                        <Text style={[styles.stepNumber, step.active && styles.stepNumberActive]}>{idx + 1}</Text>
                      )}
                    </View>
                    <Text style={[
                      styles.stepLabel,
                      step.done && styles.stepLabelDone,
                      step.active && !step.done && styles.stepLabelActive,
                    ]}>{step.label}</Text>
                    {step.active && !step.done && (
                      <View style={styles.stepArrow}>
                        <Text style={styles.stepArrowText}>→</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
          <View style={styles.actionsGrid}>
            <View style={styles.actionsGridRow}>
              <TouchableOpacity
                style={[styles.actionCard, styles.actionOrange]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/kitchen');
                }}
                activeOpacity={0.8}
              >
                <View
                  ref={myKitchenRef}
                  style={[styles.actionIconWrap, styles.actionIconOrange]}
                >
                  <Refrigerator size={24} color={colors.white} strokeWidth={2.5} />
                </View>
                <Text style={styles.actionTitle}>My Kitchen</Text>
                <Text style={styles.actionSubtitleLight}>Manage pantry items</Text>
                {pantryItems.length > 0 && (
                  <View style={styles.countBadgeOrange}>
                    <Text style={styles.countText}>{pantryItems.length}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionCard, styles.actionRecipe]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/recipes?openAdd=link');
                }}
                activeOpacity={0.8}
              >
                <View
                  ref={addRecipeRef}
                  style={[styles.actionIconWrap, styles.actionIconAlt]}
                >
                  <LinkIcon size={24} color={colors.secondary} strokeWidth={2.5} />
                </View>
                <Text style={styles.actionTitleDark}>Add Recipe</Text>
                <Text style={styles.actionSubtitle}>From link or book</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionsGridRow}>
              <TouchableOpacity
                style={[styles.actionCard, styles.actionSecondary]}
                onPress={() => {
                  if (!isPremium) {
                    setPaywallFeatureName('Cook Now');
                    setShowPremiumPaywall(true);
                    return;
                  }
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push('/cook-now');
                }}
                activeOpacity={0.8}
              >
                <View
                  ref={cookNowRef}
                  style={styles.actionIconWrap}
                >
                  <ChefHat size={24} color={colors.white} strokeWidth={2.5} />
                </View>
                <Text style={styles.actionTitle}>Cook Now</Text>
                <Text style={styles.actionSubtitleLight}>See what you can make</Text>
                <Sparkles size={16} color={colors.comic.yellow} style={styles.sparkle} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionCard, styles.actionTurquoise]}
                onPress={() => {
                  if (!isPremium) {
                    setPaywallFeatureName('Screenshot \u2192 DIY recipe');
                    setShowPremiumPaywall(true);
                    return;
                  }
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/recipes?openAdd=craving');
                }}
                activeOpacity={0.8}
              >
                <View
                  ref={snapCravingRef}
                  style={[styles.actionIconWrap, styles.actionIconTurquoise]}
                >
                  <Camera size={24} color={colors.white} strokeWidth={2.5} />
                </View>
                <Text style={styles.actionTitle}>Snap a Craving</Text>
                <Text style={styles.actionSubtitleLight}>Photo to recipe</Text>
              </TouchableOpacity>
            </View>
          </View>

          {userProfile && (userProfile.mealsCooked > 0 || userProfile.totalSavings > 0) && (
            <>
              <Text style={styles.sectionLabel}>YOUR WINS</Text>
              <View style={styles.winsCard}>
                <View style={styles.winItem}>
                  <View style={styles.winIconWrap}>
                    <Text style={styles.winEmoji}>💰</Text>
                  </View>
                  <View style={styles.winContent}>
                    <Text style={styles.winValue}>${userProfile.totalSavings}</Text>
                    <Text style={styles.winLabel}>Saved</Text>
                  </View>
                  <TrendingUp size={20} color={colors.success} />
                </View>
                <View style={styles.winDivider} />
                <View style={styles.winItem}>
                  <View style={styles.winIconWrap}>
                    <Text style={styles.winEmoji}>🍳</Text>
                  </View>
                  <View style={styles.winContent}>
                    <Text style={styles.winValue}>{userProfile.mealsCooked}</Text>
                    <Text style={styles.winLabel}>Meals cooked</Text>
                  </View>
                </View>
              </View>
            </>
          )}

          {!hasPantry && !hasRecipes && (
            <View style={styles.emptyState}>
              <View style={styles.emptyBorder}>
                <Image
                  source={{ uri: 'https://r2-pub.rork.com/attachments/7kh2kny7y4aoan2iczpas' }}
                  style={styles.emptyTotie}
                  resizeMode="contain"
                />
                <Text style={styles.emptyTitle}>Your cooking journey starts here!</Text>
                <Text style={styles.emptySubtext}>
                  Add items to your kitchen, then save a recipe — Totie will show you what to cook.
                </Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push('/kitchen');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emptyButtonText}>Add Kitchen Items</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>

        <CoachMarks
          visible={showTutorial}
          onComplete={handleTutorialComplete}
          spotlightRefs={spotlightRefs}
          onStepChange={(stepId) => {
            if (stepId === 'snap-craving') {
              quickActionsScrollRef.current?.scrollToEnd({ animated: true });
              setTimeout(() => {
                if (snapCravingRef.current) {
                  snapCravingRef.current.measureInWindow((x, y, width, height) => {
                    if (x !== undefined && y !== undefined && width > 0 && height > 0) {
                      setSpotlightRefs(prev => ({
                        ...prev,
                        snapCraving: { x, y, width, height },
                      }));
                    }
                  });
                }
              }, 400);
            }
          }}
        />

        <PremiumPaywall
          visible={showPremiumPaywall}
          onClose={() => setShowPremiumPaywall(false)}
          featureName={paywallFeatureName}
        />
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
  scroll: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  name: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: colors.text,
    letterSpacing: -0.5,
  },
  streakBadgeWrapper: {
    padding: 4,
  },
  streakBadge: {
    backgroundColor: colors.comic.yellow,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: colors.black,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: colors.black,
  },
  totieSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  speechBubbleContainer: {
    flex: 1,
    maxWidth: '85%',
    position: 'relative',
  },
  speechBubbleShadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
    backgroundColor: colors.black,
    borderRadius: 24,
  },
  speechBubble: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 24,
    padding: 4,
    minHeight: 85,
    zIndex: 1,
  },
  speechBubbleInner: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.black,
    borderStyle: 'dashed',
    borderRadius: 20,
    padding: 14,
  },
  speechText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    lineHeight: 23,
  },
  speechTailOuter: {
    position: 'absolute',
    right: -14,
    bottom: 24,
    width: 0,
    height: 0,
    borderLeftWidth: 16,
    borderLeftColor: colors.black,
    borderTopWidth: 12,
    borderTopColor: 'transparent',
    borderBottomWidth: 12,
    borderBottomColor: 'transparent',
  },
  speechTailInner: {
    position: 'absolute',
    right: -10,
    bottom: 26,
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderLeftColor: colors.white,
    borderTopWidth: 10,
    borderTopColor: 'transparent',
    borderBottomWidth: 10,
    borderBottomColor: 'transparent',
  },
  cursor: {
    color: colors.primary,
    fontWeight: '400' as const,
  },
  totieImage: {
    width: 115,
    height: 115,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: colors.textSecondary,
    letterSpacing: 1.5,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  stepsCard: {
    marginHorizontal: 20,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 20,
    marginBottom: 28,
    overflow: 'hidden',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  stepRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  stepRowActive: {
    backgroundColor: '#FFF3E8',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  stepIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  stepIndicatorDone: {
    backgroundColor: colors.success,
  },
  stepIndicatorActive: {
    backgroundColor: colors.primary,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.textMuted,
  },
  stepNumberActive: {
    color: colors.white,
  },
  stepLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  stepLabelDone: {
    color: colors.success,
    textDecorationLine: 'line-through',
  },
  stepLabelActive: {
    color: colors.text,
    fontWeight: '700' as const,
  },
  stepArrow: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepArrowText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.primary,
  },
  actionsGrid: {
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 28,
  },
  actionsGridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 20,
    padding: 16,
    minHeight: 130,
  },
  actionOrange: {
    backgroundColor: colors.primary,
  },
  actionRecipe: {},
  actionSecondary: {
    backgroundColor: colors.secondary,
  },
  actionTurquoise: {
    backgroundColor: '#2AA5A5',
  },
  actionIconTurquoise: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  actionIconOrange: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionIconAlt: {
    backgroundColor: colors.secondaryLight,
  },
  actionIconMint: {
    backgroundColor: colors.mintLight,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.white,
    lineHeight: 20,
  },
  actionTitleDark: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
    lineHeight: 20,
  },
  actionSubtitle: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actionSubtitleLight: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  countBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.mint,
    borderRadius: 10,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countBadgeOrange: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 10,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: colors.white,
  },
  sparkle: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  winsCard: {
    marginHorizontal: 20,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 20,
    padding: 16,
    marginBottom: 28,
  },
  winItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  winIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  winEmoji: {
    fontSize: 22,
  },
  winContent: {
    flex: 1,
  },
  winValue: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: colors.text,
  },
  winLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  winDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 14,
  },
  emptyState: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  emptyBorder: {
    borderWidth: 3,
    borderColor: colors.black,
    borderStyle: 'dashed',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
  },
  emptyTotie: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.white,
  },
  bottomPadding: {
    height: 20,
  },
  nextSessionCard: {
    marginHorizontal: 20,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 20,
    padding: 18,
    marginBottom: 28,
  },
  nextSessionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  nextSessionIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  nextSessionInfo: {
    flex: 1,
  },
  nextSessionTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: colors.text,
    marginBottom: 2,
  },
  nextSessionSubtitle: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  nextSessionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 12,
  },
  nextSessionBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.white,
  },
  nextSessionSecondaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  nextSessionSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.secondaryLight,
    borderRadius: 12,
    paddingVertical: 10,
  },
  nextSessionSecondaryText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.secondary,
  },
});
