export interface OnboardingData {
  eatingHabits: 'cook' | 'delivery' | 'eat-out' | null;
  deliveryFrequency: 'rarely' | '1-2' | '3-4' | 'daily' | null;
  weeklySpend: '0-25' | '25-50' | '50-100' | '100+' | null;
  painPoints: string[];
  mostExciting: 'what-i-have' | 'delivery-to-diy' | 'organize' | 'grocery' | null;
  diet: string;
  allergies: string[];
  householdSize: '1' | '2' | '3-4' | '5+' | null;
  userName: string;
}

export interface UserProfile extends OnboardingData {
  createdAt: string;
  totalSavings: number;
  mealsCooked: number;
  recipesTried: number;
  currentStreak: number;
  coins: number;
}

export interface NutritionInfo {
  calories: number;
  saltLevel: 'low' | 'medium' | 'high';
  sugarLevel: 'low' | 'medium' | 'high';
}

export interface Recipe {
  id: string;
  title: string;
  image: string;
  ingredients: Ingredient[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  source?: string;
  isDIYCraving?: boolean;
  deliveryPrice?: number;
  diyPrice?: number;
  createdAt: string;
  cookbookId?: string;
  pageNumber?: number;
  isFavorite?: boolean;
  nutrition?: NutritionInfo;
}

export interface Cookbook {
  id: string;
  title: string;
  author: string;
  coverImage?: string;
  recipeCount: number;
  addedAt: string;
}

export interface Ingredient {
  name: string;
  amount?: string;
  unit?: string;
}

export interface PantryItem {
  id: string;
  name: string;
  category: 'produce' | 'dairy' | 'protein' | 'grains' | 'pantry' | 'frozen' | 'other';
  quantity?: string;
  expiresAt?: string;
  location: 'fridge' | 'pantry';
  addedAt: string;
}

export interface RecipeMatch {
  recipe: Recipe;
  matchPercentage: number;
  matchingIngredients: string[];
  missingIngredients: Ingredient[];
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly';
  progress: number;
  target: number;
  reward: number;
  expiresAt: string;
}

export interface FoodDumpItem {
  id: string;
  type: 'link' | 'note' | 'image' | 'voice';
  content: string;
  title?: string;
  thumbnail?: string;
  source?: string;
  tags?: string[];
  isProcessed: boolean;
  recipeId?: string;
  createdAt: string;
}

export interface GroceryItem {
  id: string;
  name: string;
  amount?: string;
  unit?: string;
  category: 'produce' | 'dairy' | 'protein' | 'grains' | 'pantry' | 'frozen' | 'other';
  isChecked: boolean;
  recipeId?: string;
  recipeName?: string;
}

export interface GroceryList {
  id: string;
  name: string;
  items: GroceryItem[];
  recipeIds: string[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface CookedMeal {
  id: string;
  recipeTitle: string;
  recipeImage?: string;
  recipeId?: string;
  cookedAt: string;
  estimatedSavings: number;
  isAIGenerated: boolean;
}
