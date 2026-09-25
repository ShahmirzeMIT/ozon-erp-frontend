import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DemoPreferencesStore } from './services/DemoPreferencesStore';

void i18n.use(initReactI18next).init({
  lng: DemoPreferencesStore.getLanguage(),
  fallbackLng: 'az',
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
        appearance: 'Внешний вид',
        language: 'Язык',
        russian: 'Русский',
        azerbaijani: 'Азербайджанский',
        darkTheme: 'Тёмная тема',
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
