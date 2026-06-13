import { TelegramWebApp } from '../types/game';

export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
}

export function initTelegramMiniApp(): TelegramWebApp | null {
  const tg = getTelegramWebApp();
  if (tg) {
    tg.ready();
    tg.expand();
    tg.enableClosingConfirmation?.();

    if (tg.themeParams) {
      document.documentElement.style.setProperty('--tg-bg', tg.themeParams.bg_color || '#1a1a2e');
      document.documentElement.style.setProperty('--tg-text', tg.themeParams.text_color || '#ffffff');
      document.documentElement.style.setProperty('--tg-hint', tg.themeParams.hint_color || '#888888');
      document.documentElement.style.setProperty('--tg-button', tg.themeParams.button_color || '#5078ff');
      document.documentElement.style.setProperty('--tg-button-text', tg.themeParams.button_text_color || '#ffffff');
    }
  }
  return tg;
}

export function hapticImpact(style: 'light' | 'medium' | 'heavy' = 'medium'): void {
  const tg = getTelegramWebApp();
  tg?.HapticFeedback?.impactOccurred?.(style);
}

export function hapticNotification(type: 'success' | 'error' | 'warning' = 'success'): void {
  const tg = getTelegramWebApp();
  tg?.HapticFeedback?.notificationOccurred?.(type);
}

export function showAlert(message: string): void {
  const tg = getTelegramWebApp();
  if (tg) {
    tg.showAlert(message);
  } else {
    alert(message);
  }
}
