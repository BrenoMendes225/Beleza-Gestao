import React, { useState, useEffect } from 'react';
import { 
  User, 
  Moon, 
  Sun, 
  LogOut, 
  ChevronRight, 
  Bell, 
  Shield, 
  Share2,
  Calendar,
  Clock,
  MapPin,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { User as AuthUser } from '@supabase/supabase-js';

interface SettingsScreenProps {
  user: AuthUser;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onLogout: () => void;
  salonName: string;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ 
  user, 
  isDarkMode, 
  toggleDarkMode, 
  onLogout,
  salonName 
}) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(localStorage.getItem('biometric_enabled') === 'true');

  const toggleBiometric = () => {
    const newValue = !biometricEnabled;
    setBiometricEnabled(newValue);
    localStorage.setItem('biometric_enabled', String(newValue));
  };

  useEffect(() => {
    supabase.from('profiles').select('*').eq('id', user.id).single()
      .then(({ data }) => setProfile(data));
  }, [user.id]);

  const updateProfile = async (field: string, value: any) => {
    setLoading(true);
    const { error } = await supabase.from('profiles').update({ [field]: value }).eq('id', user.id);
    if (!error) setProfile({ ...profile, [field]: value });
    setLoading(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await updateProfile('avatar_url', publicUrl);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const menuGroups = [
    {
      title: 'Negócio',
      items: [
        { id: 'salon', label: 'Nome do Salão', value: profile?.salon_name || salonName, icon: MapPin },
        { id: 'hours', label: 'Horário de Funcionamento', value: 'Ver detalhes', icon: Clock },
        { id: 'bookings', label: 'Link de Agendamento', value: 'booking.com/meu-salao', icon: Share2 },
      ]
    },
    {
      title: 'App',
      items: [
        { id: 'theme', label: 'Modo Escuro', value: isDarkMode ? 'Ativado' : 'Desativado', icon: isDarkMode ? Moon : Sun, action: toggleDarkMode },
        { id: 'biometric', label: 'Face ID / Biometria', value: biometricEnabled ? 'Ativado' : 'Desativado', icon: Shield, action: toggleBiometric },
        { id: 'notifs', label: 'Notificações', value: 'Ativado', icon: Bell },
      ]
    }
  ];

  return (
    <div className="pb-24">
      <div className="p-6 md:p-8">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8">Ajustes</h2>

        {/* Profile Section */}
        <div className="bg-white dark:bg-surface-dark p-6 rounded-[32px] border border-slate-100 dark:border-border-dark mb-8 flex flex-col md:flex-row items-center gap-6 group transition-colors shadow-sm">
          <div className="relative">
            <div className="size-24 rounded-3xl bg-slate-50 dark:bg-background-dark border-2 border-primary overflow-hidden flex items-center justify-center">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={40} className="text-slate-300" />
              )}
            </div>
            <label className="absolute -bottom-2 -right-2 size-8 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg border-2 border-white dark:border-surface-dark cursor-pointer hover:scale-110 active:scale-95 transition-all">
              <ImageIcon size={14} />
              <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
            </label>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1 group-hover:text-primary transition-colors">{profile?.full_name || user.email?.split('@')[0]}</h3>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mb-4">{user.email}</p>
            <button className="px-4 py-2 bg-slate-50 dark:bg-background-dark text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors uppercase tracking-widest">
              Editar Perfil
            </button>
          </div>
        </div>

        {/* Settings Menu */}
        <div className="space-y-8">
          {menuGroups.map((group, idx) => (
            <div key={idx} className="space-y-3">
              <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1">{group.title}</p>
              <div className="bg-white dark:bg-surface-dark rounded-[32px] border border-slate-100 dark:border-border-dark overflow-hidden transition-colors shadow-sm">
                {group.items.map((item, i) => (
                  <button
                    key={i}
                    onClick={item.action}
                    className={`w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-background-dark transition-all group ${i !== group.items.length - 1 ? 'border-b border-slate-50 dark:border-border-dark' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded-xl bg-slate-50 dark:bg-background-dark flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                        <item.icon size={20} />
                      </div>
                      <span className="text-slate-700 dark:text-slate-200 font-bold text-sm">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{item.value}</span>
                      <ChevronRight size={16} className="text-slate-300" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
          
          <div className="pt-4 flex flex-col gap-3">
            <button 
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 p-5 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-[32px] font-black hover:bg-rose-500 hover:text-white transition-all active:scale-95"
            >
              <LogOut size={20} /> Sair do App
            </button>
            <p className="text-center text-[10px] uppercase font-black text-slate-300 dark:text-slate-700 tracking-tighter">
              Versão 2.4.0 • Beleza & Gestão
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
