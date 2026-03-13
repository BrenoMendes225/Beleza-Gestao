import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Search, 
  Bell, 
  TrendingUp, 
  ChevronRight,
  Clock,
  Palette,
  Hand,
  Sparkles,
  MoreVertical,
  Home,
  BarChart3,
  UserCircle,
  CreditCard,
  ArrowRight,
  Camera,
  Wallet,
  FileText,
  CheckCircle,
  XCircle,
  Download,
  LayoutDashboard, 
  Scissors, 
  Users, 
  Settings, 
  Plus, 
  Sun, 
  Moon, 
  ArrowLeft, 
  LogOut, 
  Share2,
  Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Client, Service, Appointment, DashboardStats, Expense, Notification as AppNotification } from './types';
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
    { id: 'finances', label: 'Finanças', icon: Wallet },
    { id: 'services', label: 'Serviços', icon: Scissors },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-surface-dark border-t border-slate-200 dark:border-border-dark px-2 pb-6 pt-3 flex items-center z-50 transition-colors">
        <div className="flex-1 flex justify-around">
          {tabs.slice(0, 3).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 transition-colors ${activeTab === tab.id ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}
            >
              <tab.icon size={20} fill={activeTab === tab.id ? 'currentColor' : 'none'} />
              <span className="text-[9px] font-bold uppercase tracking-tighter opacity-80">{tab.label}</span>
            </button>
          ))}
        </div>
        
        {/* Placeholder for the FAB */}
        <div className="w-16 h-10 flex-shrink-0"></div>

        <div className="flex-1 flex justify-around">
          {tabs.slice(3).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 transition-colors ${activeTab === tab.id ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}
            >
              <tab.icon size={20} fill={activeTab === tab.id ? 'currentColor' : 'none'} />
              <span className="text-[9px] font-bold uppercase tracking-tighter opacity-80">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-50">
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
};

const maskPhone = (value: string) => {
  if (!value) return "";
  value = value.replace(/\D/g, "");
  value = value.replace(/^(\d{2})(\d)/g, "$1 $2");
  value = value.replace(/(\d{5})(\d)/, "$1-$2");
  return value.slice(0, 15); // Max length for (XX) XXXXX-XXXX
};

