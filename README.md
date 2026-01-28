# PWA Condominio - Gestao de Encomendas

Progressive Web App para gestao de encomendas em condominios com foco em offline-first, alta performance e UX otimizado para porteiros.

## Tecnologias

- **Frontend:** React.js (Vite), Tailwind CSS
- **Database Cloud:** Firebase Firestore (apenas metadados)
- **Database Local:** Dexie.js (IndexedDB para fotos)
- **Auth:** Firebase Authentication
- **PWA:** Manifest.json + Service Workers
- **Icons:** Lucide-React

## Pre-requisitos

- Node.js 18+ instalado
- Conta Firebase (Plano Gratuito)

## Instalacao

### Opcao 1: Script Automatico (Windows)

Execute o arquivo `install.bat`:
```cmd
install.bat
```

### Opcao 2: Script Automatico (Linux/Mac)

```bash
chmod +x install.sh
./install.sh
```

### Opcao 3: Manual

Feche e reabra o VS Code (ou terminal) para que o Node.js seja reconhecido, depois execute:

```bash
npm install
```

## Configuracao Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Crie um novo projeto
3. Ative **Authentication** (Email/Password)
4. Ative **Firestore Database** (modo teste ou producao)
5. Copie as credenciais do projeto

### Variaveis de Ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` e adicione suas credenciais do Firebase:

```env
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_projeto_id
VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
```

## Documentacao Completa

- **[FIREBASE_SETUP.md](FIREBASE_SETUP.md)** - Guia completo de configuracao do Firebase
- **[GUIA_DE_USO.md](GUIA_DE_USO.md)** - Manual do usuario (porteiros, expedicao, admin)
- **[COMANDOS.md](COMANDOS.md)** - Referencia rapida de comandos uteis

## Criar Primeiro Usuario

No Firebase Console, va em Authentication > Users > Add User e crie um usuario de teste.

## Executar o Projeto

```bash
npm run dev
```

Acesse: `http://localhost:3000`

## Funcionalidades

### Autenticacao
- Login com email/senha via Firebase Auth

### Modulo de Entrada (Scanner)
- Scan de codigo de rastreio (ou entrada manual)
- Busca de apartamento com autocomplete
- Foto obrigatoria via camera do dispositivo
- Selecao de tipo: Normal (Setor) ou Perecivel/Grande (Portaria)
- **Loop de decisao:** Mesmo Apto | Outro Apto | Finalizar

### Modulo de Notificacao
- Lista encomendas com status "A Notificar"
- Botao "ZAP": Usa Web Share API para enviar foto + mensagem direto no WhatsApp
- Confirmacao manual de envio
- Atualiza status para "Pendente de Retirada"

### Modulo de Retirada
- Busca agrupada por apartamento
- Lista TODAS as encomendas pendentes do apto
- Selecao multipla (checkbox)
- Input: Nome de quem retirou
- Canvas de assinatura (react-signature-canvas)
- Atualizacao em batch no Firestore

### Modulo Admin
- CRUD de moradores (Unidades)
- Campos: ID, Bloco, Nomes dos Moradores, Telefone
- Ordenacao por numero de unidade

## Estrutura de Dados

### Collection: `units`
```json
{
  "id": "101",
  "block": "A",
  "residents": ["Joao Silva", "Maria Silva"],
  "phone": "5511999999999"
}
```

### Collection: `packages`
```json
{
  "tracking_code": "BR123456789ABC",
  "unit_id": "101",
  "unit_block": "A",
  "status": "pending_notification",
  "type": "normal",
  "location": "setor",
  "local_photo_id": "photo_1234567890_abc",
  "created_at": "Timestamp",
  "notified_at": "Timestamp",
  "retired_at": "Timestamp",
  "retired_by": "Nome",
  "signature_base64": "data:image/png;base64,..."
}
```

## Regras Criticas de Arquitetura

### 1. ZERO CLOUD STORAGE
- Nao usa Firebase Storage
- Fotos salvas como Blob no IndexedDB (via Dexie.js)
- Firestore guarda apenas `local_photo_id` (referencia)

### 2. WHATSAPP VIA WEB SHARE API
- Nao usa links `wa.me`
- Usa `navigator.share({ files: [blob] })` para abrir WhatsApp nativo com foto anexada

### 3. OFFLINE FIRST
- Service Workers para cache offline
- Pode registrar encomendas sem internet
- Sincronizacao automatica quando a rede voltar

## Design e UX

- **Mobile-First:** Interface otimizada para uso em tablets/smartphones
- **Navegacao Inferior:** 4 abas fixas (Entrada | Notificar | Retirada | Admin)
- **Botoes Grandes:** Minimo 44px de altura (acessibilidade touch)
- **Cores de Status:**
  - Amarelo/Laranja: A Notificar
  - Azul: Pendente de Retirada
  - Verde: Retirado
  - Vermelho: Urgente/Perecivel

## Deploy

### Build de Producao
```bash
npm run build
```

### Preview Local
```bash
npm run preview
```

### Hospedagem Recomendada
- **Firebase Hosting** (integracao nativa)
- **Vercel** (deploy automatico via Git)
- **Netlify**

### Firebase Hosting (Exemplo)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## Firestore Security Rules (Exemplo)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /units/{unitId} {
      allow read, write: if request.auth != null;
    }
    
    match /packages/{packageId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Seguranca

- Autenticacao obrigatoria para todas as rotas
- Firestore Rules protegem acesso nao autorizado
- Fotos no IndexedDB sao isoladas por origem (mesma seguranca do LocalStorage)

## Troubleshooting

### Camera nao funciona
- Certifique-se de estar usando HTTPS (ou localhost)
- Conceda permissao de camera no navegador

### Web Share API nao funciona
- Requer HTTPS (nao funciona em HTTP)
- Funciona apenas em navegadores compativeis (Chrome Android, Safari iOS)
- Fallback: Mostra telefone para envio manual

### IndexedDB nao persiste
- Verifique se o usuario nao esta em modo anonimo/privado
- Alguns navegadores limitam storage em PWAs

## Licenca

MIT

## Autor

Desenvolvido como solucao completa para gestao de encomendas em condominios.
