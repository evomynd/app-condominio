# 📖 Guia de Uso - PWA Condomínio

## 🎯 Fluxo Completo de Trabalho

### 1️⃣ LOGIN
- Acesse o sistema com email e senha cadastrados no Firebase
- O sistema lembra o login (fica autenticado)

---

## 📦 MÓDULO: ENTRADA (Registro de Encomendas)

### Passo a Passo:

1. **Digite o Código de Rastreio**
   - Ex: BR123456789ABC
   - Ou qualquer identificação da encomenda

2. **Busque o Apartamento**
   - Digite o número (Ex: 101, 502)
   - Sistema mostra sugestões do cadastro
   - Selecione o apartamento correto

3. **Tire a Foto**
   - Clique em "Tirar Foto da Encomenda"
   - Câmera abre automaticamente
   - Enquadre a encomenda
   - Clique no botão branco central para capturar
   - Se não gostar, clique em "Refazer"

4. **Selecione o Tipo**
   - **Normal (Setor):** Encomendas comuns (pequenas/médias)
   - **Perecível/Grande (Portaria):** Itens urgentes ou grandes

5. **Confirme o Registro**
   - Clique em "Confirmar Registro"
   - Sistema salva a encomenda

### Loop de Decisão:

Após salvar, o sistema pergunta:

- **[Mesmo Apto]** → Mantém o apartamento, volta pro código de rastreio
  - *Use quando chegam várias encomendas do mesmo morador*
  
- **[Outro Apto]** → Limpa tudo, começa novo registro
  - *Use quando terminou com aquele morador*
  
- **[Finalizar]** → Volta para a tela inicial
  - *Use quando terminou de registrar encomendas*

---

## 🔔 MÓDULO: NOTIFICAÇÃO (Avisar Moradores)

### Objetivo:
Enviar foto da encomenda para o WhatsApp do morador.

### Passo a Passo:

1. **Veja a Lista**
   - Mostra todas as encomendas "A Notificar" (amarelo)
   - Ordenadas da mais recente para a mais antiga

2. **Clique em "Enviar WhatsApp"**
   - Sistema busca a foto no armazenamento local
   - Busca o telefone do morador no cadastro
   - Abre o WhatsApp com a foto já anexada

3. **Envie no WhatsApp**
   - Mensagem padrão já vem pronta:
     ```
     🏢 Encomenda Chegou!
     📦 Apto: 101
     📍 Local: Setor de Encomendas
     🏷️ Código: BR123...
     ```
   - Foto já está anexada
   - Clique em "Enviar" no WhatsApp

4. **Confirme o Envio**
   - Sistema pergunta: "A notificação foi enviada com sucesso?"
   - Clique em **SIM** → Muda status para "Pendente de Retirada"
   - Clique em **NÃO** → Mantém na lista

### ⚠️ Importante:
- Só funciona em **HTTPS** ou **localhost**
- Navegadores suportados: Chrome Android, Safari iOS
- Se não abrir o WhatsApp automaticamente, use o botão ✓ para marcar manualmente

---

## ✅ MÓDULO: RETIRADA (Baixa de Encomendas)

### Objetivo:
Registrar a retirada de encomendas pelos moradores.

### Passo a Passo:

1. **Buscar por Apartamento**
   - Digite o número do apto (Ex: 502)
   - Clique em "Buscar Encomendas"

2. **Sistema Mostra TODAS as Encomendas Pendentes**
   - Lista com fotos, datas e códigos
   - Encomendas perecíveis aparecem com ⚠️ Urgente

3. **Selecione as Encomendas**
   - Clique nas encomendas que serão retiradas
   - Checkbox marca/desmarca
   - Use "Todas" para selecionar tudo
   - Use "Limpar" para desmarcar tudo

4. **Digite Quem Está Retirando**
   - Ex: "Morador", "Filho", "Empregada", "Síndica"
   - Campo obrigatório

5. **Clique em "Prosseguir para Assinatura"**

6. **Coleta de Assinatura**
   - Entregue o dispositivo para a pessoa assinar
   - Assinatura com o dedo/caneta na tela
   - Botão "Limpar" se errar
   - Botão "Voltar" se precisar mudar algo

7. **Confirmar Retirada**
   - Clique em "Confirmar Retirada"
   - Sistema registra:
     - Status: Retirado ✅
     - Data/Hora da retirada
     - Nome de quem retirou
     - Assinatura digital

---

