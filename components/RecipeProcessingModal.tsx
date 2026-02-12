import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Easing, Dimensions } from 'react-native';
import { Check, X, BookOpen, ShoppingCart, Clock, Users, ListChecks, ChefHat } from 'lucide-react-native';
import colors from '@/constants/colors';
import { Recipe, FoodDumpItem } from '@/types';

const { width: _SCREEN_WIDTH } = Dimensions.get('window');

type ProcessingStep = 'analyzing' | 'generating' | 'creating-list' | 'done' | 'error';

interface RecipeProcessingModalProps {
  visible: boolean;
  step: ProcessingStep;
  item: FoodDumpItem | null;
  recipe: Recipe | null;
  error: string | null;
  onClose: () => void;
  onViewRecipe: () => void;
  onGoToGroceryList: () => void;
}

const COOKING_TIPS = [
  { emoji: '💰', text: 'The avg delivery order costs $25+. Home cooking saves up to 70%!' },
  { emoji: '🍳', text: 'Home-cooked meals have ~60% fewer calories than takeout' },
  { emoji: '⏱️', text: 'Most recipes are faster to make than waiting for delivery' },
  { emoji: '🧠', text: 'Regular cooking boosts your mood and lowers stress' },
  { emoji: '🥗', text: 'You control every ingredient when you cook at home' },
  { emoji: '🌱', text: 'Home cooking creates up to 8x less food waste' },
  { emoji: '👨‍👩‍👧‍👦', text: 'Families who cook together save $4,000+ per year' },
  { emoji: '🔥', text: 'Your personalized AI recipe is almost ready!' },
];

const FLOATING_FOODS = ['🥕', '🍅', '🧅', '🌿', '🥦', '🍋'];

const FLOAT_POSITIONS: { top: number; left?: number; right?: number }[] = [
  { top: -2, left: 6 },
  { top: -2, right: 6 },
  { top: 48, left: -12 },
  { top: 48, right: -12 },
  { top: 98, left: 10 },
  { top: 98, right: 10 },
];

const STEP_DATA: Record<string, { emoji: string; title: string; accent: string }> = {
  analyzing: { emoji: '🔍', title: 'Analyzing your idea', accent: '#FF6B4A' },
  generating: { emoji: '👨‍🍳', title: 'Crafting your recipe', accent: '#1A535C' },
  'creating-list': { emoji: '🛒', title: 'Building grocery list', accent: '#00B894' },
};

const PROGRESS_TARGETS: Record<string, [number, number]> = {
  analyzing: [0.08, 0.28],
  generating: [0.32, 0.62],
  'creating-list': [0.66, 0.9],
};

const SPARKLE_EMOJIS = ['✨', '🎉', '⭐', '🌟', '✨', '🎊', '⭐', '🌟'];

