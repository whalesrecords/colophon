import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { useEffect, useRef, useState } from 'react';
import { Button, Text, YStack } from 'tamagui';

import { palette } from '@/theme/tokens';

interface BarcodeScannerProps {
  onScan: (value: string) => void;
  paused?: boolean;
}

/**
 * Web barcode scanner (Chrome/Safari/Firefox) using ZXing on a getUserMedia
 * video stream. The camera only starts on an explicit tap (user gesture).
 */
export function BarcodeScanner({ onScan, paused = false }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const last = useRef<{ value: string; at: number }>({ value: '', at: 0 });
  const pausedRef = useRef(paused);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    if (!active || !videoRef.current) return;
    let cancelled = false;
    const reader = new BrowserMultiFormatReader();
    reader
      .decodeFromVideoDevice(undefined, videoRef.current, (result) => {
        if (!result || pausedRef.current) return; // ignore decodes while a sheet is open
        const value = result.getText();
        const now = Date.now();
        if (value === last.current.value && now - last.current.at < 2500) return;
        last.current = { value, at: now };
        onScan(value);
      })
      .then((controls) => {
        if (cancelled) controls.stop();
        else controlsRef.current = controls;
      })
      .catch(() => setError('Caméra indisponible — utilisez la saisie ci-dessous.'));
    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [active, onScan]);

  if (!active) {
    return (
      <Button
        onPress={() => setActive(true)}
        backgroundColor="$backgroundStrong"
        borderColor="$borderColor"
        borderWidth={1}
        borderRadius={12}
        height={48}
        fontFamily="$body"
        fontWeight="600"
        color="$color"
      >
        Activer la caméra
      </Button>
    );
  }

  return (
    <YStack gap="$2">
      {error ? (
        <Text color="$signal" fontFamily="$body" fontSize={13}>
          {error}
        </Text>
      ) : null}
      {/* eslint-disable-next-line */}
      <video
        ref={videoRef}
        muted
        playsInline
        style={{ width: '100%', maxHeight: 320, borderRadius: 8, background: palette.ink }}
      />
      <Button
        onPress={() => setActive(false)}
        chromeless
        height={36}
        fontFamily="$body"
        color="$colorMuted"
      >
        Arrêter la caméra
      </Button>
    </YStack>
  );
}
