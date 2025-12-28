import React from 'react';
import { ChevronRight, Moon, User, Shield, Bell, Smartphone } from 'lucide-react';

export const SettingsView: React.FC = () => {
  return (
    <div className="w-full max-w-3xl mx-auto p-6 md:p-12 animate-in fade-in duration-700 slide-in-from-bottom-4">
      <h1 className="text-4xl font-bold text-white mb-10 tracking-tight drop-shadow-lg">Settings</h1>
      
      {/* Account Group */}
      <div className="liquid-glass rounded-3xl overflow-hidden mb-10 group transition-transform duration-300 hover:scale-[1.01]">
         <div className="flex items-center p-5 hover:bg-white/5 transition-colors cursor-pointer">
             <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-white/20 flex items-center justify-center text-2xl text-white font-bold mr-6 shadow-lg">TR</div>
             <div className="flex-1">
                 <h3 className="text-xl font-semibold text-white mb-1">Traveler</h3>
                 <p className="text-sm text-white/50">Apple ID, iCloud, Media & Purchases</p>
             </div>
             <ChevronRight className="text-white/30" size={24} />
         </div>
      </div>

      {/* General Group */}
      <h2 className="text-xs font-bold text-white/40 uppercase tracking-[0.2em] mb-4 ml-6 shadow-black">General</h2>
      <div className="liquid-glass rounded-3xl overflow-hidden mb-10 divide-y divide-white/5">
          <SettingItem icon={Moon} label="Appearance" value="Dark" color="bg-blue-500" />
          <SettingItem icon={Bell} label="Notifications" color="bg-red-500" />
          <SettingItem icon={Smartphone} label="Display" color="bg-green-500" />
      </div>

      {/* Privacy Group */}
      <h2 className="text-xs font-bold text-white/40 uppercase tracking-[0.2em] mb-4 ml-6 shadow-black">Privacy & Security</h2>
      <div className="liquid-glass rounded-3xl overflow-hidden mb-10 divide-y divide-white/5">
          <SettingItem icon={Shield} label="Privacy" color="bg-indigo-500" />
          <SettingItem icon={User} label="API Key Configuration" value="Configured" color="bg-gray-500" />
      </div>
    </div>
  );
};

const SettingItem: React.FC<{ icon: any, label: string, value?: string, color: string }> = ({ icon: Icon, label, value, color }) => (
    <div className="flex items-center justify-between p-4 pl-6 hover:bg-white/5 transition-colors cursor-pointer group">
        <div className="flex items-center">
            <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center mr-4 shadow-lg border border-white/10 group-hover:scale-110 transition-transform`}>
                <Icon size={18} className="text-white" />
            </div>
            <span className="text-[16px] font-medium text-white/90">{label}</span>
        </div>
        <div className="flex items-center">
            {value && <span className="text-[15px] text-white/40 mr-3">{value}</span>}
            <ChevronRight className="text-white/20" size={18} />
        </div>
    </div>
);