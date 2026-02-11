import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '@/constants/colors';

interface ProgressBarProps {
  progress: number;
  total: number;
}

export default function ProgressBar({ progress, total }: ProgressBarProps) {
  const percentage = (progress / total) * 100;
  
  return (
    <View style={styles.container}>
      <View style={styles.barContainer}>
        <View style={styles.background}>
          <View style={[styles.fill, { width: `${percentage}%` }]} />
        </View>
      </View>
      <View style={styles.stepIndicator}>
        <Text style={styles.stepText}>{progress}/{total}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  barContainer: {
    flex: 1,
  },
  background: {
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  stepIndicator: {
    marginLeft: 12,
    backgroundColor: colors.cardAlt,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: colors.textSecondary,
  },
});
