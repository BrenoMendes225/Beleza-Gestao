import React, { useState, useEffect } from 'react';
import { 
  Scissors, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Star,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { Service } from '../../types';

const maskPhone = (value: string) => {
  if (!value) return "";
  value = value.replace(/\D/g, "");
  if (value.length <= 10) {
    // (99) 9999-9999
    value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
    value = value.replace(/(\d{4})(\d)/, "$1-$2");
  } else {
    // (99) 9 9999-9999
    value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
    value = value.replace(/(\d{1})(\d{4})(\d)/, "$2 $3-$4"); // This was wrong in previous logic
    // Refined mask for 11 digits
    value = value.replace(/^(\d{2})(\d{1})(\d{4})(\d{4})$/, "($1) $2 $3-$4");
  }
  return value.slice(0, 16);
};

// Simplified mask that works for both
const applyPhoneMask = (v: string) => {
  v = v.replace(/\D/g, "");
  if (v.length > 11) v = v.slice(0, 11);
  if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
  if (v.length > 9) { // (99) 9 9999-9999
    v = `${v.slice(0, 9)}-${v.slice(9)}`;
  } else if (v.length > 4) { // (99) 9999
    v = `${v.slice(0, 10)}`; // just wait for more digits or fallback
  }
  return v;
};

// Let's use a more robust one
const robustMask = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .slice(0, 14);
  }
  return digits
    .replace(/(\d{2})(\d{1})(\d{4})(\d)/, "($1) $2 $3-$4")
    .slice(0, 16);
};

