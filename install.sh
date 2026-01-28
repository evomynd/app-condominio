#!/bin/bash

echo "🚀 Instalando PWA Condomínio..."

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "❌ Node.js não encontrado. Por favor, instale Node.js 18+ primeiro."
    echo "   Download: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node --version) encontrado"

# Install dependencies
echo "📦 Instalando dependências..."
npm install

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚙️ Criando arquivo .env..."
    cp .env.example .env
    echo "⚠️  IMPORTANTE: Configure suas credenciais do Firebase no arquivo .env"
    echo "   Veja instruções em: FIREBASE_SETUP.md"
fi

echo ""
echo "✅ Instalação concluída!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Configure o Firebase (veja FIREBASE_SETUP.md)"
echo "   2. Edite o arquivo .env com suas credenciais"
echo "   3. Execute: npm run dev"
echo ""
echo "🌐 O app estará disponível em: http://localhost:3000"
