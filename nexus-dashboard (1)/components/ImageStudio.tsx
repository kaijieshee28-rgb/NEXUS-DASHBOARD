import React, { useState, useRef } from 'react';
import { Upload, Download, Wand2, RefreshCw, Image as ImageIcon, Loader2, Sparkles, X, Gift } from 'lucide-react';
import { geminiService } from '../services/geminiService';

export const ImageStudio: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [originalMimeType, setOriginalMimeType] = useState<string>('image/png');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file');
      return;
    }

    // Reset state
    setGeneratedImage(null);
    setError(null);
    setOriginalMimeType(file.type);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setOriginalImage(result);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!originalImage || !prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      // Extract base64 raw data from Data URL
      const base64Data = originalImage.split(',')[1];
      
      const resultBase64 = await geminiService.editImage(
        base64Data,
        originalMimeType,
        prompt
      );

      if (resultBase64) {
        setGeneratedImage(`data:image/png;base64,${resultBase64}`);
      } else {
        setError("The model didn't return an image. Please try a different prompt.");
      }
    } catch (err) {
      setError("Failed to process image. Ensure your API key has access to Gemini.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `nexus-magic-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearAll = () => {
    setOriginalImage(null);
    setGeneratedImage(null);
    setPrompt('');
    setError(null);
  };

  return (
    <div className="w-full h-full p-6 md:p-12 animate-in fade-in duration-700 flex flex-col max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight drop-shadow-lg flex items-center gap-3">
          <Wand2 className="text-purple-400" size={36} />
          Magic Canvas
        </h1>
        <p className="text-white/40 text-lg flex items-center gap-2">
          Powered by <span className="text-purple-300 font-medium">Gemini 2.5 Flash</span> 
          <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold uppercase tracking-wider flex items-center gap-1">
             <Gift size={10} /> Free Tier
          </span>
        </p>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0">
        
        {/* Left Side: Controls & Original */}
        <div className="flex-1 flex flex-col gap-6">
          
          {/* Prompt Input */}
          <div className="relative">
            <div className="absolute inset-0 bg-purple-500/10 blur-xl rounded-full opacity-50"></div>
            <div className="relative liquid-glass rounded-2xl p-2 border border-purple-500/20 shadow-lg flex items-center">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="E.g., 'Add a neon glow', 'Make it look like a sketch'..."
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/30 p-3 text-sm"
                    disabled={!originalImage || isGenerating}
                />
                <button
                    onClick={handleGenerate}
                    disabled={!originalImage || !prompt.trim() || isGenerating}
                    className={`p-3 rounded-xl transition-all flex items-center gap-2 font-medium text-sm ${
                        !originalImage || !prompt.trim() || isGenerating 
                        ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                    }`}
                >
                    {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                    <span>Generate</span>
                </button>
            </div>
          </div>

          {/* Upload Area */}
          <div className="flex-1 relative group cursor-pointer" onClick={() => !originalImage && fileInputRef.current?.click()}>
             <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
             />
             
             {originalImage ? (
                 <div className="w-full h-full rounded-3xl overflow-hidden liquid-glass border border-white/10 relative">
                     <img src={originalImage} alt="Original" className="w-full h-full object-cover opacity-80" />
                     <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-mono text-white/70 border border-white/10">ORIGINAL</div>
                     
                     <button 
                        onClick={(e) => { e.stopPropagation(); clearAll(); }}
                        className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-red-500/20 text-white/70 hover:text-red-300 rounded-full backdrop-blur-md border border-white/10 transition-colors"
                     >
                        <X size={16} />
                     </button>
                 </div>
             ) : (
                 <div className="w-full h-full min-h-[300px] rounded-3xl border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center gap-4 hover:bg-white/10 transition-colors">
                     <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                         <Upload size={32} className="text-white/30" />
                     </div>
                     <div className="text-center">
                         <p className="text-white font-medium">Click to Upload Image</p>
                         <p className="text-white/40 text-sm mt-1">JPG, PNG supported</p>
                     </div>
                 </div>
             )}
          </div>
        </div>

        {/* Right Side: Result */}
        <div className="flex-1">
             <div className="w-full h-full min-h-[300px] rounded-3xl overflow-hidden liquid-glass border border-white/10 relative flex items-center justify-center bg-black/20">
                {isGenerating ? (
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-400 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Sparkles size={20} className="text-purple-400 animate-pulse" />
                            </div>
                        </div>
                        <p className="text-purple-300/80 font-mono text-xs tracking-widest animate-pulse">APPLYING MAGIC...</p>
                    </div>
                ) : generatedImage ? (
                    <div className="relative w-full h-full group">
                         <img src={generatedImage} alt="Generated" className="w-full h-full object-cover" />
                         <div className="absolute top-4 left-4 bg-purple-600/80 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-mono text-white border border-purple-400/30 shadow-[0_0_15px_rgba(168,85,247,0.3)]">GENERATED</div>
                         
                         <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                             <button 
                                onClick={handleDownload}
                                className="px-6 py-3 bg-white text-black font-semibold rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 transition-transform flex items-center gap-2"
                             >
                                <Download size={18} />
                                Download
                             </button>
                         </div>
                    </div>
                ) : (
                    <div className="text-center opacity-30">
                        <ImageIcon size={64} className="mx-auto mb-4" />
                        <p className="text-lg font-light">Your masterpiece will appear here</p>
                    </div>
                )}
                
                {error && (
                    <div className="absolute bottom-4 left-4 right-4 bg-red-500/20 border border-red-500/30 text-red-200 p-4 rounded-xl text-sm backdrop-blur-md text-center">
                        {error}
                    </div>
                )}
             </div>
        </div>

      </div>
    </div>
  );
};