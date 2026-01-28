import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getPhoto, blobToFile } from '../config/dexie';
import { Send, Check, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const Notification = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(null);

  useEffect(() => {
    loadPendingNotifications();
  }, []);

  const loadPendingNotifications = async () => {
    setLoading(true);
    try {
      const packagesRef = collection(db, 'packages');
      const q = query(
        packagesRef,
        where('status', '==', 'pending_notification')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort manually by created_at (descending)
      data.sort((a, b) => {
        if (!a.created_at || !b.created_at) return 0;
        return b.created_at.toMillis() - a.created_at.toMillis();
      });
      setPackages(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
      alert('Erro ao carregar notificações');
    } finally {
      setLoading(false);
    }
  };

  const shareToWhatsApp = async (pkg) => {
    setSending(pkg.id);

    try {
      // Get unit data for phone number
      const unitsRef = collection(db, 'units');
      const q = query(unitsRef, where('id', '==', pkg.unit_id));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        alert('Unidade não encontrada no cadastro');
        setSending(null);
        return;
      }

      const unitData = snapshot.docs[0].data();

      console.log('Tentando buscar foto com ID:', pkg.local_photo_id);

      // Get photo from IndexedDB
      const photoBlob = await getPhoto(pkg.local_photo_id);
      
      console.log('Foto recuperada:', photoBlob ? photoBlob.size + ' bytes' : 'null');
      
      if (!photoBlob) {
        alert('Foto não encontrada. Verifique o armazenamento local.\nID da foto: ' + pkg.local_photo_id);
        setSending(null);
        return;
      }

      // Convert Blob to File
      const photoFile = blobToFile(photoBlob, `encomenda_${pkg.unit_id}.jpg`);

      // Prepare message
      const message = `🏢 *Encomenda Chegou!*\n\n` +
        `📦 Apto: ${pkg.unit_id}${pkg.unit_block ? ` - Bloco ${pkg.unit_block}` : ''}\n` +
        `📍 Local: ${pkg.location === 'setor' ? 'Setor de Encomendas' : 'Portaria'}\n` +
        `🏷️ Código: ${pkg.tracking_code}\n` +
        `${pkg.type === 'perecivel' ? '⚠️ ATENÇÃO: Item Perecível ou Grande Porte!' : ''}`;

      // Check if Web Share API is available
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [photoFile] })) {
        await navigator.share({
          title: 'Nova Encomenda',
          text: message,
          files: [photoFile]
        });

        // Ask for confirmation
        const confirmed = window.confirm('A notificação foi enviada com sucesso?');
        
        if (confirmed) {
          // Update status to pending_pickup
          await updateDoc(doc(db, 'packages', pkg.id), {
            status: 'pending_pickup',
            notified_at: new Date()
          });

          // Reload list
          loadPendingNotifications();
          alert('Status atualizado para "Pendente de Retirada"');
        }
      } else {
        // Fallback: Show phone and message
        alert(
          `Web Share não disponível.\n\n` +
          `Telefone: ${unitData.phone || 'Não cadastrado'}\n\n` +
          `Mensagem:\n${message}`
        );
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error sharing:', error);
        alert('Erro ao compartilhar. Verifique as permissões do navegador.');
      }
    } finally {
      setSending(null);
    }
  };

  const markAsNotified = async (pkg) => {
    if (!window.confirm('Confirmar que já notificou o morador?')) {
      return;
    }

    try {
      await updateDoc(doc(db, 'packages', pkg.id), {
        status: 'pending_pickup',
        notified_at: new Date()
      });
      loadPendingNotifications();
      alert('Marcado como notificado!');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Erro ao atualizar status');
    }
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
        <h2 className="text-2xl font-bold text-gray-800">Notificações Pendentes</h2>
        <span className="status-notify">{packages.length}</span>
      </div>

      {packages.length === 0 ? (
        <div className="card text-center py-12">
          <Check size={48} className="text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Nenhuma encomenda para notificar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {packages.map((pkg) => (
            <div key={pkg.id} className="card space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-lg font-bold text-gray-800">
                    Apto {pkg.unit_id}
                    {pkg.unit_block && <span className="text-gray-600"> - Bloco {pkg.unit_block}</span>}
                  </p>
                  <p className="text-sm text-gray-600">Código: {pkg.tracking_code}</p>
                  <p className="text-xs text-gray-500">
                    {pkg.created_at && format(pkg.created_at.toDate(), "dd/MM/yyyy 'às' HH:mm")}
                  </p>
                </div>
                {pkg.type === 'perecivel' && (
                  <span className="status-urgent text-xs">
                    <AlertCircle size={12} className="inline mr-1" />
                    Urgente
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">📍 {pkg.location === 'setor' ? 'Setor' : 'Portaria'}</span>
                <span className="status-notify">A Notificar</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => shareToWhatsApp(pkg)}
                  disabled={sending === pkg.id}
                  className="flex-1 btn-success disabled:opacity-50"
                >
                  {sending === pkg.id ? (
                    'Enviando...'
                  ) : (
                    <>
                      <Send size={18} className="inline mr-2" />
                      Enviar WhatsApp
                    </>
                  )}
                </button>

                <button
                  onClick={() => markAsNotified(pkg)}
                  className="btn-secondary"
                  title="Marcar como notificado"
                >
                  <Check size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notification;
