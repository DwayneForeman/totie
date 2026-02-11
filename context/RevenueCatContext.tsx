import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import Purchases, { 
  PurchasesOffering, 
  PurchasesPackage, 
  CustomerInfo,
  LOG_LEVEL,
  PurchasesError,
} from 'react-native-purchases';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

function getRCApiKey(): string {
  if (__DEV__ || Platform.OS === 'web') {
    return process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY || '';
  }
  return Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
    default: process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY,
  }) || '';
}

const apiKey = getRCApiKey();

let isConfigured = false;
function ensureConfigured() {
  if (isConfigured || Platform.OS === 'web' || !apiKey) return;
  try {
    console.log('[RevenueCat] Configuring with API key:', apiKey.slice(0, 10) + '...');
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    Purchases.configure({ apiKey });
    isConfigured = true;
  } catch (e) {
    console.warn('[RevenueCat] Configuration failed:', e);
  }
}

const ENTITLEMENT_ID = 'premium';

export interface RevenueCatState {
  isInitialized: boolean;
  isPremium: boolean;
  customerInfo: CustomerInfo | null;
  currentOffering: PurchasesOffering | null;
  isLoadingOfferings: boolean;
  isLoadingCustomerInfo: boolean;
  purchaseError: string | null;
  isPurchasing: boolean;
}

const [RevenueCatProviderInternal, useRevenueCat] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(Platform.OS === 'web');
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const isNative = Platform.OS !== 'web';

  useEffect(() => {
    ensureConfigured();
  }, []);

  const customerInfoQuery = useQuery({
    queryKey: ['revenuecat', 'customerInfo'],
    queryFn: async () => {
      console.log('[RevenueCat] Fetching customer info...');
      const info = await Purchases.getCustomerInfo();
      console.log('[RevenueCat] Customer info fetched:', info.entitlements.active);
      return info;
    },
    enabled: !!apiKey && isNative,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  const offeringsQuery = useQuery({
    queryKey: ['revenuecat', 'offerings'],
    queryFn: async () => {
      console.log('[RevenueCat] Fetching offerings...');
      const offerings = await Purchases.getOfferings();
      console.log('[RevenueCat] Offerings fetched:', offerings.current?.identifier);
      return offerings;
    },
    enabled: !!apiKey && isNative,
    staleTime: 1000 * 60 * 10,
    retry: 2,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (pkg: PurchasesPackage) => {
      console.log('[RevenueCat] Purchasing package:', pkg.identifier);
      setPurchaseError(null);
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return customerInfo;
    },
    onSuccess: (customerInfo) => {
      console.log('[RevenueCat] Purchase successful!');
      queryClient.setQueryData(['revenuecat', 'customerInfo'], customerInfo);
    },
    onError: (error: PurchasesError) => {
      console.error('[RevenueCat] Purchase error:', error);
      if (!error.userCancelled) {
        setPurchaseError(error.message || 'Purchase failed. Please try again.');
      }
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      console.log('[RevenueCat] Restoring purchases...');
      setPurchaseError(null);
      const customerInfo = await Purchases.restorePurchases();
      return customerInfo;
    },
    onSuccess: (customerInfo) => {
      console.log('[RevenueCat] Restore successful!');
      queryClient.setQueryData(['revenuecat', 'customerInfo'], customerInfo);
    },
    onError: (error: PurchasesError) => {
      console.error('[RevenueCat] Restore error:', error);
      setPurchaseError(error.message || 'Failed to restore purchases.');
    },
  });

  useEffect(() => {
    if (customerInfoQuery.data || customerInfoQuery.error) {
      setIsInitialized(true);
    }
  }, [customerInfoQuery.data, customerInfoQuery.error]);

  useEffect(() => {
    if (!apiKey || !isNative) return;

    const listener = (info: CustomerInfo) => {
      console.log('[RevenueCat] Customer info updated via listener');
      queryClient.setQueryData(['revenuecat', 'customerInfo'], info);
    };

    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [queryClient, isNative]);

  const isPremium = customerInfoQuery.data?.entitlements.active[ENTITLEMENT_ID]?.isActive ?? false;

  const purchasePackage = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
    try {
      await purchaseMutation.mutateAsync(pkg);
      return true;
    } catch {
      return false;
    }
  }, [purchaseMutation]);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    try {
      const info = await restoreMutation.mutateAsync();
      return info.entitlements.active[ENTITLEMENT_ID]?.isActive ?? false;
    } catch {
      return false;
    }
  }, [restoreMutation]);

  const clearPurchaseError = useCallback(() => {
    setPurchaseError(null);
  }, []);

  const refetchCustomerInfo = useCallback(async () => {
    await customerInfoQuery.refetch();
  }, [customerInfoQuery]);

  return {
    isInitialized,
    isPremium,
    customerInfo: customerInfoQuery.data ?? null,
    currentOffering: offeringsQuery.data?.current ?? null,
    isLoadingOfferings: offeringsQuery.isLoading,
    isLoadingCustomerInfo: customerInfoQuery.isLoading,
    purchaseError,
    isPurchasing: purchaseMutation.isPending,
    isRestoring: restoreMutation.isPending,
    purchasePackage,
    restorePurchases,
    clearPurchaseError,
    refetchCustomerInfo,
  };
});

export const RevenueCatProvider = RevenueCatProviderInternal;
export { useRevenueCat };
