import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getPhoto, blobToFile } from '../config/dexie';
import { Send, Check, AlertCircle, Package } from 'lucide-react';
import { format } from 'date-fns';

const Notification = () => {
  const [groupedPackages, setGroupedPackages] = useState([]);
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
      
      // Group by unit_id
      const grouped = {};
      data.forEach(pkg => {
        if (!grouped[pkg.unit_id]) {
          grouped[pkg.unit_id] = {
            unit_id: pkg.unit_id,
            unit_block: pkg.unit_block,
            packages: []
          };
        }
        grouped[pkg.unit_id].packages.push(pkg);
      });

      // Convert to array and sort by newest package in group
      const groupedArray = Object.values(grouped).map(group => {
        group.packages.sort((a, b) => {
          if (!a.created_at || !b.created_at) return 0;
          return b.created_at.toMillis() - a.created_at.toMillis();
        });
        return group;
      });

      setGroupedPackages(groupedArray);
    } catch (error) {
      console.error('Error loading notifications:', error);
      alert('Erro ao carregar notificações');
    } finally {
      setLoading(false);
    }
  };

  const shareToWhatsApp = async (group) => {
    setSending(group.unit_id);

    try {
      // Get unit data for phone number
      const unitsRef = collection(db, 'units');
      const q = query(unitsRef, where('id', '==', group.unit_id));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        alert('Unidade não encontrada no cadastro');
        setSending(null);
        return;
      }

      const unitData = snapshot.docs[0].data();

      // Get all photos from IndexedDB
      const photoFiles = [];
      for (const pkg of group.packages) {
        console.log('Tentando buscar foto com ID:', pkg.local_photo_id);
        const photoBlob = await getPhoto(pkg.local_photo_id);
        
        console.log('Foto recuperada:', photoBlob ? photoBlob.size + ' bytes' : 'null');
        
        if (photoBlob) {
          const photoFile = blobToFile(photoBlob, `encomenda_${pkg.tracking_code}.jpg`);
          photoFiles.push(photoFile);
        }
      }

      if (photoFiles.length === 0) {
        alert('Nenhuma foto encontrada. Verifique o armazenamento local.');
        setSending(null);
        return;
      }

      // Prepare message
      const count = group.packages.length;
      const message = `🏢 *${count > 1 ? count + ' Encomendas Chegaram!' : 'Encomenda Chegou!'}*\n\n` +
        `📦 Apto: ${group.unit_id}${group.unit_block ? ` - Bloco ${group.unit_block}` : ''}\n` +
        `📍 Local: ${group.packages[0].location === 'setor' ? 'Setor de Encomendas' : 'Portaria'}\n\n` +
        group.packages.map((pkg, idx) => 
          `${count > 1 ? `${idx + 1}. ` : ''}🏷️ ${pkg.tracking_code}${pkg.type === 'perecivel' ? ' ⚠️ PERECÍVEL' : ''}`
        ).join('\n');

      // Check if Web Share API is available
      if (navigator.share && navigator.canShare && navigator.canShare({ files: photoFiles })) {
        await navigator.share({
          title: count > 1 ? 'Novas Encomendas' : 'Nova Encomenda',
          text: message,
          files: photoFiles
        });

        // Ask for confirmation
        const confirmed = window.confirm('A notificação foi enviada com sucesso?');
        
        if (confirmed) {
          // Update all packages status
          for (const pkg of group.packages) {
            await updateDoc(doc(db, 'packages', pkg.id), {
              status: 'pending_pickup',
              notified_at: new Date()
            });
          }
          
          alert('Status atualizado com sucesso!');
          loadPendingNotifications();
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

  const markAsNotified = async (group) => {
    if (!window.confirm(`Confirmar que já notificou o morador do Apto ${group.unit_id}?`)) {
      return;
    }

    try {
      for (const pkg of group.packages) {
        await updateDoc(doc(db, 'packages', pkg.id), {
          status: 'pending_pickup',
          notified_at: new Date()
        });
      }
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

  const totalPackages = groupedPackages.reduce((sum, group) => sum + group.packages.length, 0);

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Notificações Pendentes</h2>
        <span className="status-notify">{totalPackages}</span>
      </div>

      {groupedPackages.length === 0 ? (
        <div className="card text-center py-12">
          <Check size={48} className="text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Nenhuma encomenda para notificar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groupedPackages.map((group) => {
            const hasUrgent = group.packages.some(p => p.type === 'perecivel');
            return (
              <div key={group.unit_id} className="card space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-lg font-bold text-gray-800">
                      Apto {group.unit_id}
                      {group.unit_block && <span className="text-gray-600"> - Bloco {group.unit_block}</span>}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Package size={14} />
                      {group.packages.length} {group.packages.length > 1 ? 'encomendas' : 'encomenda'}
                    </p>
                    {group.packages.map((pkg, idx) => (
                      <p key={pkg.id} className="text-xs text-gray-500">
                        {group.packages.length > 1 && `${idx + 1}. `}
                        {pkg.tracking_code}
                        {pkg.type === 'perecivel' && ' ⚠️'}
                      </p>
                    ))}
                  </div>
                  {hasUrgent && (
                    <span className="status-urgent text-xs">
                      <AlertCircle size={12} className="inline mr-1" />
                      Urgente
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    📍 {group.packages[0].location === 'setor' ? 'Setor' : 'Portaria'}
                  </span>
                  <span className="status-notify">A Notificar</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => shareToWhatsApp(group)}
                    disabled={sending === group.unit_id}
                    className="flex-1 btn-success disabled:opacity-50"
                  >
                    {sending === group.unit_id ? (
                      'Enviando...'
                    ) : (
                      <>
                        <Send size={16} className="inline mr-2" />
                        Enviar WhatsApp
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => markAsNotified(group)}
                    className="btn-secondary px-4"
                  >
                    <Check size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notification;
