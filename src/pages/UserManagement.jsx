import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Users, Edit2, Trash2, Lock, Unlock, UserCheck, UserX, Shield, User } from 'lucide-react';

const UserManagement = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      alert('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (user) => {
    const action = user.blocked ? 'desbloquear' : 'bloquear';
    if (!window.confirm(Deseja realmente  o usuário ?)) {
      return;
    }

    try {
      await updateDoc(doc(db, 'users', user.id), {
        blocked: !user.blocked
      });
      alert(Usuário  com sucesso!);
      loadUsers();
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      alert('Erro ao atualizar usuário');
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(Deseja realmente DELETAR o usuário ? Esta ação não pode ser desfeita.)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', user.id));
      alert('Usuário deletado com sucesso!');
      loadUsers();
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      alert('Erro ao deletar usuário');
    }
  };

  const handleChangeRole = async (user, newRole) => {
    if (!window.confirm(Deseja realmente mudar a função de  para ?)) {
      return;
    }

    try {
      await updateDoc(doc(db, 'users', user.id), {
        role: newRole
      });
      alert('Função alterada com sucesso!');
      loadUsers();
    } catch (error) {
      console.error('Erro ao alterar função:', error);
      alert('Erro ao alterar função');
    }
  };

  const getRoleName = (role) => {
    const roles = {
      'admin': 'Administrador',
      'porteiro': 'Porteiro',
      'controlador': 'Controlador',
      'expedicao': 'Expedição'
    };
    return roles[role] || role;
  };

  const getRoleIcon = (role) => {
    if (role === 'admin') return <Shield size={16} className="text-purple-600" />;
    if (role === 'porteiro') return <User size={16} className="text-blue-600" />;
    if (role === 'controlador') return <UserCheck size={16} className="text-green-600" />;
    if (role === 'expedicao') return <User size={16} className="text-orange-600" />;
    return <User size={16} />;
  };

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
        <h2 className="text-2xl font-bold text-gray-800">Gerenciamento de Usuários</h2>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Users size={24} className="text-blue-600" />
          <p className="font-semibold text-gray-700">
            {users.length} usuário(s) cadastrado(s)
          </p>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="card text-center py-12">
          <Users size={48} className="text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Nenhum usuário cadastrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            <div key={user.id} className={card }>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {getRoleIcon(user.role)}
                    <p className="text-lg font-bold text-gray-800">
                      {user.name}
                    </p>
                    {user.blocked && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                        BLOQUEADO
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mt-1">
                     {user.email}
                  </p>

                  <div className="flex gap-4 mt-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Função:</span> {getRoleName(user.role)}
                    </p>
                    {user.createdAt && (
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">Criado em:</span>{' '}
                        {new Date(user.createdAt.seconds * 1000).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>

                  {/* Change Role */}
                  <div className="mt-3">
                    <label className="text-xs text-gray-600 block mb-1">Alterar função:</label>
                    <select
                      value={user.role}
                      onChange={(e) => handleChangeRole(user, e.target.value)}
                      className="text-sm border rounded px-2 py-1"
                      disabled={user.id === currentUser?.uid}
                    >
                      <option value="admin">Administrador</option>
                      <option value="porteiro">Porteiro</option>
                      <option value="controlador">Controlador</option>
                      <option value="expedicao">Expedição</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleBlockUser(user)}
                    className={p-2 rounded-lg }
                    title={user.blocked ? 'Desbloquear' : 'Bloquear'}
                    disabled={user.id === currentUser?.uid}
                  >
                    {user.blocked ? <Unlock size={20} /> : <Lock size={20} />}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Deletar"
                    disabled={user.id === currentUser?.uid}
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

export default UserManagement;
