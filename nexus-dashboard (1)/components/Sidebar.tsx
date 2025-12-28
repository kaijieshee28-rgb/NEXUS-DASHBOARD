import React from 'react';
import { ViewMode } from '../types';
import { LayoutGrid, MessageSquareText, Settings, X, Map, Wand2 } from 'lucide-react';

interface SidebarProps {
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, isOpen, onClose }) => {
  const menuItems = [
    { id: ViewMode.DASHBOARD, label: 'Dashboard', icon: LayoutGrid },
    { id: ViewMode.MAPS, label: 'Maps & Route', icon: Map },
    { id: ViewMode.AI_AGENT, label: 'AI Chatbot', icon: MessageSquareText },
    { id: ViewMode.IMAGE_STUDIO, label: 'Magic Canvas', icon: Wand2 },
    { id: ViewMode.SETTINGS, label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-md z-40 md:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar Container */}
      <div 
        className={`fixed md:static inset-y-0 left-0 w-[260px] liquid-glass-heavy z-50 transform transition-transform duration-500 cubic-bezier(0.19, 1, 0.22, 1) flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="pt-8 pb-8 px-6 flex items-center justify-between">
           <div className="flex items-center space-x-3">
                {/* Glassy Logo */}
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-white/20 to-white/5 border border-white/20 flex items-center justify-center shadow-lg backdrop-blur-md">
                    <span className="font-bold text-white text-sm">N</span>
                </div>
                <span className="font-semibold text-lg tracking-tight text-white/90 drop-shadow-sm">Nexus</span>
           </div>
           <button onClick={onClose} className="md:hidden text-white/50 hover:text-white transition-colors">
             <X size={20} />
           </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-2 space-y-2">
          <p className="px-3 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-3">Menu</p>
          {menuItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onViewChange(item.id);
                  onClose();
                }}
                className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-300 group text-sm relative overflow-hidden ${
                  isActive 
                    ? 'text-white font-medium shadow-[0_0_20px_rgba(255,255,255,0.05)]' 
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {/* Active Liquid Background */}
                {isActive && (
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl" />
                )}

                <item.icon 
                  size={18} 
                  className={`relative z-10 transition-colors ${isActive ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(103,232,249,0.5)]' : 'text-white/50 group-hover:text-white/80'}`} 
                />
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Profile - Frosted Card */}
        <div className="p-4 mx-3 mb-6">
           <div className="flex items-center space-x-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all cursor-pointer group shadow-lg">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border border-white/20 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                TR
              </div>
              <div className="flex-1 min-w-0">
                 <p className="text-sm font-medium text-white/90 truncate group-hover:text-white shadow-black">Traveler</p>
                 <p className="text-xs text-white/40 truncate">Pro Account</p>
              </div>
           </div>
        </div>
      </div>
    </>
  );
};