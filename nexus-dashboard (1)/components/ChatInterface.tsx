import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Bot, RefreshCw, Loader2, User, Lightbulb, Code, Plane, PenTool, Copy, Check, Terminal, Sparkles, Cpu } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { ChatMessage } from '../types';
import ReactMarkdown from 'react-markdown';

interface ChatInterfaceProps {
  isOpen?: boolean;
  onClose?: () => void;
  isFullPage?: boolean;
}

const SUGGESTIONS = [
    { text: "Explain quantum computing", icon: <Lightbulb size={16}/> },
    { text: "Draft a professional email", icon: <PenTool size={16}/> },
    { text: "Plan a trip to Tokyo", icon: <Plane size={16}/> },
    { text: "Write a React component", icon: <Code size={16}/> },
];

// --- Custom Markdown Components ---

const CodeBlock = ({ inline, className, children, ...props }: any) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';

  if (inline) {
    return (
      <code className="bg-white/10 text-cyan-200 px-1.5 py-0.5 rounded text-[0.9em] font-mono border border-white/5" {...props}>
        {children}
      </code>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-6 rounded-xl overflow-hidden border border-white/10 bg-[#0d1117] shadow-xl ring-1 ring-white/5">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-2">
           <Terminal size={12} className="text-white/30" />
           <span className="text-xs text-white/40 font-mono uppercase tracking-wider font-semibold">
             {language || 'Code'}
           </span>
        </div>
        <button
          onClick={handleCopy}
          className="text-xs text-white/40 hover:text-white transition-colors flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-white/5"
          title="Copy code"
        >
          {copied ? (
            <>
                <Check size={12} className="text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
            </>
          ) : (
             <>
                <Copy size={12} />
                <span>Copy</span>
             </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <pre className="p-4 text-sm text-[#e6edf3] font-mono leading-relaxed bg-[#0d1117]" {...props}>
          <code className={className}>
            {children}
          </code>
        </pre>
      </div>
    </div>
  );
};

const MarkdownComponents = {
  h1: ({node, ...props}: any) => <h1 className="text-2xl md:text-3xl font-bold text-white mb-6 mt-8 border-b border-white/10 pb-3" {...props} />,
  h2: ({node, ...props}: any) => <h2 className="text-xl md:text-2xl font-semibold text-white mb-4 mt-8 flex items-center gap-2" {...props} />,
  h3: ({node, ...props}: any) => <h3 className="text-lg md:text-xl font-medium text-cyan-100 mb-3 mt-6" {...props} />,
  h4: ({node, ...props}: any) => <h4 className="text-base font-bold text-white/90 mb-2 mt-4 uppercase tracking-wide" {...props} />,
  p: ({node, ...props}: any) => <p className="mb-4 leading-7 text-gray-100/90 text-[15px] font-light tracking-wide" {...props} />,
  ul: ({node, ...props}: any) => <ul className="list-disc list-outside ml-5 mb-6 space-y-2 marker:text-cyan-400 text-gray-100/90 leading-relaxed" {...props} />,
  ol: ({node, ...props}: any) => <ol className="list-decimal list-outside ml-5 mb-6 space-y-2 marker:text-cyan-400 text-gray-100/90 leading-relaxed" {...props} />,
  li: ({node, ...props}: any) => <li className="pl-1" {...props} />,
  a: ({node, ...props}: any) => <a className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 decoration-cyan-500/30 hover:decoration-cyan-300 transition-all font-medium" target="_blank" rel="noopener noreferrer" {...props} />,
  blockquote: ({node, ...props}: any) => (
      <blockquote className="relative pl-6 py-2 my-6 border-l-2 border-cyan-500/50 bg-gradient-to-r from-cyan-500/5 to-transparent rounded-r-lg italic text-white/80">
          <span className="absolute left-0 top-0 text-cyan-500/20 text-4xl leading-none -ml-2 -mt-2">"</span>
          <div {...props} />
      </blockquote>
  ),
  code: CodeBlock,
  table: ({node, ...props}: any) => <div className="overflow-x-auto my-6 rounded-xl border border-white/10 shadow-lg"><table className="w-full text-left border-collapse bg-white/5" {...props} /></div>,
  thead: ({node, ...props}: any) => <thead className="bg-white/5 border-b border-white/10" {...props} />,
  th: ({node, ...props}: any) => <th className="p-4 font-semibold text-white text-sm uppercase tracking-wider" {...props} />,
  td: ({node, ...props}: any) => <td className="p-4 border-b border-white/5 text-sm text-white/80" {...props} />,
  hr: ({node, ...props}: any) => <hr className="my-8 border-white/10" {...props} />,
  img: ({node, ...props}: any) => <img className="rounded-xl border border-white/10 my-4 shadow-lg max-h-[400px] object-cover" {...props} />,
};

// --- Main Component ---

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ isOpen = true, onClose, isFullPage = false }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hello! I'm Nexus. How can I assist you today?",
      timestamp: new Date(),
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if ((isOpen || isFullPage) && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isFullPage]);

  const handleSendMessage = async (text: string = input) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const modelMessageId = (Date.now() + 1).toString();
    setMessages(prev => [
      ...prev,
      {
        id: modelMessageId,
        role: 'model',
        text: '', 
        timestamp: new Date(),
      }
    ]);

    try {
      let fullText = '';
      const stream = geminiService.sendMessageStream(userMessage.text);
      
      for await (const chunk of stream) {
        fullText += chunk;
        setMessages(prev => 
          prev.map(msg => 
            msg.id === modelMessageId 
              ? { ...msg, text: fullText } 
              : msg
          )
        );
      }
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'model',
          text: "I encountered a connection issue. Please check your API key and internet connection.",
          timestamp: new Date(),
          isError: true
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getModelDisplay = () => {
    const id = geminiService.getModelVersion();
    if (id.includes('flash')) return 'Gemini 3 Flash';
    if (id.includes('pro')) return 'Gemini 3 Pro';
    return 'Gemini AI';
  };

  return (
    <div className="flex flex-col h-full w-full bg-transparent max-w-5xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between p-8 bg-transparent z-10">
        <div className="flex flex-col">
           <h2 className="text-3xl font-semibold text-white tracking-tight drop-shadow-md">AI Chatbot</h2>
           <div className="flex items-center space-x-3 mt-2">
             <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
               <Cpu size={14} className="text-cyan-400" />
               <span className="text-sm font-medium text-cyan-100">
                 {getModelDisplay()}
               </span>
             </div>
             <span className="text-[10px] text-white/30 font-mono">
               v.{geminiService.getModelVersion()}
             </span>
           </div>
        </div>
        <button 
           onClick={() => {
              geminiService.resetChat();
              setMessages([{
                  id: Date.now().toString(),
                  role: 'model',
                  text: "Hello! I'm Nexus. How can I assist you today?",
                  timestamp: new Date(),
              }]);
           }}
           className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors backdrop-blur-sm border border-white/5 shadow-lg group"
           title="New Chat"
        >
           <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 md:px-8 pb-6 space-y-8 z-10">
        
        {/* Welcome Suggestions - Show only when there is just 1 message (Welcome) */}
        {messages.length === 1 && (
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 mb-12 opacity-80 animate-in slide-in-from-bottom-4 duration-700">
                {SUGGESTIONS.map((s, i) => (
                    <button 
                        key={i}
                        onClick={() => handleSendMessage(s.text)}
                        className="flex items-center p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-left group"
                    >
                        <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center mr-4 text-cyan-400 group-hover:scale-110 transition-transform">
                            {s.icon}
                        </div>
                        <span className="text-white/80 text-sm font-medium">{s.text}</span>
                    </button>
                ))}
            </div>
        )}

        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'model' && (
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center mr-4 mt-1 flex-shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.5)] border border-white/20">
                    <Bot size={20} className="text-white" />
                </div>
            )}
            
            <div className={`max-w-[85%] md:max-w-[80%] rounded-[24px] px-6 py-5 shadow-2xl backdrop-blur-md border overflow-hidden transition-all ${
              msg.role === 'user' 
                ? 'bg-gradient-to-br from-blue-600/90 to-indigo-600/90 text-white rounded-br-sm border-white/20 shadow-blue-900/30' 
                : 'bg-[#1a1a20]/80 text-[#f5f5f7] rounded-bl-sm border-white/10 shadow-black/20'
            }`}>
              {msg.isError ? (
                <p className="text-red-400 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-400 inline-block"/> {msg.text}</p>
              ) : (
                <div className="w-full">
                   <ReactMarkdown components={MarkdownComponents as any}>{msg.text}</ReactMarkdown>
                </div>
              )}
            </div>

            {msg.role === 'user' && (
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center ml-4 mt-1 flex-shrink-0 border border-white/10">
                    <User size={20} className="text-white/70" />
                </div>
            )}
          </div>
        ))}
        
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
           <div className="flex justify-start w-full animate-in fade-in duration-300">
             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center mr-4 mt-1 shadow-[0_0_15px_rgba(6,182,212,0.5)] border border-white/20">
                <Bot size={20} className="text-white" />
             </div>
             <div className="bg-white/5 border border-white/10 rounded-[24px] rounded-bl-sm px-6 py-4 flex items-center space-x-3 backdrop-blur-md">
                <Loader2 size={18} className="animate-spin text-cyan-400" />
                <span className="text-white/40 text-sm font-medium animate-pulse">Thinking...</span>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-8 pt-2 bg-transparent z-20">
        <div className="relative flex items-center liquid-glass rounded-[32px] transition-all hover:bg-white/5 focus-within:bg-black/30 shadow-2xl group border border-white/10 focus-within:border-cyan-500/30">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 bg-transparent text-white pl-8 py-5 outline-none placeholder-white/30 text-[16px] font-light"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isLoading}
            className={`p-2 m-2 rounded-full transition-all flex items-center justify-center w-10 h-10 ${
              input.trim() && !isLoading 
                ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:scale-110' 
                : 'bg-white/5 text-white/20 cursor-not-allowed'
            }`}
          >
            <ArrowUp size={20} strokeWidth={2.5} />
          </button>
        </div>
        <p className="text-center text-xs text-white/20 mt-4 font-medium tracking-wide">Nexus Chatbot can make mistakes. Please verify important information.</p>
      </div>
    </div>
  );
};