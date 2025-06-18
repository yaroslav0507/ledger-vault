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
};

// Initialize i18n
initI18n();

export default i18n; 