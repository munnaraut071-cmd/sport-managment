import { useCallback, useState } from 'react';
import { kitsAPI, transactionsAPI, type Kit, type KitFilters, type Transaction } from '@/services/api';
import { useApiQuery, useApiMutation, usePaginatedQuery } from './useApi';

// Hook for fetching all kits with filters
export function useKits(filters?: KitFilters) {
  const fetchKits = useCallback(() => kitsAPI.getAll(filters), [filters]);
  return useApiQuery<Kit[]>(fetchKits);
}

// Hook for fetching a single kit
export function useKit(id: string | null) {
  const fetchKit = useCallback(() => kitsAPI.getById(id!), [id]);
  return useApiQuery<Kit>(fetchKit, { enabled: !!id });
}

// Hook for paginated kits
export function usePaginatedKits(pageSize: number = 10) {
  const fetchKits = useCallback((page: number, limit: number) => 
    kitsAPI.getAll({ page, limit }), []);
  
  return usePaginatedQuery<Kit>(fetchKits, { pageSize });
}

// Hook for kit statistics
export function useKitStats() {
  const fetchStats = useCallback(() => kitsAPI.getStats(), []);
  return useApiQuery(fetchStats);
}

// Hook for low stock kits
export function useLowStockKits(threshold?: number) {
  const fetchLowStock = useCallback(() => kitsAPI.getLowStock(threshold), [threshold]);
  return useApiQuery<Kit[]>(fetchLowStock);
}

// Hook for kit categories
export function useKitCategories() {
  const fetchCategories = useCallback(() => kitsAPI.getCategories(), []);
  return useApiQuery<string[]>(fetchCategories);
}

// Hook for creating a kit
export function useCreateKit() {
  return useApiMutation<Kit, Partial<Kit>>(kitsAPI.create);
}

// Hook for updating a kit
export function useUpdateKit() {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  const { mutate, loading, error, reset } = useApiMutation<Kit, { id: string; data: Partial<Kit> }>(
    ({ id, data }) => kitsAPI.update(id, data)
  );

  const update = async (id: string, data: Partial<Kit>) => {
    setUpdatingId(id);
    try {
      const result = await mutate({ id, data });
      return result;
    } finally {
      setUpdatingId(null);
    }
  };

  return { update, loading, updatingId, error, reset };
}

// Hook for deleting a kit
export function useDeleteKit() {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const { mutate, loading, error, reset } = useApiMutation<void, string>(kitsAPI.delete);

  const deleteKit = async (id: string) => {
    setDeletingId(id);
    try {
      await mutate(id);
    } finally {
      setDeletingId(null);
    }
  };

  return { deleteKit, loading, deletingId, error, reset };
}

// Hook for bulk deleting kits
export function useBulkDeleteKits() {
  return useApiMutation<void, string[]>(kitsAPI.bulkDelete);
}

// Hook for issuing a kit
export function useIssueKit() {
  const [issuingId, setIssuingId] = useState<string | null>(null);
  
  const { mutate, loading, error, reset } = useApiMutation<Transaction, { 
    kitId: string; 
    userId: string; 
    dueDate: string; 
    quantity?: number; 
    notes?: string 
  }>(
    ({ kitId, ...data }) => kitsAPI.issue(kitId, data)
  );

  const issue = async (kitId: string, data: { 
    userId: string; 
    dueDate: string; 
    quantity?: number; 
    notes?: string 
  }) => {
    setIssuingId(kitId);
    try {
      const result = await mutate({ kitId, ...data });
      return result;
    } finally {
      setIssuingId(null);
    }
  };

  return { issue, loading, issuingId, error, reset };
}

// Hook for returning a kit
export function useReturnKit() {
  const [returningId, setReturningId] = useState<string | null>(null);
  
  const { mutate, loading, error, reset } = useApiMutation<Transaction, {
    kitId: string;
    condition?: string;
    notes?: string;
  }>(
    ({ kitId, ...data }) => kitsAPI.return(kitId, data)
  );

  const returnKit = async (kitId: string, data?: { condition?: string; notes?: string }) => {
    setReturningId(kitId);
    try {
      const result = await mutate({ kitId, ...data });
      return result;
    } finally {
      setReturningId(null);
    }
  };

  return { returnKit, loading, returningId, error, reset };
}

// Hook for importing kits
export function useImportKits() {
  return useApiMutation<void, File>(kitsAPI.import);
}

// Hook for exporting kits
export function useExportKits() {
  const [exporting, setExporting] = useState(false);
  
  const exportKits = async (format: 'csv' | 'excel' | 'pdf' = 'excel') => {
    setExporting(true);
    try {
      const response = await kitsAPI.export(format);
      const blob = new Blob([response.data], { 
        type: format === 'csv' ? 'text/csv' : format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kits-export.${format === 'excel' ? 'xlsx' : format}`;
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
  
  return { exportKits, exporting };
}

// Combined hook for kit management
export function useKitManagement() {
  const [selectedKit, setSelectedKit] = useState<Kit | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');

  const { data: kits, loading, error, refetch } = useKits();
  const { update, loading: updating } = useUpdateKit();
  const { deleteKit, loading: deleting } = useDeleteKit();
  const createMutation = useCreateKit();

  const openCreateModal = () => {
    setSelectedKit(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const openEditModal = (kit: Kit) => {
    setSelectedKit(kit);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const openViewModal = (kit: Kit) => {
    setSelectedKit(kit);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedKit(null);
  };

  const handleCreate = async (data: Partial<Kit>) => {
    const result = await createMutation.mutate(data);
    if (result) {
      closeModal();
      refetch();
    }
    return result;
  };

  const handleUpdate = async (id: string, data: Partial<Kit>) => {
    const result = await update(id, data);
    if (result) {
      closeModal();
      refetch();
    }
    return result;
  };

  const handleDelete = async (id: string) => {
    await deleteKit(id);
    refetch();
  };

  return {
    kits,
    loading,
    error,
    refetch,
    selectedKit,
    isModalOpen,
    modalMode,
    openCreateModal,
    openEditModal,
    openViewModal,
    closeModal,
    handleCreate,
    handleUpdate,
    handleDelete,
    creating: createMutation.loading,
    updating,
    deleting,
  };
}

export default useKits;
