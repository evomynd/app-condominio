/**
 * Gerar arquivo CSV modelo para importação de apartamentos
 */

export const generateCSVTemplate = () => {
  const headers = ['id', 'block', 'residents', 'phone'];
  
  const examples = [
    ['101', 'A', 'João Silva', '5511999999999'],
    ['102', 'A', 'Maria Silva; Pedro Costa', '5511988888888'],
    ['201', 'B', 'Carlos Santos', '5511977777777'],
    ['202', 'B', 'Ana Patricia', '5511966666666'],
    ['301', 'C', 'Roberto Alves; Fernanda', '5511955555555']
  ];

  const csvContent = [
    headers.join(','),
    ...examples.map(row => 
      row.map(cell => 
        cell.includes(',') || cell.includes(';') ? `"${cell}"` : cell
      ).join(',')
    )
  ].join('\n');

  return csvContent;
};

/**
 * Download CSV file
 */
export const downloadFile = (content, filename) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

/**
 * Validar linha do CSV
 */
export const validateCSVRow = (row, rowNumber) => {
  const errors = [];

  if (!row.id || !row.id.trim()) {
    errors.push(`Linha ${rowNumber}: Campo 'id' é obrigatório`);
  }

  if (row.phone && !isValidPhone(row.phone)) {
    errors.push(`Linha ${rowNumber}: Telefone inválido (use apenas números com DDI)`);
  }

  return errors;
};

/**
 * Validar telefone
 */
const isValidPhone = (phone) => {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 15;
};

/**
 * Processar dados do CSV
 */
export const processCSVData = (data) => {
  return data.map(row => ({
    id: row.id ? row.id.trim() : '',
    block: row.block ? row.block.trim() : '',
    residents: row.residents 
      ? row.residents
          .split(';')
          .map(r => r.trim())
          .filter(r => r !== '')
      : [],
    phone: row.phone ? row.phone.trim() : ''
  })).filter(row => row.id !== '');
};
