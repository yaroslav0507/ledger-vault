import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';

import en from './locales/en.json';
import uk from './locales/uk.json';
import { loadLanguage } from './languagePersistence';

const resources = {
  en: { translation: en },
  uk: { translation: uk }
};

// Ukrainian pluralization rule for i18next
const ukrainianPluralRule = {
  name: 'ukrainian',
  numbers: [1, 2, 5],
  plurals: (n: number) => {
    if (n === 1) return 0; // one
    if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 1; // few
    return 2; // many
  }
};

const getDeviceLanguage = () => {
  const locales = RNLocalize.getLocales();
  if (locales && locales.length > 0) {
    const locale = locales[0];
    if (locale.languageCode === 'uk' || locale.languageCode === 'ua') {
      return 'uk';
    }
  }
  return 'en';
};

const initI18n = async () => {
  const savedLanguage = await loadLanguage();
  const language = savedLanguage || getDeviceLanguage();
  
  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: language,
      fallbackLng: 'en',
      
      interpolation: {
        escapeValue: false,
      },
      
      compatibilityJSON: 'v4',
      
      react: {
        useSuspense: false,
      },
    });

  // Add Ukrainian pluralization rule
  i18n.services.pluralResolver.addRule('uk', ukrainianPluralRule);
};

// Initialize i18n
initI18n();

export default i18n; 