
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AppThemeProvider } from "./components/AppThemeProvider.tsx";
import { DynamicMetadata } from "./components/DynamicMetadata.tsx";
import "./index.css";

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      
    } catch (error) {
      console.log('❌  Falha ao registrar Service Worker', error);
    }
  });
}

createRoot(document.getElementById("root")!).render(
  <AppThemeProvider>
    <DynamicMetadata />
    <App />
  </AppThemeProvider>
);  