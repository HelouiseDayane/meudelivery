
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      
    } catch (error) {
      console.log('❌ Bruno Cakes PWA: Falha ao registrar Service Worker', error);
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);  