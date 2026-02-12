# Totie — Technical Documentation

## Overview
Totie is a cross-platform mobile app that helps users save money by converting food delivery habits into home cooking. Built with React Native + Expo, it features AI-powered recipe generation, smart pantry management, grocery list automation, and a gamified savings tracker.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React Native 0.81.5 + Expo SDK 54 |
| **Language** | TypeScript (strict mode) |
| **Routing** | Expo Router v6 (file-based, tab + stack navigation) |
| **State Management** | React Context via `@nkzw/create-context-hook`, React Query (`@tanstack/react-query`), AsyncStorage for persistence |
| **Monetization** | RevenueCat (`react-native-purchases` v9.7.6) |
| **UI/Icons** | React Native StyleSheet, `lucide-react-native`, `expo-linear-gradient`, `expo-blur` |
| **Fonts** | Nunito (400/600/700/800), Bangers (400) via `expo-font` |
| **Media** | `expo-image`, `expo-image-picker`, `expo-camera` (fridge scanning) |
| **AI/Image Gen** | Custom API integration (Rork Toolkit image generation API) for AI-generated recipe photos |
| **AI SDK** | `@rork-ai/toolkit-sdk` with Zod schema validation for structured AI outputs |
| **File System** | `expo-file-system` for local image persistence |
| **Haptics** | `expo-haptics` for micro-interactions |
| **Validation** | Zod v4 |
| **Web Compat** | `react-native-web` for cross-platform preview |
| **Platform** | iOS, Android, Web (via React Native Web) |
| **Bundle ID** | `com.appwiththat.totie` |

---

## Architecture

### App Structure (Expo Router file-based routing)
```
app/
  _layout.tsx          -> Root layout (providers, fonts, splash screen)
  index.tsx            -> Entry point / routing guard
  (tabs)/
    _layout.tsx        -> Tab navigator (Home, Kitchen, Cook, Recipes, Profile)
    home.tsx           -> Dashboard with savings stats, streaks, quick actions
    kitchen.tsx        -> Pantry + Fridge management, grocery lists
    cook-now.tsx       -> AI-powered "Cook with what you have" matching engine
    recipes.tsx        -> Recipe library, cookbook management, URL import
    profile.tsx        -> User profile, settings, stats, support
  onboarding/
    _layout.tsx        -> Onboarding stack navigator
    (22 screens)       -> Full onboarding funnel (welcome -> paywall)
  gamification.tsx     -> Modal: challenges, coins, rewards
```

### Provider Architecture (top-down)
```
QueryClientProvider (React Query)
  -> RevenueCatProvider (subscription state)
       -> AppProvider (app state, persisted data)
            -> GestureHandlerRootView
                 -> Stack Navigator (RootLayoutNav)
```

### State Management Pattern
- **RevenueCatContext** — Subscription state, offering/pricing data, purchase/restore mutations
- **AppContext** — Core app state: user profile, recipes, pantry items, cookbooks, food dump, grocery lists, cooked meals, device ID, premium status, tutorial progress
- **AsyncStorage** — Persistent local storage for all user data (13 keys)
- **React Query** — Server state caching for RevenueCat API calls (customer info, offerings)

---

## Data Models

| Entity | Key Fields |
|--------|-----------|
| **UserProfile** | name, diet, allergies, householdSize, eatingHabits, deliveryFrequency, weeklySpend, painPoints, mostExciting, totalSavings, mealsCooked, recipesTried, currentStreak, coins, createdAt |
| **Recipe** | id, title, image, ingredients[], instructions[], prepTime, cookTime, servings, source, isDIYCraving, deliveryPrice, diyPrice, cookbookId, pageNumber, isFavorite, nutrition (calories, saltLevel, sugarLevel), createdAt |
| **PantryItem** | id, name, category (7 types), quantity, expiresAt, location (fridge/pantry), addedAt |
| **Cookbook** | id, title, author, coverImage, recipeCount, addedAt |
| **FoodDumpItem** | id, type (link/note/image/voice), content, title, thumbnail, source, tags[], isProcessed, recipeId, createdAt |
| **GroceryList** | id, name, items[], recipeIds[], isActive, createdAt, updatedAt |
| **GroceryItem** | id, name, amount, unit, category, isChecked, recipeId, recipeName |
| **CookedMeal** | id, recipeTitle, recipeImage, recipeId, cookedAt, estimatedSavings, isAIGenerated |
| **Ingredient** | name, amount, unit |
| **NutritionInfo** | calories, saltLevel, sugarLevel |

---

## Persistence (AsyncStorage Keys)

