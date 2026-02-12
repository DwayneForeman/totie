import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, TextInput, Alert, Platform, KeyboardAvoidingView, ActivityIndicator, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Camera, Mic, Search, Trash2, ShoppingCart, Check, X, Package, Edit3, Square, ChefHat, ArrowRight } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useApp } from '@/context/AppContext';
import colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { generateObject } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';
import { PantryItem, GroceryItem } from '@/types';
import { RecipePriceSummary, StorePricePills } from '@/components/StorePricePills';
import PageCoachMarks, { PageCoachStep } from '@/components/PageCoachMarks';
import PremiumPaywall from '@/components/PremiumPaywall';

type Location = 'fridge' | 'pantry' | 'grocery';
type AddMode = 'search' | 'voice' | 'manual';

const categoryEmojis: Record<string, string> = {
  produce: '🥬',
  dairy: '🥛',
  protein: '🥩',
  grains: '🌾',
  pantry: '🥫',
  frozen: '🧊',
  other: '📦',
};

const categoryOptions: { key: PantryItem['category']; label: string; emoji: string }[] = [
  { key: 'produce', label: 'Produce', emoji: '🥬' },
  { key: 'dairy', label: 'Dairy', emoji: '🥛' },
  { key: 'protein', label: 'Protein', emoji: '🥩' },
  { key: 'grains', label: 'Grains', emoji: '🌾' },
  { key: 'pantry', label: 'Pantry', emoji: '🥫' },
  { key: 'frozen', label: 'Frozen', emoji: '🧊' },
  { key: 'other', label: 'Other', emoji: '📦' },
];

const commonItems: { name: string; category: PantryItem['category']; emoji: string }[] = [
  { name: 'Eggs', category: 'dairy', emoji: '🥚' },
  { name: 'Milk', category: 'dairy', emoji: '🥛' },
  { name: 'Butter', category: 'dairy', emoji: '🧈' },
  { name: 'Chicken', category: 'protein', emoji: '🍗' },
  { name: 'Beef', category: 'protein', emoji: '🥩' },
  { name: 'Salmon', category: 'protein', emoji: '🐟' },
  { name: 'Spinach', category: 'produce', emoji: '🥬' },
  { name: 'Tomatoes', category: 'produce', emoji: '🍅' },
  { name: 'Onions', category: 'produce', emoji: '🧅' },
  { name: 'Garlic', category: 'produce', emoji: '🧄' },
  { name: 'Carrots', category: 'produce', emoji: '🥕' },
  { name: 'Lemons', category: 'produce', emoji: '🍋' },
  { name: 'Rice', category: 'grains', emoji: '🍚' },
  { name: 'Pasta', category: 'grains', emoji: '🍝' },
  { name: 'Bread', category: 'grains', emoji: '🍞' },
  { name: 'Tortillas', category: 'grains', emoji: '🫓' },
  { name: 'Olive Oil', category: 'pantry', emoji: '🫒' },
  { name: 'Soy Sauce', category: 'pantry', emoji: '🥫' },
  { name: 'Beans', category: 'pantry', emoji: '🫘' },
  { name: 'Tomato Sauce', category: 'pantry', emoji: '🍅' },
  { name: 'Cheese', category: 'dairy', emoji: '🧀' },
  { name: 'Yogurt', category: 'dairy', emoji: '🥛' },
  { name: 'Bacon', category: 'protein', emoji: '🥓' },
  { name: 'Tofu', category: 'protein', emoji: '🧈' },
];

const itemEmojiMap: Record<string, string> = commonItems.reduce((acc, item) => {
  acc[item.name.toLowerCase()] = item.emoji;
  return acc;
}, {} as Record<string, string>);

const keywordEmojiMap: { keywords: string[]; emoji: string }[] = [
  { keywords: ['chicken', 'poultry'], emoji: '🍗' },
  { keywords: ['beef', 'steak', 'ground beef'], emoji: '🥩' },
  { keywords: ['pork', 'ham', 'bacon'], emoji: '🥓' },
  { keywords: ['salmon', 'fish', 'tuna', 'shrimp', 'cod', 'tilapia'], emoji: '🐟' },
  { keywords: ['egg'], emoji: '🥚' },
  { keywords: ['milk', 'cream', 'yogurt'], emoji: '🥛' },
  { keywords: ['butter'], emoji: '🧈' },
  { keywords: ['cheese', 'mozzarella', 'parmesan', 'cheddar'], emoji: '🧀' },
  { keywords: ['tomato', 'marinara'], emoji: '🍅' },
  { keywords: ['onion', 'shallot'], emoji: '🧅' },
  { keywords: ['garlic'], emoji: '🧄' },
  { keywords: ['carrot'], emoji: '🥕' },
  { keywords: ['lemon', 'lime', 'citrus'], emoji: '🍋' },
  { keywords: ['pepper', 'chili', 'jalapeño', 'cayenne', 'paprika'], emoji: '🌶️' },
  { keywords: ['basil', 'spinach', 'lettuce', 'kale', 'arugula', 'greens', 'herb'], emoji: '🥬' },
  { keywords: ['cilantro', 'parsley', 'dill', 'rosemary', 'thyme', 'oregano', 'mint'], emoji: '🌿' },
  { keywords: ['rice'], emoji: '🍚' },
  { keywords: ['pasta', 'spaghetti', 'noodle', 'penne', 'macaroni'], emoji: '🍝' },
  { keywords: ['bread', 'bun', 'roll'], emoji: '🍞' },
  { keywords: ['tortilla', 'wrap', 'flatbread', 'naan', 'pita'], emoji: '🫓' },
  { keywords: ['olive', 'oil'], emoji: '🫒' },
  { keywords: ['bean', 'lentil', 'chickpea'], emoji: '🫘' },
  { keywords: ['soy sauce', 'sauce'], emoji: '🥫' },
  { keywords: ['salt'], emoji: '🧂' },
  { keywords: ['sugar', 'honey', 'syrup', 'sweetener'], emoji: '🍯' },
  { keywords: ['flour', 'baking'], emoji: '🌾' },
  { keywords: ['potato', 'sweet potato'], emoji: '🥔' },
  { keywords: ['corn'], emoji: '🌽' },
  { keywords: ['mushroom'], emoji: '🍄' },
  { keywords: ['avocado', 'guacamole'], emoji: '🥑' },
  { keywords: ['cucumber', 'pickle'], emoji: '🥒' },
  { keywords: ['broccoli', 'cauliflower'], emoji: '🥦' },
  { keywords: ['apple'], emoji: '🍎' },
  { keywords: ['banana'], emoji: '🍌' },
  { keywords: ['strawberry', 'berry', 'blueberry', 'raspberry'], emoji: '🍓' },
  { keywords: ['orange', 'tangerine', 'mandarin'], emoji: '🍊' },
  { keywords: ['grape'], emoji: '🍇' },
  { keywords: ['peach', 'nectarine', 'apricot'], emoji: '🍑' },
  { keywords: ['pineapple'], emoji: '🍍' },
  { keywords: ['coconut'], emoji: '🥥' },
  { keywords: ['tofu', 'tempeh'], emoji: '🧈' },
  { keywords: ['vinegar'], emoji: '🫙' },
  { keywords: ['cinnamon', 'cumin', 'turmeric', 'spice', 'seasoning', 'powder'], emoji: '🫙' },
  { keywords: ['water', 'broth', 'stock'], emoji: '💧' },
  { keywords: ['wine', 'beer'], emoji: '🍷' },
  { keywords: ['chocolate', 'cocoa'], emoji: '🍫' },
  { keywords: ['nut', 'almond', 'walnut', 'pecan', 'peanut', 'cashew'], emoji: '🥜' },
];

const getItemEmoji = (name: string, category: string): string => {
  const lower = name.toLowerCase();
  if (itemEmojiMap[lower]) return itemEmojiMap[lower];
  for (const entry of keywordEmojiMap) {
    for (const keyword of entry.keywords) {
      if (lower.includes(keyword)) return entry.emoji;
    }
  }
  return categoryEmojis[category] || '🍽️';
};

