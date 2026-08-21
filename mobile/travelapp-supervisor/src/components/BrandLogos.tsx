import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

interface LogoProps {
  size?: number;
  textColor?: string;
  isAccentColor?: boolean;
}

export function TravelCabLogo({ size = 180, textColor = '#FFFFFF' }: LogoProps) {
  const isWhite = textColor === '#FFFFFF' || textColor === 'white' || textColor === '#fff';
  const imgSource = isWhite
    ? require('../../assets/travelcab_blanco.png')
    : require('../../assets/travelcab_original.png');

  return (
    <View style={styles.container}>
      <Image
        source={imgSource}
        style={{ width: size, height: size * 0.36 }}
        resizeMode="contain"
      />
    </View>
  );
}

export function TravelAppLogo({ size = 140, textColor = '#FFFFFF' }: LogoProps) {
  const isWhite = textColor === '#FFFFFF' || textColor === 'white' || textColor === '#fff';
  const imgSource = isWhite
    ? require('../../assets/travelapp_blanco.png')
    : require('../../assets/travelapp_original.png');

  return (
    <View style={styles.container}>
      <Image
        source={imgSource}
        style={{ width: size, height: size * 0.36 }}
        resizeMode="contain"
      />
    </View>
  );
}

export function TravelExperienceLogo({ size = 180, textColor = '#0B192C' }: LogoProps) {
  const isWhite = textColor === '#FFFFFF' || textColor === 'white' || textColor === '#fff';
  const imgSource = isWhite
    ? require('../../assets/experience_blanco.png')
    : require('../../assets/experience_original.png');

  return (
    <View style={styles.container}>
      <Image
        source={imgSource}
        style={{ width: size, height: size * 0.36 }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
