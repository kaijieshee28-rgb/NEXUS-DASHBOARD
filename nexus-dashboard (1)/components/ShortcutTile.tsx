import React, { useState, useRef, useEffect } from 'react';
import { Shortcut } from '../types';
import { Edit2, Trash2, MoreVertical, GripHorizontal } from 'lucide-react';

interface ShortcutTileProps {
  shortcut: Shortcut;
  onDelete: (id: string) => void;
  onEdit: (shortcut: Shortcut) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, targetId: string) => void;
  isDragging?: boolean;
}

export const ShortcutTile: React.FC<ShortcutTileProps> = ({ 
  shortcut, 
  onDelete, 
  onEdit,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging
}) => {
  const [imageError, setImageError] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset error state when shortcut details change
  useEffect(() => {
    setImageError(false);
  }, [shortcut.url, shortcut.iconUrl]);

  // Fallback to first letter
  const fallbackInitial = shortcut.title.charAt(0).toUpperCase();
  
  // Determine display icon URL
  let displayIconUrl = shortcut.iconUrl;
  if (!displayIconUrl) {
    try {
        const domain = new URL(shortcut.url).hostname;
        displayIconUrl = `https://www.google.com/s2/favicons?sz=128&domain_url=${domain}`;
    } catch (e) {
        displayIconUrl = '';
    }
  }
  
  const renderPlaceholder = () => {
      const style = shortcut.color 
        ? { background: `linear-gradient(135deg, ${shortcut.color}40 0%, ${shortcut.color}10 100%)` }
        : { background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)' };

      return (
          <div 
            className="w-full h-full flex items-center justify-center relative overflow-hidden"
            style={style}
          >
              <span className="text-white/90 font-bold text-7xl drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)] z-10 transition-transform duration-700 group-hover:scale-110">
                  {fallbackInitial}
              </span>
              <div className="absolute -bottom-6 -right-6 text-white/5 select-none pointer-events-none transform rotate-[-15deg]">
                 <span className="text-[10rem] font-black">{fallbackInitial}</span>
              </div>
          </div>
      );
  };

  return (
    <div 
        className={`flex flex-col items-center group relative z-10 transition-opacity duration-200 ${isDragging ? 'opacity-30 scale-95' : 'opacity-100'}`} 
        ref={menuRef}
        draggable={draggable}
        onDragStart={(e) => onDragStart && onDragStart(e, shortcut.id)}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop && onDrop(e, shortcut.id)}
    >
        {/* Wrapper handles the lift/scale animation on hover */}
        <div 
            className="relative transition-all duration-300 ease-out group-hover:scale-105 group-hover:-translate-y-3 active:scale-95"
            onClick={() => window.open(shortcut.url, '_blank')}
        >
            {/* Draggable Handle Indicator (Visible on Hover) */}
            {draggable && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-grab active:cursor-grabbing">
                    <GripHorizontal size={20} />
                </div>
            )}

            {/* The App Icon */}
            <div className={`w-[150px] h-[150px] rounded-[35px] overflow-hidden liquid-tile relative cursor-pointer shadow-2xl bg-white/5 group-hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] transition-shadow duration-300 flex items-center justify-center ${isDragging ? 'ring-2 ring-cyan-500/50' : ''}`}>
                
                {displayIconUrl && !imageError ? (
                    <div className="w-full h-full p-8 flex items-center justify-center transition-transform duration-700 group-hover:scale-110 relative z-10">
                        <img 
                            src={displayIconUrl} 
                            alt={shortcut.title} 
                            className="w-full h-full object-contain drop-shadow-xl" 
                            onError={() => setImageError(true)}
                            draggable={false} // Prevent default image drag
                        />
                    </div>
                ) : (
                    renderPlaceholder()
                )}
                
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none opacity-40 rounded-[35px] z-20" />
                <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-b from-white/10 to-transparent rotate-45 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-30" />
                <div className="absolute inset-0 rounded-[35px] border border-white/20 opacity-50 z-20 pointer-events-none"></div>
            </div>

            <div className="absolute -bottom-8 left-6 right-6 h-4 bg-black/60 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0 pointer-events-none"></div>

            {/* Context Menu Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className={`absolute top-2 right-2 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-md border border-white/10 z-50 transition-all duration-200 ${
                showMenu ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              <MoreVertical size={16} />
            </button>

            {/* Context Menu Dropdown */}
            {showMenu && (
              <div className="absolute top-10 right-[-10px] w-32 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl z-[60] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onEdit(shortcut);
                  }}
                  className="w-full flex items-center space-x-2 px-4 py-3 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <Edit2 size={14} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onDelete(shortcut.id);
                  }}
                  className="w-full flex items-center space-x-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors border-t border-white/5"
                >
                  <Trash2 size={14} />
                  <span>Remove</span>
                </button>
              </div>
            )}
        </div>

        <span className="mt-5 text-[15px] font-medium text-white/80 tracking-wide truncate max-w-[140px] text-center drop-shadow-lg group-hover:text-white transition-colors duration-300">
            {shortcut.title}
        </span>
    </div>
  );
};