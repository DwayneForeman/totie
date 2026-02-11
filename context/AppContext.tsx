import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useRef } from 'react';
import { OnboardingData, UserProfile, Recipe, PantryItem, RecipeMatch, Ingredient, Cookbook, FoodDumpItem, GroceryList, GroceryItem, NutritionInfo, CookedMeal } from '@/types';
import { generateRecipeImage, isPlaceholderImage, getPlaceholderImage } from '@/utils/generateRecipeImage';
import { useRevenueCat } from './RevenueCatContext';

const KEYS = {
  ONBOARDING: '@onboarding_data',
  USER_PROFILE: '@user_profile',
  RECIPES: '@recipes',
  PANTRY: '@pantry_items',
  TUTORIAL_COMPLETE: '@tutorial_complete',
  COOKBOOKS: '@cookbooks',
  FOOD_DUMP: '@food_dump',
  GROCERY_LISTS: '@grocery_lists',
  PAGE_TUTORIALS: '@page_tutorials',
  COOKED_MEALS: '@cooked_meals',
  DEVICE_ID: '@device_id',
  IS_PREMIUM: '@is_premium',
  FREE_RECIPE_SAVES_USED: '@free_recipe_saves_used',
  HAS_SEEN_RESCUE_PAYWALL: '@has_seen_rescue_paywall',
};

const generateDeviceId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  const extraRandom = Math.random().toString(36).substring(2, 6);
  return `dev_${timestamp}_${randomPart}${extraRandom}`;
};

const generateNutrition = (recipe: { ingredients: Ingredient[]; prepTime: number; cookTime: number }): NutritionInfo => {
  const ingNames = recipe.ingredients.map(i => i.name.toLowerCase()).join(' ');
  const hasSweet = /sugar|honey|chocolate|syrup|cake|cookie|dessert|fruit|banana|apple|berry|maple/.test(ingNames);
  const hasSalty = /salt|soy sauce|bacon|cheese|parmesan|anchov|olive|pickle|caper|miso/.test(ingNames);
  const hasProtein = /chicken|beef|pork|fish|salmon|shrimp|tofu|egg|turkey|lamb/.test(ingNames);
  const hasCarb = /rice|pasta|bread|flour|potato|noodle|tortilla/.test(ingNames);
  const ingCount = recipe.ingredients.length;
  let cal = 180 + ingCount * 25 + (hasProtein ? 120 : 0) + (hasCarb ? 80 : 0) + (hasSweet ? 60 : 0);
  cal = Math.round(cal / 10) * 10;
  return {
    calories: Math.min(cal, 850),
    saltLevel: hasSalty ? 'high' : (ingCount > 6 ? 'medium' : 'low'),
    sugarLevel: hasSweet ? 'high' : (hasCarb ? 'medium' : 'low'),
  };
};

const categorizeIngredient = (name: string): GroceryItem['category'] => {
  const lower = name.toLowerCase();
  const produce = ['lettuce', 'tomato', 'onion', 'garlic', 'pepper', 'carrot', 'celery', 'potato', 'apple', 'banana', 'lemon', 'lime', 'orange', 'avocado', 'spinach', 'kale', 'broccoli', 'cucumber', 'zucchini', 'mushroom', 'ginger', 'herbs', 'basil', 'cilantro', 'parsley'];
  const dairy = ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'egg', 'sour cream', 'cottage cheese'];
  const protein = ['chicken', 'beef', 'pork', 'fish', 'salmon', 'shrimp', 'tofu', 'turkey', 'bacon', 'sausage', 'lamb'];
  const grains = ['rice', 'pasta', 'bread', 'flour', 'oats', 'quinoa', 'noodle', 'tortilla', 'cereal'];
  const frozen = ['frozen', 'ice cream'];
  
  if (produce.some(p => lower.includes(p))) return 'produce';
  if (dairy.some(d => lower.includes(d))) return 'dairy';
  if (protein.some(p => lower.includes(p))) return 'protein';
  if (grains.some(g => lower.includes(g))) return 'grains';
  if (frozen.some(f => lower.includes(f))) return 'frozen';
  return 'pantry';
};

