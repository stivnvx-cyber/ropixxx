import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ropixxx.app',
  appName: 'Ropixxx',
  webDir: 'out',
  server: {
    url: 'https://ropixxx.netlify.app',
    cleartext: true,
    androidScheme: 'http'
  }
};

export default config;
