# 🚀 Comandos Rápidos - PWA Condomínio

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Ou use o script automático (Windows)
install.bat

# Ou use o script automático (Linux/Mac)
./install.sh
```

## 🔧 Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Abrir automaticamente no navegador
npm run dev -- --open

# Especificar porta diferente
npm run dev -- --port 5000
```

## 🏗️ Build

```bash
# Build de produção
npm run build

# Preview do build localmente
npm run preview
```

## 🧹 Manutenção

```bash
# Limpar node_modules e reinstalar
rm -rf node_modules package-lock.json
npm install

# Windows
rmdir /s node_modules
del package-lock.json
npm install
```

## 🔥 Firebase

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login no Firebase
firebase login

# Inicializar Firebase Hosting
firebase init hosting

# Deploy para Firebase Hosting
firebase deploy

# Deploy apenas hosting
firebase deploy --only hosting
```

## 📊 Firestore (via Firebase CLI)

```bash
# Exportar dados do Firestore
firebase firestore:export backup/

# Importar dados para Firestore
firebase firestore:import backup/

# Deletar toda a collection (CUIDADO!)
firebase firestore:delete --all-collections
```

## 🐛 Debug

```bash
# Rodar com logs detalhados
npm run dev -- --debug

# Verificar versões
node --version
npm --version

# Listar dependências instaladas
npm list

# Verificar dependências desatualizadas
npm outdated

# Atualizar dependências
npm update
```

## 🧪 Testes (Opcional)

```bash
# Instalar Vitest (teste unitário)
npm install -D vitest

# Rodar testes
npm test
```

## 📱 PWA Testing

```bash
# Build e testar PWA localmente
npm run build
npm run preview

# Testar PWA em dispositivo móvel na mesma rede
npm run dev -- --host
# Acesse via IP: http://192.168.x.x:3000
```

## 🔐 Variáveis de Ambiente

```bash
# Copiar .env.example para .env
cp .env.example .env

# Windows
copy .env.example .env

# Verificar se .env existe
ls -la .env

# Windows
dir .env
```

## 📝 Git

```bash
# Inicializar repositório
git init

# Adicionar todos os arquivos
git add .

# Commit inicial
git commit -m "Initial commit: PWA Condomínio"

# Adicionar remote
git remote add origin https://github.com/seu-usuario/pwa-condominio.git

# Push
git push -u origin main
```

## 🌐 Deploy Alternativo (Vercel)

```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy
vercel

# Deploy de produção
vercel --prod
```

## 📊 Análise de Bundle

```bash
# Instalar ferramenta de análise
npm install -D rollup-plugin-visualizer

# Build com análise
npm run build -- --mode analyze
```

## 🔄 Atualizar Dependências

```bash
# Atualizar todas as dependências menores
npm update

# Atualizar dependências maiores (breaking changes)
npx npm-check-updates -u
npm install
```

## 🧰 Ferramentas Úteis

```bash
# Verificar tamanho do bundle
npx vite-bundle-visualizer

# Audit de segurança
npm audit

# Corrigir vulnerabilidades automaticamente
npm audit fix

# Limpar cache do npm
npm cache clean --force
```

## 📱 Service Worker (Debug)

**No Chrome DevTools:**
1. F12 → Application → Service Workers
2. "Unregister" para limpar
3. "Update on reload" para testar mudanças

## 🆘 Troubleshooting

```bash
# Limpar cache do Vite
rm -rf .vite

# Windows
rmdir /s .vite

# Reinstalar dependências do zero
rm -rf node_modules package-lock.json
npm install

# Verificar porta em uso (Windows)
netstat -ano | findstr :3000

# Verificar porta em uso (Linux/Mac)
lsof -i :3000

# Matar processo na porta 3000 (Linux/Mac)
kill -9 $(lsof -t -i:3000)
```

## 📖 Recursos

- **Vite Docs:** https://vitejs.dev/
- **React Docs:** https://react.dev/
- **Firebase Docs:** https://firebase.google.com/docs
- **Dexie.js Docs:** https://dexie.org/
- **Tailwind CSS:** https://tailwindcss.com/

---

## 🎯 Comandos Mais Usados no Dia a Dia

```bash
# 1. Desenvolvimento
npm run dev

# 2. Build para produção
npm run build

# 3. Testar build localmente
npm run preview

# 4. Deploy Firebase
firebase deploy
```

---

✅ **Copie e cole os comandos conforme necessário!**
