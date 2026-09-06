import React, { createContext, useContext, useState } from 'react';
import { translations } from '../locales/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('hule_lang') || 'am';
  });

  const toggleLanguage = () => {
    setLanguage((prev) => {
      const newLang = prev === 'am' ? 'en' : 'am';
      localStorage.setItem('hule_lang', newLang);
      return newLang;
    });
  };

  const currentTranslations = translations[language] || translations['en'];

  // Create a function that handles t('key')
  const t = (key) => currentTranslations[key] || key;

  // Attach keys directly so t.key also works
  Object.assign(t, currentTranslations);

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