const NewRecordModal = ({ 
  isOpen, 
  onClose, 
  user, 
  onSave, 
  initialType = 'appointment', 
  showTabs = true,
  isDarkMode,
  editingAppointment
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  user: User | null, 
  onSave: () => void,
  initialType?: 'appointment' | 'client' | 'service',
  showTabs?: boolean,
  isDarkMode: boolean,
  editingAppointment?: Appointment | null
}) => {
  const [type, setType] = useState<'appointment' | 'client' | 'service'>(editingAppointment ? 'appointment' : initialType);
  const [loading, setLoading] = useState(false);
  
  // Appointment form
  const [paymentMethod, setPaymentMethod] = useState(editingAppointment?.payment_method || 'Dinheiro');
  const [showSuccess, setShowSuccess] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientId, setClientId] = useState(editingAppointment?.client_id || '');
  const [serviceId, setServiceId] = useState(editingAppointment?.service_id || '');
  const [date, setDate] = useState(editingAppointment?.date || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(editingAppointment?.time || '10:00');
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  // Client form
  const [newClient, setNewClient] = useState({ name: '', phone: '', email: '' });
  
  // Service form
  const [newService, setNewService] = useState({ name: '', price: '', duration: '60', category: 'Cabelo' });

  useEffect(() => {
    if (isOpen) {
      if (!editingAppointment) {
        setType(initialType);
        setPaymentMethod('Dinheiro');
        setClientId('');
        setServiceId('');
        setDate(new Date().toISOString().split('T')[0]);
        setTime('10:00');
      } else {
        setType('appointment');
        setPaymentMethod(editingAppointment.payment_method || 'Dinheiro');
        setClientId(editingAppointment.client_id);
        setServiceId(editingAppointment.service_id);
        setDate(editingAppointment.date);
        setTime(editingAppointment.time);
      }
      supabase.from('services').select('*').then(({ data }) => setServices(data || []));
      supabase.from('clients').select('*').order('name').then(({ data }) => setClients(data || []));
    }
  }, [isOpen, initialType, editingAppointment]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      if (type === 'appointment') {
        let cid = clientId;
        
        if ((!cid || cid === 'new') && clientName) {
          const { data: newC } = await supabase.from('clients').insert({ name: clientName, user_id: user.id }).select().single();
          cid = newC?.id;
        }

        if (!cid || cid === 'new') throw new Error("Por favor, selecione ou digite o nome de uma cliente.");

        if (editingAppointment) {
          const { error } = await supabase.from('appointments').update({
            client_id: cid,
            service_id: serviceId,
            date,
            time,
            payment_method: paymentMethod
          }).eq('id', editingAppointment.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('appointments').insert({
            user_id: user.id,
            client_id: cid,
            service_id: serviceId,
            date,
            time,
            status: 'pending',
            payment_method: paymentMethod
          });
          if (error) throw error;
        }

        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          onSave();
          onClose();
        }, 2000);
        return;
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
                  <div className="flex gap-2">
                    <select 
                      value={clientId}
                      onChange={e => {
                        setClientId(e.target.value);
                        if (e.target.value !== "new") setClientName("");
                      }}
                      className="flex-1 h-14 px-5 rounded-2xl bg-slate-50 dark:bg-background-dark border border-slate-100 dark:border-border-dark outline-none focus:border-primary transition-all dark:text-white font-medium"
                    >
                      <option value="">Selecione uma cliente</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      <option value="new">+ Nova Cliente</option>
                    </select>
                  </div>
                  {clientId === "new" && (
                    <motion.input 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      type="text" 
                      placeholder="Nome da nova cliente" 
                      value={clientName}
                      onChange={e => setClientName(e.target.value)}
                      className="w-full h-14 px-5 rounded-2xl bg-slate-50 dark:bg-background-dark border border-slate-100 dark:border-border-dark outline-none focus:border-primary transition-all dark:text-white mt-2 font-bold"
                    />
                  )}
                </div>
                <div className="space-y-4">
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
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Forma de Pagamento</label>
                  <select 
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full h-14 px-5 rounded-2xl bg-slate-50 dark:bg-background-dark border border-slate-100 dark:border-border-dark outline-none focus:border-primary transition-all dark:text-white"
                  >
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Pix">Pix</option>
                  </select>
                </div>
              </div>
            )}

            {type === 'client' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Nome Completo</label>
                  <input 
                    placeholder="Ex: Maria Oliveira" 
                    value={newClient.name}
                    onChange={e => setNewClient({...newClient, name: e.target.value})}
                    className="w-full h-14 px-5 rounded-2xl bg-slate-50 dark:bg-background-dark border border-slate-100 dark:border-border-dark outline-none focus:border-primary transition-all dark:text-white font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">WhatsApp / Telefone</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      placeholder="31 98546-0918" 
                      value={newClient.phone}
                      onChange={e => setNewClient({...newClient, phone: maskPhone(e.target.value)})}
                      className="w-full h-14 pl-12 pr-5 rounded-2xl bg-slate-50 dark:bg-background-dark border border-slate-100 dark:border-border-dark outline-none focus:border-primary transition-all dark:text-white font-bold"
                    />
                  </div>
                </div>
              </div>
            )}

            {type === 'service' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Nome do Serviço</label>
                  <input 
                    placeholder="ex: Designer de Sobrancelhas" 
                    value={newService.name}
                    onChange={e => setNewService({...newService, name: e.target.value})}
                    className="w-full h-14 px-5 rounded-2xl bg-slate-50 dark:bg-background-dark border border-slate-100 dark:border-border-dark outline-none focus:border-primary transition-all dark:text-white shadow-inner font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Valor (R$)</label>
                    <input 
                      placeholder="0,00" 
                      type="number"
                      value={newService.price}
                      onChange={e => setNewService({...newService, price: e.target.value})}
                      className="w-full h-14 px-5 rounded-2xl bg-slate-50 dark:bg-background-dark border border-slate-100 dark:border-border-dark outline-none focus:border-primary transition-all dark:text-white shadow-inner font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Tempo (min)</label>
                    <input 
                      placeholder="60" 
                      type="number"
                      value={newService.duration}
                      onChange={e => setNewService({...newService, duration: e.target.value})}
                      className="w-full h-14 px-5 rounded-2xl bg-slate-50 dark:bg-background-dark border border-slate-100 dark:border-border-dark outline-none focus:border-primary transition-all dark:text-white shadow-inner font-bold"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-primary text-white font-bold h-16 rounded-2xl shadow-lg shadow-primary/20 text-lg mt-8 disabled:opacity-50 hover:bg-primary/90 transition-all font-display"
          >
            {loading ? 'Salvando...' : 'Confirmar e Salvar'}
          </button>
        </div>

        <AnimatePresence>
          {showSuccess && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-surface-dark text-center p-8"
            >
              <div className="size-24 bg-emerald-500 rounded-full flex items-center justify-center text-white mb-6 shadow-xl shadow-emerald-500/20 animate-bounce">
                <Plus size={48} className="rotate-0" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Agendamento Realizado!</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Tudo certo para o atendimento.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

const ReceiptModal = ({ 
  isOpen, 
  onClose, 
  appointment, 
  isDarkMode,
  salonName
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  appointment: Appointment | null,
  isDarkMode: boolean,
  salonName: string
}) => {
  if (!appointment) return null;

  const formatDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  const formattedDate = formatDate(appointment.date);

  const handleShare = async () => {
    const text = `🌸 Confirmação de Atendimento – ${salonName}\n\n` +
                 `Olá, ${appointment.client_name} ! Tudo bem? 😊\n` +
                 `Seu atendimento foi registrado com sucesso.\n\n` +
                 `💅 Serviço realizado: ${appointment.service_name}\n` +
                 `📅 Data: ${formattedDate}\n` +
                 `💰 Valor: R$ ${appointment.price?.toFixed(2)}\n\n` +
                 `Agradecemos pela confiança no nosso trabalho.\n` +
                 `Será sempre um prazer cuidar da sua beleza! ✨\n\n` +
                 `💖 ${salonName}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Recibo - Beleza & Gestão',
          text: text,
        });
      } catch (err) {
        console.log('Erro ao compartilhar:', err);
      }
    } else {
      navigator.clipboard.writeText(text);
      alert('Recibo copiado para a área de transferência!');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white dark:bg-surface-dark w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl transition-colors"
          >
            {/* Receipt Content */}
            <div className="p-8 relative">
              {/* Watermark */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] dark:opacity-[0.07] pointer-events-none rotate-[-30deg]">
                <Scissors size={200} className="text-primary" />
              </div>

              <div className="text-center mb-8 relative">
                <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-4">
                  <Scissors size={32} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Comprovante</h2>
                <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Beleza & Gestão</p>
              </div>

              <div className="space-y-6 relative border-t border-dashed border-slate-200 dark:border-slate-800 pt-6">
                <div className="bg-slate-50 dark:bg-background-dark p-6 rounded-3xl text-center mb-6">
                  <p className="text-slate-800 dark:text-white font-medium">
                    Olá, <span className="font-bold">{appointment.client_name}</span>! Tudo bem? 😊
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Seu atendimento foi registrado com sucesso.</p>
                </div>
                
                <div className="flex justify-between items-end">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-600 block mb-1">Serviço</label>
                    <p className="text-base font-bold text-slate-700 dark:text-slate-300">{appointment.service_name}</p>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{appointment.date} • {appointment.time}</p>
                  </div>
                  <div className="text-right">
                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-600 block mb-1">Valor</label>
                    <p className="text-xl font-black text-primary">R$ {appointment.price?.toFixed(2)}</p>
                  </div>
                </div>

                <div className="bg-primary/5 dark:bg-primary/10 p-6 rounded-3xl text-center border border-primary/10">
                  <p className="text-slate-600 dark:text-slate-300 text-sm font-medium leading-relaxed">
                    Agradecemos pela confiança no nosso trabalho.<br/>
                    Será sempre um prazer cuidar da sua beleza! ✨
                  </p>
                  <p className="text-primary font-black mt-4 uppercase tracking-tighter">💖 {salonName}</p>
                </div>
              </div>

              <div className="mt-8 flex gap-3 relative">
                <button 
                  onClick={onClose}
                  className="flex-1 h-12 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Fechar
                </button>
                <button 
                  onClick={handleShare}
                  className="flex-1 h-12 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Share2 size={18} /> Compartilhar
                </button>
              </div>
            </div>
            
            {/* Decorative bottom */}
            <div className="h-2 bg-gradient-to-r from-primary to-rose-500"></div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const NotificationOverlay = ({ 
  isOpen, 
  onClose, 
  notifications,
  onMarkRead 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  notifications: AppNotification[],
  onMarkRead: (id: string) => void
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose}></div>
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-16 right-4 w-80 bg-white dark:bg-surface-dark rounded-2xl shadow-2xl border border-slate-100 dark:border-border-dark z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-slate-50 dark:border-border-dark flex justify-between items-center">
              <h3 className="font-bold text-slate-900 dark:text-white">Notificações</h3>
              <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {notifications.filter(n => !n.read).length} Novas
              </span>
            </div>
            <div className="max-h-96 overflow-y-auto no-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="mx-auto text-slate-200 dark:text-slate-700 mb-2" size={32} />
                  <p className="text-slate-400 dark:text-slate-500 text-sm">Tudo limpo por aqui!</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div 
                    key={n.id} 
                    onClick={() => onMarkRead(n.id)}
                    className={`p-4 border-b border-slate-50 dark:border-border-dark cursor-pointer transition-colors ${!n.read ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-slate-50 dark:hover:bg-background-dark'}`}
                  >
                    <div className="flex gap-3">
                      <div className={`size-2 rounded-full mt-2 shrink-0 ${!n.read ? 'bg-primary' : 'bg-transparent'}`}></div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{n.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{n.message}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-2">Agora mesmo</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button className="w-full p-3 text-xs font-bold text-primary hover:bg-slate-50 dark:hover:bg-background-dark transition-colors border-t border-slate-50 dark:border-border-dark">
              Ver todas as notificações
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const FinanceScreen = ({ user, isDarkMode, onOpenAddExpense }: { user: User, isDarkMode: boolean, onOpenAddExpense: () => void }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [revenue, setRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    // Fetch Expenses
    const { data: expData } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });
    if (expData) setExpenses(expData);

    // Fetch Revenue (Only completed services)
    const { data: completedApts } = await supabase
      .from('appointments')
      .select('service:service_id(price)')
      .eq('status', 'completed');
    
    const rev = completedApts?.reduce((acc, apt: any) => acc + (apt.service?.price || 0), 0) || 0;
    setRevenue(rev);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);

  return (
    <div className="pb-24 p-6 md:p-8 space-y-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Finanças</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Controle seus gastos e lucros</p>
        </div>
        <button 
          onClick={onOpenAddExpense}
          className="size-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-8 rounded-[32px] bg-white dark:bg-surface-dark shadow-xl border border-slate-50 dark:border-border-dark flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.05] dark:opacity-[0.1] transition-transform group-hover:scale-110">
            <TrendingUp size={120} className="text-emerald-500" />
          </div>
          <div>
            <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-6">
              <TrendingUp size={24} />
            </div>
            <p className="text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-widest">Total Ganhos</p>
            <h3 className="text-4xl font-black text-slate-900 dark:text-white mt-1">R$ {revenue.toFixed(2)}</h3>
          </div>
        </div>

        <div className="p-8 rounded-[32px] bg-white dark:bg-surface-dark shadow-xl border border-slate-50 dark:border-border-dark flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.05] dark:opacity-[0.1] transition-transform group-hover:scale-110">
            <Wallet size={120} className="text-rose-500" />
          </div>
          <div>
            <div className="size-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-6">
              <Wallet size={24} />
            </div>
            <p className="text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-widest">Total Despesas</p>
            <h3 className="text-4xl font-black text-slate-900 dark:text-white mt-1">R$ {totalExpenses.toFixed(2)}</h3>
          </div>
        </div>
      </div>

      <div className="p-8 rounded-[32px] bg-white dark:bg-surface-dark shadow-xl border border-slate-50 dark:border-border-dark">
        <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Últimas Despesas</h4>
        <div className="space-y-4">
          {loading ? (
            <div className="py-12 text-center text-slate-400">Carregando despesas...</div>
          ) : expenses.length === 0 ? (
            <div className="py-12 text-center">
              <div className="size-20 rounded-full bg-slate-50 dark:bg-background-dark flex items-center justify-center mx-auto mb-4">
                <Wallet className="text-slate-200 dark:text-slate-700" size={32} />
              </div>
              <p className="text-slate-400 dark:text-slate-500 text-sm italic">Nenhuma despesa registrada ainda.</p>
            </div>
          ) : (
            expenses.map(exp => (
              <div key={exp.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-background-dark transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white">{exp.description}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-tighter">{exp.category} • {exp.date}</p>
                  </div>
                </div>
                <p className="font-black text-rose-500">- R$ {exp.amount.toFixed(2)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// --- Screens ---

const Dashboard = ({ 
  user, 
  isDarkMode, 
  onSelectApt, 
  onOpenNotifications, 
  unreadCount 
}: { 
  user: User, 
  isDarkMode: boolean, 
  onSelectApt: (apt: Appointment) => void,
  onOpenNotifications: () => void,
  unreadCount: number
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch Profile
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(prof);

      // Fetch Revenue (Confirmed Appointments)
      const { data: confirmedApts } = await supabase
        .from('appointments')
        .select('service:service_id(price)')
        .eq('status', 'confirmed');
      
      const revenue = confirmedApts?.reduce((acc, apt: any) => acc + (apt.service?.price || 0), 0) || 0;
      
      // Fetch Expenses
      const { data: expData } = await supabase
        .from('expenses')
        .select('amount');
      
      const expenses = expData?.reduce((acc, exp) => acc + exp.amount, 0) || 0;

      const today = new Date().toISOString().split('T')[0];
      const { data: aptsToday } = await supabase.from('appointments').select('*').eq('date', today);
      const { data: totalCl } = await supabase.from('clients').select('*');

      setStats({
        revenue,
        expenses,
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

  const netProfit = (stats?.revenue || 0) - (stats?.expenses || 0);

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
          <button 
            onClick={onOpenNotifications}
            className="p-2 bg-slate-100 dark:bg-background-dark rounded-xl text-slate-700 dark:text-white relative transition-all active:scale-90"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 size-2 bg-primary rounded-full animate-pulse"></span>
            )}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-4 md:p-8 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Lucro Líquido', value: `R$ ${netProfit.toFixed(2)}`, icon: Wallet, trend: 'Net', isPrimary: true },
          { label: 'Faturamento', value: `R$ ${stats?.revenue.toFixed(2) || '0.00'}`, icon: TrendingUp, trend: 'Bruto' },
          { label: 'Hoje na Agenda', value: `${stats?.appointmentsToday} Serviços`, icon: Calendar, trend: 'Próximos' },
          { label: 'Clientes Ativos', value: stats?.totalClients, icon: Users, trend: 'Base total' },
        ].map((item, i) => (
          <div key={i} className={`p-5 rounded-xl shadow-sm border transition-all hover:-translate-y-1 ${item.isPrimary ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white dark:bg-surface-dark border-slate-100 dark:border-border-dark'}`}>
            <div className={`flex items-center gap-2 mb-1 ${item.isPrimary ? 'text-white/80' : 'text-primary'}`}>
              <item.icon size={18} />
              <p className={`text-sm font-medium ${item.isPrimary ? 'text-white/80' : 'text-slate-600 dark:text-slate-400'}`}>{item.label}</p>
            </div>
            <h3 className={`text-xl md:text-2xl font-extrabold leading-none truncate ${item.isPrimary ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{item.value}</h3>
            <div className="flex items-center gap-1 mt-1">
              <p className={`text-[10px] font-bold uppercase tracking-wider ${item.isPrimary ? 'text-white/60' : 'text-slate-400 dark:text-slate-500'}`}>{item.trend}</p>
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
          <div 
            key={apt.id} 
            onClick={() => onSelectApt(apt)}
            className="flex flex-col md:flex-row md:items-center gap-4 p-4 bg-white dark:bg-surface-dark rounded-xl border border-slate-100 dark:border-border-dark shadow-sm transition-all hover:shadow-md cursor-pointer group active:scale-[0.98]"
          >
            <div className="flex items-center md:flex-col md:justify-center min-w-[50px] md:border-r border-slate-100 dark:border-border-dark md:pr-4 gap-4 md:gap-0">
              <p className="text-slate-900 dark:text-white font-bold text-base md:text-lg group-hover:text-primary transition-colors">{apt.time}</p>
              <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase hidden md:block">Hoje</p>
            </div>
            <div className="flex-1 border-t border-slate-50 dark:border-border-dark pt-3 md:border-0 md:pt-0">
              <p className="text-slate-900 dark:text-white font-bold text-sm md:text-base group-hover:text-primary transition-colors">{apt.service_name}</p>
              <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm">{apt.client_name} • {apt.professional_name}</p>
            </div>
            <div className="flex justify-between items-center md:flex-col md:items-end mt-2 md:mt-0 gap-2">
              <p className="text-primary font-black text-sm md:text-base">R$ {apt.price?.toFixed(2)}</p>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${
                  apt.status === 'confirmed' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                }`}>
                  {apt.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                </span>
                <div className="size-8 rounded-lg bg-slate-50 dark:bg-background-dark flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                  <FileText size={16} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SettingsScreen = ({ 
  user, 
  isDarkMode, 
  toggleDarkMode 
}: { 
  user: User, 
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

const Agenda = ({ user, isDarkMode, onEdit }: { user: User, isDarkMode: boolean, onEdit: (apt: Appointment) => void }) => {
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
            service_name: (apt.service as any)?.name,
            service_price: (apt.service as any)?.price
          })));
        }
      });
  }, []);

  const updateAptStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
    if (!error) {
      setAppointments(appointments.map(a => a.id === id ? { ...a, status } : a));
    }
  };

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
          {appointments.filter(apt => filter === 'Todos' || (filter === 'Pendentes' && apt.status === 'pending') || (filter === 'Finalizados' && apt.status === 'completed')).map(apt => (
            <div key={apt.id} className="flex flex-col gap-4 bg-white dark:bg-surface-dark p-5 rounded-2xl border border-slate-100 dark:border-border-dark shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="size-14 rounded-full border-2 border-primary/20 overflow-hidden shrink-0">
                  <img src={`https://picsum.photos/seed/${apt.client_name}/100/100`} alt={apt.client_name} referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-base font-bold leading-tight line-clamp-1 dark:text-white">{apt.client_name}</p>
                      <p className="text-primary text-xs font-bold mt-1">{apt.service_name}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                      apt.status === 'completed' 
                        ? 'bg-emerald-500/10 text-emerald-500' 
                        : apt.status === 'cancelled'
                        ? 'bg-rose-500/10 text-rose-500'
                        : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {apt.status === 'completed' ? 'Finalizado' : apt.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-50 dark:border-border-dark">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Calendar size={14} className="text-primary/60" />
                  <span className="text-[11px] font-bold">{new Date(apt.date).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Clock size={14} className="text-primary/60" />
                  <span className="text-[11px] font-bold">{apt.time}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <CreditCard size={14} className="text-primary/60" />
                  <span className="text-[11px] font-bold">{apt.payment_method}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <TrendingUp size={14} className="text-emerald-500/60" />
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">R$ {apt.service_price}</span>
                </div>
              </div>

              {apt.status === 'pending' && (
                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => updateAptStatus(apt.id, 'completed')}
                    className="flex-1 h-10 rounded-xl bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-emerald-500/20 active:scale-95 transition-all"
                  >
                    <CheckCircle size={14} /> Finalizar
                  </button>
                  <button 
                    onClick={() => onEdit(apt)}
                    className="size-10 rounded-xl bg-slate-100 dark:bg-background-dark text-slate-500 dark:text-slate-400 flex items-center justify-center active:scale-95 transition-all"
                    title="Editar"
                  >
                    <Scissors size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};


const Services = ({ user, onAdd, isDarkMode }: { user: User, onAdd: () => void, isDarkMode: boolean }) => {
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-6 pb-20">
          <h3 className="text-lg font-bold md:col-span-full dark:text-white ml-2">{category} <span className="text-sm font-normal text-slate-500 dark:text-slate-400 ml-2">({services.filter(s => s.category === category).length} serviços)</span></h3>
          {services.filter(s => s.category === category).map(service => (
            <div key={service.id} className="group bg-white dark:bg-surface-dark p-6 rounded-[32px] border border-slate-100 dark:border-border-dark shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 flex items-center gap-5">
              <div className="h-20 w-20 rounded-2xl bg-slate-50 dark:bg-background-dark overflow-hidden flex items-center justify-center shrink-0 border border-slate-100 dark:border-border-dark group-hover:scale-105 transition-transform shadow-inner">
                {service.image_url ? (
                  <img src={service.image_url} alt={service.name} className="object-cover w-full h-full" referrerPolicy="no-referrer" />
                ) : (
                  <Scissors className="text-primary opacity-30 group-hover:opacity-100 transition-opacity" size={28} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-slate-900 dark:text-white text-lg leading-tight mb-1 group-hover:text-primary transition-colors">{service.name}</p>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 dark:bg-background-dark text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{service.duration} min</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500">Principal</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xl font-black text-primary tracking-tighter">R$ {service.price?.toFixed(2)}</p>
                <button className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase mt-1 group-hover:text-primary transition-colors">Editar</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

const Clients = ({ user, onAdd, isDarkMode }: { user: User, onAdd: () => void, isDarkMode: boolean }) => {
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

const Onboarding = ({ onComplete, isDarkMode }: { onComplete: () => void, isDarkMode: boolean }) => {
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
        <p className="text-slate-500 dark:text-slate-400 mb-10">{isLogin ? 'Falta pouco para acessar sua agenda.' : 'Preencha suas informações para começar.'}</p>

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
          
          <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar pr-1">
            {initialServices.map((service, idx) => (
              <div key={idx} className="p-6 bg-slate-50 dark:bg-background-dark/50 rounded-3xl border border-slate-100 dark:border-border-dark flex flex-col gap-4 transition-all hover:bg-white dark:hover:bg-background-dark group shadow-sm">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-600 ml-1">Nome do serviço</label>
                  <input 
                    type="text" 
                    placeholder="ex: Corte & Escova" 
                    className="w-full bg-transparent font-extrabold text-xl text-slate-800 dark:text-white outline-none border-b-2 border-slate-100 dark:border-slate-800 pb-2 focus:border-primary transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700"
                    value={service.name}
                    onChange={e => {
                      const newS = [...initialServices];
                      newS[idx].name = e.target.value;
                      setInitialServices(newS);
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-600 ml-1">Preço (R$)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 font-bold text-sm">R$</span>
                      <input 
                        type="number" 
                        className="w-full bg-white dark:bg-surface-dark border border-slate-100 dark:border-border-dark rounded-2xl pl-9 pr-4 py-3 text-sm font-bold outline-none focus:border-primary dark:text-white transition-all shadow-sm"
                        value={service.price}
                        onChange={e => {
                          const newS = [...initialServices];
                          newS[idx].price = e.target.value;
                          setInitialServices(newS);
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-600 ml-1">Duração (min)</label>
                    <input 
                      type="number" 
                      className="w-full bg-white dark:bg-surface-dark border border-slate-100 dark:border-border-dark rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-primary dark:text-white transition-all shadow-sm"
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

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const [selectedReceipt, setSelectedReceipt] = useState<Appointment | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  const [salonName, setSalonName] = useState('Meu Salão');
  const [refreshKey, setRefreshKey] = useState(0);

  // Modals & Overlays State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'appointment' | 'client' | 'service' | 'expense'>('appointment');
  const [modalShowTabs, setModalShowTabs] = useState(true);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  
  const refreshFinance = () => setRefreshKey(prev => prev + 1);

  // Expense form state
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Outros');

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('onboarding_completed, salon_name')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          setOnboardingCompleted(data?.onboarding_completed ?? false);
          setSalonName(data?.salon_name || 'Beleza & Gestão');
        });
      
      // Fetch notifications
      const fetchNotifs = async () => {
        const { data } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false });
        if (data) setNotifications(data);
      };
      fetchNotifs();
    } else {
      setOnboardingCompleted(null);
    }
  }, [user]);

  const markNotificationRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);
    if (!error) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }
  };

  const handleOpenReceipt = (apt: Appointment) => {
    setSelectedReceipt(apt);
    setIsReceiptOpen(true);
  };

  const openAddExpense = () => {
    setModalType('expense');
    setModalShowTabs(false);
    setIsModalOpen(true);
  };

  const handleSaveExpense = async () => {
    if (!user) return;
    const { error } = await supabase.from('expenses').insert({
      user_id: user.id,
      description: expenseDesc,
      amount: parseFloat(expenseAmount),
      category: expenseCategory,
      date: new Date().toISOString().split('T')[0]
    });

    if (!error) {
      setIsModalOpen(false);
      setExpenseDesc('');
      setExpenseAmount('');
      setRefreshKey(prev => prev + 1);
    } else {
      alert(error.message);
    }
  };

  if (loading || (user && onboardingCompleted === null)) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center transition-colors">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Onboarding onComplete={() => setOnboardingCompleted(true)} isDarkMode={isDarkMode} />;
  }

  if (!onboardingCompleted) {
    return <Onboarding onComplete={() => setOnboardingCompleted(true)} isDarkMode={isDarkMode} />;
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-background-dark' : 'bg-background-light'} transition-colors font-sans overflow-x-hidden selection:bg-primary/20`}>
      <Navigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onNewRecord={() => {
          setModalType('appointment');
          setModalShowTabs(false);
          setIsModalOpen(true);
        }}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />

      <main className="md:ml-64 pb-24 transition-all duration-300">
        <div className="max-w-7xl mx-auto md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              {activeTab === 'dashboard' && (
              <div key={`dash-${refreshKey}`}>
                <Dashboard 
                  user={user} 
                  isDarkMode={isDarkMode} 
                  onSelectApt={handleOpenReceipt}
                  onOpenNotifications={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  unreadCount={notifications.filter(n => !n.read).length}
                />
              </div>
              )}
              {activeTab === 'agenda' && (
                <Agenda 
                  user={user} 
                  isDarkMode={isDarkMode} 
                  onEdit={(apt) => {
                    setEditingAppointment(apt);
                    setModalType('appointment');
                    setModalShowTabs(false);
                    setIsModalOpen(true);
                  }}
                />
              )}
              {activeTab === 'finances' && (
              <div key={`fin-${refreshKey}`}>
                <FinanceScreen 
                  user={user} 
                  isDarkMode={isDarkMode} 
                  onOpenAddExpense={openAddExpense} 
                />
              </div>
              )}
              {activeTab === 'services' && <Services user={user} isDarkMode={isDarkMode} onAdd={() => { setModalType('service'); setModalShowTabs(false); setIsModalOpen(true); }} />}
              {activeTab === 'clients' && <Clients user={user} isDarkMode={isDarkMode} onAdd={() => { setModalType('client'); setModalShowTabs(false); setIsModalOpen(true); }} />}
              {activeTab === 'settings' && <SettingsScreen user={user} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <NewRecordModal 
        isOpen={isModalOpen && modalType !== 'expense'} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingAppointment(null);
        }} 
        user={user}
        editingAppointment={editingAppointment}
        showTabs={modalShowTabs}
        onSave={() => {
          refreshFinance();
        }}
        isDarkMode={isDarkMode}
      />

      {isModalOpen && modalType === 'expense' && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsModalOpen(false)}
            className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-lg bg-white dark:bg-surface-dark rounded-[32px] p-8 shadow-2xl transition-colors"
          >
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8">Nova Despesa</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Descrição</label>
                <input 
                  type="text" 
                  placeholder="Ex: Aluguel, Produtos..." 
                  value={expenseDesc}
                  onChange={e => setExpenseDesc(e.target.value)}
                  className="w-full h-14 px-5 rounded-2xl bg-slate-50 dark:bg-background-dark border border-slate-100 dark:border-border-dark outline-none focus:border-primary transition-all dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Valor</label>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    value={expenseAmount}
                    onChange={e => setExpenseAmount(e.target.value)}
                    className="w-full h-14 px-5 rounded-2xl bg-slate-50 dark:bg-background-dark border border-slate-100 dark:border-border-dark outline-none focus:border-primary transition-all dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Categoria</label>
                  <select 
                    value={expenseCategory}
                    onChange={e => setExpenseCategory(e.target.value)}
                    className="w-full h-14 px-5 rounded-2xl bg-slate-50 dark:bg-background-dark border border-slate-100 dark:border-border-dark outline-none focus:border-primary transition-all dark:text-white"
                  >
                    <option value="Aluguel">Aluguel</option>
                    <option value="Produtos">Produtos</option>
                    <option value="Serviços">Serviços</option>
                    <option value="Salários">Salários</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>
              <button 
                onClick={handleSaveExpense}
                className="w-full bg-primary text-white font-bold h-16 rounded-2xl shadow-lg shadow-primary/20 text-lg mt-4 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Salvar Despesa
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <ReceiptModal 
        isOpen={isReceiptOpen} 
        onClose={() => setIsReceiptOpen(false)} 
        appointment={selectedReceipt}
        isDarkMode={isDarkMode}
        salonName={salonName}
      />

      <NotificationOverlay 
        isOpen={isNotificationsOpen} 
        onClose={() => setIsNotificationsOpen(false)} 
        notifications={notifications}
        onMarkRead={markNotificationRead}
      />
    </div>
  );
}

export default App;