const [AppProviderInternal, useApp] = createContextHook(() => {
  const { isPremium: rcIsPremium } = useRevenueCat();
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isTutorialComplete, setIsTutorialComplete] = useState<boolean>(true);
  const [cookbooks, setCookbooks] = useState<Cookbook[]>([]);
  const [foodDumpItems, setFoodDumpItems] = useState<FoodDumpItem[]>([]);
  const [groceryLists, setGroceryLists] = useState<GroceryList[]>([]);
  const [pageTutorials, setPageTutorials] = useState<Record<string, boolean>>({});
  const [cookedMeals, setCookedMeals] = useState<CookedMeal[]>([]);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [localIsPremium, setLocalIsPremium] = useState<boolean>(false);
  const [freeRecipeSavesUsed, setFreeRecipeSavesUsed] = useState<number>(0);
  const [hasSeenRescuePaywall, setHasSeenRescuePaywall] = useState<boolean>(false);

  const isPremium = rcIsPremium || localIsPremium;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const results = await Promise.all([
        AsyncStorage.getItem(KEYS.USER_PROFILE),
        AsyncStorage.getItem(KEYS.RECIPES),
        AsyncStorage.getItem(KEYS.PANTRY),
        AsyncStorage.getItem(KEYS.TUTORIAL_COMPLETE),
        AsyncStorage.getItem(KEYS.COOKBOOKS),
        AsyncStorage.getItem(KEYS.FOOD_DUMP),
        AsyncStorage.getItem(KEYS.GROCERY_LISTS),
        AsyncStorage.getItem(KEYS.PAGE_TUTORIALS),
        AsyncStorage.getItem(KEYS.COOKED_MEALS),
        AsyncStorage.getItem(KEYS.DEVICE_ID),
        AsyncStorage.getItem(KEYS.IS_PREMIUM),
        AsyncStorage.getItem(KEYS.FREE_RECIPE_SAVES_USED),
        AsyncStorage.getItem(KEYS.HAS_SEEN_RESCUE_PAYWALL),
      ]);

      const storedDeviceId = results[9];
      if (storedDeviceId) {
        setDeviceId(storedDeviceId);
        console.log('[App] Device ID loaded:', storedDeviceId);
      } else {
        const newDeviceId = generateDeviceId();
        setDeviceId(newDeviceId);
        await AsyncStorage.setItem(KEYS.DEVICE_ID, newDeviceId);
        console.log('[App] New device ID created:', newDeviceId);
      }

      const [profileData, recipesData, pantryData, tutorialData, cookbooksData, foodDumpData, groceryData] = results;

      if (profileData) {
        setUserProfile(JSON.parse(profileData));
        setIsOnboardingComplete(true);
      }

      if (recipesData) {
        setRecipes(JSON.parse(recipesData));
      }

      if (pantryData) {
        setPantryItems(JSON.parse(pantryData));
      }

      setIsTutorialComplete(tutorialData === 'true');

      if (cookbooksData) {
        setCookbooks(JSON.parse(cookbooksData));
      }

      if (foodDumpData) {
        setFoodDumpItems(JSON.parse(foodDumpData));
      }

      if (groceryData) {
        setGroceryLists(JSON.parse(groceryData));
      }

      if (results[7]) {
        setPageTutorials(JSON.parse(results[7]));
      }

      if (results[8]) {
        setCookedMeals(JSON.parse(results[8]));
      }

      if (results[10] === 'true') {
        setLocalIsPremium(true);
        console.log('[App] Local premium status: true');
      }

      if (results[11]) {
        const count = parseInt(results[11], 10);
        if (!isNaN(count)) {
          setFreeRecipeSavesUsed(count);
          console.log('[App] Free recipe saves used:', count);
        }
      }

      if (results[12] === 'true') {
        setHasSeenRescuePaywall(true);
        console.log('[App] Has seen rescue paywall: true');
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async (data: OnboardingData) => {
    const profile: UserProfile = {
      ...data,
      createdAt: new Date().toISOString(),
      totalSavings: 0,
      mealsCooked: 0,
      recipesTried: 0,
      currentStreak: 0,
      coins: 0,
    };

    try {
      await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
      setUserProfile(profile);
      setIsOnboardingComplete(true);
      setIsTutorialComplete(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const completeTutorial = async () => {
    try {
      await AsyncStorage.setItem(KEYS.TUTORIAL_COMPLETE, 'true');
      setIsTutorialComplete(true);
    } catch (error) {
      console.error('Error saving tutorial state:', error);
    }
  };

  const updateRecipeImage = useCallback(async (recipeId: string, imageUri: string) => {
    setRecipes(prev => {
      const updated = prev.map(r => r.id === recipeId ? { ...r, image: imageUri } : r);
      AsyncStorage.setItem(KEYS.RECIPES, JSON.stringify(updated)).catch(err =>
        console.error('[ImageGen] Error persisting updated image:', err)
      );
      return updated;
    });
    console.log('[ImageGen] Recipe image updated:', recipeId);
  }, []);

  const generateAndSetRecipeImage = useCallback(async (
    recipeId: string,
    title: string,
    ingredients?: Ingredient[]
  ) => {
    try {
      console.log('[ImageGen] Generating AI image for:', title);
      const imageUri = await generateRecipeImage(title, ingredients);
      if (imageUri) {
        await updateRecipeImage(recipeId, imageUri);
      } else {
        console.log('[ImageGen] Generation returned null, keeping placeholder for:', title);
      }
    } catch (error) {
      console.error('[ImageGen] Background generation failed for:', title, error);
    }
  }, [updateRecipeImage]);

  const addRecipe = async (recipe: Omit<Recipe, 'id' | 'createdAt'>): Promise<Recipe> => {
    const needsGeneration = !recipe.image || isPlaceholderImage(recipe.image);
    let finalImage = recipe.image || getPlaceholderImage();

    if (needsGeneration) {
      console.log('[ImageGen] Generating AI image on the spot for:', recipe.title);
      try {
        const generatedUri = await generateRecipeImage(recipe.title, recipe.ingredients);
        if (generatedUri) {
          finalImage = generatedUri;
          console.log('[ImageGen] Image generated successfully for:', recipe.title);
        } else {
          console.log('[ImageGen] Generation returned null, using fallback for:', recipe.title);
        }
      } catch (error) {
        console.error('[ImageGen] On-the-spot generation failed for:', recipe.title, error);
      }
    }

    const newRecipe: Recipe = {
      ...recipe,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      image: finalImage,
      nutrition: recipe.nutrition ?? generateNutrition(recipe),
    };

    const updatedRecipes = [...recipes, newRecipe];
    setRecipes(updatedRecipes);

    try {
      await AsyncStorage.setItem(KEYS.RECIPES, JSON.stringify(updatedRecipes));
    } catch (error) {
      console.error('Error saving recipe:', error);
    }

    return newRecipe;
  };

  const deleteRecipe = async (recipeId: string) => {
    const deletedRecipe = recipes.find(r => r.id === recipeId);
    const updatedRecipes = recipes.filter(r => r.id !== recipeId);
    setRecipes(updatedRecipes);

    // Update cookbook recipe count if recipe was from a cookbook
    if (deletedRecipe?.cookbookId) {
      const updatedCookbooks = cookbooks.map(cb => 
        cb.id === deletedRecipe.cookbookId 
          ? { ...cb, recipeCount: Math.max(0, cb.recipeCount - 1) }
          : cb
      );
      setCookbooks(updatedCookbooks);
      await AsyncStorage.setItem(KEYS.COOKBOOKS, JSON.stringify(updatedCookbooks));
    }

    try {
      await AsyncStorage.setItem(KEYS.RECIPES, JSON.stringify(updatedRecipes));
    } catch (error) {
      console.error('Error deleting recipe:', error);
    }
  };

  const addCookbook = async (cookbook: Omit<Cookbook, 'id' | 'addedAt' | 'recipeCount'>) => {
    const newCookbook: Cookbook = {
      ...cookbook,
      id: Date.now().toString(),
      recipeCount: 0,
      addedAt: new Date().toISOString(),
    };

    const updatedCookbooks = [...cookbooks, newCookbook];
    setCookbooks(updatedCookbooks);

    try {
      await AsyncStorage.setItem(KEYS.COOKBOOKS, JSON.stringify(updatedCookbooks));
      return newCookbook;
    } catch (error) {
      console.error('Error saving cookbook:', error);
      return null;
    }
  };

  const deleteCookbook = async (cookbookId: string) => {
    const updatedCookbooks = cookbooks.filter(c => c.id !== cookbookId);
    setCookbooks(updatedCookbooks);

    // Remove cookbook reference from recipes (but keep recipes)
    const updatedRecipes = recipes.map(r => 
      r.cookbookId === cookbookId 
        ? { ...r, cookbookId: undefined, pageNumber: undefined }
        : r
    );
    setRecipes(updatedRecipes);

    try {
      await AsyncStorage.setItem(KEYS.COOKBOOKS, JSON.stringify(updatedCookbooks));
      await AsyncStorage.setItem(KEYS.RECIPES, JSON.stringify(updatedRecipes));
    } catch (error) {
      console.error('Error deleting cookbook:', error);
    }
  };

  const addRecipeFromCookbook = async (
    recipe: Omit<Recipe, 'id' | 'createdAt'>,
    cookbookId: string
  ) => {
    const needsGeneration = !recipe.image || isPlaceholderImage(recipe.image);
    let finalImage = recipe.image || getPlaceholderImage();

    if (needsGeneration) {
      console.log('[ImageGen] Generating AI image on the spot for cookbook recipe:', recipe.title);
      try {
        const generatedUri = await generateRecipeImage(recipe.title, recipe.ingredients);
        if (generatedUri) {
          finalImage = generatedUri;
          console.log('[ImageGen] Cookbook recipe image generated for:', recipe.title);
        }
      } catch (error) {
        console.error('[ImageGen] Cookbook recipe image generation failed:', recipe.title, error);
      }
    }

    const newRecipe: Recipe = {
      ...recipe,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      image: finalImage,
      cookbookId,
    };

    const updatedRecipes = [...recipes, newRecipe];
    setRecipes(updatedRecipes);

    const updatedCookbooks = cookbooks.map(cb => 
      cb.id === cookbookId 
        ? { ...cb, recipeCount: cb.recipeCount + 1 }
        : cb
    );
    setCookbooks(updatedCookbooks);

    try {
      await AsyncStorage.setItem(KEYS.RECIPES, JSON.stringify(updatedRecipes));
      await AsyncStorage.setItem(KEYS.COOKBOOKS, JSON.stringify(updatedCookbooks));
    } catch (error) {
      console.error('Error saving recipe from cookbook:', error);
    }
  };

  const getCookbookById = (cookbookId: string): Cookbook | undefined => {
    return cookbooks.find(cb => cb.id === cookbookId);
  };

  const getRecipesByCookbook = (cookbookId: string): Recipe[] => {
    return recipes.filter(r => r.cookbookId === cookbookId);
  };

  const addFoodDumpItem = async (item: Omit<FoodDumpItem, 'id' | 'createdAt' | 'isProcessed'>) => {
    const newItem: FoodDumpItem = {
      ...item,
      id: Date.now().toString(),
      isProcessed: false,
      createdAt: new Date().toISOString(),
    };

    const updated = [...foodDumpItems, newItem];
    setFoodDumpItems(updated);

    try {
      await AsyncStorage.setItem(KEYS.FOOD_DUMP, JSON.stringify(updated));
      return newItem;
    } catch (error) {
      console.error('Error saving food dump item:', error);
      return null;
    }
  };

  const deleteFoodDumpItem = async (itemId: string) => {
    const updated = foodDumpItems.filter(i => i.id !== itemId);
    setFoodDumpItems(updated);

    try {
      await AsyncStorage.setItem(KEYS.FOOD_DUMP, JSON.stringify(updated));
    } catch (error) {
      console.error('Error deleting food dump item:', error);
    }
  };

  const markFoodDumpProcessed = async (itemId: string, recipeId: string) => {
    const updated = foodDumpItems.map(i => 
      i.id === itemId ? { ...i, isProcessed: true, recipeId } : i
    );
    setFoodDumpItems(updated);

    try {
      await AsyncStorage.setItem(KEYS.FOOD_DUMP, JSON.stringify(updated));
    } catch (error) {
      console.error('Error updating food dump item:', error);
    }
  };

  const generateGroceryListFromRecipe = (recipe: Recipe, listId?: string): GroceryItem[] => {
    return recipe.ingredients.map((ing, idx) => ({
      id: `${recipe.id}-${idx}-${Date.now()}`,
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
      category: categorizeIngredient(ing.name),
      isChecked: false,
      recipeId: recipe.id,
      recipeName: recipe.title,
    }));
  };

  const createGroceryList = async (name: string, recipeIds: string[] = [], directRecipes?: Recipe[]) => {
    const selectedRecipes = directRecipes ?? recipes.filter(r => recipeIds.includes(r.id));
    const items: GroceryItem[] = selectedRecipes.flatMap(r => generateGroceryListFromRecipe(r));
    console.log('[GroceryList] Creating list:', name, 'recipes:', selectedRecipes.length, 'items:', items.length);

    const newList: GroceryList = {
      id: Date.now().toString(),
      name,
      items,
      recipeIds,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    };

    const updated = groceryLists.map(l => ({ ...l, isActive: false }));
    updated.push(newList);
    setGroceryLists(updated);

    try {
      await AsyncStorage.setItem(KEYS.GROCERY_LISTS, JSON.stringify(updated));
      return newList;
    } catch (error) {
      console.error('Error creating grocery list:', error);
      return null;
    }
  };

  const addRecipeToGroceryList = async (recipeId: string, listId?: string): Promise<{ added: number; skipped: number; skippedNames: string[] } | undefined> => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return undefined;

    const allNewItems = generateGroceryListFromRecipe(recipe);
    
    let targetListId = listId;
    if (!targetListId) {
      const activeList = groceryLists.find(l => l.isActive);
      if (activeList) {
        targetListId = activeList.id;
      } else {
        const newList = await createGroceryList('Shopping List', [recipeId], [recipe]);
        return newList ? { added: allNewItems.length, skipped: 0, skippedNames: [] } : undefined;
      }
    }

    const targetList = groceryLists.find(l => l.id === targetListId);
    const existingNames = new Set(
      (targetList?.items || []).map(i => i.name.toLowerCase().trim())
    );

    const filteredItems: GroceryItem[] = [];
    const skippedNames: string[] = [];

    for (const item of allNewItems) {
      const normalizedName = item.name.toLowerCase().trim();
      if (existingNames.has(normalizedName)) {
        skippedNames.push(item.name);
        console.log('[Grocery] Skipping duplicate from recipe:', item.name);
      } else {
        existingNames.add(normalizedName);
        filteredItems.push(item);
      }
    }

    const updated = groceryLists.map(l => {
      if (l.id === targetListId) {
        return {
          ...l,
          items: [...l.items, ...filteredItems],
          recipeIds: [...l.recipeIds, recipeId],
          updatedAt: new Date().toISOString(),
        };
      }
      return l;
    });

    setGroceryLists(updated);

    try {
      await AsyncStorage.setItem(KEYS.GROCERY_LISTS, JSON.stringify(updated));
    } catch (error) {
      console.error('Error adding recipe to grocery list:', error);
    }

    return { added: filteredItems.length, skipped: skippedNames.length, skippedNames };
  };

  const addIngredientsToGroceryList = async (ingredientNames: string[]): Promise<{ added: string[]; skipped: string[] }> => {
    const activeList = groceryLists.find(l => l.isActive);
    const existingNames = new Set(
      (activeList?.items || []).map(i => i.name.toLowerCase().trim())
    );

    const added: string[] = [];
    const skipped: string[] = [];
    const newItems: GroceryItem[] = [];

    ingredientNames.forEach((name, idx) => {
      const normalizedName = name.toLowerCase().trim();
      if (existingNames.has(normalizedName)) {
        skipped.push(name);
        console.log('[Grocery] Skipping duplicate ingredient:', name);
      } else {
        existingNames.add(normalizedName);
        added.push(name);
        newItems.push({
          id: `standalone-${Date.now()}-${idx}`,
          name: name.charAt(0).toUpperCase() + name.slice(1),
          category: categorizeIngredient(name),
          isChecked: false,
        });
      }
    });

    if (newItems.length === 0) {
      return { added, skipped };
    }

    let updated: GroceryList[];

    if (activeList) {
      updated = groceryLists.map(l => {
        if (l.id === activeList.id) {
          return {
            ...l,
            items: [...l.items, ...newItems],
            updatedAt: new Date().toISOString(),
          };
        }
        return l;
      });
    } else {
      const newList: GroceryList = {
        id: Date.now().toString(),
        name: 'Shopping List',
        items: newItems,
        recipeIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      };
      updated = [...groceryLists.map(l => ({ ...l, isActive: false })), newList];
    }

    setGroceryLists(updated);
    try {
      await AsyncStorage.setItem(KEYS.GROCERY_LISTS, JSON.stringify(updated));
    } catch (error) {
      console.error('Error adding ingredients to grocery list:', error);
    }

    return { added, skipped };
  };

  const toggleGroceryItem = async (listId: string, itemId: string): Promise<{ recipeComplete?: { recipeName: string; recipeId?: string } } | undefined> => {
    const list = groceryLists.find(l => l.id === listId);
    const item = list?.items.find(i => i.id === itemId);
    const willBeChecked = item ? !item.isChecked : false;

    const updated = groceryLists.map(l => {
      if (l.id === listId) {
        return {
          ...l,
          items: l.items.map(i => 
            i.id === itemId ? { ...i, isChecked: !i.isChecked } : i
          ),
          updatedAt: new Date().toISOString(),
        };
      }
      return l;
    });

    setGroceryLists(updated);

    let recipeCompleteInfo: { recipeName: string; recipeId?: string } | undefined;

    if (willBeChecked && item) {
      const alreadyInPantry = pantryItems.some(
        p => p.name.toLowerCase() === item.name.toLowerCase()
      );
      if (!alreadyInPantry) {
        const newPantryItem: PantryItem = {
          id: Date.now().toString() + '_' + itemId,
          name: item.name,
          category: item.category,
          quantity: item.amount ? `${item.amount}${item.unit ? ' ' + item.unit : ''}` : undefined,
          location: 'pantry',
          addedAt: new Date().toISOString(),
        };
        const updatedPantry = [...pantryItems, newPantryItem];
        setPantryItems(updatedPantry);
        try {
          await AsyncStorage.setItem(KEYS.PANTRY, JSON.stringify(updatedPantry));
        } catch (error) {
          console.error('Error adding grocery item to pantry:', error);
        }
        console.log('[Grocery] Checked off & added to pantry:', item.name);
      }

      if (item.recipeName) {
        const updatedList = updated.find(l => l.id === listId);
        if (updatedList) {
          const recipeItems = updatedList.items.filter(i => i.recipeName === item.recipeName);
          const allChecked = recipeItems.length > 0 && recipeItems.every(i => i.isChecked);
          if (allChecked) {
            console.log('[Grocery] All items for recipe checked:', item.recipeName);
            recipeCompleteInfo = { recipeName: item.recipeName, recipeId: item.recipeId };
          }
        }
      }
    } else if (!willBeChecked && item) {
      const pantryMatch = pantryItems.find(
        p => p.name.toLowerCase() === item.name.toLowerCase()
      );
      if (pantryMatch) {
        const updatedPantry = pantryItems.filter(p => p.id !== pantryMatch.id);
        setPantryItems(updatedPantry);
        try {
          await AsyncStorage.setItem(KEYS.PANTRY, JSON.stringify(updatedPantry));
        } catch (error) {
          console.error('Error removing unchecked item from pantry:', error);
        }
        console.log('[Grocery] Unchecked & removed from pantry:', item.name);
      }
    }

    try {
      await AsyncStorage.setItem(KEYS.GROCERY_LISTS, JSON.stringify(updated));
    } catch (error) {
      console.error('Error toggling grocery item:', error);
    }

    return recipeCompleteInfo ? { recipeComplete: recipeCompleteInfo } : undefined;
  };

  const deleteGroceryList = async (listId: string) => {
    const updated = groceryLists.filter(l => l.id !== listId);
    setGroceryLists(updated);

    try {
      await AsyncStorage.setItem(KEYS.GROCERY_LISTS, JSON.stringify(updated));
    } catch (error) {
      console.error('Error deleting grocery list:', error);
    }
  };

  const getActiveGroceryList = (): GroceryList | undefined => {
    return groceryLists.find(l => l.isActive);
  };

  const addPantryItem = async (item: Omit<PantryItem, 'id' | 'addedAt'>): Promise<{ added: boolean; duplicate: boolean; existingLocation?: string }> => {
    return new Promise((resolve) => {
      setPantryItems(prev => {
        const existingItem = prev.find(
          p => p.name.toLowerCase().trim() === item.name.toLowerCase().trim() && p.location === item.location
        );

        if (existingItem) {
          console.log('[Pantry] Duplicate detected:', item.name, 'in', item.location);
          resolve({ added: false, duplicate: true, existingLocation: existingItem.location });
          return prev;
        }

        const existingElsewhere = prev.find(
          p => p.name.toLowerCase().trim() === item.name.toLowerCase().trim() && p.location !== item.location
        );

        if (existingElsewhere) {
          console.log('[Pantry] Item exists in other location:', item.name, 'in', existingElsewhere.location);
        }

        const newItem: PantryItem = {
          ...item,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          addedAt: new Date().toISOString(),
        };

        const updatedPantry = [...prev, newItem];

        AsyncStorage.setItem(KEYS.PANTRY, JSON.stringify(updatedPantry)).catch(error => {
          console.error('Error saving pantry item:', error);
        });

        resolve({ added: true, duplicate: false, existingLocation: existingElsewhere?.location });
        return updatedPantry;
      });
    });
  };

  const deletePantryItem = async (itemId: string) => {
    const updatedPantry = pantryItems.filter(i => i.id !== itemId);
    setPantryItems(updatedPantry);

    try {
      await AsyncStorage.setItem(KEYS.PANTRY, JSON.stringify(updatedPantry));
    } catch (error) {
      console.error('Error deleting pantry item:', error);
    }
  };

  const getRecipeMatches = (): RecipeMatch[] => {
    const pantryNames = pantryItems.map(item => item.name.toLowerCase());

    return recipes.map(recipe => {
      const matchingIngredients: string[] = [];
      const missingIngredients: Ingredient[] = [];

      recipe.ingredients.forEach(ingredient => {
        const ingredientName = ingredient.name.toLowerCase();
        const isMatch = pantryNames.some(pantryItem => 
          ingredientName.includes(pantryItem) || pantryItem.includes(ingredientName)
        );

        if (isMatch) {
          matchingIngredients.push(ingredient.name);
        } else {
          missingIngredients.push(ingredient);
        }
      });

      const matchPercentage = recipe.ingredients.length > 0
        ? (matchingIngredients.length / recipe.ingredients.length) * 100
        : 0;

      return {
        recipe,
        matchPercentage,
        matchingIngredients,
        missingIngredients,
      };
    }).sort((a, b) => b.matchPercentage - a.matchPercentage);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!userProfile) return;
    const updated: UserProfile = { ...userProfile, ...updates };
    setUserProfile(updated);
    try {
      await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(updated));
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const claimChallengeReward = async (coins: number) => {
    if (!userProfile) return;
    const updated: UserProfile = { ...userProfile, coins: userProfile.coins + coins };
    setUserProfile(updated);
    try {
      await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(updated));
    } catch (error) {
      console.error('Error claiming reward:', error);
    }
  };

  const isPageTutorialComplete = (page: string): boolean => {
    return pageTutorials[page] === true;
  };

  const completePageTutorial = async (page: string) => {
    const updated = { ...pageTutorials, [page]: true };
    setPageTutorials(updated);
    try {
      await AsyncStorage.setItem(KEYS.PAGE_TUTORIALS, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving page tutorial state:', error);
    }
  };

  const addCookedMeal = async (meal: Omit<CookedMeal, 'id' | 'cookedAt'>) => {
    const newMeal: CookedMeal = {
      ...meal,
      id: Date.now().toString(),
      cookedAt: new Date().toISOString(),
    };
    const updated = [newMeal, ...cookedMeals];
    setCookedMeals(updated);
    try {
      await AsyncStorage.setItem(KEYS.COOKED_MEALS, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving cooked meal:', error);
    }
    return newMeal;
  };

  const upgradeToPremium = async () => {
    setLocalIsPremium(true);
    try {
      await AsyncStorage.setItem(KEYS.IS_PREMIUM, 'true');
      console.log('[App] Upgraded to premium (local fallback)');
    } catch (error) {
      console.error('Error saving premium status:', error);
    }
  };

  const incrementFreeRecipeSaves = async () => {
    const newCount = freeRecipeSavesUsed + 1;
    setFreeRecipeSavesUsed(newCount);
    try {
      await AsyncStorage.setItem(KEYS.FREE_RECIPE_SAVES_USED, newCount.toString());
      console.log('[App] Free recipe saves used:', newCount);
    } catch (error) {
      console.error('Error saving free recipe saves:', error);
    }
  };

  const markRescuePaywallSeen = async () => {
    setHasSeenRescuePaywall(true);
    try {
      await AsyncStorage.setItem(KEYS.HAS_SEEN_RESCUE_PAYWALL, 'true');
      console.log('[App] Rescue paywall marked as seen');
    } catch (error) {
      console.error('Error saving rescue paywall state:', error);
    }
  };

  const canSaveRecipeFromLink = (): boolean => {
    if (isPremium) return true;
    return freeRecipeSavesUsed < 1;
  };

  // RESCUE PAYWALL DISABLED FOR NOW — uncomment the logic below to re-enable
  const shouldShowRescuePaywall = (): boolean => {
    return false;
    // if (isPremium) return false;
    // if (hasSeenRescuePaywall) return false;
    // return freeRecipeSavesUsed >= 1;
  };

  const resetApp = async () => {
    try {
      await AsyncStorage.multiRemove(Object.values(KEYS));
      setUserProfile(null);
      setRecipes([]);
      setPantryItems([]);
      setCookbooks([]);
      setFoodDumpItems([]);
      setGroceryLists([]);
      setPageTutorials({});
      setCookedMeals([]);
      setIsOnboardingComplete(false);
      setIsTutorialComplete(true);
      setLocalIsPremium(false);
      setFreeRecipeSavesUsed(0);
      setHasSeenRescuePaywall(false);
    } catch (error) {
      console.error('Error resetting app:', error);
    }
  };

  const updateStats = async (savings?: number, mealCooked?: boolean) => {
    if (!userProfile) return;

    const updated: UserProfile = {
      ...userProfile,
      totalSavings: userProfile.totalSavings + (savings || 0),
      mealsCooked: userProfile.mealsCooked + (mealCooked ? 1 : 0),
    };

    setUserProfile(updated);

    try {
      await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(updated));
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  };

  return {
    deviceId,
    isOnboardingComplete,
    isTutorialComplete,
    userProfile,
    recipes,
    pantryItems,
    cookbooks,
    foodDumpItems,
    groceryLists,
    loading,
    completeOnboarding,
    completeTutorial,
    addRecipe,
    deleteRecipe,
    addPantryItem,
    deletePantryItem,
    getRecipeMatches,
    updateStats,
    addCookbook,
    deleteCookbook,
    addRecipeFromCookbook,
    getCookbookById,
    getRecipesByCookbook,
    addFoodDumpItem,
    deleteFoodDumpItem,
    markFoodDumpProcessed,
    createGroceryList,
    addRecipeToGroceryList,
    addIngredientsToGroceryList,
    toggleGroceryItem,
    deleteGroceryList,
    getActiveGroceryList,
    updateProfile,
    claimChallengeReward,
    isPageTutorialComplete,
    completePageTutorial,
    cookedMeals,
    addCookedMeal,
    resetApp,
    isPremium,
    freeRecipeSavesUsed,
    hasSeenRescuePaywall,
    upgradeToPremium,
    incrementFreeRecipeSaves,
    markRescuePaywallSeen,
    canSaveRecipeFromLink,
    shouldShowRescuePaywall,
  };
});

// Named export with display name for better debugging
export const AppProvider = AppProviderInternal;
export { useApp };
