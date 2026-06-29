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

  // Inject the scan-beam keyframe once (the line sweeps the reticle).
  useEffect(() => {
    if (typeof document === 'undefined' || document.getElementById('cph-beam-kf')) return;
    const s = document.createElement('style');
    s.id = 'cph-beam-kf';
    s.textContent = '@keyframes cphBeam{0%,100%{top:4%}50%{top:92%}}';
    document.head.appendChild(s);
  }, []);

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
      <YStack
        position="relative"
        borderRadius={16}
        overflow="hidden"
        backgroundColor={palette.nuit}
      >
        {/* eslint-disable-next-line */}
        <video
          ref={videoRef}
          muted
          playsInline
          style={{ width: '100%', maxHeight: 320, display: 'block' }}
        />
        {/* 4-corner reticle + sweeping scan beam (refonte) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div style={{ position: 'relative', width: '76%', height: '54%' }}>
            {(['tl', 'tr', 'bl', 'br'] as const).map((c) => {
              const top = c[0] === 't';
              const left = c[1] === 'l';
              return (
                <div
                  key={c}
                  style={{
                    position: 'absolute',
                    width: 24,
                    height: 24,
                    [top ? 'top' : 'bottom']: 0,
                    [left ? 'left' : 'right']: 0,
                    [`border${top ? 'Top' : 'Bottom'}`]: `3px solid ${palette.scanBeam}`,
                    [`border${left ? 'Left' : 'Right'}`]: `3px solid ${palette.scanBeam}`,
                    [`border${top ? 'Top' : 'Bottom'}${left ? 'Left' : 'Right'}Radius`]: 5,
                  }}
                />
              );
            })}
            <div
              style={{
                position: 'absolute',
                left: '5%',
                right: '5%',
                height: 2,
                borderRadius: 2,
                background: palette.scanBeam,
                boxShadow: `0 0 8px 1px ${palette.scanBeam}`,
                animation: 'cphBeam 2.4s ease-in-out infinite',
              }}
            />
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 10,
            left: 0,
            right: 0,
            textAlign: 'center',
            color: 'rgba(244,238,226,0.85)',
            font: '600 12px -apple-system, sans-serif',
            letterSpacing: '0.04em',
            pointerEvents: 'none',
          }}
        >
          Visez le code-barres
        </div>
      </YStack>
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
