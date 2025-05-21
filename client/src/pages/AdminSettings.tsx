import { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { 
  Card, 
  CardContent,
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Store, 
  CreditCard, 
  Bell, 
  Shield, 
  UserCircle,
  Save 
} from 'lucide-react';

const storeSettingsSchema = z.object({
  storeName: z.string().min(2, { message: 'Store name must be at least 2 characters.' }),
  storeEmail: z.string().email({ message: 'Please enter a valid email address.' }),
  storePhone: z.string().optional(),
  storeAddress: z.string().min(5, { message: 'Please enter a complete address.' }),
  storeCurrency: z.string(),
  taxRate: z.string().refine((val) => !isNaN(Number(val)), {
    message: 'Tax rate must be a number.'
  }),
});

const paymentSettingsSchema = z.object({
  enableCashOnDelivery: z.boolean(),
  enableBkash: z.boolean(),
  enableNagad: z.boolean(),
  bkashNumber: z.string().optional(),
  nagadNumber: z.string().optional(),
  checkoutNotes: z.string().optional(),
});

type StoreSettingsValues = z.infer<typeof storeSettingsSchema>;
type PaymentSettingsValues = z.infer<typeof paymentSettingsSchema>;

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState("store");
  const { toast } = useToast();
  
  // Store settings form
  const storeForm = useForm<StoreSettingsValues>({
    resolver: zodResolver(storeSettingsSchema),
    defaultValues: {
      storeName: 'SweetBite Bakery',
      storeEmail: 'contact@sweetbite.com',
      storePhone: '+880 123 456 7890',
      storeAddress: '123 Bakery Lane, Gulshan, Dhaka, Bangladesh',
      storeCurrency: 'BDT',
      taxRate: '15',
    },
  });

  // Payment settings form
  const paymentForm = useForm<PaymentSettingsValues>({
    resolver: zodResolver(paymentSettingsSchema),
    defaultValues: {
      enableCashOnDelivery: true,
      enableBkash: true,
      enableNagad: false,
      bkashNumber: '+880 171 234 5678',
      nagadNumber: '',
      checkoutNotes: 'Thank you for shopping with SweetBite Bakery! Your order will be processed within 24 hours.',
    },
  });

  // Handle store settings submission
  const storeSettingsMutation = useMutation({
    mutationFn: (data: StoreSettingsValues) => {
      return apiRequest('PUT', '/api/admin/settings/store', data);
    },
    onSuccess: () => {
      toast({
        title: 'Settings updated',
        description: 'Your store settings have been saved successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'There was a problem updating your settings.',
        variant: 'destructive',
      });
    },
  });

  // Handle payment settings submission
  const paymentSettingsMutation = useMutation({
    mutationFn: (data: PaymentSettingsValues) => {
      return apiRequest('PUT', '/api/admin/settings/payment', data);
    },
    onSuccess: () => {
      toast({
        title: 'Settings updated',
        description: 'Your payment settings have been saved successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'There was a problem updating your payment settings.',
        variant: 'destructive',
      });
    },
  });

  const onSubmitStoreSettings = (data: StoreSettingsValues) => {
    storeSettingsMutation.mutate(data);
  };

  const onSubmitPaymentSettings = (data: PaymentSettingsValues) => {
    paymentSettingsMutation.mutate(data);
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-heading font-bold text-gray-900">Settings</h1>
            <p className="text-gray-500">Configure your bakery shop settings</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 md:w-[600px]">
            <TabsTrigger value="store" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              <span className="hidden sm:inline">Store</span>
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Payment</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <UserCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
          </TabsList>

          {/* Store Settings */}
          <TabsContent value="store" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Store Information</CardTitle>
                <CardDescription>
                  Configure your store details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...storeForm}>
                  <form id="store-settings-form" onSubmit={storeForm.handleSubmit(onSubmitStoreSettings)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={storeForm.control}
                        name="storeName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Store Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={storeForm.control}
                        name="storeEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={storeForm.control}
                        name="storePhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={storeForm.control}
                        name="storeCurrency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Currency</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a currency" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="BDT">Bangladeshi Taka (৳)</SelectItem>
                                <SelectItem value="USD">US Dollar ($)</SelectItem>
                                <SelectItem value="EUR">Euro (€)</SelectItem>
                                <SelectItem value="GBP">British Pound (£)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={storeForm.control}
                      name="storeAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Store Address</FormLabel>
                          <FormControl>
                            <Textarea rows={3} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={storeForm.control}
                      name="taxRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax Rate (%)</FormLabel>
                          <FormControl>
                            <Input type="text" {...field} />
                          </FormControl>
                          <FormDescription>
                            Enter the default tax rate as a percentage (e.g., 15 for 15%)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  type="submit" 
                  form="store-settings-form" 
                  disabled={storeSettingsMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {storeSettingsMutation.isPending && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent"></div>
                  )}
                  <Save className="h-4 w-4 mr-1" />
                  Save Store Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Payment Settings */}
          <TabsContent value="payment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>
                  Configure payment options and settings for checkout
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...paymentForm}>
                  <form id="payment-settings-form" onSubmit={paymentForm.handleSubmit(onSubmitPaymentSettings)} className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Available Payment Methods</h3>
                      
                      <FormField
                        control={paymentForm.control}
                        name="enableCashOnDelivery"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Cash on Delivery</FormLabel>
                              <FormDescription>
                                Accept cash payments when orders are delivered
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={paymentForm.control}
                        name="enableBkash"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">bKash Payment</FormLabel>
                              <FormDescription>
                                Accept bKash mobile payments
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      {paymentForm.watch('enableBkash') && (
                        <FormField
                          control={paymentForm.control}
                          name="bkashNumber"
                          render={({ field }) => (
                            <FormItem className="ml-6">
                              <FormLabel>bKash Number</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormDescription>
                                Enter the bKash number customers should send payments to
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      
                      <FormField
                        control={paymentForm.control}
                        name="enableNagad"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Nagad Payment</FormLabel>
                              <FormDescription>
                                Accept Nagad mobile payments
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      {paymentForm.watch('enableNagad') && (
                        <FormField
                          control={paymentForm.control}
                          name="nagadNumber"
                          render={({ field }) => (
                            <FormItem className="ml-6">
                              <FormLabel>Nagad Number</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormDescription>
                                Enter the Nagad number customers should send payments to
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Checkout Notes</h3>
                      <FormField
                        control={paymentForm.control}
                        name="checkoutNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Order Confirmation Message</FormLabel>
                            <FormControl>
                              <Textarea rows={4} {...field} />
                            </FormControl>
                            <FormDescription>
                              This message will be displayed to customers after they complete their order
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  type="submit" 
                  form="payment-settings-form" 
                  disabled={paymentSettingsMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {paymentSettingsMutation.isPending && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent"></div>
                  )}
                  <Save className="h-4 w-4 mr-1" />
                  Save Payment Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Notifications Settings - Simplified */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Configure order and system notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="new-order" className="flex flex-col space-y-1">
                      <span>New Order Notifications</span>
                      <span className="font-normal text-sm text-gray-500">
                        Receive notifications when new orders are placed
                      </span>
                    </Label>
                    <Switch id="new-order" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="low-stock" className="flex flex-col space-y-1">
                      <span>Low Stock Alerts</span>
                      <span className="font-normal text-sm text-gray-500">
                        Get notified when products are running low on inventory
                      </span>
                    </Label>
                    <Switch id="low-stock" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="marketing" className="flex flex-col space-y-1">
                      <span>Marketing Updates</span>
                      <span className="font-normal text-sm text-gray-500">
                        Receive marketing tips and platform updates
                      </span>
                    </Label>
                    <Switch id="marketing" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button className="flex items-center gap-2">
                  <Save className="h-4 w-4 mr-1" />
                  Save Notification Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Security Settings - Simplified */}
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your account security and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Password</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input id="current-password" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input id="new-password" type="password" />
                    </div>
                  </div>
                  <div className="space-y-2 md:w-1/2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input id="confirm-password" type="password" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Account Security</h3>
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="two-factor" className="flex flex-col space-y-1">
                      <span>Two-Factor Authentication</span>
                      <span className="font-normal text-sm text-gray-500">
                        Add an extra layer of security to your account
                      </span>
                    </Label>
                    <Switch id="two-factor" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button className="flex items-center gap-2">
                  <Save className="h-4 w-4 mr-1" />
                  Update Security Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Account Settings - Simplified */}
          <TabsContent value="account" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  Update your account details and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="John Doe" defaultValue="Admin User" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" placeholder="john@example.com" defaultValue="admin@sweetbite.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" defaultValue="admin" disabled />
                    <p className="text-sm text-gray-500">Username cannot be changed</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Account Role</Label>
                    <Input id="role" defaultValue="Administrator" disabled />
                    <p className="text-sm text-gray-500">Contact support to change roles</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button className="flex items-center gap-2">
                  <Save className="h-4 w-4 mr-1" />
                  Save Account Information
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}