## ⚙️ MÓDULO: ADMIN (Cadastro de Moradores)

### Objetivo:
Gerenciar o cadastro de unidades e moradores.

### Cadastrar Nova Unidade:

1. Clique em "+ Nova Unidade"
2. Preencha:
   - **Número da Unidade:** 101, 502, etc (obrigatório)
   - **Bloco:** A, B, C (opcional)
   - **Telefone:** 5511999999999 (formato: DDI+DDD+Número)
   - **Moradores:** Nome(s) dos moradores
     - Clique em "+ Adicionar" para mais moradores
3. Clique em "Salvar"

### Editar Unidade:

1. Clique no ícone ✏️ (lápis) ao lado da unidade
2. Edite as informações
3. Clique em "Salvar"

### Excluir Unidade:

1. Clique no ícone 🗑️ (lixeira)
2. Confirme a exclusão

### ⚠️ Importante:
- Telefone deve estar no formato: DDI + DDD + Número (sem espaços/traços)
- Ex: Brasil (55) + São Paulo (11) + Número (999999999) = `5511999999999`

---

## 🌐 MODO OFFLINE

### Como Funciona:

- **Alerta Amarelo:** Aparece quando perde a internet
- **Funcionalidade Limitada:**
  - ✅ Pode registrar encomendas (salva localmente)
  - ✅ Pode tirar fotos (salva no dispositivo)
  - ❌ Não pode notificar (precisa de internet)
  - ❌ Não pode buscar cadastros novos
  - ❌ Não pode dar baixa

### Sincronização Automática:

- Quando a internet voltar:
  - Sistema sincroniza automaticamente
  - Encomendas registradas offline vão para o Firestore
  - Lista atualiza

---

## 💡 DICAS DE USO

### Para Porteiros:

1. **Horário de Pico:**
   - Use o fluxo "Mesmo Apto" para ganhar tempo
   - Agrupe encomendas do mesmo morador

2. **Fotos:**
   - Tire foto de frente para o código de barras
   - Boa iluminação ajuda na identificação

3. **Tipos:**
   - Perecível/Grande → Portaria (mais visível)
   - Normal → Setor (área organizada)

### Para Expedição:

1. **Notificações:**
   - Priorize encomendas antigas primeiro
   - Perecíveis tem prioridade (⚠️ vermelho)

2. **WhatsApp:**
   - Se não abrir automático, copie o telefone e envie manual

### Para Administradores:

1. **Cadastro:**
   - Cadastre TODOS os moradores antes de começar
   - Telefone correto é essencial para notificações
   - Atualize quando moradores mudarem

2. **Backups:**
   - Firebase faz backup automático
   - Exporte dados periodicamente (Firebase Console)

---

## ❓ RESOLUÇÃO DE PROBLEMAS

### Câmera não funciona
- Verifique permissões do navegador
- Use HTTPS (ou localhost para testes)
- Recarregue a página

### WhatsApp não abre
- Verifique se está em HTTPS
- Teste em Chrome/Safari
- Use o botão ✓ para marcar manual

### Encomenda não aparece na lista
- Verifique o status (pode já ter sido notificada)
- Recarregue a página
- Verifique a conexão com internet

### Foto não carrega
- Pode ter sido deletada do armazenamento local
- Navegador em modo anônimo não salva fotos
- Limpe cache se estiver cheio

---

## 🔐 SEGURANÇA

- **Login obrigatório** para todas as funções
- **Fotos no dispositivo** (não vão para a nuvem)
- **Dados protegidos** pelo Firebase Security Rules
- **Assinaturas digitais** com timestamp

---

## 📱 INSTALAÇÃO NO CELULAR/TABLET (PWA)

### Android (Chrome):
1. Abra o site no Chrome
2. Menu (⋮) → "Adicionar à tela inicial"
3. Ícone do app aparece na home

### iOS (Safari):
1. Abra o site no Safari
2. Toque no botão "Compartilhar" (📤)
3. "Adicionar à Tela de Início"
4. Ícone do app aparece na home

### Vantagens do PWA:
- Abre como app nativo
- Funciona offline
- Notificações push (futuro)
- Mais rápido

---

## 📞 SUPORTE

Para dúvidas técnicas, verifique:
- README.md (instruções de instalação)
- FIREBASE_SETUP.md (configuração do Firebase)
- Logs do console do navegador (F12)

---

✅ **Sistema Pronto para Uso!**