export default function RecipeProcessingModal({
  visible, step, item, recipe, error, onClose, onViewRecipe, onGoToGroceryList,
}: RecipeProcessingModalProps) {
  console.log('[RecipeProcessingModal] render — visible:', visible, 'step:', step);
  const progress = useRef(new Animated.Value(0)).current;
  const iconPulse = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;
  const doneScale = useRef(new Animated.Value(0)).current;
  const tipOpacity = useRef(new Animated.Value(1)).current;
  const shimmerPos = useRef(new Animated.Value(0)).current;
  const stepBounce = useRef(new Animated.Value(1)).current;
  const cardSlide = useRef(new Animated.Value(60)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const floatAnims = useRef(
    FLOATING_FOODS.map(() => ({
      translateY: new Animated.Value(0),
      translateX: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.5),
    }))
  ).current;

  const sparkleAnims = useRef(
    Array.from({ length: 8 }, () => ({
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
    }))
  ).current;

  const [tipIndex, setTipIndex] = useState(0);
  const [barWidth, setBarWidth] = useState(260);
  const [progressPercent, setProgressPercent] = useState(0);
  const creepRef = useRef<Animated.CompositeAnimation | null>(null);
  const floatAnimsRef = useRef<{ y: Animated.CompositeAnimation; x: Animated.CompositeAnimation }[]>([]);

  useEffect(() => {
    const id = progress.addListener(({ value }) => {
      setProgressPercent(Math.round(value * 100));
    });
    return () => progress.removeListener(id);
  }, [progress]);

  useEffect(() => {
    if (visible) {
      cardSlide.setValue(60);
      cardOpacity.setValue(0);
      overlayOpacity.setValue(0);
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(cardSlide, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, cardSlide, cardOpacity, overlayOpacity]);

  useEffect(() => {
    if (!visible || step === 'done' || step === 'error') return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(iconPulse, { toValue: 1.12, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(iconPulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [visible, step, iconPulse]);

  useEffect(() => {
    if (!visible || step === 'done' || step === 'error') return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, { toValue: 0.7, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.15, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [visible, step, glowOpacity]);

  useEffect(() => {
    if (!visible || step === 'done' || step === 'error') {
      floatAnimsRef.current.forEach(a => { a.y.stop(); a.x.stop(); });
      floatAnimsRef.current = [];
      floatAnims.forEach(a => {
        a.opacity.setValue(0);
        a.scale.setValue(0.5);
        a.translateY.setValue(0);
        a.translateX.setValue(0);
      });
      return;
    }

    const refs: { y: Animated.CompositeAnimation; x: Animated.CompositeAnimation }[] = [];
    floatAnims.forEach((a, i) => {
      const delay = i * 150;
      const dur = 2200 + i * 250;
      const yAmp = 7 + (i % 3) * 4;
      const xAmp = 2 + (i % 2) * 3;

      Animated.timing(a.opacity, { toValue: 0.9, duration: 500, delay, useNativeDriver: true }).start();
      Animated.timing(a.scale, { toValue: 1, duration: 500, delay, useNativeDriver: true }).start();

      const floatY = Animated.loop(
        Animated.sequence([
          Animated.timing(a.translateY, { toValue: -yAmp, duration: dur, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(a.translateY, { toValue: yAmp, duration: dur, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      const driftX = Animated.loop(
        Animated.sequence([
          Animated.timing(a.translateX, { toValue: xAmp, duration: dur * 1.4, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(a.translateX, { toValue: -xAmp, duration: dur * 1.4, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );

      setTimeout(() => {
        floatY.start();
        driftX.start();
      }, delay);

      refs.push({ y: floatY, x: driftX });
    });

    floatAnimsRef.current = refs;

    return () => {
      refs.forEach(a => { a.y.stop(); a.x.stop(); });
    };
  }, [visible, step, floatAnims]);

  useEffect(() => {
    if (!visible || step === 'done' || step === 'error') return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerPos, { toValue: 1, duration: 1300, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(shimmerPos, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(500),
      ])
    );
    anim.start();
    return () => { anim.stop(); shimmerPos.setValue(0); };
  }, [visible, step, shimmerPos]);

  useEffect(() => {
    if (step === 'done' || step === 'error') return;
    stepBounce.setValue(0.3);
    Animated.spring(stepBounce, { toValue: 1, tension: 180, friction: 8, useNativeDriver: true }).start();
  }, [step, stepBounce]);

  useEffect(() => {
    if (!visible) {
      progress.setValue(0);
      doneScale.setValue(0);
      return;
    }
    if (creepRef.current) { creepRef.current.stop(); creepRef.current = null; }
    if (step === 'done') {
      Animated.spring(progress, { toValue: 1, tension: 50, friction: 8, useNativeDriver: false }).start();
      Animated.spring(doneScale, { toValue: 1, tension: 80, friction: 5, useNativeDriver: true }).start();

      sparkleAnims.forEach((s, i) => {
        const angle = (i / sparkleAnims.length) * Math.PI * 2;
        const dist = 45 + Math.random() * 25;
        Animated.parallel([
          Animated.timing(s.opacity, { toValue: 1, duration: 200, delay: 100 + i * 60, useNativeDriver: true }),
          Animated.spring(s.scale, { toValue: 1, tension: 120, friction: 6, delay: 100 + i * 60, useNativeDriver: true }),
          Animated.timing(s.translateX, { toValue: Math.cos(angle) * dist, duration: 650, delay: 100 + i * 60, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(s.translateY, { toValue: Math.sin(angle) * dist, duration: 650, delay: 100 + i * 60, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        ]).start(() => {
          Animated.timing(s.opacity, { toValue: 0, duration: 500, useNativeDriver: true }).start();
        });
      });
      return;
    }
    if (step === 'error') return;
    const targets = PROGRESS_TARGETS[step];
    if (!targets) return;
    const [start, end] = targets;
    Animated.timing(progress, { toValue: start, duration: 400, useNativeDriver: false }).start(() => {
      const creep = Animated.timing(progress, { toValue: end, duration: 25000, useNativeDriver: false });
      creepRef.current = creep;
      creep.start();
    });
  }, [step, visible, progress, doneScale, sparkleAnims]);

  useEffect(() => {
    if (!visible || step === 'done' || step === 'error') return;
    const id = setInterval(() => {
      Animated.timing(tipOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setTipIndex(p => (p + 1) % COOKING_TIPS.length);
        Animated.timing(tipOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      });
    }, 4500);
    return () => clearInterval(id);
  }, [visible, step, tipOpacity]);

  useEffect(() => {
    if (!visible) {
      const t = setTimeout(() => {
        progress.setValue(0);
        doneScale.setValue(0);
        tipOpacity.setValue(1);
        setTipIndex(0);
        setProgressPercent(0);
        sparkleAnims.forEach(s => {
          s.scale.setValue(0);
          s.opacity.setValue(0);
          s.translateX.setValue(0);
          s.translateY.setValue(0);
        });
        floatAnims.forEach(a => {
          a.opacity.setValue(0);
          a.scale.setValue(0.5);
          a.translateY.setValue(0);
          a.translateX.setValue(0);
        });
      }, 400);
      return () => clearTimeout(t);
    }
  }, [visible, progress, doneScale, tipOpacity, sparkleAnims, floatAnims]);

  const isStepDone = (s: string) => {
    const order = ['analyzing', 'generating', 'creating-list', 'done'];
    return order.indexOf(step) > order.indexOf(s);
  };

  const fillWidth = progress.interpolate({ inputRange: [0, 1], outputRange: [0, barWidth] });
  const shimmerX = shimmerPos.interpolate({ inputRange: [0, 1], outputRange: [-50, barWidth + 50] });

  const getSubtitle = (): string => {
    if (step === 'analyzing') {
      if (item?.type === 'image') return 'Scanning your photo with AI vision...';
      if (item?.type === 'link') return 'Extracting recipe from URL...';
      const content = item?.content || '';
      return `Understanding "${content.substring(0, 28)}${content.length > 28 ? '...' : ''}"`;
    }
    if (step === 'generating') return 'Building ingredients & step-by-step instructions...';
    if (step === 'creating-list') return 'Creating your personalized grocery list...';
    return '';
  };

  const stepData = step !== 'done' && step !== 'error' ? STEP_DATA[step] : null;
  const accent = stepData?.accent || colors.primary;
  const tip = COOKING_TIPS[tipIndex];

  const steps = [
    { key: 'analyzing', label: 'Analyze', icon: '🔍' },
    { key: 'generating', label: 'Recipe', icon: '👨‍🍳' },
    { key: 'creating-list', label: 'Grocery', icon: '🛒' },
  ] as const;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[s.overlay, { opacity: overlayOpacity }]}>
        <Animated.View style={[s.card, { transform: [{ translateY: cardSlide }], opacity: cardOpacity }]}>

          {step === 'error' ? (
            <View style={s.inner}>
              <View style={s.errWrap}>
                <View style={s.errRingOuter} />
                <View style={s.errCircle}>
                  <X size={26} color="#DC2626" strokeWidth={2.5} />
                </View>
              </View>
              <Text style={s.errTitle}>Something went wrong</Text>
              <Text style={s.errSub}>{error || 'Failed to generate recipe. Please try again.'}</Text>
              <TouchableOpacity style={s.errBtn} onPress={onClose} activeOpacity={0.85}>
                <Text style={s.errBtnText}>Try Again</Text>
              </TouchableOpacity>
            </View>

          ) : step === 'done' ? (
            <View style={s.inner}>
              <View style={s.doneWrap}>
                {sparkleAnims.map((sa, i) => (
                  <Animated.View
                    key={i}
                    style={[
                      s.sparkle,
                      {
                        opacity: sa.opacity,
                        transform: [
                          { translateX: sa.translateX },
                          { translateY: sa.translateY },
                          { scale: sa.scale },
                        ],
                      },
                    ]}
                  >
                    <Text style={s.sparkleText}>{SPARKLE_EMOJIS[i]}</Text>
                  </Animated.View>
                ))}
                <Animated.View style={[s.doneCircle, { transform: [{ scale: doneScale }] }]}>
                  <Check size={30} color={colors.white} strokeWidth={3} />
                </Animated.View>
              </View>
              <Text style={s.doneTitle}>Recipe Created!</Text>
              <Text style={s.doneSub}>
                {recipe?.title || 'Your recipe'} is ready with a smart grocery list
              </Text>
              {recipe && (
                <View style={s.recipeCard}>
                  <View style={s.rcHeader}>
                    <View style={s.rcIconWrap}>
                      <ChefHat size={13} color={colors.secondary} strokeWidth={2.5} />
                    </View>
                    <Text style={s.rcName} numberOfLines={1}>{recipe.title}</Text>
                  </View>
                  <View style={s.rcMeta}>
                    <View style={s.rcChip}>
                      <Clock size={10} color={colors.textSecondary} />
                      <Text style={s.rcChipText}>{recipe.prepTime + recipe.cookTime}m</Text>
                    </View>
                    <View style={s.rcChip}>
                      <Users size={10} color={colors.textSecondary} />
                      <Text style={s.rcChipText}>{recipe.servings} servings</Text>
                    </View>
                    <View style={s.rcChip}>
                      <ListChecks size={10} color={colors.textSecondary} />
                      <Text style={s.rcChipText}>{recipe.ingredients.length} items</Text>
                    </View>
                  </View>
                </View>
              )}
              <View style={s.doneActions}>
                <TouchableOpacity style={s.viewBtn} onPress={onViewRecipe} activeOpacity={0.85}>
                  <BookOpen size={16} color={colors.white} strokeWidth={2.5} />
                  <Text style={s.viewBtnText}>View Recipe</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.groceryBtn} onPress={onGoToGroceryList} activeOpacity={0.85}>
                  <ShoppingCart size={16} color={colors.secondary} strokeWidth={2.5} />
                  <Text style={s.groceryBtnText}>Grocery List</Text>
                </TouchableOpacity>
              </View>
            </View>

          ) : (
            <View style={s.inner}>
              <View style={s.sceneWrap}>
                <Animated.View
                  style={[
                    s.glowRing,
                    { opacity: glowOpacity, borderColor: accent },
                  ]}
                />
                <Animated.View
                  style={[
                    s.glowRingOuter,
                    { opacity: Animated.multiply(glowOpacity, 0.4), borderColor: accent },
                  ]}
                />

                {FLOATING_FOODS.map((food, i) => (
                  <Animated.View
                    key={i}
                    style={[
                      s.floatItem,
                      FLOAT_POSITIONS[i] as any,
                      {
                        opacity: floatAnims[i].opacity,
                        transform: [
                          { translateY: floatAnims[i].translateY },
                          { translateX: floatAnims[i].translateX },
                          { scale: floatAnims[i].scale },
                        ],
                      },
                    ]}
                  >
                    <Text style={s.floatEmoji}>{food}</Text>
                  </Animated.View>
                ))}

                <Animated.View
                  style={[
                    s.iconCircle,
                    { borderColor: `${accent}30`, transform: [{ scale: iconPulse }] },
                  ]}
                >
                  <Animated.Text style={[s.iconEmoji, { transform: [{ scale: stepBounce }] }]}>
                    {stepData?.emoji || '✨'}
                  </Animated.Text>
                </Animated.View>
              </View>

              <Text style={s.procTitle}>{stepData?.title || 'Processing...'}</Text>
              <Text style={s.procSub}>{getSubtitle()}</Text>

              <View style={s.progressWrap}>
                <View style={s.progressHeader}>
                  <Text style={s.progressLabel}>Progress</Text>
                  <Text style={[s.progressPct, { color: accent }]}>{progressPercent}%</Text>
                </View>
                <View
                  style={s.barTrack}
                  onLayout={e => setBarWidth(e.nativeEvent.layout.width)}
                >
                  <Animated.View style={[s.barFill, { width: fillWidth, backgroundColor: accent }]}>
                    <Animated.View style={[s.barShimmer, { transform: [{ translateX: shimmerX }] }]} />
                  </Animated.View>
                </View>
              </View>

              <View style={s.stepsRow}>
                {steps.map((st, i) => {
                  const done = isStepDone(st.key);
                  const active = step === st.key;
                  return (
                    <React.Fragment key={st.key}>
                      {i > 0 && <View style={[s.stepLine, done && s.stepLineDone]} />}
                      <View style={s.stepCol}>
                        <Animated.View
                          style={[
                            s.stepDot,
                            active && [s.stepDotActive, { borderColor: accent }],
                            done && s.stepDotDone,
                            active ? { transform: [{ scale: stepBounce }] } : undefined,
                          ]}
                        >
                          {done ? (
                            <Check size={10} color={colors.white} strokeWidth={3} />
                          ) : active ? (
                            <Text style={s.stepDotIcon}>{st.icon}</Text>
                          ) : (
                            <Text style={s.stepDotNum}>{i + 1}</Text>
                          )}
                        </Animated.View>
                        <Text style={[
                          s.stepText,
                          active && [s.stepTextActive, { color: accent }],
                          done && s.stepTextDone,
                        ]}>{st.label}</Text>
                      </View>
                    </React.Fragment>
                  );
                })}
              </View>

              <View style={s.tipCard}>
                <View style={s.tipBadge}>
                  <Text style={s.tipBadgeText}>Did you know?</Text>
                </View>
                <Animated.View style={[s.tipBody, { opacity: tipOpacity }]}>
                  <Text style={s.tipEmoji}>{tip.emoji}</Text>
                  <Text style={s.tipText}>{tip.text}</Text>
                </Animated.View>
              </View>
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.white,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 14,
  },
  inner: {
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 28,
    alignItems: 'center' as const,
  },

  sceneWrap: {
    width: 130,
    height: 130,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 18,
  },
  glowRing: {
    position: 'absolute' as const,
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 2.5,
  },
  glowRingOuter: {
    position: 'absolute' as const,
    width: 126,
    height: 126,
    borderRadius: 63,
    borderWidth: 1.5,
  },
  floatItem: {
    position: 'absolute' as const,
    zIndex: 1,
  },
  floatEmoji: {
    fontSize: 19,
  },
  iconCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#FFF5EE',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2.5,
    zIndex: 2,
  },
  iconEmoji: {
    fontSize: 36,
  },

  procTitle: {
    fontSize: 23,
    fontWeight: '800' as const,
    color: colors.text,
    marginBottom: 6,
    letterSpacing: -0.5,
    textAlign: 'center' as const,
  },
  procSub: {
    fontSize: 13.5,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 19,
    marginBottom: 24,
    paddingHorizontal: 4,
  },

  progressWrap: {
    width: '100%',
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  progressPct: {
    fontSize: 15,
    fontWeight: '800' as const,
    letterSpacing: -0.3,
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F0EFED',
    overflow: 'hidden' as const,
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden' as const,
  },
  barShimmer: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: 44,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 4,
  },

  stepsRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 22,
  },
  stepCol: {
    alignItems: 'center' as const,
    gap: 5,
  },
  stepLine: {
    width: 28,
    height: 2,
    backgroundColor: '#E8E8E8',
    marginHorizontal: 6,
    borderRadius: 1,
  },
  stepLineDone: {
    backgroundColor: colors.success,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F4F2',
    borderWidth: 2,
    borderColor: '#E0DFDD',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  stepDotActive: {
    backgroundColor: '#FFF5EE',
    borderWidth: 2.5,
  },
  stepDotDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  stepDotIcon: {
    fontSize: 13,
  },
  stepDotNum: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: colors.textMuted,
  },
  stepText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.textMuted,
  },
  stepTextActive: {
    fontWeight: '700' as const,
  },
  stepTextDone: {
    color: colors.success,
  },

  tipCard: {
    width: '100%',
    backgroundColor: '#FFFAF6',
    borderRadius: 16,
    padding: 14,
    paddingTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,107,74,0.08)',
  },
  tipBadge: {
    alignSelf: 'flex-start' as const,
    backgroundColor: 'rgba(255,107,74,0.08)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 8,
  },
  tipBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: colors.primary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
  },
  tipBody: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 10,
  },
  tipEmoji: {
    fontSize: 18,
    marginTop: 1,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    lineHeight: 19,
  },

  doneWrap: {
    width: 120,
    height: 120,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 14,
  },
  sparkle: {
    position: 'absolute' as const,
  },
  sparkleText: {
    fontSize: 16,
  },
  doneCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: colors.success,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  doneTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: colors.text,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  doneSub: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  recipeCard: {
    width: '100%',
    backgroundColor: '#FFF8F4',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,107,74,0.1)',
  },
  rcHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginBottom: 10,
  },
  rcIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.secondaryLight,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  rcName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
  },
  rcMeta: {
    flexDirection: 'row' as const,
    gap: 8,
    flexWrap: 'wrap' as const,
  },
  rcChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.04)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rcChipText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  doneActions: {
    flexDirection: 'row' as const,
    gap: 12,
    width: '100%',
  },
  viewBtn: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: colors.secondary,
    borderRadius: 16,
    paddingVertical: 15,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  viewBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.white,
  },
  groceryBtn: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: colors.secondaryLight,
    borderRadius: 16,
    paddingVertical: 15,
  },
  groceryBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.secondary,
  },

  errWrap: {
    width: 100,
    height: 100,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 14,
  },
  errRingOuter: {
    position: 'absolute' as const,
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 2,
    borderColor: '#FECACA',
  },
  errCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: '#FECACA',
  },
  errTitle: {
    fontSize: 21,
    fontWeight: '800' as const,
    color: colors.text,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  errSub: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  errBtn: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 36,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  errBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.white,
  },
});
