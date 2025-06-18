import { useTranslation as useI18nTranslation } from 'react-i18next';
import i18n from './index';
import { saveLanguage } from './languagePersistence';

export const useTranslation = () => {
  const { t, i18n: i18nInstance } = useI18nTranslation();

  const changeLanguage = async (lang: string) => {
    await saveLanguage(lang);
    return i18nInstance.changeLanguage(lang);
  };

  const getCurrentLanguage = () => {
    return i18nInstance.language;
  };

  const getAvailableLanguages = () => {
    return ['en', 'uk'];
  };

  const getLanguageName = (lang: string) => {
    const names: { [key: string]: string } = {
      en: 'English',
      uk: 'Українська'
    };
    return names[lang] || lang;
  };

  return {
    t,
    changeLanguage,
    getCurrentLanguage,
    getAvailableLanguages,
    getLanguageName,
    i18n: i18nInstance
  };
};

export default i18n; 