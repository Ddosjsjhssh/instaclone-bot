import React, { useEffect } from 'react';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface TelegramLoginButtonProps {
  botName: string;
  onAuth: (user: TelegramUser) => void;
}

declare global {
  interface Window {
    onTelegramAuth: (user: TelegramUser) => void;
  }
}

export const TelegramLoginButton: React.FC<TelegramLoginButtonProps> = ({ botName, onAuth }) => {
  useEffect(() => {
    // Create callback function
    window.onTelegramAuth = (user: TelegramUser) => {
      onAuth(user);
    };

    // Create script element
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.async = true;

    // Append to container
    const container = document.getElementById('telegram-login-button');
    if (container) {
      container.innerHTML = '';
      container.appendChild(script);
    }

    return () => {
      // Cleanup
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [botName, onAuth]);

  return <div id="telegram-login-button" />;
};
