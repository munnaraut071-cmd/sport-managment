import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/context/ThemeContext';

// Test utilities
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const renderWithProviders = (component: React.ReactNode) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ThemeProvider>
          {component}
        </ThemeProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('DataTable Component', () => {
  const mockData = [
    { _id: '1', name: 'Kit 1', category: 'Cricket', quantity: 10 },
    { _id: '2', name: 'Kit 2', category: 'Football', quantity: 15 },
  ];

  const mockColumns = [
    { key: 'name', title: 'Name' },
    { key: 'category', title: 'Category' },
    { key: 'quantity', title: 'Quantity' },
  ];

  it('renders loading state', () => {
    const { DataTable } = require('@/components/ui/DataTable');
    renderWithProviders(
      <DataTable 
        data={[]} 
        columns={mockColumns} 
        loading={true}
        rowKey="_id"
      />
    );

    expect(screen.getByText('Initializing...')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    const { DataTable } = require('@/components/ui/DataTable');
    renderWithProviders(
      <DataTable 
        data={[]} 
        columns={mockColumns}
        loading={false}
        rowKey="_id"
      />
    );

    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('renders data correctly', () => {
    const { DataTable } = require('@/components/ui/DataTable');
    renderWithProviders(
      <DataTable 
        data={mockData} 
        columns={mockColumns}
        loading={false}
        rowKey="_id"
      />
    );

    expect(screen.getByText('Kit 1')).toBeInTheDocument();
    expect(screen.getByText('Kit 2')).toBeInTheDocument();
    expect(screen.getByText('Cricket')).toBeInTheDocument();
  });
});

describe('StatCard Component', () => {
  it('renders with loading state', () => {
    const { StatCard } = require('@/components/ui/StatCard');
    renderWithProviders(
      <StatCard 
        title="Total Kits"
        value="0"
        loading={true}
      />
    );

    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('renders with data', () => {
    const { StatCard } = require('@/components/ui/StatCard');
    renderWithProviders(
      <StatCard 
        title="Total Kits"
        value="150"
        trend="up"
        trendValue="+12%"
      />
    );

    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('+12%')).toBeInTheDocument();
  });
});

describe('Form Validation', () => {
  it('validates kit schema correctly', () => {
    const { kitSchema } = require('@/lib/validations');
    
    const validData = {
      name: 'Test Kit',
      category: 'Cricket',
      quantity: 10,
      status: 'active'
    };

    expect(() => kitSchema.parse(validData)).not.toThrow();
  });

  it('invalidates empty kit name', () => {
    const { kitSchema } = require('@/lib/validations');
    
    const invalidData = {
      name: '',
      category: 'Cricket',
      quantity: 10
    };

    expect(() => kitSchema.parse(invalidData)).toThrow();
  });
});
