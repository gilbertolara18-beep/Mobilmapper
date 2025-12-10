import React, { useState, useRef } from 'react';
import { GeoPoint, POINT_TYPES, UTMCoordinates, Coordinates } from '../types';
import { Camera, Save, X, Sparkles, Loader2, MapPin } from 'lucide-react';
import { analyzeSiteImage } from '../services/geminiService';

interface PointFormProps {
  currentLocation: Coordinates | null;
  currentUTM: UTMCoordinates | null;
  onSave: (point: Omit<GeoPoint, 'id' | 'timestamp'>) => void;
  onCancel: () => void;
}

const PointForm: React.FC<PointFormProps> = ({ currentLocation, currentUTM, onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState(POINT_TYPES[0]);
  const [characteristics, setCharacteristics] = useState('');
  const [observations, setObservations] = useState('');
  const [photoBase64, setPhotoBase64] = useState<string | undefined>(undefined);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPhotoBase64(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAIAnalysis = async () => {
    if (!photoBase64) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeSiteImage(photoBase64);
      setName(result.suggestedName);
      if (POINT_TYPES.includes(result.detectedType)) {
        setType(result.detectedType);
      } else {
        setType('Otro');
      }
      setCharacteristics(result.characteristics);
      setObservations(result.observations);
    } catch (error) {
      alert("Error analizando imagen. Intenta nuevamente.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLocation || !currentUTM) {
      alert("Esperando señal GPS...");
      return;
    }
    onSave({
      name,
      type,
      characteristics,
      observations,
      coords: currentLocation,
      utm: currentUTM,
      photoBase64
    });
  };

  if (!currentLocation || !currentUTM) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center text-gray-500">
        <Loader2 className="animate-spin mb-2 text-indigo-600" size={32} />
        <p>Obteniendo señal GPS precisa...</p>
      </div>
    );
  }

  return (
    <div className="bg-white h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-indigo-600 text-white shrink-0">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <MapPin size={20} /> Nuevo Punto
        </h2>
        <button onClick={onCancel} className="p-2 hover:bg-indigo-700 rounded-full">
          <X size={20} />
        </button>
      </div>

      {/* Scrollable Form Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-20">
        
        {/* Coordinates Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 grid grid-cols-2 gap-2">
          <div>
            <span className="font-bold block text-indigo-600">UTM Este (X)</span>
            {currentUTM.easting}
          </div>
          <div>
            <span className="font-bold block text-indigo-600">UTM Norte (Y)</span>
            {currentUTM.northing}
          </div>
          <div>
            <span className="font-bold block text-indigo-600">Zona</span>
            {currentUTM.zone}{currentUTM.band}
          </div>
          <div>
            <span className="font-bold block text-indigo-600">Precisión</span>
            ±{Math.round(currentLocation.accuracy)}m
          </div>
        </div>

        {/* Photo Section */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Fotografía del sitio</label>
          <input 
            type="file" 
            accept="image/*" 
            capture="environment"
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
          />
          
          {!photoBase64 ? (
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <Camera size={32} className="mb-2 text-indigo-400" />
              <span>Tomar Foto</span>
            </button>
          ) : (
            <div className="relative rounded-lg overflow-hidden border border-gray-200">
              <img src={photoBase64} alt="Preview" className="w-full h-48 object-cover" />
              <button 
                type="button"
                onClick={() => setPhotoBase64(undefined)}
                className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full"
              >
                <X size={16} />
              </button>
              
              {/* AI Button */}
              <button
                type="button"
                onClick={handleAIAnalysis}
                disabled={isAnalyzing}
                className="absolute bottom-2 right-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg flex items-center gap-1.5 disabled:opacity-70"
              >
                {isAnalyzing ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <Sparkles size={14} />
                )}
                {isAnalyzing ? "Analizando..." : "Autocompletar con IA"}
              </button>
            </div>
          )}
        </div>

        <form id="point-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre del Punto</label>
            <input 
              required 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)}
              placeholder="Ej. Poste 245"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo</label>
            <select 
              value={type} 
              onChange={e => setType(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
            >
              {POINT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Características</label>
            <textarea 
              rows={2} 
              value={characteristics}
              onChange={e => setCharacteristics(e.target.value)}
              placeholder="Ej. Concreto, buen estado..."
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Observaciones</label>
            <textarea 
              rows={2} 
              value={observations}
              onChange={e => setObservations(e.target.value)}
              placeholder="Ej. Acceso difícil por maleza..."
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </form>
      </div>

      {/* Footer / Actions */}
      <div className="p-4 border-t bg-gray-50 shrink-0">
        <button 
          type="submit" 
          form="point-form"
          className="w-full flex justify-center items-center gap-2 bg-indigo-600 text-white py-3 px-4 rounded-lg font-bold shadow-md active:bg-indigo-700 transition-colors"
        >
          <Save size={20} /> Guardar Punto
        </button>
      </div>
    </div>
  );
};

export default PointForm;