export default function KitchenTab() {
  const { pantryItems, addPantryItem, deletePantryItem, groceryLists, toggleGroceryItem, getActiveGroceryList, deleteGroceryList, isPremium } = useApp();
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<Location>('fridge');

  useEffect(() => {
    if (params.tab === 'grocery') {
      setActiveTab('grocery');
    }
  }, [params.tab]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<AddMode>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualQuantity, setManualQuantity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PantryItem['category']>('other');

  const [expandedRecipes, setExpandedRecipes] = useState<Set<string>>(new Set());
  const [groceryGroupBy, setGroceryGroupBy] = useState<'category' | 'recipe'>('recipe');
  const { isPageTutorialComplete, completePageTutorial } = useApp();
  const [showPageTutorial, setShowPageTutorial] = useState(false);
  const [pendingItems, setPendingItems] = useState<{name: string; category: PantryItem['category']; selected: boolean}[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isProcessingScan, setIsProcessingScan] = useState(false);
  const [showPremiumPaywall, setShowPremiumPaywall] = useState(false);
  const [paywallFeatureName, setPaywallFeatureName] = useState<string | undefined>(undefined);
  const [pendingScanSource, setPendingScanSource] = useState<'camera' | 'gallery' | null>(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<any[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const KITCHEN_STEPS: PageCoachStep[] = [
    {
      id: 'kitchen-welcome',
      title: 'Your Kitchen Inventory 🧊',
      emoji: '🏠',
      message: 'This is your virtual kitchen! Track everything in your fridge, pantry, and grocery list right here.',
    },
    {
      id: 'kitchen-tabs',
      title: 'Fridge, Pantry & Grocery',
      emoji: '📋',
      message: 'Switch between Fridge (perishables), Pantry (dry goods), and Grocery (your shopping list) using the tabs at the top.',
    },
    {
      id: 'kitchen-add',
      title: 'Adding Items',
      emoji: '➕',
      message: 'Tap the + button to add items. You can search, type multiple items at once, or add manually with categories.',
    },
    {
      id: 'kitchen-grocery',
      title: 'Smart Grocery Lists',
      emoji: '🛒',
      message: 'When you save recipes, grocery lists are auto-generated! Check off items as you shop — they automatically move to your kitchen.',
    },
  ];

  React.useEffect(() => {
    if (!isPageTutorialComplete('kitchen')) {
      const timer = setTimeout(() => setShowPageTutorial(true), 800);
      return () => clearTimeout(timer);
    }
  }, [isPageTutorialComplete]);

  const filteredItems = useMemo(() => pantryItems.filter(item => item.location === activeTab), [pantryItems, activeTab]);

  const groupedItems = useMemo(() => {
    return filteredItems.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, typeof filteredItems>);
  }, [filteredItems]);

  const quickAddSuggestions = useMemo(
    () =>
      activeTab === 'fridge'
        ? [
            { label: '🥚 Eggs', name: 'Eggs', category: 'dairy' as const },
            { label: '🥛 Milk', name: 'Milk', category: 'dairy' as const },
            { label: '🧈 Butter', name: 'Butter', category: 'dairy' as const },
            { label: '🍗 Chicken', name: 'Chicken', category: 'protein' as const },
            { label: '🥬 Spinach', name: 'Spinach', category: 'produce' as const },
            { label: '🍋 Lemons', name: 'Lemons', category: 'produce' as const },
          ]
        : [
            { label: '🍚 Rice', name: 'Rice', category: 'grains' as const },
            { label: '🍝 Pasta', name: 'Pasta', category: 'grains' as const },
            { label: '🫘 Beans', name: 'Beans', category: 'pantry' as const },
            { label: '🍅 Tomato sauce', name: 'Tomato Sauce', category: 'pantry' as const },
            { label: '🫒 Olive oil', name: 'Olive Oil', category: 'pantry' as const },
            { label: '🫓 Tortillas', name: 'Tortillas', category: 'grains' as const },
          ],
    [activeTab],
  );

  const filteredCommonItems = useMemo(() => {
    if (!searchQuery.trim()) return commonItems;
    return commonItems.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleQuickAdd = useCallback(async (name: string, category: PantryItem['category']) => {
    console.log('[Kitchen] Quick add:', { name, category, location: activeTab });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const result = await addPantryItem({
      name,
      category,
      location: activeTab as 'fridge' | 'pantry',
    });
    
    if (result.duplicate) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Already Added', `"${name}" is already in your ${activeTab}.`);
      return;
    }

    if (result.existingLocation) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Heads Up', `"${name}" was added to your ${activeTab}, but it also exists in your ${result.existingLocation}.`);
      return;
    }
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [activeTab, addPantryItem]);

  const handleAddFromSearch = useCallback(async (item: typeof commonItems[0]) => {
    console.log('[Kitchen] Add from search:', item);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const result = await addPantryItem({
      name: item.name,
      category: item.category,
      location: activeTab as 'fridge' | 'pantry',
    });
    
    if (result.duplicate) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Already Added', `"${item.name}" is already in your ${activeTab}.`);
      return;
    }

    if (result.existingLocation) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Heads Up', `"${item.name}" was added to your ${activeTab}, but it also exists in your ${result.existingLocation}.`);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setSearchQuery('');
  }, [activeTab, addPantryItem]);

  const handleManualAdd = useCallback(async () => {
    if (!manualName.trim()) {
      Alert.alert('Missing Name', 'Please enter an item name');
      return;
    }
    
    console.log('[Kitchen] Manual add:', { name: manualName, quantity: manualQuantity, category: selectedCategory });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const result = await addPantryItem({
      name: manualName.trim(),
      category: selectedCategory,
      quantity: manualQuantity.trim() || undefined,
      location: activeTab as 'fridge' | 'pantry',
    });
    
    if (result.duplicate) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Already Added', `"${manualName.trim()}" is already in your ${activeTab}.`);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (result.existingLocation) {
      Alert.alert('Heads Up', `"${manualName.trim()}" was added to your ${activeTab}, but it also exists in your ${result.existingLocation}.`);
    }
    setManualName('');
    setManualQuantity('');
    setSelectedCategory('other');
    setShowAddModal(false);
  }, [manualName, manualQuantity, selectedCategory, activeTab, addPantryItem]);


  const processImage = useCallback(async (source: 'camera' | 'gallery') => {
    if (!isPremium) {
      setPendingScanSource(source);
      setPaywallFeatureName('AI fridge scanning');
      setShowPremiumPaywall(true);
      return;
    }
    try {
      const permResult = source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permResult.granted) {
        Alert.alert('Permission Needed', `Please grant ${source} access to scan items.`);
        return;
      }

      const pickerResult = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.7 });

      if (pickerResult.canceled || !pickerResult.assets?.[0]?.base64) {
        console.log('[Kitchen] Image picker cancelled');
        return;
      }

      setIsProcessingScan(true);
      setShowConfirmModal(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const base64 = pickerResult.assets[0].base64;
      const mimeType = pickerResult.assets[0].mimeType || 'image/jpeg';
      const imageData = `data:${mimeType};base64,${base64}`;

      console.log('[Kitchen] Sending image to AI for analysis...');

      const scanSchema = z.object({
        items: z.array(z.object({
          name: z.string().describe('Name of the food item, properly capitalized'),
          category: z.enum(['produce', 'dairy', 'protein', 'grains', 'pantry', 'frozen', 'other']).describe('Category of the food item'),
        })).describe('List of food/grocery items detected in the image'),
      });

      const aiResult = await generateObject({
        messages: [{
          role: 'user' as const,
          content: [
            { type: 'text' as const, text: 'Look at this image carefully. It may be a photo of a fridge, pantry, grocery receipt, or food items. List ALL the food and grocery items you can identify. Be specific with names (e.g., "Whole Milk" not just "Milk", "Roma Tomatoes" not just "Tomatoes"). Only list food/grocery items, not containers, appliances, or non-food items.' },
            { type: 'image' as const, image: imageData },
          ]
        }],
        schema: scanSchema,
      });

      console.log('[Kitchen] AI detected items:', aiResult.items.length);
      setPendingItems(aiResult.items.map(item => ({ ...item, selected: true })));
    } catch (error) {
      console.error('[Kitchen] Scan error:', error);
      Alert.alert('Scan Failed', 'Could not analyze the image. Please try again.');
      setShowConfirmModal(false);
    } finally {
      setIsProcessingScan(false);
    }
  }, []);

  const handleCameraScan = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowAddMenu(false);
    Alert.alert(
      'Scan Items',
      'Take a photo of your fridge, pantry, or receipt',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: () => processImage('camera') },
        { text: 'Choose from Gallery', onPress: () => processImage('gallery') },
      ]
    );
  }, [processImage]);

  const handleVoiceStart = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowAddMenu(false);
    setShowVoiceRecorder(true);
    setRecordingDuration(0);
    setIsProcessingVoice(false);
  }, []);

  const startVoiceRecording = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        mediaRecorder.ondataavailable = (e: any) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };
        mediaRecorder.start();
      } else {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Needed', 'Please grant microphone access to use voice input.');
          return;
        }
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        const recording = new Audio.Recording();
        await recording.prepareToRecordAsync({
          android: {
            extension: '.m4a',
            outputFormat: 2,
            audioEncoder: 3,
            sampleRate: 44100,
            numberOfChannels: 1,
            bitRate: 128000,
          },
          ios: {
            extension: '.wav',
            outputFormat: 0x6C70636D,
            audioQuality: 127,
            sampleRate: 44100,
            numberOfChannels: 1,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          web: {
            mimeType: 'audio/webm',
            bitsPerSecond: 128000,
          },
        });
        await recording.startAsync();
        recordingRef.current = recording;
      }

      setIsRecording(true);
      setRecordingDuration(0);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } catch (error) {
      console.error('[Kitchen] Start recording error:', error);
      Alert.alert('Recording Error', 'Could not start recording. Please check microphone permissions.');
    }
  }, [pulseAnim]);

  const stopVoiceRecording = useCallback(async () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
    setIsRecording(false);
    setIsProcessingVoice(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const formData = new FormData();

      if (Platform.OS === 'web') {
        const mediaRecorder = mediaRecorderRef.current;
        if (!mediaRecorder) throw new Error('No media recorder');

        await new Promise<void>((resolve) => {
          mediaRecorder.onstop = () => resolve();
          mediaRecorder.stop();
        });

        if (mediaRecorder.stream) {
          mediaRecorder.stream.getTracks().forEach((track: any) => track.stop());
        }

        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        formData.append('audio', blob, 'recording.webm');
      } else {
        const recording = recordingRef.current;
        if (!recording) throw new Error('No recording');

        await recording.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

        const uri = recording.getURI();
        if (!uri) throw new Error('No recording URI');

        const uriParts = uri.split('.');
        const fileType = uriParts[uriParts.length - 1];

        const audioFile = {
          uri,
          name: `recording.${fileType}`,
          type: `audio/${fileType}`,
        };

        formData.append('audio', audioFile as any);
        recordingRef.current = null;
      }

      console.log('[Kitchen] Sending audio for transcription...');

      const sttResponse = await fetch('https://toolkit.rork.com/stt/transcribe/', {
        method: 'POST',
        body: formData,
      });

      if (!sttResponse.ok) {
        throw new Error(`STT failed with status ${sttResponse.status}`);
      }

      const sttData = await sttResponse.json();
      console.log('[Kitchen] Transcribed text:', sttData.text);

      if (!sttData.text || sttData.text.trim().length === 0) {
        Alert.alert('No Speech Detected', 'We could not detect any speech. Please try again and speak clearly.');
        setIsProcessingVoice(false);
        return;
      }

      const parseSchema = z.object({
        items: z.array(z.object({
          name: z.string().describe('Name of the food item, properly capitalized'),
          category: z.enum(['produce', 'dairy', 'protein', 'grains', 'pantry', 'frozen', 'other']).describe('Category of the food item'),
        })).describe('List of food/grocery items parsed from the spoken text'),
      });

      const parsed = await generateObject({
        messages: [{
          role: 'user' as const,
          content: `Parse the following spoken text into a list of food/grocery items. The person is adding items to their kitchen inventory. Extract each distinct food item mentioned. If the text is unclear, make your best guess at what food items were mentioned.\n\nSpoken text: "${sttData.text}"`,
        }],
        schema: parseSchema,
      });

      console.log('[Kitchen] Parsed items from voice:', parsed.items.length);

      if (parsed.items.length === 0) {
        Alert.alert('No Items Found', `We heard: "${sttData.text}" but could not identify any food items. Please try again.`);
        setIsProcessingVoice(false);
        return;
      }

      setPendingItems(parsed.items.map(item => ({ ...item, selected: true })));
      setShowVoiceRecorder(false);
      setShowConfirmModal(true);
      setIsProcessingVoice(false);
    } catch (error) {
      console.error('[Kitchen] Voice processing error:', error);
      Alert.alert('Voice Error', 'Could not process your voice input. Please try again.');
      setIsProcessingVoice(false);
    }
  }, [pulseAnim]);

  const cancelVoiceRecording = useCallback(async () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);

    if (isRecording) {
      try {
        if (Platform.OS === 'web') {
          const mediaRecorder = mediaRecorderRef.current;
          if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            if (mediaRecorder.stream) {
              mediaRecorder.stream.getTracks().forEach((track: any) => track.stop());
            }
          }
        } else {
          const recording = recordingRef.current;
          if (recording) {
            await recording.stopAndUnloadAsync();
            await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
            recordingRef.current = null;
          }
        }
      } catch (e) {
        console.log('[Kitchen] Error cancelling recording:', e);
      }
    }

    setIsRecording(false);
    setRecordingDuration(0);
    setShowVoiceRecorder(false);
    setIsProcessingVoice(false);
  }, [isRecording, pulseAnim]);

  const togglePendingItem = useCallback((index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPendingItems(prev => prev.map((item, i) =>
      i === index ? { ...item, selected: !item.selected } : item
    ));
  }, []);

  const handleConfirmItems = useCallback(async () => {
    const selectedItems = pendingItems.filter(item => item.selected);
    if (selectedItems.length === 0) {
      Alert.alert('No Items Selected', 'Please select at least one item to add.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const targetLocation = activeTab === 'grocery' ? 'fridge' : activeTab;

    const addedItems: string[] = [];
    const duplicateItems: string[] = [];

    for (const item of selectedItems) {
      const result = await addPantryItem({
        name: item.name,
        category: item.category,
        location: targetLocation as 'fridge' | 'pantry',
      });

      if (result.duplicate) {
        duplicateItems.push(item.name);
      } else {
        addedItems.push(item.name);
      }
    }

    Haptics.notificationAsync(
      addedItems.length > 0
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Warning
    );

    setShowConfirmModal(false);
    setPendingItems([]);

    if (duplicateItems.length > 0 && addedItems.length > 0) {
      Alert.alert(
        'Items Added!',
        `Added ${addedItems.length} item${addedItems.length > 1 ? 's' : ''} to your ${targetLocation}.\n\nSkipped ${duplicateItems.length} duplicate${duplicateItems.length > 1 ? 's' : ''}: ${duplicateItems.join(', ')}`
      );
    } else if (duplicateItems.length > 0 && addedItems.length === 0) {
      Alert.alert('All Duplicates', `All selected items already exist in your ${targetLocation}.`);
    } else {
      Alert.alert('Added!', `${addedItems.length} item${addedItems.length > 1 ? 's' : ''} added to your ${targetLocation}!`);
    }
  }, [pendingItems, activeTab, addPantryItem]);

  const formatDuration = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const openAddModal = useCallback((mode: AddMode) => {
    setAddMode(mode);
    setShowAddModal(true);
    setShowAddMenu(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const resetModal = useCallback(() => {
    setShowAddModal(false);
    setSearchQuery('');
    setManualName('');
    setManualQuantity('');
    setSelectedCategory('other');

  }, []);

  const toggleRecipeExpand = useCallback((recipeKey: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedRecipes(prev => {
      const next = new Set(prev);
      if (next.has(recipeKey)) {
        next.delete(recipeKey);
      } else {
        next.add(recipeKey);
      }
      return next;
    });
  }, []);

  const groceryItemsByRecipe = useMemo(() => {
    const activeList = getActiveGroceryList();
    if (!activeList) return new Map<string, GroceryItem[]>();
    const map = new Map<string, GroceryItem[]>();
    for (const item of activeList.items) {
      const key = item.recipeName || 'Other';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return map;
  }, [getActiveGroceryList]);

  const handleToggleGroceryItem = useCallback(async (listId: string, itemId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await toggleGroceryItem(listId, itemId);
    if (result?.recipeComplete) {
      console.log('[Kitchen] Recipe complete detected:', result.recipeComplete.recipeName);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '🎉 Ready to Cook!',
        `You have all the ingredients for "${result.recipeComplete.recipeName}"! Head to Cook Now to start cooking.`,
        [
          { text: 'Later', style: 'cancel' },
          {
            text: "Let's Cook!",
            onPress: () => router.push('/(tabs)/cook-now'),
          },
        ]
      );
    }
  }, [toggleGroceryItem, router]);

  const handleDeleteGroceryList = useCallback((listId: string) => {
    Alert.alert(
      'Delete List',
      'Are you sure you want to delete this grocery list?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            deleteGroceryList(listId);
          }
        },
      ]
    );
  }, [deleteGroceryList]);

  const handleMoveToKitchen = useCallback(async (item: { name: string; category: string }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const category = item.category as PantryItem['category'];
    const location: 'fridge' | 'pantry' = ['produce', 'dairy', 'protein', 'frozen'].includes(category) ? 'fridge' : 'pantry';
    
    const result = await addPantryItem({
      name: item.name,
      category,
      location,
    });
    
    if (result.duplicate) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Already in Kitchen', `"${item.name}" is already in your ${location}.`);
      return;
    }
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [addPantryItem]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>My Kitchen</Text>
          <TouchableOpacity 
            style={styles.searchBtn}
            onPress={() => openAddModal('search')}
          >
            <Search size={22} color={colors.text} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'fridge' && styles.tabActive]}
            onPress={() => setActiveTab('fridge')}
          >
            <Text style={styles.tabEmoji}>🧊</Text>
            <Text style={[styles.tabText, activeTab === 'fridge' && styles.tabTextActive]}>
              Fridge
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'pantry' && styles.tabActive]}
            onPress={() => setActiveTab('pantry')}
          >
            <Text style={styles.tabEmoji}>🥫</Text>
            <Text style={[styles.tabText, activeTab === 'pantry' && styles.tabTextActive]}>
              Pantry
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'grocery' && styles.tabActive]}
            onPress={() => setActiveTab('grocery')}
          >
            <Text style={styles.tabEmoji}>🛒</Text>
            <Text style={[styles.tabText, activeTab === 'grocery' && styles.tabTextActive]}>
              Grocery
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'grocery' ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.groceryContent}
            showsVerticalScrollIndicator={false}
          >
            {groceryLists.length > 0 && getActiveGroceryList() ? (
              <>
                <View style={styles.groceryHeader}>
                  <View style={styles.groceryHeaderLeft}>
                    <ShoppingCart size={20} color={colors.text} strokeWidth={2.5} />
                    <Text style={styles.groceryTitle} numberOfLines={2}>{getActiveGroceryList()?.name}</Text>
                  </View>
                  <View style={styles.groceryHeaderRight}>
                    <View style={styles.groceryProgress}>
                      <Text style={styles.groceryProgressText}>
                        {getActiveGroceryList()?.items.filter(i => i.isChecked).length}/{getActiveGroceryList()?.items.length}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.groceryDeleteBtn}
                      onPress={() => handleDeleteGroceryList(getActiveGroceryList()!.id)}
                    >
                      <Trash2 size={18} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.groceryWorkflowBanner}>
                  <View style={styles.groceryWorkflowSteps}>
                    <View style={styles.groceryWorkflowStep}>
                      <View style={[styles.groceryWorkflowDot, styles.groceryWorkflowDotActive]}>
                        <ShoppingCart size={12} color={colors.white} strokeWidth={3} />
                      </View>
                      <Text style={styles.groceryWorkflowStepText}>Shop & check off</Text>
                    </View>
                    <View style={styles.groceryWorkflowArrow}>
                      <ArrowRight size={14} color={colors.textSecondary} strokeWidth={2} />
                    </View>
                    <View style={styles.groceryWorkflowStep}>
                      <View style={styles.groceryWorkflowDot}>
                        <Package size={12} color={colors.textSecondary} strokeWidth={3} />
                      </View>
                      <Text style={styles.groceryWorkflowStepTextMuted}>Moves to kitchen</Text>
                    </View>
                    <View style={styles.groceryWorkflowArrow}>
                      <ArrowRight size={14} color={colors.textSecondary} strokeWidth={2} />
                    </View>
                    <View style={styles.groceryWorkflowStep}>
                      <View style={styles.groceryWorkflowDot}>
                        <ChefHat size={12} color={colors.textSecondary} strokeWidth={3} />
                      </View>
                      <Text style={styles.groceryWorkflowStepTextMuted}>Ready to cook!</Text>
                    </View>
                  </View>
                </View>

                <RecipePriceSummary ingredients={getActiveGroceryList()?.items.filter(i => !i.isChecked).map(i => ({ name: i.name })) || []} />

                <View style={styles.groceryGroupToggle}>
                  <TouchableOpacity
                    style={[styles.groceryGroupBtn, groceryGroupBy === 'recipe' && styles.groceryGroupBtnActive]}
                    onPress={() => setGroceryGroupBy('recipe')}
                  >
                    <Text style={[styles.groceryGroupBtnText, groceryGroupBy === 'recipe' && styles.groceryGroupBtnTextActive]}>By Recipe</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.groceryGroupBtn, groceryGroupBy === 'category' && styles.groceryGroupBtnActive]}
                    onPress={() => setGroceryGroupBy('category')}
                  >
                    <Text style={[styles.groceryGroupBtnText, groceryGroupBy === 'category' && styles.groceryGroupBtnTextActive]}>By Category</Text>
                  </TouchableOpacity>
                </View>

                {groceryGroupBy === 'recipe' ? (
                  Array.from(groceryItemsByRecipe.entries()).map(([recipeName, items]) => {
                    const isExpanded = expandedRecipes.has(recipeName);
                    const checkedCount = items.filter(i => i.isChecked).length;
                    return (
                      <View key={recipeName} style={styles.groceryRecipeGroup}>
                        <TouchableOpacity
                          style={styles.groceryRecipeHeader}
                          onPress={() => toggleRecipeExpand(recipeName)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.groceryRecipeHeaderLeft}>
                            <Text style={styles.groceryRecipeIcon}>{isExpanded ? '🔽' : '▶️'}</Text>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.groceryRecipeName} numberOfLines={1}>{recipeName}</Text>
                              <Text style={styles.groceryRecipeCount}>{checkedCount}/{items.length} items</Text>
                            </View>
                          </View>
                          <View style={[styles.groceryRecipeBadge, checkedCount === items.length && styles.groceryRecipeBadgeComplete]}>
                            <Text style={[styles.groceryRecipeBadgeText, checkedCount === items.length && styles.groceryRecipeBadgeTextComplete]}>
                              {checkedCount === items.length ? 'Done' : `${items.length - checkedCount} left`}
                            </Text>
                          </View>
                        </TouchableOpacity>
                        {isExpanded && items.map((item) => (
                          <TouchableOpacity
                            key={item.id}
                            style={[styles.groceryItemCard, item.isChecked && styles.groceryItemCardChecked]}
                            onPress={() => handleToggleGroceryItem(getActiveGroceryList()!.id, item.id)}
                            onLongPress={() => {
                              if (item.isChecked) {
                                handleMoveToKitchen({ name: item.name, category: item.category });
                              }
                            }}
                            activeOpacity={0.7}
                          >
                            <View style={styles.groceryItemTop}>
                              <View style={[styles.groceryCheckbox, item.isChecked && styles.groceryCheckboxChecked]}>
                                {item.isChecked && <Check size={14} color={colors.white} strokeWidth={3} />}
                              </View>
                              <Text style={styles.groceryItemEmoji}>{getItemEmoji(item.name, item.category)}</Text>
                              <View style={styles.groceryItemContent}>
                                <Text style={[styles.groceryItemName, item.isChecked && styles.groceryItemNameChecked]}>
                                  {item.name}
                                </Text>
                                {item.amount && (
                                  <Text style={styles.groceryItemAmount}>
                                    {item.amount}{item.unit ? ` ${item.unit}` : ''}
                                  </Text>
                                )}
                              </View>
                              {item.isChecked && (
                                <TouchableOpacity 
                                  style={styles.moveToKitchenBtn}
                                  onPress={() => handleMoveToKitchen({ name: item.name, category: item.category })}
                                >
                                  <Package size={16} color={colors.secondary} />
                                </TouchableOpacity>
                              )}
                            </View>
                            {!item.isChecked && <StorePricePills ingredientName={item.name} />}
                          </TouchableOpacity>
                        ))}
                      </View>
                    );
                  })
                ) : (
                  Object.entries(
                    getActiveGroceryList()?.items.reduce((acc, item) => {
                      if (!acc[item.category]) acc[item.category] = [];
                      acc[item.category].push(item);
                      return acc;
                    }, {} as Record<string, typeof groceryLists[0]['items']>) || {}
                  ).map(([category, items]) => (
                    <View key={category} style={styles.groceryCategory}>
                      <View style={styles.groceryCategoryHeader}>
                        <Text style={styles.groceryCategoryEmoji}>{categoryEmojis[category]}</Text>
                        <Text style={styles.groceryCategoryTitle}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </Text>
                      </View>
                      {items.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          style={[styles.groceryItemCard, item.isChecked && styles.groceryItemCardChecked, { borderRadius: 14, marginBottom: 8 }]}
                          onPress={() => handleToggleGroceryItem(getActiveGroceryList()!.id, item.id)}
                          onLongPress={() => {
                            if (item.isChecked) {
                              handleMoveToKitchen({ name: item.name, category: item.category });
                            }
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={styles.groceryItemTop}>
                            <View style={[styles.groceryCheckbox, item.isChecked && styles.groceryCheckboxChecked]}>
                              {item.isChecked && <Check size={14} color={colors.white} strokeWidth={3} />}
                            </View>
                            <Text style={styles.groceryItemEmoji}>{getItemEmoji(item.name, item.category)}</Text>
                            <View style={styles.groceryItemContent}>
                              <Text style={[styles.groceryItemName, item.isChecked && styles.groceryItemNameChecked]}>
                                {item.name}
                              </Text>
                              {item.amount && (
                                <Text style={styles.groceryItemAmount}>
                                  {item.amount}{item.unit ? ` ${item.unit}` : ''}
                                </Text>
                              )}
                              {item.recipeName && (
                                <Text style={styles.groceryItemRecipe}>From: {item.recipeName}</Text>
                              )}
                            </View>
                            {item.isChecked && (
                              <TouchableOpacity 
                                style={styles.moveToKitchenBtn}
                                onPress={() => handleMoveToKitchen({ name: item.name, category: item.category })}
                              >
                                <Package size={16} color={colors.secondary} />
                              </TouchableOpacity>
                            )}
                          </View>
                          {!item.isChecked && <StorePricePills ingredientName={item.name} />}
                        </TouchableOpacity>
                      ))}
                    </View>
                  ))
                )}

                <View style={styles.groceryTip}>
                  <Text style={styles.groceryTipTitle}>How it works</Text>
                  <View style={styles.groceryTipRow}>
                    <Check size={14} color={colors.success} strokeWidth={3} />
                    <Text style={styles.groceryTipText}>Check off items as you shop</Text>
                  </View>
                  <View style={styles.groceryTipRow}>
                    <Package size={14} color={colors.secondary} strokeWidth={2.5} />
                    <Text style={styles.groceryTipText}>Checked items auto-move to your kitchen</Text>
                  </View>
                  <View style={styles.groceryTipRow}>
                    <ChefHat size={14} color={colors.primary} strokeWidth={2.5} />
                    <Text style={styles.groceryTipText}>Once all items are checked, head to Cook tab!</Text>
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.groceryEmpty}>
                <Image
                  source={{ uri: 'https://r2-pub.rork.com/attachments/7kh2kny7y4aoan2iczpas' }}
                  style={styles.emptyTotie}
                  resizeMode="contain"
                />
                <Text style={styles.groceryEmptyTitle}>No grocery list yet!</Text>
                <Text style={styles.groceryEmptyText}>
                  When you save recipes, we&apos;ll automatically generate smart grocery lists for you.
                </Text>
                <View style={styles.groceryEmptyTip}>
                  <Text style={styles.groceryEmptyTipTitle}>💡 How it works</Text>
                  <Text style={styles.groceryEmptyTipText}>
                    Save a recipe → We extract ingredients → Smart grocery list is created!
                  </Text>
                </View>
              </View>
            )}
            <View style={styles.bottomPadding} />
          </ScrollView>
        ) : filteredItems.length === 0 ? (
          <ScrollView
            style={styles.emptyContainer}
            contentContainerStyle={styles.emptyContent}
            showsVerticalScrollIndicator={false}
            testID="kitchen-empty-scroll"
          >
            <View style={styles.quickAddCard}>
              <View style={styles.quickAddHeader}>
                <Text style={styles.quickAddTitle}>Quick add</Text>
                <Text style={styles.quickAddSubtitle}>Tap a common item to add it fast</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickAddRow}
                testID="kitchen-quick-add-row"
              >
                {quickAddSuggestions.map((item) => (
                  <TouchableOpacity
                    key={item.label}
                    style={styles.quickAddPill}
                    onPress={() => handleQuickAdd(item.name, item.category)}
                    testID={`kitchen-quick-add-${item.label}`}
                  >
                    <Text style={styles.quickAddPillText}>{item.label}</Text>
                    <Plus size={14} color={colors.text} strokeWidth={3} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.emptyCard}>
              <Image
                source={{ uri: 'https://r2-pub.rork.com/attachments/7kh2kny7y4aoan2iczpas' }}
                style={styles.emptyTotie}
                resizeMode="contain"
              />
              <Text style={styles.emptyTitle}>
                {activeTab === 'fridge' ? "Fridge is empty!" : "Pantry is bare!"}
              </Text>
              <Text style={styles.emptySubtext}>
                Add what you have so I can help
              </Text>
              <View style={styles.addOptions}>
                <TouchableOpacity 
                  style={styles.addOption}
                  onPress={handleCameraScan}
                >
                  <Camera size={20} color={colors.primary} strokeWidth={2.5} />
                  <Text style={styles.addOptionText}>Scan</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.addOption}
                  onPress={handleVoiceStart}
                >
                  <Mic size={20} color={colors.secondary} strokeWidth={2.5} />
                  <Text style={styles.addOptionText}>Voice</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.addOption}
                  onPress={() => openAddModal('search')}
                >
                  <Search size={20} color={colors.mint} strokeWidth={2.5} />
                  <Text style={styles.addOptionText}>Search</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        ) : (
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.quickAddCard}>
              <View style={styles.quickAddHeader}>
                <Text style={styles.quickAddTitle}>Quick add</Text>
                <Text style={styles.quickAddSubtitle}>Tap to add common items</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickAddRow}
              >
                {quickAddSuggestions.map((item) => (
                  <TouchableOpacity
                    key={item.label}
                    style={styles.quickAddPill}
                    onPress={() => handleQuickAdd(item.name, item.category)}
                  >
                    <Text style={styles.quickAddPillText}>{item.label}</Text>
                    <Plus size={14} color={colors.text} strokeWidth={3} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {Object.entries(groupedItems).map(([category, items]) => (
              <View key={category} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryEmoji}>{categoryEmojis[category]}</Text>
                  <Text style={styles.categoryTitle}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                  <View style={styles.categoryCount}>
                    <Text style={styles.categoryCountText}>{items.length}</Text>
                  </View>
                </View>
                <View style={styles.itemsGrid}>
                  {items.map((item) => (
                    <View key={item.id} style={styles.itemSquare}>
                      <TouchableOpacity 
                        style={styles.itemSquareDelete}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          deletePantryItem(item.id);
                        }}
                      >
                        <Trash2 size={12} color={colors.error} />
                      </TouchableOpacity>
                      <Text style={styles.itemSquareEmoji}>{getItemEmoji(item.name, item.category)}</Text>
                      <Text style={styles.itemSquareName} numberOfLines={2}>{item.name}</Text>
                      {item.quantity && (
                        <Text style={styles.itemSquareQty} numberOfLines={1}>{item.quantity}</Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            ))}
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
          <View style={styles.addMenu}>
            <TouchableOpacity 
              style={styles.addMenuItem}
              onPress={handleCameraScan}
            >
              <View style={[styles.addMenuIcon, { backgroundColor: colors.primaryLight }]}>
                <Camera size={20} color={colors.primary} strokeWidth={2.5} />
              </View>
              <Text style={styles.addMenuText}>Scan with Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.addMenuItem}
              onPress={handleVoiceStart}
            >
              <View style={[styles.addMenuIcon, { backgroundColor: colors.secondaryLight }]}>
                <Mic size={20} color={colors.secondary} strokeWidth={2.5} />
              </View>
              <Text style={styles.addMenuText}>Voice Input</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.addMenuItem}
              onPress={() => openAddModal('search')}
            >
              <View style={[styles.addMenuIcon, { backgroundColor: colors.mintLight }]}>
                <Search size={20} color={colors.mint} strokeWidth={2.5} />
              </View>
              <Text style={styles.addMenuText}>Search & Add</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.addMenuItem}
              onPress={() => openAddModal('manual')}
            >
              <View style={[styles.addMenuIcon, { backgroundColor: '#FEF3C7' }]}>
                <Edit3 size={20} color="#F59E0B" strokeWidth={2.5} />
              </View>
              <Text style={styles.addMenuText}>Add Manually</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Add Item Modal */}
        <Modal
          visible={showAddModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={resetModal}
        >
          <KeyboardAvoidingView 
            style={styles.modalContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <SafeAreaView style={styles.modalSafeArea} edges={['top']}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={resetModal} style={styles.modalCloseBtn}>
                  <X size={24} color={colors.text} strokeWidth={2.5} />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>
                  {addMode === 'search' ? 'Search & Add' : addMode === 'voice' ? 'Quick Add' : 'Add Item'}
                </Text>
                <View style={styles.modalCloseBtn} />
              </View>

              {/* Mode Tabs */}
              <View style={styles.modeTabs}>
                <TouchableOpacity
                  style={[styles.modeTab, addMode === 'search' && styles.modeTabActive]}
                  onPress={() => setAddMode('search')}
                >
                  <Search size={16} color={addMode === 'search' ? colors.white : colors.text} />
                  <Text style={[styles.modeTabText, addMode === 'search' && styles.modeTabTextActive]}>Search</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeTab, addMode === 'voice' && styles.modeTabActive]}
                  onPress={() => setAddMode('voice')}
                >
                  <Mic size={16} color={addMode === 'voice' ? colors.white : colors.text} />
                  <Text style={[styles.modeTabText, addMode === 'voice' && styles.modeTabTextActive]}>Quick</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeTab, addMode === 'manual' && styles.modeTabActive]}
                  onPress={() => setAddMode('manual')}
                >
                  <Edit3 size={16} color={addMode === 'manual' ? colors.white : colors.text} />
                  <Text style={[styles.modeTabText, addMode === 'manual' && styles.modeTabTextActive]}>Manual</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {addMode === 'search' && (
                  <View style={styles.searchSection}>
                    <View style={styles.searchInputWrap}>
                      <Search size={20} color={colors.textSecondary} />
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Search items..."
                        placeholderTextColor={colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoFocus
                      />
                      {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                          <X size={18} color={colors.textSecondary} />
                        </TouchableOpacity>
                      )}
                    </View>

                    <Text style={styles.searchSectionTitle}>
                      {searchQuery ? 'Results' : 'Common Items'}
                    </Text>
                    <View style={styles.searchResults}>
                      {filteredCommonItems.map((item) => (
                        <TouchableOpacity
                          key={item.name}
                          style={styles.searchResultItem}
                          onPress={() => handleAddFromSearch(item)}
                        >
                          <Text style={styles.searchResultEmoji}>{item.emoji}</Text>
                          <Text style={styles.searchResultName}>{item.name}</Text>
                          <Plus size={18} color={colors.secondary} />
                        </TouchableOpacity>
                      ))}
                    </View>

                    {searchQuery && filteredCommonItems.length === 0 && (
                      <View style={styles.noResults}>
                        <Text style={styles.noResultsText}>No matches found</Text>
                        <TouchableOpacity 
                          style={styles.addCustomBtn}
                          onPress={() => {
                            setManualName(searchQuery);
                            setAddMode('manual');
                          }}
                        >
                          <Plus size={18} color={colors.white} />
                          <Text style={styles.addCustomBtnText}>Add &quot;{searchQuery}&quot; manually</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}

                {addMode === 'voice' && (
                  <View style={styles.voiceSection}>
                    <View style={styles.voiceQuickBody}>
                      {isProcessingVoice ? (
                        <View style={styles.voiceProcessingWrap}>
                          <ActivityIndicator size="large" color={colors.primary} />
                          <Text style={styles.voiceProcessingText}>Processing your voice...</Text>
                          <Text style={styles.voiceProcessingSubtext}>Identifying food items</Text>
                        </View>
                      ) : (
                        <>
                          <Text style={styles.voiceQuickTitle}>
                            {isRecording ? 'Listening...' : 'Tap the mic to add items'}
                          </Text>
                          <Text style={styles.voiceQuickSubtitle}>
                            {isRecording
                              ? 'Say the items you want to add, e.g., "eggs, milk, chicken"'
                              : 'List your ingredients by voice — we\'ll add them for you'
                            }
                          </Text>

                          {isRecording && (
                            <Text style={styles.recordingTimer}>{formatDuration(recordingDuration)}</Text>
                          )}

                          <Animated.View style={[styles.micButtonOuter, { transform: [{ scale: pulseAnim }] }]}>
                            <TouchableOpacity
                              style={[styles.micButton, isRecording && styles.micButtonRecording]}
                              onPress={isRecording ? stopVoiceRecording : startVoiceRecording}
                              activeOpacity={0.8}
                            >
                              {isRecording ? (
                                <Square size={32} color={colors.white} fill={colors.white} />
                              ) : (
                                <Mic size={40} color={colors.white} strokeWidth={2.5} />
                              )}
                            </TouchableOpacity>
                          </Animated.View>

                          <Text style={styles.micHint}>
                            {isRecording ? 'Tap to stop' : 'Tap the mic to begin'}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                )}

                {addMode === 'manual' && (
                  <View style={styles.manualSection}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Item Name *</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g., Chicken breast"
                        placeholderTextColor={colors.textSecondary}
                        value={manualName}
                        onChangeText={setManualName}
                        autoFocus
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Quantity (optional)</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g., 2 lbs, 1 dozen"
                        placeholderTextColor={colors.textSecondary}
                        value={manualQuantity}
                        onChangeText={setManualQuantity}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Category</Text>
                      <View style={styles.categoryGrid}>
                        {categoryOptions.map((cat) => (
                          <TouchableOpacity
                            key={cat.key}
                            style={[
                              styles.categoryOption,
                              selectedCategory === cat.key && styles.categoryOptionSelected
                            ]}
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              setSelectedCategory(cat.key);
                            }}
                          >
                            <Text style={styles.categoryOptionEmoji}>{cat.emoji}</Text>
                            <Text style={[
                              styles.categoryOptionLabel,
                              selectedCategory === cat.key && styles.categoryOptionLabelSelected
                            ]}>
                              {cat.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <TouchableOpacity 
                      style={[styles.manualAddBtn, !manualName.trim() && styles.manualAddBtnDisabled]}
                      onPress={handleManualAdd}
                      disabled={!manualName.trim()}
                    >
                      <Plus size={20} color={colors.white} />
                      <Text style={styles.manualAddBtnText}>
                        Add to {activeTab === 'fridge' ? 'Fridge' : 'Pantry'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            </SafeAreaView>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>

      <Modal
        visible={showVoiceRecorder}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={cancelVoiceRecording}
      >
        <View style={styles.voiceRecorderContainer}>
          <SafeAreaView style={styles.voiceRecorderSafe} edges={['top', 'bottom']}>
            <View style={styles.voiceRecorderHeader}>
              <TouchableOpacity onPress={cancelVoiceRecording} style={styles.modalCloseBtn}>
                <X size={24} color={colors.text} strokeWidth={2.5} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Voice Input</Text>
              <View style={styles.modalCloseBtn} />
            </View>

            <View style={styles.voiceRecorderBody}>
              {isProcessingVoice ? (
                <View style={styles.voiceProcessingWrap}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.voiceProcessingText}>Processing your voice...</Text>
                  <Text style={styles.voiceProcessingSubtext}>Identifying food items</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.voiceRecorderTitle}>
                    {isRecording ? 'Listening...' : 'Tap to start recording'}
                  </Text>
                  <Text style={styles.voiceRecorderSubtitle}>
                    {isRecording
                      ? 'Say the items you want to add, e.g., "eggs, milk, chicken, rice"'
                      : 'List your grocery or kitchen items by voice'
                    }
                  </Text>

                  {isRecording && (
                    <Text style={styles.recordingTimer}>{formatDuration(recordingDuration)}</Text>
                  )}

                  <Animated.View style={[styles.micButtonOuter, { transform: [{ scale: pulseAnim }] }]}>
                    <TouchableOpacity
                      style={[styles.micButton, isRecording && styles.micButtonRecording]}
                      onPress={isRecording ? stopVoiceRecording : startVoiceRecording}
                      activeOpacity={0.8}
                    >
                      {isRecording ? (
                        <Square size={32} color={colors.white} fill={colors.white} />
                      ) : (
                        <Mic size={40} color={colors.white} strokeWidth={2.5} />
                      )}
                    </TouchableOpacity>
                  </Animated.View>

                  <Text style={styles.micHint}>
                    {isRecording ? 'Tap to stop' : 'Tap the mic to begin'}
                  </Text>
                </>
              )}
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      <Modal
        visible={showConfirmModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowConfirmModal(false);
          setPendingItems([]);
        }}
      >
        <View style={styles.confirmContainer}>
          <SafeAreaView style={styles.confirmSafe} edges={['top', 'bottom']}>
            <View style={styles.confirmHeader}>
              <TouchableOpacity
                onPress={() => {
                  setShowConfirmModal(false);
                  setPendingItems([]);
                }}
                style={styles.modalCloseBtn}
              >
                <X size={24} color={colors.text} strokeWidth={2.5} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Confirm Items</Text>
              <View style={styles.modalCloseBtn} />
            </View>

            {isProcessingScan ? (
              <View style={styles.scanProcessing}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.scanProcessingText}>Analyzing image...</Text>
                <Text style={styles.scanProcessingSubtext}>Identifying food items</Text>
              </View>
            ) : (
              <>
                <View style={styles.confirmInfo}>
                  <Text style={styles.confirmInfoText}>
                    We found {pendingItems.length} item{pendingItems.length !== 1 ? 's' : ''}. Toggle items you want to add to your {activeTab === 'grocery' ? 'fridge' : activeTab}.
                  </Text>
                </View>

                <ScrollView style={styles.confirmList} showsVerticalScrollIndicator={false}>
                  {pendingItems.map((item, index) => (
                    <TouchableOpacity
                      key={`${item.name}-${index}`}
                      style={[styles.confirmItem, !item.selected && styles.confirmItemDeselected]}
                      onPress={() => togglePendingItem(index)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.confirmCheckbox, item.selected && styles.confirmCheckboxSelected]}>
                        {item.selected && <Check size={14} color={colors.white} strokeWidth={3} />}
                      </View>
                      <Text style={styles.confirmItemEmoji}>{getItemEmoji(item.name, item.category)}</Text>
                      <View style={styles.confirmItemInfo}>
                        <Text style={[styles.confirmItemName, !item.selected && styles.confirmItemNameDeselected]}>
                          {item.name}
                        </Text>
                        <Text style={styles.confirmItemCategory}>
                          {categoryEmojis[item.category] || '\uD83D\uDCE6'} {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                  <View style={{ height: 20 }} />
                </ScrollView>

                <View style={styles.confirmActions}>
                  <TouchableOpacity
                    style={styles.confirmSelectAll}
                    onPress={() => {
                      const allSelected = pendingItems.every(i => i.selected);
                      setPendingItems(prev => prev.map(i => ({ ...i, selected: !allSelected })));
                    }}
                  >
                    <Text style={styles.confirmSelectAllText}>
                      {pendingItems.every(i => i.selected) ? 'Deselect All' : 'Select All'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.confirmAddBtn,
                      pendingItems.filter(i => i.selected).length === 0 && styles.confirmAddBtnDisabled
                    ]}
                    onPress={handleConfirmItems}
                    disabled={pendingItems.filter(i => i.selected).length === 0}
                  >
                    <Check size={20} color={colors.white} strokeWidth={3} />
                    <Text style={styles.confirmAddBtnText}>
                      Add {pendingItems.filter(i => i.selected).length} Item{pendingItems.filter(i => i.selected).length !== 1 ? 's' : ''}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </SafeAreaView>
        </View>
      </Modal>

      <PageCoachMarks
        visible={showPageTutorial}
        onComplete={() => {
          setShowPageTutorial(false);
          completePageTutorial('kitchen');
        }}
        steps={KITCHEN_STEPS}
        pageTitle="KITCHEN"
      />

      <PremiumPaywall
        visible={showPremiumPaywall}
        onClose={() => {
          setShowPremiumPaywall(false);
          setPendingScanSource(null);
        }}
        onPurchaseSuccess={() => {
          if (pendingScanSource) {
            const source = pendingScanSource;
            setPendingScanSource(null);
            setTimeout(() => processImage(source), 300);
          }
        }}
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
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: colors.text,
    letterSpacing: -0.5,
  },
  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 14,
    padding: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  tabActive: {
    backgroundColor: colors.text,
  },
  tabEmoji: {
    fontSize: 18,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.white,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
    flex: 1,
  },
  categoryCount: {
    backgroundColor: colors.textSecondary,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  categoryCountText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: colors.white,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  itemSquare: {
    width: '30%' as unknown as number,
    aspectRatio: 1,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    position: 'relative',
  },
  itemSquareDelete: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  itemSquareEmoji: {
    fontSize: 36,
    marginBottom: 4,
  },
  itemSquareName: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 15,
  },
  itemSquareQty: {
    fontSize: 10,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
  },
  emptyContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 120,
  },
  quickAddCard: {
    backgroundColor: colors.cardAlt,
    borderWidth: 2,
    borderColor: colors.borderLight,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  quickAddHeader: {
    marginBottom: 12,
  },
  quickAddTitle: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: colors.text,
    letterSpacing: -0.2,
  },
  quickAddSubtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  quickAddRow: {
    gap: 10,
    paddingRight: 6,
  },
  quickAddPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
  },
  quickAddPillText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.text,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
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
  addOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  addOption: {
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    borderWidth: 2,
    borderColor: colors.borderLight,
    borderRadius: 14,
    padding: 16,
    minWidth: 90,
  },
  addOptionText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.text,
    marginTop: 6,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: colors.primary,
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
  addMenu: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 16,
    padding: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  addMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
  },
  addMenuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addMenuText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
  },
  bottomPadding: {
    height: 100,
  },
  groceryContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  groceryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  groceryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 12,
  },
  groceryHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  groceryTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: colors.text,
    flexShrink: 1,
  },
  groceryProgress: {
    backgroundColor: colors.success,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  groceryProgressText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.white,
  },
  groceryDeleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groceryCategory: {
    marginBottom: 20,
  },
  groceryCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  groceryCategoryEmoji: {
    fontSize: 18,
  },
  groceryCategoryTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
  },
  groceryItemCard: {
    backgroundColor: colors.white,
    borderWidth: 0,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    padding: 14,
  },
  groceryItemCardChecked: {
    backgroundColor: colors.cardAlt,
  },
  groceryItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  groceryItemEmoji: {
    fontSize: 28,
  },
  groceryCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.borderLight,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groceryCheckboxChecked: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  groceryItemContent: {
    flex: 1,
  },
  groceryItemName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  groceryItemNameChecked: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  groceryItemAmount: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    marginTop: 2,
  },
  groceryGroupToggle: {
    flexDirection: 'row' as const,
    backgroundColor: colors.cardAlt,
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  groceryGroupBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center' as const,
  },
  groceryGroupBtnActive: {
    backgroundColor: colors.text,
  },
  groceryGroupBtnText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: colors.textSecondary,
  },
  groceryGroupBtnTextActive: {
    color: colors.white,
  },
  groceryRecipeGroup: {
    marginBottom: 12,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.borderLight,
    borderRadius: 16,
    overflow: 'hidden' as const,
  },
  groceryRecipeHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: 14,
    backgroundColor: colors.cardAlt,
  },
  groceryRecipeHeaderLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
    gap: 10,
  },
  groceryRecipeIcon: {
    fontSize: 14,
  },
  groceryRecipeName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.text,
  },
  groceryRecipeCount: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    marginTop: 2,
  },
  groceryRecipeBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  groceryRecipeBadgeComplete: {
    backgroundColor: colors.mintLight,
  },
  groceryRecipeBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: colors.primary,
  },
  groceryRecipeBadgeTextComplete: {
    color: colors.success,
  },
  groceryItemRecipe: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: colors.secondary,
    marginTop: 4,
  },
  groceryEmpty: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginTop: 20,
  },
  groceryEmptyTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: colors.text,
    marginBottom: 8,
  },
  groceryEmptyText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  groceryEmptyTip: {
    backgroundColor: colors.secondaryLight,
    borderRadius: 14,
    padding: 16,
    width: '100%',
  },
  groceryEmptyTipTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 6,
  },
  groceryEmptyTipText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.secondary,
    lineHeight: 18,
  },
  groceryTip: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.borderLight,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  groceryTipTitle: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: colors.text,
    marginBottom: 10,
  },
  groceryTipRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginBottom: 8,
  },
  groceryTipText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    flex: 1,
  },
  groceryWorkflowBanner: {
    backgroundColor: colors.mintLight,
    borderWidth: 1.5,
    borderColor: colors.mint,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  groceryWorkflowSteps: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  groceryWorkflowStep: {
    alignItems: 'center' as const,
    gap: 4,
    flex: 1,
  },
  groceryWorkflowDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.borderLight,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  groceryWorkflowDotActive: {
    backgroundColor: colors.success,
  },
  groceryWorkflowStepText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: colors.success,
    textAlign: 'center' as const,
  },
  groceryWorkflowStepTextMuted: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    textAlign: 'center' as const,
  },
  groceryWorkflowArrow: {
    paddingHorizontal: 4,
    marginBottom: 14,
  },
  moveToKitchenBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.secondaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
  },
  modeTabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: colors.cardAlt,
    borderRadius: 12,
    padding: 4,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  modeTabActive: {
    backgroundColor: colors.text,
  },
  modeTabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  modeTabTextActive: {
    color: colors.white,
  },
  modalScroll: {
    flex: 1,
  },
  searchSection: {
    padding: 20,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 14,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.text,
    paddingVertical: 14,
  },
  searchSectionTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.textSecondary,
    marginTop: 20,
    marginBottom: 12,
  },
  searchResults: {
    gap: 8,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.borderLight,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  searchResultEmoji: {
    fontSize: 24,
  },
  searchResultName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noResultsText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  addCustomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  addCustomBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.white,
  },
  voiceSection: {
    padding: 20,
  },
  voiceQuickBody: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  voiceQuickTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  voiceQuickSubtitle: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  voiceInputWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    minHeight: 100,
  },
  voiceInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.text,
    textAlignVertical: 'top',
  },
  voiceHint: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
  voiceAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 20,
    gap: 8,
  },
  voiceAddBtnDisabled: {
    backgroundColor: colors.borderLight,
  },
  voiceAddBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.white,
  },
  manualSection: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.text,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.borderLight,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 6,
  },
  categoryOptionSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  categoryOptionEmoji: {
    fontSize: 18,
  },
  categoryOptionLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  categoryOptionLabelSelected: {
    color: colors.primary,
  },
  manualAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 10,
    gap: 8,
  },
  manualAddBtnDisabled: {
    backgroundColor: colors.borderLight,
  },
  manualAddBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.white,
  },
  voiceRecorderContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  voiceRecorderSafe: {
    flex: 1,
  },
  voiceRecorderHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  voiceRecorderBody: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 32,
  },
  voiceRecorderTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: colors.text,
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  voiceRecorderSubtitle: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  recordingTimer: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: colors.primary,
    marginBottom: 32,
  },
  micButtonOuter: {
    marginBottom: 24,
  },
  micButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.secondary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  micButtonRecording: {
    backgroundColor: colors.error,
    shadowColor: colors.error,
  },
  micHint: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  voiceProcessingWrap: {
    alignItems: 'center' as const,
    gap: 16,
  },
  voiceProcessingText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
  },
  voiceProcessingSubtext: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  confirmContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  confirmSafe: {
    flex: 1,
  },
  confirmHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  scanProcessing: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: 16,
  },
  scanProcessingText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
  },
  scanProcessingSubtext: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  confirmInfo: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.mintLight,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 14,
  },
  confirmInfoText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.secondary,
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  confirmList: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 12,
  },
  confirmItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.borderLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  confirmItemDeselected: {
    opacity: 0.5,
    backgroundColor: colors.cardAlt,
  },
  confirmCheckbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.borderLight,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  confirmCheckboxSelected: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  confirmItemEmoji: {
    fontSize: 28,
  },
  confirmItemInfo: {
    flex: 1,
  },
  confirmItemName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  confirmItemNameDeselected: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through' as const,
  },
  confirmItemCategory: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    marginTop: 2,
  },
  confirmActions: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: 12,
  },
  confirmSelectAll: {
    alignItems: 'center' as const,
    paddingVertical: 8,
  },
  confirmSelectAllText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.secondary,
  },
  confirmAddBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: colors.success,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
  },
  confirmAddBtnDisabled: {
    backgroundColor: colors.borderLight,
  },
  confirmAddBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.white,
  },
});
