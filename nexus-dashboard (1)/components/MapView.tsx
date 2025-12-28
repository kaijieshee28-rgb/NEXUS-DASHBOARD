import React, { useState, useEffect, useRef } from 'react';
import { Map, Navigation, Search, MapPin, AlertTriangle, ArrowRight, Compass, Crosshair, Layers, X, Locate, Car, Footprints, Bus, Bike, Clock, Activity, Flag, History, Trash2 } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

export const MapView: React.FC = () => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ text: string; chunks: any[] } | null>(null);
  const [routeDestination, setRouteDestination] = useState<string | null>(null);
  const [travelMode, setTravelMode] = useState<'driving' | 'walking' | 'transit' | 'bicycling'>('driving');
  const [routeStats, setRouteStats] = useState<{ distance: string; duration: string; traffic: string } | null>(null);
  
  // Recent Searches State
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_map_recents');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setError(null);
        },
        (err) => {
          setError('Unable to retrieve your location. Please enable location services.');
          console.error(err);
        },
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      setError('Geolocation is not supported by this browser.');
    }
  }, []);

  const addRecentSearch = (term: string) => {
      const trimmed = term.trim();
      if (!trimmed) return;
      
      setRecentSearches(prev => {
          const filtered = prev.filter(t => t.toLowerCase() !== trimmed.toLowerCase());
          const newRecents = [trimmed, ...filtered].slice(0, 5);
          localStorage.setItem('nexus_map_recents', JSON.stringify(newRecents));
          return newRecents;
      });
  };

  const handleClearRecents = () => {
      setRecentSearches([]);
      localStorage.removeItem('nexus_map_recents');
  };

  const handleSearch = async (overrideQuery?: string) => {
    const activeQuery = typeof overrideQuery === 'string' ? overrideQuery : query;
    if (!activeQuery.trim() || !location) return;

    if (overrideQuery) {
        setQuery(activeQuery);
    }

    // Save to recents
    addRecentSearch(activeQuery);

    setIsLoading(true);
    setResult(null);
    setRouteDestination(null); // Reset route on new search
    setRouteStats(null);

    try {
      const response = await geminiService.getMapInfo(activeQuery, location.lat, location.lng);
      
      let responseText = response.text || "I found some information.";
      const chunks = response.groundingMetadata?.groundingChunks || [];

      // Parse structured data if present
      // Format: |DISTANCE: [value]|DURATION: [value]|TRAFFIC: [value]|
      const statsRegex = /\|DISTANCE:\s*(.*?)\|DURATION:\s*(.*?)\|TRAFFIC:\s*(.*?)\|/i;
      const match = responseText.match(statsRegex);

      if (match) {
        setRouteStats({
            distance: match[1].trim(),
            duration: match[2].trim(),
            traffic: match[3].trim()
        });
        // Remove the data line from the display text for cleaner UI
        responseText = responseText.replace(statsRegex, '').trim();
      }

      setResult({
        text: responseText,
        chunks: chunks
      });
    } catch (err) {
      setError("Failed to fetch map data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const activateRoute = (destination: string) => {
    setRouteDestination(destination);
  };

  const clearRoute = () => {
    setRouteDestination(null);
    // Note: We intentionally keep routeStats if they exist so the user can still see info
  };

  const getMapUrl = () => {
    if (!location) return '';
    
    if (routeDestination) {
        // Directions Mode
        let modeCode = 'd';
        if (travelMode === 'walking') modeCode = 'w';
        if (travelMode === 'transit') modeCode = 'r';
        if (travelMode === 'bicycling') modeCode = 'b';
        
        return `https://maps.google.com/maps?saddr=${location.lat},${location.lng}&daddr=${encodeURIComponent(routeDestination)}&dirflg=${modeCode}&output=embed`;
    } else {
        // Location Mode
        return `https://maps.google.com/maps?q=${location.lat},${location.lng}&z=15&output=embed`;
    }
  };

  const getTrafficColor = (traffic: string) => {
    const t = traffic.toLowerCase();
    if (t.includes('heavy') || t.includes('congestion') || t.includes('slow') || t.includes('delay')) return 'text-red-400 bg-red-900/20 border-red-500/20';
    if (t.includes('moderate') || t.includes('medium')) return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/20';
    return 'text-emerald-400 bg-emerald-900/20 border-emerald-500/20';
  };

  return (
    <div className="w-full h-full flex flex-col p-4 md:p-8 animate-in fade-in duration-700 h-screen overflow-hidden">
      
      {/* HUD Header */}
      <div className="flex-shrink-0 flex items-center justify-between mb-6 px-2">
        <div>
           <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight drop-shadow-md flex items-center gap-3">
             <Compass className="text-emerald-400 animate-pulse" size={32} />
             Navigation
           </h1>
           <p className="text-white/40 text-xs md:text-sm mt-1 ml-1 font-mono tracking-wider">
             {location ? `LOC: ${location.lat.toFixed(4)}N, ${location.lng.toFixed(4)}E` : 'ACQUIRING SATELLITE LOCK...'}
           </p>
        </div>
        <div className="hidden md:block">
           <div className={`flex items-center space-x-2 text-xs px-3 py-1 rounded-full border transition-colors ${routeDestination ? 'text-blue-400/80 bg-blue-900/20 border-blue-500/20' : 'text-emerald-400/80 bg-emerald-900/20 border-emerald-500/20'}`}>
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${routeDestination ? 'bg-blue-400' : 'bg-emerald-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${routeDestination ? 'bg-blue-500' : 'bg-emerald-500'}`}></span>
              </span>
              <span>{routeDestination ? 'ROUTE ACTIVE' : 'LIVE TRACKING'}</span>
           </div>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden min-h-0">
        
        {/* MAP VISUALIZATION */}
        <div className="flex-1 liquid-glass rounded-3xl overflow-hidden border border-white/10 relative shadow-2xl min-h-[300px] lg:min-h-0 group flex flex-col">
             
             <div className="flex-1 relative w-full h-full isolation-auto">
                {location ? (
                <iframe 
                    key={`${routeDestination}-${travelMode}` || 'default'} // Force re-render on mode change
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Live Map"
                    src={getMapUrl()}
                    className="w-full h-full opacity-80 group-hover:opacity-100 transition-all duration-700 grayscale-[20%] invert-[90%] hue-rotate-180 contrast-[1.1] saturate-[.8] hover:filter-none z-0"
                />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin mb-4"></div>
                        <span className="text-emerald-400/60 font-mono text-xs tracking-widest">CONNECTING TO SATELLITE...</span>
                    </div>
                    </div>
                )}

                {/* Map Overlay UI */}
                <div className="absolute top-4 left-4 pointer-events-none z-10">
                    <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-[10px] text-white/50 font-mono shadow-xl uppercase">
                        {routeDestination ? 'Navigation Mode' : 'Live Feed'}
                    </div>
                </div>

                {/* Route Cancel Button Overlay */}
                {routeDestination && (
                    <div className="absolute top-4 right-4 pointer-events-auto flex flex-col items-end gap-2 z-10">
                        <button 
                            onClick={clearRoute}
                            className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-lg border border-red-500/30 backdrop-blur-md transition-colors flex items-center gap-2 text-xs font-bold shadow-lg"
                        >
                            <X size={14} />
                            EXIT NAV
                        </button>
                    </div>
                )}
                
                {/* Center Reticle Decoration */}
                {!routeDestination && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-20 z-0">
                        <Crosshair size={40} className="text-emerald-400" strokeWidth={1} />
                    </div>
                )}
             </div>

             {/* Travel Mode Controls - only visible when routing */}
             {routeDestination && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 flex gap-1 shadow-2xl z-20">
                    <button 
                        onClick={() => setTravelMode('driving')}
                        className={`p-2.5 rounded-xl transition-all ${travelMode === 'driving' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/50 hover:bg-white/10 hover:text-white'}`}
                        title="Driving"
                    >
                        <Car size={18} />
                    </button>
                    <button 
                        onClick={() => setTravelMode('walking')}
                        className={`p-2.5 rounded-xl transition-all ${travelMode === 'walking' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/50 hover:bg-white/10 hover:text-white'}`}
                        title="Walking"
                    >
                        <Footprints size={18} />
                    </button>
                    <button 
                        onClick={() => setTravelMode('transit')}
                        className={`p-2.5 rounded-xl transition-all ${travelMode === 'transit' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/50 hover:bg-white/10 hover:text-white'}`}
                        title="Transit"
                    >
                        <Bus size={18} />
                    </button>
                    <button 
                        onClick={() => setTravelMode('bicycling')}
                        className={`p-2.5 rounded-xl transition-all ${travelMode === 'bicycling' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/50 hover:bg-white/10 hover:text-white'}`}
                        title="Bicycling"
                    >
                        <Bike size={18} />
                    </button>
                </div>
             )}
        </div>
        
        {/* SIDE PANEL (Results + Input) */}
        <div className="lg:w-[400px] flex flex-col gap-4 min-h-[40%] lg:min-h-0">
            
            {/* Results Output */}
            <div className="flex-1 liquid-glass rounded-3xl p-6 relative overflow-y-auto custom-scrollbar border border-white/10 flex flex-col shadow-xl">
                {!result && !isLoading && !routeStats && (
                    <div className="flex-1 flex flex-col items-center justify-center text-white/20 w-full">
                        {recentSearches.length === 0 ? (
                            <>
                                <Map size={48} strokeWidth={1} className="mb-4 opacity-50" />
                                <p className="text-base font-light text-center">Enter destination to plan route</p>
                                <p className="text-xs text-white/30 mt-2">Try "Nearest coffee shop" or "Route to Home"</p>
                            </>
                        ) : (
                            <div className="w-full h-full pt-2 flex flex-col animate-in fade-in duration-500">
                                 <div className="flex items-center justify-center mb-6 mt-4 opacity-50">
                                    <Map size={32} strokeWidth={1} />
                                 </div>
                                 
                                 <div className="flex items-center justify-between mb-3 px-1">
                                    <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                                        <History size={10} />
                                        Recent Searches
                                    </h3>
                                    <button 
                                        onClick={handleClearRecents}
                                        className="p-1 hover:bg-white/10 rounded-md transition-colors group"
                                        title="Clear History"
                                    >
                                        <Trash2 size={12} className="text-white/30 group-hover:text-red-400 transition-colors" />
                                    </button>
                                 </div>
                                 
                                 <div className="flex flex-col gap-2">
                                    {recentSearches.map((term, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSearch(term)}
                                            className="flex items-center p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all text-left group w-full"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mr-3 text-white/40 group-hover:text-emerald-400 transition-colors flex-shrink-0">
                                                <History size={14} />
                                            </div>
                                            <span className="text-sm text-white/70 group-hover:text-white truncate flex-1">{term}</span>
                                            <ArrowRight size={12} className="text-white/20 group-hover:text-white/60 -translate-x-2 group-hover:translate-x-0 opacity-0 group-hover:opacity-100 transition-all ml-2" />
                                        </button>
                                    ))}
                                 </div>
                            </div>
                        )}
                    </div>
                )}

                {isLoading && (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin mb-3"></div>
                        <p className="text-emerald-400/80 font-mono text-xs animate-pulse">CALCULATING ROUTES...</p>
                    </div>
                )}

                {/* Route Statistics Card */}
                {routeStats && (
                    <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md animate-in slide-in-from-bottom-2 duration-500">
                        <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Flag size={12} /> Trip Summary
                        </h3>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="p-3 rounded-xl bg-black/20 border border-white/5 flex flex-col">
                                <span className="text-white/40 text-xs mb-1 flex items-center gap-1"><Clock size={10}/> Duration</span>
                                <span className="text-white font-medium text-lg">{routeStats.duration}</span>
                            </div>
                            <div className="p-3 rounded-xl bg-black/20 border border-white/5 flex flex-col">
                                <span className="text-white/40 text-xs mb-1 flex items-center gap-1"><MapPin size={10}/> Distance</span>
                                <span className="text-white font-medium text-lg">{routeStats.distance}</span>
                            </div>
                        </div>
                        <div className={`p-3 rounded-xl border flex items-center justify-between ${getTrafficColor(routeStats.traffic)}`}>
                            <div className="flex items-center gap-2">
                                <Activity size={16} />
                                <span className="text-xs font-bold uppercase">Traffic Condition</span>
                            </div>
                            <span className="font-semibold text-sm">{routeStats.traffic}</span>
                        </div>
                    </div>
                )}

                {result && (
                    <div className="space-y-6">
                        {/* Summary / Directions Text */}
                        <div className="prose prose-sm prose-invert prose-emerald max-w-none font-light break-words">
                            <ReactMarkdown>{result.text}</ReactMarkdown>
                        </div>

                        {/* Grounding / Locations Found */}
                        {result.chunks && result.chunks.length > 0 && (
                            <div className="space-y-3 pt-4 border-t border-white/10">
                                <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Locations Found</h3>
                                {result.chunks.map((chunk, idx) => {
                                    const uri = chunk.web?.uri || chunk.maps?.uri;
                                    const title = chunk.web?.title || chunk.maps?.title || "Unknown Location";
                                    
                                    if (!uri && !chunk.maps) return null;

                                    return (
                                        <div 
                                            key={idx} 
                                            className="flex flex-col p-3 rounded-xl bg-white/5 border border-white/5 transition-all group hover:bg-white/10"
                                        >
                                            <div className="flex items-center mb-2">
                                                <div className="w-6 h-6 rounded bg-emerald-500/20 flex items-center justify-center mr-3 text-emerald-400 flex-shrink-0">
                                                    <MapPin size={12} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-white/90 truncate">{title}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2 mt-1">
                                                {/* Navigate Button */}
                                                <button 
                                                    onClick={() => activateRoute(title)}
                                                    className="flex-1 py-1.5 px-3 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <Navigation size={12} />
                                                    Route
                                                </button>
                                                
                                                {/* Open Maps Button */}
                                                {uri && (
                                                    <a 
                                                        href={uri} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="py-1.5 px-3 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg border border-white/10 transition-colors"
                                                        title="Open in Google Maps"
                                                    >
                                                        <ArrowRight size={14} />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Input Control */}
            <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-emerald-500/5 blur-xl rounded-full"></div>
                <div className="relative flex items-center liquid-glass-heavy rounded-2xl p-2 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                    <div className="p-3 text-emerald-400">
                        <Search size={20} />
                    </div>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={location ? "Where to go?" : "Locating..."}
                        disabled={!location || isLoading}
                        className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/30 p-2 font-medium text-sm"
                    />
                    
                    {routeDestination ? (
                         <button 
                            onClick={clearRoute}
                            className="p-3 bg-red-600/80 hover:bg-red-500 text-white rounded-xl transition-colors mr-1"
                            title="Clear Route"
                         >
                            <X size={18} />
                         </button>
                    ) : (
                        <button 
                            onClick={() => {
                                if (location) {
                                    setQuery(''); // Clear query to just re-center
                                    setLocation({...location}); // Trigger re-render of iframe center
                                }
                            }}
                            className="p-3 text-white/40 hover:text-white transition-colors mr-1"
                            title="Center on me"
                        >
                            <Locate size={18} />
                        </button>
                    )}

                    <button 
                        onClick={() => handleSearch()}
                        disabled={!location || !query.trim() || isLoading}
                        className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Navigation size={18} />
                    </button>
                </div>
            </div>
            
            {error && (
                <div className="flex items-center justify-center bg-red-500/20 backdrop-blur-md border border-red-500/30 text-red-200 px-4 py-2 rounded-lg text-xs">
                    <AlertTriangle size={12} className="mr-2" />
                    {error}
                </div>
            )}
        </div>

      </div>
    </div>
  );
};