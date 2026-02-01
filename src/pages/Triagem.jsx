import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { Camera, X, Package, Check } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db as firebaseDb } from '../config/firebase';
import { db, savePhoto } from '../config/dexie';

const Triagem = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const webcamRef = useRef(null);

  // Load packages waiting for triage
  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const packagesData = await db.packages
        .where('status')
        .equals('aguardando_triagem')
        .toArray();
      
      setPackages(packagesData);
    } catch (error) {
      console.error('Error loading packages:', error);
    }
  };

  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
  };

  const openCamera = () => {
    setShowCamera(true);
  };

  const handleFileCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result);
        setShowCamera(false);
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
      }
    }
  }, [webcamRef]);

  const retakePhoto = () => {
    setCapturedImage(null);
    setShowCamera(true);
  };

  const markAsReady = async () => {
    if (!selectedPackage || !capturedImage) {
      alert('Tire uma foto antes de marcar como pronta');
      return;
    }

    setLoading(true);

    try {
      // Convert base64 to Blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();

      // Save photo to IndexedDB
      const photoId = await savePhoto(blob, selectedPackage.id);
      
      if (!photoId) {
        throw new Error('Falha ao salvar foto no IndexedDB');
      }

      // Update package in IndexedDB
      await db.packages.update(selectedPackage.id, {
        photoId: photoId,
        status: 'pending_notification'
      });

      // Save package to Firestore
      const packageData = {
        tracking_code: selectedPackage.code,
        unit_id: selectedPackage.apartment,
        unit_block: '',
        status: 'pending_notification',
        type: 'comum',
        location: 'setor',
        local_photo_id: photoId,
        created_at: serverTimestamp(),
        retired_at: null,
        retired_by: null,
        signature_base64: null
      };

      await addDoc(collection(firebaseDb, 'packages'), packageData);
      
      alert('Encomenda marcada como pronta! Redirecionando para notificação...');
      
      // Reload packages list
      await loadPackages();
      
      // Reset state
      setSelectedPackage(null);
      setCapturedImage(null);
      
      // Redirect to notification page
      setTimeout(() => {
        navigate('/notification');
      }, 1500);
    } catch (error) {
      console.error('Error marking package as ready:', error);
      alert('Erro ao processar encomenda. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const cancelSelection = () => {
    setSelectedPackage(null);
    setCapturedImage(null);
  };

  // Camera View
  if (showCamera) {
    return (
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
            onClick={() => { setShowCamera(false); }}
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
    );
  }

  // Selected package view
  if (selectedPackage) {
    return (
      <div className="p-4 space-y-4">
        <h2 className="text-2xl font-bold text-gray-800">Triagem - Detalhes</h2>
        
        <div className="card space-y-4">
          <div className="border-b pb-3">
            <p className="text-sm text-gray-600">Código</p>
            <p className="text-lg font-semibold text-gray-800">{selectedPackage.code}</p>
          </div>
          
          <div className="border-b pb-3">
            <p className="text-sm text-gray-600">Apartamento</p>
            <p className="text-lg font-semibold text-blue-600">{selectedPackage.apartment}</p>
          </div>
          
          {selectedPackage.residentName && (
            <div className="border-b pb-3">
              <p className="text-sm text-gray-600">Morador</p>
              <p className="text-lg font-semibold text-gray-800">{selectedPackage.residentName}</p>
            </div>
          )}

          {capturedImage ? (
            <>
              <div className="relative">
                <img src={capturedImage} alt="Encomenda" className="w-full rounded-lg" />
                <button
                  onClick={retakePhoto}
                  className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full shadow-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <button
                onClick={markAsReady}
                disabled={loading}
                className="w-full btn-success disabled:opacity-50"
              >
                <Check size={20} className="inline mr-2" />
                {loading ? 'Processando...' : 'Marcar como Pronta (Na Encomenda)'}
              </button>
            </>
          ) : (
            <>
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
            </>
          )}

          <button onClick={cancelSelection} className="w-full bg-gray-500 text-white font-semibold py-3 px-6 rounded-lg">
            Voltar para Lista
          </button>
        </div>
      </div>
    );
  }

  // Package list view
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Triagem</h2>
      
      {packages.length === 0 ? (
        <div className="card text-center py-12">
          <Package size={64} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg">Nenhuma encomenda aguardando triagem</p>
          <p className="text-gray-500 text-sm mt-2">
            Encomendas do tipo "Comum" aparecerão aqui
          </p>
        </div>
      ) : (
        <>
          <p className="text-gray-600">
            {packages.length} encomenda{packages.length !== 1 ? 's' : ''} aguardando triagem
          </p>
          
          <div className="space-y-3">
            {packages.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => handleSelectPackage(pkg)}
                className="w-full p-4 bg-white border-2 border-gray-200 hover:border-blue-500 rounded-lg text-left transition-all shadow-sm hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 text-lg">
                      Apto {pkg.apartment}
                    </p>
                    {pkg.residentName && (
                      <p className="text-sm text-gray-600">{pkg.residentName}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      Código: {pkg.code}
                    </p>
                  </div>
                  <div className="ml-4">
                    <Package size={32} className="text-blue-600" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Triagem;