const PublicBooking: React.FC = () => {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [clientInfo, setClientInfo] = useState({ name: '', phone: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [salonInfo, setSalonInfo] = useState<any>({
    name: "Glow Studio",
    address: "Rua das Flores, 123 - Centro",
    rating: 4.9,
    reviews: 128
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ownerId = params.get('s');

    if (ownerId) {
      // Fetch Salon Profile
      supabase.from('profiles')
        .select('*')
        .eq('id', ownerId)
        .single()
        .then(({ data }) => {
          if (data) {
            setSalonInfo({
              name: data.salon_name || "Glow Studio",
              address: data.address || "Endereço não informado",
              rating: 4.9,
              reviews: 128
            });
          }
        });

      // Fetch Services for this salon
      supabase.from('services')
        .select('*')
        .eq('user_id', ownerId)
        .then(({ data }) => setServices(data || []));
    } else {
      // Fallback for demo or invalid link
      supabase.from('services').select('*').limit(10).then(({ data }) => setServices(data || []));
    }
  }, []);

  useEffect(() => {
    if (selectedDate) {
      // Mock de horários disponíveis
      setAvailableSlots(['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00']);
    }
  }, [selectedDate]);

  const handleBooking = async () => {
    setLoading(true);
    try {
      // 1. Criar ou encontrar cliente
      let clientId: number;
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('phone', clientInfo.phone)
        .single();

      if (existingClient) {
        clientId = existingClient.id;
      } else {
        const params = new URLSearchParams(window.location.search);
        const ownerId = params.get('s');

        const { data: newClient, error: clientErr } = await supabase
          .from('clients')
          .insert({ 
            user_id: ownerId, // Associar ao dono do salão
            name: clientInfo.name, 
            phone: clientInfo.phone, 
            email: clientInfo.email,
            status: 'active',
            is_vip: false
          })
          .select()
          .single();
        
        if (clientErr || !newClient) throw new Error(clientErr?.message || 'Falha ao cadastrar cliente.');
        clientId = newClient.id;
      }

      // 2. Criar agendamento
      const params = new URLSearchParams(window.location.search);
      const ownerId = params.get('s');

      const { error } = await supabase.from('appointments').insert({
        user_id: ownerId, // Associar ao dono do salão
        client_id: clientId,
        service_id: selectedService?.id,
        date: selectedDate,
        time: selectedTime,
        status: 'pending'
      });

      if (error) throw error;

      // 3. Notificar o dono do salão
      if (ownerId) {
        await supabase.from('notifications').insert({
          user_id: ownerId,
          title: 'Novo Agendamento! 📅',
          message: `${clientInfo.name} agendou ${selectedService?.name} para o dia ${selectedDate} às ${selectedTime}`,
          read: false
        });

        // Browser Notification (Opcional - Tentativa)
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Novo Agendamento!", {
            body: `${clientInfo.name} agendou para ${selectedDate} às ${selectedTime}`,
            icon: '/path-to-your-icon.png' // Idealmente o ícone do app
          });
        }
      }

      setConfirmed(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  if (confirmed) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <div className="size-24 bg-emerald-500 rounded-full flex items-center justify-center text-white mx-auto mb-8 shadow-2xl shadow-emerald-500/30">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4">Agendamento Realizado!</h2>
          <p className="text-slate-500 font-bold mb-8">
            Tudo certo, {clientInfo.name.split(' ')[0]}! Enviamos os detalhes para seu WhatsApp.
          </p>
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-8 text-left space-y-4">
            <div className="flex justify-between border-b border-slate-200 pb-3">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Serviço</span>
              <span className="text-slate-900 font-black">{selectedService?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Data e Hora</span>
              <span className="text-slate-900 font-black">{selectedDate} às {selectedTime}</span>
            </div>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="w-full h-16 bg-slate-900 text-white rounded-3xl font-black shadow-xl"
          >
            Fazer outro agendamento
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      {/* Dynamic Header */}
      <header className="w-full bg-white border-b border-slate-100 p-6 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="size-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Scissors size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-none">{salonInfo.name}</h1>
              <div className="flex items-center gap-1 mt-1">
                <Star size={12} className="text-amber-500 fill-amber-500" />
                <span className="text-xs font-black text-slate-800">{salonInfo.rating}</span>
                <span className="text-xs font-bold text-slate-400">({salonInfo.reviews} avaliações)</span>
              </div>
            </div>
          </div>
          <div className="hidden md:flex flex-col items-end">
             <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
               <MapPin size={14} className="text-primary" />
               {salonInfo.address.split('-')[0]}
             </div>
          </div>
        </div>
      </header>

      <main className="w-full max-w-2xl p-4 md:p-8 flex-1">
        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${step >= i ? 'bg-primary' : 'bg-slate-200'}`}></div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={20} className="text-primary" />
                <h2 className="text-2xl font-black text-slate-900">O que vamos fazer hoje?</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => { setSelectedService(service); nextStep(); }}
                    className={`p-6 rounded-[32px] border-2 text-left transition-all group ${
                      selectedService?.id === service.id 
                        ? 'border-primary bg-primary/5 shadow-lg shadow-primary/5' 
                        : 'border-white bg-white hover:border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-2xl group-hover:scale-110 transition-transform ${selectedService?.id === service.id ? 'bg-primary text-white' : 'bg-slate-50 text-slate-400'}`}>
                        <Scissors size={24} />
                      </div>
                      <span className="text-xl font-black text-slate-900">R$ {service.price.toFixed(0)}</span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-1">{service.name}</h3>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">{service.category} • {service.duration} min</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <button onClick={prevStep} className="flex items-center gap-2 text-slate-400 font-bold hover:text-primary transition-colors">
                <ChevronLeft size={20} /> Voltar para serviços
              </button>
              
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Calendar size={20} className="text-primary" /> Escolha o dia
                  </h3>
                  <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                    {Array.from({ length: 7 }).map((_, i) => {
                      const d = new Date();
                      d.setDate(d.getDate() + i);
                      const dStr = d.toISOString().split('T')[0];
                      const isSelected = selectedDate === dStr;
                      return (
                        <button
                          key={i}
                          onClick={() => setSelectedDate(dStr)}
                          className={`min-w-[80px] p-4 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all ${
                            isSelected ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-white border-white text-slate-400 hover:border-slate-200'
                          }`}
                        >
                          <span className="text-[10px] uppercase font-black tracking-widest leading-none">
                            {d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                          </span>
                          <span className="text-xl font-black">{d.getDate()}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedDate && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                      <Clock size={20} className="text-primary" /> Horários disponíveis
                    </h3>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                      {availableSlots.map(time => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`p-4 rounded-xl border-2 font-black text-sm transition-all ${
                            selectedTime === time ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white border-white text-slate-600 hover:border-slate-200'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button 
                disabled={!selectedDate || !selectedTime}
                onClick={nextStep}
                className="w-full h-16 bg-slate-900 text-white rounded-3xl font-black shadow-xl disabled:opacity-50 hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                Próximo Passo <ChevronRight size={20} />
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <button onClick={prevStep} className="flex items-center gap-2 text-slate-400 font-bold hover:text-primary transition-colors">
                <ChevronLeft size={20} /> Voltar para o horário
              </button>

              <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
                <h3 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tighter">Seus Dados</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nome Completo</label>
                    <div className="relative">
                      <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input 
                        placeholder="Como podemos te chamar?" 
                        value={clientInfo.name}
                        onChange={e => setClientInfo({...clientInfo, name: e.target.value})}
                        className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-primary transition-all font-bold"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">WhatsApp</label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input 
                        placeholder="(00) 0 0000-0000" 
                        value={clientInfo.phone}
                        onChange={e => setClientInfo({...clientInfo, phone: robustMask(e.target.value)})}
                        className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-primary transition-all font-bold"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">E-mail (Opcional)</label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input 
                        placeholder="seu@email.com" 
                        value={clientInfo.email}
                        onChange={e => setClientInfo({...clientInfo, email: e.target.value})}
                        className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-primary transition-all font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 p-6 rounded-[32px] border border-primary/10">
                <p className="text-xs text-primary font-bold mb-4 flex items-center gap-2">
                  <Sparkles size={14} /> Resumo do Agendamento
                </p>
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-black text-slate-900">{selectedService?.name}</h4>
                    <p className="text-xs font-bold text-slate-500">{selectedDate} às {selectedTime}</p>
                  </div>
                  <p className="text-xl font-black text-primary">R$ {selectedService?.price.toFixed(2)}</p>
                </div>
              </div>

              <button 
                disabled={!clientInfo.name || clientInfo.phone.length < 13 || loading}
                onClick={handleBooking}
                className="w-full h-16 bg-primary text-white rounded-3xl font-black shadow-xl shadow-primary/20 disabled:opacity-50 hover:bg-primary/90 transition-all"
              >
                {loading ? 'Confirmando...' : 'Confirmar Agendamento'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default PublicBooking;
