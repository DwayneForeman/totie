import { Stack } from 'expo-router';
import { OnboardingProvider } from '@/context/OnboardingContext';

export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="delivery-frequency" />
      <Stack.Screen name="weekly-spend" />
      <Stack.Screen name="diet" />
      <Stack.Screen name="name" />
      <Stack.Screen name="hook" />
      <Stack.Screen name="confession" />
      <Stack.Screen name="villain" />
      <Stack.Screen name="promise" />
      <Stack.Screen name="how-it-works" />
      <Stack.Screen name="eating-habits" />
      <Stack.Screen name="spending-stats" />
      <Stack.Screen name="pain-points" />
      <Stack.Screen name="exciting" />
      <Stack.Screen name="household" />
      <Stack.Screen name="comparison" />
      <Stack.Screen name="features" />
      <Stack.Screen name="profile-summary" />
      <Stack.Screen name="savings" />
      <Stack.Screen name="loading" />
      <Stack.Screen name="paywall" />
      <Stack.Screen name="review-request" />
    </Stack>
    </OnboardingProvider>
  );
}
