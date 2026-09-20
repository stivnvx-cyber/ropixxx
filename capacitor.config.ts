import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ropixxx.app',
  appName: 'Ropixxx',
  webDir: 'out',
  server: {
    url: 'http://192.168.0.42:3000',
    cleartext: true,
    androidScheme: 'http'
  }
};

export default config;
