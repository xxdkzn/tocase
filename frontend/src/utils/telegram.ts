import { useEffect, useState } from 'react';

interface TelegramWebAppHook {
  webApp: TelegramWebApp | null;
  initData: string;
  user: {
    id: number;
    firstName: string;
    lastName?: string;
    username?: string;
    languageCode?: string;
    photoUrl?: string;
  } | null;
  isReady: boolean;
}

export const useTelegramWebApp = (): TelegramWebAppHook => {
  const [isReady, setIsReady] = useState(false);
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    if (tg) {
      // Initialize Telegram WebApp
      tg.ready();
      tg.expand();

      // Apply theme colors to CSS variables
      const root = document.documentElement;
      root.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#000000');
      root.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#ffffff');
      root.style.setProperty('--tg-theme-hint-color', tg.themeParams.hint_color || '#999999');
      root.style.setProperty('--tg-theme-link-color', tg.themeParams.link_color || '#0ea5e9');
      root.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#0ea5e9');
      root.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color || '#ffffff');

      setWebApp(tg);
      setIsReady(true);
    } else {
      // Development mode - Telegram WebApp not available
      console.warn('Telegram WebApp not available. Running in development mode.');
      setIsReady(true);
    }
  }, []);

  const initData = webApp?.initData || '';
  const user = webApp?.initDataUnsafe.user
    ? {
        id: webApp.initDataUnsafe.user.id,
        firstName: webApp.initDataUnsafe.user.first_name,
        lastName: webApp.initDataUnsafe.user.last_name,
        username: webApp.initDataUnsafe.user.username,
        languageCode: webApp.initDataUnsafe.user.language_code,
        photoUrl: webApp.initDataUnsafe.user.photo_url,
      }
    : null;

  return {
    webApp,
    initData,
    user,
    isReady,
  };
};
