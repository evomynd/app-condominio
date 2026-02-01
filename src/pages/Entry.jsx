import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, Check, RotateCcw, Home, QrCode, Keyboard, Package } from 'lucide-react';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db as firebaseDb } from '../config/firebase';
import { db, savePhoto } from '../config/dexie';

const Entry = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('scan'); // scan, tracking, unit, type, photo (only for retirar-portaria), decision
  const [scanMode, setScanMode] = useState(null); // 'qr' or 'manual'
  const [trackingCode, setTrackingCode] = useState('');
  const [unitId, setUnitId] = useState('');
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [packageType, setPackageType] = useState('comum'); // comum ou retirar-portaria
  const [loading, setLoading] = useState(false);
  
  const webcamRef = useRef(null);
  const qrScannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  // Initialize QR Scanner
  useEffect(() => {
    if (step === 'scan' && scanMode === 'qr') {
      const qrCodeScanner = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = qrCodeScanner;

      qrCodeScanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          setTrackingCode(decodedText);
          qrCodeScanner.stop();
          setScanMode(null);
          setStep('unit');
        },
        (errorMessage) => {
          // Silent error handling
        }
      ).catch((err) => {
        console.error("Error starting QR scanner:", err);
        alert("Erro ao acessar câmera. Tente entrada manual.");
        setScanMode(null);
      });

      return () => {
        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
          html5QrCodeRef.current.stop().catch(() => {});
        }
      };
    }
  }, [step, scanMode]);

  // Search units
  const searchUnits = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setUnits([]);
      return;
    }

    try {
      const unitsRef = collection(firebaseDb, 'units');
      const q = query(unitsRef, where('id', '>=', searchTerm), where('id', '<=', searchTerm + '\uf8ff'));
      const snapshot = await getDocs(q);
      const results = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
      setUnits(results);
    } catch (error) {
      console.error('Error searching units:', error);
      setUnits([]);
    }
  };

  const handleUnitSearch = (value) => {
    setUnitId(value);
    searchUnits(value);
  };

  const selectUnit = (unit) => {
    setSelectedUnit(unit);
    setUnitId(unit.id);
    setUnits([]);
    setStep('type'); // Agora pula direto para seleção de tipo
  };

  // Camera functions (só para retirar-portaria)
  const openCamera = () => {
    setShowCamera(true);
  };

  const handleFileCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result);
        savePackageWithPhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setCapturedImage(imageSrc);
        setShowCamera(false);
        savePackageWithPhoto(imageSrc);
      }
    }
  }, [webcamRef, trackingCode, selectedUnit]);

  const retakePhoto = () => {
    setCapturedImage(null);
    setShowCamera(true);
  };

  // Save package WITHOUT photo (for tipo comum)
  const savePackageComum = async () => {
    if (!trackingCode || !selectedUnit) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);

    try {
      const packageId = `pkg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Save to local IndexedDB first
      await db.packages.add({
        id: packageId,
        code: trackingCode,
        apartment: selectedUnit.id,
        residentName: selectedUnit.residents?.[0] || '',
        type: 'comum',
        status: 'aguardando_triagem',
        photoId: null,
        createdAt: new Date(),
        notifiedAt: null,
        pickedUpAt: null
      });

      alert('Encomenda registrada! Aguardando triagem.');
      finish();
    } catch (error) {
      console.error('Error saving package:', error);
      alert('Erro ao salvar encomenda. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Save package WITH photo (for tipo retirar-portaria)
  const savePackageWithPhoto = async (imageData) => {
    if (!trackingCode || !selectedUnit || !imageData) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);

    try {
      // Convert base64 to Blob
      const response = await fetch(imageData);
      const blob = await response.blob();

      // Save photo to IndexedDB
      const photoId = await savePhoto(blob, null);
      
      if (!photoId) {
        throw new Error('Falha ao salvar foto no IndexedDB');
      }

      const packageId = `pkg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Save to local IndexedDB first
      await db.packages.add({
        id: packageId,
        code: trackingCode,
        apartment: selectedUnit.id,
        residentName: selectedUnit.residents?.[0] || '',
        type: 'retirar-portaria',
        status: 'pending_notification',
        photoId: photoId,
        createdAt: new Date(),
        notifiedAt: null,
        pickedUpAt: null
      });

      // Save package to Firestore
      const packageData = {
        tracking_code: trackingCode,
        unit_id: selectedUnit.id,
        unit_block: selectedUnit.block || '',
        status: 'pending_notification',
        type: 'retirar-portaria',
        location: 'portaria',
        local_photo_id: photoId,
        created_at: serverTimestamp(),
        retired_at: null,
        retired_by: null,
        signature_base64: null
      };

      await addDoc(collection(firebaseDb, 'packages'), packageData);
      
      alert('Encomenda registrada! Redirecionando para notificação...');
      
      // Redireciona para a tela de notificação
      setTimeout(() => {
        navigate('/notification');
      }, 1500);
    } catch (error) {
      console.error('Error saving package:', error);
      alert('Erro ao salvar encomenda. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Decision handlers (apenas para tipo comum)
  const repeatSameUnit = () => {
    // Keep selectedUnit and unitId, reset only tracking
    setTrackingCode('');
    setCapturedImage(null);
    setPackageType('comum');
    setScanMode(null);
    setStep('scan');
  };

  const newUnit = () => {
    // Reset everything
    setTrackingCode('');
    setUnitId('');
    setSelectedUnit(null);
    setCapturedImage(null);
    setPackageType('comum');
    setScanMode(null);
    setStep('scan');
  };

  const finish = () => {
    // Reset everything
    setTrackingCode('');
    setUnitId('');
    setSelectedUnit(null);
    setCapturedImage(null);
    setPackageType('comum');
    setScanMode(null);
    setStep('scan');
  };

  // Render QR Scanner
  if (step === 'scan' && scanMode === 'qr') {
    return (
      <div className="p-4 space-y-4">
        <h2 className="text-2xl font-bold text-gray-800">Escanear Código</h2>
        <div className="card">
          <div id="qr-reader" style={{ width: '100%' }}></div>
          <p className="text-center text-gray-600 mt-4">
            Aponte a câmera para o QR Code ou Código de Barras
          </p>
        </div>
        <button 
          onClick={() => {
            if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
              html5QrCodeRef.current.stop();
            }
            setScanMode(null);
          }} 
          className="w-full btn-secondary"
        >
          <X size={20} className="inline mr-2" />
          Cancelar
        </button>
      </div>
    );
  }

  // Render based on step
  if (step === 'decision') {
    return (
      <div className="p-4 space-y-4">
        <div className="card text-center">
          <Check size={64} className="text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-green-600 mb-2">Encomenda Registrada!</h2>
          <p className="text-gray-600">Escolha a próxima ação:</p>
        </div>

        <button onClick={repeatSameUnit} className="w-full btn-primary">
          <RotateCcw size={20} className="inline mr-2" />
          Mesmo Apto ({selectedUnit?.id})
        </button>

        <button onClick={newUnit} className="w-full btn-secondary">
          <Home size={20} className="inline mr-2" />
          Outro Apto
        </button>

        <button onClick={finish} className="w-full bg-gray-500 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-gray-600 min-h-touch">
          Finalizar
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Registrar Encomenda</h2>

      {/* Step 0: Scan mode selection */}
      {step === 'scan' && !scanMode && (
        <div className="space-y-4">
          <button onClick={() => setScanMode('qr')} className="w-full btn-primary py-8">
            <QrCode size={48} className="mx-auto mb-2" />
            <span className="text-lg">Escanear QR Code / Código de Barras</span>
          </button>
          <button onClick={() => { setScanMode('manual'); setStep('tracking'); }} className="w-full btn-secondary py-8">
            <Keyboard size={48} className="mx-auto mb-2" />
            <span className="text-lg">Entrada Manual</span>
          </button>
        </div>
      )}

      {/* Step 1: Tracking Code (Manual) */}
      {step === 'tracking' && scanMode === 'manual' && (
        <div className="card space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código de Rastreio
            </label>
            <input
              type="text"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              className="input-field"
              placeholder="Ex: BR123456789ABC"
              autoFocus
            />
          </div>
          <button
            onClick={() => setStep('unit')}
            disabled={!trackingCode}
            className="w-full btn-primary disabled:opacity-50"
          >
            Próximo
          </button>
        </div>
      )}

      {/* Step 2: Unit Selection */}
      {step === 'unit' && (
        <div className="card space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Apartamento / Unidade
            </label>
            <input
              type="text"
              value={unitId}
              onChange={(e) => handleUnitSearch(e.target.value)}
              className="input-field"
              placeholder="Ex: 101, 502, Casa 5..."
              autoFocus
            />
          </div>

          {units.length > 0 && (
            <div className="space-y-2">
              {units.map((unit) => (
                <button
                  key={unit.docId}
                  onClick={() => selectUnit(unit)}
                  className="w-full p-4 bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-lg text-left transition-colors"
                >
                  <p className="font-semibold text-gray-800">
                    {unit.block ? `Bloco ${unit.block} - ` : ''}Apto {unit.id}
                  </p>
                  {unit.residents && unit.residents.length > 0 && (
                    <p className="text-sm text-gray-600">{unit.residents.join(', ')}</p>
                  )}
                </button>
              ))}
            </div>
          )}

          <button onClick={() => setStep('tracking')} className="w-full btn-secondary">
            Voltar
          </button>
        </div>
      )}

      {/* Step 3: Type Selection */}
      {step === 'type' && (
        <div className="card space-y-4">
          <p className="text-gray-700 font-medium">
            Código: <span className="text-blue-600">{trackingCode}</span>
          </p>
          <p className="text-gray-700 font-medium">
            Apto: <span className="text-blue-600">{selectedUnit?.id}</span>
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Encomenda
            </label>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setPackageType('comum');
                  savePackageComum();
                }}
                disabled={loading}
                className="w-full p-4 rounded-lg border-2 border-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center justify-center gap-2">
                  <Package size={24} className="text-blue-600" />
                  <div className="text-left">
                    <p className="font-semibold text-blue-600">Comum</p>
                    <p className="text-sm text-gray-600">Vai para triagem</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setPackageType('retirar-portaria');
                  setStep('photo');
                }}
                disabled={loading}
                className="w-full p-4 rounded-lg border-2 border-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center justify-center gap-2">
                  <Camera size={24} className="text-red-600" />
                  <div className="text-left">
                    <p className="font-semibold text-red-600">Retirar na Portaria</p>
                    <p className="text-sm text-gray-600">Morador retira na portaria (tira foto)</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <button onClick={() => setStep('unit')} className="w-full bg-gray-500 text-white font-semibold py-3 px-6 rounded-lg">
            Voltar
          </button>
        </div>
      )}

      {/* Step 4: Photo (only for retirar-portaria) */}
      {step === 'photo' && !showCamera && !capturedImage && (
        <div className="card space-y-4">
          <p className="text-gray-700 font-medium">
            Apto: <span className="text-blue-600">{selectedUnit?.id}</span>
          </p>
          <p className="text-gray-700 font-medium">
            Tipo: <span className="text-red-600">Retirar na Portaria</span>
          </p>
          
          {/* Native camera input for mobile */}
          <label className="w-full btn-primary cursor-pointer block text-center">
            <Camera size={20} className="inline mr-2" />
            Tirar Foto da Encomenda
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileCapture}
              className="hidden"
            />
          </label>
          
          {/* Fallback to webcam (for desktop) */}
          <button onClick={openCamera} className="w-full btn-secondary">
            <Camera size={20} className="inline mr-2" />
            Usar Webcam (Desktop)
          </button>
          
          <button onClick={() => setStep('type')} className="w-full bg-gray-500 text-white font-semibold py-3 px-6 rounded-lg">
            Voltar
          </button>
        </div>
      )}

      {/* Camera View */}
      {showCamera && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex-1 relative">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{
                facingMode: { ideal: 'environment' }
              }}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-4 bg-black flex justify-around">
            <button
              onClick={() => { setShowCamera(false); setStep('photo'); }}
              className="bg-red-600 text-white p-4 rounded-full"
            >
              <X size={24} />
            </button>
            <button
              onClick={capture}
              className="bg-white text-black p-6 rounded-full"
              disabled={loading}
            >
              <Camera size={32} />
            </button>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <p className="text-lg font-semibold">Salvando encomenda...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Entry;


