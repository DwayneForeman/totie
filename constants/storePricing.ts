export interface StorePrice {
  store: string;
  price: number;
  logo: string;
  color: string;
  bgColor: string;
}

export interface IngredientPricing {
  prices: StorePrice[];
  unit: string;
}

const STORES = {
  walmart: { name: 'Walmart', logo: '🔵', color: '#0071CE', bgColor: '#E8F4FD' },
  costco: { name: 'Costco', logo: '🔴', color: '#E31837', bgColor: '#FDE8EC' },
  kroger: { name: 'Kroger', logo: '🟡', color: '#D73F09', bgColor: '#FDEEE8' },
  aldi: { name: 'Aldi', logo: '🟠', color: '#00205B', bgColor: '#E8EBF4' },
  target: { name: 'Target', logo: '🎯', color: '#CC0000', bgColor: '#FDE8E8' },
} as const;

type StoreName = keyof typeof STORES;

const createPrice = (store: StoreName, price: number): StorePrice => ({
  store: STORES[store].name,
  price,
  logo: STORES[store].logo,
  color: STORES[store].color,
  bgColor: STORES[store].bgColor,
});

const INGREDIENT_PRICES: Record<string, IngredientPricing> = {
  'eggs': {
    unit: 'dozen',
    prices: [
      createPrice('aldi', 2.49),
      createPrice('walmart', 2.98),
      createPrice('costco', 3.49),
      createPrice('kroger', 3.29),
      createPrice('target', 3.59),
    ],
  },
  'milk': {
    unit: 'gallon',
    prices: [
      createPrice('aldi', 2.85),
      createPrice('walmart', 3.18),
      createPrice('costco', 3.69),
      createPrice('kroger', 3.49),
      createPrice('target', 3.59),
    ],
  },
  'butter': {
    unit: 'lb',
    prices: [
      createPrice('aldi', 3.29),
      createPrice('walmart', 3.48),
      createPrice('costco', 3.19),
      createPrice('kroger', 3.99),
      createPrice('target', 4.19),
    ],
  },
  'chicken': {
    unit: 'lb',
    prices: [
      createPrice('aldi', 2.49),
      createPrice('walmart', 2.84),
      createPrice('costco', 2.29),
      createPrice('kroger', 3.49),
      createPrice('target', 3.99),
    ],
  },
  'chicken breast': {
    unit: 'lb',
    prices: [
      createPrice('aldi', 2.99),
      createPrice('walmart', 3.22),
      createPrice('costco', 2.89),
      createPrice('kroger', 3.99),
      createPrice('target', 4.49),
    ],
  },
  'chicken thigh': {
    unit: 'lb',
    prices: [
      createPrice('aldi', 1.99),
      createPrice('walmart', 2.18),
      createPrice('costco', 1.89),
      createPrice('kroger', 2.49),
      createPrice('target', 2.99),
    ],
  },
  'beef': {
    unit: 'lb',
    prices: [
      createPrice('aldi', 4.99),
      createPrice('walmart', 5.47),
      createPrice('costco', 4.79),
      createPrice('kroger', 5.99),
      createPrice('target', 6.49),
    ],
  },
  'ground beef': {
    unit: 'lb',
    prices: [
      createPrice('aldi', 4.29),
      createPrice('walmart', 4.78),
      createPrice('costco', 3.99),
      createPrice('kroger', 5.29),
      createPrice('target', 5.79),
    ],
  },
  'salmon': {
    unit: 'lb',
    prices: [
      createPrice('aldi', 6.99),
      createPrice('walmart', 7.48),
      createPrice('costco', 5.99),
      createPrice('kroger', 8.99),
      createPrice('target', 9.49),
    ],
  },
  'rice': {
    unit: '2 lb',
    prices: [
      createPrice('aldi', 1.69),
      createPrice('walmart', 1.92),
      createPrice('costco', 1.49),
      createPrice('kroger', 2.29),
      createPrice('target', 2.49),
    ],
  },
  'pasta': {
    unit: '1 lb',
    prices: [
      createPrice('aldi', 0.95),
      createPrice('walmart', 1.18),
      createPrice('costco', 0.89),
      createPrice('kroger', 1.49),
      createPrice('target', 1.29),
    ],
  },
  'bread': {
    unit: 'loaf',
    prices: [
      createPrice('aldi', 1.49),
      createPrice('walmart', 1.98),
      createPrice('costco', 2.49),
      createPrice('kroger', 2.49),
      createPrice('target', 2.79),
    ],
  },
  'cheese': {
    unit: '8 oz',
    prices: [
      createPrice('aldi', 2.19),
      createPrice('walmart', 2.48),
      createPrice('costco', 2.09),
      createPrice('kroger', 2.99),
      createPrice('target', 3.29),
    ],
  },
  'tomatoes': {
    unit: 'lb',
    prices: [
      createPrice('aldi', 1.29),
      createPrice('walmart', 1.48),
      createPrice('costco', 1.19),
      createPrice('kroger', 1.79),
      createPrice('target', 1.99),
    ],
  },
  'tomato': {
    unit: 'lb',
    prices: [
      createPrice('aldi', 1.29),
      createPrice('walmart', 1.48),
      createPrice('costco', 1.19),
      createPrice('kroger', 1.79),
      createPrice('target', 1.99),
    ],
  },
  'onion': {
    unit: 'lb',
    prices: [
      createPrice('aldi', 0.85),
      createPrice('walmart', 0.98),
      createPrice('costco', 0.79),
      createPrice('kroger', 1.19),
      createPrice('target', 1.29),
    ],
  },
  'onions': {
    unit: 'lb',
    prices: [
      createPrice('aldi', 0.85),
      createPrice('walmart', 0.98),
      createPrice('costco', 0.79),
      createPrice('kroger', 1.19),
      createPrice('target', 1.29),
    ],
  },
  'garlic': {
    unit: 'head',
    prices: [
      createPrice('aldi', 0.45),
      createPrice('walmart', 0.50),
      createPrice('costco', 0.39),
      createPrice('kroger', 0.69),
      createPrice('target', 0.79),
    ],
  },
  'spinach': {
    unit: '10 oz',
    prices: [
      createPrice('aldi', 1.99),
      createPrice('walmart', 2.28),
      createPrice('costco', 1.89),
      createPrice('kroger', 2.49),
      createPrice('target', 2.79),
    ],
  },
  'carrots': {
    unit: '2 lb',
    prices: [
      createPrice('aldi', 1.19),
      createPrice('walmart', 1.48),
      createPrice('costco', 1.09),
      createPrice('kroger', 1.69),
      createPrice('target', 1.79),
    ],
  },
  'potato': {
    unit: 'lb',
    prices: [
      createPrice('aldi', 0.79),
      createPrice('walmart', 0.88),
      createPrice('costco', 0.69),
      createPrice('kroger', 0.99),
      createPrice('target', 1.09),
    ],
  },
  'olive oil': {
    unit: '16 oz',
    prices: [
      createPrice('aldi', 3.49),
      createPrice('walmart', 3.98),
      createPrice('costco', 3.29),
      createPrice('kroger', 4.49),
      createPrice('target', 4.99),
    ],
  },
  'soy sauce': {
    unit: '15 oz',
    prices: [
      createPrice('aldi', 1.29),
      createPrice('walmart', 1.48),
      createPrice('costco', 1.19),
      createPrice('kroger', 1.79),
      createPrice('target', 1.99),
    ],
  },
  'flour': {
    unit: '5 lb',
    prices: [
      createPrice('aldi', 1.69),
      createPrice('walmart', 2.18),
      createPrice('costco', 1.59),
      createPrice('kroger', 2.49),
      createPrice('target', 2.79),
    ],
  },
  'sugar': {
    unit: '4 lb',
    prices: [
      createPrice('aldi', 2.19),
      createPrice('walmart', 2.68),
      createPrice('costco', 2.09),
      createPrice('kroger', 2.99),
      createPrice('target', 3.29),
    ],
  },
  'bacon': {
    unit: '16 oz',
    prices: [
      createPrice('aldi', 3.99),
      createPrice('walmart', 4.48),
      createPrice('costco', 3.79),
      createPrice('kroger', 5.29),
      createPrice('target', 5.49),
    ],
  },
  'yogurt': {
    unit: '32 oz',
    prices: [
      createPrice('aldi', 2.49),
      createPrice('walmart', 2.98),
      createPrice('costco', 2.29),
      createPrice('kroger', 3.49),
      createPrice('target', 3.79),
    ],
  },
  'tortillas': {
    unit: '10 ct',
    prices: [
      createPrice('aldi', 1.49),
      createPrice('walmart', 1.78),
      createPrice('costco', 1.39),
      createPrice('kroger', 2.19),
      createPrice('target', 2.29),
    ],
  },
  'beans': {
    unit: '15 oz',
    prices: [
      createPrice('aldi', 0.69),
      createPrice('walmart', 0.78),
      createPrice('costco', 0.59),
      createPrice('kroger', 0.99),
      createPrice('target', 1.09),
    ],
  },
  'tomato sauce': {
    unit: '15 oz',
    prices: [
      createPrice('aldi', 0.59),
      createPrice('walmart', 0.68),
      createPrice('costco', 0.49),
      createPrice('kroger', 0.89),
      createPrice('target', 0.99),
    ],
  },
  'avocado': {
    unit: 'each',
    prices: [
      createPrice('aldi', 0.69),
      createPrice('walmart', 0.88),
      createPrice('costco', 0.59),
      createPrice('kroger', 1.19),
      createPrice('target', 1.29),
    ],
  },
  'lemon': {
    unit: 'each',
    prices: [
      createPrice('aldi', 0.35),
      createPrice('walmart', 0.48),
      createPrice('costco', 0.29),
      createPrice('kroger', 0.59),
      createPrice('target', 0.69),
    ],
  },
  'lemons': {
    unit: 'each',
    prices: [
      createPrice('aldi', 0.35),
      createPrice('walmart', 0.48),
      createPrice('costco', 0.29),
      createPrice('kroger', 0.59),
      createPrice('target', 0.69),
    ],
  },
  'bell pepper': {
    unit: 'each',
    prices: [
      createPrice('aldi', 0.79),
      createPrice('walmart', 0.98),
      createPrice('costco', 0.69),
      createPrice('kroger', 1.19),
      createPrice('target', 1.29),
    ],
  },
  'pepper': {
    unit: 'each',
    prices: [
      createPrice('aldi', 0.79),
      createPrice('walmart', 0.98),
      createPrice('costco', 0.69),
      createPrice('kroger', 1.19),
      createPrice('target', 1.29),
    ],
  },
  'mushroom': {
    unit: '8 oz',
    prices: [
      createPrice('aldi', 1.49),
      createPrice('walmart', 1.78),
      createPrice('costco', 1.39),
      createPrice('kroger', 2.29),
      createPrice('target', 2.49),
    ],
  },
  'shrimp': {
    unit: 'lb',
    prices: [
      createPrice('aldi', 5.99),
      createPrice('walmart', 6.98),
      createPrice('costco', 5.49),
      createPrice('kroger', 7.99),
      createPrice('target', 8.49),
    ],
  },
  'tofu': {
    unit: '14 oz',
    prices: [
      createPrice('aldi', 1.49),
      createPrice('walmart', 1.78),
      createPrice('costco', 1.29),
      createPrice('kroger', 2.19),
      createPrice('target', 2.29),
    ],
  },
  'cream': {
    unit: 'pint',
    prices: [
      createPrice('aldi', 2.19),
      createPrice('walmart', 2.48),
      createPrice('costco', 1.99),
      createPrice('kroger', 2.79),
      createPrice('target', 2.99),
    ],
  },
  'parmesan': {
    unit: '8 oz',
    prices: [
      createPrice('aldi', 3.49),
      createPrice('walmart', 3.98),
      createPrice('costco', 3.29),
      createPrice('kroger', 4.49),
      createPrice('target', 4.79),
    ],
  },
  'mozzarella': {
    unit: '8 oz',
    prices: [
      createPrice('aldi', 2.29),
      createPrice('walmart', 2.68),
      createPrice('costco', 2.09),
      createPrice('kroger', 3.19),
      createPrice('target', 3.49),
    ],
  },
  'broccoli': {
    unit: 'lb',
    prices: [
      createPrice('aldi', 1.29),
      createPrice('walmart', 1.48),
      createPrice('costco', 1.19),
      createPrice('kroger', 1.79),
      createPrice('target', 1.99),
    ],
  },
  'corn': {
    unit: 'each',
    prices: [
      createPrice('aldi', 0.39),
      createPrice('walmart', 0.48),
      createPrice('costco', 0.35),
      createPrice('kroger', 0.59),
      createPrice('target', 0.69),
    ],
  },
  'cucumber': {
    unit: 'each',
    prices: [
      createPrice('aldi', 0.49),
      createPrice('walmart', 0.58),
      createPrice('costco', 0.45),
      createPrice('kroger', 0.79),
      createPrice('target', 0.89),
    ],
  },
  'celery': {
    unit: 'bunch',
    prices: [
      createPrice('aldi', 1.19),
      createPrice('walmart', 1.48),
      createPrice('costco', 1.09),
      createPrice('kroger', 1.69),
      createPrice('target', 1.89),
    ],
  },
  'pork': {
    unit: 'lb',
    prices: [
      createPrice('aldi', 3.29),
      createPrice('walmart', 3.68),
      createPrice('costco', 2.99),
      createPrice('kroger', 3.99),
      createPrice('target', 4.49),
    ],
  },
  'spaghetti': {
    unit: '1 lb',
    prices: [
      createPrice('aldi', 0.95),
      createPrice('walmart', 1.18),
      createPrice('costco', 0.89),
      createPrice('kroger', 1.49),
      createPrice('target', 1.29),
    ],
  },
  'honey': {
    unit: '12 oz',
    prices: [
      createPrice('aldi', 3.49),
      createPrice('walmart', 3.98),
      createPrice('costco', 3.19),
      createPrice('kroger', 4.49),
      createPrice('target', 4.99),
    ],
  },
  'ginger': {
    unit: 'oz',
    prices: [
      createPrice('aldi', 0.39),
      createPrice('walmart', 0.48),
      createPrice('costco', 0.35),
      createPrice('kroger', 0.59),
      createPrice('target', 0.69),
    ],
  },
  'coconut milk': {
    unit: '13.5 oz',
    prices: [
      createPrice('aldi', 1.19),
      createPrice('walmart', 1.48),
      createPrice('costco', 1.09),
      createPrice('kroger', 1.79),
      createPrice('target', 1.99),
    ],
  },
  'cilantro': {
    unit: 'bunch',
    prices: [
      createPrice('aldi', 0.49),
      createPrice('walmart', 0.58),
      createPrice('costco', 0.45),
      createPrice('kroger', 0.79),
      createPrice('target', 0.89),
    ],
  },
  'basil': {
    unit: 'bunch',
    prices: [
      createPrice('aldi', 1.49),
      createPrice('walmart', 1.98),
      createPrice('costco', 1.39),
      createPrice('kroger', 2.29),
      createPrice('target', 2.49),
    ],
  },
};

