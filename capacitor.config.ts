import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.confluence.app",
  appName: "Confluence",
  webDir: "dist/public",
  android: {
    backgroundColor: "#0a0a0f",
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: "#0a0a0f",
    },
  },
};

export default config;
