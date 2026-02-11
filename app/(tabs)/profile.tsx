import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Platform, Modal, TextInput, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, Share2, Settings, Crown, Bug, Trash2, X, Check, Zap } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import colors from '@/constants/colors';

type SettingsModal = 'diet' | 'household' | 'notifications' | null;

const DIET_OPTIONS = ['Balanced', 'Vegetarian', 'Vegan', 'Pescatarian', 'Keto', 'Paleo', 'Gluten-Free', 'Dairy-Free'];
const HOUSEHOLD_OPTIONS = [
  { value: '1', label: 'Just me' },
  { value: '2', label: '2 people' },
  { value: '3-4', label: '3-4 people' },
  { value: '5+', label: '5+ people' },
];

export default function ProfileTab() {
  const { userProfile, pantryItems, updateProfile, claimChallengeReward, resetApp } = useApp();
  const router = useRouter();
  const [debugTaps, setDebugTaps] = useState(0);
  const [debugEnabled, setDebugEnabled] = useState(false);
  const [resetTaps, setResetTaps] = useState(0);
  const [resetDebugEnabled, setResetDebugEnabled] = useState(false);
  const [activeModal, setActiveModal] = useState<SettingsModal>(null);
  const [editName, setEditName] = useState('');
  const [showNameEdit, setShowNameEdit] = useState(false);
  const [claimedChallenges, setClaimedChallenges] = useState<Set<string>>(new Set());
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notifyMealReminder, setNotifyMealReminder] = useState(true);
  const [notifyChallenges, setNotifyChallenges] = useState(true);
  const [notifyTips, setNotifyTips] = useState(false);

  const handleTitleTap = useCallback(() => {
    const newTaps = debugTaps + 1;
    setDebugTaps(newTaps);
    if (newTaps >= 10 && !debugEnabled) {
      setDebugEnabled(true);
      console.log('Debug mode enabled!');
    }
  }, [debugTaps, debugEnabled]);

  const handleDebugPress = useCallback(() => {
    router.replace('/onboarding');
  }, [router]);

  const handleSettingsTitleTap = useCallback(() => {
    const newTaps = resetTaps + 1;
    setResetTaps(newTaps);
    if (newTaps >= 10 && !resetDebugEnabled) {
      setResetDebugEnabled(true);
      console.log('[Debug] Fresh reset mode enabled!');
    }
  }, [resetTaps, resetDebugEnabled]);

  const handleFreshReset = useCallback(() => {
    Alert.alert(
      'Fresh Install Reset',
      'This will wipe ALL data (profile, recipes, pantry, settings, onboarding, premium, everything) and restart as if the app was just installed. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            console.log('[Debug] Performing fresh install reset...');
            await resetApp();
            router.replace('/onboarding');
          },
        },
      ]
    );
  }, [resetApp, router]);

  const handleShareWins = useCallback(() => {
    if (!userProfile) return;
    const message = `I've saved $${userProfile.totalSavings} by cooking ${userProfile.mealsCooked} meals at home with Totie! 🍳💰`;
    if (Platform.OS === 'web') {
      if (navigator.share) {
        navigator.share({ title: 'My Totie Wins', text: message }).catch(() => {});
      } else {
        Alert.alert('Share Your Wins', message + '\n\n(Copy and share with friends!)');
      }
    } else {
      Alert.alert('Share Your Wins', message + '\n\n(Copy and share with friends!)');
    }
  }, [userProfile]);

  const handleSettingPress = useCallback((item: string) => {
    console.log('[profile] setting pressed:', item);
    switch (item) {
      case 'Dietary Preferences':
        setActiveModal('diet');
        break;
      case 'Household Size':
        setActiveModal('household');
        break;
      case 'Notifications':
        setActiveModal('notifications');
        break;
      case 'Help & Feedback':
        const deviceId = userProfile?.createdAt || 'unknown';
        const emailSubject = encodeURIComponent('Totie App Feedback');
        const emailBody = encodeURIComponent(`\n\n\n---\nDevice ID: ${deviceId}`);
        const mailtoUrl = `mailto:support@totieapp.com?subject=${emailSubject}&body=${emailBody}`;
        Linking.openURL(mailtoUrl).catch(() => {
          Alert.alert('Email Not Available', 'Please email us at support@totieapp.com');
        });
        break;
      case 'Rate the App ⭐':
        Alert.alert(
          'Rate Totie',
          'Enjoying Totie? Your review helps other home cooks discover us!',
          [
            { text: 'Maybe Later', style: 'cancel' },
            { text: 'Rate Now ⭐', onPress: () => console.log('[profile] rate app tapped') },
          ]
        );
        break;
    }
  }, []);

  const handleDietSelect = useCallback((diet: string) => {
    updateProfile({ diet });
    setActiveModal(null);
    Alert.alert('Updated!', `Diet set to ${diet}`);
  }, [updateProfile]);

  const handleHouseholdSelect = useCallback((value: '1' | '2' | '3-4' | '5+') => {
    updateProfile({ householdSize: value });
    setActiveModal(null);
    const label = HOUSEHOLD_OPTIONS.find(o => o.value === value)?.label || value;
    Alert.alert('Updated!', `Household size set to ${label}`);
  }, [updateProfile]);

  const handleClaimReward = useCallback((challengeKey: string, reward: number, completed: boolean) => {
    if (!completed) {
      Alert.alert('Keep Going!', 'Complete this challenge to claim your reward.');
      return;
    }
    if (claimedChallenges.has(challengeKey)) {
      Alert.alert('Already Claimed', 'You\'ve already collected this reward!');
      return;
    }
    claimChallengeReward(reward);
    setClaimedChallenges(prev => new Set([...prev, challengeKey]));
    Alert.alert('🪙 Reward Claimed!', `You earned ${reward} Totie Coins!`);
  }, [claimedChallenges, claimChallengeReward]);

  const handleNameEdit = useCallback(() => {
    if (!userProfile) return;
    setEditName(userProfile.userName);
    setShowNameEdit(true);
  }, [userProfile]);

  const handleNameSave = useCallback(() => {
    const trimmed = editName.trim();
    if (trimmed.length === 0) {
      Alert.alert('Oops', 'Name cannot be empty.');
      return;
    }
    updateProfile({ userName: trimmed });
    setShowNameEdit(false);
  }, [editName, updateProfile]);

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Log Out',
      'This will reset all your data and progress. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await resetApp();
            router.replace('/onboarding');
          },
        },
      ]
    );
  }, [resetApp, router]);

  const handleSettingsGear = useCallback(() => {
    Alert.alert(
      'Settings',
      'What would you like to do?',
      [
        { text: 'Edit Name', onPress: handleNameEdit },
        { text: 'Dietary Preferences', onPress: () => setActiveModal('diet') },
        { text: 'Household Size', onPress: () => setActiveModal('household') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, [handleNameEdit]);

  const challenges = useMemo(() => {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const hoursLeft = Math.max(0, Math.floor((endOfDay.getTime() - now.getTime()) / (1000 * 60 * 60)));

    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
    endOfWeek.setHours(23, 59, 59, 999);
    const daysLeft = Math.max(0, Math.floor((endOfWeek.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    const mealsCooked = userProfile?.mealsCooked || 0;
    const pantryCount = pantryItems.length;

    return {
      daily: [
        {
          key: 'daily-meal',
          title: 'Log your first meal',
          progress: Math.min(mealsCooked, 1),
          target: 1,
          reward: 15,
          completed: mealsCooked >= 1,
        },
        {
          key: 'daily-pantry',
          title: 'Add 3 pantry items',
          progress: Math.min(pantryCount, 3),
          target: 3,
          reward: 25,
          completed: pantryCount >= 3,
        },
      ],
      weekly: [
        {
          key: 'weekly-meals',
          title: 'Cook 3 home meals',
          progress: Math.min(mealsCooked, 3),
          target: 3,
          reward: 100,
          completed: mealsCooked >= 3,
        },
      ],
      hoursLeft,
      daysLeft,
    };
  }, [userProfile?.mealsCooked, pantryItems.length]);

  const showImpactPopup = useCallback((type: 'saved' | 'meals' | 'recipes' | 'coins') => {
    const popups = {
      saved: {
        title: '💰 Money Saved',
        message: 'This is the total amount you\'ve saved by cooking at home instead of ordering delivery or eating out. Every home-cooked meal adds up!'
      },
      meals: {
        title: '🍳 Meals Cooked',
        message: 'Track how many delicious meals you\'ve prepared at home. Each meal is a win for your wallet and your health!'
      },
      recipes: {
        title: '📖 Recipes Tried',
        message: 'The number of unique recipes you\'ve explored. Keep experimenting to expand your cooking skills!'
      },
      coins: {
        title: '🪙 Totie Coins',
        message: 'Earn coins by completing challenges, cooking meals, and staying consistent. Redeem them for rewards and unlock special features!'
      }
    };
    Alert.alert(popups[type].title, popups[type].message);
  }, []);

  if (!userProfile) return null;

  const memberDate = new Date(userProfile.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric'
  });

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleTitleTap} activeOpacity={1}>
            <Text style={styles.title}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsBtn} onPress={handleSettingsGear} activeOpacity={0.7}>
            <Settings size={22} color={colors.text} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.profileCard} activeOpacity={0.8} onPress={handleNameEdit}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarWrap}>
                <Image
                  source={{ uri: 'https://r2-pub.rork.com/attachments/7kh2kny7y4aoan2iczpas' }}
                  style={styles.avatar}
                  resizeMode="contain"
                />
                <View style={styles.streakBadge}>
                  <Text style={styles.streakText}>🔥{userProfile.currentStreak}</Text>
                </View>
              </View>
              <View style={styles.profileInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.userName}>{userProfile.userName}</Text>
                  <Text style={styles.editHint}>tap to edit</Text>
                </View>
                <Text style={styles.memberSince}>Since {memberDate}</Text>
                <View style={styles.dietTag}>
                  <Text style={styles.dietText}>{userProfile.diet || 'Balanced'}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          <Text style={styles.sectionLabel}>YOUR IMPACT</Text>
          <View style={styles.statsGrid}>
            <TouchableOpacity
              style={[styles.statCard, styles.statCardPrimary]}
              onPress={() => showImpactPopup('saved')}
              activeOpacity={0.7}
            >
              <Text style={styles.statEmoji}>💰</Text>
              <Text style={styles.statValue}>${userProfile.totalSavings}</Text>
              <Text style={styles.statLabel}>Saved</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => showImpactPopup('meals')}
              activeOpacity={0.7}
            >
              <Text style={styles.statEmoji}>🍳</Text>
              <Text style={styles.statValueDark}>{userProfile.mealsCooked}</Text>
              <Text style={styles.statLabel}>Meals</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => showImpactPopup('recipes')}
              activeOpacity={0.7}
            >
              <Text style={styles.statEmoji}>📖</Text>
              <Text style={styles.statValueDark}>{userProfile.recipesTried}</Text>
              <Text style={styles.statLabel}>Recipes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statCard, styles.statCardAccent]}
              onPress={() => showImpactPopup('coins')}
              activeOpacity={0.7}
            >
              <Text style={styles.statEmoji}>🪙</Text>
              <Text style={styles.statValue}>{userProfile.coins}</Text>
              <Text style={styles.statLabelLight}>Coins</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.shareCard} onPress={handleShareWins} activeOpacity={0.7}>
            <View style={styles.shareContent}>
              <View style={styles.shareIconWrap}>
                <Share2 size={20} color={colors.primary} strokeWidth={2.5} />
              </View>
              <View>
                <Text style={styles.shareTitle}>Share Your Wins</Text>
                <Text style={styles.shareSubtext}>Brag about your savings!</Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <Text style={styles.sectionLabel}>CHALLENGES</Text>
          <View style={styles.challengesCard}>
            <View style={styles.challengeHeader}>
              <View style={[styles.challengeTag, styles.challengeTagDaily]}>
                <Zap size={12} color={colors.text} />
                <Text style={styles.challengeTagText}>Daily</Text>
              </View>
              <Text style={styles.challengeTime}>{challenges.hoursLeft}h left</Text>
            </View>

            {challenges.daily.map((challenge) => (
              <View key={challenge.key} style={styles.challengeItem}>
                <View style={styles.challengeInfo}>
                  <Text style={[styles.challengeTitle, challenge.completed && styles.challengeTitleCompleted]}>
                    {challenge.completed ? '✓ ' : ''}{challenge.title}
                  </Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${(challenge.progress / challenge.target) * 100}%` }]} />
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.challengeReward,
                    challenge.completed && !claimedChallenges.has(challenge.key) && styles.challengeRewardReady,
                    claimedChallenges.has(challenge.key) && styles.challengeRewardClaimed,
                  ]}
                  onPress={() => handleClaimReward(challenge.key, challenge.reward, challenge.completed)}
                  activeOpacity={0.7}
                >
                  {claimedChallenges.has(challenge.key) ? (
                    <Check size={14} color={colors.success} strokeWidth={3} />
                  ) : (
                    <>
                      <Text style={styles.rewardText}>{challenge.reward}</Text>
                      <Text style={styles.rewardCoin}>🪙</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.challengeDivider} />

            <View style={styles.challengeHeader}>
              <View style={[styles.challengeTag, styles.challengeTagWeekly]}>
                <Crown size={12} color={colors.white} />
                <Text style={styles.challengeTagTextLight}>Weekly</Text>
              </View>
              <Text style={styles.challengeTime}>{challenges.daysLeft}d left</Text>
            </View>

            {challenges.weekly.map((challenge) => (
              <View key={challenge.key} style={styles.challengeItem}>
                <View style={styles.challengeInfo}>
                  <Text style={[styles.challengeTitle, challenge.completed && styles.challengeTitleCompleted]}>
                    {challenge.completed ? '✓ ' : ''}{challenge.title}
                  </Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${(challenge.progress / challenge.target) * 100}%` }]} />
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.challengeReward,
                    challenge.completed && !claimedChallenges.has(challenge.key) && styles.challengeRewardReady,
                    claimedChallenges.has(challenge.key) && styles.challengeRewardClaimed,
                  ]}
                  onPress={() => handleClaimReward(challenge.key, challenge.reward, challenge.completed)}
                  activeOpacity={0.7}
                >
                  {claimedChallenges.has(challenge.key) ? (
                    <Check size={14} color={colors.success} strokeWidth={3} />
                  ) : (
                    <>
                      <Text style={styles.rewardText}>{challenge.reward}</Text>
                      <Text style={styles.rewardCoin}>🪙</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <TouchableOpacity onPress={handleSettingsTitleTap} activeOpacity={1}>
            <Text style={styles.sectionLabel}>SETTINGS</Text>
          </TouchableOpacity>
          <View style={styles.settingsCard}>
            {['Dietary Preferences', 'Household Size', 'Notifications', 'Help & Feedback', 'Rate the App ⭐'].map((item, index) => (
              <TouchableOpacity
                key={item}
                style={[styles.settingItem, index !== 4 && styles.settingItemBorder]}
                onPress={() => handleSettingPress(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.settingText}>{item}</Text>
                <View style={styles.settingRight}>
                  {item === 'Dietary Preferences' && (
                    <Text style={styles.settingValue}>{userProfile.diet || 'Balanced'}</Text>
                  )}
                  {item === 'Household Size' && (
                    <Text style={styles.settingValue}>
                      {HOUSEHOLD_OPTIONS.find(o => o.value === userProfile.householdSize)?.label || 'Not set'}
                    </Text>
                  )}
                  <ChevronRight size={18} color={colors.textMuted} />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {debugEnabled && (
            <TouchableOpacity style={styles.debugBtn} onPress={handleDebugPress}>
              <Bug size={18} color={colors.comic.red} />
              <Text style={styles.debugText}>Go to Onboarding (Debug)</Text>
            </TouchableOpacity>
          )}

          {resetDebugEnabled && (
            <TouchableOpacity style={styles.freshResetBtn} onPress={handleFreshReset}>
              <Trash2 size={18} color="#fff" />
              <Text style={styles.freshResetText}>Fresh Install Reset (Debug)</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </SafeAreaView>

      <Modal visible={activeModal === 'diet'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dietary Preferences</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.modalClose}>
                <X size={22} color={colors.text} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {DIET_OPTIONS.map((diet) => (
                <TouchableOpacity
                  key={diet}
                  style={[styles.optionRow, userProfile.diet === diet && styles.optionRowActive]}
                  onPress={() => handleDietSelect(diet)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.optionText, userProfile.diet === diet && styles.optionTextActive]}>{diet}</Text>
                  {userProfile.diet === diet && <Check size={20} color={colors.primary} strokeWidth={3} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={activeModal === 'household'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Household Size</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.modalClose}>
                <X size={22} color={colors.text} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
            {HOUSEHOLD_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.optionRow, userProfile.householdSize === opt.value && styles.optionRowActive]}
                onPress={() => handleHouseholdSelect(opt.value as '1' | '2' | '3-4' | '5+')}
                activeOpacity={0.7}
              >
                <Text style={[styles.optionText, userProfile.householdSize === opt.value && styles.optionTextActive]}>{opt.label}</Text>
                {userProfile.householdSize === opt.value && <Check size={20} color={colors.primary} strokeWidth={3} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <Modal visible={activeModal === 'notifications'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.modalClose}>
                <X size={22} color={colors.text} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setNotificationsEnabled(!notificationsEnabled)}
              activeOpacity={0.7}
            >
              <Text style={styles.toggleLabel}>All Notifications</Text>
              <View style={[styles.toggle, notificationsEnabled && styles.toggleActive]}>
                <View style={[styles.toggleKnob, notificationsEnabled && styles.toggleKnobActive]} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setNotifyMealReminder(!notifyMealReminder)}
              activeOpacity={0.7}
            >
              <Text style={styles.toggleLabel}>Meal Reminders</Text>
              <View style={[styles.toggle, notifyMealReminder && styles.toggleActive]}>
                <View style={[styles.toggleKnob, notifyMealReminder && styles.toggleKnobActive]} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setNotifyChallenges(!notifyChallenges)}
              activeOpacity={0.7}
            >
              <Text style={styles.toggleLabel}>Challenge Updates</Text>
              <View style={[styles.toggle, notifyChallenges && styles.toggleActive]}>
                <View style={[styles.toggleKnob, notifyChallenges && styles.toggleKnobActive]} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setNotifyTips(!notifyTips)}
              activeOpacity={0.7}
            >
              <Text style={styles.toggleLabel}>Tips & Tricks</Text>
              <View style={[styles.toggle, notifyTips && styles.toggleActive]}>
                <View style={[styles.toggleKnob, notifyTips && styles.toggleKnobActive]} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalSaveBtn}
              onPress={() => {
                setActiveModal(null);
                Alert.alert('Saved!', 'Notification preferences updated.');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.modalSaveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showNameEdit} transparent animationType="fade">
        <KeyboardAvoidingView
          style={styles.nameModalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.nameModalBackdrop}>
              <View style={styles.nameModalCard}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Edit Name</Text>
                  <TouchableOpacity onPress={() => setShowNameEdit(false)} style={styles.modalClose}>
                    <X size={22} color={colors.text} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.nameInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Your name"
                  placeholderTextColor={colors.textMuted}
                  autoFocus
                  maxLength={30}
                  returnKeyType="done"
                  onSubmitEditing={handleNameSave}
                />
                <View style={styles.nameModalActions}>
                  <TouchableOpacity style={styles.nameModalCancelBtn} onPress={() => setShowNameEdit(false)} activeOpacity={0.7}>
                    <Text style={styles.nameModalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalSaveBtn, styles.nameModalSaveBtn]} onPress={handleNameSave} activeOpacity={0.7}>
                    <Text style={styles.modalSaveBtnText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: colors.text,
    letterSpacing: -0.5,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileCard: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.cardAlt,
  },
  streakBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    backgroundColor: colors.comic.yellow,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: colors.black,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: colors.text,
    marginBottom: 2,
  },
  editHint: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: colors.textMuted,
  },
  memberSince: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  dietTag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.mintLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dietText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: colors.secondary,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: colors.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statCardPrimary: {
    backgroundColor: colors.primary,
  },
  statCardAccent: {
    backgroundColor: colors.secondary,
  },
  statEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: colors.white,
  },
  statValueDark: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: colors.text,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statLabelLight: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  shareCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  shareContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  shareTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
  },
  shareSubtext: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  challengesCard: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 18,
    padding: 16,
    marginBottom: 24,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  challengeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  challengeTagDaily: {
    backgroundColor: colors.comic.yellow,
  },
  challengeTagWeekly: {
    backgroundColor: colors.secondary,
  },
  challengeTagText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: colors.text,
  },
  challengeTagTextLight: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: colors.white,
  },
  challengeTime: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textMuted,
  },
  challengeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  challengeInfo: {
    flex: 1,
    marginRight: 12,
  },
  challengeTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 6,
  },
  challengeTitleCompleted: {
    color: colors.success,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.mint,
    borderRadius: 3,
  },
  challengeReward: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentLight,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 52,
    justifyContent: 'center',
  },
  challengeRewardReady: {
    backgroundColor: colors.comic.yellow,
    borderWidth: 2,
    borderColor: colors.black,
  },
  challengeRewardClaimed: {
    backgroundColor: colors.mintLight,
  },
  rewardText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: colors.text,
  },
  rewardCoin: {
    fontSize: 14,
    marginLeft: 2,
  },
  challengeDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 14,
  },
  settingsCard: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingValue: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.textMuted,
  },
  logoutBtn: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.error,
  },
  debugBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.comic.red + '15',
    borderWidth: 2,
    borderColor: colors.comic.red,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
  },
  debugText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.comic.red,
  },
  freshResetBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: '#E53935',
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
  },
  freshResetText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#fff',
  },
  bottomPadding: {
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: colors.text,
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: {
    maxHeight: 400,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 4,
  },
  optionRowActive: {
    backgroundColor: colors.primaryLight,
  },
  optionText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: colors.text,
  },
  optionTextActive: {
    color: colors.primary,
    fontWeight: '700' as const,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: colors.primary,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  nameInput: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
  },
  nameModalOverlay: {
    flex: 1,
  },
  nameModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  nameModalCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  nameModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  nameModalCancelBtn: {
    flex: 1,
    backgroundColor: colors.borderLight,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nameModalCancelText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: colors.textSecondary,
  },
  nameModalSaveBtn: {
    flex: 1,
  },
  modalSaveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  modalSaveBtnText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: colors.white,
  },
});
