import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { ChatInterface } from './components/ChatInterface';
import { Sidebar } from './components/Sidebar';
import { SettingsView } from './components/SettingsView';
import { MapView } from './components/MapView';
import { ImageStudio } from './components/ImageStudio';
import { ViewMode } from './types';
import { Menu } from 'lucide-react';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Mouse position state for fluid background parallax
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize coordinates to -1 to 1 for parallax calculation
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#050505] flex text-[#f5f5f7] overflow-hidden">
      
      {/* Liquid Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
         
         {/* Deep Indigo Blob - Extreme Parallax */}
         <div 
             className="absolute top-[-20%] left-[-20%] w-[70vw] h-[70vw] transition-transform duration-[2000ms] ease-out will-change-transform"
             style={{ transform: `translate(${mousePos.x * -250}px, ${mousePos.y * -250}px)` }}
         >
             <div className="w-full h-full bg-indigo-800/40 rounded-full mix-blend-screen filter blur-[120px] animate-blob opacity-70"></div>
         </div>

         {/* Cyan Blob - Extreme Parallax */}
         <div 
             className="absolute top-[10%] right-[-20%] w-[60vw] h-[60vw] transition-transform duration-[2500ms] ease-out will-change-transform"
             style={{ transform: `translate(${mousePos.x * 300}px, ${mousePos.y * 300}px)` }}
         >
             <div className="w-full h-full bg-cyan-800/30 rounded-full mix-blend-screen filter blur-[120px] animate-blob-delay opacity-60"></div>
         </div>

         {/* Purple Blob - Extreme Parallax */}
         <div 
             className="absolute bottom-[-30%] left-[10%] w-[60vw] h-[60vw] transition-transform duration-[3000ms] ease-out will-change-transform"
             style={{ transform: `translate(${mousePos.x * -350}px, ${mousePos.y * -200}px)` }}
         >
             <div className="w-full h-full bg-purple-800/40 rounded-full mix-blend-screen filter blur-[140px] animate-blob opacity-70"></div>
         </div>

         {/* Interactive Mouse Glow Spot - High Visibility */}
         <div 
            className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-white/10 rounded-full blur-[100px] pointer-events-none transition-transform duration-[600ms] ease-out -translate-x-1/2 -translate-y-1/2 mix-blend-overlay opacity-60"
            style={{ transform: `translate(calc(-50% + ${mousePos.x * 700}px), calc(-50% + ${mousePos.y * 500}px))` }}
         ></div>

         {/* Noise Overlay */}
         <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48ZmlsdGVyIGlkPSJnoiPjxmZVR1cmJ1bGVuY2UgdHlwZT0iZnJhY3RhbE5vaXNlIiBiYXNlRnJlcXVlbmN5PSIwLjY1IiBudW1PY3RhdmVzPSIzIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI2cpIiBvcGFjaXR5PSIwLjAzIi8+PC9zdmc+')] opacity-20"></div>
      </div>

      {/* Sidebar - z-50 to sit above background */}
      <Sidebar 
        activeView={activeView} 
        onViewChange={setActiveView}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-white/10 bg-black/20 backdrop-blur-xl z-30 sticky top-0">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-white/70 hover:text-white transition-colors"
          >
            <Menu size={24} />
          </button>
          <span className="font-semibold text-white tracking-wide">Nexus</span>
          <div className="w-8"></div>
        </div>

        <main className="flex-1 overflow-y-auto custom-scrollbar relative">
           <div className="max-w-[1600px] mx-auto h-full p-0">
             {activeView === ViewMode.DASHBOARD && (
               <Dashboard onOpenChat={() => setActiveView(ViewMode.AI_AGENT)} />
             )}
             
             {activeView === ViewMode.AI_AGENT && (
               <ChatInterface isFullPage={true} />
             )}

             {activeView === ViewMode.MAPS && (
               <MapView />
             )}

             {activeView === ViewMode.IMAGE_STUDIO && (
               <ImageStudio />
             )}

             {activeView === ViewMode.SETTINGS && (
               <SettingsView />
             )}
           </div>
        </main>
      </div>

    </div>
  );
};

export default App;