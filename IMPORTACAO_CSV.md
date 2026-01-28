# Importação de Apartamentos em Massa

## Como Importar Apartamentos via CSV

### 1. Acessar Painel de Importação

1. Faça login no app com seu usuário admin
2. Vá para a aba **Admin**
3. Clique em **"Importar CSV"**

### 2. Baixar Modelo

1. Clique em **"Download Modelo (CSV)"**
2. Um arquivo chamado `apartamentos_modelo.csv` será baixado

### 3. Preencher Dados

Abra o arquivo em Excel, Google Sheets ou editor de texto e preencha os dados:

#### Formato do CSV

```
id,block,residents,phone
101,A,"Joao Silva",5511999999999
102,A,"Maria Silva; Pedro Silva",5511999999998
201,B,"Carlos Santos",5511999999997
202,B,"Ana Costa",5511999999996
```

#### Campos

| Campo | Obrigatório | Descrição | Exemplo |
|-------|------------|-----------|---------|
| **id** | ✅ Sim | Número do apartamento | 101, 502, Casa 5 |
| **block** | ❌ Não | Bloco/Prédio | A, B, C, 1, 2 |
| **residents** | ❌ Não | Nome(s) do(s) morador(es) separado(s) por ; | João Silva; Maria Silva |
| **phone** | ❌ Não | Telefone WhatsApp (formato internacional) | 5511999999999 |

### 4. Formatos Válidos

#### ID do Apartamento
- Numérico: `101`, `201`, `1001`
- Alfanumérico: `Casa 5`, `Ap 10-A`, `Apto_502`

#### Nomes dos Moradores
- Separe com ponto-e-vírgula `;`
- Espaços são trimados automaticamente
- Exemplo: `João Silva; Maria Silva; Pedro`

#### Telefone
- Sem formatação especial
- Inclua o DDI (55 para Brasil)
- Exemplo: `5511999999999` (sem hífen, parêntesis ou espaço)

#### Bloco
- Apenas uma letra ou número
- Exemplos: `A`, `B`, `01`, `02`

### 5. Salvar Como CSV

**Excel:**
1. Arquivo > Salvar Como
2. Formato: CSV UTF-8 (*.csv)
3. Clique em Salvar

**Google Sheets:**
1. Arquivo > Download > CSV
2. O arquivo será baixado automaticamente

**LibreOffice Calc:**
1. Arquivo > Salvar Como
2. Tipo de arquivo: CSV
3. Clique em Salvar

### 6. Enviar Arquivo

1. Clique em **"Importar CSV"** novamente
2. Selecione ou arraste o arquivo CSV
3. O sistema vai processar e informar:
   - ✅ Quantas unidades foram adicionadas
   - ⚠️ Quantas foram ignoradas (duplicadas)
   - ❌ Erros encontrados (se houver)

### 7. Verificar Dados

Após a importação, vá para a seção de **Unidades** no Admin para verificar se os dados foram importados corretamente.

## Exemplos de Arquivo CSV

### Exemplo Básico (Apenas IDs)
```
id,block,residents,phone
101,,
102,,
201,,
202,,
```

### Exemplo Completo
```
id,block,residents,phone
101,A,"João Silva",5511999999999
102,A,"Maria Silva; Pedro Costa",5511988888888
201,B,"Carlos Santos",5511977777777
202,B,"Ana Patricia",5511966666666
301,C,"Roberto Alves; Fernanda",5511955555555
```

### Exemplo com Nomes Complexos
```
id,block,residents,phone
101,A,"Dr. João da Silva",5511999999999
102,A,"Maria Silva de Souza; Pedro Henrique Costa",5511988888888
```

## ⚠️ Pontos Importantes

1. **ID é obrigatório** - Cada linha deve ter um ID válido
2. **Sem duplicação** - Se o ID já existe, será ignorado
3. **Encoding UTF-8** - Salve o arquivo em UTF-8 para caracteres acentuados
4. **Sem formatação especial** - Use valores simples, sem cores ou fusões no Excel
5. **Telefone sem formatação** - Apenas números, sem parêntesis ou hífen

## 🐛 Solução de Problemas

### Arquivo não é reconhecido
- Verifique se é um arquivo CSV válido
- Tente salvar novamente em UTF-8

### Linhas não foram importadas
- Verifique se há um ID válido na coluna `id`
- Verifique se não estão duplicadas no banco

### Caracteres acentuados aparecem errados
- Salve o arquivo em UTF-8 (não ANSI)
- Tente abrir com Google Sheets e fazer download novamente

### Telefone não foi importado
- Remova formatação (parêntesis, hífen, espaço)
- Use apenas números com DDI: `5511999999999`

## 📱 Importação via Google Sheets

1. Abra [Google Sheets](https://sheets.google.com)
2. Crie uma nova planilha
3. Preencha com os dados
4. Arquivo > Download > CSV (.csv)
5. Use o arquivo baixado para importar no app

## 📊 Importação via Excel Online

1. Abra [Excel Online](https://office.com)
2. Crie uma nova planilha
3. Preencha com os dados
4. Arquivo > Download > Download a copy (.xlsx)
5. Converter para CSV se necessário

---

✅ **Dicas:** Use o modelo baixado como referência para manter a formatação correta!
