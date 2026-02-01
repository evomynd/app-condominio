import { useState, useRef, useEffect } from 'react';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getPhoto } from '../config/dexie';
import { Search, Check, X, PackageCheck } from 'lucide-react';
import { format } from 'date-fns';
import SignatureCanvas from 'react-signature-canvas';

const Pickup = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [allPackages, setAllPackages] = useState([]);
  const [filteredPackages, setFilteredPackages] = useState([]);
  const [packages, setPackages] = useState([]);
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('list'); // list, checkout
  const [recipientName, setRecipientName] = useState('');
  const [showSignature, setShowSignature] = useState(false);
  const [photos, setPhotos] = useState({});
  const [units, setUnits] = useState({});

  const signatureRef = useRef(null);

  useEffect(() => {
    loadAllPendingPackages();
  }, []);

  useEffect(() => {
    filterPackages();
  }, [searchTerm, allPackages]);

  const loadAllPendingPackages = async () => {
    setLoading(true);
    try {
      // Carregar todas as encomendas pendentes
      const packagesRef = collection(db, 'packages');
      const q = query(
        packagesRef,
        where('status', '==', 'pending_pickup')
      );
      const snapshot = await getDocs(q);
      const packagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Ordenar por data de criaÃ§Ã£o (mais antigas primeiro)
      packagesData.sort((a, b) => {
        if (!a.created_at || !b.created_at) return 0;
        return a.created_at.toMillis() - b.created_at.toMillis();
      });

      // Carregar dados das unidades (apartamentos)
      const unitsRef = collection(db, 'units');
      const unitsSnapshot = await getDocs(unitsRef);
      const unitsData = {};
      unitsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        unitsData[data.id] = data;
      });

      setAllPackages(packagesData);
      setFilteredPackages(packagesData);
      setUnits(unitsData);

      // Carregar fotos em background
      for (const pkg of packagesData) {
        try {
          const blob = await getPhoto(pkg.local_photo_id);
          if (blob) {
            setPhotos(prev => ({ ...prev, [pkg.id]: URL.createObjectURL(blob) }));
          }
        } catch (err) {
          console.error('Erro ao carregar foto:', pkg.local_photo_id, err);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar encomendas:', error);
      alert('Erro ao carregar encomendas');
    } finally {
      setLoading(false);
    }
  };

  const filterPackages = () => {
    if (!searchTerm || searchTerm.trim() === '') {
      setFilteredPackages(allPackages);
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    const filtered = allPackages.filter(pkg => {
      // Buscar por nÃºmero do apartamento
      if (pkg.unit_id && pkg.unit_id.toLowerCase().includes(term)) {
        return true;
      }

      // Buscar por cÃ³digo de rastreamento
      if (pkg.tracking_code && pkg.tracking_code.toLowerCase().includes(term)) {
        return true;
      }

      // Buscar por nome dos moradores
      const unitData = units[pkg.unit_id];
      if (unitData && unitData.residents) {
        const residentMatch = unitData.residents.some(resident =>
          resident && resident.toLowerCase().includes(term)
        );
        if (residentMatch) return true;
      }

      return false;
    });

    setFilteredPackages(filtered);
  };

  const selectUnitPackages = (unitId) => {
    const unitPackages = filteredPackages.filter(pkg => pkg.unit_id === unitId);
    setPackages(unitPackages);
    setSelectedPackages(unitPackages.map(p => p.id));
    setStep('checkout');
  };

const selectUnitPackages = (unitId) => {
    const unitPackages = filteredPackages.filter(pkg => pkg.unit_id === unitId);
    setPackages(unitPackages);
    setSelectedPackages(unitPackages.map(p => p.id));
    setStep('checkout');
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
      alert('Digite o nome de quem estÃ¡ retirando');
      return;
    }
    setShowSignature(true);
  };

  const confirmPickup = async () => {
    if (signatureRef.current.isEmpty()) {
      alert('Assinatura obrigatÃ³ria');
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

      // Reset and reload
      setSearchTerm('');
      setPackages([]);
      setSelectedPackages([]);
      setRecipientName('');
      setShowSignature(false);
      setStep('list');
      
      loadAllPendingPackages();

    } catch (error) {
      console.error('Error confirming pickup:', error);
      alert('Erro ao confirmar retirada');
    } finally {
      setLoading(false);
    }
  };

  const cancelCheckout = () => {
    setStep('list');
    setPackages([]);
    setSelectedPackages([]);
    setRecipientName('');
    setShowSignature(false);
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
            <strong>{recipientName}</strong> estÃ¡ retirando <strong>{selectedPackages.length}</strong> encomenda(s)
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
    const firstPackage = packages[0];
    return (
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            Retirada - Apto {firstPackage?.unit_id}
          </h2>
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
                      {pkg.created_at && format(pkg.created_at.toDate(), "dd/MM/yy 'Ã s' HH:mm")}
                    </p>
                    <p className="text-xs text-gray-500">
                      ðŸ“ {pkg.location === 'setor' ? 'Setor' : 'Portaria'}
                    </p>
                    {pkg.type === 'perecivel' && (
                      <span className="text-xs text-red-600 font-semibold">âš ï¸ PerecÃ­vel</span>
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
              Nome de quem estÃ¡ retirando
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Retirada de Encomendas</h2>
        {!loading && (
          <span className="status-notify">{filteredPackages.length}</span>
        )}
      </div>

      <div className="card space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Search size={16} className="inline mr-1" />
            Filtrar por Apartamento, CÃ³digo ou Morador
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field"
            placeholder="Ex: 101, ABC123, JoÃ£o Silva..."
            autoFocus
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredPackages.length === 0 ? (
        <div className="card text-center py-12">
          <PackageCheck size={48} className="text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            {searchTerm ? 'Nenhuma encomenda encontrada' : 'Nenhuma encomenda pendente'}
          </p>
        </div>
      ) : (
        <>
          {/* Group packages by unit */}
          {Object.entries(
            filteredPackages.reduce((acc, pkg) => {
              if (!acc[pkg.unit_id]) {
                acc[pkg.unit_id] = [];
              }
              acc[pkg.unit_id].push(pkg);
              return acc;
            }, {})
          ).map(([unitId, unitPackages]) => {
            const unitData = units[unitId];
            const hasUrgent = unitPackages.some(p => p.type === 'perecivel');
            
            return (
              <div key={unitId} className="card space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-lg font-bold text-gray-800">
                      Apto {unitId}
                      {unitPackages[0].unit_block && (
                        <span className="text-gray-600"> - Bloco {unitPackages[0].unit_block}</span>
                      )}
                    </p>
                    {unitData && unitData.residents && unitData.residents.length > 0 && (
                      <p className="text-sm text-gray-600">
                        ðŸ‘¤ {unitData.residents.join(', ')}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">
                      ðŸ“¦ {unitPackages.length} {unitPackages.length > 1 ? 'encomendas' : 'encomenda'}
                    </p>
                  </div>
                  {hasUrgent && (
                    <span className="status-urgent text-xs">
                      âš ï¸ PerecÃ­vel
                    </span>
                  )}
                </div>

                {/* Package previews */}
                <div className="flex gap-2 overflow-x-auto">
                  {unitPackages.map(pkg => (
                    <div key={pkg.id} className="flex-shrink-0">
                      {photos[pkg.id] ? (
                        <div className="relative">
                          <img
                            src={photos[pkg.id]}
                            alt={pkg.tracking_code}
                            className="w-20 h-20 object-cover rounded border border-gray-200"
                          />
                          <span className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs px-1 py-0.5 text-center truncate">
                            {pkg.tracking_code}
                          </span>
                        </div>
                      ) : (
                        <div className="w-20 h-20 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                          <PackageCheck size={24} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Package details */}
                <div className="space-y-1">
                  {unitPackages.map(pkg => (
                    <div key={pkg.id} className="flex justify-between items-center text-sm border-t pt-2">
                      <div>
                        <span className="font-medium">{pkg.tracking_code}</span>
                        {pkg.type === 'perecivel' && (
                          <span className="ml-2 text-xs text-red-600">âš ï¸ PerecÃ­vel</span>
                        )}
                        <p className="text-xs text-gray-500">
                          {pkg.created_at && format(pkg.created_at.toDate(), "dd/MM/yy 'Ã s' HH:mm")}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">
                        ðŸ“ {pkg.location === 'setor' ? 'Setor' : 'Portaria'}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => selectUnitPackages(unitId)}
                  className="w-full btn-primary"
                >
                  <Check size={16} className="inline mr-2" />
                  Retirar {unitPackages.length > 1 ? 'Todas' : 'Encomenda'}
                </button>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

export default Pickup;


