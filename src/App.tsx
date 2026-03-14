import React, { useState, useEffect, Suspense, lazy } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Lock } from 'lucide-react';
import { supabase } from './lib/supabase';
import { Appointment, Service, Notification as AppNotification } from './types';
import { User } from '@supabase/supabase-js';

// Layout & Modals
import Navigation from './components/layout/Navigation';
import NewRecordModal from './components/modals/NewRecordModal';
import ReceiptModal from './components/modals/ReceiptModal';
import NotificationOverlay from './components/modals/NotificationOverlay';

// Screens (Lazy Loaded)
const Dashboard = lazy(() => import('./components/screens/Dashboard'));
const Agenda = lazy(() => import('./components/screens/Agenda'));
const FinanceScreen = lazy(() => import('./components/screens/FinanceScreen'));
const Services = lazy(() => import('./components/screens/Services'));
const Clients = lazy(() => import('./components/screens/Clients'));
const SettingsScreen = lazy(() => import('./components/screens/SettingsScreen'));
const Onboarding = lazy(() => import('./components/screens/Onboarding'));
const PublicBooking = lazy(() => import('./components/screens/PublicBooking'));

const LoadingScreen = () => (
  <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4">
    <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    <p className="text-slate-400 font-bold animate-pulse">Carregando...</p>
  </div>
);

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modals state
  const [isNewRecordOpen, setIsNewRecordOpen] = useState(false);
  const [newRecordInitialType, setNewRecordInitialType] = useState<'appointment' | 'client' | 'service'>('appointment');
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [newRecordShowTabs, setNewRecordShowTabs] = useState(true);
  
  const [selectedAppointmentForReceipt, setSelectedAppointmentForReceipt] = useState<Appointment | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) setShowOnboarding(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session) {
        setShowOnboarding(false);
      }
      
      if (event === 'PASSWORD_RECOVERY') {
        setIsResettingPassword(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);


  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const triggerRefresh = () => setRefreshKey(prev => prev + 1);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowOnboarding(true);
  };

  const handleEditApt = (apt: Appointment) => {
    setEditingAppointment(apt);
    setNewRecordInitialType('appointment');
    setIsNewRecordOpen(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setNewRecordInitialType('service');
    setIsNewRecordOpen(true);
  };

  // Prevent Public Booking from showing the rest of the app
  if (window.location.pathname.startsWith('/booking')) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <PublicBooking />
      </Suspense>
    );
  }

  if (showOnboarding && !user) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <Onboarding onComplete={() => setShowOnboarding(false)} />
      </Suspense>
    );
  }

  const renderContent = () => {
    if (!user) return <LoadingScreen />;

    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            user={user} 
            isDarkMode={isDarkMode} 
            refreshKey={refreshKey}
            onSelectApt={(apt) => {
              setSelectedAppointmentForReceipt(apt);
              setIsReceiptOpen(true);
            }}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            unreadCount={notifications.filter(n => !n.read).length}
          />
        );
      case 'agenda':
        return <Agenda userId={user.id} onEditApt={handleEditApt} refreshKey={refreshKey} />;
      case 'finances':
        return <FinanceScreen user={user} isDarkMode={isDarkMode} refreshKey={refreshKey} />;
      case 'services':
        return (
          <Services 
            userId={user.id} 
            onEdit={handleEditService} 
            onAdd={() => {
              setEditingService(null);
              setNewRecordInitialType('service');
              setNewRecordShowTabs(false);
              setIsNewRecordOpen(true);
            }} 
            refreshKey={refreshKey} 
          />
        );
      case 'clients':
        return (
          <Clients 
            userId={user.id} 
            onAdd={() => {
              setNewRecordInitialType('client');
              setNewRecordShowTabs(false);
              setIsNewRecordOpen(true);
            }} 
            refreshKey={refreshKey} 
          />
        );
      case 'settings':
        return (
          <SettingsScreen 
            user={user} 
            isDarkMode={isDarkMode} 
            toggleDarkMode={() => setIsDarkMode(!isDarkMode)} 
            onLogout={handleLogout}
            salonName="Glow Studio"
          />
        );
      default:
        return <Dashboard user={user} isDarkMode={isDarkMode} refreshKey={refreshKey} onSelectApt={() => {}} onOpenNotifications={() => {}} unreadCount={0} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background-dark transition-colors font-sans selection:bg-primary selection:text-white">
      <div className="md:pl-64 min-h-screen flex flex-col">
        <main className="flex-1 max-w-7xl mx-auto w-full relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="h-full"
            >
              <Suspense fallback={<LoadingScreen />}>
                {renderContent()}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>

        <Navigation 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onNewRecord={() => {
            setEditingAppointment(null);
            setEditingService(null);
            setNewRecordInitialType('appointment');
            setNewRecordShowTabs(true);
            setIsNewRecordOpen(true);
          }}
          isDarkMode={isDarkMode}
          toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        />
      </div>

      {/* Modals */}
      <Suspense fallback={null}>
        <NewRecordModal 
          isOpen={isNewRecordOpen}
          onClose={() => {
            setIsNewRecordOpen(false);
            setEditingAppointment(null);
            setEditingService(null);
          }}
          user={user}
          onSave={triggerRefresh}
          initialType={newRecordInitialType}
          showTabs={newRecordShowTabs}
          isDarkMode={isDarkMode}
          editingAppointment={editingAppointment}
          editingService={editingService}
        />
        
        <ReceiptModal 
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          appointment={selectedAppointmentForReceipt}
          isDarkMode={isDarkMode}
          salonName="Glow Studio"
        />

        <NotificationOverlay 
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          notifications={notifications}
          onMarkRead={(id) => setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))}
        />

        {/* Password Reset Modal */}
        <AnimatePresence>
          {isResettingPassword && (
            <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative w-full max-w-md bg-white dark:bg-surface-dark p-8 md:p-10 rounded-[40px] shadow-2xl text-center"
              >
                <div className="size-20 bg-primary rounded-3xl flex items-center justify-center text-white mx-auto mb-8 shadow-xl shadow-primary/30">
                  <Lock size={32} />
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Nova Senha</h2>
                <p className="text-slate-500 dark:text-slate-400 font-bold mb-8">Digite sua nova senha abaixo para recuperar o acesso.</p>
                
                <input 
                  type="password" 
                  placeholder="Sua nova senha" 
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full h-16 px-6 rounded-2xl bg-slate-50 dark:bg-background-dark border border-slate-100 dark:border-border-dark outline-none focus:border-primary transition-all dark:text-white font-bold mb-6"
                />

                <button 
                  onClick={async () => {
                    const { error } = await supabase.auth.updateUser({ password: newPassword });
                    if (error) {
                      alert(error.message);
                    } else {
                      alert('Senha atualizada com sucesso!');
                      setIsResettingPassword(false);
                      setNewPassword('');
                    }
                  }}
                  className="w-full h-16 bg-primary text-white rounded-[24px] font-black text-lg shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                >
                  Atualizar Senha
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </Suspense>
    </div>
  );
}

export default App;
