import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable, Image, Modal, Alert, ActivityIndicator, TextInput, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChefHat, ShoppingCart, Sparkles, ArrowRight, X, Clock, Users, Check, ExternalLink, Plus, Flame, Wand2, RefreshCw, Link as LinkIcon, Edit3, Trophy, UtensilsCrossed, Trash2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { generateObject } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';
import { useApp } from '@/context/AppContext';
import colors from '@/constants/colors';
import { Recipe, RecipeMatch, Ingredient } from '@/types';
import PageCoachMarks, { PageCoachStep } from '@/components/PageCoachMarks';
import PremiumPaywall from '@/components/PremiumPaywall';

const AIRecipeSchema = z.object({
  title: z.string().describe('A creative, appetizing name for the recipe'),
  ingredients: z.array(z.object({
    name: z.string(),
    amount: z.string().optional(),
    unit: z.string().optional(),
  })).describe('List of ingredients with amounts'),
  instructions: z.array(z.string()).describe('Step-by-step cooking instructions'),
  prepTime: z.number().describe('Preparation time in minutes'),
  cookTime: z.number().describe('Cooking time in minutes'),
  servings: z.number().describe('Number of servings'),
  tips: z.string().optional().describe('Optional cooking tips or variations'),
});

type AIRecipe = z.infer<typeof AIRecipeSchema>;

