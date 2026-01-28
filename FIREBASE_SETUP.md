# Configuração do Firebase

## 1. Criar Projeto no Firebase

1. Acesse: https://console.firebase.google.com/
2. Clique em "Adicionar projeto"
3. Nome do projeto: `pwa-condominio` (ou outro de sua escolha)
4. Desabilite o Google Analytics (opcional)
5. Clique em "Criar projeto"

## 2. Configurar Authentication

1. No menu lateral, clique em **Authentication**
2. Clique em "Começar"
3. Ative o provedor **Email/Senha**:
   - Clique em "Email/Password"
   - Ative a primeira opção (Email/Password)
   - Clique em "Salvar"

### Criar Primeiro Usuário

1. Vá em **Authentication > Users**
2. Clique em "Adicionar usuário"
3. Email: `admin@condominio.com`
4. Senha: `Admin123!` (ou outra de sua escolha)
5. Clique em "Adicionar usuário"

## 3. Configurar Firestore Database

1. No menu lateral, clique em **Firestore Database**
2. Clique em "Criar banco de dados"
3. Selecione o local: `southamerica-east1` (São Paulo)
4. Modo de segurança: **Modo de teste** (para desenvolvimento)
   - ⚠️ **IMPORTANTE:** Em produção, use regras de segurança adequadas
5. Clique em "Ativar"

### Collections Necessárias

O app criará automaticamente as collections quando você registrar dados:
- `units` - Cadastro de moradores
- `packages` - Registro de encomendas

Você pode criar manualmente se preferir:

1. Clique em "Iniciar coleção"
2. ID da coleção: `units`
3. Adicione um documento de teste:
   ```json
   {
     "id": "101",
     "block": "A",
     "residents": ["João Silva"],
     "phone": "5511999999999"
   }
   ```

## 4. Obter Credenciais do Projeto

1. Clique no ícone de **engrenagem** (⚙️) ao lado de "Visão geral do projeto"
2. Clique em "Configurações do projeto"
3. Role até "Seus apps" e clique no ícone **</>** (Web)
4. Apelido do app: `PWA Condominio`
5. ❌ **NÃO** marque "Configurar Firebase Hosting"
6. Clique em "Registrar app"
7. Copie o objeto `firebaseConfig`:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "pwa-condominio.firebaseapp.com",
  projectId: "pwa-condominio",
  storageBucket: "pwa-condominio.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## 5. Configurar .env no Projeto

1. Copie o arquivo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edite o arquivo `.env` e cole suas credenciais:

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=pwa-condominio.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=pwa-condominio
VITE_FIREBASE_STORAGE_BUCKET=pwa-condominio.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

## 6. Regras de Segurança do Firestore (Produção)

Quando for para produção, substitua as regras por:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Require authentication for all reads and writes
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Ou regras mais específicas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /units/{unitId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null; // Em produção, adicione role-based access
    }
    
    match /packages/{packageId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
                      request.resource.data.status in ['pending_notification', 'pending_pickup', 'retired'];
      allow delete: if false; // Não permitir deleção direta
    }
  }
}
```

## 7. Índices Compostos (Otimização)

O Firestore pode solicitar índices compostos. Quando aparecer um erro no console com um link, clique nele para criar automaticamente.

Índices recomendados:
- Collection: `packages`
  - Campos: `status` (Ascending), `created_at` (Descending)
  - Campos: `unit_id` (Ascending), `status` (Ascending)

## 8. Testar Configuração

1. Execute o projeto:
   ```bash
   npm run dev
   ```

2. Acesse: `http://localhost:3000`

3. Faça login com o usuário criado

4. Se der erro de conexão:
   - Verifique se o arquivo `.env` está correto
   - Verifique se as credenciais estão corretas
   - Verifique o console do navegador para erros

## 9. Backup e Exportação

Para fazer backup dos dados:

1. Firebase Console > Firestore Database
2. Clique nos 3 pontos (...) ao lado do nome da collection
3. Exportar dados

## 10. Monitoramento

Acesse o Firebase Console para monitorar:
- **Authentication:** Usuários ativos
- **Firestore:** Leituras/Escritas
- **Performance:** Tempos de resposta
- **Crashlytics:** Erros em produção

---

✅ Configuração concluída! Você está pronto para usar o PWA.
