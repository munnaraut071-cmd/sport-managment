// API Hooks
export {
  useApiQuery,
  useApiMutation,
  usePaginatedQuery,
  useOptimisticMutation,
  useAutoRefresh,
  useDebouncedSearch,
} from './useApi';

// Auth Hooks
export { useAuth, useAuthProvider, AuthContext } from './useAuth';

// Domain-specific Hooks
export {
  useKits,
  useKit,
  usePaginatedKits,
  useKitStats,
  useLowStockKits,
  useKitCategories,
  useCreateKit,
  useUpdateKit,
  useDeleteKit,
  useBulkDeleteKits,
  useIssueKit,
  useReturnKit,
  useImportKits,
  useExportKits,
  useKitManagement,
} from './useKits';

// Transaction Hooks
export {
  useTransactions,
  useTransaction,
  useMyTransactions,
  useIssueTransaction,
  useReturnTransaction,
  useOverdueTransactions,
  useTransactionStats,
} from './useTransactions';

// User Hooks
export {
  useUsers,
  useUser,
  useUserStats,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useUserActivity,
} from './useUsers';

// Analytics Hooks
export {
  useDashboardAnalytics,
  useKitsUsage,
  useTopSports,
  useActivities,
  useMonthlyTrends,
} from './useAnalytics';

// Notification Hooks
export {
  useNotifications,
  useNotificationCount,
  useMarkAsRead,
  useNotificationSettings,
} from './useNotifications';

// Socket Hook
export { useSocket, SocketProvider } from './useSocket';
