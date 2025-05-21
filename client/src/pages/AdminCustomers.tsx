import { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent,
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Eye, Mail, Phone } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// Get initials from a name
const getInitials = (name: string) => {
  if (!name) return '??';
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

// Get a deterministic color based on a string
const getAvatarColor = (name: string) => {
  if (!name) return 'bg-gray-300';
  
  const colors = [
    'bg-red-200 text-red-800',
    'bg-blue-200 text-blue-800',
    'bg-green-200 text-green-800',
    'bg-yellow-200 text-yellow-800',
    'bg-purple-200 text-purple-800',
    'bg-pink-200 text-pink-800',
    'bg-indigo-200 text-indigo-800',
    'bg-teal-200 text-teal-800'
  ];
  
  // Simple hash function to get a consistent color for the same name
  const hash = name.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  
  return colors[hash % colors.length];
};

type Customer = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string;
};

// Mock data for customers - this would normally come from your API
const mockCustomers: Customer[] = [
  {
    id: 1,
    name: 'Sarah Johnson',
    email: 'sarah.j@example.com',
    phone: '+1 (555) 123-4567',
    orderCount: 5,
    totalSpent: 245.30,
    lastOrderDate: '2025-05-15T14:30:00Z',
  },
  {
    id: 2,
    name: 'Michael Chen',
    email: 'michael.c@example.com',
    phone: '+1 (555) 987-6543',
    orderCount: 3,
    totalSpent: 178.50,
    lastOrderDate: '2025-05-10T09:15:00Z',
  },
  {
    id: 3,
    name: 'Emma Wilson',
    email: 'emma.w@example.com',
    orderCount: 2,
    totalSpent: 87.20,
    lastOrderDate: '2025-04-28T16:45:00Z',
  },
  {
    id: 4,
    name: 'Daniel Roberts',
    email: 'daniel.r@example.com',
    phone: '+1 (555) 234-5678',
    orderCount: 7,
    totalSpent: 356.75,
    lastOrderDate: '2025-05-18T11:30:00Z',
  },
  {
    id: 5,
    name: 'Olivia Kim',
    email: 'olivia.k@example.com',
    orderCount: 1,
    totalSpent: 42.99,
    lastOrderDate: '2025-05-01T13:20:00Z',
  }
];

export default function AdminCustomers() {
  const [searchQuery, setSearchQuery] = useState('');
  
  // In a real app, you would fetch customers from your API
  // const { data: customers = [], isLoading } = useQuery({
  //   queryKey: ['/api/admin/customers'],
  //   staleTime: 60000, // 1 minute
  // });
  
  // Using mock data for now
  const customers = mockCustomers;
  const isLoading = false;

  // Filter customers based on search query
  const filteredCustomers = customers.filter((customer) => {
    const query = searchQuery.toLowerCase();
    return (
      customer.name.toLowerCase().includes(query) ||
      customer.email.toLowerCase().includes(query) ||
      (customer.phone && customer.phone.includes(searchQuery))
    );
  });

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-heading font-bold text-gray-900">Customers</h1>
            <p className="text-gray-500">View and manage your customer information</p>
          </div>
        </div>

        {/* Search */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
          <div className="md:col-span-6 lg:col-span-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by name, email or phone"
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Customers table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Customer Database</CardTitle>
            <CardDescription>
              {filteredCustomers.length} customers found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-10 text-center">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
                <p className="mt-2 text-sm text-gray-500">Loading customers...</p>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500">No customers found matching your criteria</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Total Spent</TableHead>
                      <TableHead>Last Order</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className={getAvatarColor(customer.name)}>
                              <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{customer.name}</div>
                              <div className="text-sm text-muted-foreground">ID: #{customer.id}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center text-sm">
                              <Mail className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                              {customer.email}
                            </div>
                            {customer.phone && (
                              <div className="flex items-center text-sm">
                                <Phone className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                                {customer.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{customer.orderCount}</TableCell>
                        <TableCell>৳{customer.totalSpent.toFixed(2)}</TableCell>
                        <TableCell>
                          {new Date(customer.lastOrderDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" title="View customer details">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}