| Key | Data |
|-----|------|
| `@user_profile` | UserProfile |
| `@recipes` | Recipe[] |
| `@pantry_items` | PantryItem[] |
| `@cookbooks` | Cookbook[] |
| `@food_dump` | FoodDumpItem[] |
| `@grocery_lists` | GroceryList[] |
| `@tutorial_complete` | boolean |
| `@page_tutorials` | Record<string, boolean> |
| `@cooked_meals` | CookedMeal[] |
| `@device_id` | string (auto-generated UDID) |
| `@is_premium` | boolean (local fallback) |
| `@free_recipe_saves_used` | number |
| `@has_seen_rescue_paywall` | boolean |

---

## Core Features

### 1. AI Recipe Matching (Cook Now)
- Matches pantry/fridge inventory against saved recipes using fuzzy name matching
- Recipes sorted into tiers: Ready Now (100%), Almost There (1-2 missing), Worth a Trip (several missing)
- One-tap add missing ingredients to grocery list with deduplication

### 2. URL-to-Recipe Import
- Paste any recipe URL, AI extracts structured recipe data
- Subject to freemium limits (1 free save, then premium required)

### 3. AI Recipe Image Generation
- Generates photorealistic food images via Rork Toolkit image generation API
- Images generated from recipe title + ingredients
- Saved to local file system via expo-file-system (base64 data URI fallback on web)

### 4. Smart Grocery Lists
- Auto-generated from recipe ingredients
- Duplicate ingredient detection
- Checked items auto-populate pantry (bidirectional sync)
- Recipe completion detection

### 5. Delivery-to-DIY Savings
- Compares delivery prices vs homemade cost
- Tracks cumulative savings over time

### 6. Store Price Comparison
- Ingredient-level pricing across 5 stores: Walmart, Costco, Kroger, Aldi, Target
- Highlights cheapest option per ingredient
- Compact and expanded views

### 7. Gamification
- Daily/weekly challenges with coin rewards
- XP system with 8-level progression
- 6 achievements (First Meal, Week Warrior, Recipe Collector, Pantry Pro, Money Saver, Master Chef)
- Cooking streaks

### 8. Guided Tutorials
- Global spotlight tutorial (CoachMarks) with SVG mask + animated transitions
- Page-level coach marks for Kitchen, Cook Now, and Recipes tabs
- Haptic feedback throughout

### 9. AI Chef Mode
- Uses `@rork-ai/toolkit-sdk` `generateObject` with Zod schemas
- Generates custom recipes from available pantry items when no good matches exist

### 10. Food Dump Processing
- Quick-save zone for recipe ideas (links, notes, images, voice)
- AI converts dump items into full structured recipes
- Processing pipeline: analyzing -> generating -> creating grocery list -> done

### 11. Snap a Craving / DIY Cravings
- Camera capture of restaurant/delivery food
- AI generates homemade version with delivery price vs. DIY price comparison

### 12. Cookbook Integration
- OpenLibrary API search
- ISBN barcode scanning via camera
- Manual entry for physical cookbooks
- Recipes linked to specific cookbooks with page numbers

---

## RevenueCat Implementation

### Configuration
```typescript
// context/RevenueCatContext.tsx
// Platform-aware API key selection:
//   DEV / Web -> EXPO_PUBLIC_REVENUECAT_TEST_API_KEY
//   iOS production -> EXPO_PUBLIC_REVENUECAT_IOS_API_KEY
//   Android production -> EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY
// Singleton configuration pattern (ensureConfigured) to prevent double-init
// Debug logging enabled via Purchases.setLogLevel(LOG_LEVEL.DEBUG)
```

### Entitlement
- **Entitlement ID:** `premium`
- **Product:** `totie_monthly_9999` — $9.99/month subscription with optional 7-day free trial

### SDK Integration (`react-native-purchases` v9.7.6)
- **Customer Info** — Fetched via React Query (`useQuery`) with 5-minute stale time, 2 retries
- **Offerings** — Fetched via React Query with 10-minute stale time, 2 retries
- **Purchases** — Handled via `useMutation` with optimistic cache updates on success
- **Restore** — Dedicated `useMutation` with immediate cache invalidation
- **Listener** — `addCustomerInfoUpdateListener` syncs real-time subscription changes to React Query cache
- **Web fallback** — Graceful degradation on web (skips RC initialization, returns non-premium state)

### Premium Gating
- `isPremium` derived from: `rcIsPremium || localIsPremium` (RevenueCat truth + local AsyncStorage fallback)
- Gated features: recipe saving from links, screenshot-to-recipe, AI fridge scanning, smart grocery lists, unlimited recipe storage, savings tracker
- Free tier: 1 free recipe save, basic pantry tracking