const PRICE_ALIASES: Record<string, string> = {
  'chicken breasts': 'chicken breast',
  'chicken thighs': 'chicken thigh',
  'chicken wings': 'chicken',
  'ground turkey': 'chicken',
  'egg': 'eggs',
  'potatoes': 'potato',
  'sweet potato': 'potato',
  'carrot': 'carrots',
  'noodles': 'pasta',
  'penne': 'pasta',
  'linguine': 'pasta',
  'fettuccine': 'pasta',
  'macaroni': 'pasta',
  'jasmine rice': 'rice',
  'brown rice': 'rice',
  'basmati rice': 'rice',
  'white rice': 'rice',
  'cheddar': 'cheese',
  'swiss cheese': 'cheese',
  'cream cheese': 'cheese',
  'mushrooms': 'mushroom',
  'shiitake mushroom': 'mushroom',
  'shiitake mushrooms': 'mushroom',
  'portobello': 'mushroom',
  'lime': 'lemon',
  'limes': 'lemon',
  'red onion': 'onion',
  'green onion': 'onion',
  'scallion': 'onion',
  'scallions': 'onion',
  'shallot': 'onion',
  'shallots': 'onion',
  'bell peppers': 'bell pepper',
  'red pepper': 'bell pepper',
  'green pepper': 'bell pepper',
  'jalapeño': 'pepper',
  'heavy cream': 'cream',
  'whipping cream': 'cream',
  'sour cream': 'cream',
  'extra virgin olive oil': 'olive oil',
  'vegetable oil': 'olive oil',
  'canola oil': 'olive oil',
  'sesame oil': 'olive oil',
  'all-purpose flour': 'flour',
  'whole wheat flour': 'flour',
  'ap flour': 'flour',
  'brown sugar': 'sugar',
  'powdered sugar': 'sugar',
  'confectioners sugar': 'sugar',
  'black beans': 'beans',
  'kidney beans': 'beans',
  'pinto beans': 'beans',
  'chickpeas': 'beans',
  'fresh basil': 'basil',
  'fresh cilantro': 'cilantro',
  'fresh ginger': 'ginger',
  'fresh parsley': 'cilantro',
  'parsley': 'cilantro',
  'tortilla': 'tortillas',
  'flour tortillas': 'tortillas',
  'corn tortillas': 'tortillas',
  'fish': 'salmon',
  'cod': 'salmon',
  'tilapia': 'salmon',
  'tuna': 'salmon',
  'prawns': 'shrimp',
  'marinara': 'tomato sauce',
  'marinara sauce': 'tomato sauce',
  'pasta sauce': 'tomato sauce',
  'tomato paste': 'tomato sauce',
  'crushed tomatoes': 'tomatoes',
  'diced tomatoes': 'tomatoes',
  'cherry tomatoes': 'tomatoes',
  'roma tomatoes': 'tomatoes',
  'steak': 'beef',
  'sirloin': 'beef',
  'ribeye': 'beef',
  'brisket': 'beef',
  'greek yogurt': 'yogurt',
  'plain yogurt': 'yogurt',
};

