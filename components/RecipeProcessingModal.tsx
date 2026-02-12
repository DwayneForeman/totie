import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { Check, X, BookOpen, ShoppingCart, Clock, Users, ListChecks, ChefHat } from 'lucide-react-native';
import colors from '@/constants/colors';
import { Recipe, FoodDumpItem } from '@/types';

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

const PROGRESS_TARGETS: Record<string, [number, number]> = {
  analyzing: [0.1, 0.25],
  generating: [0.3, 0.6],
  'creating-list': [0.65, 0.88],
};

const STEP_EMOJIS: Record<string, string> = {
  analyzing: '🔍',
  generating: '👨‍🍳',
  'creating-list': '🛒',
};

export default function RecipeProcessingModal({
  visible, step, item, recipe, error, onClose, onViewRecipe, onGoToGroceryList,
}: RecipeProcessingModalProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const emojiScale = useRef(new Animated.Value(1)).current;
  const doneScale = useRef(new Animated.Value(0)).current;
  const tipOpacity = useRef(new Animated.Value(1)).current;
  const shimmerPos = useRef(new Animated.Value(0)).current;
  const stepBounce = useRef(new Animated.Value(1)).current;
  const [tipIndex, setTipIndex] = useState(0);
  const [barWidth, setBarWidth] = useState(240);
  const creepRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!visible || step === 'done' || step === 'error') return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(emojiScale, { toValue: 1.2, duration: 800, useNativeDriver: true }),
        Animated.timing(emojiScale, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [visible, step, emojiScale]);

  useEffect(() => {
    if (!visible || step === 'done' || step === 'error') return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerPos, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(shimmerPos, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(500),
      ])
    );
    anim.start();
    return () => { anim.stop(); shimmerPos.setValue(0); };
  }, [visible, step, shimmerPos]);

  useEffect(() => {
    if (step === 'done' || step === 'error') return;
    stepBounce.setValue(0.5);
    Animated.spring(stepBounce, { toValue: 1, tension: 200, friction: 10, useNativeDriver: true }).start();
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
      Animated.spring(doneScale, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }).start();
      return;
    }
    if (step === 'error') return;
    const targets = PROGRESS_TARGETS[step];
    if (!targets) return;
    const [start, end] = targets;
    Animated.timing(progress, { toValue: start, duration: 350, useNativeDriver: false }).start(() => {
      const creep = Animated.timing(progress, { toValue: end, duration: 25000, useNativeDriver: false });
      creepRef.current = creep;
      creep.start();
    });
  }, [step, visible, progress, doneScale]);

  useEffect(() => {
    if (!visible || step === 'done' || step === 'error') return;
    const id = setInterval(() => {
      Animated.timing(tipOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setTipIndex(p => (p + 1) % COOKING_TIPS.length);
        Animated.timing(tipOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      });
    }, 4000);
    return () => clearInterval(id);
  }, [visible, step, tipOpacity]);

  useEffect(() => {
    if (!visible) {
      const t = setTimeout(() => {
        progress.setValue(0);
        doneScale.setValue(0);
        tipOpacity.setValue(1);
        setTipIndex(0);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [visible, progress, doneScale, tipOpacity]);

  const isStepDone = (s: string) => {
    const order = ['analyzing', 'generating', 'creating-list', 'done'];
    return order.indexOf(step) > order.indexOf(s);
  };

  const fillWidth = progress.interpolate({ inputRange: [0, 1], outputRange: [0, barWidth] });
  const shimmerX = shimmerPos.interpolate({ inputRange: [0, 1], outputRange: [-80, barWidth + 80] });

  const getTitle = (): string => {
    if (step === 'analyzing') return 'Analyzing your idea';
    if (step === 'generating') return 'Crafting your recipe';
    if (step === 'creating-list') return 'Almost there';
    return '';
  };

  const getSubtitle = (): string => {
    if (step === 'analyzing') {
      if (item?.type === 'image') return 'Scanning your photo with AI vision...';
      if (item?.type === 'link') return 'Extracting recipe from URL...';
      const content = item?.content || '';
      return `Understanding "${content.substring(0, 35)}${content.length > 35 ? '...' : ''}"`;
    }
    if (step === 'generating') return 'Building ingredients & cooking instructions...';
    if (step === 'creating-list') return 'Creating your smart grocery list...';
    return '';
  };

  const tip = COOKING_TIPS[tipIndex];
  const steps = [
    { key: 'analyzing', label: 'Analyze' },
    { key: 'generating', label: 'Recipe' },
    { key: 'creating-list', label: 'Grocery' },
  ] as const;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={ms.overlay}>
        <View style={ms.card}>
          {step === 'error' ? (
            <View style={ms.inner}>
              <View style={ms.errorCircle}>
                <X size={32} color="#EF4444" strokeWidth={2.5} />
              </View>
              <Text style={ms.doneTitle}>Something went wrong</Text>
              <Text style={ms.doneSubtitle}>{error || 'Failed to generate recipe. Please try again.'}</Text>
              <TouchableOpacity style={ms.errorBtn} onPress={onClose}>
                <Text style={ms.errorBtnText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : step === 'done' ? (
            <View style={ms.inner}>
              <Animated.View style={[ms.doneCircle, { transform: [{ scale: doneScale }] }]}>
                <Check size={32} color={colors.white} strokeWidth={3} />
              </Animated.View>
              <Text style={ms.doneTitle}>Recipe Created! 🎉</Text>
              <Text style={ms.doneSubtitle}>
                {recipe?.title || 'Your recipe'} is ready with a smart grocery list
              </Text>
              {recipe && (
                <View style={ms.recipePreview}>
                  <View style={ms.previewHeader}>
                    <ChefHat size={16} color={colors.secondary} strokeWidth={2.5} />
                    <Text style={ms.previewName} numberOfLines={1}>{recipe.title}</Text>
                  </View>
                  <View style={ms.previewMeta}>
                    <View style={ms.previewMetaItem}>
                      <Clock size={12} color={colors.textSecondary} />
                      <Text style={ms.previewMetaText}>{recipe.prepTime + recipe.cookTime}m</Text>
                    </View>
                    <View style={ms.previewDot} />
                    <View style={ms.previewMetaItem}>
                      <Users size={12} color={colors.textSecondary} />
                      <Text style={ms.previewMetaText}>{recipe.servings} servings</Text>
                    </View>
                    <View style={ms.previewDot} />
                    <View style={ms.previewMetaItem}>
                      <ListChecks size={12} color={colors.textSecondary} />
                      <Text style={ms.previewMetaText}>{recipe.ingredients.length} items</Text>
                    </View>
                  </View>
                </View>
              )}
              <View style={ms.doneActions}>
                <TouchableOpacity style={ms.viewBtn} onPress={onViewRecipe}>
                  <BookOpen size={16} color={colors.white} strokeWidth={2.5} />
                  <Text style={ms.viewBtnText}>View Recipe</Text>
                </TouchableOpacity>
                <TouchableOpacity style={ms.groceryListBtn} onPress={onGoToGroceryList}>
                  <ShoppingCart size={16} color={colors.secondary} strokeWidth={2.5} />
                  <Text style={ms.groceryListBtnText}>Grocery List</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={ms.inner}>
              <Animated.View style={[ms.emojiCircle, { transform: [{ scale: emojiScale }] }]}>
                <Text style={ms.emoji}>{STEP_EMOJIS[step] || '✨'}</Text>
              </Animated.View>

              <Text style={ms.procTitle}>{getTitle()}</Text>
              <Text style={ms.procSubtitle}>{getSubtitle()}</Text>

              <View style={ms.barWrap}>
                <View style={ms.barTrack} onLayout={e => setBarWidth(e.nativeEvent.layout.width)}>
                  <Animated.View style={[ms.barFill, { width: fillWidth }]}>
                    <Animated.View style={[ms.barShimmer, { transform: [{ translateX: shimmerX }] }]} />
                  </Animated.View>
                </View>
              </View>

              <View style={ms.stepsRow}>
                {steps.map((st, i) => {
                  const done = isStepDone(st.key);
                  const active = step === st.key;
                  return (
                    <React.Fragment key={st.key}>
                      {i > 0 && <View style={[ms.stepLine, done && ms.stepLineDone]} />}
                      <View style={ms.stepItem}>
                        <Animated.View style={[
                          ms.stepDot,
                          active && ms.stepDotActive,
                          done && ms.stepDotDone,
                          active ? { transform: [{ scale: stepBounce }] } : undefined,
                        ]}>
                          {done ? (
                            <Check size={10} color={colors.white} strokeWidth={3} />
                          ) : (
                            <Text style={[ms.stepNum, active && ms.stepNumActive]}>{i + 1}</Text>
                          )}
                        </Animated.View>
                        <Text style={[ms.stepLabel, active && ms.stepLabelActive, done && ms.stepLabelDone]}>
                          {st.label}
                        </Text>
                      </View>
                    </React.Fragment>
                  );
                })}
              </View>

              <View style={ms.tipDivider} />
              <Animated.View style={[ms.tipRow, { opacity: tipOpacity }]}>
                <Text style={ms.tipEmoji}>{tip.emoji}</Text>
                <Text style={ms.tipText}>{tip.text}</Text>
              </Animated.View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const ms = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.white,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.black,
    overflow: 'hidden',
  },
  inner: {
    padding: 28,
    alignItems: 'center',
  },
  emojiCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FFF5EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,107,74,0.15)',
  },
  emoji: {
    fontSize: 34,
  },
  procTitle: {
    fontSize: 21,
    fontWeight: '800' as const,
    color: colors.text,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  procSubtitle: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  barWrap: {
    width: '100%',
    marginBottom: 28,
  },
  barTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F0EFED',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: colors.primary,
    overflow: 'hidden',
  },
  barShimmer: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: 60,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 5,
  },
  stepsRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 28,
  },
  stepItem: {
    alignItems: 'center' as const,
    gap: 6,
  },
  stepLine: {
    width: 36,
    height: 2,
    backgroundColor: '#E8E8E8',
    marginHorizontal: 8,
  },
  stepLineDone: {
    backgroundColor: colors.success,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F5F4F2',
    borderWidth: 2,
    borderColor: '#E0DFDD',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  stepDotActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  stepDotDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  stepNum: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: colors.textMuted,
  },
  stepNumActive: {
    color: colors.primary,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.textMuted,
  },
  stepLabelActive: {
    color: colors.primary,
    fontWeight: '700' as const,
  },
  stepLabelDone: {
    color: colors.success,
  },
  tipDivider: {
    width: '80%',
    height: 1,
    backgroundColor: '#EEEDED',
    marginBottom: 18,
  },
  tipRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 10,
    paddingHorizontal: 4,
    minHeight: 40,
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
  doneCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.success,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 20,
  },
  doneTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: colors.text,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  doneSubtitle: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  recipePreview: {
    width: '100%',
    backgroundColor: '#FFF8F4',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,107,74,0.12)',
  },
  previewHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 10,
  },
  previewName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
  },
  previewMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  previewMetaItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  previewMetaText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  previewDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.textMuted,
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
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: colors.black,
  },
  viewBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.white,
  },
  groceryListBtn: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: colors.secondaryLight,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  groceryListBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.secondary,
  },
  errorCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FECACA',
  },
  errorBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderWidth: 2,
    borderColor: colors.black,
    marginTop: 4,
  },
  errorBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.white,
  },
});
