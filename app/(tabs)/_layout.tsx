import { Tabs } from "expo-router";
import { BookOpen, ChefHat, Home, Refrigerator, User } from "lucide-react-native";
import React from "react";
import { TouchableOpacity, StyleSheet, View, GestureResponderEvent } from "react-native";

import colors from "@/constants/colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarButton: (props) => {
          const handlePress = (e: GestureResponderEvent) => {
            console.log("[tabs] tab pressed");
            props.onPress?.(e);
          };

          return (
            <TouchableOpacity
              accessibilityRole={props.accessibilityRole as any}
              accessibilityState={props.accessibilityState}
              accessibilityLabel={props.accessibilityLabel ?? undefined}
              testID={props.testID ?? undefined}
              onPress={handlePress}
              onLongPress={props.onLongPress ?? undefined}
              delayPressIn={0}
              pressRetentionOffset={{ top: 20, left: 20, bottom: 20, right: 20 }}
              hitSlop={{ top: 10, left: 10, bottom: 10, right: 10 }}
              style={props.style}
              activeOpacity={0.7}
            >
              {props.children}
            </TouchableOpacity>
          );
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 2,
          borderTopColor: colors.black,
          height: 90,
          paddingTop: 12,
          paddingBottom: 24,
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 0,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontWeight: '700' as const,
          fontSize: 11,
          letterSpacing: 0.3,
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          href: "/home",
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Home size={22} color={color} strokeWidth={2.5} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="kitchen"
        options={{
          href: "/kitchen",
          title: "Kitchen",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Refrigerator size={22} color={color} strokeWidth={2.5} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="cook-now"
        options={{
          href: "/cook-now",
          title: "Cook",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.cookButton, focused && styles.cookButtonActive]}>
              <ChefHat size={24} color={focused ? colors.white : colors.primary} strokeWidth={2.5} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          href: "/recipes",
          title: "Recipes",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <BookOpen size={22} color={color} strokeWidth={2.5} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: "/profile",
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <User size={22} color={color} strokeWidth={2.5} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    padding: 6,
    borderRadius: 12,
  },
  iconWrapActive: {
    backgroundColor: colors.primaryLight,
  },
  cookButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
  },
  cookButtonActive: {
    backgroundColor: colors.primary,
  },
});