export function getIngredientPricing(ingredientName: string): IngredientPricing | null {
  const lower = ingredientName.toLowerCase().trim();

  if (INGREDIENT_PRICES[lower]) {
    return INGREDIENT_PRICES[lower];
  }

  if (PRICE_ALIASES[lower] && INGREDIENT_PRICES[PRICE_ALIASES[lower]]) {
    return INGREDIENT_PRICES[PRICE_ALIASES[lower]];
  }

  for (const [key, pricing] of Object.entries(INGREDIENT_PRICES)) {
    if (lower.includes(key) || key.includes(lower)) {
      return pricing;
    }
  }

  for (const [alias, canonical] of Object.entries(PRICE_ALIASES)) {
    if (lower.includes(alias) || alias.includes(lower)) {
      return INGREDIENT_PRICES[canonical] || null;
    }
  }

  return null;
}

export function getCheapestStore(pricing: IngredientPricing): StorePrice {
  return [...pricing.prices].sort((a, b) => a.price - b.price)[0];
}

export function getRecipeTotalByStore(ingredients: { name: string }[]): { store: string; total: number; logo: string; color: string; bgColor: string; itemCount: number }[] {
  const storeTotals: Record<string, { total: number; logo: string; color: string; bgColor: string; itemCount: number }> = {};

  for (const ing of ingredients) {
    const pricing = getIngredientPricing(ing.name);
    if (!pricing) continue;

    for (const sp of pricing.prices) {
      if (!storeTotals[sp.store]) {
        storeTotals[sp.store] = { total: 0, logo: sp.logo, color: sp.color, bgColor: sp.bgColor, itemCount: 0 };
      }
      storeTotals[sp.store].total += sp.price;
      storeTotals[sp.store].itemCount += 1;
    }
  }

  return Object.entries(storeTotals)
    .map(([store, data]) => ({ store, ...data }))
    .sort((a, b) => a.total - b.total);
}
