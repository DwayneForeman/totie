# Totie — "We've Got Food @ Home" — Master Breakdown

## What is Totie?

**Totie** is a mobile app that helps users stop ordering delivery and start cooking at home. It acts as a personal cooking sidekick that tracks what's in your kitchen, manages recipes, matches ingredients to meals you can cook *right now*, and gamifies the whole experience to keep you motivated. The core value prop: **save money, eat better, waste less food.**

---

## App Structure

### Entry & Routing
- **`app/index.tsx`** — Entry redirect (sends to onboarding or main tabs based on state)
- **`app/_layout.tsx`** — Root layout with AppProvider, stack navigation
- **`app/modal.tsx`** — Generic modal route
- **`app/gamification.tsx`** — Standalone gamification/achievements screen

### 5 Main Tabs
| Tab | Icon | File | Purpose |
|-----|------|------|---------|
| **Home** | House | `home.tsx` | Dashboard, Totie assistant, quick actions, snap-a-craving |
| **Kitchen** | Refrigerator | `kitchen.tsx` | Manage fridge/pantry items + grocery lists |
| **Cook** | Chef Hat | `cook-now.tsx` | Match kitchen items to recipes, AI meal suggestions |
| **Recipes** | Book | `recipes.tsx` | Recipe library, cookbooks, food dump, add recipes |
| **Profile** | User | `profile.tsx` | Stats, settings, challenges, share wins |

---

## Onboarding Flow (20+ screens)

A narrative-driven, psychology-heavy onboarding funnel designed for conversion:

1. **Welcome** — Animated intro with typewriter text ("Let's order takeout" -> deletes -> "We've Got Food @ Home")
2. **Hook** — Emotional hook about the delivery trap
3. **Confession** — "We've all been there" empathy moment
4. **Villain** — Frames delivery apps as the villain
5. **Promise** — What Totie promises to do for you
6. **How It Works** — 3-step explainer of the app
7. **Eating Habits** — Quiz: cook / delivery / eat out
8. **Delivery Frequency** — How often they order delivery
9. **Weekly Spend** — How much they spend weekly on food
10. **Spending Stats** — Personalized calculation of yearly spend (shock value)
11. **Pain Points** — Multi-select: what frustrates them about cooking
12. **Exciting** — What excites them most about the app
13. **Diet** — Dietary preferences
14. **Household** — Household size
15. **Comparison** — Delivery vs. home cooking cost comparison
16. **Features** — Feature highlights
17. **Profile Summary** — Recap of their inputs
18. **Savings** — Projected savings visualization
19. **Loading** — Animated "building your plan" screen
20. **Paywall** — Subscription/purchase screen
21. **Review Request** — App store review prompt
22. **Name** — Enter their name (personalization)

---

## Home Tab — Dashboard & Totie Assistant

- **Totie** — An animated mascot/assistant character that floats, gives contextual tips via typewriter text based on user state (has pantry? has recipes? has cooked?)
- **Quick Action Cards:**
  - **Add Recipe** — Navigate to Recipes tab
  - **My Kitchen** — Navigate to Kitchen tab
  - **Cook Now** — Navigate to Cook tab
  - **Snap a Craving** — Camera feature to photograph a craving (restaurant meal, food ad, etc.) for later DIY recreation
- **Stats Banner** — Shows meals cooked, recipes saved, pantry items
- **Spotlight Tutorial** — First-time CoachMarks walkthrough with Totie guiding through each action card

---

## Kitchen Tab — Inventory & Grocery Management

Three sub-sections via tabs: **Fridge**, **Pantry**, **Grocery List**

### Fridge & Pantry
- Add items manually, from common item quick-picks, or via search
- Items categorized: produce, dairy, protein, grains, pantry staples, frozen, other
- Each item has: name, category, quantity, expiration date, location (fridge/pantry)
- Delete items with swipe/button

### Grocery List
- Auto-generated from recipes (add recipe ingredients -> grocery list)
- **Check off items -> automatically added to pantry** (smart flow)
- **Uncheck items -> removed from pantry** (bidirectional sync)
- Multiple lists supported, one active at a time
- Items grouped by category with emoji indicators

### Page Coach Marks — Kitchen-specific tutorial overlay

---

## Cook Now Tab — Smart Recipe Matching

The core "magic" feature:

- **Matches pantry/fridge items against saved recipes**
- Recipes sorted into tiers:
  - **Ready Now** — 100% ingredient match
  - **Almost There** — Missing 1-2 items
  - **Worth a Trip** — Needs several more ingredients
- Each match shows: match %, matching ingredients, missing ingredients
- **Add missing ingredients to grocery list** with one tap (cart icon)
- **Full Cooking Mode** — Step-by-step instruction walkthrough
- **AI Chef Mode** — Uses `@rork-ai/toolkit-sdk` `generateObject` with Zod schemas to generate a custom recipe from available pantry items when no good matches exist
- Page Coach Marks tutorial

---

## Recipes Tab — Recipe Library & Food Dump

