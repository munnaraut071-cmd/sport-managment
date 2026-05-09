import { useCallback } from 'react';
import { usersAPI, type User, type UserFilters } from '@/services/api';
import { useApiQuery, useApiMutation, usePaginatedQuery } from './useApi';

// Hook for fetching all users
export function useUsers(filters?: UserFilters) {
  const fetchUsers = useCallback(() => usersAPI.getAll(filters), [filters]);
  return useApiQuery<User[]>(fetchUsers);
}

// Hook for fetching a single user
export function useUser(id: string | null) {
  const fetchUser = useCallback(() => usersAPI.getById(id!), [id]);
  return useApiQuery<User>(fetchUser, { enabled: !!id });
}

// Hook for paginated users
export function usePaginatedUsers(pageSize: number = 10) {
  const fetchUsers = useCallback((page: number, limit: number) => 
    usersAPI.getAll({ page, limit }), []);
  
  return usePaginatedQuery<User>(fetchUsers, { pageSize });
}

// Hook for user statistics
export function useUserStats() {
  const fetchStats = useCallback(() => usersAPI.getStats(), []);
  return useApiQuery(fetchStats);
}

// Hook for user activity
export function useUserActivity(id: string | null) {
  const fetchActivity = useCallback(() => usersAPI.getActivity(id!), [id]);
  return useApiQuery(fetchActivity, { enabled: !!id });
}

// Hook for creating a user
export function useCreateUser() {
  return useApiMutation<User, Partial<User> & { password: string }>(usersAPI.create);
}

// Hook for updating a user
export function useUpdateUser() {
  return useApiMutation<User, { id: string; data: Partial<User> }>(
    ({ id, data }) => usersAPI.update(id, data)
  );
}

// Hook for deleting a user
export function useDeleteUser() {
  return useApiMutation<void, string>(usersAPI.delete);
}

// Hook for bulk deleting users
export function useBulkDeleteUsers() {
  return useApiMutation<void, string[]>(usersAPI.bulkDelete);
}

// Hook for toggling user status
export function useToggleUserStatus() {
  return useApiMutation<User, string>(usersAPI.toggleStatus);
}

// Combined hook for user management
export function useUserManagement() {
  const { data: users, loading, error, refetch } = useUsers();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();
  const toggleMutation = useToggleUserStatus();

  const handleCreate = async (data: Partial<User> & { password: string }) => {
    const result = await createMutation.mutate(data);
    if (result) refetch();
    return result;
  };

  const handleUpdate = async (id: string, data: Partial<User>) => {
    const result = await updateMutation.mutate({ id, data });
    if (result) refetch();
    return result;
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutate(id);
    refetch();
  };

  const handleToggleStatus = async (id: string) => {
    const result = await toggleMutation.mutate(id);
    if (result) refetch();
    return result;
  };

  return {
    users,
    loading,
    error,
    refetch,
    create: handleCreate,
    update: handleUpdate,
    delete: handleDelete,
    toggleStatus: handleToggleStatus,
    creating: createMutation.loading,
    updating: updateMutation.loading,
    deleting: deleteMutation.loading,
    toggling: toggleMutation.loading,
  };
}

export default useUsers;
