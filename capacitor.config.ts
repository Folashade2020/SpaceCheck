import type { CapacitorConfig } from '@capacitor/cli';

// Production WebView URL comes from the APP_URL secret at build time
// (your hosted https:// domain). Local webDir is only a fallback shell.
const serverUrl = process.env.CAPACITOR_SERVER_URL;

const config: CapacitorConfig = {
  appId: 'com.spacecheck.app',
  appName: 'SpaceCheck',
  webDir: 'capacitor-www',
  ...(serverUrl
    ? {
        server: {
          url: serverUrl,
          cleartext: false,
          allowNavigation: ['*.supabase.co'],
        },
      }
    : {}),
};

export default config;
