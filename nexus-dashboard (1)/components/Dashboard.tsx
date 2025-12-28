import React, { useState, useEffect } from 'react';
import { ShortcutTile } from './ShortcutTile';
import { Shortcut } from '../types';
import { DEFAULT_SHORTCUTS } from '../constants';
import { Plus, X, AlertTriangle, Globe, Link as LinkIcon, Image as ImageIcon, Search, MessageSquare, Sparkles, Loader2, Wand2 } from 'lucide-react';
import { geminiService } from '../services/geminiService';

interface DashboardProps {
  onOpenChat: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenChat }) => {
  // Load shortcuts from local storage or defaults
  const [shortcuts, setShortcuts] = useState<Shortcut[]>(() => {
    const saved = localStorage.getItem('nexus_shortcuts');
    return saved ? JSON.parse(saved) : DEFAULT_SHORTCUTS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCurateModal, setShowCurateModal] = useState(false);
  
  // Drag and Drop State
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  
  // State for delete confirmation
  const [shortcutToDelete, setShortcutToDelete] = useState<string | null>(null);
  
  // Form State
  const [newShortcut, setNewShortcut] = useState<Partial<Shortcut>>({ title: '', url: '', iconUrl: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Preview state for image error handling
  const [previewError, setPreviewError] = useState(false);

  // AI Curation State
  const [isCurating, setIsCurating] = useState(false);
  const [curatePrompt, setCuratePrompt] = useState('');

  useEffect(() => {
    localStorage.setItem('nexus_shortcuts', JSON.stringify(shortcuts));
  }, [shortcuts]);

  // Reset preview error when url or iconUrl changes
  useEffect(() => {
    setPreviewError(false);
  }, [newShortcut.url, newShortcut.iconUrl]);

  // --- Search Logic ---
  const filteredShortcuts = shortcuts.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- Drag and Drop Logic ---
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItemId(id);
    // Needed for Firefox
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    
    if (!draggedItemId || draggedItemId === targetId) {
        setDraggedItemId(null);
        return;
    }

    const sourceIndex = shortcuts.findIndex(s => s.id === draggedItemId);
    const targetIndex = shortcuts.findIndex(s => s.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1) {
        setDraggedItemId(null);
        return;
    }

    // Reorder array
    const newShortcuts = [...shortcuts];
    const [movedItem] = newShortcuts.splice(sourceIndex, 1);
    newShortcuts.splice(targetIndex, 0, movedItem);

    setShortcuts(newShortcuts);
    setDraggedItemId(null);
  };

  // --- AI Curation Logic ---
  const executeCuration = async () => {
    if (isCurating) return;
    setIsCurating(true);
    setShowCurateModal(false); // Close modal while working
    
    try {
      const currentTitles = shortcuts.map(s => s.title);
      const suggestions = await geminiService.generateSmartShortcuts(currentTitles, curatePrompt);
      
      if (suggestions && suggestions.length > 0) {
        const newItems: Shortcut[] = suggestions.map((item: any) => ({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          title: item.title,
          url: item.url,
          color: item.color,
          // Let the tile component handle the fallback icon via google favicon service
          iconUrl: `https://www.google.com/s2/favicons?sz=256&domain_url=${new URL(item.url).hostname}`
        }));
        
        setShortcuts(prev => [...prev, ...newItems]);
      }
    } catch (e) {
      console.error("Curation failed", e);
    } finally {
      setIsCurating(false);
      setCuratePrompt('');
    }
  };

  // --- CRUD Logic ---

  const handleDeleteRequest = (id: string) => {
    setShortcutToDelete(id);
  };

  const confirmDelete = () => {
    if (shortcutToDelete) {
      setShortcuts(prev => prev.filter(s => s.id !== shortcutToDelete));
      setShortcutToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShortcutToDelete(null);
  };

  const handleEdit = (shortcut: Shortcut) => {
    setNewShortcut({ ...shortcut });
    setEditingId(shortcut.id);
    setShowAddModal(true);
  };

  const handleSaveShortcut = () => {
    if (!newShortcut.title || !newShortcut.url) return;

    let processedUrl = newShortcut.url;
    if (!/^https?:\/\//i.test(processedUrl)) {
        processedUrl = 'https://' + processedUrl;
    }

    let icon = newShortcut.iconUrl;
    if (!icon) {
        try {
            const domain = new URL(processedUrl).hostname;
            icon = `https://www.google.com/s2/favicons?sz=256&domain_url=${domain}`;
        } catch (e) {}
    }

    if (editingId) {
        setShortcuts(prev => prev.map(s => s.id === editingId ? { ...s, ...newShortcut, url: processedUrl, iconUrl: icon } as Shortcut : s));
    } else {
        const newItem: Shortcut = {
            id: Date.now().toString(),
            title: newShortcut.title,
            url: processedUrl,
            iconUrl: icon
        };
        setShortcuts(prev => [...prev, newItem]);
    }
    closeModal();
  };

  const closeModal = () => {
    setShowAddModal(false);
    setNewShortcut({ title: '', url: '', iconUrl: '' });
    setEditingId(null);
    setPreviewError(false);
  };

  const getPreviewIconUrl = () => {
    if (newShortcut.iconUrl) return newShortcut.iconUrl;
    if (!newShortcut.url) return '';
    try {
        let url = newShortcut.url;
        if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
        const domain = new URL(url).hostname;
        return `https://www.google.com/s2/favicons?sz=128&domain_url=${domain}`;
    } catch {
        return '';
    }
  };

  const previewUrl = getPreviewIconUrl();

  return (
    <div className="w-full max-w-[1400px] mx-auto px-6 md:px-12 py-12 flex flex-col items-center animate-in fade-in zoom-in-95 duration-1000 ease-out h-full">
      
      {/* Header Area */}
      <div className="w-full flex flex-col items-center justify-center mb-8 mt-4 z-10">
        <h1 className="text-4xl md:text-6xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 tracking-tight drop-shadow-2xl pb-2">
          Good Morning
        </h1>
        <p className="text-white/40 text-lg mt-2 font-light">Your daily dashboard</p>
      </div>

      {/* Management Controls (Search & Add) */}
      <div className="w-full max-w-[1000px] z-10 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Search Bar */}
          <div className="relative w-full md:w-auto md:min-w-[400px] group">
              <div className="absolute inset-0 bg-white/5 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative flex items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus-within:bg-black/40 focus-within:border-white/20 transition-all backdrop-blur-md">
                <Search size={18} className="text-white/40 mr-3" />
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search shortcuts..." 
                    className="bg-transparent border-none outline-none text-white text-sm placeholder-white/30 w-full"
                />
                {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="p-1 rounded-full hover:bg-white/10 text-white/40">
                        <X size={14} />
                    </button>
                )}
              </div>
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
               {/* AI Curator Button */}
               <button 
                  onClick={() => setShowCurateModal(true)}
                  disabled={isCurating || !!searchQuery}
                  className={`flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30 hover:border-purple-400/50 rounded-2xl text-sm font-medium transition-all backdrop-blur-md shadow-[0_0_15px_rgba(168,85,247,0.1)] whitespace-nowrap group relative overflow-hidden ${isCurating || searchQuery ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-[0_0_25px_rgba(168,85,247,0.3)]'}`}
               >
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:animate-shimmer" />
                   {isCurating ? (
                      <Loader2 size={18} className="animate-spin text-purple-300" />
                   ) : (
                      <Sparkles size={18} className="text-purple-300 group-hover:text-purple-100 transition-colors" />
                   )}
                   <span className="text-purple-100 group-hover:text-white">{isCurating ? 'Curating...' : 'AI Curate'}</span>
               </button>

               {/* Add Button */}
               <button 
                  onClick={() => {
                      setNewShortcut({ title: '', url: '', iconUrl: '' });
                      setEditingId(null);
                      setShowAddModal(true);
                  }}
                  className="flex items-center space-x-2 px-5 py-3 text-cyan-200 hover:text-white bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-2xl text-sm font-medium transition-all backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.1)] whitespace-nowrap"
               >
                   <Plus size={18} />
                   <span>Add Shortcut</span>
               </button>
          </div>
      </div>

      {/* Shortcuts Grid */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8 md:gap-12 z-10 perspective-[1000px] max-w-[1000px] pb-20">
        
        {/* Render filtered shortcuts */}
        {filteredShortcuts.map((shortcut) => (
          <ShortcutTile 
            key={shortcut.id} 
            shortcut={shortcut} 
            onDelete={handleDeleteRequest}
            onEdit={handleEdit}
            draggable={!searchQuery} // Disable drag when filtering
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            isDragging={draggedItemId === shortcut.id}
          />
        ))}

        {/* Empty Search State */}
        {filteredShortcuts.length === 0 && searchQuery && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md">
                <Search size={48} className="text-white/20 mb-4" />
                <p className="text-white/50 text-lg mb-4">No shortcuts found for "{searchQuery}"</p>
                <button 
                    onClick={onOpenChat}
                    className="flex items-center space-x-2 px-6 py-3 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/30 rounded-2xl text-indigo-100 transition-all"
                >
                    <MessageSquare size={18} />
                    <span>Ask AI to find it</span>
                </button>
            </div>
        )}
        
        {/* Large Add Button Tile (Only show when not searching or if query matches 'add') */}
        {!searchQuery && (
            <div 
                onClick={() => setShowAddModal(true)}
                className="flex flex-col items-center justify-start group cursor-pointer relative z-10"
            >
                <div className="relative transition-all duration-300 ease-out group-hover:scale-105 group-hover:-translate-y-3">
                    <div className="w-[150px] h-[150px] rounded-[35px] bg-white/5 border border-white/10 flex items-center justify-center text-white/20 group-hover:text-white group-hover:bg-white/10 transition-all duration-300 shadow-lg backdrop-blur-sm group-hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] relative z-20 overflow-hidden">
                        <Plus size={48} strokeWidth={1} className="relative z-10" />
                    </div>
                    
                    <div className="absolute -bottom-8 left-6 right-6 h-4 bg-black/60 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0 pointer-events-none"></div>
                </div>
                
                <span className="mt-5 text-sm font-medium text-white/30 group-hover:text-white/60 transition-colors tracking-wide duration-300">Add Shortcut</span>
            </div>
        )}
      </div>

      {/* Curation Modal */}
      {showCurateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-lg animate-in fade-in duration-300">
            <div className="liquid-glass w-full max-w-[420px] p-8 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] scale-100 border border-white/20 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-50"></div>
                
                <div className="flex flex-col items-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center mb-4 shadow-lg shadow-purple-900/20">
                        <Sparkles className="text-purple-300" size={28} />
                    </div>
                    <h3 className="text-xl font-semibold text-white tracking-tight text-center">AI Tool Discovery</h3>
                    <p className="text-white/50 text-sm mt-2 text-center">Let Gemini find the perfect tools for your workflow.</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 ml-1">What do you need?</label>
                        <textarea
                            value={curatePrompt}
                            onChange={(e) => setCuratePrompt(e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 text-white focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 focus:outline-none transition-all placeholder-white/20 text-sm shadow-inner min-h-[100px] resize-none"
                            placeholder="e.g. I need PDF editing tools, or I want to learn Spanish..."
                        />
                    </div>
                </div>

                <div className="mt-8 flex flex-col gap-3">
                    <button 
                        onClick={executeCuration}
                        disabled={!curatePrompt.trim()}
                        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all shadow-lg border border-white/10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Wand2 size={16} />
                        Find specific tools
                    </button>
                    
                    <button 
                        onClick={executeCuration}
                        className="w-full py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-sm font-medium border border-white/10 transition-colors flex items-center justify-center gap-2"
                    >
                        <Sparkles size={16} className="text-purple-300" />
                        Auto-discover (Surprise me)
                    </button>
                    
                    <button 
                        onClick={() => setShowCurateModal(false)}
                        className="mt-2 text-xs text-white/40 hover:text-white/60 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-lg animate-in fade-in duration-300">
            <div className="liquid-glass w-full max-w-[420px] p-8 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] scale-100 border border-white/20 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50"></div>
                
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-semibold text-white tracking-tight">{editingId ? 'Edit Shortcut' : 'Add Shortcut'}</h3>
                    <button onClick={closeModal} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>
                
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 ml-1">Name</label>
                        <input 
                            type="text" 
                            value={newShortcut.title}
                            onChange={(e) => setNewShortcut({...newShortcut, title: e.target.value})}
                            className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 text-white focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 focus:outline-none transition-all placeholder-white/20 text-sm shadow-inner"
                            placeholder="e.g. YouTube"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 ml-1">URL</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={newShortcut.url}
                                onChange={(e) => setNewShortcut({...newShortcut, url: e.target.value})}
                                className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 pl-10 text-white focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 focus:outline-none transition-all placeholder-white/20 text-sm shadow-inner"
                                placeholder="youtube.com"
                            />
                            <LinkIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 ml-1">Icon URL (Optional)</label>
                        <div className="flex gap-4 items-center">
                            <div className="flex-1 relative">
                                <input 
                                    type="text" 
                                    value={newShortcut.iconUrl || ''}
                                    onChange={(e) => setNewShortcut({...newShortcut, iconUrl: e.target.value})}
                                    className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 pl-10 text-white focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 focus:outline-none transition-all placeholder-white/20 text-sm shadow-inner"
                                    placeholder="https://..."
                                />
                                <ImageIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                            </div>
                            
                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-lg backdrop-blur-md">
                                {previewUrl && !previewError ? (
                                    <img 
                                        src={previewUrl} 
                                        alt="Preview" 
                                        className="w-8 h-8 object-contain opacity-90 transition-opacity duration-300"
                                        onError={() => setPreviewError(true)}
                                    />
                                ) : (
                                    <Globe size={20} className="text-white/20" />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-10 flex justify-end space-x-4">
                    <button 
                        onClick={closeModal}
                        className="px-6 py-3 rounded-2xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSaveShortcut}
                        disabled={!newShortcut.title || !newShortcut.url}
                        className={`px-8 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all shadow-lg border border-white/10 ${(!newShortcut.title || !newShortcut.url) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {shortcutToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-lg animate-in fade-in duration-300">
            <div className="liquid-glass w-full max-w-[400px] p-8 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] scale-100 border border-white/20 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent opacity-50"></div>
                
                <div className="flex flex-col items-center mb-6">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/20">
                        <AlertTriangle className="text-red-400" size={24} />
                    </div>
                    <h3 className="text-xl font-semibold text-white tracking-tight text-center">Delete Shortcut?</h3>
                </div>
                
                <p className="text-center text-white/60 mb-8 text-sm leading-relaxed">
                  Are you sure you want to remove this shortcut from your dashboard? This action cannot be undone.
                </p>

                <div className="flex justify-center space-x-4">
                    <button 
                        onClick={cancelDelete}
                        className="px-6 py-3 rounded-2xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={confirmDelete}
                        className="px-8 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-red-900 text-white text-sm font-semibold hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all shadow-lg border border-white/10"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};