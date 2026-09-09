import type { ExpoConfig } from 'expo/config';
const bundleIdentifier = process.env.APP_BUNDLE_IDENTIFIER || 'app.tomate.mobile';
const projectId = process.env.EAS_PROJECT_ID;
const config: ExpoConfig = {
  name: 'Tomate',
  slug: 'tomate',
  version: '1.0.0',
  scheme: 'tomate',
  orientation: 'portrait',
  userInterfaceStyle: 'dark',
  icon: './assets/icon.png',
  ios: {
    bundleIdentifier,
    buildNumber: '1',
    supportsTablet: false,
    infoPlist: { ITSAppUsesNonExemptEncryption: false },
  },
  android: {
    package: bundleIdentifier,
    versionCode: 1,
    adaptiveIcon: { foregroundImage: './assets/adaptive-icon.png', backgroundColor: '#0A0908' },
    blockedPermissions: [
      'android.permission.RECORD_AUDIO',
      'android.permission.READ_MEDIA_IMAGES',
      'android.permission.READ_MEDIA_VIDEO',
    ],
  },
  web: {
    bundler: 'metro',
    favicon: './assets/icon.png',
    name: 'Tomate',
    themeColor: '#0A0908',
    backgroundColor: '#0A0908',
  },
  plugins: [
    [
      'expo-camera',
      {
        cameraPermission:
          'Tomate usa la cámara para fotografiar tu vaso y estimar su volumen. Podés cargar las medidas a mano.',
        microphonePermission: false,
        recordAudioAndroid: false,
        barcodeScannerEnabled: false,
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Tomate usa tu ubicación solo cuando pedís un Uber, para completar el punto de partida.',
        locationAlwaysPermission: false,
        locationAlwaysAndWhenInUsePermission: false,
        motionUsagePermission: false,
        isIosBackgroundLocationEnabled: false,
        isAndroidBackgroundLocationEnabled: false,
      },
    ],
    'expo-font',
    [
      'expo-splash-screen',
      { backgroundColor: '#0A0908', image: './assets/splash.png', imageWidth: 180 },
    ],
  ],
  extra: { ...(projectId ? { eas: { projectId } } : {}) },
};
export default config;
