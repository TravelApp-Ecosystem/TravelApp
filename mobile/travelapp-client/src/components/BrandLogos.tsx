import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '../lib/constants';

interface LogoProps {
  size?: number;
  textColor?: string;
  isAccentColor?: boolean;
}

export function TravelCabLogo({ size = 40, textColor, isAccentColor = true }: LogoProps) {
  const defaultTextPrimaryColor = textColor || Colors.textPrimary;
  const accentTextWordColor = isAccentColor ? Colors.accent : Colors.white;

  return (
    <View style={styles.container}>
      <Svg
        width={size}
        height={size * 0.9}
        viewBox="0 0 100 135"
        fill="none"
      >
        <Path
          fill="#ff7a00"
          d="M 1.378906 129.910156 L 50.621094 3.613281 L 98.011719 130.386719 L 50.621094 91.445312 Z"
        />
      </Svg>
      <View style={styles.textRow}>
        <Text style={[styles.brandText, { color: defaultTextPrimaryColor }]}>Travel</Text>
        <Text style={[styles.brandText, { color: accentTextWordColor }]}>Cab</Text>
      </View>
    </View>
  );
}

export function TravelAppLogo({ size = 30, textColor, isAccentColor = true }: LogoProps) {
  const defaultTextPrimaryColor = textColor || Colors.textPrimary;
  const accentTextWordColor = isAccentColor ? Colors.accent : Colors.white;

  return (
    <View style={styles.container}>
      <Svg
        width={size}
        height={size * 0.9}
        viewBox="0 0 100 135"
        fill="none"
      >
        <Path
          fill="#ff7a00"
          d="M 1.378906 129.910156 L 50.621094 3.613281 L 98.011719 130.386719 L 50.621094 91.445312 Z"
        />
      </Svg>
      <View style={styles.textRow}>
        <Text style={[styles.appText, { color: defaultTextPrimaryColor }]}>Travel</Text>
        <Text style={[styles.appText, { color: accentTextWordColor }]}>App</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  textRow: {
    flexDirection: 'row',
  },
  brandText: {
    fontSize: 28,
    fontFamily: 'Quicksand-Bold',
  },
  appText: {
    fontSize: 20,
    fontFamily: 'Quicksand-Bold',
  },
});
