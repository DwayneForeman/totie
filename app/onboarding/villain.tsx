import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/Button';
import colors from '@/constants/colors';

export default function Villain() {
  const router = useRouter();

  const headlineOpacity = useRef(new Animated.Value(0)).current;
  const headlineTranslate = useRef(new Animated.Value(-20)).current;
  const receiptScale = useRef(new Animated.Value(0)).current;
  const receiptRotate = useRef(new Animated.Value(0)).current;
  const totieScale = useRef(new Animated.Value(0)).current;
  const totieFloat = useRef(new Animated.Value(0)).current;
  const speechScale = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  
  const totalPulse = useRef(new Animated.Value(1)).current;
  const priceShake = useRef(new Animated.Value(0)).current;

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
        Animated.timing(totalPulse, {
          toValue: 1.1,
          duration: 600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(totalPulse, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    const shakeWithHaptic = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    Animated.loop(
      Animated.sequence([
        Animated.timing(priceShake, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(priceShake, {
          toValue: -1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(priceShake, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
      ])
    ).start();

    setTimeout(shakeWithHaptic, 100);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(headlineOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(headlineTranslate, {
          toValue: 0,
          useNativeDriver: true,
          speed: 12,
          bounciness: 6,
        }),
      ]),
      Animated.delay(200),
      Animated.parallel([
        Animated.spring(receiptScale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 8,
          bounciness: 10,
        }),
        Animated.timing(receiptRotate, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(300),
      Animated.spring(totieScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 10,
        bounciness: 12,
      }),
      Animated.spring(speechScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 10,
        bounciness: 8,
      }),
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [
    buttonOpacity,
    headlineOpacity,
    headlineTranslate,
    priceShake,
    receiptRotate,
    receiptScale,
    speechScale,
    totalPulse,
    totieFloat,
    totieScale,
  ]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.topSection}>
            <Animated.Text style={[styles.headline, {
              opacity: headlineOpacity,
              transform: [{ translateY: headlineTranslate }],
            }]}>
              Meanwhile, this{'\n'}keeps happening...
            </Animated.Text>

            <Animated.View style={[styles.receiptCard, {
              transform: [
                { scale: receiptScale },
                { rotate: receiptRotate.interpolate({ inputRange: [0, 1], outputRange: ['-8deg', '0deg'] }) },
              ],
            }]}>
              <View style={styles.receiptHeader}>
                <Text style={styles.receiptBrand}>🛵 DeliveryApp</Text>
                <Text style={styles.receiptTime}>Today, 7:42 PM</Text>
              </View>
              
              <View style={styles.receiptDivider} />
              
              <View style={styles.receiptItem}>
                <Text style={styles.itemName}>Pad Thai</Text>
                <Text style={styles.itemPrice}>$18.99</Text>
              </View>
              <View style={styles.receiptItem}>
                <Text style={styles.itemName}>Spring Rolls (2)</Text>
                <Text style={styles.itemPrice}>$6.99</Text>
              </View>
              
              <View style={styles.receiptDivider} />
              
              <View style={styles.receiptItem}>
                <Text style={styles.itemLabel}>Subtotal</Text>
                <Text style={styles.itemValue}>$25.98</Text>
              </View>
              <View style={styles.receiptItem}>
                <Text style={styles.itemLabel}>Delivery Fee</Text>
                <Text style={styles.itemValue}>$3.99</Text>
              </View>
              <View style={styles.receiptItem}>
                <Text style={styles.itemLabel}>Service Fee</Text>
                <Text style={styles.itemValue}>$2.50</Text>
              </View>
              
              <View style={styles.receiptDivider} />
              
              <View style={styles.receiptTotal}>
                <Text style={styles.totalLabel}>TOTAL</Text>
                <Animated.Text style={[styles.totalAmount, {
                  transform: [
                    { scale: totalPulse },
                    { translateX: priceShake.interpolate({ inputRange: [-1, 0, 1], outputRange: [-3, 0, 3] }) },
                  ],
                }]}>$32.47</Animated.Text>
              </View>
            </Animated.View>

            <View style={styles.comparisonRow}>
              <Animated.View style={{
                transform: [
                  { scale: totieScale },
                  { translateY: totieFloat.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) },
                ],
              }}>
                <Image
                  source={{ uri: 'https://r2-pub.rork.com/attachments/7kh2kny7y4aoan2iczpas' }}
                  style={styles.totie}
                  resizeMode="contain"
                />
              </Animated.View>
              <Animated.View style={[styles.speechBubble, {
                transform: [{ scale: speechScale }],
              }]}>
                <Text style={styles.speechText}>
                  That pad thai? <Text style={styles.priceRed}>$32</Text> delivered.
                  {'\n'}You could make it for <Text style={styles.priceGreen}>$6</Text>.
                </Text>
                <View style={styles.speechTail} />
              </Animated.View>
            </View>
          </View>

          <View style={styles.bottomSection}>
            <Button
              title="Ugh, I know 😤"
              onPress={() => router.push('/onboarding/promise')}
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
    paddingTop: 20,
  },
  headline: {
    fontSize: 28,
    fontWeight: '800' as const,
    lineHeight: 36,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  receiptCard: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: colors.black,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  receiptHeader: {
    marginBottom: 12,
  },
  receiptBrand: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
  },
  receiptTime: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  receiptDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  receiptItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
  },
  itemLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  itemValue: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  receiptTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: colors.text,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: colors.comic.red,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  totie: {
    width: 80,
    height: 80,
  },
  speechBubble: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.black,
    padding: 16,
    marginLeft: -8,
    marginBottom: 12,
    position: 'relative',
  },
  speechTail: {
    position: 'absolute',
    left: -10,
    bottom: 16,
    width: 0,
    height: 0,
    borderRightWidth: 12,
    borderRightColor: colors.black,
    borderTopWidth: 8,
    borderTopColor: 'transparent',
    borderBottomWidth: 8,
    borderBottomColor: 'transparent',
  },
  speechText: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
    color: colors.text,
  },
  priceRed: {
    color: colors.comic.red,
    fontWeight: '800' as const,
  },
  priceGreen: {
    color: colors.primary,
    fontWeight: '800' as const,
  },
  bottomSection: {
    paddingBottom: 32,
    position: 'relative',
    zIndex: 50,
    elevation: 50,
  },
});
