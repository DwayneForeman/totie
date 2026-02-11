import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, TextInput, Pressable, ActivityIndicator, Platform, Alert, Animated, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, SlidersHorizontal, Plus, Link as LinkIcon, Camera, Edit3, Clock, Users, Sparkles, BookOpen, X, ChevronRight, ScanBarcode, Keyboard, Heart, Brain, Trash2, ExternalLink, Lightbulb, Check, ChefHat, ListChecks, Flame, ArrowRight, ShoppingCart, Zap, Droplets } from 'lucide-react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { generateObject } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';
import { useApp } from '@/context/AppContext';
import colors from '@/constants/colors';
import PageCoachMarks, { PageCoachStep } from '@/components/PageCoachMarks';
import * as Haptics from 'expo-haptics';
import { FoodDumpItem, Recipe, Ingredient, NutritionInfo } from '@/types';
import { RecipePriceSummary, StorePricePills } from '@/components/StorePricePills';
import { useLocalSearchParams, useRouter } from 'expo-router';
import PremiumPaywall from '@/components/PremiumPaywall';

interface OpenLibraryBook {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  isbn?: string[];
  first_publish_year?: number;
}

interface BookSearchResult {
  id: string;
  title: string;
  author: string;
  coverImage?: string;
  isbn?: string;
  year?: number;
}

type AddCookbookTab = 'search' | 'scan' | 'manual';

const filterChips = ['All', 'Links', 'Cookbooks', 'Snapped'];

const spineColors = ['#E65100', '#1565C0', '#2E7D32', '#6A1B9A', '#C62828', '#00838F'];
const coverColors = ['#FF8A65', '#64B5F6', '#81C784', '#BA68C8', '#EF5350', '#4DD0E1'];

const getSpineColor = (index: number) => spineColors[index % spineColors.length];
const getCoverColor = (index: number) => coverColors[index % coverColors.length];

