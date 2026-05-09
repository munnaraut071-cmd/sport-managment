import { useCallback } from 'react';
import { transactionsAPI, type Transaction, type TransactionFilters } from '@/services/api';
import { useApiQuery, useApiMutation, usePaginatedQuery } from './useApi';

// Hook for fetching all transactions
export function useTransactions(filters?: TransactionFilters) {
  const fetchTransactions = useCallback(() => transactionsAPI.getAll(filters), [filters]);
  return useApiQuery<Transaction[]>(fetchTransactions);
}

// Hook for fetching a single transaction
export function useTransaction(id: string | null) {
  const fetchTransaction = useCallback(() => transactionsAPI.getById(id!), [id]);
  return useApiQuery<Transaction>(fetchTransaction, { enabled: !!id });
}

// Hook for fetching my transactions
export function useMyTransactions(params?: { page?: number; limit?: number }) {
  const fetchTransactions = useCallback(() => transactionsAPI.getMyTransactions(params), [params]);
  return useApiQuery<Transaction[]>(fetchTransactions);
}

// Hook for paginated transactions
export function usePaginatedTransactions(pageSize: number = 10) {
  const fetchTransactions = useCallback((page: number, limit: number) => 
    transactionsAPI.getAll({ page, limit }), []);
  
  return usePaginatedQuery<Transaction>(fetchTransactions, { pageSize });
}

// Hook for overdue transactions
export function useOverdueTransactions() {
  const fetchOverdue = useCallback(() => transactionsAPI.getOverdue(), []);
  return useApiQuery<Transaction[]>(fetchOverdue);
}

// Hook for transaction statistics
export function useTransactionStats() {
  const fetchStats = useCallback(() => transactionsAPI.getStats(), []);
  return useApiQuery(fetchStats);
}

// Hook for issuing a kit (transaction)
export function useIssueTransaction() {
  return useApiMutation<Transaction, {
    kitId: string;
    userId: string;
    dueDate: string;
    quantity?: number;
    notes?: string;
  }>(transactionsAPI.issueKit);
}

// Hook for returning a kit (transaction)
export function useReturnTransaction() {
  return useApiMutation<Transaction, {
    transactionId: string;
    condition?: string;
    notes?: string;
  }>(
    ({ transactionId, ...data }) => transactionsAPI.returnKit(transactionId, data)
  );
}

// Hook for renewing a transaction
export function useRenewTransaction() {
  return useApiMutation<Transaction, {
    transactionId: string;
    newDueDate: string;
  }>(
    ({ transactionId, newDueDate }) => transactionsAPI.renew(transactionId, newDueDate)
  );
}

// Hook for exporting transactions
export function useExportTransactions() {
  const [exporting, setExporting] = useState(false);
  
  const exportTransactions = async (params?: { 
    format?: string; 
    startDate?: string; 
    endDate?: string 
  }) => {
    setExporting(true);
    try {
      const response = await transactionsAPI.export(params);
      const format = params?.format || 'excel';
      const blob = new Blob([response.data], { 
        type: format === 'csv' ? 'text/csv' : 
              format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 
              'application/pdf'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `transactions-export.${format === 'excel' ? 'xlsx' : format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      return false;
    } finally {
      setExporting(false);
    }
  };
  
  return { exportTransactions, exporting };
}

// Combined hook for transaction management
export function useTransactionManagement() {
  const { data: transactions, loading, error, refetch } = useTransactions();
  const issueMutation = useIssueTransaction();
  const returnMutation = useReturnTransaction();
  const renewMutation = useRenewTransaction();

  const handleIssue = async (data: {
    kitId: string;
    userId: string;
    dueDate: string;
    quantity?: number;
    notes?: string;
  }) => {
    const result = await issueMutation.mutate(data);
    if (result) refetch();
    return result;
  };

  const handleReturn = async (transactionId: string, data?: { condition?: string; notes?: string }) => {
    const result = await returnMutation.mutate({ transactionId, ...data });
    if (result) refetch();
    return result;
  };

  const handleRenew = async (transactionId: string, newDueDate: string) => {
    const result = await renewMutation.mutate({ transactionId, newDueDate });
    if (result) refetch();
    return result;
  };

  return {
    transactions,
    loading,
    error,
    refetch,
    issue: handleIssue,
    return: handleReturn,
    renew: handleRenew,
    issuing: issueMutation.loading,
    returning: returnMutation.loading,
    renewing: renewMutation.loading,
  };
}

import { useState } from 'react';
export default useTransactions;