### Paywall UI (`components/PremiumPaywall.tsx`)
- Full-screen modal with animated entrance (spring + slide animations)
- Feature comparison table (Free vs Premium)
- Dynamic pricing from RevenueCat offerings (`currentOffering.availablePackages`)
- Free trial detection via `introPrice.periodNumberOfUnits`
- Animated Totie mascot with floating crown
- Rescue/win-back paywall variant (one-time special offer with urgency cues)
- Loading states, error handling, purchase-in-progress indicators
- Restore purchases button
- Haptic feedback on all interactions

### Onboarding Paywall (`app/onboarding/paywall.tsx`)
- Appears at end of 22-screen onboarding flow
- Personalized based on onboarding data (spending habits, household size)
- Shows calculated potential savings

---

## Onboarding Flow (22 Screens)

A narrative-driven, psychology-heavy funnel designed for conversion:

| # | Screen | What It Does |
|---|--------|-------------|
| 1 | **Welcome** | Animated typewriter: "Let's order takeout" -> deletes -> "We've Got Food @ Home". Links to totieapp.com/terms and totieapp.com/privacy |
| 2 | **Hook** | Emotional hook about the delivery trap |
| 3 | **Confession** | "We've all been there" empathy moment |
| 4 | **Villain** | Frames delivery apps as the villain |
| 5 | **Promise** | What Totie promises to do for you |
| 6 | **How It Works** | 3-step explainer of the app |
| 7 | **Eating Habits** | Quiz: cook / delivery / eat out |
| 8 | **Delivery Frequency** | How often they order (rarely, 1-2x, 3-4x, daily) |
| 9 | **Weekly Spend** | How much they spend weekly ($0-25, $25-50, $50-100, $100+) |
| 10 | **Spending Stats** | Personalized yearly spend calculation (shock value) |
| 11 | **Pain Points** | Multi-select: what frustrates them about cooking |
| 12 | **Exciting** | What excites them most |
| 13 | **Diet** | Dietary preferences (8 options) |
| 14 | **Household** | Household size (1, 2, 3-4, 5+) |
| 15 | **Comparison** | Delivery vs. home cooking cost comparison |
| 16 | **Features** | Feature highlights |
| 17 | **Profile Summary** | Recap of all inputs |
| 18 | **Savings** | Projected savings visualization |
| 19 | **Loading** | Animated "building your plan" screen |
| 20 | **Paywall** | Subscription screen |
| 21 | **Review Request** | App store review prompt |
| 22 | **Name** | Enter their name (personalization) |

---

## 5 Main Tabs

| Tab | Icon | Route | Purpose |
|-----|------|-------|---------|
| **Home** | `Home` | `/home` | Dashboard, Totie mascot assistant, quick actions, stats |
| **Kitchen** | `Refrigerator` | `/kitchen` | Manage fridge/pantry items + grocery lists |
| **Cook** | `ChefHat` | `/cook-now` | Match kitchen items to recipes, AI meal suggestions |
| **Recipes** | `BookOpen` | `/recipes` | Recipe library, cookbooks, food dump, add recipes |
| **Profile** | `User` | `/profile` | Stats, settings, challenges, share wins |

The **Cook** tab has an elevated, oversized button in the center of the tab bar (neo-brutalist design).

---

## Design System

- **Primary:** `#FF6B4A` (coral/orange-red)
- **Secondary:** `#1A535C` (deep teal)
- **Accent:** `#FFB347` (warm orange)
- **Mint:** `#7DDBA3` (green)
- **Background:** `#FFF9F5` (warm cream)
- **Style:** Neo-brutalist — bold 2px borders, hard shadows, warm cream/orange palette
- **Fonts:** Nunito (Regular, SemiBold, Bold, ExtraBold) + Bangers
- **Icons:** lucide-react-native
- **Haptics:** expo-haptics throughout all interactions

---

## Build & Platform Details

- **Expo SDK:** 54.0.27+
- **New Architecture:** Enabled (`newArchEnabled: true`)
- **Typed Routes:** Enabled (`experiments.typedRoutes: true`)
- **iOS Bundle ID:** `com.appwiththat.totie`
- **Android Package:** `com.appwiththat.totie`
- **Orientation:** Portrait only

---

## Links & Contact

- **Terms:** totieapp.com/terms
- **Privacy:** totieapp.com/privacy
- **Support:** support@totieapp.com (with auto-attached device ID)
