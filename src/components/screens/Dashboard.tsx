import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Search, 
  Bell, 
  TrendingUp, 
  UserCircle,
  Users,
  Wallet,
  FileText
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { Appointment, DashboardStats } from '../../types';
import { User } from '@supabase/supabase-js';
import { formatDate, formatTime } from '../../utils/format';

interface DashboardProps {
  user: User;
  isDarkMode: boolean;
  refreshKey: number;
  onSelectApt: (apt: Appointment) => void;
  onOpenNotifications: () => void;
  unreadCount: number;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  user, 
  refreshKey,
  onSelectApt, 
  onOpenNotifications, 
  unreadCount 
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [chartData, setChartData] = useState<{ labels: string[], values: number[], rawValues: number[] }>({
    labels: ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'],
    values: [0, 0, 0, 0, 0, 0, 0],
    rawValues: [0, 0, 0, 0, 0, 0, 0]
  });

  useEffect(() => {
    const fetchData = async () => {
      // Fetch Profile
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(prof);

      // Fetch Revenue (Confirmed Appointments)
      const { data: confirmedApts } = await supabase
        .from('appointments')
        .select('*, service:service_id(price)')
        .eq('status', 'completed');
      
      const revenue = confirmedApts?.reduce((acc, apt: any) => acc + (apt.service?.price || 0), 0) || 0;
      
      // Fetch Expenses
      const { data: expData } = await supabase
        .from('expenses')
        .select('amount');
      
      const expenses = expData?.reduce((acc, exp) => acc + exp.amount, 0) || 0;

      const today = new Date().toISOString().split('T')[0];
      const { data: aptsToday } = await supabase
        .from('appointments')
        .select('*, client:client_id(name), service:service_id(name, price)')
        .eq('date', today);
      
      const { data: totalCl } = await supabase.from('clients').select('*');

      setStats({
        revenue,
        expenses,
        appointmentsToday: aptsToday?.length || 0,
        totalClients: totalCl?.length || 0
      });

      if (aptsToday) {
        setAppointments(aptsToday.map((a: any) => ({
          ...a,
          client_name: a.client?.name,
          service_name: a.service?.name,
          price: a.service?.price
        })));
      }

      // Fetch Weekly Performance Data (Last 7 days)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      const startDateStr = startDate.toISOString().split('T')[0];

      // Fetch completed appointments for revenue
      const { data: weeklyApts } = await supabase
        .from('appointments')
        .select('date, service:service_id(price)')
        .eq('status', 'completed')
        .gte('date', startDateStr);
      
      // Fetch expenses for the same period
      const { data: weeklyExpenses } = await supabase
        .from('expenses')
        .select('date, amount')
        .gte('date', startDateStr);
      
      const chartValues = Array(7).fill(0);
      const daysAbbr = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
      const chartLabels: string[] = [];

      for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const dStr = d.toISOString().split('T')[0];
        chartLabels.push(daysAbbr[d.getDay()]);
        
        const dayRevenue = weeklyApts?.filter(a => a.date === dStr)
          .reduce((sum, a: any) => sum + (a.service?.price || 0), 0) || 0;
        
        const dayExpense = weeklyExpenses?.filter(e => e.date === dStr)
          .reduce((sum, e) => sum + e.amount, 0) || 0;
        
        // Net Profit for the day
        chartValues[i] = dayRevenue - dayExpense;
      }
      
      const maxVal = Math.max(...chartValues.map(Math.abs), 1);
      setChartData({
        labels: chartLabels,
        values: chartValues.map(v => (v / maxVal) * 100),
        rawValues: chartValues
      });
    };

    fetchData();
  }, [user.id, refreshKey]);

  const netProfit = (stats?.revenue || 0) - (stats?.expenses || 0);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

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
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">Bem-vinda{profile?.salon_name ? ` ${profile.salon_name}` : ''},</p>
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
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="p-4 md:p-8 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
      >
        {[
          { label: 'Lucro Líquido', value: `R$ ${netProfit.toFixed(2)}`, icon: Wallet, trend: 'Net', isPrimary: true },
          { label: 'Faturamento', value: `R$ ${stats?.revenue.toFixed(2) || '0.00'}`, icon: TrendingUp, trend: 'Bruto' },
          { label: 'Hoje na Agenda', value: `${stats?.appointmentsToday} Serviços`, icon: Calendar, trend: 'Próximos' },
          { label: 'Clientes Ativos', value: stats?.totalClients, icon: Users, trend: 'Base total' },
        ].map((statItem, i) => (
          <motion.div 
            key={i} 
            variants={item}
            className={`p-5 rounded-xl shadow-sm border transition-all hover:-translate-y-1 ${statItem.isPrimary ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white dark:bg-surface-dark border-slate-100 dark:border-border-dark'}`}
          >
            <div className={`flex items-center gap-2 mb-1 ${statItem.isPrimary ? 'text-white/80' : 'text-primary'}`}>
              <statItem.icon size={18} />
              <p className={`text-sm font-medium ${statItem.isPrimary ? 'text-white/80' : 'text-slate-600 dark:text-slate-400'}`}>{statItem.label}</p>
            </div>
            <h3 className={`text-xl md:text-2xl font-extrabold leading-none truncate ${statItem.isPrimary ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{statItem.value}</h3>
            <div className="flex items-center gap-1 mt-1">
              <p className={`text-[10px] font-bold uppercase tracking-wider ${statItem.isPrimary ? 'text-white/60' : 'text-slate-400 dark:text-slate-500'}`}>{statItem.trend}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Chart Placeholder */}
      <motion.div animate={{ opacity: 1, scale: 1 }} initial={{ opacity: 0, scale: 0.95 }} className="px-4 py-2">
        <div className="bg-white dark:bg-surface-dark p-5 rounded-xl shadow-sm border border-slate-100 dark:border-border-dark transition-colors">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-slate-900 dark:text-white text-base font-bold">Desempenho Semanal</h3>
            <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase">Últimos 7 dias</span>
          </div>
          <div className="flex items-end justify-between h-32 px-1">
            {chartData.values.map((height, i) => (
              <div key={i} className="flex flex-col items-center gap-2 flex-1 group/bar relative">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[8px] px-1.5 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-10 font-bold">
                  R$ {chartData.rawValues[i].toFixed(2)}
                </div>
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(Math.abs(height), 5)}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  className={`w-full max-w-[12px] rounded-t-full ${chartData.rawValues[i] > 0 ? 'bg-primary' : chartData.rawValues[i] < 0 ? 'bg-rose-500' : 'bg-slate-100 dark:bg-background-dark'}`} 
                ></motion.div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                  {chartData.labels[i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Appointments List */}
      <div className="px-4 md:px-8 pt-6 pb-2 flex justify-between items-center">
        <h2 className="text-slate-900 dark:text-white text-lg md:text-xl font-bold">Próximos de Hoje</h2>
        <button className="text-primary text-sm font-bold hover:underline transition-colors">Ver todos</button>
      </div>
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="px-4 md:px-8 space-y-3 md:space-y-4 mb-8"
      >
        {appointments.length === 0 ? (
          <div className="py-8 text-center text-slate-400 bg-white dark:bg-surface-dark rounded-xl border border-slate-100 dark:border-border-dark">
            Nenhum agendamento para hoje.
          </div>
        ) : (
          appointments.slice(0, 3).map((apt) => (
            <motion.div 
              key={apt.id} 
              variants={item}
              onClick={() => onSelectApt(apt)}
              className="flex flex-col md:flex-row md:items-center gap-4 p-4 bg-white dark:bg-surface-dark rounded-xl border border-slate-100 dark:border-border-dark shadow-sm transition-all hover:shadow-md cursor-pointer group active:scale-[0.98]"
            >
              <div className="flex items-center md:flex-col md:justify-center min-w-[50px] md:border-r border-slate-100 dark:border-border-dark md:pr-4 gap-4 md:gap-0">
                <p className="text-slate-900 dark:text-white font-bold text-base md:text-lg group-hover:text-primary transition-colors">{formatTime(apt.time)}</p>
                <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase hidden md:block">Hoje</p>
              </div>
              <div className="flex-1 border-t border-slate-50 dark:border-border-dark pt-3 md:border-0 md:pt-0">
                <p className="text-slate-900 dark:text-white font-bold text-sm md:text-base group-hover:text-primary transition-colors">{apt.service_name}</p>
                <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm">{apt.client_name}</p>
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
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
};

export default Dashboard;
