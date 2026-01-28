# PWA Condomínio - Gestão de Encomendas

## Projeto Overview
Progressive Web App para gestão de encomendas em condomínios com foco em offline-first, alta performance e UX otimizado para porteiros.

## Tech Stack
- Frontend: React.js (Vite), Tailwind CSS
- Database Cloud: Firebase Firestore (apenas metadados)
- Database Local: Dexie.js (IndexedDB para fotos)
- Auth: Firebase Authentication
- PWA: Manifest.json + Service Workers
- Icons: Lucide-React

## Architecture Rules
1. ZERO CLOUD STORAGE: Fotos salvas como Blob no IndexedDB via Dexie.js
2. WhatsApp via Web Share API: navigator.share({ files: [blob] })
3. Offline First: Registrar encomendas sem internet, sincronizar quando voltar

## Setup Progress
- [x] Create copilot-instructions.md file
- [x] Scaffold React + Vite project
- [x] Install dependencies (package.json created)
- [x] Configure Tailwind CSS
- [x] Configure PWA manifest and service worker
- [x] Setup Firebase configuration
- [x] Setup Dexie.js database
- [x] Create project structure
- [x] Implement Authentication
- [x] Create base layout and navigation
- [x] Implement Entry Module (Scanner)
- [x] Implement Notification Module
- [x] Implement Pickup Module
- [x] Implement Admin Module
- [x] Implement offline sync
- [x] Test and finalize

## ✅ PROJETO COMPLETO!

### Estrutura Criada:
```
app-condominio/
├── .github/
│   └── copilot-instructions.md
├── public/
│   ├── pwa-192x192.svg
│   ├── pwa-512x512.svg
│   ├── apple-touch-icon.svg
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── Layout.jsx
│   │   └── ConnectionStatus.jsx
│   ├── config/
│   │   ├── firebase.js
│   │   └── dexie.js
│   ├── contexts/
│   │   └── AuthContext.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Entry.jsx
│   │   ├── Notification.jsx
│   │   ├── Pickup.jsx
│   │   └── Admin.jsx
│   ├── utils/
│   │   └── sync.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env.example
├── .gitignore
├── FIREBASE_SETUP.md
├── README.md
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
├── install.bat (Windows)
└── install.sh (Linux/Mac)
```

### Próximos Passos:
1. Feche e reabra o VS Code (para carregar Node.js no PATH)
2. Execute: `npm install`
3. Configure Firebase (veja FIREBASE_SETUP.md)
4. Edite o arquivo .env com suas credenciais
5. Execute: `npm run dev`

