export type Lang = 'fr' | 'en';

const translations: Record<Lang, Record<string, string>> = {
  fr: {
    'nav.dashboard': 'Tableau de bord',
    'nav.fleet': 'Gestion de Flotte',
    'nav.map': 'Carte en temps réel',
    'nav.deliveries': 'Livraisons',
    'nav.analytics': 'Analytique',
    'nav.performance': 'Performance',
    'nav.sustainability': 'Impact Écologique',
    'nav.settings': 'Paramètres',
    'sidebar.profile': 'Profil',
    'sidebar.settings': 'Paramètres',
    'sidebar.theme.light': 'Mode clair',
    'sidebar.theme.dark': 'Mode sombre',
    'sidebar.logout': 'Déconnexion',
    'lang.fr': 'Français',
    'lang.en': 'English',
  },
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.fleet': 'Fleet Management',
    'nav.map': 'Live Map',
    'nav.deliveries': 'Deliveries',
    'nav.analytics': 'Analytics',
    'nav.performance': 'Performance',
    'nav.sustainability': 'Environmental Impact',
    'nav.settings': 'Settings',
    'sidebar.profile': 'Profile',
    'sidebar.settings': 'Settings',
    'sidebar.theme.light': 'Light mode',
    'sidebar.theme.dark': 'Dark mode',
    'sidebar.logout': 'Log out',
    'lang.fr': 'Français',
    'lang.en': 'English',
  },
};

export function getTranslations(lang: Lang): Record<string, string> {
  return translations[lang] ?? translations.fr;
}

export function t(lang: Lang, key: string): string {
  const dict = translations[lang] ?? translations.fr;
  return dict[key] ?? key;
}
