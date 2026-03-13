export interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  last_visit?: string;
  status: 'active' | 'inactive';
  is_vip: boolean;
}

export interface Service {
  id: number;
  name: string;
  category: string;
  duration: number;
  price: number;
  image_url?: string;
}

export interface Appointment {
  id: number;
  client_id: number;
  service_id: number;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  professional_name: string;
  client_name?: string;
  service_name?: string;
  price?: number;
  payment_method?: string;
}

export interface DashboardStats {
  revenue: number;
  expenses: number;
  appointmentsToday: number;
  totalClients: number;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  created_at: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}
