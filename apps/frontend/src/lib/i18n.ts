import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import commonId from '../../public/locales/id/common.json';

const resources = {
  id: {
    common: commonId,
  },
};

// Initialize i18next
i18n.use(initReactI18next).init({
  resources,
  lng: 'id', // Default language
  fallbackLng: 'id', // Fallback language
  defaultNS: 'common', // Default namespace
  ns: ['common'], // Available namespaces

  interpolation: {
    escapeValue: false, // React already does escaping
  },

  react: {
    useSuspense: false, // Disable suspense for client-side rendering
  },

  // Enable debugging in development
  debug: process.env.NODE_ENV === 'development',
});

export default i18n;