export default function RecipesTab() {
  const { recipes, cookbooks, addCookbook, deleteCookbook, getCookbookById, addRecipeFromCookbook, foodDumpItems, deleteFoodDumpItem, markFoodDumpProcessed, addRecipe, createGroceryList, deleteRecipe, isPremium, canSaveRecipeFromLink, incrementFreeRecipeSaves } = useApp();
  const params = useLocalSearchParams<{ openAdd?: string }>();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('All');
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showAddCookbook, setShowAddCookbook] = useState(false);
  const [newCookbookTitle, setNewCookbookTitle] = useState('');
  const [newCookbookAuthor, setNewCookbookAuthor] = useState('');
  const [selectedCookbook, setSelectedCookbook] = useState<string | null>(null);
  const [addCookbookTab, setAddCookbookTab] = useState<AddCookbookTab>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BookSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedBook, setSelectedBook] = useState<BookSearchResult | null>(null);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [isbnInput, setIsbnInput] = useState('');
  const [isLookingUpIsbn, setIsLookingUpIsbn] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [showSearch, setShowSearch] = useState(false);
  const [recipeSearchQuery, setRecipeSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterMaxTime, setFilterMaxTime] = useState<number | null>(null);
  const [filterSource, setFilterSource] = useState<string | null>(null);
  const [showAddIdea, setShowAddIdea] = useState(false);
  const [newIdeaContent, setNewIdeaContent] = useState('');
  const [newIdeaType, setNewIdeaType] = useState<'link' | 'note'>('note');
  const [showProcessing, setShowProcessing] = useState(false);
  const [processingItem, setProcessingItem] = useState<FoodDumpItem | null>(null);
  const [processingStep, setProcessingStep] = useState<'analyzing' | 'generating' | 'creating-list' | 'done' | 'error'>('analyzing');
  const [generatedRecipe, setGeneratedRecipe] = useState<Recipe | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showRecipeDetail, setShowRecipeDetail] = useState(false);
  const [cookingMode, setCookingMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { isPageTutorialComplete, completePageTutorial } = useApp();
  const [showPageTutorial, setShowPageTutorial] = useState(false);
  const [snappedImageUri, setSnappedImageUri] = useState<string | null>(null);
  const [generatingCookbookId, setGeneratingCookbookId] = useState<string | null>(null);
  const [cookbookGenProgress, setCookbookGenProgress] = useState<string>('');
  const [cookbookGenCount, setCookbookGenCount] = useState<number>(0);
  const [cookbookPreviewRecipes, setCookbookPreviewRecipes] = useState<{ title: string; description: string; pageNumber?: number }[]>([]);
  const [selectedPreviewIndices, setSelectedPreviewIndices] = useState<Set<number>>(new Set());
  const [showRecipeSelection, setShowRecipeSelection] = useState(false);
  const [isFetchingPreviews, setIsFetchingPreviews] = useState(false);
  const [previewCookbookId, setPreviewCookbookId] = useState<string | null>(null);
  const [previewCookbookTitle, setPreviewCookbookTitle] = useState<string>('');
  const [previewCookbookAuthor, setPreviewCookbookAuthor] = useState<string>('');
  const [showPremiumPaywall, setShowPremiumPaywall] = useState(false);
  const [paywallFeatureName, setPaywallFeatureName] = useState<string | undefined>(undefined);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);



  const getIngredientEmoji = (name: string): string => {
    const n = name.toLowerCase();
    const map: Record<string, string> = {
      chicken: '🍗', 'chicken breast': '🍗', 'chicken thigh': '🍗', 'chicken wing': '🍗',
      beef: '🥩', steak: '🥩', 'ground beef': '🥩', brisket: '🥩',
      pork: '🥩', bacon: '🥓', ham: '🍖', sausage: '🌭', lamb: '🍖',
      fish: '🐟', salmon: '🐟', tuna: '🐟', cod: '🐟', tilapia: '🐟', trout: '🐟',
      shrimp: '🦐', prawn: '🦐', lobster: '🦞', crab: '🦀', scallop: '🐚', clam: '🐚', mussel: '🐚', oyster: '🦪',
      egg: '🥚', eggs: '🥚',
      butter: '🧈', cheese: '🧀', parmesan: '🧀', mozzarella: '🧀', cheddar: '🧀', 'cream cheese': '🧀',
      milk: '🥛', cream: '🥛', 'whipped cream': '🥛', 'sour cream': '🥛',
      yogurt: '🥛', 'greek yogurt': '🥛',
      rice: '🍚', 'brown rice': '🍚', 'jasmine rice': '🍚', 'basmati rice': '🍚',
      pasta: '🍝', spaghetti: '🍝', penne: '🍝', linguine: '🍝', fettuccine: '🍝', macaroni: '🍝',
      noodle: '🍜', ramen: '🍜', udon: '🍜', soba: '🍜',
      bread: '🍞', tortilla: '🫓', pita: '🫓', naan: '🫓', baguette: '🥖', croissant: '🥐',
      flour: '🌾', wheat: '🌾', oat: '🌾', oats: '🌾', cornmeal: '🌽',
      tomato: '🍅', 'cherry tomato': '🍅', 'sun-dried tomato': '🍅', 'tomato paste': '🍅', 'tomato sauce': '🍅',
      onion: '🧅', 'red onion': '🧅', 'green onion': '🧅', shallot: '🧅', scallion: '🧅',
      garlic: '🧄',
      potato: '🥔', 'sweet potato': '🍠', yam: '🍠',
      carrot: '🥕',
      pepper: '🌶️', 'bell pepper': '🫑', jalapeño: '🌶️', 'chili pepper': '🌶️', cayenne: '🌶️', habanero: '🌶️',
      'black pepper': '⚫', peppercorn: '⚫',
      lemon: '🍋', 'lemon juice': '🍋', 'lemon zest': '🍋',
      lime: '🍈', 'lime juice': '🍈', 'lime zest': '🍈',
      orange: '🍊', 'orange juice': '🍊', 'orange zest': '🍊',
      apple: '🍎', 'green apple': '🍏',
      banana: '🍌', pineapple: '🍍', mango: '🥭', peach: '🍑', pear: '🍐',
      grape: '🍇', strawberry: '🍓', blueberry: '🫐', raspberry: '🫐', blackberry: '🫐', cherry: '🍒',
      watermelon: '🍉', melon: '🍈', kiwi: '🥝', coconut: '🥥', fig: '🍇', date: '🌴', plum: '🫐',
      avocado: '🥑', corn: '🌽',
      broccoli: '🥦', cauliflower: '🥦',
      lettuce: '🥬', spinach: '🥬', kale: '🥬', arugula: '🥬', 'bok choy': '🥬', cabbage: '🥬', 'swiss chard': '🥬',
      mushroom: '🍄', shiitake: '🍄', portobello: '🍄', 'cremini': '🍄',
      cucumber: '🥒', zucchini: '🥒', pickle: '🥒',
      eggplant: '🍆', aubergine: '🍆',
      olive: '🫒', 'olive oil': '🫒',
      celery: '🥬', asparagus: '🥦', artichoke: '🥬', 'green bean': '🫛', pea: '🫛', edamame: '🫛', 'snap pea': '🫛',
      bean: '🫘', 'black bean': '🫘', 'kidney bean': '🫘', chickpea: '🫘', lentil: '🫘',
      tofu: '🧊', tempeh: '🧊',
      salt: '🧂', 'sea salt': '🧂',
      honey: '🍯', 'maple syrup': '🍁',
      chocolate: '🍫', cocoa: '🍫',
      sugar: '🍬', 'brown sugar': '🍬', 'powdered sugar': '🍬',
      oil: '🫗', 'vegetable oil': '🫗', 'canola oil': '🫗', 'sesame oil': '🫗', 'coconut oil': '🥥',
      vinegar: '🫗', 'balsamic': '🫗', 'apple cider vinegar': '🫗',
      wine: '🍷', 'red wine': '🍷', 'white wine': '🍷', beer: '🍺', sake: '🍶',
      soy: '🫘', 'soy sauce': '🥫', 'fish sauce': '🥫', 'worcestershire': '🥫', 'hot sauce': '🌶️',
      nut: '🥜', almond: '🥜', walnut: '🥜', pecan: '🥜', cashew: '🥜', pistachio: '🥜', peanut: '🥜', 'peanut butter': '🥜',
      ginger: '🫚', turmeric: '🫚',
      cinnamon: '🪵', 'cinnamon stick': '🪵',
      basil: '🌿', cilantro: '🌿', parsley: '🌿', mint: '🌿', rosemary: '🌿', thyme: '🌿', oregano: '🌿', dill: '🌿', sage: '🌿', 'bay leaf': '🍃', chive: '🌿',
      cumin: '🟤', paprika: '🟤', 'chili powder': '🟤', curry: '🟤', 'garam masala': '🟤', cardamom: '🟤', clove: '🟤', nutmeg: '🟤', 'star anise': '⭐', saffron: '🟡', fennel: '🌿',
      water: '💧', broth: '🥣', stock: '🥣', 'chicken broth': '🥣', 'beef broth': '🥣', 'vegetable broth': '🥣',
      tea: '🍵', 'black tea': '🍵', 'green tea': '🍵', coffee: '☕', matcha: '🍵',
      ice: '🧊',
      ketchup: '🥫', mustard: '🟡', mayo: '🫙', mayonnaise: '🫙', relish: '🥒',
      seaweed: '🟢', nori: '🟢', wakame: '🟢',
      panko: '🍞', 'bread crumb': '🍞',
    };
    for (const [key, emoji] of Object.entries(map)) {
      if (n.includes(key)) return emoji;
    }
    return '🥄';
  };

  const getNutrition = (recipe: Recipe): NutritionInfo => {
    if (recipe.nutrition) return recipe.nutrition;
    const ingNames = recipe.ingredients.map(i => i.name.toLowerCase()).join(' ');
    const hasSweet = /sugar|honey|chocolate|syrup|fruit|banana/.test(ingNames);
    const hasSalty = /salt|soy|bacon|cheese|parmesan/.test(ingNames);
    const hasProtein = /chicken|beef|pork|fish|salmon|shrimp|tofu|egg/.test(ingNames);
    const hasCarb = /rice|pasta|bread|flour|potato|noodle/.test(ingNames);
    let cal = 180 + recipe.ingredients.length * 25 + (hasProtein ? 120 : 0) + (hasCarb ? 80 : 0);
    return {
      calories: Math.min(Math.round(cal / 10) * 10, 850),
      saltLevel: hasSalty ? 'high' : (recipe.ingredients.length > 6 ? 'medium' : 'low'),
      sugarLevel: hasSweet ? 'high' : (hasCarb ? 'medium' : 'low'),
    };
  };

  const openRecipeDetail = (recipe: Recipe) => {
    console.log('[Recipes] Opening detail:', recipe.title);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedRecipe(recipe);
    setShowRecipeDetail(true);
    setCookingMode(false);
    setCurrentStep(0);
  };

  const closeRecipeDetail = () => {
    setShowRecipeDetail(false);
    setSelectedRecipe(null);
    setCookingMode(false);
    setCurrentStep(0);
  };

  const startCooking = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCookingMode(true);
    setCurrentStep(0);
  };

  const cookbookRecipes = recipes.filter(r => r.cookbookId);

  const RECIPES_STEPS: PageCoachStep[] = [
    {
      id: 'recipes-welcome',
      title: 'Your Recipe Hub 📖',
      emoji: '📚',
      message: 'This is where all your recipes live! Save from links, cookbooks, or let AI create them from delivery cravings.',
    },
    {
      id: 'recipes-filters',
      title: 'Filter & Organize',
      emoji: '🏷️',
      message: 'Use the tabs at the top to filter by Saved, Cookbooks, or DIY Cravings.',
    },
    {
      id: 'recipes-add',
      title: 'Adding Recipes',
      emoji: '➕',
      message: 'Tap the + button to add recipes — paste a link, scan a cookbook, or jot down a quick idea.',
    },
    {
      id: 'recipes-detail',
      title: 'Tap to Cook!',
      emoji: '👨‍🍳',
      message: 'Tap any recipe to see ingredients, nutrition info, and step-by-step cooking mode. You can also add missing ingredients to your grocery list!',
    },
  ];

  useEffect(() => {
    if (!isPageTutorialComplete('recipes')) {
      const timer = setTimeout(() => setShowPageTutorial(true), 800);
      return () => clearTimeout(timer);
    }
  }, [isPageTutorialComplete]);

  useEffect(() => {
    if (params.openAdd === 'link') {
      setNewIdeaType('link');
      setShowAddIdea(true);
      router.setParams({ openAdd: undefined });
    } else if (params.openAdd === 'note') {
      setNewIdeaType('note');
      setShowAddIdea(true);
      router.setParams({ openAdd: undefined });
    } else if (params.openAdd === 'craving') {
      router.setParams({ openAdd: undefined });
    }
  }, [params.openAdd, router]);

  const searchBooks = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&fields=key,title,author_name,cover_i,isbn,first_publish_year&limit=10`
      );
      const data = await response.json();
      
      const results: BookSearchResult[] = (data.docs || []).map((book: OpenLibraryBook) => ({
        id: book.key,
        title: book.title,
        author: book.author_name?.[0] || 'Unknown Author',
        coverImage: book.cover_i 
          ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
          : undefined,
        isbn: book.isbn?.[0],
        year: book.first_publish_year,
      }));
      
      setSearchResults(results);
    } catch (error) {
      console.log('Error searching books:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const lookupIsbn = useCallback(async (isbn: string) => {
    const cleanIsbn = isbn.replace(/[^0-9X]/gi, '');
    if (!cleanIsbn || (cleanIsbn.length !== 10 && cleanIsbn.length !== 13)) {
      Alert.alert('Invalid ISBN', 'Please enter a valid 10 or 13 digit ISBN');
      return;
    }
    
    setIsLookingUpIsbn(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const response = await fetch(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`
      );
      const data = await response.json();
      const bookData = data[`ISBN:${cleanIsbn}`];
      
      if (bookData) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const book: BookSearchResult = {
          id: cleanIsbn,
          title: bookData.title || 'Unknown Title',
          author: bookData.authors?.[0]?.name || 'Unknown Author',
          coverImage: bookData.cover?.medium || bookData.cover?.small,
          isbn: cleanIsbn,
          year: bookData.publish_date ? parseInt(bookData.publish_date) : undefined,
        };
        setSelectedBook(book);
        setNewCookbookTitle(book.title);
        setNewCookbookAuthor(book.author);
        setIsScannerActive(false);
        setAddCookbookTab('manual');
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Book Not Found', 'Could not find a book with that ISBN. Try searching by title instead.');
      }
    } catch (error) {
      console.log('Error looking up ISBN:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to look up ISBN. Please try again.');
    } finally {
      setIsLookingUpIsbn(false);
      setIsbnInput('');
    }
  }, []);

  const handleBarcodeScan = useCallback((result: BarcodeScanningResult) => {
    if (isLookingUpIsbn) return;
    
    const { data, type } = result;
    if (type === 'ean13' || type === 'ean8' || type === 'upc_a' || type === 'upc_e') {
      console.log('Scanned barcode:', data, type);
      lookupIsbn(data);
    }
  }, [isLookingUpIsbn, lookupIsbn]);

  const selectSearchResult = (book: BookSearchResult) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedBook(book);
    setNewCookbookTitle(book.title);
    setNewCookbookAuthor(book.author);
    setAddCookbookTab('manual');
  };

  const cookbookPreviewSchema = z.object({
    recipes: z.array(z.object({
      title: z.string().describe('The exact recipe name as it appears in the cookbook'),
      description: z.string().describe('A 1-sentence description of the dish'),
      pageNumber: z.number().optional().describe('Approximate page number if known'),
    })).describe('List of ALL known recipes from this cookbook, aim for 15-25'),
  });

  const cookbookRecipesSchemaRef = z.object({
    recipes: z.array(z.object({
      title: z.string().describe('The exact recipe name as it appears in the cookbook'),
      description: z.string().describe('A brief description of the dish'),
      ingredients: z.array(z.object({
        name: z.string().describe('Ingredient name'),
        amount: z.string().optional().describe('Amount like "2" or "1/2"'),
        unit: z.string().optional().describe('Unit like "cups", "tbsp", "pieces"'),
      })).describe('List of ingredients'),
      instructions: z.array(z.string()).describe('Step-by-step cooking instructions'),
      prepTime: z.number().describe('Prep time in minutes'),
      cookTime: z.number().describe('Cook time in minutes'),
      servings: z.number().describe('Number of servings'),
      pageNumber: z.number().optional().describe('Approximate page number in the book if known'),
    })).describe('Full recipe details for selected recipes'),
  });

  const fetchCookbookRecipeList = useCallback(async (cookbookId: string, title: string, author: string) => {
    console.log('[Recipes] Fetching recipe list for cookbook:', title, 'by', author);
    setIsFetchingPreviews(true);
    setPreviewCookbookId(cookbookId);
    setPreviewCookbookTitle(title);
    setPreviewCookbookAuthor(author);
    setCookbookPreviewRecipes([]);
    setSelectedPreviewIndices(new Set());
    setSelectedCookbook(cookbookId);

    try {
      const prompt = `You are a cookbook expert. The user owns the cookbook "${title}"${author ? ` by ${author}` : ''}.

List ALL the recipes you know from this specific cookbook. Include as many as possible (aim for 15-25 recipes). These should be the ACTUAL recipe names from this book.

IMPORTANT:
- Use the ACTUAL recipe names from this cookbook, not generic versions.
- Include a brief 1-sentence description for each.
- If you know approximate page numbers, include them.
- If you're not sure about this specific cookbook, list recipes that would realistically be in a cookbook with this title and author.
- Prioritize the most popular/iconic recipes first.`;

      const result = await generateObject({
        messages: [{ role: 'user' as const, content: prompt }],
        schema: cookbookPreviewSchema,
      });

      console.log('[Recipes] Fetched', result.recipes.length, 'recipe previews');
      setCookbookPreviewRecipes(result.recipes);
      const allIndices = new Set<number>(result.recipes.map((_, i) => i));
      setSelectedPreviewIndices(allIndices);
      setShowRecipeSelection(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error('[Recipes] Error fetching recipe list:', error);
      Alert.alert('Error', 'Failed to fetch recipe list. Please try again.');
    } finally {
      setIsFetchingPreviews(false);
    }
  }, [cookbookPreviewSchema]);

  const generateSelectedRecipes = useCallback(async () => {
    if (!previewCookbookId) return;
    const selectedTitles = cookbookPreviewRecipes
      .filter((_, i) => selectedPreviewIndices.has(i))
      .map(r => r.title);

    if (selectedTitles.length === 0) {
      Alert.alert('No Recipes Selected', 'Please select at least one recipe to add.');
      return;
    }

    console.log('[Recipes] Generating', selectedTitles.length, 'selected recipes for cookbook:', previewCookbookTitle);
    setShowRecipeSelection(false);
    setGeneratingCookbookId(previewCookbookId);
    setCookbookGenProgress('Generating selected recipes...');
    setCookbookGenCount(0);

    try {
      const prompt = `You are a cookbook expert. The user owns the cookbook "${previewCookbookTitle}"${previewCookbookAuthor ? ` by ${previewCookbookAuthor}` : ''}.

Generate FULL detailed recipes for these specific recipes from the cookbook:
${selectedTitles.map((t, i) => `${i + 1}. ${t}`).join('\n')}

IMPORTANT:
- Use the ACTUAL recipe names exactly as provided above.
- Include realistic ingredients with proper amounts.
- Provide detailed step-by-step instructions.
- If you know approximate page numbers, include them.
- Make each recipe authentic to the cookbook's style and the author's approach.`;

      const result = await generateObject({
        messages: [{ role: 'user' as const, content: prompt }],
        schema: cookbookRecipesSchemaRef,
      });

      console.log('[Recipes] Generated', result.recipes.length, 'full recipes');

      for (let i = 0; i < result.recipes.length; i++) {
        const r = result.recipes[i];
        setCookbookGenProgress(`Adding: ${r.title}`);
        setCookbookGenCount(i + 1);

        await addRecipeFromCookbook(
          {
            title: r.title,
            image: '',
            ingredients: r.ingredients as Ingredient[],
            instructions: r.instructions,
            prepTime: r.prepTime,
            cookTime: r.cookTime,
            servings: r.servings,
            source: `${previewCookbookTitle}${previewCookbookAuthor ? ` - ${previewCookbookAuthor}` : ''}`,
            pageNumber: r.pageNumber,
          },
          previewCookbookId
        );

        await new Promise(resolve => setTimeout(resolve, 200));
      }

      setCookbookGenProgress('Done!');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('[Recipes] Error generating cookbook recipes:', error);
      setCookbookGenProgress('Failed to generate recipes. Tap to retry.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setTimeout(() => {
        setGeneratingCookbookId(null);
        setCookbookGenProgress('');
        setCookbookGenCount(0);
      }, 1500);
    }
  }, [previewCookbookId, previewCookbookTitle, previewCookbookAuthor, cookbookPreviewRecipes, selectedPreviewIndices, addRecipeFromCookbook, cookbookRecipesSchemaRef]);

  const togglePreviewRecipe = useCallback((index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPreviewIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const toggleAllPreviews = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedPreviewIndices.size === cookbookPreviewRecipes.length) {
      setSelectedPreviewIndices(new Set());
    } else {
      setSelectedPreviewIndices(new Set(cookbookPreviewRecipes.map((_, i) => i)));
    }
  }, [selectedPreviewIndices.size, cookbookPreviewRecipes]);

  const handleAddCookbook = async () => {
    if (!newCookbookTitle.trim()) return;
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const title = newCookbookTitle.trim();
    const author = newCookbookAuthor.trim();
    const coverImage = selectedBook?.coverImage;
    const newCb = await addCookbook({ title, author, coverImage });
    resetAddCookbookModal();

    if (newCb) {
      fetchCookbookRecipeList(newCb.id, title, author);
    }
  };

  const resetAddCookbookModal = () => {
    setNewCookbookTitle('');
    setNewCookbookAuthor('');
    setShowAddCookbook(false);
    setAddCookbookTab('search');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedBook(null);
    setIsScannerActive(false);
    setIsbnInput('');
  };

  const handleDeleteCookbook = async (cookbookId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await deleteCookbook(cookbookId);
    setSelectedCookbook(null);
  };

  const openAddCookbookModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowAddCookbook(true);
  };

  const recipeSchema = z.object({
    title: z.string().describe('A catchy, descriptive recipe title'),
    description: z.string().describe('A brief 1-2 sentence description of the dish'),
    ingredients: z.array(z.object({
      name: z.string().describe('Ingredient name'),
      amount: z.string().optional().describe('Amount like "2" or "1/2"'),
      unit: z.string().optional().describe('Unit like "cups", "tbsp", "pieces"'),
    })).describe('List of ingredients needed'),
    instructions: z.array(z.string()).describe('Step-by-step cooking instructions'),
    prepTime: z.number().describe('Prep time in minutes'),
    cookTime: z.number().describe('Cook time in minutes'),
    servings: z.number().describe('Number of servings'),
    difficulty: z.enum(['easy', 'medium', 'hard']).describe('Difficulty level'),
  });

  const processSnapImage = useCallback(async (imageUri: string, base64Data: string | null) => {
    console.log('[Recipes] Processing snapped image, has base64:', !!base64Data);
    setProcessingItem({
      id: Date.now().toString(),
      type: 'image' as const,
      content: 'Snapped recipe image',
      thumbnail: imageUri,
      source: 'Snapped Recipe',
      createdAt: new Date().toISOString(),
      isProcessed: false,
    });
    setShowProcessing(true);
    setProcessingStep('analyzing');
    setProcessingError(null);
    setGeneratedRecipe(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setProcessingStep('generating');

      type MessageContent = { type: "text"; text: string } | { type: "image"; image: string };
      const messageContent: MessageContent[] = [
        { type: 'text' as const, text: 'Look at this image carefully. It could be a photo of food, a screenshot of a recipe, a menu, or anything food-related. Based on what you see in the image, create a detailed, practical recipe. If it\'s a photo of a dish, recreate that dish as a recipe. If it\'s a screenshot of a recipe, extract and organize the recipe. If it\'s a menu item, create a homemade version. If the image is not food-related, create a popular comfort food recipe instead. Make the recipe practical, delicious, and beginner-friendly.' },
      ];

      if (base64Data) {
        const mimePrefix = base64Data.startsWith('data:') ? '' : 'data:image/jpeg;base64,';
        messageContent.push({ type: 'image' as const, image: `${mimePrefix}${base64Data}` });
      }

      const result = await generateObject({
        messages: [{
          role: 'user' as const,
          content: messageContent,
        }],
        schema: recipeSchema,
      });

      const recipeData = {
        title: result.title,
        image: imageUri || '',
        ingredients: result.ingredients as Ingredient[],
        instructions: result.instructions,
        prepTime: result.prepTime,
        cookTime: result.cookTime,
        servings: result.servings,
        source: 'Snapped Recipe',
        isDIYCraving: true,
      };

      setProcessingStep('creating-list');
      await new Promise(resolve => setTimeout(resolve, 600));

      const savedRecipe = await addRecipe(recipeData);
      setGeneratedRecipe(savedRecipe);
      await createGroceryList(`${result.title} Shopping`, [savedRecipe.id], [savedRecipe]);

      setProcessingStep('done');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('[Recipes] Snap image processing error:', error);
      setProcessingStep('error');
      setProcessingError('Failed to analyze the image. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [addRecipe, createGroceryList, recipeSchema]);

  const pickImage = useCallback(async (source: 'camera' | 'library') => {
    try {
      let result;
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          quality: 0.7,
          allowsEditing: false,
          base64: true,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Photo library permission is needed to select images.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          quality: 0.7,
          allowsEditing: false,
          base64: true,
        });
      }
      if (!result.canceled && result.assets[0]) {
        console.log('[Recipes] Image picked, processing directly with AI');
        const asset = result.assets[0];
        processSnapImage(asset.uri, asset.base64 ?? null);
      }
    } catch (error) {
      console.log('[Recipes] Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  }, [processSnapImage]);

  const handleSnapCraving = useCallback(() => {
    if (!isPremium) {
      setPaywallFeatureName('Screenshot → DIY recipe');
      setShowPremiumPaywall(true);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === 'web') {
      pickImage('library');
    } else {
      Alert.alert(
        'Snap a Craving',
        'Take a photo or upload a screenshot of any recipe',
        [
          { text: 'Take Photo', onPress: () => pickImage('camera') },
          { text: 'Choose from Library', onPress: () => pickImage('library') },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  }, [pickImage]);

  const closeAddIdea = useCallback(() => {
    setShowAddIdea(false);
    setSnappedImageUri(null);
    setNewIdeaContent('');
  }, []);

  useEffect(() => {
    if (params.openAdd === 'craving') {
      handleSnapCraving();
    }
  }, [params.openAdd, handleSnapCraving]);

  const handleTabChange = (tab: AddCookbookTab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAddCookbookTab(tab);
    if (tab === 'scan') {
      setIsScannerActive(true);
    } else {
      setIsScannerActive(false);
    }
  };

  const extractMetaTags = (html: string): string => {
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

    const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi);
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
  };

  const fetchOEmbedData = async (url: string): Promise<string> => {
    const oEmbedEndpoints: { pattern: RegExp; endpoint: string }[] = [
      { pattern: /tiktok\.com/i, endpoint: `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}` },
      { pattern: /youtube\.com|youtu\.be/i, endpoint: `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json` },
    ];

    for (const { pattern, endpoint } of oEmbedEndpoints) {
      if (pattern.test(url)) {
        try {
          console.log('[Recipes] Trying oEmbed endpoint:', endpoint);
          const response = await fetch(endpoint);
          if (response.ok) {
            const data = await response.json();
            console.log('[Recipes] oEmbed data received:', JSON.stringify(data).slice(0, 500));
            const parts: string[] = [];
            if (data.title) parts.push(`Video Title: ${data.title}`);
            if (data.author_name) parts.push(`Author: ${data.author_name}`);
            if (data.author_url) parts.push(`Author URL: ${data.author_url}`);
            if (data.description) parts.push(`Description: ${data.description}`);
            if (data.provider_name) parts.push(`Platform: ${data.provider_name}`);
            if (data.thumbnail_url) parts.push(`Thumbnail: ${data.thumbnail_url}`);
            return parts.join('\n');
          }
        } catch (error) {
          console.warn('[Recipes] oEmbed fetch failed:', error);
        }
      }
    }
    return '';
  };

  const fetchHtmlContent = async (url: string): Promise<string> => {
    try {
      console.log('[Recipes] Fetching HTML content:', url);
      const response = await fetch(url, {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        },
      });
      if (!response.ok) {
        console.warn('[Recipes] HTML fetch failed with status:', response.status);
        return '';
      }
      const html = await response.text();
      const metaContent = extractMetaTags(html);
      console.log('[Recipes] Extracted meta tags:', metaContent.slice(0, 500));

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
      console.log('[Recipes] Total extracted content length:', combined.length);
      return combined;
    } catch (error) {
      console.warn('[Recipes] Could not fetch HTML content:', error);
      return '';
    }
  };

  const fetchUrlContent = async (url: string): Promise<{ oEmbed: string; html: string }> => {
    const isSocialMedia = /tiktok\.com|instagram\.com|youtube\.com|youtu\.be|facebook\.com|twitter\.com|x\.com|threads\.net/i.test(url);

    const [oEmbedData, htmlData] = await Promise.all([
      isSocialMedia ? fetchOEmbedData(url) : Promise.resolve(''),
      fetchHtmlContent(url),
    ]);

    console.log('[Recipes] oEmbed length:', oEmbedData.length, '| HTML length:', htmlData.length);
    return { oEmbed: oEmbedData, html: htmlData };
  };

  const processIdea = async (item: FoodDumpItem) => {
    setProcessingItem(item);
    setShowProcessing(true);
    setProcessingStep('analyzing');
    setProcessingError(null);
    setGeneratedRecipe(null);
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setProcessingStep('generating');
      
      let prompt: string;
      if (item.type === 'link') {
        const { oEmbed, html } = await fetchUrlContent(item.content);
        const isSocialMedia = /tiktok\.com|instagram\.com|youtube\.com|youtu\.be|facebook\.com|twitter\.com|x\.com|threads\.net/i.test(item.content);
        const hasOEmbed = oEmbed.length > 20;
        const hasHtml = html.length > 100;

        if (hasOEmbed) {
          prompt = `The user shared this recipe video/post link: ${item.content}\n\n=== VIDEO/POST METADATA (from oEmbed - THIS IS THE PRIMARY SOURCE OF TRUTH) ===\n${oEmbed}\n\n${hasHtml ? `=== Additional page content ===\n${html.slice(0, 3000)}\n\n` : ''}CRITICAL INSTRUCTIONS:\n- The video/post metadata above tells you EXACTLY what recipe this is about.\n- Read the video title and description VERY carefully — they describe the dish being made.\n- Create a recipe that EXACTLY matches what is described in the title/description.\n- For example, if the title says "iHop Style Loaded Omelette", create an iHop Style Loaded Omelette recipe.\n- Do NOT create a different or generic recipe. Match the EXACT dish from the metadata.\n- Include all likely ingredients based on the dish described.\n- Make the recipe practical, detailed, and delicious.`;
        } else if (hasHtml) {
          prompt = `Extract the recipe from this URL: ${item.content}\n\n=== Extracted page content ===\n${html}\n\nCRITICAL INSTRUCTIONS:\n- Use the page title, description, and any structured data to identify the EXACT recipe shown.\n- The recipe title, ingredients, and instructions MUST match what is described on the page.\n- Do NOT invent a different recipe. Match exactly what the page describes.\n- Pay close attention to og:title, og:description, and any JSON-LD structured data.`;
        } else if (isSocialMedia) {
          prompt = `The user pasted this social media recipe link: ${item.content}\n\nThe page content could not be fully extracted. Analyze the URL carefully for any clues about the recipe (path segments, hashtags, usernames, keywords).\n\nBased on the URL, identify the most likely recipe and create an accurate version. If the URL contains words like "omelette", "pasta", "chicken" etc., the recipe MUST be that dish. Do NOT default to a generic popular recipe. If you truly cannot determine the recipe, create a popular version of whatever dish keywords appear in the URL.`;
        } else {
          prompt = `I pasted this recipe URL but the content could not be fetched: ${item.content}. Based on the URL path and domain, try your best to determine what recipe this is and create an accurate version of it. Use the URL clues (path, keywords) to identify the specific dish. Do NOT make up a random popular recipe — stick to what the URL suggests.`;
        }
      } else if (item.type === 'image') {
        prompt = `Create a detailed recipe based on this description of a photographed/snapped recipe: "${item.content}". The user took a photo of this recipe. Make it practical and delicious with full ingredients and step-by-step instructions.`;
      } else {
        prompt = `Create a detailed recipe based on this idea: "${item.content}". Make it practical and delicious.`;
      }
      
      const result = await generateObject({
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        schema: recipeSchema,
      });
      
      const recipeData = {
        title: result.title,
        image: item.thumbnail || '',
        ingredients: result.ingredients as Ingredient[],
        instructions: result.instructions,
        prepTime: result.prepTime,
        cookTime: result.cookTime,
        servings: result.servings,
        source: item.type === 'link' ? item.content : (item.type === 'image' ? 'Snapped Recipe' : 'Food Dump'),
        isDIYCraving: item.type === 'image' ? true : undefined,
      };
      
      setProcessingStep('creating-list');
      
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const savedRecipe = await addRecipe(recipeData);
      setGeneratedRecipe(savedRecipe);
      await createGroceryList(`${result.title} Shopping`, [savedRecipe.id], [savedRecipe]);
      await markFoodDumpProcessed(item.id, savedRecipe.id);
      
      setProcessingStep('done');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
    } catch (error) {
      console.error('Error processing idea:', error);
      setProcessingStep('error');
      setProcessingError('Failed to generate recipe. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const closeProcessingModal = () => {
    setShowProcessing(false);
    setProcessingItem(null);
    setGeneratedRecipe(null);
    setProcessingStep('analyzing');
    setProcessingError(null);
  };

  const getFilteredRecipes = () => {
    let result: Recipe[];
    switch (activeFilter) {
      case 'Cookbooks':
        result = selectedCookbook ? recipes.filter(r => r.cookbookId === selectedCookbook) : cookbookRecipes;
        break;
      case 'All':
        result = recipes.filter(r => !r.isDIYCraving && !r.cookbookId);
        break;
      case 'Snapped':
        result = recipes.filter(r => r.isDIYCraving === true);
        break;
      case 'Links':
        result = recipes.filter(r => r.source && r.source.startsWith('http') && !r.isDIYCraving && !r.cookbookId);
        break;
      default:
        result = recipes;
    }

    if (recipeSearchQuery.trim()) {
      const q = recipeSearchQuery.toLowerCase();
      result = result.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.ingredients.some(i => i.name.toLowerCase().includes(q))
      );
    }

    if (filterMaxTime) {
      result = result.filter(r => (r.prepTime + r.cookTime) <= filterMaxTime);
    }

    if (filterSource === 'cookbook') {
      result = result.filter(r => r.cookbookId);
    } else if (filterSource === 'diy') {
      result = result.filter(r => r.isDIYCraving);
    } else if (filterSource === 'web') {
      result = result.filter(r => {
        const s = r.source?.toLowerCase() || '';
        return s.startsWith('http') || s.includes('.com');
      });
    }

    return result;
  };

  const filteredRecipes = getFilteredRecipes();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Recipes</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerBtn} onPress={() => { setShowSearch(!showSearch); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
              <Search size={20} color={showSearch ? colors.secondary : colors.text} strokeWidth={2.5} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.headerBtn, (filterMaxTime || filterSource) ? styles.headerBtnActive : undefined]} onPress={() => { setShowFilterModal(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
              <SlidersHorizontal size={20} color={(filterMaxTime || filterSource) ? colors.white : colors.text} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>

        {showSearch && (
          <View style={styles.searchBarContainer}>
            <View style={styles.searchBarInner}>
              <Search size={18} color={colors.textSecondary} />
              <TextInput
                style={styles.searchBarInput}
                placeholder="Search recipes..."
                placeholderTextColor={colors.textSecondary}
                value={recipeSearchQuery}
                onChangeText={setRecipeSearchQuery}
                autoFocus
                returnKeyType="search"
              />
              {recipeSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setRecipeSearchQuery('')}>
                  <X size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <View style={styles.topPanel}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContainer}
          >
            {filterChips.map((chip) => (
              <TouchableOpacity
                key={chip}
                style={[styles.filterChip, activeFilter === chip && styles.filterChipActive]}
                onPress={() => setActiveFilter(chip)}
              >
                <Text style={[styles.filterText, activeFilter === chip && styles.filterTextActive]}>
                  {chip}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>


        </View>

        {activeFilter === 'Cookbooks' ? (
          <ScrollView 
            style={styles.scroll} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.cookbooksScrollContent}
          >
            {/* Bookshelf Header */}
            <View style={styles.bookshelfHeader}>
              <View style={styles.bookshelfTitleRow}>
                <BookOpen size={20} color={colors.text} strokeWidth={2.5} />
                <Text style={styles.bookshelfTitle}>My Cookbook Collection</Text>
              </View>
              <Text style={styles.bookshelfSubtitle}>
                {cookbooks.length === 0 
                  ? "Add your cookbooks to track recipes from your collection"
                  : `${cookbooks.length} cookbook${cookbooks.length !== 1 ? "s" : ""} • ${cookbookRecipes.length} recipe${cookbookRecipes.length !== 1 ? "s" : ""}`
                }
              </Text>
            </View>

            {/* Add Cookbook Button */}
            <TouchableOpacity 
              style={styles.addCookbookBtn}
              onPress={openAddCookbookModal}
            >
              <View style={styles.addCookbookIcon}>
                <Plus size={20} color={colors.secondary} strokeWidth={2.5} />
              </View>
              <View style={styles.addCookbookText}>
                <Text style={styles.addCookbookTitle}>Add a Cookbook</Text>
                <Text style={styles.addCookbookSubtext}>Track recipes from books you own</Text>
              </View>
              <ChevronRight size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Bookshelf Grid */}
            {cookbooks.length > 0 && (
              <View style={styles.bookshelfGrid}>
                {cookbooks.map((cookbook, index) => (
                  <TouchableOpacity 
                    key={cookbook.id}
                    style={[
                      styles.cookbookCard,
                      index % 2 === 0 && styles.cookbookCardLeft,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedCookbook(selectedCookbook === cookbook.id ? null : cookbook.id);
                    }}
                    onLongPress={() => handleDeleteCookbook(cookbook.id)}
                  >
                    <View style={[styles.cookbookSpine, { backgroundColor: getSpineColor(index) }]} />
                    <View style={styles.cookbookCover}>
                      {cookbook.coverImage ? (
                        <Image source={{ uri: cookbook.coverImage }} style={styles.cookbookImage} />
                      ) : (
                        <View style={[styles.cookbookPlaceholder, { backgroundColor: getCoverColor(index) }]}>
                          <BookOpen size={28} color={colors.white} strokeWidth={2} />
                        </View>
                      )}
                    </View>
                    <View style={styles.cookbookInfo}>
                      <Text style={styles.cookbookTitle} numberOfLines={2}>{cookbook.title}</Text>
                      {cookbook.author && (
                        <Text style={styles.cookbookAuthor} numberOfLines={1}>{cookbook.author}</Text>
                      )}
                      <View style={styles.cookbookMeta}>
                        <Text style={styles.cookbookRecipeCount}>
                          {cookbook.recipeCount} recipe{cookbook.recipeCount !== 1 ? "s" : ""}
                        </Text>
                      </View>
                    </View>
                    {selectedCookbook === cookbook.id && (
                      <View style={styles.selectedIndicator} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Recipes from selected cookbook */}
            {selectedCookbook && (
              <View style={styles.cookbookRecipesSection}>
                <View style={styles.cookbookRecipesHeader}>
                  <Text style={styles.cookbookRecipesTitle}>
                    Recipes from {`"${getCookbookById(selectedCookbook)?.title}"`}
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedCookbook(null)}>
                    <X size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                {isFetchingPreviews && previewCookbookId === selectedCookbook ? (
                  <View style={styles.cookbookGenerating}>
                    <ActivityIndicator size="large" color={colors.secondary} />
                    <Text style={styles.cookbookGeneratingTitle}>Finding recipes in this book...</Text>
                    <Text style={styles.cookbookGeneratingProgress}>Scanning cookbook contents</Text>
                  </View>
                ) : generatingCookbookId === selectedCookbook ? (
                  <View style={styles.cookbookGenerating}>
                    <ActivityIndicator size="large" color={colors.secondary} />
                    <Text style={styles.cookbookGeneratingTitle}>Generating your selected recipes...</Text>
                    <Text style={styles.cookbookGeneratingProgress}>{cookbookGenProgress}</Text>
                    {cookbookGenCount > 0 && (
                      <View style={styles.cookbookGenCountBadge}>
                        <Sparkles size={14} color={colors.secondary} strokeWidth={2.5} />
                        <Text style={styles.cookbookGenCountText}>{cookbookGenCount} recipes added</Text>
                      </View>
                    )}
                  </View>
                ) : recipes.filter(r => r.cookbookId === selectedCookbook).length === 0 ? (
                  <View style={styles.noCookbookRecipes}>
                    <Text style={styles.noCookbookRecipesText}>No recipes from this cookbook yet</Text>
                    <TouchableOpacity
                      style={styles.generateCookbookBtn}
                      onPress={() => {
                        const cb = getCookbookById(selectedCookbook);
                        if (cb) fetchCookbookRecipeList(cb.id, cb.title, cb.author);
                      }}
                    >
                      <BookOpen size={18} color={colors.white} strokeWidth={2.5} />
                      <Text style={styles.generateCookbookBtnText}>Browse Recipes from Book</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.recipesGrid}>
                    {recipes.filter(r => r.cookbookId === selectedCookbook).map((recipe, index) => (
                      <TouchableOpacity 
                        key={recipe.id} 
                        style={[
                          styles.recipeCard,
                          index % 3 === 0 && styles.recipeCardRotateLeft,
                          index % 3 === 2 && styles.recipeCardRotateRight,
                        ]}
                        onPress={() => openRecipeDetail(recipe)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.recipeImageWrap}>
                          <Image source={{ uri: recipe.image }} style={styles.recipeImage} resizeMode="cover" />
                          {recipe.pageNumber && (
                            <View style={styles.pageBadge}>
                              <Text style={styles.pageText}>p.{recipe.pageNumber}</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.recipeInfo}>
                          <Text style={styles.recipeTitle} numberOfLines={2}>{recipe.title}</Text>
                          <View style={styles.recipeMeta}>
                            <View style={styles.metaItem}>
                              <Clock size={12} color={colors.textSecondary} />
                              <Text style={styles.metaText}>{recipe.prepTime + recipe.cookTime}m</Text>
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      style={styles.browseMoreBtn}
                      onPress={() => {
                        const cb = getCookbookById(selectedCookbook);
                        if (cb) fetchCookbookRecipeList(cb.id, cb.title, cb.author);
                      }}
                    >
                      <Plus size={16} color={colors.secondary} strokeWidth={2.5} />
                      <Text style={styles.browseMoreBtnText}>Browse More Recipes</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Empty state when no cookbooks */}
            {cookbooks.length === 0 && (
              <View style={styles.emptyCookbookState}>
                <Image
                  source={{ uri: 'https://r2-pub.rork.com/attachments/7kh2kny7y4aoan2iczpas' }}
                  style={styles.emptyTotie}
                  resizeMode="contain"
                />
                <Text style={styles.emptyCookbookTitle}>Build your cookbook library!</Text>
                <Text style={styles.emptyCookbookText}>
                  {"Add the cookbooks you own, then save recipes from them. Totie will help you find what to cook based on what's in your kitchen!"}
                </Text>
              </View>
            )}

            <View style={styles.bottomPadding} />
          </ScrollView>
        ) : activeFilter === 'Links' && filteredRecipes.length === 0 ? (
          <ScrollView 
            style={styles.emptyScroll} 
            contentContainerStyle={styles.emptyScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.filterEmptyCard}>
              <View style={[styles.filterEmptyIconWrap, { backgroundColor: colors.secondaryLight }]}>
                <LinkIcon size={32} color={colors.secondary} strokeWidth={2.5} />
              </View>
              <Text style={styles.filterEmptyTitle}>No linked recipes yet</Text>
              <Text style={styles.filterEmptySubtext}>
                {"Save recipes from TikTok, Instagram, food blogs, or any website. Just paste the link!"}
              </Text>
              <TouchableOpacity style={[styles.filterEmptyButton, { backgroundColor: colors.secondary }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setNewIdeaType('link'); setShowAddIdea(true); }}>
                <LinkIcon size={18} color={colors.white} strokeWidth={2.5} />
                <Text style={styles.filterEmptyButtonText}>Paste a Link</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.filterEmptyTip}>
              <Text style={styles.filterEmptyTipLabel}>🔗 Tip</Text>
              <Text style={styles.filterEmptyTipText}>
                {"Found a recipe online? Copy the URL and paste it here — we'll extract the ingredients and steps for you."}
              </Text>
            </View>
          </ScrollView>
        ) : activeFilter === 'All' && filteredRecipes.length === 0 ? (
          <ScrollView 
            style={styles.emptyScroll} 
            contentContainerStyle={styles.allEmptyScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Premium Hero Card */}
            <View style={styles.premiumHeroCard}>
              <View style={styles.premiumHeroInner}>
                <View style={styles.heroGlowOrb1} />
                <View style={styles.heroGlowOrb2} />
                <View style={styles.floatingPillsContainer}>
                  <View style={[styles.floatingPill, styles.floatingPillTopLeft, { backgroundColor: 'rgba(46,125,50,0.1)' }]}>
                    <ShoppingCart size={11} color="#2E7D32" strokeWidth={2.5} />
                    <Text style={[styles.heroTagText, { color: '#2E7D32' }]}>Cut Delivery Spending</Text>
                  </View>
                  <View style={[styles.floatingPill, styles.floatingPillTopRight, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
                    <Zap size={11} color="#F59E0B" strokeWidth={2.5} />
                    <Text style={[styles.heroTagText, { color: '#F59E0B' }]}>Quick Meals</Text>
                  </View>
                  <View style={[styles.floatingPill, styles.floatingPillLeft]}>
                    <Sparkles size={11} color={colors.primary} strokeWidth={2.5} />
                    <Text style={styles.heroTagText}>AI-Powered</Text>
                  </View>
                  <View style={[styles.floatingPill, styles.floatingPillRight, { backgroundColor: 'rgba(99,110,114,0.08)' }]}>
                    <Droplets size={11} color={colors.secondary} strokeWidth={2.5} />
                    <Text style={[styles.heroTagText, { color: colors.secondary }]}>Track Kitchen</Text>
                  </View>
                  <Animated.View style={[styles.heroRingOuter, { transform: [{ scale: pulseAnim }] }]}>
                    <View style={styles.heroRingInner}>
                      <Image
                        source={{ uri: 'https://r2-pub.rork.com/attachments/7kh2kny7y4aoan2iczpas' }}
                        style={styles.premiumHeroImage}
                        resizeMode="contain"
                      />
                    </View>
                  </Animated.View>
                  <View style={[styles.floatingPill, styles.floatingPillBottomLeft, { backgroundColor: 'rgba(255,107,74,0.08)' }]}>
                    <Heart size={11} color="#E85A3A" strokeWidth={2.5} />
                    <Text style={[styles.heroTagText, { color: '#E85A3A' }]}>Organize Your Recipes</Text>
                  </View>
                  <View style={[styles.floatingPill, styles.floatingPillBottomRight, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
                    <Brain size={11} color="#10B981" strokeWidth={2.5} />
                    <Text style={[styles.heroTagText, { color: '#10B981' }]}>Know What to Cook</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Title Section */}
            <View style={styles.premiumTitleSection}>
              <Text style={styles.premiumTitle}>Your Recipe Collection</Text>
              <Text style={styles.premiumSubtitle}>
                All your saved recipes in one place. Start building your personalized cookbook!
              </Text>
            </View>

            {/* Premium Action Cards */}
            <View style={styles.premiumActions}>
              <TouchableOpacity 
                style={styles.premiumActionCard}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setNewIdeaType('note'); setShowAddIdea(true); }}
                activeOpacity={0.7}
              >
                <View style={styles.premiumActionGlow} />
                <View style={[styles.premiumActionIcon, { backgroundColor: 'rgba(255,107,53,0.12)' }]}>
                  <Sparkles size={24} color={colors.primary} strokeWidth={2.5} />
                </View>
                <View style={styles.premiumActionContent}>
                  <Text style={styles.premiumActionTitle}>Create with AI</Text>
                  <Text style={styles.premiumActionSubtext}>Describe any dish</Text>
                </View>
                <View style={styles.premiumActionArrow}>
                  <ArrowRight size={18} color={colors.primary} strokeWidth={2.5} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.premiumActionCard}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setNewIdeaType('link'); setShowAddIdea(true); }}
                activeOpacity={0.7}
              >
                <View style={[styles.premiumActionIcon, { backgroundColor: 'rgba(46,125,50,0.1)' }]}>
                  <LinkIcon size={24} color="#2E7D32" strokeWidth={2.5} />
                </View>
                <View style={styles.premiumActionContent}>
                  <Text style={styles.premiumActionTitle}>Import from Link</Text>
                  <Text style={styles.premiumActionSubtext}>Paste any recipe URL</Text>
                </View>
                <View style={[styles.premiumActionArrow, { backgroundColor: 'rgba(46,125,50,0.08)' }]}>
                  <ArrowRight size={18} color="#2E7D32" strokeWidth={2.5} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.premiumActionCard}
                onPress={() => handleSnapCraving()}
                activeOpacity={0.7}
              >
                <View style={[styles.premiumActionIcon, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
                  <Camera size={24} color="#F59E0B" strokeWidth={2.5} />
                </View>
                <View style={styles.premiumActionContent}>
                  <Text style={styles.premiumActionTitle}>Snap a Craving</Text>
                  <Text style={styles.premiumActionSubtext}>Turn screenshots into recipes</Text>
                </View>
                <View style={[styles.premiumActionArrow, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
                  <ArrowRight size={18} color="#F59E0B" strokeWidth={2.5} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Premium Stats */}
            <View style={styles.premiumStatsCard}>
              <View style={styles.premiumStatsInner}>
                <View style={styles.premiumStatItem}>
                  <View style={styles.premiumStatIconWrap}>
                    <ChefHat size={16} color={colors.primary} strokeWidth={2.5} />
                  </View>
                  <Text style={styles.premiumStatValue}>0</Text>
                  <Text style={styles.premiumStatLabel}>Recipes</Text>
                </View>
                <View style={styles.premiumStatDivider} />
                <View style={styles.premiumStatItem}>
                  <View style={styles.premiumStatIconWrap}>
                    <Zap size={16} color="#10B981" strokeWidth={2.5} />
                  </View>
                  <Text style={[styles.premiumStatValue, { color: '#10B981' }]}>$0</Text>
                  <Text style={styles.premiumStatLabel}>Saved</Text>
                </View>
                <View style={styles.premiumStatDivider} />
                <View style={styles.premiumStatItem}>
                  <View style={styles.premiumStatIconWrap}>
                    <Flame size={16} color="#F59E0B" strokeWidth={2.5} />
                  </View>
                  <Text style={styles.premiumStatValue}>0</Text>
                  <Text style={styles.premiumStatLabel}>Cooked</Text>
                </View>
              </View>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>
        ) : activeFilter === 'Snapped' && filteredRecipes.length === 0 ? (
          <ScrollView 
            style={styles.emptyScroll} 
            contentContainerStyle={styles.emptyScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.filterEmptyCard}>
              <View style={[styles.filterEmptyIconWrap, { backgroundColor: colors.primaryLight }]}>
                <Camera size={32} color={colors.primary} strokeWidth={2.5} />
              </View>
              <Text style={styles.filterEmptyTitle}>No snapped recipes yet</Text>
              <Text style={styles.filterEmptySubtext}>
                {"Snap screenshots of recipes from apps, social media, or menus — we'll save them here for you!"}
              </Text>
              <TouchableOpacity style={[styles.filterEmptyButton, { backgroundColor: colors.primary }]} onPress={() => handleSnapCraving()}>
                <Camera size={18} color={colors.white} strokeWidth={2.5} />
                <Text style={styles.filterEmptyButtonText}>Snap a Craving</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.filterEmptySavings}>
              <Text style={styles.filterEmptySavingsTitle}>🤑 Save money cooking at home</Text>
              <View style={styles.filterEmptySavingsRow}>
                <View style={styles.filterEmptySavingsItem}>
                  <Text style={styles.filterEmptySavingsValue}>$18</Text>
                  <Text style={styles.filterEmptySavingsLabel}>Delivery avg.</Text>
                </View>
                <View style={styles.filterEmptySavingsArrow}>
                  <Text style={styles.filterEmptySavingsArrowText}>→</Text>
                </View>
                <View style={styles.filterEmptySavingsItem}>
                  <Text style={[styles.filterEmptySavingsValue, { color: colors.success }]}>$6</Text>
                  <Text style={styles.filterEmptySavingsLabel}>DIY at home</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        ) : activeFilter === 'Food Dump' ? (
          <ScrollView 
            style={styles.emptyScroll} 
            contentContainerStyle={styles.emptyScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Food Dump Header */}
            <View style={styles.foodDumpHeader}>
              <View style={styles.foodDumpTitleRow}>
                <Brain size={22} color={colors.text} strokeWidth={2.5} />
                <Text style={styles.foodDumpTitle}>Food Dump</Text>
              </View>
              <Text style={styles.foodDumpSubtitle}>
                Dump all your recipe ideas here — links, notes, cravings. We&apos;ll help you organize them later!
              </Text>
            </View>

            {/* Add Idea Button */}
            <TouchableOpacity 
              style={styles.addIdeaBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowAddIdea(true);
              }}
            >
              <View style={styles.addIdeaIcon}>
                <Lightbulb size={20} color="#F59E0B" strokeWidth={2.5} />
              </View>
              <View style={styles.addIdeaText}>
                <Text style={styles.addIdeaTitle}>Add an Idea</Text>
                <Text style={styles.addIdeaSubtext}>Link, note, or anything you want to cook</Text>
              </View>
              <ChevronRight size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Ideas List */}
            {foodDumpItems.length > 0 ? (
              <View style={styles.ideasList}>
                <Text style={styles.ideasListTitle}>
                  {foodDumpItems.filter(i => !i.isProcessed).length} idea{foodDumpItems.filter(i => !i.isProcessed).length !== 1 ? 's' : ''} waiting
                </Text>
                {foodDumpItems.filter(i => !i.isProcessed).map((item) => (
                  <View key={item.id} style={styles.ideaCard}>
                    <View style={[styles.ideaTypeIcon, { backgroundColor: item.type === 'link' ? colors.secondaryLight : '#FEF3C7' }]}>
                      {item.type === 'link' ? (
                        <LinkIcon size={16} color={colors.secondary} strokeWidth={2.5} />
                      ) : (
                        <Edit3 size={16} color="#F59E0B" strokeWidth={2.5} />
                      )}
                    </View>
                    <View style={styles.ideaContent}>
                      <Text style={styles.ideaText} numberOfLines={2}>{item.content}</Text>
                      {item.source && (
                        <View style={styles.ideaSourceRow}>
                          <ExternalLink size={10} color={colors.textSecondary} />
                          <Text style={styles.ideaSource} numberOfLines={1}>{item.source}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.ideaActions}>
                      <TouchableOpacity 
                        style={styles.ideaActionBtn}
                        onPress={() => processIdea(item)}
                      >
                        <Sparkles size={16} color={colors.secondary} strokeWidth={2.5} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.ideaActionBtn, styles.ideaDeleteBtn]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          deleteFoodDumpItem(item.id);
                        }}
                      >
                        <Trash2 size={16} color="#EF4444" strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.foodDumpEmptyCard}>
                <Image
                  source={{ uri: 'https://r2-pub.rork.com/attachments/7kh2kny7y4aoan2iczpas' }}
                  style={styles.emptyTotie}
                  resizeMode="contain"
                />
                <Text style={styles.foodDumpEmptyTitle}>Your brain dump is empty!</Text>
                <Text style={styles.foodDumpEmptyText}>
                  See a recipe on TikTok? A dish at a restaurant? Just dump it here and organize later.
                </Text>
              </View>
            )}

            {/* Processed Items Section */}
            {foodDumpItems.filter(i => i.isProcessed).length > 0 && (
              <View style={styles.processedSection}>
                <Text style={styles.processedSectionTitle}>
                  ✅ {foodDumpItems.filter(i => i.isProcessed).length} idea{foodDumpItems.filter(i => i.isProcessed).length !== 1 ? 's' : ''} converted
                </Text>
                {foodDumpItems.filter(i => i.isProcessed).map((item) => {
                  const linkedRecipe = recipes.find(r => r.id === item.recipeId);
                  return (
                    <View key={item.id} style={styles.processedCard}>
                      <View style={styles.processedCardIcon}>
                        <Check size={14} color={colors.success} strokeWidth={3} />
                      </View>
                      <View style={styles.processedCardContent}>
                        <Text style={styles.processedCardText} numberOfLines={1}>
                          {item.content.substring(0, 35)}{item.content.length > 35 ? '...' : ''}
                        </Text>
                        {linkedRecipe && (
                          <Text style={styles.processedCardRecipe} numberOfLines={1}>
                            → {linkedRecipe.title}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Tips Section */}
            <View style={styles.foodDumpTips}>
              <Text style={styles.foodDumpTipsTitle}>💡 What to dump here</Text>
              <View style={styles.foodDumpTipsList}>
                <Text style={styles.foodDumpTipItem}>• Links from TikTok, Instagram, YouTube</Text>
                <Text style={styles.foodDumpTipItem}>• Recipe URLs from any website</Text>
                <Text style={styles.foodDumpTipItem}>• Quick notes like &quot;grandma&apos;s lasagna recipe&quot;</Text>
                <Text style={styles.foodDumpTipItem}>• Restaurant dishes you want to recreate</Text>
              </View>
            </View>

            <View style={styles.bottomPadding} />
          </ScrollView>
        ) : activeFilter === 'Favorites' && filteredRecipes.length === 0 ? (
          <ScrollView 
            style={styles.emptyScroll} 
            contentContainerStyle={styles.emptyScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.filterEmptyCard}>
              <View style={[styles.filterEmptyIconWrap, { backgroundColor: '#FCE4EC' }]}>
                <Heart size={32} color="#E91E63" strokeWidth={2.5} />
              </View>
              <Text style={styles.filterEmptyTitle}>No favorites yet</Text>
              <Text style={styles.filterEmptySubtext}>
                Tap the heart on any recipe to add it to your favorites. Your go-to recipes will live here!
              </Text>
            </View>
            <View style={styles.filterEmptyFavTip}>
              <View style={styles.filterEmptyFavTipIcon}>
                <Heart size={16} color="#E91E63" strokeWidth={2.5} fill="#E91E63" />
              </View>
              <Text style={styles.filterEmptyFavTipText}>
                Pro tip: Favorite recipes you make often for quick access
              </Text>
            </View>
          </ScrollView>
        ) : recipes.length === 0 ? (
          <ScrollView 
            style={styles.emptyScroll} 
            contentContainerStyle={styles.allEmptyScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Premium Hero Card */}
            <View style={styles.premiumHeroCard}>
              <View style={styles.premiumHeroInner}>
                <View style={styles.heroGlowOrb1} />
                <View style={styles.heroGlowOrb2} />
                <View style={styles.floatingPillsContainer}>
                  <View style={[styles.floatingPill, styles.floatingPillTopLeft, { backgroundColor: 'rgba(46,125,50,0.1)' }]}>
                    <ShoppingCart size={11} color="#2E7D32" strokeWidth={2.5} />
                    <Text style={[styles.heroTagText, { color: '#2E7D32' }]}>Cut Delivery Spending</Text>
                  </View>
                  <View style={[styles.floatingPill, styles.floatingPillTopRight, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
                    <Zap size={11} color="#F59E0B" strokeWidth={2.5} />
                    <Text style={[styles.heroTagText, { color: '#F59E0B' }]}>Quick Meals</Text>
                  </View>
                  <View style={[styles.floatingPill, styles.floatingPillLeft]}>
                    <Sparkles size={11} color={colors.primary} strokeWidth={2.5} />
                    <Text style={styles.heroTagText}>AI-Powered</Text>
                  </View>
                  <View style={[styles.floatingPill, styles.floatingPillRight, { backgroundColor: 'rgba(99,110,114,0.08)' }]}>
                    <Droplets size={11} color={colors.secondary} strokeWidth={2.5} />
                    <Text style={[styles.heroTagText, { color: colors.secondary }]}>Track Kitchen</Text>
                  </View>
                  <Animated.View style={[styles.heroRingOuter, { transform: [{ scale: pulseAnim }] }]}>
                    <View style={styles.heroRingInner}>
                      <Image
                        source={{ uri: 'https://r2-pub.rork.com/attachments/7kh2kny7y4aoan2iczpas' }}
                        style={styles.premiumHeroImage}
                        resizeMode="contain"
                      />
                    </View>
                  </Animated.View>
                  <View style={[styles.floatingPill, styles.floatingPillBottomLeft, { backgroundColor: 'rgba(255,107,74,0.08)' }]}>
                    <Heart size={11} color="#E85A3A" strokeWidth={2.5} />
                    <Text style={[styles.heroTagText, { color: '#E85A3A' }]}>Organize Your Recipes</Text>
                  </View>
                  <View style={[styles.floatingPill, styles.floatingPillBottomRight, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
                    <Brain size={11} color="#10B981" strokeWidth={2.5} />
                    <Text style={[styles.heroTagText, { color: '#10B981' }]}>Know What to Cook</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.premiumTitleSection}>
              <Text style={styles.premiumTitle}>Your Recipe Collection</Text>
              <Text style={styles.premiumSubtitle}>
                All your saved recipes in one place. Start building your personalized cookbook!
              </Text>
            </View>

            <View style={styles.premiumActions}>
              <TouchableOpacity 
                style={styles.premiumActionCard}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setNewIdeaType('note'); setShowAddIdea(true); }}
                activeOpacity={0.7}
              >
                <View style={styles.premiumActionGlow} />
                <View style={[styles.premiumActionIcon, { backgroundColor: 'rgba(255,107,53,0.12)' }]}>
                  <Sparkles size={24} color={colors.primary} strokeWidth={2.5} />
                </View>
                <View style={styles.premiumActionContent}>
                  <Text style={styles.premiumActionTitle}>Create with AI</Text>
                  <Text style={styles.premiumActionSubtext}>Describe any dish</Text>
                </View>
                <View style={styles.premiumActionArrow}>
                  <ArrowRight size={18} color={colors.primary} strokeWidth={2.5} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.premiumActionCard}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setNewIdeaType('link'); setShowAddIdea(true); }}
                activeOpacity={0.7}
              >
                <View style={[styles.premiumActionIcon, { backgroundColor: 'rgba(46,125,50,0.1)' }]}>
                  <LinkIcon size={24} color="#2E7D32" strokeWidth={2.5} />
                </View>
                <View style={styles.premiumActionContent}>
                  <Text style={styles.premiumActionTitle}>Import from Link</Text>
                  <Text style={styles.premiumActionSubtext}>Paste any recipe URL</Text>
                </View>
                <View style={[styles.premiumActionArrow, { backgroundColor: 'rgba(46,125,50,0.08)' }]}>
                  <ArrowRight size={18} color="#2E7D32" strokeWidth={2.5} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.premiumActionCard}
                onPress={() => handleSnapCraving()}
                activeOpacity={0.7}
              >
                <View style={[styles.premiumActionIcon, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
                  <Camera size={24} color="#F59E0B" strokeWidth={2.5} />
                </View>
                <View style={styles.premiumActionContent}>
                  <Text style={styles.premiumActionTitle}>Snap a Craving</Text>
                  <Text style={styles.premiumActionSubtext}>Turn screenshots into recipes</Text>
                </View>
                <View style={[styles.premiumActionArrow, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
                  <ArrowRight size={18} color="#F59E0B" strokeWidth={2.5} />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.premiumStatsCard}>
              <View style={styles.premiumStatsInner}>
                <View style={styles.premiumStatItem}>
                  <View style={styles.premiumStatIconWrap}>
                    <ChefHat size={16} color={colors.primary} strokeWidth={2.5} />
                  </View>
                  <Text style={styles.premiumStatValue}>0</Text>
                  <Text style={styles.premiumStatLabel}>Recipes</Text>
                </View>
                <View style={styles.premiumStatDivider} />
                <View style={styles.premiumStatItem}>
                  <View style={styles.premiumStatIconWrap}>
                    <Zap size={16} color="#10B981" strokeWidth={2.5} />
                  </View>
                  <Text style={[styles.premiumStatValue, { color: '#10B981' }]}>$0</Text>
                  <Text style={styles.premiumStatLabel}>Saved</Text>
                </View>
                <View style={styles.premiumStatDivider} />
                <View style={styles.premiumStatItem}>
                  <View style={styles.premiumStatIconWrap}>
                    <Flame size={16} color="#F59E0B" strokeWidth={2.5} />
                  </View>
                  <Text style={styles.premiumStatValue}>0</Text>
                  <Text style={styles.premiumStatLabel}>Cooked</Text>
                </View>
              </View>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>
        ) : (
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Featured Recipe (first recipe) */}
            {filteredRecipes.length > 0 && (
              <TouchableOpacity 
                style={styles.featuredCard}
                onPress={() => openRecipeDetail(filteredRecipes[0])}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: filteredRecipes[0].image }}
                  style={styles.featuredImage}
                  resizeMode="cover"
                />
                <View style={styles.featuredOverlay}>
                  <View style={styles.featuredBadge}>
                    <Sparkles size={12} color="#F59E0B" />
                    <Text style={styles.featuredBadgeText}>Latest</Text>
                  </View>
                  <View style={styles.featuredContent}>
                    <Text style={styles.featuredTitle} numberOfLines={2}>{filteredRecipes[0].title}</Text>
                    <View style={styles.featuredMeta}>
                      <View style={styles.featuredMetaItem}>
                        <Clock size={14} color={colors.white} />
                        <Text style={styles.featuredMetaText}>{filteredRecipes[0].prepTime + filteredRecipes[0].cookTime}m</Text>
                      </View>
                      <View style={styles.featuredMetaItem}>
                        <Users size={14} color={colors.white} />
                        <Text style={styles.featuredMetaText}>{filteredRecipes[0].servings} servings</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {/* Recipe Count */}
            {filteredRecipes.length > 1 && (
              <View style={styles.recipeCountRow}>
                <Text style={styles.recipeCountText}>{filteredRecipes.length} recipes</Text>
                <View style={styles.recipeCountDots}>
                  <View style={[styles.recipeCountDot, { backgroundColor: colors.primary }]} />
                  <View style={[styles.recipeCountDot, { backgroundColor: colors.secondary }]} />
                  <View style={[styles.recipeCountDot, { backgroundColor: '#F59E0B' }]} />
                </View>
              </View>
            )}

            {/* Recipe Grid (skip first if featured) */}
            <View style={styles.recipesGrid}>
              {filteredRecipes.slice(filteredRecipes.length > 1 ? 1 : 0).map((recipe, index) => {
                const cookbook = recipe.cookbookId ? getCookbookById(recipe.cookbookId) : null;
                const nutri = getNutrition(recipe);
                return (
                  <TouchableOpacity 
                    key={recipe.id} 
                    style={[
                      styles.recipeCard,
                      index % 2 === 0 && styles.recipeCardRotateLeft,
                      index % 2 === 1 && styles.recipeCardRotateRight,
                    ]}
                    onPress={() => openRecipeDetail(recipe)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.recipeImageWrap}>
                      <Image
                        source={{ uri: recipe.image }}
                        style={styles.recipeImage}
                        resizeMode="cover"
                      />
                      {recipe.isDIYCraving && recipe.deliveryPrice && recipe.diyPrice && (
                        <View style={styles.savingsBadge}>
                          <Text style={styles.savingsText}>
                            Save ${recipe.deliveryPrice - recipe.diyPrice}
                          </Text>
                        </View>
                      )}
                      {recipe.cookbookId && recipe.pageNumber && (
                        <View style={styles.pageBadge}>
                          <Text style={styles.pageText}>p.{recipe.pageNumber}</Text>
                        </View>
                      )}
                      <View style={styles.recipeCalorieBadge}>
                        <Zap size={10} color="#E65100" strokeWidth={2.5} />
                        <Text style={styles.recipeCalorieText}>{nutri.calories}</Text>
                      </View>
                    </View>
                    <View style={styles.recipeInfo}>
                      <Text style={styles.recipeTitle} numberOfLines={2}>
                        {recipe.title}
                      </Text>
                      {cookbook && (
                        <View style={styles.cookbookSource}>
                          <BookOpen size={10} color={colors.textSecondary} />
                          <Text style={styles.cookbookSourceText} numberOfLines={1}>
                            {cookbook.title}
                          </Text>
                        </View>
                      )}
                      <View style={styles.recipeMeta}>
                        <View style={styles.metaItem}>
                          <Clock size={12} color={colors.textSecondary} />
                          <Text style={styles.metaText}>{recipe.prepTime + recipe.cookTime}m</Text>
                        </View>
                        <View style={styles.metaDot} />
                        <View style={styles.metaItem}>
                          <Users size={12} color={colors.textSecondary} />
                          <Text style={styles.metaText}>{recipe.servings}</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.bottomPadding} />
          </ScrollView>
        )}

        <TouchableOpacity 
          style={styles.fab}
          onPress={() => setShowAddMenu(!showAddMenu)}
        >
          <Plus size={28} color={colors.white} strokeWidth={3} />
        </TouchableOpacity>

        {showAddMenu && (
          <TouchableOpacity 
            style={styles.addMenuBackdrop} 
            activeOpacity={1} 
            onPress={() => setShowAddMenu(false)}
          />
        )}

        {showAddMenu && (
          <View style={styles.addMenu}>
            <TouchableOpacity 
              style={styles.addMenuItem}
              onPress={() => {
                setShowAddMenu(false);
                setNewIdeaType('note');
                setShowAddIdea(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <View style={[styles.addMenuIcon, { backgroundColor: 'rgba(255,107,53,0.12)' }]}>
                <Sparkles size={18} color={colors.primary} strokeWidth={2.5} />
              </View>
              <View style={styles.addMenuContent}>
                <Text style={styles.addMenuTitle}>Create with AI</Text>
                <Text style={styles.addMenuSubtext}>Describe any dish</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.addMenuItem}
              onPress={() => {
                setShowAddMenu(false);
                setNewIdeaType('link');
                setShowAddIdea(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <View style={[styles.addMenuIcon, { backgroundColor: 'rgba(46,125,50,0.1)' }]}>
                <LinkIcon size={18} color="#2E7D32" strokeWidth={2.5} />
              </View>
              <View style={styles.addMenuContent}>
                <Text style={styles.addMenuTitle}>Import from Link</Text>
                <Text style={styles.addMenuSubtext}>Paste any recipe URL</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.addMenuItem}
              onPress={() => {
                setShowAddMenu(false);
                handleSnapCraving();
              }}
            >
              <View style={[styles.addMenuIcon, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
                <Camera size={18} color="#F59E0B" strokeWidth={2.5} />
              </View>
              <View style={styles.addMenuContent}>
                <Text style={styles.addMenuTitle}>Snap a Craving</Text>
                <Text style={styles.addMenuSubtext}>Turn screenshots into recipes</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.addMenuItem}
              onPress={() => {
                setShowAddMenu(false);
                setActiveFilter('Cookbooks');
                openAddCookbookModal();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <View style={[styles.addMenuIcon, { backgroundColor: '#FFF3E0' }]}>
                <BookOpen size={18} color="#E65100" strokeWidth={2.5} />
              </View>
              <View style={styles.addMenuContent}>
                <Text style={styles.addMenuTitle}>Add Cookbook</Text>
                <Text style={styles.addMenuSubtext}>Track recipes from books you own</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Add Cookbook Modal */}
        <Modal
          visible={showAddCookbook}
          transparent
          animationType="fade"
          onRequestClose={resetAddCookbookModal}
        >
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoid}>
            <Pressable 
              style={styles.modalOverlay}
              onPress={resetAddCookbookModal}
            >
              <Pressable style={styles.modalContentLarge} onPress={e => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Cookbook</Text>
                <TouchableOpacity onPress={resetAddCookbookModal}>
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Tab Selector */}
              <View style={styles.tabSelector}>
                <TouchableOpacity 
                  style={[styles.tab, addCookbookTab === 'search' && styles.tabActive]}
                  onPress={() => handleTabChange('search')}
                >
                  <Search size={16} color={addCookbookTab === 'search' ? colors.white : colors.text} />
                  <Text style={[styles.tabText, addCookbookTab === 'search' && styles.tabTextActive]}>Search</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.tab, addCookbookTab === 'scan' && styles.tabActive]}
                  onPress={() => handleTabChange('scan')}
                >
                  <ScanBarcode size={16} color={addCookbookTab === 'scan' ? colors.white : colors.text} />
                  <Text style={[styles.tabText, addCookbookTab === 'scan' && styles.tabTextActive]}>Scan</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.tab, addCookbookTab === 'manual' && styles.tabActive]}
                  onPress={() => handleTabChange('manual')}
                >
                  <Keyboard size={16} color={addCookbookTab === 'manual' ? colors.white : colors.text} />
                  <Text style={[styles.tabText, addCookbookTab === 'manual' && styles.tabTextActive]}>Manual</Text>
                </TouchableOpacity>
              </View>
              
              {/* Search Tab */}
              {addCookbookTab === 'search' && (
                <View style={styles.tabContent}>
                  <View style={styles.searchInputContainer}>
                    <Search size={18} color={colors.textSecondary} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search by title or author..."
                      placeholderTextColor={colors.textSecondary}
                      value={searchQuery}
                      onChangeText={(text) => {
                        setSearchQuery(text);
                        searchBooks(text);
                      }}
                      autoFocus
                    />
                    {isSearching && <ActivityIndicator size="small" color={colors.secondary} />}
                  </View>
                  
                  <ScrollView style={styles.searchResults} showsVerticalScrollIndicator={false}>
                    {searchResults.length > 0 ? (
                      searchResults.map((book) => (
                        <TouchableOpacity 
                          key={book.id} 
                          style={styles.searchResultItem}
                          onPress={() => selectSearchResult(book)}
                        >
                          {book.coverImage ? (
                            <Image source={{ uri: book.coverImage }} style={styles.searchResultCover} />
                          ) : (
                            <View style={styles.searchResultCoverPlaceholder}>
                              <BookOpen size={20} color={colors.textSecondary} />
                            </View>
                          )}
                          <View style={styles.searchResultInfo}>
                            <Text style={styles.searchResultTitle} numberOfLines={2}>{book.title}</Text>
                            <Text style={styles.searchResultAuthor} numberOfLines={1}>{book.author}</Text>
                            {book.year && <Text style={styles.searchResultYear}>{book.year}</Text>}
                          </View>
                          <ChevronRight size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                      ))
                    ) : searchQuery.length > 1 && !isSearching ? (
                      <View style={styles.noResults}>
                        <Text style={styles.noResultsText}>No cookbooks found</Text>
                        <Text style={styles.noResultsSubtext}>Try a different search or add manually</Text>
                      </View>
                    ) : (
                      <View style={styles.searchHint}>
                        <BookOpen size={32} color={colors.borderLight} />
                        <Text style={styles.searchHintText}>Search millions of books</Text>
                        <Text style={styles.searchHintSubtext}>Powered by Open Library</Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              )}

              {/* Scan Tab */}
              {addCookbookTab === 'scan' && (
                <View style={styles.tabContent}>
                  {Platform.OS === 'web' ? (
                    <View style={styles.scannerPlaceholder}>
                      <ScanBarcode size={48} color={colors.textSecondary} />
                      <Text style={styles.scannerPlaceholderTitle}>Barcode scanning</Text>
                      <Text style={styles.scannerPlaceholderText}>Available on mobile devices only</Text>
                      <View style={styles.isbnInputContainer}>
                        <Text style={styles.isbnInputLabel}>Or enter ISBN manually:</Text>
                        <View style={styles.isbnInputRow}>
                          <TextInput
                            style={styles.isbnInput}
                            placeholder="978-0-123456-78-9"
                            placeholderTextColor={colors.textSecondary}
                            value={isbnInput}
                            onChangeText={setIsbnInput}
                            keyboardType="number-pad"
                          />
                          <TouchableOpacity 
                            style={[styles.isbnLookupBtn, isLookingUpIsbn && styles.isbnLookupBtnDisabled]}
                            onPress={() => lookupIsbn(isbnInput)}
                            disabled={isLookingUpIsbn}
                          >
                            {isLookingUpIsbn ? (
                              <ActivityIndicator size="small" color={colors.white} />
                            ) : (
                              <Search size={20} color={colors.white} />
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ) : !cameraPermission?.granted ? (
                    <View style={styles.scannerPlaceholder}>
                      <Camera size={48} color={colors.textSecondary} />
                      <Text style={styles.scannerPlaceholderTitle}>Camera Permission Required</Text>
                      <Text style={styles.scannerPlaceholderText}>We need camera access to scan barcodes</Text>
                      <TouchableOpacity style={styles.permissionBtn} onPress={requestCameraPermission}>
                        <Text style={styles.permissionBtnText}>Grant Permission</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.scannerContainer}>
                      {isScannerActive && (
                        <CameraView
                          style={styles.scanner}
                          facing="back"
                          barcodeScannerSettings={{
                            barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'],
                          }}
                          onBarcodeScanned={handleBarcodeScan}
                        />
                      )}
                      <View style={styles.scannerOverlay}>
                        <View style={styles.scannerFrame}>
                          <View style={[styles.scannerCorner, styles.scannerCornerTL]} />
                          <View style={[styles.scannerCorner, styles.scannerCornerTR]} />
                          <View style={[styles.scannerCorner, styles.scannerCornerBL]} />
                          <View style={[styles.scannerCorner, styles.scannerCornerBR]} />
                        </View>
                      </View>
                      {isLookingUpIsbn && (
                        <View style={styles.scannerLoading}>
                          <ActivityIndicator size="large" color={colors.white} />
                          <Text style={styles.scannerLoadingText}>Looking up book...</Text>
                        </View>
                      )}
                      <View style={styles.scannerHint}>
                        <Text style={styles.scannerHintText}>Point camera at the barcode on the back of your cookbook</Text>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Manual Tab */}
              {addCookbookTab === 'manual' && (
                <View style={styles.tabContent}>
                  {selectedBook?.coverImage && (
                    <View style={styles.selectedBookPreview}>
                      <Image source={{ uri: selectedBook.coverImage }} style={styles.selectedBookCover} />
                      <TouchableOpacity 
                        style={styles.clearSelectedBook}
                        onPress={() => setSelectedBook(null)}
                      >
                        <X size={14} color={colors.white} />
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Cookbook Title *</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g., Salt Fat Acid Heat"
                      placeholderTextColor={colors.textSecondary}
                      value={newCookbookTitle}
                      onChangeText={setNewCookbookTitle}
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Author (optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g., Samin Nosrat"
                      placeholderTextColor={colors.textSecondary}
                      value={newCookbookAuthor}
                      onChangeText={setNewCookbookAuthor}
                    />
                  </View>

                  <TouchableOpacity 
                    style={[
                      styles.modalButton,
                      !newCookbookTitle.trim() && styles.modalButtonDisabled
                    ]}
                    onPress={handleAddCookbook}
                    disabled={!newCookbookTitle.trim()}
                  >
                    <BookOpen size={20} color={colors.white} strokeWidth={2.5} />
                    <Text style={styles.modalButtonText}>Add to My Collection</Text>
                  </TouchableOpacity>
                </View>
              )}
              </Pressable>
            </Pressable>
          </KeyboardAvoidingView>
        </Modal>

        {/* Add Idea Modal */}
        <Modal
          visible={showAddIdea}
          transparent
          animationType="fade"
          onRequestClose={closeAddIdea}
        >
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoid}>
            <Pressable 
              style={styles.modalOverlay}
              onPress={closeAddIdea}
            >
              <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{snappedImageUri ? 'Snap a Craving' : 'Add an Idea'}</Text>
                <TouchableOpacity onPress={closeAddIdea}>
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.ideaTypeSelector}>
                <TouchableOpacity 
                  style={[styles.ideaTypeTab, newIdeaType === 'note' && styles.ideaTypeTabActive]}
                  onPress={() => setNewIdeaType('note')}
                >
                  <Edit3 size={16} color={newIdeaType === 'note' ? colors.white : colors.text} />
                  <Text style={[styles.ideaTypeTabText, newIdeaType === 'note' && styles.ideaTypeTabTextActive]}>Note</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.ideaTypeTab, newIdeaType === 'link' && styles.ideaTypeTabActive]}
                  onPress={() => setNewIdeaType('link')}
                >
                  <LinkIcon size={16} color={newIdeaType === 'link' ? colors.white : colors.text} />
                  <Text style={[styles.ideaTypeTabText, newIdeaType === 'link' && styles.ideaTypeTabTextActive]}>Link</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {newIdeaType === 'link' ? 'Paste URL' : 'What do you want to cook?'}
                </Text>
                <TextInput
                  style={[styles.textInput, styles.ideaInput]}
                  placeholder={newIdeaType === 'link' ? 'https://...' : 'e.g., That pasta from the Italian place...'}
                  placeholderTextColor={colors.textSecondary}
                  value={newIdeaContent}
                  onChangeText={setNewIdeaContent}
                  multiline={newIdeaType === 'note'}
                  numberOfLines={newIdeaType === 'note' ? 3 : 1}
                  autoFocus
                />
              </View>

              <TouchableOpacity 
                style={[
                  styles.modalButton,
                  { backgroundColor: '#F59E0B' },
                  !newIdeaContent.trim() && styles.modalButtonDisabled
                ]}
                onPress={async () => {
                  if (!newIdeaContent.trim()) return;
                  const content = newIdeaContent.trim();
                  const type = newIdeaType;
                  setNewIdeaContent('');
                  setShowAddIdea(false);
                  const tempItem: FoodDumpItem = {
                    id: Date.now().toString(),
                    type,
                    content,
                    thumbnail: undefined,
                    source: type === 'link' ? (() => { try { return new URL(content).hostname; } catch { return undefined; } })() : undefined,
                    createdAt: new Date().toISOString(),
                    isProcessed: false,
                  };
                  if (type === 'link' && !canSaveRecipeFromLink()) {
                    setPaywallFeatureName('Save recipes from links');
                    setShowPremiumPaywall(true);
                    return;
                  }
                  if (type === 'link') {
                    incrementFreeRecipeSaves();
                  }
                  processIdea(tempItem);
                }}
                disabled={!newIdeaContent.trim()}
              >
                <Sparkles size={20} color={colors.white} strokeWidth={2.5} />
                <Text style={styles.modalButtonText}>Generate Recipe</Text>
              </TouchableOpacity>
              </Pressable>
            </Pressable>
          </KeyboardAvoidingView>
        </Modal>

        {/* Filter Modal */}
        <Modal
          visible={showFilterModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowFilterModal(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowFilterModal(false)}
          >
            <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filters</Text>
                <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <Text style={styles.filterSectionLabel}>Max Cook Time</Text>
              <View style={styles.filterChipsRow}>
                {[null, 15, 30, 45, 60].map((time) => (
                  <TouchableOpacity
                    key={String(time)}
                    style={[styles.filterOptionChip, filterMaxTime === time && styles.filterOptionChipActive]}
                    onPress={() => { setFilterMaxTime(time); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  >
                    <Text style={[styles.filterOptionText, filterMaxTime === time && styles.filterOptionTextActive]}>
                      {time === null ? 'Any' : `≤${time}m`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterSectionLabel}>Source</Text>
              <View style={styles.filterChipsRow}>
                {([['all', 'All'], ['cookbook', 'Cookbook'], ['diy', 'DIY'], ['web', 'Web']] as const).map(([key, label]) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.filterOptionChip, (key === 'all' ? filterSource === null : filterSource === key) && styles.filterOptionChipActive]}
                    onPress={() => { setFilterSource(key === 'all' ? null : key); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  >
                    <Text style={[styles.filterOptionText, (key === 'all' ? filterSource === null : filterSource === key) && styles.filterOptionTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.filterActions}>
                <TouchableOpacity
                  style={styles.filterClearBtn}
                  onPress={() => { setFilterMaxTime(null); setFilterSource(null); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                >
                  <Text style={styles.filterClearBtnText}>Clear All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.filterApplyBtn}
                  onPress={() => { setShowFilterModal(false); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
                >
                  <Text style={styles.filterApplyBtnText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Recipe Detail Modal */}
        <Modal
          visible={showRecipeDetail && !cookingMode}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={closeRecipeDetail}
        >
          <View style={styles.detailModalContainer}>
            <SafeAreaView style={styles.detailSafeArea} edges={['top']}>
              <View style={styles.detailHeader}>
                <TouchableOpacity onPress={closeRecipeDetail} style={styles.detailCloseBtn}>
                  <X size={24} color={colors.text} strokeWidth={2.5} />
                </TouchableOpacity>
                <Text style={styles.detailHeaderTitle} numberOfLines={1}>Recipe</Text>
                <TouchableOpacity
                  style={styles.detailDeleteBtn}
                  onPress={() => {
                    if (!selectedRecipe) return;
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
                            closeRecipeDetail();
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

              {selectedRecipe && (
                <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false}>
                  <Image source={{ uri: selectedRecipe.image }} style={styles.detailImage} resizeMode="cover" />

                  <View style={styles.detailBody}>
                    <Text style={styles.detailTitle}>{selectedRecipe.title}</Text>

                    {/* Nutritional Badges */}
                    {(() => {
                      const nutri = getNutrition(selectedRecipe);
                      return (
                        <View style={styles.nutritionRow}>
                          <View style={styles.nutritionBadge}>
                            <Zap size={14} color="#E65100" strokeWidth={2.5} />
                            <Text style={styles.nutritionBadgeValue}>{nutri.calories}</Text>
                            <Text style={styles.nutritionBadgeLabel}>Cal</Text>
                          </View>
                          <View style={[styles.nutritionBadge, nutri.saltLevel === 'low' ? styles.nutritionBadgeGreen : nutri.saltLevel === 'medium' ? styles.nutritionBadgeYellow : styles.nutritionBadgeRed]}>
                            <Droplets size={14} color={nutri.saltLevel === 'low' ? '#059669' : nutri.saltLevel === 'medium' ? '#D97706' : '#DC2626'} strokeWidth={2.5} />
                            <Text style={[styles.nutritionBadgeValue, nutri.saltLevel === 'low' ? styles.nutritionTextGreen : nutri.saltLevel === 'medium' ? styles.nutritionTextYellow : styles.nutritionTextRed]}>{nutri.saltLevel === 'low' ? 'Low' : nutri.saltLevel === 'medium' ? 'Med' : 'High'}</Text>
                            <Text style={styles.nutritionBadgeLabel}>Salt</Text>
                          </View>
                          <View style={[styles.nutritionBadge, nutri.sugarLevel === 'low' ? styles.nutritionBadgeGreen : nutri.sugarLevel === 'medium' ? styles.nutritionBadgeYellow : styles.nutritionBadgeRed]}>
                            <Text style={styles.nutritionBadgeIcon}>🍬</Text>
                            <Text style={[styles.nutritionBadgeValue, nutri.sugarLevel === 'low' ? styles.nutritionTextGreen : nutri.sugarLevel === 'medium' ? styles.nutritionTextYellow : styles.nutritionTextRed]}>{nutri.sugarLevel === 'low' ? 'Low' : nutri.sugarLevel === 'medium' ? 'Med' : 'High'}</Text>
                            <Text style={styles.nutritionBadgeLabel}>Sugar</Text>
                          </View>
                        </View>
                      );
                    })()}

                    <View style={styles.detailMetaRow}>
                      <View style={styles.detailMetaItem}>
                        <Clock size={16} color={colors.textSecondary} />
                        <Text style={styles.detailMetaText}>{selectedRecipe.prepTime + selectedRecipe.cookTime} min</Text>
                      </View>
                      <View style={styles.detailMetaItem}>
                        <Users size={16} color={colors.textSecondary} />
                        <Text style={styles.detailMetaText}>{selectedRecipe.servings} servings</Text>
                      </View>
                    </View>

                    {/* Ingredients with Per-Item Pricing */}
                    <Text style={styles.detailSectionTitle}>Ingredients</Text>
                    <View style={styles.ingredientList}>
                      {selectedRecipe.ingredients.map((ing, idx) => (
                        <View key={idx} style={styles.ingredientListItem}>
                          <View style={styles.ingredientListTop}>
                            <Text style={styles.ingredientListEmoji}>{getIngredientEmoji(ing.name)}</Text>
                            <View style={styles.ingredientListInfo}>
                              <Text style={styles.ingredientListName}>{ing.name}</Text>
                              {(ing.amount || ing.unit) && (
                                <Text style={styles.ingredientListAmount}>{ing.amount} {ing.unit}</Text>
                              )}
                            </View>
                          </View>
                          <StorePricePills ingredientName={ing.name} />
                        </View>
                      ))}
                    </View>

                    {/* Store Total Summary */}
                    <RecipePriceSummary ingredients={selectedRecipe.ingredients} />

                    {/* Instructions */}
                    {selectedRecipe.instructions.length > 0 && (
                      <>
                        <Text style={styles.detailSectionTitle}>Instructions</Text>
                        {selectedRecipe.instructions.map((step, idx) => (
                          <View key={idx} style={styles.detailInstructionRow}>
                            <View style={styles.detailInstructionNum}>
                              <Text style={styles.detailInstructionNumText}>{idx + 1}</Text>
                            </View>
                            <Text style={styles.detailInstructionText}>{step}</Text>
                          </View>
                        ))}
                      </>
                    )}

                    <View style={{ height: 120 }} />
                  </View>
                </ScrollView>
              )}

              {selectedRecipe && selectedRecipe.instructions.length > 0 && (
                <View style={styles.detailActions}>
                  <TouchableOpacity
                    style={styles.detailGroceryBtn}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      createGroceryList(`${selectedRecipe.title} Shopping`, [selectedRecipe.id], [selectedRecipe]);
                      Alert.alert(
                        'Grocery List Created',
                        `Shopping list for "${selectedRecipe.title}" is ready!`,
                        [
                          { text: 'OK', style: 'cancel' },
                          { text: 'Go to Grocery List', onPress: () => { setShowRecipeDetail(false); setSelectedRecipe(null); router.push({ pathname: '/(tabs)/kitchen', params: { tab: 'grocery' } }); } },
                        ]
                      );
                    }}
                  >
                    <ShoppingCart size={18} color={colors.secondary} strokeWidth={2.5} />
                    <Text style={styles.detailGroceryBtnText}>Grocery List</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.detailStartCookingBtn} onPress={startCooking}>
                    <Flame size={20} color={colors.white} strokeWidth={2.5} />
                    <Text style={styles.detailStartCookingBtnText}>Start Cooking</Text>
                  </TouchableOpacity>
                </View>
              )}
            </SafeAreaView>
          </View>
        </Modal>

        {/* Cooking Mode Modal */}
        <Modal
          visible={cookingMode && !!selectedRecipe}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setCookingMode(false)}
        >
          {selectedRecipe && (
            <View style={styles.cookingContainer}>
              <SafeAreaView style={styles.cookingSafeArea} edges={['top', 'bottom']}>
                <View style={styles.cookingHeader}>
                  <TouchableOpacity onPress={() => setCookingMode(false)} style={styles.cookingBackBtn}>
                    <X size={24} color={colors.white} strokeWidth={2.5} />
                  </TouchableOpacity>
                  <View style={styles.cookingTitleWrap}>
                    <Text style={styles.cookingTitle} numberOfLines={1}>{selectedRecipe.title}</Text>
                    <Text style={styles.cookingProgress}>Step {currentStep + 1} of {selectedRecipe.instructions.length}</Text>
                  </View>
                  <View style={styles.cookingBackBtn} />
                </View>

                <View style={styles.cookingProgressBar}>
                  <View style={[styles.cookingProgressFill, { width: `${((currentStep + 1) / selectedRecipe.instructions.length) * 100}%` }]} />
                </View>

                <ScrollView style={styles.cookingContent} contentContainerStyle={styles.cookingContentInner} showsVerticalScrollIndicator={false}>
                  <View style={styles.stepCard}>
                    <View style={styles.stepNumberBadge}>
                      <Text style={styles.stepNumberText}>{currentStep + 1}</Text>
                    </View>
                    <Text style={styles.stepInstruction}>{selectedRecipe.instructions[currentStep]}</Text>
                  </View>
                </ScrollView>

                <View style={styles.cookingNav}>
                  <TouchableOpacity
                    style={[styles.cookingNavBtn, currentStep === 0 && styles.cookingNavBtnDisabled]}
                    onPress={() => { if (currentStep > 0) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCurrentStep(s => s - 1); } }}
                    disabled={currentStep === 0}
                  >
                    <Text style={[styles.cookingNavBtnText, currentStep === 0 && styles.cookingNavBtnTextDisabled]}>Previous</Text>
                  </TouchableOpacity>

                  {currentStep === selectedRecipe.instructions.length - 1 ? (
                    <TouchableOpacity style={styles.finishBtn} onPress={() => {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      Alert.alert('🎉 Meal Complete!', `Great job cooking ${selectedRecipe.title}!`, [
                        { text: 'Done', onPress: () => { setCookingMode(false); closeRecipeDetail(); } },
                        { text: 'Cook Another', onPress: () => { setCookingMode(false); closeRecipeDetail(); router.push('/(tabs)/cook-now'); } },
                      ]);
                    }}>
                      <Check size={20} color={colors.white} strokeWidth={3} />
                      <Text style={styles.finishBtnText}>Done!</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={styles.nextBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCurrentStep(s => s + 1); }}>
                      <Text style={styles.nextBtnText}>Next</Text>
                      <ArrowRight size={20} color={colors.primary} strokeWidth={2.5} />
                    </TouchableOpacity>
                  )}
                </View>
              </SafeAreaView>
            </View>
          )}
        </Modal>

        {/* Processing Modal */}
        <Modal
          visible={showProcessing}
          transparent
          animationType="fade"
          onRequestClose={closeProcessingModal}
        >
          <View style={styles.processingOverlay}>
            <View style={styles.processingCard}>
              {processingStep === 'error' ? (
                <>
                  <View style={styles.processingErrorIcon}>
                    <X size={32} color="#EF4444" strokeWidth={2.5} />
                  </View>
                  <Text style={styles.processingTitle}>Oops!</Text>
                  <Text style={styles.processingSubtext}>{processingError}</Text>
                  <TouchableOpacity 
                    style={styles.processingDoneBtn}
                    onPress={closeProcessingModal}
                  >
                    <Text style={styles.processingDoneBtnText}>Close</Text>
                  </TouchableOpacity>
                </>
              ) : processingStep === 'done' ? (
                <>
                  <View style={styles.processingSuccessIcon}>
                    <Check size={32} color={colors.success} strokeWidth={3} />
                  </View>
                  <Text style={styles.processingTitle}>Recipe Created! 🎉</Text>
                  <Text style={styles.processingSubtext}>
                    {generatedRecipe?.title} is ready with a smart grocery list
                  </Text>
                  
                  {generatedRecipe && (
                    <View style={styles.recipePreview}>
                      <View style={styles.recipePreviewHeader}>
                        <ChefHat size={18} color={colors.secondary} strokeWidth={2.5} />
                        <Text style={styles.recipePreviewTitle} numberOfLines={1}>
                          {generatedRecipe.title}
                        </Text>
                      </View>
                      <View style={styles.recipePreviewStats}>
                        <View style={styles.recipePreviewStat}>
                          <Clock size={14} color={colors.textSecondary} />
                          <Text style={styles.recipePreviewStatText}>
                            {generatedRecipe.prepTime + generatedRecipe.cookTime}m
                          </Text>
                        </View>
                        <View style={styles.recipePreviewStat}>
                          <Users size={14} color={colors.textSecondary} />
                          <Text style={styles.recipePreviewStatText}>
                            {generatedRecipe.servings} servings
                          </Text>
                        </View>
                        <View style={styles.recipePreviewStat}>
                          <ListChecks size={14} color={colors.textSecondary} />
                          <Text style={styles.recipePreviewStatText}>
                            {generatedRecipe.ingredients.length} items
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                  
                  <View style={styles.processingDoneBtns}>
                    <TouchableOpacity 
                      style={styles.processingDoneBtn}
                      onPress={() => {
                        if (generatedRecipe) {
                          closeProcessingModal();
                          openRecipeDetail(generatedRecipe);
                        } else {
                          closeProcessingModal();
                        }
                      }}
                    >
                      <BookOpen size={16} color="#fff" strokeWidth={2.5} />
                      <Text style={styles.processingDoneBtnText}>View Recipe</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.processingGroceryBtn}
                      onPress={() => { closeProcessingModal(); router.push({ pathname: '/(tabs)/kitchen', params: { tab: 'grocery' } }); }}
                    >
                      <ShoppingCart size={16} color={colors.secondary} strokeWidth={2.5} />
                      <Text style={styles.processingGroceryBtnText}>Go to Grocery List</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.processingIconWrap}>
                    <ActivityIndicator size="large" color={colors.secondary} />
                  </View>
                  <Text style={styles.processingTitle}>
                    {processingStep === 'analyzing' && 'Analyzing your idea...'}
                    {processingStep === 'generating' && 'Generating recipe...'}
                    {processingStep === 'creating-list' && 'Creating grocery list...'}
                  </Text>
                  <Text style={styles.processingSubtext}>
                    {processingStep === 'analyzing' && (processingItem?.type === 'image' ? 'Analyzing your photo with AI vision...' : `Understanding "${processingItem?.content.substring(0, 40)}${(processingItem?.content.length ?? 0) > 40 ? '...' : ''}"`)}
                    {processingStep === 'generating' && 'Crafting the perfect recipe with ingredients & instructions'}
                    {processingStep === 'creating-list' && 'Building your smart shopping list'}
                  </Text>
                  
                  <View style={styles.processingSteps}>
                    <View style={[styles.processingStepItem, processingStep === 'analyzing' && styles.processingStepActive, (processingStep === 'generating' || processingStep === 'creating-list') && styles.processingStepDone]}>
                      <View style={[styles.processingStepDot, processingStep === 'analyzing' && styles.processingStepDotActive, (processingStep === 'generating' || processingStep === 'creating-list') && styles.processingStepDotDone]} />
                      <Text style={[styles.processingStepText, processingStep === 'analyzing' && styles.processingStepTextActive]}>Analyze</Text>
                    </View>
                    <View style={styles.processingStepLine} />
                    <View style={[styles.processingStepItem, processingStep === 'generating' && styles.processingStepActive, processingStep === 'creating-list' && styles.processingStepDone]}>
                      <View style={[styles.processingStepDot, processingStep === 'generating' && styles.processingStepDotActive, processingStep === 'creating-list' && styles.processingStepDotDone]} />
                      <Text style={[styles.processingStepText, processingStep === 'generating' && styles.processingStepTextActive]}>Recipe</Text>
                    </View>
                    <View style={styles.processingStepLine} />
                    <View style={[styles.processingStepItem, processingStep === 'creating-list' && styles.processingStepActive]}>
                      <View style={[styles.processingStepDot, processingStep === 'creating-list' && styles.processingStepDotActive]} />
                      <Text style={[styles.processingStepText, processingStep === 'creating-list' && styles.processingStepTextActive]}>Grocery List</Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>

      <Modal
        visible={showRecipeSelection}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRecipeSelection(false)}
      >
        <View style={styles.recipeSelectionOverlay}>
          <View style={styles.recipeSelectionCard}>
            <View style={styles.recipeSelectionHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.recipeSelectionTitle}>Recipes Found</Text>
                <Text style={styles.recipeSelectionSubtitle}>
                  {previewCookbookTitle}{previewCookbookAuthor ? ` by ${previewCookbookAuthor}` : ''}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowRecipeSelection(false)}
                style={styles.recipeSelectionClose}
              >
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.recipeSelectionActions}>
              <TouchableOpacity onPress={toggleAllPreviews} style={styles.selectAllBtn}>
                <View style={[
                  styles.previewCheckbox,
                  selectedPreviewIndices.size === cookbookPreviewRecipes.length && styles.previewCheckboxChecked,
                ]}>
                  {selectedPreviewIndices.size === cookbookPreviewRecipes.length && (
                    <Check size={12} color={colors.white} strokeWidth={3} />
                  )}
                </View>
                <Text style={styles.selectAllText}>
                  {selectedPreviewIndices.size === cookbookPreviewRecipes.length ? 'Deselect All' : 'Select All'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.selectedCountText}>
                {selectedPreviewIndices.size} of {cookbookPreviewRecipes.length} selected
              </Text>
            </View>

            <ScrollView style={styles.recipeSelectionList} showsVerticalScrollIndicator={false}>
              {cookbookPreviewRecipes.map((recipe, index) => {
                const isSelected = selectedPreviewIndices.has(index);
                return (
                  <TouchableOpacity
                    key={`${recipe.title}-${index}`}
                    style={[
                      styles.previewRecipeRow,
                      isSelected && styles.previewRecipeRowSelected,
                    ]}
                    onPress={() => togglePreviewRecipe(index)}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.previewCheckbox,
                      isSelected && styles.previewCheckboxChecked,
                    ]}>
                      {isSelected && (
                        <Check size={12} color={colors.white} strokeWidth={3} />
                      )}
                    </View>
                    <View style={styles.previewRecipeInfo}>
                      <Text style={styles.previewRecipeTitle} numberOfLines={1}>{recipe.title}</Text>
                      <Text style={styles.previewRecipeDesc} numberOfLines={2}>{recipe.description}</Text>
                    </View>
                    {recipe.pageNumber && (
                      <View style={styles.previewPageBadge}>
                        <Text style={styles.previewPageText}>p.{recipe.pageNumber}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.addSelectedBtn,
                selectedPreviewIndices.size === 0 && styles.addSelectedBtnDisabled,
              ]}
              onPress={generateSelectedRecipes}
              disabled={selectedPreviewIndices.size === 0}
            >
              <Sparkles size={18} color={colors.white} strokeWidth={2.5} />
              <Text style={styles.addSelectedBtnText}>
                Add {selectedPreviewIndices.size} Recipe{selectedPreviewIndices.size !== 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <PageCoachMarks
        visible={showPageTutorial}
        onComplete={() => {
          setShowPageTutorial(false);
          completePageTutorial('recipes');
        }}
        steps={RECIPES_STEPS}
        pageTitle="RECIPES"
      />

      <PremiumPaywall
        visible={showPremiumPaywall}
        onClose={() => setShowPremiumPaywall(false)}
        featureName={paywallFeatureName}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: colors.text,
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topPanel: {
    paddingBottom: 14,
  },
  filterScroll: {
    maxHeight: 48,
    marginBottom: 10,
  },
  chipHintRow: {
    paddingHorizontal: 20,
  },
  hintPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.cardAlt,
    borderWidth: 2,
    borderColor: colors.borderLight,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  hintText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: colors.textSecondary,
  },
  filterContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.borderLight,
  },
  filterChipActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.white,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  recipesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  recipeCard: {
    width: '47%',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 18,
    overflow: 'hidden',
  },
  recipeCardRotateLeft: {
    transform: [{ rotate: '-1deg' }],
  },
  recipeCardRotateRight: {
    transform: [{ rotate: '1deg' }],
  },
  recipeImageWrap: {
    position: 'relative',
  },
  recipeImage: {
    width: '100%',
    height: 130,
    backgroundColor: colors.cardAlt,
  },
  recipeImagePlaceholder: {
    width: '100%',
    height: 130,
    backgroundColor: colors.cardAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 40,
  },
  savingsBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.success,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  savingsText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: colors.white,
  },
  recipeInfo: {
    padding: 12,
  },
  recipeTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  recipeMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  emptyScroll: {
    flex: 1,
  },
  emptyScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  quickStartSection: {
    marginBottom: 20,
  },
  quickStartTitle: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  quickStartGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  quickStartCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    position: 'relative',
  },
  quickStartIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickStartLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 17,
  },
  quickStartBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.text,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  quickStartBadgeText: {
    fontSize: 9,
    fontWeight: '800' as const,
    color: colors.white,
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
  emptyPattern: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 60,
    gap: 8,
    padding: 12,
  },
  patternDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.comic.yellow,
  },
  emptyTotie: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.white,
  },
  filterEmptyCard: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  filterEmptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  filterEmptyTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  filterEmptySubtext: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  filterEmptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  filterEmptyButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.white,
  },
  filterEmptyTip: {
    backgroundColor: colors.cardAlt,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.borderLight,
  },
  filterEmptyTipLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 4,
  },
  filterEmptyTipText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  filterEmptySavings: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.borderLight,
  },
  filterEmptySavingsTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  filterEmptySavingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  filterEmptySavingsItem: {
    alignItems: 'center',
  },
  filterEmptySavingsValue: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: colors.text,
  },
  filterEmptySavingsLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    marginTop: 2,
  },
  filterEmptySavingsArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cardAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterEmptySavingsArrowText: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  filterEmptyQuickIdeas: {
    backgroundColor: '#FFF8E1',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#FFE082',
  },
  filterEmptyQuickTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 12,
  },
  filterEmptyQuickList: {
    gap: 8,
  },
  filterEmptyQuickItem: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  filterEmptyFavTip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCE4EC',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 2,
    borderColor: '#F8BBD9',
  },
  filterEmptyFavTipIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterEmptyFavTipText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#880E4F',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: colors.secondary,
    borderWidth: 2,
    borderColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  addMenuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 98,
  },
  addMenu: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 18,
    padding: 8,
    width: 220,
    shadowColor: colors.black,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
    zIndex: 99,
  },
  addMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
  },
  addMenuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addMenuContent: {
    flex: 1,
  },
  addMenuTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.text,
  },
  addMenuSubtext: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  bottomPadding: {
    height: 100,
  },
  cookbooksScrollContent: {
    paddingBottom: 100,
  },
  bookshelfHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  bookshelfTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  bookshelfTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: colors.text,
  },
  bookshelfSubtitle: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  addCookbookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.black,
    borderStyle: 'dashed',
  },
  addCookbookIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.secondaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addCookbookText: {
    flex: 1,
  },
  addCookbookTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
  },
  addCookbookSubtext: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  bookshelfGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  cookbookCard: {
    width: '47%',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  cookbookCardLeft: {
    transform: [{ rotate: '-1deg' }],
  },
  cookbookSpine: {
    width: 8,
  },
  cookbookCover: {
    flex: 1,
  },
  cookbookImage: {
    width: '100%',
    height: 100,
  },
  cookbookPlaceholder: {
    width: '100%',
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cookbookInfo: {
    padding: 10,
  },
  cookbookTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.text,
    lineHeight: 18,
    marginBottom: 2,
  },
  cookbookAuthor: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  cookbookMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cookbookRecipeCount: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.secondary,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.secondary,
    borderWidth: 2,
    borderColor: colors.white,
  },
  cookbookRecipesSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  cookbookRecipesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cookbookRecipesTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
  },
  noCookbookRecipes: {
    backgroundColor: colors.cardAlt,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  noCookbookRecipesText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  noCookbookRecipesSubtext: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  cookbookGenerating: {
    backgroundColor: colors.cardAlt,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center' as const,
    gap: 12,
  },
  cookbookGeneratingTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.text,
    textAlign: 'center' as const,
    marginTop: 4,
  },
  cookbookGeneratingProgress: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.secondary,
    textAlign: 'center' as const,
  },
  cookbookGenCountBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: 'rgba(0,105,92,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 4,
  },
  cookbookGenCountText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.secondary,
  },
  generateCookbookBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.secondary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 12,
  },
  generateCookbookBtnText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.white,
  },
  emptyCookbookState: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.black,
    padding: 32,
    alignItems: 'center',
  },
  emptyCookbookTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyCookbookText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  pageBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  pageText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: colors.white,
  },
  cookbookSource: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  cookbookSourceText: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    flex: 1,
  },
  quickStartGridSecond: {
    marginTop: 10,
  },
  quickStartCardWide: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.black,
    width: '100%',
    maxWidth: 400,
    padding: 24,
  },
  modalContentLarge: {
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.black,
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    padding: 24,
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: colors.cardAlt,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: colors.text,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.text,
  },
  tabTextActive: {
    color: colors.white,
  },
  tabContent: {
    minHeight: 280,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.borderLight,
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.text,
  },
  searchResults: {
    flex: 1,
    maxHeight: 220,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.cardAlt,
    borderRadius: 12,
    marginBottom: 8,
  },
  searchResultCover: {
    width: 50,
    height: 70,
    borderRadius: 6,
    backgroundColor: colors.borderLight,
  },
  searchResultCoverPlaceholder: {
    width: 50,
    height: 70,
    borderRadius: 6,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResultInfo: {
    flex: 1,
    marginLeft: 12,
  },
  searchResultTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 2,
  },
  searchResultAuthor: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  searchResultYear: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    marginTop: 2,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  noResultsSubtext: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  searchHint: {
    alignItems: 'center',
    paddingVertical: 50,
    gap: 8,
  },
  searchHintText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  searchHintSubtext: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.borderLight,
  },
  scannerPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 8,
  },
  scannerPlaceholderTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    marginTop: 8,
  },
  scannerPlaceholderText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  isbnInputContainer: {
    width: '100%',
    marginTop: 24,
  },
  isbnInputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 8,
  },
  isbnInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  isbnInput: {
    flex: 1,
    backgroundColor: colors.cardAlt,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.borderLight,
    padding: 14,
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.text,
  },
  isbnLookupBtn: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.black,
  },
  isbnLookupBtnDisabled: {
    opacity: 0.6,
  },
  permissionBtn: {
    marginTop: 16,
    backgroundColor: colors.secondary,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.black,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  permissionBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.white,
  },
  scannerContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  scanner: {
    flex: 1,
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 220,
    height: 120,
    position: 'relative',
  },
  scannerCorner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: colors.white,
  },
  scannerCornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  scannerCornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  scannerCornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  scannerCornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  scannerLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  scannerLoadingText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.white,
  },
  scannerHint: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    padding: 12,
  },
  scannerHintText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.white,
    textAlign: 'center',
  },
  selectedBookPreview: {
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  selectedBookCover: {
    width: 80,
    height: 110,
    borderRadius: 8,
    backgroundColor: colors.borderLight,
  },
  clearSelectedBook: {
    position: 'absolute',
    top: -6,
    right: '35%',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: colors.text,
  },
  modalBody: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.cardAlt,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.borderLight,
    padding: 14,
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.text,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.secondary,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.black,
    paddingVertical: 16,
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.white,
  },
  foodDumpHeader: {
    marginBottom: 16,
  },
  foodDumpTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  foodDumpTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: colors.text,
  },
  foodDumpSubtitle: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  addIdeaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.black,
    borderStyle: 'dashed',
  },
  addIdeaIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addIdeaText: {
    flex: 1,
  },
  addIdeaTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
  },
  addIdeaSubtext: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  ideasList: {
    marginBottom: 20,
  },
  ideasListTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ideaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.borderLight,
    marginBottom: 10,
  },
  ideaTypeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ideaContent: {
    flex: 1,
  },
  ideaText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
    lineHeight: 20,
  },
  ideaSourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ideaSource: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  ideaActions: {
    flexDirection: 'row',
    gap: 8,
  },
  ideaActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.secondaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ideaDeleteBtn: {
    backgroundColor: '#FEE2E2',
  },
  foodDumpEmptyCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.black,
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
  },
  foodDumpEmptyTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  foodDumpEmptyText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  foodDumpTips: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#FCD34D',
  },
  foodDumpTipsTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 12,
  },
  foodDumpTipsList: {
    gap: 8,
  },
  foodDumpTipItem: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#92400E',
  },
  ideaTypeSelector: {
    flexDirection: 'row',
    backgroundColor: colors.cardAlt,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  ideaTypeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  ideaTypeTabActive: {
    backgroundColor: colors.text,
  },
  ideaTypeTabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  ideaTypeTabTextActive: {
    color: colors.white,
  },
  ideaInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  processingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  processingCard: {
    backgroundColor: colors.white,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.black,
    padding: 32,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  processingIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.secondaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  processingSuccessIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  processingErrorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  processingTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  processingSubtext: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  processingSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  processingStepItem: {
    alignItems: 'center',
    gap: 6,
  },
  processingStepActive: {},
  processingStepDone: {},
  processingStepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.borderLight,
  },
  processingStepDotActive: {
    backgroundColor: colors.secondary,
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  processingStepDotDone: {
    backgroundColor: colors.success,
  },
  processingStepLine: {
    width: 24,
    height: 2,
    backgroundColor: colors.borderLight,
    marginBottom: 18,
  },
  processingStepText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  processingStepTextActive: {
    color: colors.secondary,
    fontWeight: '700' as const,
  },
  processingDoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.secondary,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.black,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginTop: 8,
  },
  processingDoneBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.white,
  },
  processingDoneBtns: {
    gap: 10,
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
  },
  processingGroceryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.secondary,
    backgroundColor: 'transparent',
  },
  processingGroceryBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.secondary,
  },
  recipePreview: {
    backgroundColor: colors.cardAlt,
    borderRadius: 16,
    padding: 16,
    width: '100%',
    marginBottom: 20,
  },
  recipePreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  recipePreviewTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
    flex: 1,
  },
  recipePreviewStats: {
    flexDirection: 'row',
    gap: 16,
  },
  recipePreviewStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recipePreviewStatText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  processedSection: {
    marginBottom: 20,
  },
  processedSectionTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.success,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  processedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#BBF7D0',
    marginBottom: 8,
  },
  processedCardIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  processedCardContent: {
    flex: 1,
  },
  processedCardText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  processedCardRecipe: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.success,
    marginTop: 2,
  },
  nutriBadgesRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  nutriBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF3E0',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  nutriBadgeSalt: {
    backgroundColor: '#E8F5E9',
  },
  nutriBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#E65100',
  },
  nutriBadgeTextSmall: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#2E7D32',
  },
  detailModalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  detailSafeArea: {
    flex: 1,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  detailCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.cardAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailDeleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailHeaderTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  detailScroll: {
    flex: 1,
  },
  detailImage: {
    width: '100%',
    height: 220,
    backgroundColor: colors.cardAlt,
  },
  detailBody: {
    padding: 20,
  },
  detailTitle: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  nutritionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  nutritionBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  nutritionBadgeGreen: {
    backgroundColor: '#E8F5E9',
    borderColor: '#C8E6C9',
  },
  nutritionBadgeYellow: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFE082',
  },
  nutritionBadgeRed: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FFCDD2',
  },
  nutritionBadgeIcon: {
    fontSize: 14,
  },
  nutritionBadgeValue: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#E65100',
  },
  nutritionBadgeLabel: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  nutritionTextGreen: {
    color: '#059669',
  },
  nutritionTextYellow: {
    color: '#D97706',
  },
  nutritionTextRed: {
    color: '#DC2626',
  },
  detailMetaRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 24,
  },
  detailMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailMetaText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  detailSectionTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: colors.text,
    marginBottom: 14,
    marginTop: 8,
  },
  ingredientList: {
    gap: 10,
    marginBottom: 24,
  },
  ingredientListItem: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    borderRadius: 14,
    padding: 14,
  },
  ingredientListTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ingredientListEmoji: {
    fontSize: 28,
  },
  ingredientListInfo: {
    flex: 1,
  },
  ingredientListName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.text,
    textTransform: 'capitalize' as const,
  },
  ingredientListAmount: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    marginTop: 2,
  },
  detailInstructionRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detailInstructionNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  detailInstructionNumText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: colors.white,
  },
  detailInstructionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500' as const,
    color: colors.text,
    lineHeight: 22,
  },
  detailActions: {
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
  detailGroceryBtn: {
    flex: 0.8,
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
  detailGroceryBtnText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.secondary,
  },
  detailStartCookingBtn: {
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
  detailStartCookingBtnText: {
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
    overflow: 'hidden' as const,
  },
  cookingProgressFill: {
    height: '100%' as const,
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
    alignSelf: 'flex-start' as const,
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
  headerBtnActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  searchBarContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  searchBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 14,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchBarInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.text,
  },
  filterSectionLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 10,
    marginTop: 8,
  },
  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  filterOptionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.cardAlt,
    borderWidth: 2,
    borderColor: colors.borderLight,
  },
  filterOptionChipActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  filterOptionTextActive: {
    color: colors.white,
  },
  filterActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  filterClearBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.borderLight,
    alignItems: 'center',
  },
  filterClearBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.textSecondary,
  },
  filterApplyBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.secondary,
    borderWidth: 2,
    borderColor: colors.black,
    alignItems: 'center',
  },
  filterApplyBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.white,
  },
  addManuallyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.black,
    gap: 12,
  },
  addManuallyIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addManuallyText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
  },
  myRecipesEmptyCard: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.black,
    padding: 24,
    alignItems: 'center',
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  myRecipesEmptyDots: {
    position: 'absolute' as const,
    top: 16,
    right: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 30,
    gap: 4,
  },
  emptyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  myRecipesEmptyImage: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  myRecipesEmptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 8,
  },
  myRecipesEmptySubtext: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  myRecipesEmptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  myRecipesEmptyButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.white,
  },
  allEmptyScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  premiumHeroCard: {
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  premiumHeroInner: {
    backgroundColor: '#FFF5EE',
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 16,
    position: 'relative' as const,
    overflow: 'hidden' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(255,107,74,0.12)',
  },
  heroGlowOrb1: {
    position: 'absolute' as const,
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,107,74,0.08)',
  },
  heroGlowOrb2: {
    position: 'absolute' as const,
    bottom: -20,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,179,71,0.08)',
  },
  heroRingOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,107,74,0.06)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 0,
  },
  heroRingInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    shadowColor: '#FF6B4A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  floatingPillsContainer: {
    width: '100%',
    alignItems: 'center' as const,
    position: 'relative' as const,
    paddingTop: 20,
    paddingBottom: 20,
    minHeight: 168,
    justifyContent: 'center' as const,
  },
  floatingPill: {
    position: 'absolute' as const,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: 'rgba(255,107,74,0.1)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 16,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  floatingPillTopLeft: {
    top: 2,
    left: 2,
    transform: [{ rotate: '-5deg' }],
  },
  floatingPillTopRight: {
    top: 6,
    right: 4,
    transform: [{ rotate: '4deg' }],
  },
  floatingPillLeft: {
    top: '42%',
    left: -4,
    transform: [{ rotate: '-3deg' }],
  },
  floatingPillRight: {
    top: '38%',
    right: -2,
    transform: [{ rotate: '5deg' }],
  },
  floatingPillBottomLeft: {
    bottom: 2,
    left: 8,
    transform: [{ rotate: '3deg' }],
  },
  floatingPillBottomRight: {
    bottom: 6,
    right: 4,
    transform: [{ rotate: '-4deg' }],
  },
  heroTagText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: colors.primary,
    letterSpacing: 0.2,
  },
  premiumHeroImage: {
    width: 76,
    height: 76,
  },
  premiumTitleSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  premiumTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: colors.text,
    letterSpacing: -0.8,
    marginBottom: 10,
    textAlign: 'center' as const,
  },
  premiumSubtitle: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 24,
    paddingHorizontal: 12,
  },
  premiumActions: {
    gap: 12,
    marginBottom: 24,
  },
  premiumActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  premiumActionGlow: {
    position: 'absolute' as const,
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,107,53,0.06)',
  },
  premiumActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  premiumActionContent: {
    flex: 1,
  },
  premiumActionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  premiumActionSubtext: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  premiumActionArrow: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,107,53,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumStatsCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  premiumStatsInner: {
    flexDirection: 'row',
    paddingVertical: 22,
    paddingHorizontal: 12,
  },
  premiumStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  premiumStatIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.cardAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  premiumStatValue: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  premiumStatLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  premiumStatDivider: {
    width: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 8,
  },
  featuredCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden' as const,
    borderWidth: 2,
    borderColor: colors.black,
    backgroundColor: colors.text,
  },
  featuredImage: {
    width: '100%',
    height: 200,
  },
  featuredOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    padding: 16,
    justifyContent: 'space-between',
  },
  featuredBadge: {
    alignSelf: 'flex-start' as const,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  featuredBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: colors.text,
  },
  featuredContent: {
    marginTop: 'auto' as const,
  },
  featuredTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: colors.white,
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  featuredMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  featuredMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  featuredMetaText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.white,
  },
  recipeCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  recipeCountText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.text,
  },
  recipeCountDots: {
    flexDirection: 'row',
    gap: 4,
  },
  recipeCountDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  recipeCalorieBadge: {
    position: 'absolute' as const,
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  recipeCalorieText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#E65100',
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
  },
  keyboardAvoid: {
    flex: 1,
  },
  snappedImagePreview: {
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  snappedImage: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    backgroundColor: colors.cardAlt,
  },
  removeSnappedImage: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  browseMoreBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 8,
    borderWidth: 2,
    borderColor: colors.secondary,
    borderRadius: 14,
    borderStyle: 'dashed' as const,
  },
  browseMoreBtnText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.secondary,
  },
  recipeSelectionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end' as const,
  },
  recipeSelectionCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    paddingTop: 20,
    paddingBottom: 32,
  },
  recipeSelectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  recipeSelectionTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: colors.text,
    letterSpacing: -0.3,
  },
  recipeSelectionSubtitle: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    marginTop: 2,
  },
  recipeSelectionClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cardAlt,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  recipeSelectionActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  selectAllBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  selectedCountText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  recipeSelectionList: {
    paddingHorizontal: 20,
    maxHeight: 400,
  },
  previewRecipeRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginTop: 4,
    gap: 12,
  },
  previewRecipeRowSelected: {
    backgroundColor: 'rgba(0,105,92,0.06)',
  },
  previewCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.borderLight,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  previewCheckboxChecked: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  previewRecipeInfo: {
    flex: 1,
  },
  previewRecipeTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 2,
  },
  previewRecipeDesc: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  previewPageBadge: {
    backgroundColor: colors.cardAlt,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  previewPageText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: colors.textSecondary,
  },
  addSelectedBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: colors.secondary,
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 16,
  },
  addSelectedBtnDisabled: {
    opacity: 0.4,
  },
  addSelectedBtnText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: colors.white,
  },
});
