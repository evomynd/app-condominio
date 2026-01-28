@echo off
echo 🚀 Instalando PWA Condomínio...

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js não encontrado. Por favor, instale Node.js 18+ primeiro.
    echo    Download: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js encontrado
node --version

echo 📦 Instalando dependências...
call npm install

if not exist .env (
    echo ⚙️ Criando arquivo .env...
    copy .env.example .env
    echo ⚠️  IMPORTANTE: Configure suas credenciais do Firebase no arquivo .env
    echo    Veja instruções em: FIREBASE_SETUP.md
)

echo.
echo ✅ Instalação concluída!
echo.
echo 📋 Próximos passos:
echo    1. Configure o Firebase (veja FIREBASE_SETUP.md^)
echo    2. Edite o arquivo .env com suas credenciais
echo    3. Execute: npm run dev
echo.
echo 🌐 O app estará disponível em: http://localhost:3000
pause
