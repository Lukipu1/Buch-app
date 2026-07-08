import { Ionicons } from '@expo/vector-icons';

export interface OnboardingSlide {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    icon: 'scan-outline',
    title: 'Bücher einscannen',
    description:
      'Nutze die Kamera, um Seiten deiner eigenen Bücher aufzunehmen – schnell und in hoher Qualität.',
  },
  {
    icon: 'albums-outline',
    title: 'Automatisch organisiert',
    description:
      'Seiten werden in der richtigen Reihenfolge zu einem Buch zusammengefügt und lokal gespeichert.',
  },
  {
    icon: 'book-outline',
    title: 'Komfortabel lesen',
    description:
      'Lies deine Bücher in einer ruhigen Leseansicht – im Bild- oder Textmodus, hell oder dunkel.',
  },
];
