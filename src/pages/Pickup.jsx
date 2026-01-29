import { useState, useRef } from 'react';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getPhoto } from '../config/dexie';
import { Search, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import SignatureCanvas from 'react-signature-canvas';

const Pickup = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [packages, setPackages] = useState([]);
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('search'); // search, checkout
  const [recipientName, setRecipientName] = useState('');
  const [showSignature, setShowSignature] = useState(false);
  const [photos, setPhotos] = useState({});
  
  const signatureRef = useRef(null);

  const searchPackages = async () => {
    if (!searchTerm || searchTerm.length < 2) {
      alert('Digite pelo menos 2 caracteres');
      return;
    }

    setLoading(true);
    console.log('Buscando encomendas para apartamento:', searchTerm);
    
    try {
      const packagesRef = collection(db, 'packages');
      const q = query(
        packagesRef,
        where('unit_id', '==', searchTerm),
        where('status', '==', 'pending_pickup')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log('Encomendas encontradas:', data.length);

      if (data.length === 0) {
        alert('Nenhuma encomenda pendente para este apartamento');
        setLoading(false);
        return;
      }

      // Load photos
      console.log('Carregando fotos...');
      const photoPromises = data.map(async (pkg) => {
        try {
          const blob = await getPhoto(pkg.local_photo_id);
          if (blob) {
            return { id: pkg.id, url: URL.createObjectURL(blob) };
          }
          return { id: pkg.id, url: null };
        } catch (err) {
          console.error('Erro ao carregar foto:', pkg.local_photo_id, err);
          return { id: pkg.id, url: null };
        }
      });

      const loadedPhotos = await Promise.all(photoPromises);
      const photosMap = {};
      loadedPhotos.forEach(p => {
        photosMap[p.id] = p.url;
      });

      console.log('Fotos carregadas:', Object.keys(photosMap).length);

      setPhotos(photosMap);
      setPackages(data);
      setStep('checkout');
    } catch (error) {
      console.error('Error searching packages:', error);
      alert('Erro ao buscar encomendas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const togglePackageSelection = (pkgId) => {
    setSelectedPackages(prev => {
      if (prev.includes(pkgId)) {
        return prev.filter(id => id !== pkgId);
      } else {
        return [...prev, pkgId];
      }
    });
  };

  const selectAll = () => {
    setSelectedPackages(packages.map(p => p.id));
  };

  const clearSelection = () => {
    setSelectedPackages([]);
  };

  const proceedToSignature = () => {
    if (selectedPackages.length === 0) {
      alert('Selecione pelo menos uma encomenda');
      return;
    }
    if (!recipientName.trim()) {
      alert('Digite o nome de quem está retirando');
      return;
    }
    setShowSignature(true);
  };

  const confirmPickup = async () => {
    if (signatureRef.current.isEmpty()) {
      alert('Assinatura obrigatória');
      return;
    }

    setLoading(true);

    try {
      const signatureBase64 = signatureRef.current.toDataURL();
      const batch = writeBatch(db);

      selectedPackages.forEach(pkgId => {
        const pkgRef = doc(db, 'packages', pkgId);
        batch.update(pkgRef, {
          status: 'retired',
          retired_at: new Date(),
          retired_by: recipientName,
          signature_base64: signatureBase64
        });
      });

      await batch.commit();

      alert(`${selectedPackages.length} encomenda(s) retirada(s) com sucesso!`);

      // Reset
      setSearchTerm('');
      setPackages([]);
      setSelectedPackages([]);
      setRecipientName('');
      setShowSignature(false);
      setStep('search');
      
      // Clean up photo URLs
      Object.values(photos).forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
      setPhotos({});

    } catch (error) {
      console.error('Error confirming pickup:', error);
      alert('Erro ao confirmar retirada');
    } finally {
      setLoading(false);
    }
  };

  const cancelCheckout = () => {
    setStep('search');
    setPackages([]);
    setSelectedPackages([]);
    setRecipientName('');
    setShowSignature(false);
    
    // Clean up photo URLs
    Object.values(photos).forEach(url => {
      if (url) URL.revokeObjectURL(url);
    });
    setPhotos({});
  };

  if (showSignature) {
    const selectedPhotos = selectedPackages.map(pkgId => {
      const pkg = packages.find(p => p.id === pkgId);
      return { id: pkgId, url: photos[pkgId], code: pkg?.tracking_code };
    }).filter(p => p.url);

    return (
      <div className="p-4 space-y-4">
        <h2 className="text-2xl font-bold text-gray-800">Conferir e Assinar</h2>

        <div className="card space-y-4">
          <p className="text-gray-700">
            <strong>{recipientName}</strong> está retirando <strong>{selectedPackages.length}</strong> encomenda(s)
          </p>

          {/* Photo Grid */}
          {selectedPhotos.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Fotos das Encomendas:</p>
              <div className="grid grid-cols-2 gap-2">
                {selectedPhotos.map(photo => (
                  <div key={photo.id} className="relative">
                    <img 
                      src={photo.url} 
                      alt={photo.code}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                    <span className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                      {photo.code}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
            <p className="text-sm text-gray-600 p-2 bg-gray-50 border-b">Assine abaixo:</p>
            <SignatureCanvas
              ref={signatureRef}
              canvasProps={{
                className: 'w-full h-48'
              }}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => signatureRef.current.clear()}
              className="btn-secondary"
            >
              Limpar
            </button>
            <button
              onClick={() => setShowSignature(false)}
              className="btn-secondary"
            >
              Voltar
            </button>
            <button
              onClick={confirmPickup}
              disabled={loading}
              className="flex-1 btn-success disabled:opacity-50"
            >
              {loading ? 'Confirmando...' : 'Confirmar Retirada'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'checkout') {
    return (
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Retirada - Apto {searchTerm}</h2>
          <button onClick={cancelCheckout} className="text-red-600">
            <X size={24} />
          </button>
        </div>

        <div className="card space-y-3">
          <div className="flex justify-between items-center">
            <p className="font-semibold text-gray-700">{packages.length} encomenda(s) encontrada(s)</p>
            <div className="space-x-2">
              <button onClick={selectAll} className="text-blue-600 text-sm font-medium">
                Todas
              </button>
              <button onClick={clearSelection} className="text-gray-600 text-sm font-medium">
                Limpar
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                onClick={() => togglePackageSelection(pkg.id)}
                className={`p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                  selectedPackages.includes(pkg.id)
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={selectedPackages.includes(pkg.id)}
                      onChange={() => {}}
                      className="w-5 h-5 mt-1"
                    />
                  </div>
                  
                  {photos[pkg.id] && (
                    <img
                      src={photos[pkg.id]}
                      alt="Package"
                      className="w-20 h-20 object-cover rounded"
                    />
                  )}

                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{pkg.tracking_code}</p>
                    <p className="text-sm text-gray-600">
                      {pkg.created_at && format(pkg.created_at.toDate(), "dd/MM/yy 'às' HH:mm")}
                    </p>
                    <p className="text-xs text-gray-500">
                      📍 {pkg.location === 'setor' ? 'Setor' : 'Portaria'}
                    </p>
                    {pkg.type === 'perecivel' && (
                      <span className="text-xs text-red-600 font-semibold">⚠️ Perecível</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome de quem está retirando
            </label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="input-field"
              placeholder="Ex: Morador, Filho, Empregada..."
              autoFocus
            />
          </div>

          <button
            onClick={proceedToSignature}
            disabled={selectedPackages.length === 0 || !recipientName.trim()}
            className="w-full btn-primary disabled:opacity-50"
          >
            <Check size={20} className="inline mr-2" />
            Prosseguir para Assinatura ({selectedPackages.length})
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Retirada de Encomendas</h2>

      <div className="card space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buscar por Apartamento
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchPackages()}
            className="input-field"
            placeholder="Ex: 101, 502..."
            autoFocus
          />
        </div>

        <button
          onClick={searchPackages}
          disabled={loading || !searchTerm}
          className="w-full btn-primary disabled:opacity-50"
        >
          {loading ? (
            'Buscando...'
          ) : (
            <>
              <Search size={20} className="inline mr-2" />
              Buscar Encomendas
            </>
          )}
        </button>
      </div>

      <div className="card bg-blue-50 border border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>💡 Dica:</strong> Digite o número do apartamento para ver todas as encomendas pendentes.
        </p>
      </div>
    </div>
  );
};

export default Pickup;
