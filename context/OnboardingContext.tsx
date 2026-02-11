import createContextHook from '@nkzw/create-context-hook';
import { useState, useMemo } from 'react';
import { OnboardingData } from '@/types';

type DeliveryFrequency = 'rarely' | '1-2' | '3-4' | 'daily' | null;
type WeeklySpend = '0-25' | '25-50' | '50-100' | '100+' | null;
type HouseholdSize = '1' | '2' | '3-4' | '5+' | null;

const getWeeklySpendValue = (spend: WeeklySpend): number => {
  switch (spend) {
    case '0-25': return 12.5;
    case '25-50': return 37.5;
    case '50-100': return 75;
    case '100+': return 125;
    default: return 50;
  }
};

const getHouseholdMultiplier = (size: HouseholdSize): number => {
  switch (size) {
    case '1': return 1;
    case '2': return 1.6;
    case '3-4': return 2.2;
    case '5+': return 3;
    default: return 1.5;
  }
};

const getDeliveryFrequencyMultiplier = (freq: DeliveryFrequency): number => {
  switch (freq) {
    case 'rarely': return 0.5;
    case '1-2': return 1;
    case '3-4': return 1.5;
    case 'daily': return 2.5;
    default: return 1;
  }
};

export const [OnboardingProvider, useOnboarding] = createContextHook(() => {
  const [onboardingData, setOnboardingData] = useState<Partial<OnboardingData>>({});

  const updateOnboardingData = (data: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...data }));
  };

  const calculatedStats = useMemo(() => {
    const weeklySpend = getWeeklySpendValue(onboardingData.weeklySpend as WeeklySpend);
    const householdMultiplier = getHouseholdMultiplier(onboardingData.householdSize as HouseholdSize);
    const frequencyMultiplier = getDeliveryFrequencyMultiplier(onboardingData.deliveryFrequency as DeliveryFrequency);

    const monthlyDeliverySpend = Math.round(weeklySpend * 4 * frequencyMultiplier);
    const monthlyCookingCost = Math.round(monthlyDeliverySpend * 0.45);

    const avgDeliverySpend = Math.round(monthlyDeliverySpend * householdMultiplier);
    const avgCookingCost = Math.round(monthlyCookingCost * householdMultiplier);
    const potentialSavings = avgDeliverySpend - avgCookingCost;

    const deliveryBarPercent = Math.min(95, Math.max(50, Math.round((avgDeliverySpend / 500) * 100)));
    const cookingBarPercent = Math.min(70, Math.max(30, Math.round((avgCookingCost / 500) * 100)));

    return {
      monthlyDeliverySpend: avgDeliverySpend,
      monthlyCookingCost: avgCookingCost,
      monthlySavings: potentialSavings,
      yearlySavings: potentialSavings * 12,
      deliveryBarPercent,
      cookingBarPercent,
      switchedPercent: onboardingData.deliveryFrequency === 'daily' ? 82 : 
                       onboardingData.deliveryFrequency === '3-4' ? 78 :
                       onboardingData.deliveryFrequency === '1-2' ? 72 : 65,
    };
  }, [onboardingData.weeklySpend, onboardingData.householdSize, onboardingData.deliveryFrequency]);

  const resetOnboarding = () => {
    setOnboardingData({});
  };

  return {
    onboardingData,
    updateOnboardingData,
    calculatedStats,
    resetOnboarding,
  };
});
