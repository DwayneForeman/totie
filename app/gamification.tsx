import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { X, Trophy, Star, Target, ChefHat, TrendingUp } from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import colors from '@/constants/colors';

const ACHIEVEMENTS = [
  { id: '1', title: 'First Meal', description: 'Cook your first meal', icon: '🍳', unlocked: true, progress: 1, total: 1 },
  { id: '2', title: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '🔥', unlocked: false, progress: 3, total: 7 },
  { id: '3', title: 'Recipe Collector', description: 'Save 10 recipes', icon: '📚', unlocked: false, progress: 2, total: 10 },
  { id: '4', title: 'Pantry Pro', description: 'Add 20 pantry items', icon: '🥫', unlocked: false, progress: 5, total: 20 },
  { id: '5', title: 'Money Saver', description: 'Save $50 by cooking', icon: '💰', unlocked: false, progress: 15, total: 50 },
  { id: '6', title: 'Master Chef', description: 'Cook 25 meals', icon: '👨‍🍳', unlocked: false, progress: 3, total: 25 },
];

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 5000, 10000];

export default function GamificationScreen() {
  const router = useRouter();
  const { userProfile, recipes, pantryItems } = useApp();

  const currentStreak = userProfile?.currentStreak || 0;
  const mealsCooked = userProfile?.mealsCooked || 0;
  const totalSavings = userProfile?.totalSavings || 0;
  const coins = userProfile?.coins || 0;

  const xp = (mealsCooked * 50) + (recipes.length * 20) + (pantryItems.length * 5) + (totalSavings * 2);
  
  const getCurrentLevel = () => {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
    }
    return 1;
  };

  const level = getCurrentLevel();
  const currentLevelXP = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextLevelXP = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const progressToNext = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;

  const achievements = ACHIEVEMENTS.map(a => {
    let progress = a.progress;
    let unlocked = a.unlocked;
    
    if (a.id === '1') {
      progress = Math.min(mealsCooked, 1);
      unlocked = mealsCooked >= 1;
    } else if (a.id === '2') {
      progress = Math.min(currentStreak, 7);
      unlocked = currentStreak >= 7;
    } else if (a.id === '3') {
      progress = Math.min(recipes.length, 10);
      unlocked = recipes.length >= 10;
    } else if (a.id === '4') {
      progress = Math.min(pantryItems.length, 20);
      unlocked = pantryItems.length >= 20;
    } else if (a.id === '5') {
      progress = Math.min(totalSavings, 50);
      unlocked = totalSavings >= 50;
    } else if (a.id === '6') {
      progress = Math.min(mealsCooked, 25);
      unlocked = mealsCooked >= 25;
    }
    
    return { ...a, progress, unlocked };
  });

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X size={24} color={colors.text} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Progress</Text>
          <View style={styles.coinBadge}>
            <Text style={styles.coinText}>🪙 {coins}</Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.streakSection}>
            <View style={styles.streakCard}>
              <View style={styles.streakFlameWrap}>
                <View style={styles.flameGlow} />
                <Text style={styles.streakFlame}>🔥</Text>
              </View>
              <Text style={styles.streakNumber}>{currentStreak}</Text>
              <Text style={styles.streakLabel}>Day Streak</Text>
              <Text style={styles.streakMotivation}>
                {currentStreak === 0 
                  ? "Start your streak today!" 
                  : currentStreak < 7 
                    ? "Keep it going! 🚀" 
                    : "You're on fire! 🔥"}
              </Text>
            </View>
          </View>

          <View style={styles.levelSection}>
            <View style={styles.levelHeader}>
              <View style={styles.levelBadge}>
                <Star size={18} color={colors.comic.yellow} fill={colors.comic.yellow} />
                <Text style={styles.levelText}>Level {level}</Text>
              </View>
              <Text style={styles.xpText}>{xp} XP</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${Math.min(progressToNext, 100)}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {nextLevelXP - xp} XP to Level {level + 1}
            </Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: colors.primaryLight }]}>
                <ChefHat size={20} color={colors.primary} strokeWidth={2.5} />
              </View>
              <Text style={styles.statValue}>{mealsCooked}</Text>
              <Text style={styles.statLabel}>Meals</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: colors.mintLight }]}>
                <TrendingUp size={20} color={colors.mint} strokeWidth={2.5} />
              </View>
              <Text style={styles.statValue}>${totalSavings}</Text>
              <Text style={styles.statLabel}>Saved</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: colors.secondaryLight }]}>
                <Target size={20} color={colors.secondary} strokeWidth={2.5} />
              </View>
              <Text style={styles.statValue}>{recipes.length}</Text>
              <Text style={styles.statLabel}>Recipes</Text>
            </View>
          </View>

          <View style={styles.achievementsSection}>
            <View style={styles.achievementsHeader}>
              <Trophy size={22} color={colors.comic.yellow} strokeWidth={2.5} />
              <Text style={styles.achievementsTitle}>Achievements</Text>
              <View style={styles.achievementsBadge}>
                <Text style={styles.achievementsBadgeText}>{unlockedCount}/{achievements.length}</Text>
              </View>
            </View>

            {achievements.map((achievement) => (
              <View 
                key={achievement.id} 
                style={[styles.achievementCard, !achievement.unlocked && styles.achievementLocked]}
              >
                <View style={[styles.achievementIcon, achievement.unlocked && styles.achievementIconUnlocked]}>
                  <Text style={styles.achievementEmoji}>{achievement.icon}</Text>
                </View>
                <View style={styles.achievementContent}>
                  <Text style={[styles.achievementTitle, !achievement.unlocked && styles.achievementTitleLocked]}>
                    {achievement.title}
                  </Text>
                  <Text style={styles.achievementDesc}>{achievement.description}</Text>
                  {!achievement.unlocked && (
                    <View style={styles.achievementProgress}>
                      <View style={styles.achievementProgressBg}>
                        <View 
                          style={[
                            styles.achievementProgressFill, 
                            { width: `${(achievement.progress / achievement.total) * 100}%` }
                          ]} 
                        />
                      </View>
                      <Text style={styles.achievementProgressText}>
                        {achievement.progress}/{achievement.total}
                      </Text>
                    </View>
                  )}
                </View>
                {achievement.unlocked && (
                  <View style={styles.achievementCheck}>
                    <Text style={styles.checkmark}>✓</Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          <View style={styles.motivationCard}>
            <Image
              source={{ uri: 'https://r2-pub.rork.com/attachments/7kh2kny7y4aoan2iczpas' }}
              style={styles.totieImage}
              resizeMode="contain"
            />
            <View style={styles.motivationContent}>
              <Text style={styles.motivationTitle}>Keep Going!</Text>
              <Text style={styles.motivationText}>
                Every meal you cook is a win. You are building healthy habits! 💪
              </Text>
            </View>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: colors.text,
  },
  coinBadge: {
    backgroundColor: colors.comic.yellow,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  coinText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: colors.black,
  },
  scroll: {
    flex: 1,
  },
  streakSection: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 24,
  },
  streakCard: {
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.black,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  streakFlameWrap: {
    position: 'relative',
    marginBottom: 8,
  },
  flameGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 230, 102, 0.4)',
    top: -10,
    left: -10,
  },
  streakFlame: {
    fontSize: 60,
  },
  streakNumber: {
    fontSize: 64,
    fontWeight: '900' as const,
    color: colors.white,
    marginTop: 4,
  },
  streakLabel: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  streakMotivation: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 12,
  },
  levelSection: {
    marginHorizontal: 20,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  levelText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: colors.text,
  },
  xpText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.textSecondary,
  },
  progressBarBg: {
    height: 16,
    backgroundColor: colors.borderLight,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.black,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.comic.yellow,
    borderRadius: 6,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginTop: 2,
  },
  achievementsSection: {
    paddingHorizontal: 20,
  },
  achievementsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  achievementsTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800' as const,
    color: colors.text,
  },
  achievementsBadge: {
    backgroundColor: colors.secondaryLight,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  achievementsBadgeText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: colors.secondary,
  },
  achievementCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  achievementLocked: {
    opacity: 0.7,
    backgroundColor: colors.cardAlt,
  },
  achievementIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  achievementIconUnlocked: {
    backgroundColor: colors.comic.yellow,
  },
  achievementEmoji: {
    fontSize: 26,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 2,
  },
  achievementTitleLocked: {
    color: colors.textSecondary,
  },
  achievementDesc: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  achievementProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  achievementProgressBg: {
    flex: 1,
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  achievementProgressFill: {
    height: '100%',
    backgroundColor: colors.mint,
    borderRadius: 4,
  },
  achievementProgressText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: colors.textSecondary,
    minWidth: 35,
  },
  achievementCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: colors.white,
  },
  motivationCard: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: colors.secondaryLight,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
  },
  totieImage: {
    width: 70,
    height: 70,
    marginRight: 14,
  },
  motivationContent: {
    flex: 1,
  },
  motivationTitle: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: colors.secondary,
    marginBottom: 4,
  },
  motivationText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.secondary,
    lineHeight: 20,
  },
  bottomPadding: {
    height: 40,
  },
});
