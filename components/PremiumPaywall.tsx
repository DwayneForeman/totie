import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Animated, Easing, Image, ScrollView, ActivityIndicator } from 'react-native';
import { X, Crown, Lock, Check, Zap, RefreshCw } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import colors from '@/constants/colors';
import { useApp } from '@/context/AppContext';
import { useRevenueCat } from '@/context/RevenueCatContext';

const FEATURES = [
  { name: 'Basic pantry tracking', free: true, premium: true },
  { name: 'Save recipes from links', free: false, premium: true },
  { name: 'Screenshot → DIY recipe', free: false, premium: true },
  { name: 'AI fridge scanning', free: false, premium: true },
  { name: 'Smart grocery lists', free: false, premium: true },
  { name: 'Unlimited recipe storage', free: false, premium: true },
  { name: 'Savings tracker & stats', free: false, premium: true },
];

interface PremiumPaywallProps {
  visible: boolean;
  onClose: () => void;
  featureName?: string;
}

export default function PremiumPaywall({ visible, onClose, featureName }: PremiumPaywallProps) {
  const { shouldShowRescuePaywall, markRescuePaywallSeen } = useApp();
  const { 
    currentOffering, 
    isLoadingOfferings, 
    purchasePackage, 
    restorePurchases,
    isPurchasing,
    isRestoring,
    purchaseError,
    clearPurchaseError,
  } = useRevenueCat();
  
  const isRescue = shouldShowRescuePaywall();

  const headerAnim = useRef(new Animated.Value(0)).current;
  const totieAnim = useRef(new Animated.Value(0)).current;
  const tableAnim = useRef(new Animated.Value(0)).current;
  const plansAnim = useRef(new Animated.Value(0)).current;
  const buttonsAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const crownAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      clearPurchaseError();
      headerAnim.setValue(0);
      totieAnim.setValue(0);
      tableAnim.setValue(0);
      plansAnim.setValue(0);
      buttonsAnim.setValue(0);
      slideAnim.setValue(1);

      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

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
          Animated.timing(crownAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(crownAnim, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.sequence([
        Animated.parallel([
          Animated.spring(headerAnim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 12,
            bounciness: 8,
          }),
          Animated.spring(totieAnim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 10,
            bounciness: 12,
          }),
        ]),
        Animated.spring(tableAnim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 10,
          bounciness: 8,
        }),
        Animated.spring(plansAnim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 10,
          bounciness: 8,
        }),
        Animated.timing(buttonsAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      if (isRescue) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.05,
              duration: 600,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 600,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ).start();
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }
  }, [visible, isRescue]);

  const handleSubscribe = async () => {
    const monthlyPackage = currentOffering?.availablePackages.find(
      pkg => pkg.identifier === '$rc_monthly'
    ) || currentOffering?.availablePackages[0];

    if (!monthlyPackage) {
      console.error('[Paywall] No package available to purchase');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const success = await purchasePackage(monthlyPackage);
    
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (isRescue) {
        await markRescuePaywallSeen();
      }
      onClose();
    }
  };

  const handleRestore = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const hasPremium = await restorePurchases();
    
    if (hasPremium) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    }
  };

  const handleDismiss = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isRescue) {
      await markRescuePaywallSeen();
    }
    onClose();
  };

  const monthlyPackage = currentOffering?.availablePackages.find(
    pkg => pkg.identifier === '$rc_monthly'
  ) || currentOffering?.availablePackages[0];

  const price = monthlyPackage?.product.priceString || '$9.99';
  const hasFreeTrial = monthlyPackage?.product.introPrice?.periodNumberOfUnits !== undefined;

  return (
    <Modal
      visible={visible}
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <Animated.View style={[
        styles.fullScreen,
        {
          transform: [{
            translateY: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 800],
            }),
          }],
        },
      ]}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <Pressable style={styles.closeButton} onPress={handleDismiss}>
            <X size={20} color={colors.textSecondary} strokeWidth={2.5} />
          </Pressable>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {isRescue && (
              <Animated.View style={[styles.rescueBannerTop, { opacity: headerAnim }]}>
                <Zap size={14} color={colors.white} fill={colors.white} />
                <Text style={styles.rescueBannerTopText}>SPECIAL OFFER — ONE TIME ONLY</Text>
                <Zap size={14} color={colors.white} fill={colors.white} />
              </Animated.View>
            )}

            <Animated.View style={[styles.header, {
              opacity: headerAnim,
              transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
            }]}>
              {isRescue ? (
                <>
                  <Text style={styles.headline}>Wait! Just for you</Text>
                  {featureName && (
                    <View style={styles.featureBadge}>
                      <Text style={styles.featureBadgeText}>{featureName}</Text>
                    </View>
                  )}
                  <Text style={styles.subheadline}>
                    You loved saving that recipe — unlock everything at a special price
                  </Text>
                </>
              ) : (
                <>
                  <View style={styles.headlineRow}>
                    <Text style={styles.headline}>Unlock </Text>
                    <Text style={styles.headlineBrand}>Totie Plus</Text>
                    <Crown size={20} color={colors.comic.yellow} fill={colors.comic.yellow} style={{ marginLeft: 4 }} />
                  </View>
                  {featureName && (
                    <View style={styles.featureBadge}>
                      <Lock size={12} color={colors.primary} strokeWidth={2.5} />
                      <Text style={styles.featureBadgeText}>{featureName}</Text>
                    </View>
                  )}
                </>
              )}
            </Animated.View>

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
              <Animated.View style={[styles.crownBadge, {
                transform: [
                  { rotate: crownAnim.interpolate({ inputRange: [0, 1], outputRange: ['-5deg', '5deg'] }) },
                  { scale: crownAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.1, 1] }) },
                ],
              }]}>
                <Crown size={20} color={colors.comic.yellow} fill={colors.comic.yellow} />
              </Animated.View>
            </Animated.View>

            <Animated.View style={[styles.tableCard, {
              opacity: tableAnim,
              transform: [{ scale: tableAnim }],
            }]}>
              <View style={styles.tableHeader}>
                <View style={styles.tableHeaderCell} />
                <Text style={styles.tableHeaderText}>Free</Text>
                <View style={styles.premiumHeader}>
                  <Text style={styles.premiumHeaderText}>Premium</Text>
                </View>
              </View>

              {FEATURES.map((feature, index) => (
                <View key={index} style={[styles.tableRow, index === FEATURES.length - 1 && styles.tableRowLast]}>
                  <Text style={styles.featureName}>{feature.name}</Text>
                  <View style={styles.tableCell}>
                    {feature.free ? (
                      <Check size={18} color={colors.primary} strokeWidth={3} />
                    ) : (
                      <Lock size={16} color={colors.textMuted} strokeWidth={2} />
                    )}
                  </View>
                  <View style={[styles.tableCell, styles.premiumCell]}>
                    <Check size={18} color={colors.primary} strokeWidth={3} />
                  </View>
                </View>
              ))}
            </Animated.View>

            <Animated.View style={[styles.planSection, {
              opacity: plansAnim,
              transform: [
                { translateY: plansAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
                ...(isRescue ? [{ scale: pulseAnim }] : []),
              ],
            }]}>
              {isRescue && (
                <View style={styles.rescueSticker}>
                  <Text style={styles.rescueStickerText}>You will never see this offer again</Text>
                </View>
              )}
              <View style={[styles.planCard, isRescue && styles.planCardRescue]}>
                {isLoadingOfferings ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.loadingText}>Loading pricing...</Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.planBadge}>
                      <Text style={styles.planBadgeText}>
                        {hasFreeTrial ? '7-DAY FREE TRIAL' : 'BEST VALUE'}
                      </Text>
                    </View>
                    <View style={styles.planContent}>
                      <View style={styles.planInfo}>
                        <Text style={styles.planLabel}>
                          {isRescue ? 'Special Premium' : 'Monthly Premium'}
                        </Text>
                        <Text style={styles.planSubLabel}>Full access to everything</Text>
                      </View>
                      <View style={styles.planPricing}>
                        <Text style={styles.planPrice}>{price}</Text>
                        <Text style={styles.planPeriod}>/month</Text>
                      </View>
                    </View>
                  </>
                )}
              </View>
            </Animated.View>

            {purchaseError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{purchaseError}</Text>
              </View>
            )}

            <Animated.View style={[styles.trustSection, { opacity: buttonsAnim }]}>
              <Text style={styles.trustItem}>✓ Cancel anytime</Text>
              {hasFreeTrial && <Text style={styles.trustItem}>✓ 7-day free trial</Text>}
            </Animated.View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable 
              style={[styles.subscribeButton, (isPurchasing || isLoadingOfferings) && styles.buttonDisabled]} 
              onPress={handleSubscribe}
              disabled={isPurchasing || isLoadingOfferings}
            >
              {isPurchasing ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Crown size={18} color={colors.white} fill={colors.white} />
                  <Text style={styles.subscribeText}>
                    {hasFreeTrial ? 'Start Free Trial' : 'Subscribe Now'}
                  </Text>
                </>
              )}
            </Pressable>
            
            <View style={styles.footerButtons}>
              <Pressable 
                style={styles.restoreButton} 
                onPress={handleRestore}
                disabled={isRestoring}
              >
                {isRestoring ? (
                  <ActivityIndicator size="small" color={colors.textSecondary} />
                ) : (
                  <>
                    <RefreshCw size={14} color={colors.textSecondary} />
                    <Text style={styles.restoreText}>Restore</Text>
                  </>
                )}
              </Pressable>
              
              <Pressable style={styles.skipButton} onPress={handleDismiss}>
                <Text style={styles.skipText}>
                  {isRescue ? "No thanks" : 'Continue Free'}
                </Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 56,
    flexGrow: 1,
  },
  rescueBannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.comic.red,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.black,
  },
  rescueBannerTopText: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: colors.white,
    letterSpacing: 0.5,
  },
  header: {
    marginBottom: 16,
    alignItems: 'center',
  },
  headlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: colors.text,
  },
  headlineBrand: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: colors.primary,
  },
  subheadline: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
    paddingHorizontal: 16,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginTop: 10,
  },
  featureBadgeText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.primary,
  },
  totieSection: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative' as const,
  },
  totie: {
    width: 80,
    height: 80,
  },
  crownBadge: {
    position: 'absolute' as const,
    top: -10,
    right: '32%',
    backgroundColor: colors.black,
    borderRadius: 20,
    padding: 8,
  },
  tableCard: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.black,
    backgroundColor: colors.backgroundWarm,
  },
  tableHeaderCell: {
    flex: 1,
    padding: 12,
  },
  tableHeaderText: {
    width: 60,
    fontSize: 13,
    fontWeight: '700' as const,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  premiumHeader: {
    width: 80,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  premiumHeaderText: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: colors.white,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  featureName: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.text,
  },
  tableCell: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  premiumCell: {
    width: 80,
    backgroundColor: colors.primaryLight,
  },
  planSection: {
    marginBottom: 16,
  },
  rescueSticker: {
    alignSelf: 'center',
    backgroundColor: colors.comic.red,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: colors.black,
  },
  rescueStickerText: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: colors.white,
    letterSpacing: 0.3,
    textTransform: 'uppercase' as const,
  },
  planCard: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 16,
    padding: 18,
    position: 'relative' as const,
  },
  planCardRescue: {
    borderColor: colors.comic.red,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  planBadge: {
    position: 'absolute' as const,
    top: -12,
    alignSelf: 'center',
    left: '50%',
    marginLeft: -70,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  planBadgeText: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: colors.white,
    letterSpacing: 0.5,
  },
  planContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  planInfo: {
    flex: 1,
  },
  planLabel: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: colors.text,
  },
  planSubLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    marginTop: 2,
  },
  planPricing: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: colors.text,
  },
  planPeriod: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#DC2626',
    textAlign: 'center',
  },
  trustSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 16,
  },
  trustItem: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    gap: 12,
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 16,
    height: 56,
    shadowColor: colors.black,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  subscribeText: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: colors.white,
  },
  footerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
  restoreText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  skipButton: {
    alignItems: 'center',
    padding: 8,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
});
