import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Users, 
  Edit3, 
  UserPlus, 
  Phone, 
  Calendar, 
  Star,
  Trash2,
  Clock,
  X,
  Check,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { Client, Appointment } from '../../types';
import { formatDate, formatTime } from '../../utils/format';

interface ClientsProps {
  userId: string;
  onAdd: () => void;
  onEdit: (client: Client) => void;
  refreshKey: number;
}

const Clients: React.FC<ClientsProps> = ({ onAdd, onEdit, refreshKey }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedClientForHistory, setSelectedClientForHistory] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [clientHistory, setClientHistory] = useState<Appointment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchClients = async () => {
    setLoading(true);
    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (clientsError) {
      console.error("Error fetching clients:", clientsError);
      setLoading(false);
      return;
    }

    if (clientsData && clientsData.length > 0) {
      // Fetch last visits
      const { data: visitsData } = await supabase
        .from('appointments')
        .select('client_id, date')
        .in('client_id', clientsData.map(c => c.id))
        .eq('status', 'completed')
        .order('date', { ascending: false });

      const lastVisitMap: Record<string, string> = {};
      visitsData?.forEach(v => {
        if (!lastVisitMap[v.client_id]) lastVisitMap[v.client_id] = v.date;
      });

      setClients(clientsData.map(c => ({
        ...c,
        last_visit: lastVisitMap[c.id] || null
      })));
    } else {
      setClients([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, [refreshKey]);

  const deleteClient = (client: Client) => {
    setClientToDelete(client);
  };

  const confirmDelete = async () => {
    if (!clientToDelete) return;
    
    setLoading(true);
    const { error } = await supabase.from('clients').delete().eq('id', clientToDelete.id);
    
    if (error) {
      if (error.code === '23503') {
        alert("Não é possível excluir esta cliente pois ela possui agendamentos registrados.");
      } else {
        alert("Erro ao excluir cliente: " + error.message);
      }
    } else {
      fetchClients();
    }
    setClientToDelete(null);
    setLoading(false);
  };

  const fetchHistory = async (client: Client) => {
    setSelectedClientForHistory(client);
    setHistoryLoading(true);
    
    const { data, error } = await supabase
      .from('appointments')
      .select('*, service:service_id(name, price)')
      .eq('client_id', client.id)
      .order('date', { ascending: false })
      .order('time', { ascending: false });

    if (error) {
      console.error("Error fetching history:", error);
    } else {
      setClientHistory(data.map((a: any) => ({
        ...a,
        service_name: a.service?.name,
        price: a.service?.price
      })));
    }
    setHistoryLoading(false);
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm)
  );

  return (
    <div className="pb-24">
      <div className="bg-white dark:bg-surface-dark p-6 border-b border-slate-100 dark:border-border-dark flex justify-between items-center transition-colors">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Clientes</h2>
        <button 
          onClick={onAdd}
          className="bg-primary text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <UserPlus size={18} /> Adicionar Cliente
        </button>
      </div>

      <div className="p-6">
        <div className="relative mb-8">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            placeholder="Buscar por nome ou WhatsApp..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full h-14 pl-12 pr-4 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-2xl outline-none focus:border-primary transition-all dark:text-white font-medium"
          />
        </div>

        {loading && clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-bold text-sm">Carregando clientes...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client, i) => (
              <motion.div 
                key={client.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white dark:bg-surface-dark p-6 rounded-3xl border border-slate-100 dark:border-border-dark shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="size-16 rounded-2xl bg-primary/5 dark:bg-primary/10 border border-primary/10 flex items-center justify-center text-primary overflow-hidden relative group-hover:bg-primary group-hover:text-white transition-all">
                    <Users size={32} />
                    {client.is_vip && (
                      <div className="absolute top-0 right-0 bg-amber-500 p-0.5 rounded-bl-lg">
                        <Star size={10} fill="white" className="text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors">{client.name}</h4>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Phone size={12} />
                      <span className="text-xs font-bold">{client.phone || '(Sempre)'}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-auto">
                  <div className="bg-slate-50 dark:bg-background-dark p-3 rounded-xl border border-slate-100 dark:border-border-dark">
                    <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Última Visita</p>
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <Calendar size={12} className="text-primary" />
                      <span className="text-xs font-bold">{formatDate(client.last_visit)}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-background-dark p-3 rounded-xl border border-slate-100 dark:border-border-dark">
                    <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Status</p>
                    <div className="flex items-center gap-1.5">
                      <div className={`size-1.5 rounded-full ${client.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300 capitalize">{client.status}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-50 dark:border-border-dark flex gap-2">
                  <button 
                    onClick={() => fetchHistory(client)}
                    className="flex-1 h-10 bg-primary/10 text-primary rounded-xl text-xs font-black hover:bg-primary hover:text-white transition-all uppercase tracking-tighter"
                  >
                    Ver Histórico
                  </button>
                  <button 
                    onClick={() => deleteClient(client)}
                    className="h-10 w-10 flex items-center justify-center bg-rose-50 dark:bg-rose-500/10 text-rose-400 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-xl transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button 
                    onClick={() => onEdit(client)}
                    className="h-10 w-10 flex items-center justify-center bg-slate-50 dark:bg-background-dark text-slate-400 rounded-xl hover:text-primary transition-colors"
                  >
                    <Edit3 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* History Modal */}
      <AnimatePresence>
        {selectedClientForHistory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedClientForHistory(null)}
              className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-surface-dark rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-8 border-b border-slate-100 dark:border-border-dark bg-slate-50/50 dark:bg-background-dark/50">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-2xl bg-primary text-white flex items-center justify-center">
                    <Users size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">{selectedClientForHistory.name}</h3>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{selectedClientForHistory.phone || 'Sem telefone'}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Histórico de Atendimentos</h4>
                
                {historyLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="size-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs text-slate-400 font-bold uppercase">Buscando histórico...</p>
                  </div>
                ) : clientHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="size-12 bg-slate-50 dark:bg-background-dark rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                      <Calendar size={20} />
                    </div>
                    <p className="text-sm font-bold text-slate-500 italic">Nenhum atendimento registrado.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {clientHistory.map((apt) => (
                      <div key={apt.id} className="p-4 rounded-2xl border border-slate-100 dark:border-border-dark bg-white dark:bg-surface-dark shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-black text-slate-900 dark:text-white">{apt.service_name}</h5>
                          <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${
                            apt.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                            apt.status === 'pending' ? 'bg-blue-100 text-blue-600' :
                            apt.status === 'cancelled' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {apt.status === 'completed' ? 'Finalizado' :
                             apt.status === 'pending' ? 'Pendente' :
                             apt.status === 'cancelled' ? 'Cancelado' : apt.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={14} className="text-primary" />
                            {formatDate(apt.date)}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock size={14} className="text-primary" />
                            {formatTime(apt.time)}
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-50 dark:border-border-dark flex justify-between items-center text-xs">
                          <span className="text-slate-400 uppercase font-black tracking-tighter">Valor</span>
                          <span className="text-slate-900 dark:text-white font-black">R$ {apt.price?.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-50 dark:bg-background-dark">
                <button 
                  onClick={() => setSelectedClientForHistory(null)}
                  className="w-full h-14 bg-white dark:bg-surface-dark text-slate-600 dark:text-slate-300 font-black rounded-2xl border border-slate-200 dark:border-border-dark shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all uppercase tracking-widest text-sm"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {clientToDelete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setClientToDelete(null)}
              className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-surface-dark rounded-[32px] shadow-2xl overflow-hidden p-8 text-center"
            >
              <div className="size-20 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Trash2 size={40} />
              </div>
              
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Excluir Cliente?</h3>
              <p className="text-sm font-bold text-slate-500 mb-8">
                Tem certeza que deseja excluir a cliente <span className="text-slate-900 dark:text-white font-black">"{clientToDelete.name}"</span>? Esta ação não pode ser desfeita.
              </p>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={confirmDelete}
                  disabled={loading}
                  className="w-full h-14 bg-rose-500 text-white font-black rounded-2xl shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>Sim, Excluir</>
                  )}
                </button>
                <button 
                  onClick={() => setClientToDelete(null)}
                  disabled={loading}
                  className="w-full h-14 bg-slate-50 dark:bg-background-dark text-slate-500 dark:text-slate-400 font-black rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all uppercase tracking-widest text-sm"
                >
                  Não, Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Clients;
