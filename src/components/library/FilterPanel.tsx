import { Button, Text, XStack, YStack } from 'tamagui';

import {
  type FacetKey,
  FACET_KEYS,
  type FacetValueCount,
  type Filters,
} from '@/features/library/faceting';
import { OWNERSHIP_LABELS, palette, STATUS_LABELS } from '@/theme/tokens';

const FACET_LABELS: Record<FacetKey, string> = {
  status: 'Statut',
  ownership: 'Possession',
  shelf: 'Étagère',
  tag: 'Tag',
  genre: 'Genre',
  author: 'Auteur',
  publisher: 'Éditeur',
  language: 'Langue',
  decade: 'Décennie',
};

const LANG_VALUE: Record<string, string> = {
  fr: 'Français', en: 'Anglais', it: 'Italien', es: 'Espagnol', de: 'Allemand',
  pt: 'Portugais', nl: 'Néerlandais', ja: 'Japonais', zh: 'Chinois', ru: 'Russe',
  ar: 'Arabe', la: 'Latin', el: 'Grec', he: 'Hébreu', ko: 'Coréen', pl: 'Polonais',
};

export function displayValue(key: FacetKey, value: string): string {
  if (key === 'status') return STATUS_LABELS[value as keyof typeof STATUS_LABELS] ?? value;
  if (key === 'ownership') return OWNERSHIP_LABELS[value as keyof typeof OWNERSHIP_LABELS] ?? value;
  if (key === 'language') return LANG_VALUE[value] ?? value;
  if (key === 'tag') return `#${value}`;
  return value;
}

const MAX_PER_FACET = 14;

interface FilterPanelProps {
  facets: Record<FacetKey, FacetValueCount[]>;
  filters: Filters;
  onToggle: (key: FacetKey, value: string) => void;
}

export function FilterPanel({ facets, filters, onToggle }: FilterPanelProps) {
  return (
    <YStack
      gap="$4"
      padding="$4"
      backgroundColor="$backgroundStrong"
      borderColor="$borderColor"
      borderWidth={1}
      borderRadius={12}
    >
      {FACET_KEYS.map((key) => {
        const selected = filters.facets[key];
        const options = facets[key];
        // Show a facet only when it discriminates (more than one value).
        if (options.length < 2 && !selected.length) return null;
        const shown = options.slice(0, MAX_PER_FACET);
        return (
          <YStack key={key} gap="$2">
            <Text
              fontFamily="$body"
              fontSize={11}
              fontWeight="600"
              letterSpacing={2}
              textTransform="uppercase"
              color="$colorMuted"
            >
              {FACET_LABELS[key]}
            </Text>
            <XStack gap="$2" flexWrap="wrap">
              {shown.map((opt) => {
                const active = selected.includes(opt.value);
                return (
                  <Button
                    key={opt.value}
                    onPress={() => onToggle(key, opt.value)}
                    height={32}
                    paddingHorizontal="$3"
                    borderRadius={999}
                    borderWidth={1}
                    borderColor={active ? '$accent' : '$borderColor'}
                    backgroundColor={active ? '$accent' : 'transparent'}
                    color={active ? palette.paper : '$colorSoft'}
                    fontFamily="$body"
                    fontSize={13}
                    fontWeight="500"
                  >
                    {`${displayValue(key, opt.value)} · ${opt.count}`}
                  </Button>
                );
              })}
            </XStack>
          </YStack>
        );
      })}
    </YStack>
  );
}
