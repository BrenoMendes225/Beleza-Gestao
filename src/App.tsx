import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Settings, 
  Plus, 
  Search, 
  Bell, 
  TrendingUp, 
  ChevronRight,
  Clock,
  Scissors,
  Palette,
  Hand,
  Sparkles,
  ArrowLeft,
  MoreVertical,
  Home,
  BarChart3,
  UserCircle,
  CreditCard,
  ArrowRight,
  Camera,
  LogOut,
  Moon,
  Sun
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Client, Service, Appointment, DashboardStats } from './types';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';

// --- Components ---

const Navigation = ({ 
  activeTab, 
  setActiveTab, 
  onNewRecord,
  isDarkMode,
  toggleDarkMode 
}: { 
  activeTab: string, 
  setActiveTab: (tab: string) => void, 
  onNewRecord: () => void,
  isDarkMode: boolean,
  toggleDarkMode: () => void
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'services', label: 'Serviços', icon: Scissors },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-surface-dark border-t border-slate-200 dark:border-border-dark px-6 pb-6 pt-3 flex justify-between items-center z-50 transition-colors">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === tab.id ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}
          >
            <tab.icon size={24} fill={activeTab === tab.id ? 'currentColor' : 'none'} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
          </button>
        ))}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2">
          <button 
            onClick={onNewRecord}
            className="bg-primary text-white h-14 w-14 rounded-full flex items-center justify-center shadow-lg shadow-primary/40 hover:scale-105 transition-transform"
          >
            <Plus size={32} />
          </button>
        </div>
      </nav>

      {/* Desktop Sidebar Navigation */}
      <nav className="hidden md:flex fixed top-0 left-0 bottom-0 w-64 bg-white dark:bg-surface-dark border-r border-slate-200 dark:border-border-dark flex-col z-50 transition-colors">
        <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-border-dark">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-xl text-white shadow-lg shadow-primary/20"><Scissors size={24} /></div>
            <h1 className="text-xl font-extrabold tracking-tight dark:text-white">Beleza & Gestão</h1>
          </div>
          <button 
            onClick={toggleDarkMode}
            className="p-2 hover:bg-slate-100 dark:hover:bg-background-dark rounded-xl transition-colors text-slate-500 dark:text-text-dark-secondary"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
        
        <div className="flex-1 px-4 py-8 flex flex-col gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-bold ${activeTab === tab.id ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-background-dark hover:text-slate-900 dark:hover:text-white'}`}
            >
              <tab.icon size={20} fill={activeTab === tab.id ? 'currentColor' : 'none'} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-border-dark">
          <button 
            onClick={onNewRecord}
            className="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
          >
            <Plus size={20} /> Novo Registro
          </button>
        </div>
      </nav>
    </>
  );
};const NewRecordModal = ({ 
  isOpen, 
  onClose, 
  user, 
  onSave, 
  initialType = 'appointment', 
  showTabs = true,
  isDarkMode
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  user: User | null, 
  onSave: () => void,
  initialType?: 'appointment' | 'client' | 'service',
  showTabs?: boolean,
  isDarkMode: boolean
}) => {
  const [type, setType] = useState<'appointment' | 'client' | 'service'>(initialType);
  const [loading, setLoading] = useState(false);
  
  // Appointment form
  const [clientName, setClientName] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('10:00');
  const [services, setServices] = useState<Service[]>([]);

  // Client form
  const [newClient, setNewClient] = useState({ name: '', phone: '', email: '' });
  
  // Service form
  const [newService, setNewService] = useState({ name: '', price: '', duration: '60', category: 'Cabelo' });

  useEffect(() => {
    if (isOpen) {
      setType(initialType);
      supabase.from('services').select('*').then(({ data }) => setServices(data || []));
    }
  }, [isOpen, initialType]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      if (type === 'appointment') {
        const { data: clientData } = await supabase.from('clients').select('id').eq('name', clientName).single();
        let cid = clientData?.id;
        
        if (!cid) {
          const { data: newC } = await supabase.from('clients').insert({ name: clientName, user_id: user.id }).select().single();
          cid = newC?.id;
        }

        const { error } = await supabase.from('appointments').insert({
          user_id: user.id,
          client_id: cid,
          service_id: serviceId,
          date,
          time,
          status: 'pending'
        });
        if (error) throw error;
      } else if (type === 'client') {
        const { error } = await supabase.from('clients').insert({ ...newClient, user_id: user.id });
        if (error) throw error;
      } else if (type === 'service') {
        const { error } = await supabase.from('services').insert({ 
          ...newService, 
          user_id: user.id,
          price: parseFloat(newService.price),
          duration: parseInt(newService.duration)
        });
        if (error) throw error;
      }
      onSave();
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-lg bg-white dark:bg-surface-dark rounded-[32px] shadow-2xl overflow-hidden transition-colors flex flex-col max-h-[90vh]"
      >
        <div className="p-6 md:p-8 flex justify-between items-center bg-white dark:bg-surface-dark z-10">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            {type === 'appointment' ? 'Novo Agendamento' : type === 'client' ? 'Nova Cliente' : 'Novo Serviço'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-background-dark rounded-xl transition-colors dark:text-slate-400">
            <Plus size={24} className="rotate-45" />
          </button>
        </div>

        <div className="px-6 md:px-8 pb-8 overflow-y-auto no-scrollbar">
          {showTabs && (
            <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-background-dark rounded-2xl mb-8">
              {[
                { id: 'appointment', label: 'Agenda', icon: Calendar },
                { id: 'client', label: 'Cliente', icon: Users },
                { id: 'service', label: 'Serviço', icon: Scissors },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setType(t.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                    type === t.id ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <t.icon size={16} />
                  {t.label}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-6">
            {type === 'appointment' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Cliente</label>
                  <input 
                    type="text" 
                    placeholder="Nome da cliente" 
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    className="w-full h-14 px-5 rounded-2xl bg-slate-50 dark:bg-background-dark border border-slate-100 dark:border-border-dark outline-none focus:border-primary transition-all dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Data</label>
                    <input 
                      type="date" 
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full h-14 px-5 rounded-2xl bg-slate-50 dark:bg-background-dark border border-slate-100 dark:border-border-dark outline-none focus:border-primary transition-all dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Horário</label>
                    <input 
                      type="time" 
                      value={time}
                      onChange={e => setTime(e.target.value)}
                      className="w-full h-14 px-5 rounded-2xl bg-slate-50 dark:bg-background-dark border border-slate-100 dark:border-border-dark outline-none focus:border-primary transition-all dark:text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Serviço</label>
                  <select 
                    value={serviceId}
                    onChange={e => setServiceId(e.target.value)}
                    className="w-full h-14 px-5 rounded-2xl bg-slate-50 dark:bg-background-dark border border-slate-100 dark:border-border-dark outline-none focus:border-primary transition-all dark:text-white"
                  >
                    <option value="">Selecione um serviço</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name} - R$ {s.price}</option>)}
                  </select>
                </div>
              </div>
            )}

            {type === 'client' && (
              <div className="space-y-4">
                <input 
                  placeholder="Nome completo" 
                  value={newClient.name}
                  onChange={e => setNewClient({...newClient, name: e.target.value})}
                  className="w-full h-14 px-5 rounded-2xl bg-slate-50 dark:bg-background-dark border border-slate-100 dark:border-border-dark outline-none focus:border-primary transition-all dark:text-white"
                />
                <input 
                  placeholder="WhatsApp / Telefone" 
                  value={newClient.phone}
                  onChange={e => setNewClient({...newClient, phone: e.target.value})}
                  className="w-full h-14 px-5 rounded-2xl bg-slate-50 dark:bg-background-dark border border-slate-100 dark:border-border-dark outline-none focus:border-primary transition-all dark:text-white"
                />
              </div>
            )}

            {type === 'service' && (
              <div className="space-y-4">
                <input 
                  placeholder="Nome do serviço" 
                  value={newService.name}
                  onChange={e => setNewService({...newService, name: e.target.value})}
                  className="w-full h-14 px-5 rounded-2xl bg-slate-50 dark:bg-background-dark border border-slate-100 dark:border-border-dark outline-none focus:border-primary transition-all dark:text-white"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    placeholder="Preço (R$)" 
                    type="number"
                    value={newService.price}
                    onChange={e => setNewService({...newService, price: e.target.value})}
                    className="w-full h-14 px-5 rounded-2xl bg-slate-50 dark:bg-background-dark border border-slate-100 dark:border-border-dark outline-none focus:border-primary transition-all dark:text-white"
                  />
                  <input 
                    placeholder="Duração (min)" 
                    type="number"
                    value={newService.duration}
                    onChange={e => setNewService({...newService, duration: e.target.value})}
                    className="w-full h-14 px-5 rounded-2xl bg-slate-50 dark:bg-background-dark border border-slate-100 dark:border-border-dark outline-none focus:border-primary transition-all dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-primary text-white font-bold h-16 rounded-2xl shadow-lg shadow-primary/20 text-lg mt-8 disabled:opacity-50 hover:bg-primary/90 transition-all"
          >
            {loading ? 'Salvando...' : 'Confirmar e Salvar'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- Screens ---

const Dashboard = ({ user, isDarkMode }: { user: User, isDarkMode: boolean }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch Profile
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(prof);

      // Fetch Stats
      const { data: confirmedApts } = await supabase
        .from('appointments')
        .select('service:service_id(price)')
        .eq('status', 'confirmed');
      
      const revenue = confirmedApts?.reduce((acc, apt: any) => acc + (apt.service?.price || 0), 0) || 0;
      
      const today = new Date().toISOString().split('T')[0];
      const { data: aptsToday } = await supabase.from('appointments').select('*').eq('date', today);
      const { data: totalCl } = await supabase.from('clients').select('*');

      setStats({
        revenue,
        appointmentsToday: aptsToday?.length || 0,
        totalClients: totalCl?.length || 0
      });

      // Fetch Recent Appointments
      const { data: recent } = await supabase
        .from('appointments')
        .select(`
          *,
          client:client_id(name),
          service:service_id(name, price)
        `)
        .order('date', { ascending: true })
        .order('time', { ascending: true });
      
      if (recent) {
        setAppointments(recent.map(apt => ({
          ...apt,
          client_name: (apt.client as any)?.name,
          service_name: (apt.service as any)?.name,
          price: (apt.service as any)?.price
        })));
      }
    };

    fetchData();
  }, [user.id]);

  return (
    <div className="pb-24">
      {/* Top Bar */}
      <div className="flex items-center bg-white dark:bg-surface-dark p-4 pb-2 justify-between border-b border-slate-200 dark:border-border-dark transition-colors">
        <div className="flex items-center">
          <div className="size-10 rounded-full border-2 border-primary overflow-hidden bg-slate-100 dark:bg-background-dark flex items-center justify-center">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" referrerPolicy="no-referrer" />
            ) : (
              <UserCircle className="text-slate-400 dark:text-slate-500" size={32} />
            )}
          </div>
          <div className="ml-3">
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">Bem-vinda{profile?.salon_name ? ` ao ${profile.salon_name}` : ''},</p>
            <h2 className="text-slate-900 dark:text-white text-lg font-bold">{profile?.full_name || user.email?.split('@')[0]}</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 bg-slate-100 dark:bg-background-dark rounded-xl text-slate-700 dark:text-white"><Search size={20} /></button>
          <button className="p-2 bg-slate-100 dark:bg-background-dark rounded-xl text-slate-700 dark:text-white relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 size-2 bg-primary rounded-full"></span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-4 md:p-8 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Faturamento', value: `R$ ${stats?.revenue.toFixed(2) || '0.00'}`, icon: TrendingUp, trend: '+12.5%' },
          { label: 'Agendados', value: `${stats?.appointmentsToday} Serviços`, icon: Calendar, trend: '+4 novos' },
          { label: 'Clientes Ativos', value: stats?.totalClients, icon: Users, trend: '+28 este mês' },
          { label: 'Ticket Médio', value: `R$ ${((stats?.revenue || 0) / (stats?.appointmentsToday || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: BarChart3, trend: '+5.2%' },
        ].map((item, i) => (
          <div key={i} className="bg-white dark:bg-surface-dark p-5 rounded-xl shadow-sm border border-slate-100 dark:border-border-dark transition-all hover:-translate-y-1">
            <div className="flex items-center gap-2 text-primary mb-1">
              <item.icon size={18} />
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">{item.label}</p>
            </div>
            <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white leading-none whitespace-nowrap">{item.value}</h3>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp size={12} className="text-emerald-500" />
              <p className="text-emerald-500 text-[10px] font-bold">{item.trend}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chart Placeholder */}
      <div className="px-4 py-2">
        <div className="bg-white dark:bg-surface-dark p-5 rounded-xl shadow-sm border border-slate-100 dark:border-border-dark transition-colors">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-slate-900 dark:text-white text-base font-bold">Desempenho Semanal</h3>
            <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase">Últimos 7 dias</span>
          </div>
          <div className="flex items-end justify-between h-32 px-1">
            {[65, 80, 100, 50, 90, 40, 30].map((height, i) => (
              <div key={i} className="flex flex-col items-center gap-2 flex-1">
                <div 
                  className={`w-full rounded-t-full ${height === 100 ? 'bg-primary' : 'bg-primary/20'}`} 
                  style={{ height: `${height}%` }}
                ></div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                  {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="px-4 md:px-8 pt-6 pb-2 flex justify-between items-center">
        <h2 className="text-slate-900 dark:text-white text-lg md:text-xl font-bold">Próximos de Hoje</h2>
        <button className="text-primary text-sm font-bold hover:underline transition-colors">Ver todos</button>
      </div>
      <div className="px-4 md:px-8 space-y-3 md:space-y-4 mb-8">
        {appointments.slice(0, 3).map((apt) => (
          <div key={apt.id} className="flex flex-col md:flex-row md:items-center gap-4 p-4 bg-white dark:bg-surface-dark rounded-xl border border-slate-100 dark:border-border-dark shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center md:flex-col md:justify-center min-w-[50px] md:border-r border-slate-100 dark:border-border-dark md:pr-4 gap-4 md:gap-0">
              <p className="text-slate-900 dark:text-white font-bold text-base md:text-lg">{apt.time}</p>
              <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase hidden md:block">Hoje</p>
            </div>
            <div className="flex-1 border-t border-slate-50 dark:border-border-dark pt-3 md:border-0 md:pt-0">
              <p className="text-slate-900 dark:text-white font-bold text-sm md:text-base">{apt.service_name}</p>
              <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm">{apt.client_name} • {apt.professional_name}</p>
            </div>
            <div className="flex justify-between items-center md:flex-col md:items-end mt-2 md:mt-0">
              <p className="text-primary font-bold text-sm md:text-base">R$ {apt.price}</p>
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${
                apt.status === 'confirmed' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
              }`}>
                {apt.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SettingsScreen = ({ 
  user, 
  onUpdate, 
  isDarkMode, 
  toggleDarkMode 
}: { 
  user: User, 
  onUpdate: () => void,
  isDarkMode: boolean,
  toggleDarkMode: () => void
}) => {
  const [profile, setProfile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setProfile(data));
  }, [user.id]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (updateError) throw updateError;
      
      const { data: updatedProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(updatedProfile);
      onUpdate();
      alert('Foto de perfil atualizada!');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 md:p-12 mb-24 max-w-2xl mx-auto">
      <h1 className="text-3xl font-extrabold mb-8 dark:text-white">Ajustes da Conta</h1>
      
      <div className="bg-white dark:bg-surface-dark rounded-3xl shadow-sm border border-slate-100 dark:border-border-dark overflow-hidden transition-colors">
        <div className="p-8 flex flex-col items-center border-b border-slate-50 dark:border-border-dark">
          <div className="relative group">
            <div className="size-32 rounded-full border-4 border-primary/10 overflow-hidden bg-slate-100 dark:bg-background-dark flex items-center justify-center">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <UserCircle className="text-slate-300 dark:text-slate-600" size={80} />
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 size-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform disabled:opacity-50"
            >
              <Camera size={20} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">{profile?.full_name}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{user.email}</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-background-dark transition-colors">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-white dark:bg-surface-dark rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-sm"><Home size={20} /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Salão</p>
                <p className="font-bold text-slate-700 dark:text-white">{profile?.salon_name || 'Não configurado'}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-background-dark transition-colors">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-white dark:bg-surface-dark rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-sm">
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Aparência</p>
                <p className="font-bold text-slate-700 dark:text-white">{isDarkMode ? 'Modo Escuro' : 'Modo Claro'}</p>
              </div>
            </div>
            <button 
              onClick={toggleDarkMode}
              className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${isDarkMode ? 'bg-primary' : 'bg-slate-300'}`}
            >
              <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${isDarkMode ? 'translate-x-6' : ''}`}></div>
            </button>
          </div>
          
          <button 
            onClick={() => supabase.auth.signOut()}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold hover:bg-red-100 dark:hover:bg-red-500/20 transition-all mt-4"
          >
            <LogOut size={20} />
            Sair da Conta
          </button>
        </div>
      </div>
    </div>
  );
};

const Agenda = ({ isDarkMode }: { isDarkMode: boolean }) => {
  const [filter, setFilter] = useState('Confirmados');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const tabs = ['Pendentes', 'Confirmados', 'Cancelados'];

  useEffect(() => {
    supabase
      .from('appointments')
      .select('*, client:client_id(name), service:service_id(name, price)')
      .order('time')
      .then(({ data }) => {
        if (data) {
          setAppointments(data.map(apt => ({
            ...apt,
            client_name: (apt.client as any)?.name,
            service_name: (apt.service as any)?.name
          })));
        }
      });
  }, []);

  return (
    <div className="pb-24 md:pb-8">
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-surface-dark/80 md:bg-white md:dark:bg-surface-dark backdrop-blur-md rounded-t-2xl md:rounded-xl transition-colors">
        <div className="flex items-center p-4 pb-2 justify-between">
          <button className="p-2 md:hidden text-slate-500 dark:text-slate-400"><MoreVertical size={24} /></button>
          <h2 className="text-lg md:text-2xl font-bold md:pl-4 dark:text-white">Agendamentos</h2>
          <button className="p-2 text-slate-500 dark:text-slate-400"><Search size={24} /></button>
        </div>
        <div className="px-4 md:px-8 pb-3">
          <div className="flex border-b border-slate-200 dark:border-border-dark gap-6 overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`pb-3 pt-2 shrink-0 text-sm font-bold transition-colors border-b-2 ${
                  filter === tab ? 'border-primary text-primary' : 'border-transparent text-slate-500 dark:text-slate-400'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-extrabold dark:text-white">Hoje, 13 de Março</h3>
          <span className="text-primary text-[10px] font-bold bg-primary/10 px-2 py-1 rounded-full uppercase">{appointments.length} Horários</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {appointments.map(apt => (
            <div key={apt.id} className="flex flex-col gap-4 bg-white dark:bg-surface-dark p-5 rounded-xl border border-slate-100 dark:border-border-dark shadow-sm transition-all hover:-translate-y-1">
              <div className="flex items-center gap-4 border-b border-slate-50 dark:border-border-dark pb-4">
                <div className="size-14 rounded-full border-2 border-primary/20 overflow-hidden shrink-0">
                  <img src={`https://picsum.photos/seed/${apt.client_name}/100/100`} alt={apt.client_name} referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="text-base font-bold leading-tight mb-1 line-clamp-1 dark:text-white">{apt.client_name}</p>
                    <span className={`size-3 rounded-full shrink-0 ${
                      apt.status === 'confirmed' ? 'bg-emerald-500 shadow-sm shadow-emerald-500/40' : 'bg-amber-500 shadow-sm shadow-amber-500/40'
                    }`}></span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-medium bg-slate-50 dark:bg-background-dark inline-block px-2 py-1 rounded-md">{apt.time} — {apt.time} (45m)</p>
                </div>
              </div>
              <div>
                <p className="text-primary text-sm font-bold mb-1">{apt.service_name}</p>
                <p className="text-slate-500 dark:text-slate-400 text-xs">{apt.professional_name}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

const Services = ({ onAdd, isDarkMode }: { onAdd: () => void, isDarkMode: boolean }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [category, setCategory] = useState('Cabelo');
  const categories = ['Cabelo', 'Unhas', 'Estética', 'Maquiagem'];

  useEffect(() => {
    supabase.from('services').select('*').order('category').then(({ data }) => setServices(data || []));
  }, []);

  return (
    <div className="pb-24 md:pb-8">
      <header className="bg-white dark:bg-surface-dark sticky top-0 z-10 border-b border-primary/10 dark:border-border-dark rounded-t-2xl md:rounded-xl transition-colors">
        <div className="flex items-center p-4 justify-between md:px-8">
          <button className="size-10 flex items-center justify-center rounded-full bg-primary/10 text-primary md:hidden">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl md:text-2xl font-extrabold flex-1 md:flex-none px-4 md:px-0 dark:text-white">Catálogo de Serviços</h1>
          <button 
            onClick={onAdd}
            className="size-10 flex items-center justify-center rounded-full bg-primary text-white shadow-lg md:ml-auto md:w-auto md:px-4 md:gap-2 hover:scale-105 transition-transform"
          >
            <Plus size={20} /> <span className="hidden md:inline font-bold">Novo Serviço</span>
          </button>
        </div>
        <div className="px-4 md:px-8 overflow-x-auto no-scrollbar">
          <div className="flex gap-6 border-b border-primary/5 dark:border-border-dark">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`pb-3 pt-4 text-sm font-bold whitespace-nowrap transition-colors border-b-2 ${
                  category === cat ? 'border-primary text-primary' : 'border-transparent text-slate-500 dark:text-slate-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="p-4 space-y-6">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
            <Search size={18} />
          </div>
          <input 
            type="text" 
            placeholder="Buscar por serviço ou preço..." 
            className="w-full h-12 pl-12 pr-4 bg-white dark:bg-surface-dark rounded-xl border border-primary/10 dark:border-border-dark focus:ring-2 focus:ring-primary/20 outline-none text-sm dark:text-white"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-6">
          <h3 className="text-lg font-bold md:col-span-full dark:text-white">{category} <span className="text-sm font-normal text-slate-500 dark:text-slate-400 ml-2">({services.filter(s => s.category === category).length} serviços)</span></h3>
          {services.filter(s => s.category === category).map(service => (
            <div key={service.id} className="bg-white dark:bg-surface-dark p-5 rounded-xl border border-primary/5 dark:border-border-dark shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md flex items-center gap-4 transition-colors">
              <div className="h-16 w-16 md:h-20 md:w-20 rounded-lg bg-primary/5 dark:bg-background-dark overflow-hidden flex items-center justify-center shrink-0">
                {service.image_url ? (
                  <img src={service.image_url} alt={service.name} className="object-cover w-full h-full" referrerPolicy="no-referrer" />
                ) : (
                  <Scissors className="text-primary" size={24} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-base md:text-lg truncate dark:text-white">{service.name}</h4>
                <div className="flex items-center gap-3 mt-2">
                  <span className="flex items-center text-xs md:text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-background-dark px-2 py-1 rounded-md">
                    <Clock size={14} className="mr-1" /> {service.duration} min
                  </span>
                  <span className="text-primary font-bold text-sm md:text-md">R$ {service.price.toFixed(2)}</span>
                </div>
              </div>
              <button className="p-2 md:p-3 text-slate-300 dark:text-slate-600 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                <Settings size={20} />
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

const Clients = ({ onAdd, isDarkMode }: { onAdd: () => void, isDarkMode: boolean }) => {
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    supabase.from('clients').select('*').order('name').then(({ data }) => setClients(data || []));
  }, []);

  return (
    <div className="pb-24 md:pb-8">
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-surface-dark/80 md:bg-white md:dark:bg-surface-dark backdrop-blur-md border-b border-primary/10 rounded-t-2xl md:rounded-xl transition-colors">
        <div className="px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Sparkles size={20} />
            </div>
            <h1 className="text-xl md:text-2xl font-bold dark:text-white">Gestão de Clientes</h1>
          </div>
          <button 
            onClick={onAdd}
            className="bg-primary text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 shadow-sm shadow-primary/30 hover:bg-primary/90 transition-colors hover:scale-105"
          >
            <Plus size={16} /> <span className="hidden md:inline">Nova Cliente</span><span className="md:hidden">Nova</span>
          </button>
        </div>
      </header>

      <main className="p-4 md:p-8">
        <div className="relative mb-6 md:mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nome, telefone ou CPF..." 
            className="w-full pl-12 pr-4 py-3 md:py-4 bg-white dark:bg-surface-dark border-none rounded-xl shadow-sm focus:ring-2 focus:ring-primary/50 transition-all text-sm md:text-base ring-1 ring-slate-100 dark:ring-border-dark dark:text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-primary/5 dark:border-border-dark transition-colors">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Total</p>
            <p className="text-2xl font-bold text-primary">{clients.length}</p>
          </div>
          <div className="bg-white dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-primary/5 dark:border-border-dark transition-colors">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Ativas</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{clients.filter(c => c.status === 'active').length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {clients.map(client => (
            <div key={client.id} className="flex items-center gap-4 bg-white dark:bg-surface-dark p-5 rounded-xl shadow-sm border border-transparent hover:border-primary/20 hover:shadow-md transition-all cursor-pointer group transition-colors">
              <div className="relative shrink-0">
                <div className="size-16 md:size-14 rounded-full border-2 border-primary/10 overflow-hidden">
                  <img src={`https://picsum.photos/seed/${client.name}/100/100`} alt={client.name} referrerPolicy="no-referrer" />
                </div>
                {client.status === 'active' && (
                  <span className="absolute bottom-0 right-0 size-4 md:size-3 bg-emerald-500 border-2 border-white dark:border-background-dark rounded-full"></span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors text-base md:text-md truncate">{client.name}</h3>
                <div className="flex flex-col text-xs text-slate-500 dark:text-slate-400 mt-1 gap-1">
                  <span className="flex items-center gap-1"><CreditCard size={12} /> {client.phone}</span>
                  <span className="flex items-center gap-1"><Calendar size={12} /> Última: {client.last_visit}</span>
                </div>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-background-dark group-hover:bg-primary/5 rounded-full text-slate-300 dark:text-slate-600 group-hover:text-primary transition-colors">
                <ChevronRight size={20} />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

const Onboarding = ({ onComplete }: { onComplete: () => void }) => {
  const [step, setStep] = useState(0); // 0-2: Slides, 3: Auth-Choice, 4: Login, 5: Register, 6: Personal, 7: Salon, 8: Hours, 9: Services
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Profile data
  const [profileData, setProfileData] = useState({
    full_name: '',
    birth_date: '',
    salon_name: '',
    salon_address: '',
    business_hours: {
      monday: { open: '09:00', close: '18:00', active: true },
      tuesday: { open: '09:00', close: '18:00', active: true },
      wednesday: { open: '09:00', close: '18:00', active: true },
      thursday: { open: '09:00', close: '18:00', active: true },
      friday: { open: '09:00', close: '18:00', active: true },
      saturday: { open: '09:00', close: '13:00', active: true },
      sunday: { open: '00:00', close: '00:00', active: false },
    }
  });

  const [initialServices, setInitialServices] = useState([
    { name: 'Corte Feminino', price: '80', duration: '60', category: 'Cabelo' },
    { name: 'Manicure', price: '35', duration: '40', category: 'Unhas' },
    { name: 'Escova', price: '50', duration: '45', category: 'Cabelo' }
  ]);

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => Math.max(0, s - 1));

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else if (data.user) {
      setStep(6); // Resume onboarding if not complete
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
    } else if (data.user) {
      setStep(6); // Go to info steps after sign up
    }
    setLoading(false);
  };

  const finishOnboarding = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // 1. Save Profile
      const { error: pError } = await supabase.from('profiles').upsert({
        id: session.user.id,
        ...profileData,
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      });
      if (pError) throw pError;

      // 2. Save Initial Services
      const servicesToInsert = initialServices.map(s => ({
        user_id: session.user.id,
        name: s.name,
        price: parseFloat(s.price),
        duration: parseInt(s.duration),
        category: s.category
      }));
      const { error: sError } = await supabase.from('services').insert(servicesToInsert);
      if (sError) throw sError;

      onComplete();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Slides ---
  const slides = [
    {
      title: "Gestão Completa do seu Espaço",
      desc: "Organize sua equipe, estoque e agenda de forma intuitiva. Ganhe tempo para o que realmente importa.",
      image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=800",
      icon: <LayoutDashboard size={40} />
    },
    {
      title: "Agendamento Inteligente",
      desc: "Evite furos na agenda e conflitos de horários. Suas clientes vão amar a praticidade.",
      image: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&q=80&w=800",
      icon: <Calendar size={40} />
    },
    {
      title: "Controle Financeiro Real",
      desc: "Saiba exatamente quanto seu salão fatura e quais serviços são os mais lucrativos.",
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=800",
      icon: <TrendingUp size={40} />
    }
  ];

  if (step < 3) {
    return (
      <div className="min-h-screen bg-white dark:bg-background-dark flex flex-col overflow-hidden transition-colors">
        <div className="flex-1 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="absolute inset-0 flex flex-col"
            >
              <div className="h-2/3 relative">
                <img src={slides[step].image} className="w-full h-full object-cover" alt="Presentation" />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent dark:from-background-dark dark:via-background-dark/20 dark:to-transparent"></div>
              </div>
              <div className="flex-1 p-8 text-center flex flex-col items-center justify-center -mt-20 relative z-10 bg-white dark:bg-surface-dark rounded-t-[40px] transition-colors">
                <div className="size-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-primary/5">
                  {slides[step].icon}
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">{slides[step].title}</h1>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">{slides[step].desc}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="p-8 space-y-6 bg-white dark:bg-surface-dark transition-colors">
          <div className="flex justify-center gap-2">
            {slides.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${step === i ? 'w-8 bg-primary' : 'w-2 bg-slate-200 dark:bg-slate-700'}`}></div>
            ))}
          </div>
          <button onClick={next} className="w-full bg-primary text-white font-bold h-16 rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 text-lg hover:scale-[1.02] transition-transform active:scale-95">
            Continuar <ArrowRight size={20} />
          </button>
          <button onClick={() => setStep(3)} className="w-full text-slate-400 dark:text-slate-500 font-bold py-2 hover:text-primary transition-colors">Pular</button>
        </div>
      </div>
    );
  }

  if (step === 3) { // Auth Choice
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-background-dark flex flex-col items-center justify-center p-8 text-center transition-colors">
        <div className="size-20 bg-primary rounded-3xl flex items-center justify-center text-white mb-8 shadow-2xl shadow-primary/30 rotate-6">
          <Scissors size={40} />
        </div>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Beleza & Gestão</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-12 max-w-xs leading-relaxed">O parceiro ideal para o crescimento do seu negócio e gestão do seu espaço.</p>
        
        <div className="w-full space-y-4 max-w-sm">
          <button onClick={() => setStep(5)} className="w-full bg-primary text-white font-bold h-16 rounded-2xl shadow-lg shadow-primary/20 text-lg hover:scale-[1.02] transition-transform active:scale-95">Começar Agora</button>
          <button onClick={() => setStep(4)} className="w-full bg-white dark:bg-surface-dark text-slate-700 dark:text-white font-bold h-16 rounded-2xl border border-slate-200 dark:border-border-dark shadow-sm text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Já tenho conta</button>
        </div>
      </div>
    );
  }

  if (step === 4 || step === 5) { // Login / Register
    const isLogin = step === 4;
    return (
      <div className="min-h-screen bg-white dark:bg-background-dark flex flex-col p-8 transition-colors">
        <button onClick={() => setStep(3)} className="size-12 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-surface-dark text-slate-600 dark:text-slate-400 mb-8 border border-slate-100 dark:border-border-dark hover:text-primary transition-colors"><ArrowLeft size={24} /></button>
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2">{isLogin ? 'Bem-vinda!' : 'Crie sua conta'}</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-10">{isLogin ? 'Falta pouco para acessar sua agenda.' : 'Preencha os dados básicos para começar.'}</p>

        {error && <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl border border-red-100 dark:border-red-500/20 flex items-center gap-3 text-sm font-medium"><LogOut size={16} /> {error}</div>}

        <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">E-mail</label>
            <input 
              type="email" 
              placeholder="seu@email.com" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full h-14 px-5 rounded-2xl bg-slate-50 dark:bg-background-dark border border-slate-100 dark:border-border-dark outline-none focus:border-primary focus:bg-white dark:focus:bg-surface-dark transition-all shadow-inner dark:text-white"
              required 
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Senha</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full h-14 px-5 rounded-2xl bg-slate-50 dark:bg-background-dark border border-slate-100 dark:border-border-dark outline-none focus:border-primary focus:bg-white dark:focus:bg-surface-dark transition-all shadow-inner dark:text-white"
              required 
            />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-primary text-white font-bold h-16 rounded-2xl shadow-lg shadow-primary/20 text-lg mt-4 disabled:opacity-50 hover:bg-primary/90 transition-all">
            {loading ? 'Processando...' : (isLogin ? 'Entrar' : 'Cadastrar')}
          </button>
        </form>
        
        <button 
          onClick={() => setStep(isLogin ? 5 : 4)} 
          className="mt-6 text-slate-500 dark:text-slate-400 font-bold tracking-tight hover:text-primary transition-colors"
        >
          {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre aqui'}
        </button>
      </div>
    );
  }

  if (step === 6) { // Personal Info
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-background-dark flex flex-col p-6 transition-colors">
        <div className="bg-white dark:bg-surface-dark p-8 rounded-[40px] shadow-sm flex-1 flex flex-col transition-colors">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-primary font-black uppercase tracking-widest text-xs">Passo 1 de 4</h2>
            <div className="flex gap-1">
              {[1,0,0,0].map((v, i) => <div key={i} className={`h-1.5 w-6 rounded-full ${v ? 'bg-primary' : 'bg-slate-100 dark:bg-background-dark'}`}></div>)}
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Sobre Você</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-10 leading-relaxed">Conte-nos um pouco sobre a profissional por trás do sucesso.</p>
          
          <div className="space-y-6 flex-1">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Seu Nome Completo</label>
              <div className="relative">
                <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
                <input 
                  type="text" 
                  placeholder="ex: Juliana Moraes" 
                  className="w-full h-14 pl-12 pr-4 rounded-2xl border border-slate-100 dark:border-border-dark bg-slate-50 dark:bg-background-dark focus:bg-white dark:focus:bg-slate-800 outline-none focus:border-primary transition-all dark:text-white"
                  value={profileData.full_name}
                  onChange={e => setProfileData({...profileData, full_name: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Data de Nascimento</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
                <input 
                  type="date" 
                  className="w-full h-14 pl-12 pr-4 rounded-2xl border border-slate-100 dark:border-border-dark bg-slate-50 dark:bg-background-dark focus:bg-white dark:focus:bg-slate-800 outline-none focus:border-primary transition-all dark:text-white"
                  value={profileData.birth_date}
                  onChange={e => setProfileData({...profileData, birth_date: e.target.value})}
                />
              </div>
            </div>
          </div>
          <button onClick={next} className="w-full bg-primary text-white font-bold h-16 rounded-2xl shadow-lg mt-8 text-lg hover:bg-primary/90 transition-all active:scale-[0.98]">Continuar</button>
        </div>
      </div>
    );
  }

  if (step === 7) { // Salon Info
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-background-dark flex flex-col p-6 transition-colors">
        <div className="bg-white dark:bg-surface-dark p-8 rounded-[40px] shadow-sm flex-1 flex flex-col transition-colors">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-primary font-black uppercase tracking-widest text-xs">Passo 2 de 4</h2>
            <div className="flex gap-1">
              {[1,1,0,0].map((v, i) => <div key={i} className={`h-1.5 w-6 rounded-full ${v ? 'bg-primary' : 'bg-slate-100 dark:bg-background-dark'}`}></div>)}
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Seu Negócio</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-10 leading-relaxed">Como os clientes encontrarão e identificarão seu espaço?</p>
          
          <div className="space-y-6 flex-1">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Nome do Salão / Estúdio</label>
              <div className="relative">
                <Home className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
                <input 
                  type="text" 
                  placeholder="ex: Blossom Hair & Spa" 
                  className="w-full h-14 pl-12 pr-4 rounded-2xl border border-slate-100 dark:border-border-dark bg-slate-50 dark:bg-background-dark focus:bg-white dark:focus:bg-slate-800 outline-none focus:border-primary transition-all dark:text-white"
                  value={profileData.salon_name}
                  onChange={e => setProfileData({...profileData, salon_name: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Endereço Completo</label>
              <div className="relative">
                <Settings className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
                <input 
                  type="text" 
                  placeholder="Rua, Número, Bairro, Cidade" 
                  className="w-full h-14 pl-12 pr-4 rounded-2xl border border-slate-100 dark:border-border-dark bg-slate-50 dark:bg-background-dark focus:bg-white dark:focus:bg-slate-800 outline-none focus:border-primary transition-all dark:text-white"
                  value={profileData.salon_address}
                  onChange={e => setProfileData({...profileData, salon_address: e.target.value})}
                />
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={back} className="px-6 bg-slate-50 dark:bg-background-dark text-slate-400 dark:text-slate-500 font-bold rounded-2xl border border-slate-100 dark:border-border-dark transition-colors">Voltar</button>
            <button onClick={next} className="flex-1 bg-primary text-white font-bold h-16 rounded-2xl shadow-lg text-lg hover:bg-primary/90 transition-all active:scale-[0.98]">Próximo</button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 8) { // Business Hours
    const days = [
      { id: 'monday', label: 'Segunda' },
      { id: 'tuesday', label: 'Terça' },
      { id: 'wednesday', label: 'Quarta' },
      { id: 'thursday', label: 'Quinta' },
      { id: 'friday', label: 'Sexta' },
      { id: 'saturday', label: 'Sábado' },
      { id: 'sunday', label: 'Domingo' },
    ];

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-background-dark flex flex-col p-6 transition-colors">
        <div className="bg-white dark:bg-surface-dark p-6 rounded-[40px] shadow-sm flex-1 flex flex-col transition-colors">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-primary font-black uppercase tracking-widest text-xs">Passo 3 de 4</h2>
            <div className="flex gap-1">
              {[1,1,1,0].map((v, i) => <div key={i} className={`h-1.5 w-6 rounded-full ${v ? 'bg-primary' : 'bg-slate-100 dark:bg-background-dark'}`}></div>)}
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Horários</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">Quando você está disponível para atender?</p>
          
          <div className="space-y-3 flex-1 overflow-y-auto pr-2 no-scrollbar">
            {days.map(day => {
              const d = (profileData.business_hours as any)[day.id];
              return (
                <div key={day.id} className={`p-4 rounded-2xl border transition-all ${d.active ? 'bg-white dark:bg-slate-800 border-primary/20 ring-1 ring-primary/5 shadow-sm' : 'bg-slate-50 dark:bg-background-dark border-slate-100 dark:border-border-dark opacity-60'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{day.label}</span>
                    <button 
                      onClick={() => setProfileData({
                        ...profileData,
                        business_hours: {
                          ...profileData.business_hours,
                          [day.id]: { ...d, active: !d.active }
                        }
                      })}
                      className={`text-[10px] font-black uppercase px-3 py-1 rounded-full transition-colors ${d.active ? 'bg-primary/10 text-primary' : 'bg-slate-200 dark:bg-background-dark text-slate-400 dark:text-slate-500'}`}
                    >
                      {d.active ? 'Aberto' : 'Fechado'}
                    </button>
                  </div>
                  {d.active && (
                    <div className="flex items-center gap-4">
                      <input 
                        type="time" 
                        className="bg-slate-50 dark:bg-background-dark border border-slate-100 dark:border-border-dark rounded-lg px-2 py-1 text-xs outline-none focus:border-primary dark:text-white transition-all"
                        value={d.open}
                        onChange={e => setProfileData({
                          ...profileData,
                          business_hours: { ...profileData.business_hours, [day.id]: { ...d, open: e.target.value } }
                        })}
                      />
                      <span className="text-slate-400 dark:text-slate-600 text-xs font-bold">às</span>
                      <input 
                        type="time" 
                        className="bg-slate-50 dark:bg-background-dark border border-slate-100 dark:border-border-dark rounded-lg px-2 py-1 text-xs outline-none focus:border-primary dark:text-white transition-all"
                        value={d.close}
                        onChange={e => setProfileData({
                          ...profileData,
                          business_hours: { ...profileData.business_hours, [day.id]: { ...d, close: e.target.value } }
                        })}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-6">
            <button onClick={back} className="px-6 bg-slate-50 dark:bg-background-dark text-slate-400 dark:text-slate-500 font-bold rounded-2xl border border-slate-100 dark:border-border-dark transition-colors">Voltar</button>
            <button onClick={next} className="flex-1 bg-primary text-white font-bold h-16 rounded-2xl shadow-lg text-lg hover:bg-primary/90 transition-all active:scale-[0.98]">Próximo</button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 9) { // Initial Services
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-background-dark flex flex-col p-6 transition-colors">
        <div className="bg-white dark:bg-surface-dark p-8 rounded-[40px] shadow-sm flex-1 flex flex-col transition-colors">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-primary font-black uppercase tracking-widest text-xs">Passo 4 de 4</h2>
            <div className="flex gap-1">
              {[1,1,1,1].map((v, i) => <div key={i} className={`h-1.5 w-6 rounded-full ${v ? 'bg-primary' : 'bg-slate-100 dark:bg-background-dark'}`}></div>)}
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Serviços</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-10 leading-relaxed">Para começar com o pé direito, adicione seus 3 principais serviços.</p>
          
          <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar pr-1">
            {initialServices.map((service, idx) => (
              <div key={idx} className="p-4 bg-slate-50 dark:bg-background-dark rounded-2xl border border-slate-100 dark:border-border-dark flex flex-col gap-3 transition-colors">
                <input 
                  type="text" 
                  placeholder="Nome do serviço" 
                  className="bg-transparent font-bold text-slate-700 dark:text-white outline-none border-b border-slate-200 dark:border-slate-800 pb-1 focus:border-primary transition-all"
                  value={service.name}
                  onChange={e => {
                    const newS = [...initialServices];
                    newS[idx].name = e.target.value;
                    setInitialServices(newS);
                  }}
                />
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-600 block mb-1">Preço (R$)</label>
                    <input 
                      type="number" 
                      className="w-full bg-white dark:bg-surface-dark border border-slate-100 dark:border-border-dark rounded-xl px-3 py-2 text-sm outline-none focus:border-primary dark:text-white transition-all"
                      value={service.price}
                      onChange={e => {
                        const newS = [...initialServices];
                        newS[idx].price = e.target.value;
                        setInitialServices(newS);
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-600 block mb-1">Duração (min)</label>
                    <input 
                      type="number" 
                      className="w-full bg-white dark:bg-surface-dark border border-slate-100 dark:border-border-dark rounded-xl px-3 py-2 text-sm outline-none focus:border-primary dark:text-white transition-all"
                      value={service.duration}
                      onChange={e => {
                        const newS = [...initialServices];
                        newS[idx].duration = e.target.value;
                        setInitialServices(newS);
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-8">
            <button onClick={back} className="px-6 bg-slate-50 dark:bg-background-dark text-slate-400 dark:text-slate-500 font-bold rounded-2xl border border-slate-100 dark:border-border-dark transition-colors">Voltar</button>
            <button onClick={finishOnboarding} disabled={loading} className="flex-1 bg-primary text-white font-bold h-16 rounded-2xl shadow-lg text-lg hover:bg-primary/90 transition-all disabled:opacity-50 active:scale-[0.98]">
              {loading ? 'Finalizando...' : 'Concluir Cadastro'}
            </button>
          </div>
        </div>
      </div>
    );
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'appointment' | 'client' | 'service'>('appointment');
  const [modalShowTabs, setModalShowTabs] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
           (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const openModal = (type: 'appointment' | 'client' | 'service' = 'appointment', showTabs: boolean = true) => {
    setModalType(type);
    setModalShowTabs(showTabs);
    setIsModalOpen(true);
  };

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single()
        .then(({ data }) => setOnboardingCompleted(data?.onboarding_completed ?? false));
    } else {
      setOnboardingCompleted(null);
    }
  }, [user, refreshKey]);

  const refreshData = () => setRefreshKey(prev => prev + 1);

  if (loading || (user && onboardingCompleted === null)) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !onboardingCompleted) {
    return <Onboarding onComplete={() => setOnboardingCompleted(true)} />;
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-sans antialiased md:flex transition-colors duration-300">
      {/* Navigation Component - Handles both mobile and desktop (sidebar) views inside */}
      <Navigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onNewRecord={() => openModal('appointment')} 
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />
      
      {/* Main Content Area - Left margin on desktop to leave space for fixed sidebar */}
      <main className="md:ml-64 flex-1 transition-all duration-300 relative min-h-screen overflow-x-hidden">
        <div className="max-w-7xl mx-auto md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeTab}-${refreshKey}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && <Dashboard user={user} isDarkMode={isDarkMode} />}
              {activeTab === 'agenda' && <Agenda isDarkMode={isDarkMode} />}
              {activeTab === 'services' && <Services onAdd={() => openModal('service', false)} isDarkMode={isDarkMode} />}
              {activeTab === 'clients' && <Clients onAdd={() => openModal('client', false)} isDarkMode={isDarkMode} />}
              {activeTab === 'settings' && <SettingsScreen user={user} onUpdate={refreshData} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <NewRecordModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        user={user} 
        onSave={refreshData}
        initialType={modalType}
        showTabs={modalShowTabs}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
