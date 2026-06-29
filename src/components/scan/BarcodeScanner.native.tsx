import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { Alert, Animated, Easing, Linking, StyleSheet, View } from 'react-native';
import { Button, Text, YStack } from 'tamagui';

import { palette } from '@/theme/tokens';

const RETICLE_H = 150;

interface BarcodeScannerProps {
  onScan: (value: string) => void;
  paused?: boolean;
}

/** Native (iOS/Android) barcode scanner: expo-camera with EAN/UPC + haptics. */
export function BarcodeScanner({ onScan, paused = false }: BarcodeScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const last = useRef<{ value: string; at: number }>({ value: '', at: 0 });
  const beam = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(beam, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(beam, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [beam]);

  const askPermission = async () => {
    const result = await requestPermission();
    if (!result.granted && !result.canAskAgain) {
      Alert.alert(
        'Caméra refusée',
        'Autorisez la caméra dans les réglages pour scanner les codes-barres.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Ouvrir les réglages', onPress: () => Linking.openSettings() },
        ],
      );
    }
  };

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <YStack
        gap="$3"
        padding="$4"
        backgroundColor="$backgroundStrong"
        borderColor="$borderColor"
        borderWidth={1}
        borderRadius={12}
      >
        <Text fontFamily="$body" color="$colorSoft" lineHeight={20}>
          Autorisez la caméra pour scanner les codes-barres des livres.
        </Text>
        <Button
          onPress={askPermission}
          backgroundColor="$accent"
          color={palette.paper}
          borderRadius={12}
          height={46}
          fontFamily="$body"
          fontWeight="600"
        >
          {permission.canAskAgain ? 'Autoriser la caméra' : 'Ouvrir les réglages'}
        </Button>
      </YStack>
    );
  }

  const handle = ({ data }: { data: string }) => {
    const now = Date.now();
    if (data === last.current.value && now - last.current.at < 2500) return;
    last.current = { value: data, at: now };
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    onScan(data);
  };

  const translateY = beam.interpolate({ inputRange: [0, 1], outputRange: [0, RETICLE_H - 2] });

  return (
    <View style={styles.wrap}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a'] }}
        onBarcodeScanned={paused ? undefined : handle}
      />
      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.reticle}>
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
          <Animated.View style={[styles.beam, { transform: [{ translateY }] }]} />
        </View>
      </View>
      <Text
        position="absolute"
        bottom={12}
        left={0}
        right={0}
        textAlign="center"
        fontFamily="$body"
        fontSize={12}
        fontWeight="600"
        color={palette.paper}
      >
        Visez le code-barres
      </Text>
    </View>
  );
}

const CORNER = 24;
const BORDER = 3;
const styles = StyleSheet.create({
  wrap: {
    height: 280,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: palette.nuit,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticle: { width: '76%', height: RETICLE_H },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: palette.scanBeam },
  tl: { top: 0, left: 0, borderTopWidth: BORDER, borderLeftWidth: BORDER, borderTopLeftRadius: 5 },
  tr: {
    top: 0,
    right: 0,
    borderTopWidth: BORDER,
    borderRightWidth: BORDER,
    borderTopRightRadius: 5,
  },
  bl: {
    bottom: 0,
    left: 0,
    borderBottomWidth: BORDER,
    borderLeftWidth: BORDER,
    borderBottomLeftRadius: 5,
  },
  br: {
    bottom: 0,
    right: 0,
    borderBottomWidth: BORDER,
    borderRightWidth: BORDER,
    borderBottomRightRadius: 5,
  },
  beam: {
    position: 'absolute',
    left: '5%',
    right: '5%',
    height: 2,
    borderRadius: 2,
    backgroundColor: palette.scanBeam,
  },
});
