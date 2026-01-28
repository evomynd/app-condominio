import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, orderBy, query, writeBatch, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit2, Trash2, Save, X, Users, UserPlus, Upload } from 'lucide-react';
import Papa from 'papaparse';

const Admin = () => {
  const { signUp } = useAuth();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    block: '',
    residents: [''],
    phone: ''
  });
  const [userFormData, setUserFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'porteiro' // porteiro, expedicao, admin
  });
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState(false);
  const [userLoading, setUserLoading] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  useEffect(() => {
    loadUnits();
  }, []);

  const loadUnits = async () => {
    setLoading(true);
    try {
      const unitsRef = collection(db, 'units');
      const q = query(unitsRef, orderBy('id', 'asc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        docId: doc.id,
        ...doc.data()
      }));
      setUnits(data);
    } catch (error) {
      console.error('Error loading units:', error);
      alert('Erro ao carregar unidades');
    } finally {
      setLoading(false);
    }
  };

  const openForm = (unit = null) => {
    if (unit) {
      setEditingUnit(unit);
      setFormData({
        id: unit.id,
        block: unit.block || '',
        residents: unit.residents && unit.residents.length > 0 ? unit.residents : [''],
        phone: unit.phone || ''
      });
    } else {
      setEditingUnit(null);
      setFormData({
        id: '',
        block: '',
        residents: [''],
        phone: ''
      });
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingUnit(null);
    setFormData({
      id: '',
      block: '',
      residents: [''],
      phone: ''
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleResidentChange = (index, value) => {
    const newResidents = [...formData.residents];
    newResidents[index] = value;
    setFormData(prev => ({ ...prev, residents: newResidents }));
  };

  const addResidentField = () => {
    setFormData(prev => ({
      ...prev,
      residents: [...prev.residents, '']
    }));
  };

  const removeResidentField = (index) => {
    if (formData.residents.length === 1) return;
    const newResidents = formData.residents.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, residents: newResidents }));
  };

  const saveUnit = async () => {
    if (!formData.id.trim()) {
      alert('Número da unidade é obrigatório');
      return;
    }

    const cleanResidents = formData.residents.filter(r => r.trim() !== '');
    
    const unitData = {
      id: formData.id.trim(),
      block: formData.block.trim(),
      residents: cleanResidents,
      phone: formData.phone.trim()
    };

    try {
      if (editingUnit) {
        // Update
        await updateDoc(doc(db, 'units', editingUnit.docId), unitData);
        alert('Unidade atualizada com sucesso!');
      } else {
        // Create
        await addDoc(collection(db, 'units'), unitData);
        alert('Unidade cadastrada com sucesso!');
      }
      
      closeForm();
      loadUnits();
    } catch (error) {
      console.error('Error saving unit:', error);
      alert('Erro ao salvar unidade');
    }
  };

  const deleteUnit = async (unit) => {
    if (!window.confirm(`Deseja realmente excluir a unidade ${unit.id}?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'units', unit.docId));
      alert('Unidade excluída com sucesso!');
      loadUnits();
    } catch (error) {
      console.error('Error deleting unit:', error);
      alert('Erro ao excluir unidade');
    }
  };

  // User Management Functions
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserError('');
    setUserSuccess(false);

    // Validations
    if (!userFormData.email || !userFormData.password || !userFormData.name) {
      setUserError('Preencha todos os campos obrigatórios');
      return;
    }

    if (userFormData.password !== userFormData.confirmPassword) {
      setUserError('As senhas não conferem');
      return;
    }

    if (userFormData.password.length < 6) {
      setUserError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setUserLoading(true);

    try {
      const result = await signUp(userFormData.email, userFormData.password, userFormData.name);
      
      if (result.success) {
        setUserSuccess(true);
        setUserFormData({
          email: '',
          password: '',
          confirmPassword: '',
          name: '',
          role: 'porteiro'
        });
        
        // Reset form after 2 seconds
        setTimeout(() => {
          setShowUserForm(false);
          setUserSuccess(false);
        }, 2000);
      } else {
        setUserError(result.error || 'Erro ao criar usuário');
      }
    } catch (error) {
      setUserError('Erro ao criar usuário: ' + error.message);
    } finally {
      setUserLoading(false);
    }
  };

  const closeUserForm = () => {
    setShowUserForm(false);
    setUserFormData({
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      role: 'porteiro'
    });
    setUserError('');
    setUserSuccess(false);
  };

  // CSV Import Functions
  const downloadTemplate = () => {
    const template = `id,block,residents,phone
101,A,"Joao Silva",5511999999999
102,A,"Maria Silva; Pedro Silva",5511999999998
201,B,"Carlos Santos",5511999999997
202,B,"Ana Costa",5511999999996`;

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'apartamentos_modelo.csv';
    link.click();
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImportError('');
    setImportSuccess('');
    setImportLoading(true);

    try {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const units = results.data;
            
            // Validação básica
            if (units.length === 0) {
              setImportError('Arquivo vazio');
              setImportLoading(false);
              return;
            }

            // Validar campos obrigatórios
            for (let i = 0; i < units.length; i++) {
              const unit = units[i];
              if (!unit.id || !unit.id.trim()) {
                setImportError(`Linha ${i + 2}: Campo 'id' é obrigatório`);
                setImportLoading(false);
                return;
              }
            }

            // Fazer batch insert
            const batch = writeBatch(db);
            let addedCount = 0;
            let skippedCount = 0;

            for (const unit of units) {
              if (!unit.id || !unit.id.trim()) continue;

              const unitData = {
                id: unit.id.trim(),
                block: unit.block ? unit.block.trim() : '',
                residents: unit.residents 
                  ? unit.residents.split(';').map(r => r.trim()).filter(r => r) 
                  : [],
                phone: unit.phone ? unit.phone.trim() : ''
              };

              // Verificar se já existe
              const unitsRef = collection(db, 'units');
              const q = query(unitsRef, where('id', '==', unitData.id));
              const snapshot = await getDocs(q);

              if (snapshot.empty) {
                const docRef = doc(collection(db, 'units'));
                batch.set(docRef, unitData);
                addedCount++;
              } else {
                skippedCount++;
              }
            }

            await batch.commit();

            setImportSuccess(
              `✅ Importação concluída! ${addedCount} unidade(s) adicionada(s)${skippedCount > 0 ? `, ${skippedCount} duplicada(s) ignorada(s)` : ''}`
            );

            loadUnits();
            
            setTimeout(() => {
              setShowImportForm(false);
              setImportSuccess('');
              event.target.value = '';
            }, 2000);
          } catch (error) {
            setImportError('Erro ao processar arquivo: ' + error.message);
          } finally {
            setImportLoading(false);
          }
        },
        error: (error) => {
          setImportError('Erro ao ler arquivo: ' + error.message);
          setImportLoading(false);
        }
      });
    } catch (error) {
      setImportError('Erro: ' + error.message);
      setImportLoading(false);
    }
  };

  if (showImportForm) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            Importar Apartamentos
          </h2>
          <button onClick={() => setShowImportForm(false)} className="text-red-600">
            <X size={24} />
          </button>
        </div>

        <div className="card space-y-4">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <p className="text-blue-800 text-sm">
              <strong>ℹ️ Instruções:</strong>
            </p>
            <ul className="text-blue-800 text-sm mt-2 space-y-1 ml-4">
              <li>✓ Primeiro, baixe o arquivo modelo clicando em "Download Modelo"</li>
              <li>✓ Preencha os dados dos apartamentos no Excel ou CSV</li>
              <li>✓ Salve o arquivo em formato CSV</li>
              <li>✓ Envie o arquivo aqui para importar em massa</li>
            </ul>
          </div>

          <div>
            <button
              onClick={downloadTemplate}
              className="w-full btn-secondary"
            >
              📥 Download Modelo (CSV)
            </button>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              disabled={importLoading}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer block">
              <Upload size={48} className="text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 font-medium">Clique para selecionar arquivo</p>
              <p className="text-gray-400 text-sm">ou arraste o arquivo aqui</p>
              <p className="text-gray-400 text-xs mt-2">CSV, XLSX ou XLS</p>
            </label>
          </div>

          {importError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {importError}
            </div>
          )}

          {importSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {importSuccess}
            </div>
          )}

          <button
            onClick={() => setShowImportForm(false)}
            className="w-full btn-secondary"
          >
            Cancelar
          </button>
        </div>

        <div className="card">
          <h3 className="font-bold text-gray-800 mb-3">Formato do Arquivo</h3>
          <p className="text-sm text-gray-600 mb-2">O arquivo CSV deve ter as seguintes colunas:</p>
          <ul className="text-sm text-gray-600 space-y-1 ml-4">
            <li><strong>id</strong> - Número do apartamento (obrigatório) - Ex: 101, 502</li>
            <li><strong>block</strong> - Bloco (opcional) - Ex: A, B, C</li>
            <li><strong>residents</strong> - Nomes dos moradores separados por ; (opcional) - Ex: João; Maria</li>
            <li><strong>phone</strong> - Telefone WhatsApp (opcional) - Ex: 5511999999999</li>
          </ul>
        </div>
      </div>
    );
  }

  if (showUserForm) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            Criar Novo Usuário
          </h2>
          <button onClick={closeUserForm} className="text-red-600">
            <X size={24} />
          </button>
        </div>

        <div className="card space-y-4">
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                value={userFormData.name}
                onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                className="input-field"
                placeholder="Seu Nome"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={userFormData.email}
                onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                className="input-field"
                placeholder="usuario@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Função *
              </label>
              <select
                value={userFormData.role}
                onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                className="input-field"
              >
                <option value="porteiro">Porteiro</option>
                <option value="expedicao">Expedição</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha *
              </label>
              <input
                type="password"
                value={userFormData.password}
                onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                className="input-field"
                placeholder="••••••••"
              />
              <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Senha *
              </label>
              <input
                type="password"
                value={userFormData.confirmPassword}
                onChange={(e) => setUserFormData({ ...userFormData, confirmPassword: e.target.value })}
                className="input-field"
                placeholder="••••••••"
              />
            </div>

            {userError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {userError}
              </div>
            )}

            {userSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                ✅ Usuário criado com sucesso!
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={closeUserForm}
                className="flex-1 btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={userLoading}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                {userLoading ? 'Criando...' : 'Criar Usuário'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            {editingUnit ? 'Editar Unidade' : 'Nova Unidade'}
          </h2>
          <button onClick={closeForm} className="text-red-600">
            <X size={24} />
          </button>
        </div>

        <div className="card space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número da Unidade *
              </label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => handleInputChange('id', e.target.value)}
                className="input-field"
                placeholder="101"
                disabled={!!editingUnit}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bloco (opcional)
              </label>
              <input
                type="text"
                value={formData.block}
                onChange={(e) => handleInputChange('block', e.target.value)}
                className="input-field"
                placeholder="A"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefone (WhatsApp)
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="input-field"
              placeholder="5511999999999"
            />
            <p className="text-xs text-gray-500 mt-1">
              Formato: DDI + DDD + Número (sem espaços)
            </p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Moradores
              </label>
              <button
                onClick={addResidentField}
                className="text-blue-600 text-sm font-medium"
              >
                + Adicionar
              </button>
            </div>

            <div className="space-y-2">
              {formData.residents.map((resident, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={resident}
                    onChange={(e) => handleResidentChange(index, e.target.value)}
                    className="input-field"
                    placeholder="Nome do morador"
                  />
                  {formData.residents.length > 1 && (
                    <button
                      onClick={() => removeResidentField(index)}
                      className="p-3 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={closeForm} className="flex-1 btn-secondary">
              Cancelar
            </button>
            <button onClick={saveUnit} className="flex-1 btn-primary">
              <Save size={20} className="inline mr-2" />
              Salvar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Administração</h2>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowImportForm(true)} className="btn-primary">
            <Upload size={20} className="inline mr-2" />
            Importar CSV
          </button>
          <button onClick={() => setShowUserForm(true)} className="btn-primary">
            <UserPlus size={20} className="inline mr-2" />
            Novo Usuário
          </button>
          <button onClick={() => openForm()} className="btn-primary">
            <Plus size={20} className="inline mr-2" />
            Nova Unidade
          </button>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Users size={24} className="text-blue-600" />
          <p className="font-semibold text-gray-700">
            {units.length} unidade(s) cadastrada(s)
          </p>
        </div>
      </div>

      {units.length === 0 ? (
        <div className="card text-center py-12">
          <Users size={48} className="text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Nenhuma unidade cadastrada</p>
          <button onClick={() => openForm()} className="mt-4 btn-primary">
            Cadastrar Primeira Unidade
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {units.map((unit) => (
            <div key={unit.docId} className="card">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-lg font-bold text-gray-800">
                    {unit.block && `Bloco ${unit.block} - `}Apto {unit.id}
                  </p>
                  
                  {unit.residents && unit.residents.length > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      👤 {unit.residents.join(', ')}
                    </p>
                  )}
                  
                  {unit.phone && (
                    <p className="text-sm text-gray-600 mt-1">
                      📱 {unit.phone}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openForm(unit)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Editar"
                  >
                    <Edit2 size={20} />
                  </button>
                  <button
                    onClick={() => deleteUnit(unit)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Excluir"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Admin;
