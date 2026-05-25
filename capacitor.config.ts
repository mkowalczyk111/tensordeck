import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tensordeck.app',
  appName: 'TensorDeck',
  webDir: 'dist',
  server: {
    url: 'https://tensordeck.web.app',
    cleartext: true
  }
};

export default config;
