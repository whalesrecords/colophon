import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { normalizeCover } from '@/lib/cover';
import { COVER_ASPECT_RATIO, palette, shadows } from '@/theme/tokens';

export type CoverLayout = 'champ' | 'filets' | 'bande';

export interface BookCoverProps {
  title: string;
  author?: string | null;
  tag?: string | null;
  coverUrl?: string | null;
  /** ISBN-13, used to recover a cover from Open Library when none is supplied. */
  isbn?: string | null;
  /** Composed-cover background / foreground (used when no photo is available). */
  bg?: string;
  fg?: string;
  layout?: CoverLayout;
  width?: number;
  selected?: boolean;
  onPress?: () => void;
}

/**
 * The hero of the app. Renders a real cover photo when available, otherwise a
 * typographically composed cover (Colophon palette) treated as a physical
 * object: felted drop shadow, a darkened spine on the left, and a 1px inner
 * hairline. Ratio is a fixed 2:3.
 */
export function BookCover({
  title,
  author,
  tag,
  coverUrl,
  isbn,
  bg = palette.surfaceWarmAlt,
  fg = palette.ink,
  layout = 'champ',
  width = 120,
  selected = false,
  onPress,
}: BookCoverProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const height = width / COVER_ASPECT_RATIO;
  const effectiveCover = normalizeCover(coverUrl, isbn);
  const showPhoto = !!effectiveCover && !imageFailed;
  const titleSize = Math.max(11, Math.min(24, width * 0.125));

  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper onPress={onPress} style={{ width }}>
      {selected ? <View style={[styles.selectionRing, { borderRadius: 6 }]} /> : null}
      <View style={[styles.cover, shadows.cover, { width, height, backgroundColor: bg }]}>
        {showPhoto ? (
          <Image
            source={{ uri: effectiveCover! }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={180}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <ComposedCover
            title={title}
            author={author}
            tag={tag}
            fg={fg}
            layout={layout}
            titleSize={titleSize}
          />
        )}

        {/* spine: subtle darkened strip on the left edge */}
        <View style={styles.spine} pointerEvents="none" />
        {/* inner hairline */}
        <View style={styles.innerHairline} pointerEvents="none" />
      </View>

      {selected ? (
        <View style={styles.check}>
          <View style={styles.checkDot} />
        </View>
      ) : null}
    </Wrapper>
  );
}

function ComposedCover({
  title,
  author,
  tag,
  fg,
  layout,
  titleSize,
}: {
  title: string;
  author?: string | null;
  tag?: string | null;
  fg: string;
  layout: CoverLayout;
  titleSize: number;
}) {
  const labelStyle = {
    color: fg,
    fontFamily: 'SchibstedGrotesk_600SemiBold',
    fontSize: 9,
    letterSpacing: 1.6,
  };
  const titleStyle = {
    color: fg,
    fontFamily: 'Spectral_500Medium',
    fontSize: titleSize,
    lineHeight: titleSize * 1.08,
  };
  const authorStyle = {
    color: fg,
    fontFamily: 'Spectral_400Regular_Italic',
    fontSize: 11,
    opacity: 0.82,
  };

  if (layout === 'filets') {
    return (
      <View style={[styles.composed, { justifyContent: 'center', alignItems: 'center' }]}>
        <View style={[styles.rule, { backgroundColor: fg }]} />
        <Text style={[titleStyle, { textAlign: 'center', marginVertical: 8 }]} numberOfLines={4}>
          {title}
        </Text>
        <View style={[styles.rule, { backgroundColor: fg }]} />
        {author ? (
          <Text style={[authorStyle, { marginTop: 12, textAlign: 'center' }]} numberOfLines={1}>
            {author}
          </Text>
        ) : null}
      </View>
    );
  }

  if (layout === 'bande') {
    return (
      <View style={styles.composed}>
        <View style={[styles.band, { borderColor: fg }]}>
          {tag ? <Text style={[labelStyle, { textTransform: 'uppercase' }]}>{tag}</Text> : null}
        </View>
        <Text style={[titleStyle, { marginTop: 14 }]} numberOfLines={4}>
          {title}
        </Text>
        <View style={{ flex: 1 }} />
        {author ? (
          <Text style={authorStyle} numberOfLines={1}>
            {author}
          </Text>
        ) : null}
      </View>
    );
  }

  // 'champ' (default): tag top, title upper, author bottom
  return (
    <View style={styles.composed}>
      {tag ? <Text style={[labelStyle, { textTransform: 'uppercase' }]}>{tag}</Text> : null}
      <Text style={[titleStyle, { marginTop: tag ? 10 : 0 }]} numberOfLines={5}>
        {title}
      </Text>
      <View style={{ flex: 1 }} />
      {author ? (
        <Text style={authorStyle} numberOfLines={2}>
          {author}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cover: {
    borderRadius: 2,
    overflow: 'hidden',
  },
  composed: {
    flex: 1,
    padding: 12,
  },
  spine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '7%',
    backgroundColor: 'rgba(0,0,0,0.10)',
  },
  innerHairline: {
    position: 'absolute',
    inset: 0,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 2,
  },
  rule: {
    height: 1,
    alignSelf: 'stretch',
    opacity: 0.6,
  },
  band: {
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  selectionRing: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderWidth: 2,
    borderColor: palette.aizome,
  },
  check: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: palette.aizome,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.paper,
  },
});
