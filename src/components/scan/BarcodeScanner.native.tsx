import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useRef } from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';
import { Button, Text, YStack } from 'tamagui';

import { palette } from '@/theme/tokens';

interface BarcodeScannerProps {
  onScan: (value: string) => void;
}

/** Native (iOS/Android) barcode scanner: expo-camera with EAN/UPC + haptics. */
export function BarcodeScanner({ onScan }: BarcodeScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const last = useRef<{ value: string; at: number }>({ value: '', at: 0 });

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

  return (
    <View style={styles.wrap}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a'] }}
        onBarcodeScanned={handle}
      />
      <View style={styles.frame} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 280,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: palette.ink,
  },
  frame: {
    position: 'absolute',
    left: '12%',
    right: '12%',
    top: '30%',
    bottom: '30%',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
    borderRadius: 6,
  },
});
