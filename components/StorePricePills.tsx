import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { TrendingDown, ChevronDown, ChevronUp } from 'lucide-react-native';
import colors from '@/constants/colors';
import { getIngredientPricing, StorePrice } from '@/constants/storePricing';

interface StorePricePillsProps {
  ingredientName: string;
  compact?: boolean;
}

function StorePricePillsComponent({ ingredientName, compact = false }: StorePricePillsProps) {
  const pricing = useMemo(() => getIngredientPricing(ingredientName), [ingredientName]);
  const sorted = useMemo(() => pricing ? [...pricing.prices].sort((a, b) => a.price - b.price) : [], [pricing]);
  const cheapest = sorted[0] ?? null;

  if (!pricing || !cheapest) return null;

  if (compact) {
    return (
      <View style={compactStyles.container}>
        <View style={[compactStyles.pill, { backgroundColor: cheapest.bgColor, borderColor: cheapest.color }]}>
          <Text style={compactStyles.pillLogo}>{cheapest.logo}</Text>
          <Text style={[compactStyles.pillPrice, { color: cheapest.color }]}>${cheapest.price.toFixed(2)}</Text>
        </View>
        <Text style={compactStyles.estLabel}>Est.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.unitLabel}>Est. prices ({pricing.unit}):</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
        {sorted.map((sp: StorePrice, idx: number) => {
          const isCheapest = idx === 0;
          return (
            <View
              key={sp.store}
              style={[
                styles.pill,
                isCheapest && styles.pillCheapest,
              ]}
            >
              <Text style={[styles.pillStore, isCheapest ? { color: '#059669', fontWeight: '700' as const } : { color: colors.textSecondary }]}>
                {sp.store}
              </Text>
              <Text style={[styles.pillPrice, isCheapest ? { color: '#059669' } : { color: colors.text }]}>
                ${sp.price.toFixed(2)}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

export const StorePricePills = React.memo(StorePricePillsComponent);

interface RecipePriceSummaryProps {
  ingredients: { name: string }[];
}

function RecipePriceSummaryComponent({ ingredients }: RecipePriceSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const storeData = useMemo(() => {
    const storeTotals: Record<string, { total: number; logo: string; color: string; bgColor: string; count: number }> = {};

    for (const ing of ingredients) {
      const pricing = getIngredientPricing(ing.name);
      if (!pricing) continue;
      for (const sp of pricing.prices) {
        if (!storeTotals[sp.store]) {
          storeTotals[sp.store] = { total: 0, logo: sp.logo, color: sp.color, bgColor: sp.bgColor, count: 0 };
        }
        storeTotals[sp.store].total += sp.price;
        storeTotals[sp.store].count += 1;
      }
    }

    return Object.entries(storeTotals)
      .map(([store, data]) => ({ store, ...data }))
      .sort((a, b) => a.total - b.total);
  }, [ingredients]);

  const pricedCount = useMemo(() => {
    let count = 0;
    for (const ing of ingredients) {
      if (getIngredientPricing(ing.name)) count++;
    }
    return count;
  }, [ingredients]);

  if (storeData.length === 0) return null;

  const cheapest = storeData[0];
  const mostExpensive = storeData[storeData.length - 1];
  const savings = mostExpensive.total - cheapest.total;

  return (
    <View style={summaryStyles.container}>
      <TouchableOpacity onPress={toggleExpanded} activeOpacity={0.7} style={summaryStyles.collapsedHeader}>
        <View style={summaryStyles.savingsBarCollapsed}>
          <TrendingDown size={16} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={summaryStyles.savingsText}>
            {savings > 0.5 ? (
              <>Save up to <Text style={summaryStyles.savingsAmount}>${savings.toFixed(2)}</Text> shopping at {cheapest.store}</>
            ) : (
              <>Cheapest at <Text style={summaryStyles.savingsAmount}>{cheapest.store}</Text> (${cheapest.total.toFixed(2)})</>
            )}
          </Text>
          {isExpanded ? (
            <ChevronUp size={18} color="#FFFFFF" strokeWidth={2.5} />
          ) : (
            <ChevronDown size={18} color="#FFFFFF" strokeWidth={2.5} />
          )}
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <>
          <View style={summaryStyles.header}>
            <View style={summaryStyles.headerLeft}>
              <TrendingDown size={16} color="#059669" strokeWidth={2.5} />
              <Text style={summaryStyles.headerTitle}>Price Comparison</Text>
            </View>
            <View style={summaryStyles.estPill}>
              <Text style={summaryStyles.estPillText}>Est. prices</Text>
            </View>
          </View>

          <Text style={summaryStyles.subtitle}>
            {pricedCount} of {ingredients.length} ingredients priced
          </Text>

          <View style={summaryStyles.storeList}>
            {storeData.map((store, idx) => {
              const isCheapest = idx === 0;
              return (
                <View
                  key={store.store}
                  style={[
                    summaryStyles.storeRow,
                    isCheapest && summaryStyles.storeRowCheapest,
                  ]}
                >
                  <View style={summaryStyles.storeLeft}>
                    <Text style={summaryStyles.storeLogo}>{store.logo}</Text>
                    <Text style={[summaryStyles.storeName, isCheapest && { fontWeight: '800' as const }]}>{store.store}</Text>
                    {isCheapest && (
                      <View style={summaryStyles.bestBadge}>
                        <Text style={summaryStyles.bestBadgeText}>Cheapest</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[summaryStyles.storeTotal, isCheapest && summaryStyles.storeTotalCheapest]}>
                    ${store.total.toFixed(2)}
                  </Text>
                </View>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}

export const RecipePriceSummary = React.memo(RecipePriceSummaryComponent);

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  unitLabel: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  pillsRow: {
    gap: 6,
    paddingRight: 4,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    minWidth: 68,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  pillCheapest: {
    borderColor: '#059669',
    backgroundColor: '#F0FDF4',
  },
  pillStore: {
    fontSize: 10,
    fontWeight: '600' as const,
    marginBottom: 1,
  },
  pillPrice: {
    fontSize: 13,
    fontWeight: '800' as const,
  },
});

const compactStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  pillLogo: {
    fontSize: 10,
  },
  pillPrice: {
    fontSize: 10,
    fontWeight: '700' as const,
  },
  estLabel: {
    fontSize: 8,
    fontWeight: '500' as const,
    color: colors.textMuted,
  },
});

const summaryStyles = StyleSheet.create({
  container: {
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: '#BBF7D0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    marginTop: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: colors.text,
  },
  estPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  estPillText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#059669',
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  storeList: {
    gap: 6,
  },
  storeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  storeRowCheapest: {
    borderWidth: 2,
    borderColor: '#059669',
    backgroundColor: '#F0FDF4',
  },
  storeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  storeLogo: {
    fontSize: 18,
  },
  storeName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  bestBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bestBadgeText: {
    fontSize: 9,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    textTransform: 'uppercase' as const,
  },
  storeTotal: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
  },
  storeTotalCheapest: {
    color: '#059669',
    fontWeight: '800' as const,
  },
  collapsedHeader: {
    marginBottom: 0,
  },
  savingsBarCollapsed: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
  },
  savingsBar: {
    marginTop: 12,
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  savingsText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    textAlign: 'center',
    flex: 1,
  },
  savingsAmount: {
    fontWeight: '900' as const,
    fontSize: 15,
  },
});
