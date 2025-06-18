import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_STORAGE_KEY = 'selectedLanguage';

export const saveLanguage = async (language: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.error('Failed to save language preference:', error);
  }
};

export const loadLanguage = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to load language preference:', error);
    return null;
  }
};

export const removeLanguage = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(LANGUAGE_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to remove language preference:', error);
  }
}; 