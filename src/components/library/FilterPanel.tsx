import { useState } from 'react';
import { Pressable } from 'react-native';
import { Button, Text, XStack, YStack } from 'tamagui';

import { useT } from '@/i18n';
import type { TranslationKey } from '@/i18n';
import {
  type FacetKey,
  FACET_KEYS,
  type FacetValueCount,
  type Filters,
} from '@/features/library/faceting';
import { FORMAT_LABELS, OWNERSHIP_LABELS, palette, STATUS_LABELS } from '@/theme/tokens';

const FACET_LABEL_KEYS: Record<FacetKey, TranslationKey> = {
  status: 'filter.status',
  ownership: 'filter.ownership',
  format: 'filter.format',
  shelf: 'filter.shelf',
  tag: 'filter.tag',
  genre: 'filter.genre',
  author: 'filter.author',
  publisher: 'filter.publisher',
  language: 'filter.language',
  decade: 'filter.decade',
};

const LANG_VALUE: Record<string, string> = {
  fr: 'Français',
  en: 'Anglais',
  it: 'Italien',
  es: 'Espagnol',
  de: 'Allemand',
  pt: 'Portugais',
  nl: 'Néerlandais',
  ja: 'Japonais',
  zh: 'Chinois',
  ru: 'Russe',
  ar: 'Arabe',
  la: 'Latin',
  el: 'Grec',
  he: 'Hébreu',
  ko: 'Coréen',
  pl: 'Polonais',
};

export function displayValue(key: FacetKey, value: string): string {
  if (key === 'status') return STATUS_LABELS[value as keyof typeof STATUS_LABELS] ?? value;
  if (key === 'ownership') return OWNERSHIP_LABELS[value as keyof typeof OWNERSHIP_LABELS] ?? value;
  if (key === 'format') return FORMAT_LABELS[value as keyof typeof FORMAT_LABELS] ?? value;
  if (key === 'language') return LANG_VALUE[value] ?? value;
  if (key === 'tag') return `#${value}`;
  return value;
}

const MAX_PER_FACET = 24;

interface FilterPanelProps {
  facets: Record<FacetKey, FacetValueCount[]>;
  filters: Filters;
  onToggle: (key: FacetKey, value: string) => void;
}

/**
 * Compact, accordion-style facets: each is a single collapsible row (with a
 * selected-summary) so the panel stays short; tap one to reveal its chips. The
 * facet that already has a selection starts open.
 */
export function FilterPanel({ facets, filters, onToggle }: FilterPanelProps) {
  const { t } = useT();
  const visible = FACET_KEYS.filter((k) => facets[k].length >= 2 || filters.facets[k].length > 0);
  const [open, setOpen] = useState<FacetKey | null>(
    () => visible.find((k) => filters.facets[k].length > 0) ?? null,
  );

  return (
    <YStack
      paddingVertical="$1"
      paddingHorizontal="$3"
      backgroundColor="$backgroundStrong"
      borderColor="$borderColor"
      borderWidth={1}
      borderRadius={12}
    >
      {visible.map((key, i) => {
        const selected = filters.facets[key];
        const isOpen = open === key;
        const summary =
          selected.length > 0
            ? selected.map((v) => displayValue(key, v)).join(', ')
            : `${facets[key].length}`;
        return (
          <YStack
            key={key}
            borderTopWidth={i === 0 ? 0 : 1}
            borderTopColor="$borderColor"
            paddingVertical="$2"
          >
            <Pressable onPress={() => setOpen(isOpen ? null : key)}>
              <XStack alignItems="center" justifyContent="space-between" gap="$2">
                <Text
                  fontFamily="$body"
                  fontSize={12}
                  fontWeight="600"
                  letterSpacing={1.5}
                  textTransform="uppercase"
                  color={selected.length ? '$accent' : '$colorMuted'}
                >
                  {t(FACET_LABEL_KEYS[key])}
                </Text>
                <XStack alignItems="center" gap="$2" flex={1} justifyContent="flex-end">
                  <Text
                    fontFamily="$body"
                    fontSize={12}
                    color={selected.length ? '$color' : '$colorMuted'}
                    numberOfLines={1}
                  >
                    {summary}
                  </Text>
                  <Text fontFamily="$body" fontSize={13} color="$colorMuted">
                    {isOpen ? '−' : '+'}
                  </Text>
                </XStack>
              </XStack>
            </Pressable>

            {isOpen ? (
              <XStack gap="$2" flexWrap="wrap" marginTop="$2">
                {facets[key].slice(0, MAX_PER_FACET).map((opt) => {
                  const active = selected.includes(opt.value);
                  return (
                    <Button
                      key={opt.value}
                      onPress={() => onToggle(key, opt.value)}
                      height={28}
                      paddingHorizontal="$2.5"
                      borderRadius={999}
                      borderWidth={1}
                      borderColor={active ? '$accent' : '$borderColor'}
                      backgroundColor={active ? '$accent' : 'transparent'}
                      color={active ? palette.paper : '$colorSoft'}
                      fontFamily="$body"
                      fontSize={12}
                      fontWeight="500"
                    >
                      {`${displayValue(key, opt.value)} · ${opt.count}`}
                    </Button>
                  );
                })}
              </XStack>
            ) : null}
          </YStack>
        );
      })}
    </YStack>
  );
}
