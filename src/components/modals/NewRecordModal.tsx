import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Users, 
  Scissors, 
  Plus, 
  Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { Client, Service, Appointment } from '../../types';
import { User } from '@supabase/supabase-js';

const maskPhone = (value: string) => {
  if (!value) return "";
  value = value.replace(/\D/g, "");
  value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
  value = value.replace(/(\d{5})(\d)/, "$1-$2");
  return value.slice(0, 15);
};

interface NewRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSave: () => void;
  initialType?: 'appointment' | 'client' | 'service';
  showTabs?: boolean;
  isDarkMode: boolean;
  editingAppointment?: Appointment | null;
  editingService?: Service | null;
  editingClient?: Client | null;
}

const NewRecordModal: React.FC<NewRecordModalProps> = ({ 
  isOpen, 
  onClose, 
  user, 
  onSave, 
  initialType = 'appointment', 
  showTabs = true,
  isDarkMode,
  editingAppointment,
  editingService,
  editingClient
}) => {
  const [type, setType] = useState<'appointment' | 'client' | 'service'>(
    editingAppointment ? 'appointment' : (editingService ? 'service' : (editingClient ? 'client' : initialType))
  );
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
  const [newClient, setNewClient] = useState({ 
    name: editingClient?.name || '', 
    phone: editingClient?.phone || '' 
  });
  
  // Service form
  const [newService, setNewService] = useState({ 
    name: editingService?.name || '', 
    price: editingService?.price?.toString() || '', 
    duration: editingService?.duration?.toString() || '60', 
    category: editingService?.category || 'Cabelo' 
  });

  useEffect(() => {
    if (isOpen) {
      if (editingAppointment) {
        setType('appointment');
        setPaymentMethod(editingAppointment.payment_method || 'Dinheiro');
        setClientId(editingAppointment.client_id.toString());
        setServiceId(editingAppointment.service_id.toString());
        setDate(editingAppointment.date);
        setTime(editingAppointment.time);
      } else if (editingService) {
        setType('service');
        setNewService({
          name: editingService.name,
          price: editingService.price.toString(),
          duration: editingService.duration.toString(),
          category: editingService.category
        });
      } else if (editingClient) {
        setType('client');
        setNewClient({
          name: editingClient.name,
          phone: editingClient.phone || ''
        });
      } else {
        setType(initialType);
        setPaymentMethod('Dinheiro');
        setClientId('');
        setServiceId('');
        setDate(new Date().toISOString().split('T')[0]);
        setTime('10:00');
        setNewClient({ name: '', phone: '' });
      }
      supabase.from('services').select('*').eq('user_id', user.id).then(({ data }) => setServices(data || []));
      supabase.from('clients').select('*').eq('user_id', user.id).order('name').then(({ data }) => setClients(data || []));
    }
  }, [isOpen, initialType, editingAppointment, editingService, editingClient, user]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      if (type === 'appointment') {
        if (!serviceId) throw new Error("Por favor, selecione um serviço.");
        if (!date || !time) throw new Error("Por favor, informe data e horário.");

        let cid = clientId;
        
        if ((!cid || cid === 'new') && clientName) {
          const { data: newC } = await supabase.from('clients').insert({ name: clientName, user_id: user.id }).select().single();
          cid = newC?.id?.toString() || '';
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
        if (!newClient.name || !newClient.phone) throw new Error("Nome e telefone são obrigatórios.");
        
        if (editingClient) {
          const { error } = await supabase.from('clients').update(newClient).eq('id', editingClient.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('clients').insert({ ...newClient, user_id: user.id });
          if (error) throw error;
        }
      } else if (type === 'service') {
        if (!newService.name || !newService.price) throw new Error("Nome e preço são obrigatórios.");
        const serviceData = { 
          ...newService, 
          user_id: user.id,
          price: parseFloat(newService.price),
          duration: parseInt(newService.duration)
        };

        if (editingService) {
          const { error } = await supabase.from('services').update(serviceData).eq('id', editingService.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('services').insert(serviceData);
          if (error) throw error;
        }
      }
      
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onSave();
        onClose();
      }, 2000);
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
            {type === 'appointment' ? (editingAppointment ? 'Editar Agendamento' : 'Novo Agendamento') : 
             type === 'client' ? (editingClient ? 'Editar Cliente' : 'Nova Cliente') : 
             (editingService ? 'Editar Serviço' : 'Novo Serviço')}
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
                      placeholder="(00) 00000-0000" 
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
            className="w-full bg-primary text-white font-bold h-16 rounded-2xl shadow-lg shadow-primary/20 text-lg mt-8 disabled:opacity-50 hover:bg-primary/90 transition-all"
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
                {type === 'appointment' ? <Calendar size={48} /> : type === 'client' ? <Users size={48} /> : <Scissors size={48} />}
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                {type === 'appointment' ? 'Agendamento Realizado!' : type === 'client' ? 'Cliente Cadastrada!' : 'Serviço Salvo!'}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                {type === 'appointment' ? 'Tudo certo para o atendimento.' : 'As informações foram salvas com sucesso.'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default NewRecordModal;