### Filter Chips
All | Saved | Cookbooks | DIY Cravings | Food Dump | Favorites

### Recipe Sources
1. **Manual Entry** — Type in a recipe
2. **URL Import** — Paste a recipe link
3. **Cookbook Integration** — Search OpenLibrary API, scan ISBN via camera, or manual entry for physical cookbooks
4. **Food Dump** — Quick-save ideas (links, notes) to process into recipes later
5. **AI Generation** — Generate recipes from food dump items using AI
6. **Snap a Craving / DIY Cravings** — Photograph delivery/restaurant meals -> AI generates homemade version with cost comparison (delivery price vs. DIY price)

### Recipe Detail
- AI-generated food images (via Unsplash-style URLs)
- Ingredients list with amounts
- Step-by-step instructions
- Prep time, cook time, servings
- **Nutrition info** (calories, salt level, sugar level) — auto-generated based on ingredients
- Favorite toggle
- Add ingredients to grocery list
- Full cooking mode (step-by-step walkthrough)
- Source attribution (cookbook + page number, URL, etc.)

### Cookbook Shelf
- Visual bookshelf UI with colored spines
- Linked to OpenLibrary API for search
- ISBN barcode scanning via camera
- Recipes linked to specific cookbooks with page numbers

### Food Dump
- Quick-save zone for recipe ideas (links, notes, images, voice)
- "Process" button uses AI to convert a dump item into a full recipe
- Processing pipeline: analyzing -> generating -> creating grocery list -> done

### Page Coach Marks tutorial

---

## Profile Tab — Stats, Settings & Challenges

### Stats Display
- Total savings ($)
- Meals cooked
- Recipes saved
- Current streak
- Coins earned

### Daily & Weekly Challenges
- Example: "Cook 3 meals this week" with progress bar
- Coin rewards for completion
- Claim reward button

### Settings
- Edit name
- Diet preferences (editable)
- Household size (editable)
- Notification preferences (meal reminders, challenges, tips)
- Share wins (native share / clipboard)
- Reset app (full data wipe)

### Debug Mode
- Hidden: tap title 10 times to enable
- Sends back to onboarding for testing

---

## Gamification Screen (`app/gamification.tsx`)

- **XP System** — Earn XP from meals cooked, recipes saved, pantry items, savings
- **Level Progression** — 8 levels with increasing XP thresholds
- **Achievements:**
  - First Meal
  - Week Warrior (7-day streak)
  - Recipe Collector (10 recipes)
  - Pantry Pro (20 pantry items)
  - Money Saver ($50 saved)
  - Master Chef (25 meals)
- Progress bars for each achievement
- Coins balance display

---

## Tutorial System (Coach Marks)

Two layers:

### 1. Global Spotlight Tutorial (`CoachMarks.tsx`)
- First-time full walkthrough with Totie mascot
- Steps: Welcome -> Stock Kitchen -> Add Recipes -> Cook Now -> Snap a Craving -> Complete
- SVG spotlight mask with animated transitions
- Haptic feedback on each step

### 2. Page-Level Tutorials (`PageCoachMarks.tsx`)
- Per-tab tutorial overlays
- Kitchen, Cook Now, and Recipes tabs each have their own
- Tracked via `pageTutorials` in AsyncStorage
- Only shows once per page

---

## Data Model Summary

| Entity | Key Fields |
|--------|------------|
| **UserProfile** | name, diet, allergies, household size, savings, meals cooked, streak, coins |
| **Recipe** | title, image, ingredients, instructions, times, servings, source, nutrition, favorite, cookbook link |
| **PantryItem** | name, category, quantity, expiration, location (fridge/pantry) |
| **Cookbook** | title, author, cover image, recipe count |
| **FoodDumpItem** | type (link/note/image/voice), content, processed status, linked recipe |
| **GroceryList** | name, items, linked recipes, active status |
| **GroceryItem** | name, amount, category, checked status, linked recipe |
| **Challenge** | title, type (daily/weekly), progress, target, coin reward |

---

## AI Features

All powered by `@rork-ai/toolkit-sdk` with Zod schema validation:

1. **AI Chef Mode** — Generate a recipe from available pantry items
2. **Food Dump Processing** — Convert saved links/notes into full recipes
3. **Snap a Craving** — Camera capture -> AI analyzes food -> generates DIY recipe with cost comparison
4. **AI Recipe Images** — Generated food photography for recipes

---

## Persistence

All data stored locally via **AsyncStorage** — no backend server. Keys:
- `@user_profile`, `@recipes`, `@pantry_items`, `@cookbooks`, `@food_dump`, `@grocery_lists`, `@tutorial_complete`, `@page_tutorials`, `@onboarding_data`

---

## Design System

- **Colors** defined in `constants/colors.ts` — primary color palette with semantic naming
- **Typography** defined in `constants/typography.ts`
- Neo-brutalist tab bar with bold borders and shadow
- Elevated "Cook" tab button in center
- Haptic feedback throughout (`expo-haptics`)
- Animated mascot, typewriter text effects, floating animations
