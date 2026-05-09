// User Types
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'staff' | 'admin';
  avatar?: string;
  status: 'active' | 'inactive' | 'suspended';
  riskScore: number;
  totalIssues: number;
  totalReturns: number;
  lateReturns: number;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

// Kit Types
export interface Kit {
  _id: string;
  name: string;
  category: string;
  description?: string;
  quantity: number;
  available: number;
  issued?: number;
  availabilityPercent?: number;
  image?: string;
  qrCode?: string;
  status: 'active' | 'inactive' | 'maintenance' | 'retired';
  aiPrediction: 'low' | 'medium' | 'high';
  predictedDemand: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  createdAt: string;
  updatedAt: string;
}

export interface KitFilters {
  category?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Transaction Types
export interface Transaction {
  _id: string;
  user: User;
  kit: Kit;
  quantity: number;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'active' | 'returned' | 'overdue';
  condition?: string;
  notes?: string;
  fine?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionFilters {
  status?: string;
  userId?: string;
  kitId?: string;
  startDate?: string;
  endDate?: string;
  isOverdue?: boolean;
  page?: number;
  limit?: number;
}

// Reservation Types
export interface Reservation {
  _id: string;
  user: User;
  kit: Kit;
  quantity: number;
  startDate: string;
  endDate: string;
  purpose: string;
  tournament?: string;
  team?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  approvedBy?: User;
  approvedAt?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Notification Types
export interface Notification {
  _id: string;
  user: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  read: boolean;
  relatedKit?: Kit;
  relatedTransaction?: Transaction;
  createdAt: string;
}

// Analytics Types
export interface DashboardStats {
  totalKits: number;
  totalUsers: number;
  activeTransactions: number;
  overdueTransactions: number;
  monthlyIssues: number;
  monthlyReturns: number;
  lowStockKits: number;
  categoryDistribution: CategoryStat[];
  recentActivity: Activity[];
}

export interface CategoryStat {
  category: string;
  count: number;
  percentage: number;
}

export interface Activity {
  _id: string;
  type: 'issue' | 'return' | 'reservation' | 'alert';
  description: string;
  user: User;
  kit?: Kit;
  createdAt: string;
}

// AI Types
export interface DemandForecast {
  kit_id: string;
  kit_name: string;
  forecast: ForecastDay[];
  summary: {
    total_predicted_demand: number;
    avg_daily_demand: number;
    peak_demand: number;
    confidence: 'high' | 'medium' | 'low';
  };
  recommendation: string;
}

export interface ForecastDay {
  date: string;
  predicted_demand: number;
  lower_bound: number;
  upper_bound: number;
}

export interface LateReturnPrediction {
  user_id: string;
  late_return_probability: number;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high';
  recommendation: string;
  factors: string[];
  confidence: 'high' | 'medium' | 'low';
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  pages: number;
  total: number;
  limit: number;
}

// Form Types
export interface KitFormData {
  name: string;
  category: string;
  description?: string;
  quantity: number;
  image?: File | string;
  status: string;
  condition: string;
}

export interface IssueFormData {
  kitId: string;
  userId?: string;
  quantity: number;
  dueDate: string;
  notes?: string;
}

export interface ReservationFormData {
  kitId: string;
  startDate: string;
  endDate: string;
  quantity: number;
  purpose: string;
  priority?: string;
}

// Theme Types
export type Theme = 'light' | 'dark' | 'system';

// Table Types
export interface Column<T> {
  key: keyof T | string;
  title: string;
  render?: (value: any, record: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
}

export interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;
  onSort?: (key: string, order: 'asc' | 'desc') => void;
  onFilter?: (filters: Record<string, any>) => void;
  rowKey?: keyof T | string;
  emptyText?: string;
  className?: string;
}

// Toast Types
export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  duration?: number;
}

// Modal Types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

// Stats Card Types
export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple';
  loading?: boolean;
}
