import React, { useState, useEffect } from 'react';
import { Coordinates, GeoPoint, UTMCoordinates, ViewState } from './types';
import { toUTM, generateKML } from './services/geoService';
import MapComponent from './components/MapComponent';
import PointForm from './components/PointForm';
import { Map, List, Plus, Download, Trash2, MapPin, AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>(ViewState.MAP);
  const [points, setPoints] = useState<GeoPoint[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [currentUTM, setCurrentUTM] = useState<UTMCoordinates | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Load points from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('geoSmartPoints');
    if (saved) {
      setPoints(JSON.parse(saved));
    }
  }, []);

  // Save points to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('geoSmartPoints', JSON.stringify(points));
  }, [points]);

  // Geolocation Tracker
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError("Geolocalización no soportada en este dispositivo.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setGpsError(null);
        const { latitude, longitude, accuracy } = position.coords;
        setCurrentLocation({ latitude, longitude, accuracy });
        setCurrentUTM(toUTM(latitude, longitude));
      },
      (error) => {
        // Log the actual message, not just the object
        const msg = error.message || "Error desconocido de GPS";
        console.error("GPS Error:", msg);
        setGpsError(`Error GPS: ${msg}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const handleSavePoint = (data: Omit<GeoPoint, 'id' | 'timestamp'>) => {
    const newPoint: GeoPoint = {
      ...data,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };
    setPoints(prev => [newPoint, ...prev]);
    setViewState(ViewState.MAP);
  };

  const handleDownloadKML = () => {
    const kmlContent = generateKML(points);
    const blob = new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `levantamiento_${new Date().toISOString().split('T')[0]}.kml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeletePoint = (id: string) => {
    if (confirm("¿Eliminar este punto?")) {
      setPoints(prev => prev.filter(p => p.id !== id));
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 overflow-hidden">
      
      {/* Dynamic Header */}
      {viewState !== ViewState.FORM && (
        <header className="bg-white shadow-sm px-4 py-3 flex justify-between items-center z-10 shrink-0">
          <div className="flex items-center gap-2 text-indigo-700">
            <MapPin className="fill-current" />
            <h1 className="font-bold text-lg tracking-tight">GeoSmart Mapper</h1>
          </div>
          <div className="text-xs font-mono text-gray-500 text-right">
            {currentUTM ? (
              <>
                <div className="font-semibold">Z{currentUTM.zone}{currentUTM.band}</div>
                <div>E:{currentUTM.easting} N:{currentUTM.northing}</div>
              </>
            ) : (
              <span className="flex items-center gap-1 text-orange-500">
                {gpsError ? <AlertTriangle size={12}/> : <span className="animate-pulse w-2 h-2 bg-red-500 rounded-full"></span>}
                {gpsError ? "Sin GPS" : "Buscando..."}
              </span>
            )}
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
        {viewState === ViewState.MAP && (
          <MapComponent points={points} currentLocation={currentLocation} />
        )}

        {viewState === ViewState.LIST && (
          <div className="h-full overflow-y-auto p-4 space-y-3 pb-24">
            {points.length === 0 ? (
              <div className="text-center text-gray-500 mt-10">
                <Map size={48} className="mx-auto mb-2 opacity-30" />
                <p>No hay puntos capturados.</p>
              </div>
            ) : (
              points.map(point => (
                <div key={point.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex gap-3">
                  {point.photoBase64 ? (
                     <img src={point.photoBase64} alt={point.name} className="w-16 h-16 rounded object-cover bg-gray-100" />
                  ) : (
                     <div className="w-16 h-16 rounded bg-indigo-50 flex items-center justify-center text-indigo-300">
                       <MapPin size={24} />
                     </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 truncate">{point.name}</h3>
                    <p className="text-xs text-indigo-600 font-medium">{point.type}</p>
                    <p className="text-xs text-gray-500 mt-1 truncate">{point.utm.easting}, {point.utm.northing}</p>
                  </div>
                  <button 
                    onClick={() => handleDeletePoint(point.id)}
                    className="text-gray-400 hover:text-red-500 self-start p-1"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {viewState === ViewState.FORM && (
          <div className="absolute inset-0 z-20">
             <PointForm 
                currentLocation={currentLocation} 
                currentUTM={currentUTM}
                onSave={handleSavePoint}
                onCancel={() => setViewState(ViewState.MAP)}
             />
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      {viewState !== ViewState.FORM && (
        <nav className="bg-white border-t border-gray-200 px-6 py-2 pb-4 flex justify-between items-center shrink-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button 
            onClick={() => setViewState(ViewState.MAP)}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${viewState === ViewState.MAP ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400'}`}
          >
            <Map size={24} />
            <span className="text-[10px] font-medium mt-1">Mapa</span>
          </button>

          {/* Floating Action Button for Add */}
          <div className="relative -top-6">
            <button 
              onClick={() => setViewState(ViewState.FORM)}
              className="bg-indigo-600 text-white p-4 rounded-full shadow-lg shadow-indigo-200 active:scale-95 transition-transform"
            >
              <Plus size={28} strokeWidth={3} />
            </button>
          </div>

          <div className="flex gap-4">
             <button 
              onClick={() => setViewState(ViewState.LIST)}
              className={`flex flex-col items-center p-2 rounded-lg transition-colors ${viewState === ViewState.LIST ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400'}`}
            >
              <List size={24} />
              <span className="text-[10px] font-medium mt-1">Lista</span>
            </button>
             <button 
              onClick={handleDownloadKML}
              disabled={points.length === 0}
              className={`flex flex-col items-center p-2 rounded-lg transition-colors ${points.length === 0 ? 'text-gray-300' : 'text-gray-400 hover:text-indigo-600'}`}
            >
              <Download size={24} />
              <span className="text-[10px] font-medium mt-1">KML</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};

export default App;