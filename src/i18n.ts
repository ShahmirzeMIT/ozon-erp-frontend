import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// The application currently ships with Russian as its only enabled UI locale.
// Keeping the locale in i18next makes adding Azerbaijani/English later a resource-only change.
void i18n.use(initReactI18next).init({
  lng: 'ru',
  fallbackLng: 'ru',
  interpolation: { escapeValue: false },
  resources: {
    ru: {
      translation: {
        appName: 'Ozon ERP',
        overview: 'Обзор',
        products: 'Товары',
        orders: 'Заказы',
        inventory: 'Склад и остатки',
        returns: 'Возвраты',
        finance: 'Финансы',
        analytics: 'Аналитика',
        ai: 'AI-аналитик',
        alerts: 'Оповещения и email',
        sync: 'Синхронизация',
        settings: 'Настройки',
      },
    },
  },
});

export default i18n;