const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function CookNowTab() {
  const { recipes, pantryItems, getRecipeMatches, addRecipeToGroceryList, addIngredientsToGroceryList, updateStats, addRecipe, createGroceryList, cookedMeals, addCookedMeal, deleteRecipe, isPremium } = useApp();
  const router = useRouter();
  
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<RecipeMatch | null>(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [cookingMode, setCookingMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiRecipe, setAiRecipe] = useState<AIRecipe | null>(null);
  const [showAIRecipeModal, setShowAIRecipeModal] = useState(false);
  const [aiCookingMode, setAiCookingMode] = useState(false);
  const [aiCurrentStep, setAiCurrentStep] = useState(0);
  const { isPageTutorialComplete, completePageTutorial } = useApp();
  const [showPageTutorial, setShowPageTutorial] = useState(false);
  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [addRecipeType, setAddRecipeType] = useState<'note' | 'link'>('note');
  const [addRecipeContent, setAddRecipeContent] = useState('');
  const [isProcessingRecipe, setIsProcessingRecipe] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'cook' | 'completed'>('cook');
  const [addedToGrocery, setAddedToGrocery] = useState<Set<string>>(new Set());
  const [showPremiumPaywall, setShowPremiumPaywall] = useState(false);
  const cookPulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isPremium) {
      setShowPremiumPaywall(true);
    }
  }, [isPremium]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(cookPulseAnim, {
          toValue: 1.08,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(cookPulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [cookPulseAnim]);

  const COOK_NOW_STEPS: PageCoachStep[] = [
    {
      id: 'cook-welcome',
      title: 'What Can I Make? \u{1F373}',
      emoji: '\u{1F468}\u200D\u{1F373}',
      message: 'This is the magic! We match your kitchen ingredients with your saved recipes to show what you can cook right now.',
    },
    {
      id: 'cook-sections',
      title: 'Match Levels',
      emoji: '\u{1F4CA}',
      message: 'Recipes are sorted by match: "Ready Now" (100% match), "Almost There" (just need 1-2 items), and "Worth a Trip" (needs a few more).',
    },
    {
      id: 'cook-grocery',
      title: 'Missing Ingredients?',
      emoji: '\u{1F6D2}',
      message: 'Tap the cart icon to add missing ingredients straight to your grocery list. Shop, check off items, and come back to cook!',
    },
    {
      id: 'cook-ai',
      title: 'AI Chef Mode \u2728',
      emoji: '\u{1FA84}',
      message: 'No matches? Tap "AI Suggest a Meal" and I\'ll create a custom recipe using only what\'s in your kitchen!',
    },
  ];

  React.useEffect(() => {
    if (!isPageTutorialComplete('cook-now')) {
      const timer = setTimeout(() => setShowPageTutorial(true), 800);
      return () => clearTimeout(timer);
    }
  }, [isPageTutorialComplete]);

  const allMatches = getRecipeMatches();
  const cookedRecipeIds = new Set(cookedMeals.map(m => m.recipeId).filter(Boolean));
  const matches = allMatches.filter(m => !cookedRecipeIds.has(m.recipe.id));
  const readyNow = matches.filter(m => m.matchPercentage === 100);
  const almostThere = matches.filter(m => m.matchPercentage >= 70 && m.matchPercentage < 100);
  const worthATrip = matches.filter(m => m.matchPercentage >= 40 && m.matchPercentage < 70);
  const needsWork = matches.filter(m => m.matchPercentage < 40);

  const hasRecipes = recipes.length > 0;
  const hasPantry = pantryItems.length > 0;

  const suggestedIngredients = React.useMemo(() => {
    const pantryNames = new Set(pantryItems.map(p => p.name.toLowerCase()));
    const ingredientUnlockMap = new Map<string, { count: number; recipeNames: string[] }>();

    for (const recipe of recipes) {
      for (const ing of recipe.ingredients) {
        const lower = ing.name.toLowerCase();
        if (!pantryNames.has(lower)) {
          const existing = ingredientUnlockMap.get(lower) || { count: 0, recipeNames: [] };
          existing.count += 1;
          if (existing.recipeNames.length < 3) {
            existing.recipeNames.push(recipe.title);
          }
          ingredientUnlockMap.set(lower, existing);
        }
      }
    }

    return Array.from(ingredientUnlockMap.entries())
      .map(([name, data]) => ({ name, count: data.count, recipeNames: data.recipeNames }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [recipes, pantryItems]);

  const addRecipeSchema = z.object({
    title: z.string().describe('A catchy, descriptive recipe title'),
    ingredients: z.array(z.object({
      name: z.string().describe('Ingredient name'),
      amount: z.string().optional().describe('Amount like "2" or "1/2"'),
      unit: z.string().optional().describe('Unit like "cups", "tbsp", "pieces"'),
    })).describe('List of ingredients needed'),
    instructions: z.array(z.string()).describe('Step-by-step cooking instructions'),
    prepTime: z.number().describe('Prep time in minutes'),
    cookTime: z.number().describe('Cook time in minutes'),
    servings: z.number().describe('Number of servings'),
  });



  const extractMetaTags = useCallback((html: string): string => {
    const metaParts: string[] = [];
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) metaParts.push(`Page Title: ${titleMatch[1].trim()}`);

    const metaPatterns = [
      { regex: /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i, label: 'Title' },
      { regex: /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i, label: 'Title' },
      { regex: /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i, label: 'Description' },
      { regex: /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i, label: 'Description' },
      { regex: /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i, label: 'Description' },
      { regex: /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i, label: 'Description' },
      { regex: /<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']+)["']/i, label: 'Title' },
      { regex: /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:title["']/i, label: 'Title' },
      { regex: /<meta[^>]*name=["']twitter:description["'][^>]*content=["']([^"']+)["']/i, label: 'Description' },
      { regex: /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:description["']/i, label: 'Description' },
    ];

    const seenLabels = new Set<string>();
    for (const { regex, label } of metaPatterns) {
      const match = html.match(regex);
      if (match && match[1] && !seenLabels.has(label + match[1])) {
        seenLabels.add(label + match[1]);
        metaParts.push(`${label}: ${match[1].trim()}`);
      }
    }

    const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    if (jsonLdMatches) {
      for (const jsonBlock of jsonLdMatches) {
        const jsonContent = jsonBlock.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
        try {
          const parsed = JSON.parse(jsonContent);
          if (parsed['@type'] === 'Recipe' || parsed.recipeIngredient || parsed.recipeInstructions) {
            metaParts.push(`Structured Recipe Data: ${JSON.stringify(parsed).slice(0, 4000)}`);
          } else if (parsed.name || parsed.description) {
            metaParts.push(`Structured Data: name=${parsed.name || ''}, description=${parsed.description || ''}`);
          }
        } catch (_e) { /* ignore parse errors */ }
      }
    }

    return metaParts.join('\n');
  }, []);

  const fetchUrlContent = useCallback(async (url: string): Promise<string> => {
    try {
      console.log('[CookNow] Fetching URL content:', url);
      const response = await fetch(url, {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        },
      });
      if (!response.ok) {
        console.warn('[CookNow] URL fetch failed with status:', response.status);
        return '';
      }
      const html = await response.text();
      
      const metaContent = extractMetaTags(html);
      console.log('[CookNow] Extracted meta tags:', metaContent.slice(0, 500));

      const textContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
        .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
      
      const combined = metaContent + '\n\nPage text:\n' + textContent.slice(0, 6000);
      console.log('[CookNow] Total extracted content length:', combined.length);
      return combined;
    } catch (error) {
      console.warn('[CookNow] Could not fetch URL content:', error);
      return '';
    }
  }, [extractMetaTags]);

  const handleAddRecipeSubmit = useCallback(async () => {
    if (!addRecipeContent.trim()) return;
    const content = addRecipeContent.trim();
    const type = addRecipeType;
    setAddRecipeContent('');
    setShowAddRecipe(false);
    setIsProcessingRecipe(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      let prompt: string;
      if (type === 'link') {
        const pageContent = await fetchUrlContent(content);
        const isSocialMedia = /tiktok\.com|instagram\.com|youtube\.com|youtu\.be|facebook\.com|twitter\.com|x\.com|threads\.net/i.test(content);
        if (pageContent.length > 100) {
          prompt = `Extract the recipe from this URL: ${content}\n\nExtracted page metadata and content:\n${pageContent}\n\nIMPORTANT INSTRUCTIONS:\n- Use the page title, description, and any structured data to identify the EXACT recipe shown on this page.\n- The recipe title, ingredients, and instructions MUST match what is described on the page.\n- Do NOT invent a different recipe. If the page is about an omelette, the recipe must be an omelette.\n- If this is a social media video page, use the video title/description to determine the recipe and create an accurate version of it.\n- Pay close attention to meta tags (og:title, og:description) as they describe the actual content.`;
        } else if (isSocialMedia) {
          prompt = `The user pasted this social media recipe link: ${content}\n\nThe page content could not be fully extracted because it is a dynamic social media page. Analyze the URL carefully for any clues about the recipe (path segments, hashtags, usernames, keywords).\n\nBased on the URL, identify the most likely recipe and create an accurate version. If the URL contains words like "omelette", "pasta", "chicken" etc., the recipe MUST be that dish. Do NOT default to a generic popular recipe.`;
        } else {
          prompt = `I pasted this recipe URL but the content could not be fetched: ${content}. Based on the URL path and domain, try your best to determine what recipe this is and create an accurate version of it. Use the URL clues (path, keywords) to identify the specific dish. Do NOT make up a random popular recipe — stick to what the URL suggests.`;
        }
      } else {
        prompt = `Create a detailed recipe based on this idea: "${content}". Make it practical and delicious.`;
      }

      const result = await generateObject({
        messages: [{ role: 'user', content: prompt }],
        schema: addRecipeSchema,
      });

      const recipeData = {
        title: result.title,
        image: '',
        ingredients: result.ingredients as Ingredient[],
        instructions: result.instructions,
        prepTime: result.prepTime,
        cookTime: result.cookTime,
        servings: result.servings,
        source: type === 'link' ? content : 'Cook Now',
      };

      const savedRecipe = await addRecipe(recipeData);
      await createGroceryList(`${result.title} Shopping`, [savedRecipe.id], [savedRecipe]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '🎉 Recipe Created!',
        `"${result.title}" has been added to your recipes with a grocery list.`,
        [
          { text: 'OK', style: 'cancel' },
          { text: 'Go to Grocery List', onPress: () => router.push({ pathname: '/(tabs)/kitchen', params: { tab: 'grocery' } }) },
        ]
      );
    } catch (error) {
      console.error('[CookNow] Add recipe error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Oops!', 'Could not generate the recipe. Please try again.');
    } finally {
      setIsProcessingRecipe(false);
    }
  }, [addRecipeContent, addRecipeType, addRecipe, createGroceryList, router]);

  const openRecipeDetail = useCallback((match: RecipeMatch) => {
    console.log('[CookNow] Opening recipe detail:', match.recipe.title);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedRecipe(match.recipe);
    setSelectedMatch(match);
    setShowRecipeModal(true);
    setCookingMode(false);
    setCurrentStep(0);
  }, []);

  const closeRecipeModal = useCallback(() => {
    setShowRecipeModal(false);
    setSelectedRecipe(null);
    setSelectedMatch(null);
    setCookingMode(false);
    setCurrentStep(0);
  }, []);

  const startCooking = useCallback(() => {
    console.log('[CookNow] Starting cooking mode');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCookingMode(true);
    setCurrentStep(0);
  }, []);

  const nextStep = useCallback(() => {
    if (!selectedRecipe) return;
    const maxSteps = selectedRecipe.instructions.length;
    if (currentStep < maxSteps - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentStep(prev => prev + 1);
    }
  }, [selectedRecipe, currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const finishCooking = useCallback(() => {
    console.log('[CookNow] Finished cooking');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const estimatedSavings = Math.floor(Math.random() * 10) + 8;
    updateStats(estimatedSavings, true);
    
    if (selectedRecipe) {
      addCookedMeal({
        recipeTitle: selectedRecipe.title,
        recipeImage: selectedRecipe.image,
        recipeId: selectedRecipe.id,
        estimatedSavings,
        isAIGenerated: false,
      });
    }
    
    Alert.alert(
      '🎉 Meal Complete!',
      `Great job cooking ${selectedRecipe?.title}! You saved approximately ${estimatedSavings} by cooking at home.`,
      [
        { text: 'Done', onPress: closeRecipeModal },
        { text: 'View Completed', onPress: () => { closeRecipeModal(); setActiveTab('completed'); } },
      ]
    );
  }, [selectedRecipe, updateStats, closeRecipeModal, addCookedMeal]);

  const handleAddToGrocery = useCallback(async (recipeId: string, recipeName: string) => {
    console.log('[CookNow] Adding to grocery:', recipeName);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await addRecipeToGroceryList(recipeId);
    setAddedToGrocery(prev => new Set([...prev, recipeId]));
    if (result && result.skipped > 0 && result.added === 0) {
      Alert.alert(
        'Already on List',
        `All ingredients from "${recipeName}" are already on your grocery list.`,
        [
          { text: 'OK', style: 'cancel' },
          { text: 'Go to Grocery List', onPress: () => router.push({ pathname: '/(tabs)/kitchen', params: { tab: 'grocery' } }) },
        ]
      );
    } else if (result && result.skipped > 0) {
      Alert.alert(
        '🛒 Added to Grocery List',
        `Added ${result.added} ingredient${result.added > 1 ? 's' : ''}. ${result.skipped} already on your list were skipped.`,
        [
          { text: 'OK', style: 'cancel' },
          { text: 'Go to Grocery List', onPress: () => router.push({ pathname: '/(tabs)/kitchen', params: { tab: 'grocery' } }) },
        ]
      );
    } else {
      Alert.alert(
        '🛒 Added to Grocery List',
        `Missing ingredients from "${recipeName}" have been added to your grocery list.`,
        [
          { text: 'OK', style: 'cancel' },
          { text: 'Go to Grocery List', onPress: () => router.push({ pathname: '/(tabs)/kitchen', params: { tab: 'grocery' } }) },
        ]
      );
    }
  }, [addRecipeToGroceryList, router]);

  const handleAddSuggestedToGrocery = useCallback(async (ingredientNames: string[]) => {
    if (ingredientNames.length === 0) return;
    console.log('[CookNow] Adding suggested ingredients to grocery:', ingredientNames);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await addIngredientsToGroceryList(ingredientNames);
    if (result.skipped.length > 0 && result.added.length === 0) {
      Alert.alert(
        'Already on List',
        `All ${result.skipped.length} ingredient${result.skipped.length > 1 ? 's are' : ' is'} already on your grocery list.`,
        [
          { text: 'OK', style: 'cancel' },
          { text: 'Go to Grocery List', onPress: () => router.push({ pathname: '/(tabs)/kitchen', params: { tab: 'grocery' } }) },
        ]
      );
    } else if (result.skipped.length > 0) {
      Alert.alert(
        '🛒 Added to Grocery List',
        `Added ${result.added.length} ingredient${result.added.length > 1 ? 's' : ''}. ${result.skipped.length} already on your list were skipped.`,
        [
          { text: 'Stay Here', style: 'cancel' },
          { text: 'Go to Grocery List', onPress: () => router.push({ pathname: '/(tabs)/kitchen', params: { tab: 'grocery' } }) },
        ]
      );
    } else {
      Alert.alert(
        '🛒 Added to Grocery List',
        `${result.added.length} ingredient${result.added.length > 1 ? 's' : ''} added to your grocery list.`,
        [
          { text: 'Stay Here', style: 'cancel' },
          { text: 'Go to Grocery List', onPress: () => router.push({ pathname: '/(tabs)/kitchen', params: { tab: 'grocery' } }) },
        ]
      );
    }
  }, [addIngredientsToGroceryList, router]);

  const handleAddMissingToGrocery = useCallback(async () => {
    if (!selectedRecipe || !selectedMatch) return;
    console.log('[CookNow] Adding missing ingredients to grocery');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await addRecipeToGroceryList(selectedRecipe.id);
    setAddedToGrocery(prev => new Set([...prev, selectedRecipe.id]));
    if (result && result.skipped > 0 && result.added === 0) {
      Alert.alert(
        'Already on List',
        `All ingredients are already on your grocery list.`,
        [{ text: 'Go to Grocery List', onPress: () => router.push({ pathname: '/(tabs)/kitchen', params: { tab: 'grocery' } }) }, { text: 'Stay Here', style: 'cancel' }]
      );
    } else if (result && result.skipped > 0) {
      Alert.alert(
        '🛒 Added to Grocery List',
        `Added ${result.added} ingredient${result.added > 1 ? 's' : ''}. ${result.skipped} already on your list were skipped.\n\nNext step: Head to Kitchen → Grocery tab to check off items as you shop.`,
        [{ text: 'Go to Grocery List', onPress: () => router.push({ pathname: '/(tabs)/kitchen', params: { tab: 'grocery' } }) }, { text: 'Stay Here', style: 'cancel' }]
      );
    } else {
      Alert.alert(
        '🛒 Added to Grocery List',
        `${selectedMatch.missingIngredients.length} missing ingredient${selectedMatch.missingIngredients.length > 1 ? 's' : ''} added to your grocery list.\n\nNext step: Head to Kitchen → Grocery tab to check off items as you shop. Once everything is checked, come back to Cook Now!`,
        [{ text: 'Go to Grocery List', onPress: () => router.push({ pathname: '/(tabs)/kitchen', params: { tab: 'grocery' } }) }, { text: 'Stay Here', style: 'cancel' }]
      );
    }
  }, [selectedRecipe, selectedMatch, addRecipeToGroceryList, router]);

  const generateAIRecipe = useCallback(async () => {
    if (pantryItems.length === 0) {
      Alert.alert('No Ingredients', 'Add some ingredients to your kitchen first!');
      return;
    }

    console.log('[CookNow] Generating AI recipe with', pantryItems.length, 'ingredients');
    setIsGeneratingAI(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const ingredientList = pantryItems.map(item => item.name).join(', ');
      
      const result = await generateObject({
        messages: [{
          role: 'user',
          content: `I have these ingredients in my kitchen: ${ingredientList}.

Create a delicious, practical recipe I can make with ONLY these ingredients (or a reasonable subset of them). 
Don't require any ingredients I don't have listed.
Make it something tasty and satisfying that a home cook would enjoy making.
Keep instructions clear and beginner-friendly.`
        }],
        schema: AIRecipeSchema,
      });

      console.log('[CookNow] AI recipe generated:', result.title);
      setAiRecipe(result);
      setShowAIRecipeModal(true);
      setAiCookingMode(false);
      setAiCurrentStep(0);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('[CookNow] AI generation error:', error);
      Alert.alert('Oops!', 'Could not generate a recipe right now. Please try again.');
    } finally {
      setIsGeneratingAI(false);
    }
  }, [pantryItems]);

  const closeAIRecipeModal = useCallback(() => {
    setShowAIRecipeModal(false);
    setAiRecipe(null);
    setAiCookingMode(false);
    setAiCurrentStep(0);
  }, []);

  const startAICooking = useCallback(() => {
    console.log('[CookNow] Starting AI cooking mode');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setAiCookingMode(true);
    setAiCurrentStep(0);
  }, []);

  const nextAIStep = useCallback(() => {
    if (!aiRecipe) return;
    const maxSteps = aiRecipe.instructions.length;
    if (aiCurrentStep < maxSteps - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setAiCurrentStep(prev => prev + 1);
    }
  }, [aiRecipe, aiCurrentStep]);

  const prevAIStep = useCallback(() => {
    if (aiCurrentStep > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setAiCurrentStep(prev => prev - 1);
    }
  }, [aiCurrentStep]);

  const finishAICooking = useCallback(() => {
    console.log('[CookNow] Finished AI cooking');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const estimatedSavings = Math.floor(Math.random() * 10) + 8;
    updateStats(estimatedSavings, true);
    
    if (aiRecipe) {
      addCookedMeal({
        recipeTitle: aiRecipe.title,
        recipeImage: undefined,
        recipeId: undefined,
        estimatedSavings,
        isAIGenerated: true,
      });
    }
    
    Alert.alert(
      '🎉 Meal Complete!',
      `Great job cooking ${aiRecipe?.title}! You saved approximately ${estimatedSavings} by cooking at home.`,
      [
        { text: 'Done', onPress: closeAIRecipeModal },
        { text: 'View Completed', onPress: () => { closeAIRecipeModal(); setActiveTab('completed'); } },
      ]
    );
  }, [aiRecipe, updateStats, closeAIRecipeModal, addCookedMeal]);

  const openSourceUrl = useCallback(() => {
    if (selectedRecipe?.source) {
      Alert.alert(
        'Open Recipe Source',
        `This will open the original recipe at ${selectedRecipe.source}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open', onPress: () => console.log('[CookNow] Would open:', selectedRecipe.source) }
        ]
      );
    }
  }, [selectedRecipe]);

  const renderAIRecipeModal = () => {
    if (!aiRecipe) return null;

    if (aiCookingMode) {
      const instructions = aiRecipe.instructions;
      const totalSteps = instructions.length;
      const isLastStep = aiCurrentStep === totalSteps - 1;

      return (
        <Modal
          visible={showAIRecipeModal}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={closeAIRecipeModal}
        >
          <View style={styles.cookingContainer}>
            <SafeAreaView style={styles.cookingSafeArea} edges={['top', 'bottom']}>
              <View style={styles.cookingHeader}>
                <TouchableOpacity onPress={() => setAiCookingMode(false)} style={styles.cookingBackBtn}>
                  <X size={24} color={colors.white} strokeWidth={2.5} />
                </TouchableOpacity>
                <View style={styles.cookingTitleWrap}>
                  <Text style={styles.cookingTitle} numberOfLines={1}>{aiRecipe.title}</Text>
                  <Text style={styles.cookingProgress}>Step {aiCurrentStep + 1} of {totalSteps}</Text>
                </View>
                <View style={styles.cookingBackBtn} />
              </View>

              <View style={styles.cookingProgressBar}>
                <View style={[styles.cookingProgressFill, { width: `${((aiCurrentStep + 1) / totalSteps) * 100}%` }]} />
              </View>

              <ScrollView 
                style={styles.cookingContent}
                contentContainerStyle={styles.cookingContentInner}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.stepCard}>
                  <View style={styles.stepNumberBadge}>
                    <Text style={styles.stepNumberText}>{aiCurrentStep + 1}</Text>
                  </View>
                  <Text style={styles.stepInstruction}>{instructions[aiCurrentStep]}</Text>
                </View>
              </ScrollView>

              <View style={styles.cookingNav}>
                <TouchableOpacity 
                  style={[styles.cookingNavBtn, aiCurrentStep === 0 && styles.cookingNavBtnDisabled]}
                  onPress={prevAIStep}
                  disabled={aiCurrentStep === 0}
                >
                  <Text style={[styles.cookingNavBtnText, aiCurrentStep === 0 && styles.cookingNavBtnTextDisabled]}>Previous</Text>
                </TouchableOpacity>

                {isLastStep ? (
                  <TouchableOpacity style={styles.finishBtn} onPress={finishAICooking}>
                    <Check size={20} color={colors.white} strokeWidth={3} />
                    <Text style={styles.finishBtnText}>Done!</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.nextBtn} onPress={nextAIStep}>
                    <Text style={styles.nextBtnText}>Next</Text>
                    <ArrowRight size={20} color={colors.primary} strokeWidth={2.5} />
                  </TouchableOpacity>
                )}
              </View>
            </SafeAreaView>
          </View>
        </Modal>
      );
    }

    return (
      <Modal
        visible={showAIRecipeModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeAIRecipeModal}
      >
        <View style={styles.modalContainer}>
          <SafeAreaView style={styles.modalSafeArea} edges={['top']}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeAIRecipeModal} style={styles.modalCloseBtn}>
                <X size={24} color={colors.text} strokeWidth={2.5} />
              </TouchableOpacity>
              <View style={styles.aiModalTitleWrap}>
                <Wand2 size={16} color={colors.secondary} />
                <Text style={styles.modalTitle} numberOfLines={1}>AI Generated</Text>
              </View>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.aiRecipeHeader}>
                <View style={styles.aiBadge}>
                  <Sparkles size={14} color={colors.white} />
                  <Text style={styles.aiBadgeText}>Made for your kitchen</Text>
                </View>
                <Text style={styles.recipeTitle}>{aiRecipe.title}</Text>
                
                <View style={styles.recipeMeta}>
                  {aiRecipe.prepTime > 0 && (
                    <View style={styles.metaItem}>
                      <Clock size={16} color={colors.textSecondary} />
                      <Text style={styles.metaText}>{aiRecipe.prepTime + aiRecipe.cookTime} min</Text>
                    </View>
                  )}
                  {aiRecipe.servings > 0 && (
                    <View style={styles.metaItem}>
                      <Users size={16} color={colors.textSecondary} />
                      <Text style={styles.metaText}>{aiRecipe.servings} servings</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ingredients</Text>
                {aiRecipe.ingredients.map((ing, idx) => (
                  <View key={idx} style={styles.ingredientRow}>
                    <View style={styles.ingredientDot} />
                    <Text style={styles.ingredientText}>
                      {ing.amount} {ing.unit} {ing.name}
                    </Text>
                  </View>
                ))}
              </View>

              {aiRecipe.instructions.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Instructions</Text>
                  {aiRecipe.instructions.map((step, idx) => (
                    <View key={idx} style={styles.instructionRow}>
                      <View style={styles.instructionNumber}>
                        <Text style={styles.instructionNumberText}>{idx + 1}</Text>
                      </View>
                      <Text style={styles.instructionText}>{step}</Text>
                    </View>
                  ))}
                </View>
              )}

              {aiRecipe.tips && (
                <View style={styles.tipsSection}>
                  <Text style={styles.tipsSectionTitle}>💡 Chef&apos;s Tips</Text>
                  <Text style={styles.tipsSectionText}>{aiRecipe.tips}</Text>
                </View>
              )}

              <View style={styles.modalBottomPadding} />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.regenerateBtn}
                onPress={() => {
                  closeAIRecipeModal();
                  generateAIRecipe();
                }}
              >
                <Wand2 size={18} color={colors.secondary} strokeWidth={2.5} />
                <Text style={styles.regenerateBtnText}>New Idea</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.startCookingBtn}
                onPress={startAICooking}
              >
                <Flame size={20} color={colors.white} strokeWidth={2.5} />
                <Text style={styles.startCookingBtnText}>Start Cooking</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    );
  };

  const renderRecipeModal = () => {
    if (!selectedRecipe || !selectedMatch) return null;

    const isReady = selectedMatch.matchPercentage === 100;

    if (cookingMode) {
      const instructions = selectedRecipe.instructions;
      const totalSteps = instructions.length;
      const isLastStep = currentStep === totalSteps - 1;

      return (
        <Modal
          visible={showRecipeModal}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={closeRecipeModal}
        >
          <View style={styles.cookingContainer}>
            <SafeAreaView style={styles.cookingSafeArea} edges={['top', 'bottom']}>
              <View style={styles.cookingHeader}>
                <TouchableOpacity onPress={() => setCookingMode(false)} style={styles.cookingBackBtn}>
                  <X size={24} color={colors.white} strokeWidth={2.5} />
                </TouchableOpacity>
                <View style={styles.cookingTitleWrap}>
                  <Text style={styles.cookingTitle} numberOfLines={1}>{selectedRecipe.title}</Text>
                  <Text style={styles.cookingProgress}>Step {currentStep + 1} of {totalSteps}</Text>
                </View>
                <View style={styles.cookingBackBtn} />
              </View>

              <View style={styles.cookingProgressBar}>
                <View style={[styles.cookingProgressFill, { width: `${((currentStep + 1) / totalSteps) * 100}%` }]} />
              </View>

              <ScrollView 
                style={styles.cookingContent}
                contentContainerStyle={styles.cookingContentInner}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.stepCard}>
                  <View style={styles.stepNumberBadge}>
                    <Text style={styles.stepNumberText}>{currentStep + 1}</Text>
                  </View>
                  <Text style={styles.stepInstruction}>{instructions[currentStep]}</Text>
                </View>
              </ScrollView>

              <View style={styles.cookingNav}>
                <TouchableOpacity 
                  style={[styles.cookingNavBtn, currentStep === 0 && styles.cookingNavBtnDisabled]}
                  onPress={prevStep}
                  disabled={currentStep === 0}
                >
                  <Text style={[styles.cookingNavBtnText, currentStep === 0 && styles.cookingNavBtnTextDisabled]}>Previous</Text>
                </TouchableOpacity>

                {isLastStep ? (
                  <TouchableOpacity style={styles.finishBtn} onPress={finishCooking}>
                    <Check size={20} color={colors.white} strokeWidth={3} />
                    <Text style={styles.finishBtnText}>Done!</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.nextBtn} onPress={nextStep}>
                    <Text style={styles.nextBtnText}>Next</Text>
                    <ArrowRight size={20} color={colors.white} strokeWidth={2.5} />
                  </TouchableOpacity>
                )}
              </View>
            </SafeAreaView>
          </View>
        </Modal>
      );
    }

    return (
      <Modal
        visible={showRecipeModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeRecipeModal}
      >
        <View style={styles.modalContainer}>
          <SafeAreaView style={styles.modalSafeArea} edges={['top']}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeRecipeModal} style={styles.modalCloseBtn}>
                <X size={24} color={colors.text} strokeWidth={2.5} />
              </TouchableOpacity>
              <Text style={styles.modalTitle} numberOfLines={1}>Recipe Details</Text>
              <View style={styles.modalHeaderRight}>
                {selectedRecipe.source && (
                  <TouchableOpacity onPress={openSourceUrl} style={styles.modalSourceBtn}>
                    <ExternalLink size={20} color={colors.primary} strokeWidth={2.5} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.modalDeleteBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    Alert.alert(
                      'Delete Recipe',
                      `Are you sure you want to delete "${selectedRecipe.title}"? This cannot be undone.`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: async () => {
                            await deleteRecipe(selectedRecipe.id);
                            closeRecipeModal();
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          },
                        },
                      ]
                    );
                  }}
                >
                  <Trash2 size={20} color={colors.error} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {selectedRecipe.image && (
                <Image source={{ uri: selectedRecipe.image }} style={styles.recipeImage} resizeMode="cover" />
              )}

              <View style={styles.recipeHeader}>
                <Text style={styles.recipeTitle}>{selectedRecipe.title}</Text>
                
                <View style={styles.recipeMeta}>
                  {selectedRecipe.prepTime > 0 && (
                    <View style={styles.metaItem}>
                      <Clock size={16} color={colors.textSecondary} />
                      <Text style={styles.metaText}>{selectedRecipe.prepTime + selectedRecipe.cookTime} min</Text>
                    </View>
                  )}
                  {selectedRecipe.servings > 0 && (
                    <View style={styles.metaItem}>
                      <Users size={16} color={colors.textSecondary} />
                      <Text style={styles.metaText}>{selectedRecipe.servings} servings</Text>
                    </View>
                  )}
                </View>

                <View style={[styles.matchBadge, isReady ? styles.matchBadgeReady : styles.matchBadgeMissing]}>
                  <Text style={styles.matchBadgeText}>
                    {isReady ? '✅ You have everything!' : `🟡 Missing ${selectedMatch.missingIngredients.length} ingredient${selectedMatch.missingIngredients.length > 1 ? 's' : ''}`}
                  </Text>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ingredients</Text>
                {selectedRecipe.ingredients.map((ing, idx) => {
                  const isMissing = selectedMatch.missingIngredients.some(m => m.name === ing.name);
                  return (
                    <View key={idx} style={[styles.ingredientRow, isMissing && styles.ingredientRowMissing]}>
                      <View style={[styles.ingredientDot, isMissing && styles.ingredientDotMissing]} />
                      <Text style={[styles.ingredientText, isMissing && styles.ingredientTextMissing]}>
                        {ing.amount} {ing.unit} {ing.name}
                      </Text>
                      {isMissing && <Text style={styles.missingLabel}>Missing</Text>}
                    </View>
                  );
                })}
              </View>

              {selectedRecipe.instructions.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Instructions</Text>
                  {selectedRecipe.instructions.map((step, idx) => (
                    <View key={idx} style={styles.instructionRow}>
                      <View style={styles.instructionNumber}>
                        <Text style={styles.instructionNumberText}>{idx + 1}</Text>
                      </View>
                      <Text style={styles.instructionText}>{step}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.modalBottomPadding} />
            </ScrollView>

            <View style={styles.modalActions}>
              {!isReady && (
                <TouchableOpacity style={styles.addGroceryBtn} onPress={handleAddMissingToGrocery}>
                  <ShoppingCart size={18} color={colors.secondary} strokeWidth={2.5} />
                  <Text style={styles.addGroceryBtnText}>Add Missing to List</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[styles.startCookingBtn, !isReady && styles.startCookingBtnAlt]}
                onPress={startCooking}
              >
                <Flame size={20} color={colors.white} strokeWidth={2.5} />
                <Text style={styles.startCookingBtnText}>
                  {isReady ? 'Start Cooking' : 'Cook Anyway'}
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    );
  };

  if (!hasRecipes || !hasPantry) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <Text style={styles.title}>What Can I Make?</Text>
            <View style={styles.headerBadge}>
              <Sparkles size={14} color={colors.comic.yellow} />
            </View>
          </View>

          <ScrollView
            style={styles.emptyContainer}
            contentContainerStyle={styles.emptyContent}
            showsVerticalScrollIndicator={false}
            testID="cook-now-empty-scroll"
          >
            <View style={styles.progressCard}>
              <Text style={styles.progressTitle}>Your setup</Text>
              <Text style={styles.progressSubtitle}>
                {!hasRecipes && !hasPantry 
                  ? '2 steps to get your first match'
                  : '1 step to get your first match'}
              </Text>
              <View style={styles.progressRow}>
                <View style={[styles.progressStep, hasPantry ? styles.progressStepComplete : styles.progressStepActive]}>
                  <View style={[styles.progressStepNumberWrap, hasPantry && styles.progressStepNumberWrapComplete]}>
                    {hasPantry ? (
                      <Check size={14} color={colors.white} strokeWidth={3} />
                    ) : (
                      <Text style={styles.progressStepNumber}>1</Text>
                    )}
                  </View>
                  <View>
                    <Text style={styles.progressStepText}>Add kitchen</Text>
                    {hasPantry && (
                      <Text style={styles.progressStepCount}>{pantryItems.length} items</Text>
                    )}
                  </View>
                </View>
                <View style={styles.progressStepLine} />
                <View style={[styles.progressStep, hasRecipes ? styles.progressStepComplete : (!hasPantry ? styles.progressStepInactive : styles.progressStepActive)]}>
                  <View style={[styles.progressStepNumberWrap, hasRecipes && styles.progressStepNumberWrapComplete]}>
                    {hasRecipes ? (
                      <Check size={14} color={colors.white} strokeWidth={3} />
                    ) : (
                      <Text style={styles.progressStepNumber}>2</Text>
                    )}
                  </View>
                  <View>
                    <Text style={styles.progressStepText}>Add recipes</Text>
                    {hasRecipes && (
                      <Text style={styles.progressStepCount}>{recipes.length} added</Text>
                    )}
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.emptyCard}>
              <View style={styles.emptyDecor}>
                <View style={[styles.decorCircle, styles.decorCircle1]} />
                <View style={[styles.decorCircle, styles.decorCircle2]} />
                <View style={[styles.decorCircle, styles.decorCircle3]} />
              </View>
              <Image
                source={{ uri: 'https://r2-pub.rork.com/attachments/7kh2kny7y4aoan2iczpas' }}
                style={styles.emptyTotie}
                resizeMode="contain"
              />
              <Text style={styles.emptyTitle}>Time to find your matches!</Text>
              <Text style={styles.emptySubtext}>
                {!hasPantry 
                  ? 'Stock your kitchen first, then add recipes to discover what you can cook'
                  : 'Add recipes to see which ones you can make with what\'s in your kitchen'}
              </Text>
              <View style={styles.emptyActions}>
                {!hasPantry ? (
                  <TouchableOpacity 
                    style={styles.emptyBtn}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push('/kitchen');
                    }}
                    activeOpacity={0.8}
                  >
                    <Plus size={18} color={colors.white} strokeWidth={2.5} />
                    <Text style={styles.emptyBtnText}>Add Kitchen</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={styles.emptyBtn}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push('/recipes?openAdd=link');
                    }}
                    activeOpacity={0.8}
                  >
                    <Plus size={18} color={colors.white} strokeWidth={2.5} />
                    <Text style={styles.emptyBtnText}>Add Recipes</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.tipsCard}>
              <Text style={styles.tipsTitle}>Pro tip</Text>
              <Text style={styles.tipsText}>
                {!hasRecipes 
                  ? 'Start by adding 3-5 of your favorite recipes. We\'ll match them with your ingredients!'
                  : 'Add 8-12 staples (oil, onions, eggs, rice) to get matches immediately.'}
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>

        <PageCoachMarks
          visible={showPageTutorial}
          onComplete={() => {
            setShowPageTutorial(false);
            completePageTutorial('cook-now');
          }}
          steps={COOK_NOW_STEPS}
          pageTitle="COOK NOW"
        />
      </View>
    );
  }

  const noMatches = readyNow.length === 0 && almostThere.length === 0 && worthATrip.length === 0;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>What Can I Make?</Text>
          <View style={styles.headerBadge}>
            <Sparkles size={14} color={colors.comic.yellow} />
          </View>
        </View>

        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'cook' && styles.tabPillActive]}
            onPress={() => { setActiveTab('cook'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            activeOpacity={0.8}
          >
            <UtensilsCrossed size={14} color={activeTab === 'cook' ? colors.white : colors.text} strokeWidth={2.5} />
            <Text style={[styles.tabPillText, activeTab === 'cook' && styles.tabPillTextActive]}>Ready to Cook</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'completed' && styles.tabPillActive]}
            onPress={() => { setActiveTab('completed'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            activeOpacity={0.8}
          >
            <Trophy size={14} color={activeTab === 'completed' ? colors.white : colors.text} strokeWidth={2.5} />
            <Text style={[styles.tabPillText, activeTab === 'completed' && styles.tabPillTextActive]}>Completed</Text>
            {cookedMeals.length > 0 && (
              <View style={[styles.tabBadgeCount, activeTab === 'completed' && styles.tabBadgeCountActive]}>
                <Text style={[styles.tabBadgeCountText, activeTab === 'completed' && styles.tabBadgeCountTextActive]}>{cookedMeals.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {activeTab === 'completed' ? (
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {cookedMeals.length === 0 ? (
              <View style={styles.completedEmptyCard}>
                <View style={styles.completedEmptyIconWrap}>
                  <Trophy size={40} color={colors.primary} strokeWidth={1.5} />
                </View>
                <Text style={styles.completedEmptyTitle}>No meals cooked yet</Text>
                <Text style={styles.completedEmptySubtext}>
                  Complete a cooking session and it{"'"}{"ll"} show up here. Track your home-cooking wins!
                </Text>
                <TouchableOpacity
                  style={styles.completedEmptyBtn}
                  onPress={() => { setActiveTab('cook'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  activeOpacity={0.8}
                >
                  <ChefHat size={18} color={colors.white} strokeWidth={2.5} />
                  <Text style={styles.completedEmptyBtnText}>Start Cooking</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.completedSummary}>
                  <View style={styles.completedSummaryRow}>
                    <View style={styles.completedStat}>
                      <Text style={styles.completedStatNumber}>{cookedMeals.length}</Text>
                      <Text style={styles.completedStatLabel}>Meals</Text>
                    </View>
                    <View style={styles.completedStatDivider} />
                    <View style={styles.completedStat}>
                      <Text style={styles.completedStatNumber}>
                        ${cookedMeals.reduce((sum, m) => sum + m.estimatedSavings, 0)}
                      </Text>
                      <Text style={styles.completedStatLabel}>Saved</Text>
                    </View>
                  </View>
                </View>

                {cookedMeals.map((meal) => {
                  const date = new Date(meal.cookedAt);
                  const timeAgo = getTimeAgo(date);
                  return (
                    <View key={meal.id} style={styles.completedCard}>
                      {meal.recipeImage ? (
                        <Image source={{ uri: meal.recipeImage }} style={styles.completedCardImage} resizeMode="cover" />
                      ) : (
                        <View style={[styles.completedCardImage, styles.completedCardImagePlaceholder]}>
                          <ChefHat size={22} color={colors.textSecondary} />
                        </View>
                      )}
                      <View style={styles.completedCardInfo}>
                        <Text style={styles.completedCardTitle} numberOfLines={2}>{meal.recipeTitle}</Text>
                        <View style={styles.completedCardMeta}>
                          <Text style={styles.completedCardTime}>{timeAgo}</Text>
                          {meal.isAIGenerated && (
                            <View style={styles.completedAIBadge}>
                              <Sparkles size={10} color={colors.secondary} />
                              <Text style={styles.completedAIBadgeText}>AI</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <View style={styles.completedCardSavings}>
                        <Text style={styles.completedCardSavingsText}>${meal.estimatedSavings}</Text>
                        <Text style={styles.completedCardSavingsLabel}>saved</Text>
                      </View>
                    </View>
                  );
                })}

                <TouchableOpacity
                  style={styles.cookAnotherBtn}
                  onPress={() => { setActiveTab('cook'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  activeOpacity={0.8}
                >
                  <ChefHat size={18} color={colors.white} strokeWidth={2.5} />
                  <Text style={styles.cookAnotherBtnText}>Cook Another Meal</Text>
                </TouchableOpacity>
              </>
            )}
            <View style={styles.bottomPadding} />
          </ScrollView>
        ) : (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {noMatches ? (
            <View style={styles.noMatchesCard}>
              <Image
                source={{ uri: 'https://r2-pub.rork.com/attachments/7kh2kny7y4aoan2iczpas' }}
                style={styles.noMatchesTotie}
                resizeMode="contain"
              />
              <Text style={styles.noMatchesTitle}>No strong matches yet</Text>
              <Text style={styles.noMatchesText}>
                Your recipes need different ingredients than what you have. Try adding more kitchen items or new recipes!
              </Text>

              {needsWork.length > 0 && (
                <View style={styles.recipeBreakdownCard}>
                  <Text style={styles.recipeBreakdownTitle}>📋 Your recipes at a glance</Text>
                  <Text style={styles.recipeBreakdownSubtitle}>Here{"'"}s what each recipe is missing</Text>
                  {needsWork.slice(0, 5).map((match) => (
                    <TouchableOpacity
                      key={match.recipe.id}
                      style={styles.recipeBreakdownRow}
                      onPress={() => openRecipeDetail(match)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.recipeBreakdownHeader}>
                        <Text style={styles.recipeBreakdownName} numberOfLines={1}>{match.recipe.title}</Text>
                        <View style={styles.recipeBreakdownPercent}>
                          <Text style={styles.recipeBreakdownPercentText}>{Math.round(match.matchPercentage)}%</Text>
                        </View>
                      </View>
                      <View style={styles.recipeBreakdownBar}>
                        <View style={[styles.recipeBreakdownBarFill, { width: `${Math.max(match.matchPercentage, 2)}%` }]} />
                      </View>
                      {match.matchingIngredients.length > 0 && (
                        <Text style={styles.recipeBreakdownHave}>✅ Have: {match.matchingIngredients.slice(0, 3).join(', ')}{match.matchingIngredients.length > 3 ? ` +${match.matchingIngredients.length - 3}` : ''}</Text>
                      )}
                      <Text style={styles.recipeBreakdownNeed}>🛒 Missing ({match.missingIngredients.length}): {match.missingIngredients.slice(0, 4).map(i => i.name).join(', ')}{match.missingIngredients.length > 4 ? ` +${match.missingIngredients.length - 4} more` : ''}</Text>
                      <Pressable
                        style={styles.recipeBreakdownAddBtn}
                        onPress={() => {
                          handleAddToGrocery(match.recipe.id, match.recipe.title);
                        }}
                        hitSlop={8}
                      >
                        <ShoppingCart size={14} color={colors.secondary} strokeWidth={2.5} />
                        <Text style={styles.recipeBreakdownAddText}>Add missing to list</Text>
                      </Pressable>
                    </TouchableOpacity>
                  ))}
                </View>
              )}


              <View style={styles.bonusSection}>
                <Text style={styles.bonusLabel}>✨ BONUS</Text>
                <TouchableOpacity 
                  style={styles.aiSuggestBtn}
                  onPress={generateAIRecipe}
                  disabled={isGeneratingAI}
                  activeOpacity={0.8}
                >
                  {isGeneratingAI ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Wand2 size={20} color={colors.white} strokeWidth={2.5} />
                  )}
                  <Text style={styles.aiSuggestBtnText}>
                    {isGeneratingAI ? 'Creating...' : 'AI Suggest a Meal'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.aiSuggestHint}>💡 Uses only what&apos;s in your fridge & pantry</Text>
              </View>

              <View style={styles.noMatchesDivider}>
                <View style={styles.noMatchesDividerLine} />
                <Text style={styles.noMatchesDividerText}>or</Text>
                <View style={styles.noMatchesDividerLine} />
              </View>

              <View style={styles.noMatchesActions}>
                <TouchableOpacity 
                  style={[styles.noMatchesBtn, styles.noMatchesBtnAlt]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/recipes?openAdd=link');
                  }}
                >
                  <Text style={styles.noMatchesBtnTextAlt}>Add Recipes</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              {readyNow.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={[styles.sectionBadge, styles.sectionBadgeReady]}>
                      <Text style={styles.sectionBadgeText}>READY NOW</Text>
                    </View>
                    <Text style={styles.sectionCount}>{readyNow.length}</Text>
                    <View style={styles.sectionLine} />
                  </View>
                  {readyNow.map((match, index) => (
                    <TouchableOpacity 
                      key={match.recipe.id} 
                      style={[styles.recipeCard, styles.recipeCardReady, index % 2 === 0 && styles.cardTilt]}
                      onPress={() => openRecipeDetail(match)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.cardContent}>
                        <View style={styles.cardIcon}>
                          <Text style={styles.cardEmoji}>✅</Text>
                        </View>
                        <View style={styles.cardInfo}>
                          <Text style={styles.cardTitle} numberOfLines={1}>{match.recipe.title}</Text>
                          <Text style={styles.cardReady}>You have everything!</Text>
                        </View>
                      </View>
                      <Animated.View style={{ transform: [{ scale: cookPulseAnim }] }}>
                        <TouchableOpacity 
                          style={styles.cookBtn}
                          onPress={() => {
                            openRecipeDetail(match);
                          }}
                          activeOpacity={0.8}
                        >
                          <ChefHat size={18} color={colors.white} strokeWidth={2.5} />
                          <Text style={styles.cookBtnText}>Cook</Text>
                        </TouchableOpacity>
                      </Animated.View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {almostThere.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={[styles.sectionBadge, styles.sectionBadgeAlmost]}>
                      <Text style={styles.sectionBadgeText}>ALMOST THERE</Text>
                    </View>
                    <Text style={styles.sectionCount}>{almostThere.length}</Text>
                    <View style={styles.sectionLine} />
                  </View>
                  {almostThere.map((match, index) => (
                    <TouchableOpacity 
                      key={match.recipe.id} 
                      style={[styles.recipeCardExpanded, index % 2 === 1 && styles.cardTilt]}
                      onPress={() => openRecipeDetail(match)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.cardContent}>
                        <View style={styles.cardIcon}>
                          <Text style={styles.cardEmoji}>🟡</Text>
                        </View>
                        <View style={styles.cardInfo}>
                          <Text style={styles.cardTitle} numberOfLines={1}>{match.recipe.title}</Text>
                          <View style={styles.cardMatchBar}>
                            <View style={[styles.cardMatchBarFill, { width: `${match.matchPercentage}%` }]} />
                          </View>
                        </View>
                      </View>
                      <View style={styles.missingItemsList}>
                        <Text style={styles.missingItemsLabel}>Missing items:</Text>
                        {match.missingIngredients.map((ing, idx) => (
                          <View key={idx} style={styles.missingItemRow}>
                            <View style={styles.missingItemDot} />
                            <Text style={styles.missingItemName}>{ing.name}{ing.amount ? ` (${ing.amount}${ing.unit ? ' ' + ing.unit : ''})` : ''}</Text>
                          </View>
                        ))}
                      </View>
                      {addedToGrocery.has(match.recipe.id) ? (
                        <View>
                          <View style={styles.addedToGroceryBadge}>
                            <Check size={16} color={colors.success} strokeWidth={2.5} />
                            <Text style={styles.addedToGroceryBadgeText}>Added to Grocery List</Text>
                          </View>
                          <TouchableOpacity
                            style={styles.nextStepBanner}
                            onPress={(e) => {
                              e.stopPropagation();
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              router.push({ pathname: '/(tabs)/kitchen', params: { tab: 'grocery' } });
                            }}
                            activeOpacity={0.7}
                          >
                            <View style={styles.nextStepLeft}>
                              <View style={styles.nextStepIconWrap}>
                                <ArrowRight size={14} color={colors.white} strokeWidth={3} />
                              </View>
                              <View style={styles.nextStepTextWrap}>
                                <Text style={styles.nextStepTitle}>Next: Go shop & check off items</Text>
                                <Text style={styles.nextStepSubtext}>Head to Grocery List to check off items as you buy them</Text>
                              </View>
                            </View>
                            <ArrowRight size={16} color={colors.secondary} strokeWidth={2.5} />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity 
                          style={styles.addToGroceryCardBtn}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleAddToGrocery(match.recipe.id, match.recipe.title);
                          }}
                          activeOpacity={0.8}
                        >
                          <ShoppingCart size={16} color={colors.white} strokeWidth={2.5} />
                          <Text style={styles.addToGroceryCardBtnText}>Add Missing to Grocery List</Text>
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {worthATrip.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={[styles.sectionBadge, styles.sectionBadgeTrip]}>
                      <Text style={styles.sectionBadgeText}>WORTH A TRIP</Text>
                    </View>
                    <Text style={styles.sectionCount}>{worthATrip.length}</Text>
                    <View style={styles.sectionLine} />
                  </View>
                  {worthATrip.map((match, index) => (
                    <TouchableOpacity 
                      key={match.recipe.id} 
                      style={[styles.recipeCardExpanded, index % 2 === 0 && styles.cardTilt]}
                      onPress={() => openRecipeDetail(match)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.cardContent}>
                        <View style={styles.cardIcon}>
                          <Text style={styles.cardEmoji}>🛒</Text>
                        </View>
                        <View style={styles.cardInfo}>
                          <Text style={styles.cardTitle} numberOfLines={1}>{match.recipe.title}</Text>
                          <View style={styles.cardMatchBar}>
                            <View style={[styles.cardMatchBarFill, styles.cardMatchBarFillWeak, { width: `${match.matchPercentage}%` }]} />
                          </View>
                        </View>
                      </View>
                      <View style={styles.missingItemsList}>
                        <Text style={styles.missingItemsLabel}>Missing items:</Text>
                        {match.missingIngredients.slice(0, 5).map((ing, idx) => (
                          <View key={idx} style={styles.missingItemRow}>
                            <View style={styles.missingItemDot} />
                            <Text style={styles.missingItemName}>{ing.name}{ing.amount ? ` (${ing.amount}${ing.unit ? ' ' + ing.unit : ''})` : ''}</Text>
                          </View>
                        ))}
                        {match.missingIngredients.length > 5 && (
                          <Text style={styles.missingItemMore}>+{match.missingIngredients.length - 5} more</Text>
                        )}
                      </View>
                      {addedToGrocery.has(match.recipe.id) ? (
                        <View>
                          <View style={styles.addedToGroceryBadge}>
                            <Check size={16} color={colors.success} strokeWidth={2.5} />
                            <Text style={styles.addedToGroceryBadgeText}>Added to Grocery List</Text>
                          </View>
                          <TouchableOpacity
                            style={styles.nextStepBanner}
                            onPress={(e) => {
                              e.stopPropagation();
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              router.push({ pathname: '/(tabs)/kitchen', params: { tab: 'grocery' } });
                            }}
                            activeOpacity={0.7}
                          >
                            <View style={styles.nextStepLeft}>
                              <View style={styles.nextStepIconWrap}>
                                <ArrowRight size={14} color={colors.white} strokeWidth={3} />
                              </View>
                              <View style={styles.nextStepTextWrap}>
                                <Text style={styles.nextStepTitle}>Next: Go shop & check off items</Text>
                                <Text style={styles.nextStepSubtext}>Head to Grocery List to check off items as you buy them</Text>
                              </View>
                            </View>
                            <ArrowRight size={16} color={colors.secondary} strokeWidth={2.5} />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity 
                          style={styles.addToGroceryCardBtnAlt}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleAddToGrocery(match.recipe.id, match.recipe.title);
                          }}
                          activeOpacity={0.8}
                        >
                          <ShoppingCart size={16} color={colors.secondary} strokeWidth={2.5} />
                          <Text style={styles.addToGroceryCardBtnAltText}>Add Missing to Grocery List</Text>
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}

          {!noMatches && (almostThere.length > 0 || worthATrip.length > 0) && (
            <View style={styles.flowHintCard}>
              <Text style={styles.flowHintEmoji}>💡</Text>
              <Text style={styles.flowHintText}>
                Tap a recipe to see details. Use the{' '}
                <Text style={styles.flowHintBold}>Add Missing to Grocery List</Text>
                {' '}button, then head to Kitchen → Grocery to shop.
              </Text>
            </View>
          )}

          {!noMatches && suggestedIngredients.length > 0 && readyNow.length === 0 && (
            <View style={styles.boostCard}>
              <Text style={styles.boostTitle}>💡 Boost your matches</Text>
              <Text style={styles.boostSubtitle}>Adding these would unlock more recipes:</Text>
              <View style={styles.boostChips}>
                {suggestedIngredients.slice(0, 5).map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.boostChip}
                    onPress={() => handleAddSuggestedToGrocery([item.name])}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.boostChipText}>{item.name}</Text>
                    <Text style={styles.boostChipCount}>{item.count}×</Text>
                    <ShoppingCart size={12} color={colors.secondary} strokeWidth={2.5} />
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={styles.boostAddAllBtn}
                onPress={() => handleAddSuggestedToGrocery(suggestedIngredients.slice(0, 5).map(i => i.name))}
                activeOpacity={0.8}
              >
                <ShoppingCart size={14} color={colors.secondary} strokeWidth={2.5} />
                <Text style={styles.boostAddAllBtnText}>Add All to Grocery List</Text>
              </TouchableOpacity>
            </View>
          )}

          {!noMatches && (
            <View style={styles.nextActionsCard}>
              <Text style={styles.nextActionsTitle}>Want something different?</Text>
              <View style={styles.nextActionsRow}>
                <TouchableOpacity
                  style={styles.nextActionBtn}
                  onPress={generateAIRecipe}
                  disabled={isGeneratingAI}
                  activeOpacity={0.8}
                >
                  {isGeneratingAI ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Wand2 size={18} color={colors.white} strokeWidth={2.5} />
                  )}
                  <Text style={styles.nextActionBtnText}>
                    {isGeneratingAI ? 'Creating...' : 'AI Suggest'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.aiSuggestHintAlt}>💡 Suggests meals based on your kitchen inventory</Text>
              <View style={styles.nextActionsRow}>
                <TouchableOpacity
                  style={styles.nextActionBtnAlt}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/recipes?openAdd=link');
                  }}
                  activeOpacity={0.8}
                >
                  <Plus size={18} color={colors.secondary} strokeWidth={2.5} />
                  <Text style={styles.nextActionBtnAltText}>Add Recipes</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.nextActionRefresh}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/kitchen');
                }}
                activeOpacity={0.7}
              >
                <RefreshCw size={14} color={colors.textSecondary} strokeWidth={2.5} />
                <Text style={styles.nextActionRefreshText}>Update kitchen to find new matches</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>
        )}

        {renderRecipeModal()}
        {renderAIRecipeModal()}

        <Modal
          visible={showAddRecipe}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAddRecipe(false)}
        >
          <Pressable
            style={styles.addRecipeOverlay}
            onPress={() => setShowAddRecipe(false)}
          >
            <Pressable style={styles.addRecipeModal} onPress={e => e.stopPropagation()}>
              <View style={styles.addRecipeModalHeader}>
                <Text style={styles.addRecipeModalTitle}>Add a Recipe</Text>
                <TouchableOpacity onPress={() => setShowAddRecipe(false)}>
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.addRecipeTypeSelector}>
                <TouchableOpacity
                  style={[styles.addRecipeTypeTab, addRecipeType === 'note' && styles.addRecipeTypeTabActive]}
                  onPress={() => setAddRecipeType('note')}
                >
                  <Edit3 size={16} color={addRecipeType === 'note' ? colors.white : colors.text} />
                  <Text style={[styles.addRecipeTypeTabText, addRecipeType === 'note' && styles.addRecipeTypeTabTextActive]}>Note</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.addRecipeTypeTab, addRecipeType === 'link' && styles.addRecipeTypeTabActive]}
                  onPress={() => setAddRecipeType('link')}
                >
                  <LinkIcon size={16} color={addRecipeType === 'link' ? colors.white : colors.text} />
                  <Text style={[styles.addRecipeTypeTabText, addRecipeType === 'link' && styles.addRecipeTypeTabTextActive]}>Link</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.addRecipeInputGroup}>
                <Text style={styles.addRecipeInputLabel}>
                  {addRecipeType === 'link' ? 'Paste URL' : 'What do you want to cook?'}
                </Text>
                <TextInput
                  style={[styles.addRecipeTextInput, addRecipeType === 'note' && styles.addRecipeTextInputMultiline]}
                  placeholder={addRecipeType === 'link' ? 'https://...' : 'e.g., That pasta from the Italian place...'}
                  placeholderTextColor={colors.textSecondary}
                  value={addRecipeContent}
                  onChangeText={setAddRecipeContent}
                  multiline={addRecipeType === 'note'}
                  numberOfLines={addRecipeType === 'note' ? 3 : 1}
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.addRecipeSubmitBtn,
                  !addRecipeContent.trim() && styles.addRecipeSubmitBtnDisabled,
                ]}
                onPress={handleAddRecipeSubmit}
                disabled={!addRecipeContent.trim()}
              >
                <Sparkles size={20} color={colors.white} strokeWidth={2.5} />
                <Text style={styles.addRecipeSubmitBtnText}>Generate Recipe</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>

      <PageCoachMarks
        visible={showPageTutorial}
        onComplete={() => {
          setShowPageTutorial(false);
          completePageTutorial('cook-now');
        }}
        steps={COOK_NOW_STEPS}
        pageTitle="COOK NOW"
      />

      <PremiumPaywall
        visible={showPremiumPaywall}
        onClose={() => {
          setShowPremiumPaywall(false);
          if (!isPremium) {
            router.back();
          }
        }}
        featureName="Cook Now"
      />
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: colors.text,
    letterSpacing: -0.5,
  },
  headerBadge: {
    marginLeft: 8,
    padding: 4,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 14,
  },
  tabPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.borderLight,
  },
  tabPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.black,
  },
  tabPillText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: colors.text,
  },
  tabPillTextActive: {
    color: colors.white,
  },
  tabBadgeCount: {
    backgroundColor: colors.borderLight,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeCountActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tabBadgeCountText: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: colors.textSecondary,
  },
  tabBadgeCountTextActive: {
    color: colors.white,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.black,
  },
  sectionBadgeReady: {
    backgroundColor: colors.mint,
  },
  sectionBadgeAlmost: {
    backgroundColor: colors.comic.yellow,
  },
  sectionBadgeTrip: {
    backgroundColor: colors.comic.blue,
  },
  sectionBadgeText: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: colors.black,
    letterSpacing: 0.5,
  },
  sectionCount: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.textSecondary,
  },
  sectionLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.borderLight,
    marginLeft: 12,
  },
  recipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  recipeCardReady: {
    backgroundColor: colors.mintLight,
  },
  cardTilt: {
    transform: [{ rotate: '-0.5deg' }],
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardEmoji: {
    fontSize: 20,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 2,
  },
  cardReady: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.success,
  },
  cardMissing: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  cardMatchBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
    overflow: 'hidden' as const,
  },
  cardMatchBarFill: {
    height: '100%' as const,
    borderRadius: 2,
    backgroundColor: colors.comic.yellow,
  },
  cardMatchBarFillWeak: {
    backgroundColor: colors.comic.blue,
  },
  cookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  cookBtnText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.white,
  },
  addListBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.secondaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addListBtnAlt: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.cardAlt,
    borderWidth: 2,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeCardExpanded: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  missingItemsList: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  missingItemsLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: colors.error,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  missingItemRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 3,
  },
  missingItemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.error,
    marginRight: 8,
  },
  missingItemName: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.text,
    textTransform: 'capitalize' as const,
  },
  missingItemMore: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginTop: 4,
    marginLeft: 14,
  },
  addToGroceryCardBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: colors.secondary,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  addToGroceryCardBtnText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: colors.white,
  },
  addToGroceryCardBtnAlt: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: colors.secondaryLight,
    borderWidth: 2,
    borderColor: colors.secondary,
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  addToGroceryCardBtnAltText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: colors.secondary,
  },
  flowHintCard: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 8,
    backgroundColor: colors.secondaryLight,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.secondary + '40',
    padding: 14,
    marginBottom: 16,
  },
  flowHintEmoji: {
    fontSize: 16,
    marginTop: 1,
  },
  flowHintText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.text,
    lineHeight: 19,
  },
  flowHintBold: {
    fontWeight: '700' as const,
    color: colors.secondary,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 120,
  },
  progressCard: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: colors.text,
  },
  progressSubtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  progressRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressStep: {
    flex: 1,
    backgroundColor: colors.cardAlt,
    borderWidth: 2,
    borderColor: colors.borderLight,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressStepActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  progressStepComplete: {
    backgroundColor: colors.mintLight,
    borderColor: colors.mint,
  },
  progressStepInactive: {
    opacity: 0.6,
  },
  progressStepNumberWrap: {
    width: 26,
    height: 26,
    borderRadius: 10,
    backgroundColor: colors.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressStepNumberWrapComplete: {
    backgroundColor: colors.success,
  },
  progressStepNumber: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: colors.white,
  },
  progressStepText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: colors.text,
  },
  progressStepCount: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.success,
    marginTop: 1,
  },
  progressStepLine: {
    width: 16,
    height: 2,
    backgroundColor: colors.borderLight,
    marginHorizontal: 10,
  },
  tipsCard: {
    marginTop: 14,
    backgroundColor: colors.secondaryLight,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.borderLight,
    padding: 16,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: colors.secondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  tipsText: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    lineHeight: 20,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  emptyDecor: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 100,
    height: 100,
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 50,
    borderWidth: 2,
    borderColor: colors.borderLight,
  },
  decorCircle1: {
    width: 60,
    height: 60,
    top: 10,
    right: 10,
  },
  decorCircle2: {
    width: 40,
    height: 40,
    top: 40,
    right: 50,
  },
  decorCircle3: {
    width: 20,
    height: 20,
    top: 60,
    right: 20,
  },
  emptyTotie: {
    width: 110,
    height: 110,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyActions: {
    flexDirection: 'row',
    gap: 10,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  emptyBtnText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.white,
  },
  bottomPadding: {
    height: 20,
  },
  noMatchesCard: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginTop: 20,
  },
  noMatchesTotie: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  noMatchesTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: colors.text,
    marginBottom: 8,
  },
  noMatchesText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  suggestCard: {
    width: '100%',
    backgroundColor: colors.cardAlt,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  suggestCardTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 4,
  },
  suggestCardSubtitle: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  suggestRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  suggestDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 10,
  },
  suggestDotText: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: colors.white,
  },
  suggestInfo: {
    flex: 1,
  },
  suggestName: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.text,
    textTransform: 'capitalize' as const,
  },
  suggestMeta: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    marginTop: 2,
  },
  suggestAddBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondaryLight,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginLeft: 8,
  },
  suggestBtnRow: {
    flexDirection: 'row' as const,
    gap: 8,
    marginTop: 14,
  },
  suggestGroceryBtn: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    backgroundColor: colors.secondaryLight,
    borderWidth: 1.5,
    borderColor: colors.secondary,
    borderRadius: 12,
    paddingVertical: 12,
  },
  suggestGroceryBtnText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: colors.secondary,
  },
  suggestUpdateKitchenBtn: {
    flex: 1,
    backgroundColor: colors.secondary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  suggestUpdateKitchenText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.white,
  },
  boostCard: {
    backgroundColor: colors.secondaryLight,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.borderLight,
    padding: 16,
    marginBottom: 16,
  },
  boostTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.text,
  },
  boostSubtitle: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 12,
  },
  boostChips: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  boostChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  boostChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.text,
    textTransform: 'capitalize' as const,
  },
  boostChipCount: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: colors.secondary,
  },
  boostAddAllBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    marginTop: 14,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.secondary,
    borderRadius: 12,
    paddingVertical: 10,
  },
  boostAddAllBtnText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: colors.secondary,
  },
  noMatchesActions: {
    flexDirection: 'row',
    gap: 10,
  },
  noMatchesBtn: {
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  noMatchesBtnAlt: {
    backgroundColor: colors.white,
  },
  noMatchesBtnText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.white,
  },
  noMatchesBtnTextAlt: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.text,
  },
  aiSuggestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.secondary,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    marginBottom: 16,
  },
  aiSuggestBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.white,
  },
  aiSuggestHint: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    marginTop: -8,
    marginBottom: 8,
    width: '100%',
  },
  aiSuggestHintAlt: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    marginTop: 4,
    marginBottom: 12,
  },
  noMatchesDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  noMatchesDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderLight,
  },
  noMatchesDividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  recipeBreakdownCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.borderLight,
    padding: 16,
    marginBottom: 20,
  },
  recipeBreakdownTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 4,
  },
  recipeBreakdownSubtitle: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    marginBottom: 14,
  },
  recipeBreakdownRow: {
    backgroundColor: colors.cardAlt,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  recipeBreakdownHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 8,
  },
  recipeBreakdownName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.text,
    marginRight: 8,
  },
  recipeBreakdownPercent: {
    backgroundColor: colors.comic.blue + '30',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  recipeBreakdownPercentText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: colors.text,
  },
  recipeBreakdownBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
    overflow: 'hidden' as const,
    marginBottom: 8,
  },
  recipeBreakdownBarFill: {
    height: '100%' as const,
    borderRadius: 2,
    backgroundColor: colors.comic.blue,
  },
  recipeBreakdownHave: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.success,
    marginBottom: 4,
  },
  recipeBreakdownNeed: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.error,
    marginBottom: 8,
  },
  recipeBreakdownAddBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    alignSelf: 'flex-start' as const,
    gap: 6,
    backgroundColor: colors.secondaryLight,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  recipeBreakdownAddText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.secondary,
  },
  aiModalTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiRecipeHeader: {
    padding: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 2,
    borderBottomColor: colors.borderLight,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.secondary,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  aiBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: colors.white,
  },
  tipsSection: {
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: colors.secondaryLight,
    borderRadius: 16,
    padding: 16,
  },
  tipsSectionTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 8,
  },
  tipsSectionText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  regenerateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.secondaryLight,
    borderWidth: 2,
    borderColor: colors.secondary,
    borderRadius: 14,
    paddingVertical: 14,
  },
  regenerateBtnText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.secondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalSafeArea: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.cardAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  modalSourceBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalDeleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: {
    flex: 1,
  },
  recipeImage: {
    width: '100%',
    height: 200,
    backgroundColor: colors.cardAlt,
  },
  recipeHeader: {
    padding: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 2,
    borderBottomColor: colors.borderLight,
  },
  recipeTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  recipeMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  matchBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  matchBadgeReady: {
    backgroundColor: colors.mintLight,
  },
  matchBadgeMissing: {
    backgroundColor: colors.comic.yellow + '30',
  },
  matchBadgeText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.text,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: colors.text,
    marginBottom: 14,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  ingredientRowMissing: {
    backgroundColor: colors.primaryLight + '40',
    marginHorizontal: -20,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 4,
    borderBottomWidth: 0,
  },
  ingredientDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: 12,
  },
  ingredientDotMissing: {
    backgroundColor: colors.error,
  },
  ingredientText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500' as const,
    color: colors.text,
  },
  ingredientTextMissing: {
    color: colors.text,
  },
  missingLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: colors.error,
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  instructionRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  instructionNumberText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: colors.white,
  },
  instructionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500' as const,
    color: colors.text,
    lineHeight: 22,
  },
  modalBottomPadding: {
    height: 120,
  },
  modalActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: colors.white,
    borderTopWidth: 2,
    borderTopColor: colors.borderLight,
  },
  addGroceryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.secondaryLight,
    borderWidth: 2,
    borderColor: colors.secondary,
    borderRadius: 14,
    paddingVertical: 14,
  },
  addGroceryBtnText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.secondary,
  },
  startCookingBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 14,
    paddingVertical: 14,
  },
  startCookingBtnAlt: {
    flex: 0.8,
  },
  startCookingBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.white,
  },
  cookingContainer: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  cookingSafeArea: {
    flex: 1,
  },
  cookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cookingBackBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cookingTitleWrap: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  cookingTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.white,
  },
  cookingProgress: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  cookingProgressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 16,
    borderRadius: 2,
    overflow: 'hidden',
  },
  cookingProgressFill: {
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: 2,
  },
  cookingContent: {
    flex: 1,
    marginTop: 24,
  },
  cookingContentInner: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  stepCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    minHeight: 200,
  },
  stepNumberBadge: {
    alignSelf: 'flex-start',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: colors.white,
  },
  stepInstruction: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.text,
    lineHeight: 30,
  },
  cookingNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  cookingNavBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cookingNavBtnDisabled: {
    opacity: 0.4,
  },
  cookingNavBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.white,
  },
  cookingNavBtnTextDisabled: {
    opacity: 0.5,
  },
  nextBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingVertical: 14,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.primary,
  },
  finishBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.success,
    borderRadius: 14,
    paddingVertical: 14,
  },
  finishBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.white,
  },
  bonusSection: {
    marginTop: 8,
    padding: 16,
    backgroundColor: colors.cardAlt,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.borderLight,
    borderStyle: 'dashed',
  },
  bonusLabel: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 12,
    textAlign: 'center',
  },
  nextActionsCard: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 20,
    padding: 18,
    marginTop: 8,
  },
  nextActionsTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 14,
  },
  nextActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  nextActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.secondary,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 14,
    paddingVertical: 14,
  },
  nextActionBtnText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.white,
  },
  nextActionBtnAlt: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.secondaryLight,
    borderWidth: 2,
    borderColor: colors.secondary,
    borderRadius: 14,
    paddingVertical: 14,
  },
  nextActionBtnAltText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.secondary,
  },
  nextActionRefresh: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  nextActionRefreshText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  addRecipeBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  addRecipeBtnText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.primary,
  },
  addRecipeOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 24,
  },
  addRecipeModal: {
    width: '100%' as const,
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    borderWidth: 2,
    borderColor: colors.black,
  },
  addRecipeModalHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 20,
  },
  addRecipeModalTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: colors.text,
  },
  addRecipeTypeSelector: {
    flexDirection: 'row' as const,
    backgroundColor: colors.cardAlt,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  addRecipeTypeTab: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addRecipeTypeTabActive: {
    backgroundColor: colors.secondary,
  },
  addRecipeTypeTabText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.text,
  },
  addRecipeTypeTabTextActive: {
    color: colors.white,
  },
  addRecipeInputGroup: {
    marginBottom: 20,
  },
  addRecipeInputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 8,
  },
  addRecipeTextInput: {
    backgroundColor: colors.cardAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '500' as const,
    color: colors.text,
  },
  addRecipeTextInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top' as const,
  },
  addRecipeSubmitBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: '#F59E0B',
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 14,
    paddingVertical: 16,
  },
  addRecipeSubmitBtnDisabled: {
    opacity: 0.5,
  },
  addRecipeSubmitBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.white,
  },
  completedEmptyCard: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginTop: 20,
  },
  completedEmptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  completedEmptyTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: colors.text,
    marginBottom: 8,
  },
  completedEmptySubtext: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  completedEmptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  completedEmptyBtnText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.white,
  },
  completedSummary: {
    backgroundColor: colors.mintLight,
    borderWidth: 2,
    borderColor: colors.mint,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    marginTop: 4,
  },
  completedSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedStat: {
    flex: 1,
    alignItems: 'center',
  },
  completedStatNumber: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: colors.text,
  },
  completedStatLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginTop: 2,
  },
  completedStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.mint,
    marginHorizontal: 16,
  },
  completedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.borderLight,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  completedCardImage: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.cardAlt,
  },
  completedCardImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedCardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  completedCardTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 4,
  },
  completedCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completedCardTime: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  completedAIBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.secondaryLight,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  completedAIBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: colors.secondary,
  },
  completedCardSavings: {
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: colors.mintLight,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  completedCardSavingsText: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: colors.success,
  },
  completedCardSavingsLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: colors.success,
  },
  cookAnotherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 8,
  },
  cookAnotherBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.white,
  },
  addedToGroceryBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: colors.mintLight,
    borderWidth: 2,
    borderColor: colors.mint,
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  addedToGroceryBadgeText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: colors.success,
  },
  nextStepBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: colors.secondaryLight,
    borderWidth: 1.5,
    borderColor: colors.secondary + '50',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  nextStepLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
    gap: 10,
  },
  nextStepIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.secondary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  nextStepTextWrap: {
    flex: 1,
  },
  nextStepTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: colors.secondary,
  },
  nextStepSubtext: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
