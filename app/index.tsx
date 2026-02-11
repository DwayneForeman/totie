import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useApp } from '@/context/AppContext';
import colors from '@/constants/colors';

export default function Index() {
  const router = useRouter();
  const { isOnboardingComplete, loading } = useApp();

  useEffect(() => {
    if (!loading) {
      if (isOnboardingComplete) {
        router.replace('/home');
      } else {
        router.replace('/onboarding');
      }
    }
  }, [loading, isOnboardingComplete, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
