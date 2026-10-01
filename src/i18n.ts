import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

void i18n.use(initReactI18next).init({
  lng: 'az',
  fallbackLng: 'az',
  interpolation: { escapeValue: false },
  resources: {
    ru: {
      translation: {
        appName: 'Ozon ERP',
        overview: 'İcmal',
        products: 'Məhsullar',
        orders: 'Sifarişlər',
        inventory: 'Anbar və qalıqlar',
        returns: 'Qaytarmalar',
        finance: 'Maliyyə',
        analytics: 'Analitika',
        ai: 'AI analitik',
        alerts: 'Bildirişlər və e-poçt',
        sync: 'Sinxronizasiya',
        settings: 'Ayarlar',
        appearance: 'Görünüş',
        language: 'Dil',
        russian: 'Rus dili',
        azerbaijani: 'Azərbaycan dili',
        darkTheme: 'Tünd mövzu',
      },
    },
    az: {
      translation: {
        appName: 'Ozon ERP',
        overview: 'İcmal',
        products: 'Məhsullar',
        orders: 'Sifarişlər',
        inventory: 'Anbar və qalıqlar',
        returns: 'Qaytarmalar',
        finance: 'Maliyyə',
        analytics: 'Analitika',
        ai: 'AI-analitik',
        alerts: 'Bildirişlər və email',
        sync: 'Sinxronizasiya',
        settings: 'Ayarlar',
        appearance: 'Görünüş',
        language: 'Dil',
        russian: 'Rus dili',
        azerbaijani: 'Azərbaycan dili',
        darkTheme: 'Tünd tema',
      },
    },
  },
});

export default i18n;
