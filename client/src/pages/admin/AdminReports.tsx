import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format, subDays } from "date-fns";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line
} from "recharts";
import { Download, TrendingUp, DollarSign, Package, AlertTriangle, ShoppingBag, List, PieChart, ArrowLeft } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";

export default function AdminReports() {
    const [, setLocation] = useLocation();
    const [dateRange, setDateRange] = useState({
        startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
        endDate: format(new Date(), "yyyy-MM-dd"),
    });
    const [viewType, setViewType] = useState<'summary' | 'details'>('summary');

    const { data: salesReport, isLoading: loadingSales } = useQuery({
        queryKey: ["/api/admin/reports/sales", dateRange, viewType],
        queryFn: async () => {
            const res = await fetch(`/api/admin/reports/sales?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&type=${viewType}`);
            if (!res.ok) throw new Error("Failed to fetch sales report");
            return res.json();
        }
    });

    const { data: purchaseReport, isLoading: loadingPurchases } = useQuery({
        queryKey: ["/api/admin/reports/purchases", dateRange, viewType],
        queryFn: async () => {
            const res = await fetch(`/api/admin/reports/purchases?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&type=${viewType}`);
            if (!res.ok) throw new Error("Failed to fetch purchase report");
            return res.json();
        }
    });

    const { data: stockReport, isLoading: loadingStock } = useQuery({
        queryKey: ["/api/admin/reports/stock", viewType],
        queryFn: async () => {
            const res = await fetch(`/api/admin/reports/stock?type=${viewType}`);
            if (!res.ok) throw new Error("Failed to fetch stock report");
            return res.json();
        }
    });

    const downloadPDF = (reportName: 'sales' | 'purchases' | 'stock') => {
        const doc = new jsPDF();
        const title = `${reportName.charAt(0).toUpperCase() + reportName.slice(1)} Report (${viewType.charAt(0).toUpperCase() + viewType.slice(1)})`;
        doc.setFontSize(20);
        doc.text(title, 14, 22);

        doc.setFontSize(10);
        doc.text(`Generated on: ${format(new Date(), "PPP at pp")}`, 14, 30);
        if (reportName !== 'stock') {
            doc.text(`Period: ${dateRange.startDate} to ${dateRange.endDate}`, 14, 35);
        }

        let head: string[][] = [];
        let body: (string | number)[][] = [];

        if (reportName === 'sales') {
            if (viewType === 'summary' && salesReport) {
                head = [['Date', 'Orders', 'Revenue']];
                body = salesReport.map((row: any) => [
                    format(new Date(row.date), "yyyy-MM-dd"),
                    row.count,
                    `$${row.total.toFixed(2)}`
                ]);
                const totalRev = salesReport.reduce((acc: number, curr: any) => acc + curr.total, 0);
                body.push(['Total', salesReport.reduce((acc: number, curr: any) => acc + curr.count, 0), `$${totalRev.toFixed(2)}`]);
            } else if (viewType === 'details' && Array.isArray(salesReport)) {
                head = [['Date', 'Order ID', 'Customer', 'Total', 'Status']];
                body = salesReport.map((row: any) => [
                    format(new Date(row.createdAt), "yyyy-MM-dd HH:mm"),
                    `#${row.id}`,
                    row.userId ? `User ${row.userId}` : 'Guest',
                    `$${row.total.toFixed(2)}`,
                    row.status
                ]);
            }
        } else if (reportName === 'purchases') {
            if (viewType === 'summary' && purchaseReport) {
                head = [['Date', 'Purchases', 'Total Cost']];
                body = purchaseReport.map((row: any) => [
                    format(new Date(row.date), "yyyy-MM-dd"),
                    row.count,
                    `$${row.total.toFixed(2)}`
                ]);
                const totalExp = purchaseReport.reduce((acc: number, curr: any) => acc + curr.total, 0);
                body.push(['Total', purchaseReport.reduce((acc: number, curr: any) => acc + curr.count, 0), `$${totalExp.toFixed(2)}`]);
            } else if (viewType === 'details' && Array.isArray(purchaseReport)) {
                head = [['Date', 'Invoice', 'Supplier ID', 'Total', 'Status']];
                body = purchaseReport.map((row: any) => [
                    format(new Date(row.date), "yyyy-MM-dd"),
                    row.invoiceNumber,
                    row.supplierId,
                    `$${row.totalAmount.toFixed(2)}`,
                    row.status
                ]);
            }
        } else if (reportName === 'stock') {
            if (viewType === 'summary' && stockReport) {
                head = [['Product Name', 'Stock', 'Low Stock Threshold', 'Price']];
                body = stockReport.lowStockItems.map((item: any) => [
                    item.name,
                    item.stock,
                    item.lowStockThreshold,
                    `$${item.price.toFixed(2)}`
                ]);
            } else if (viewType === 'details' && Array.isArray(stockReport)) {
                head = [['Category', 'Product Name', 'Stock', 'Price']];
                body = stockReport.map((item: any) => [
                    item.category?.name || 'Uncategorized',
                    item.name,
                    item.stock,
                    `$${item.price.toFixed(2)}`
                ]);
            }
        }

        autoTable(doc, {
            startY: 40,
            head: head,
            body: body,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [63, 81, 181] }
        });

        doc.save(`${reportName}_${viewType}_${format(new Date(), "yyyyMMdd")}.pdf`);
    };

    // Calculate summaries for Summary View
    const salesSummaryData = (viewType === 'summary' && salesReport) ? {
        revenue: salesReport.reduce((acc: number, curr: any) => acc + curr.total, 0),
        orders: salesReport.reduce((acc: number, curr: any) => acc + curr.count, 0),
    } : { revenue: 0, orders: 0 };

    const purchaseSummaryData = (viewType === 'summary' && purchaseReport) ? {
        expense: purchaseReport.reduce((acc: number, curr: any) => acc + curr.total, 0),
        count: purchaseReport.reduce((acc: number, curr: any) => acc + curr.count, 0),
    } : { expense: 0, count: 0 };


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => setLocation('/admin/dashboard')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">Analytics & Reports</h1>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white rounded-md border p-1 flex">
                        <Button
                            variant={viewType === 'summary' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewType('summary')}
                            className="flex items-center gap-2"
                        >
                            <PieChart className="h-4 w-4" /> Summary
                        </Button>
                        <Button
                            variant={viewType === 'details' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewType('details')}
                            className="flex items-center gap-2"
                        >
                            <List className="h-4 w-4" /> Details
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">From:</span>
                        <Input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                            className="w-40"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">To:</span>
                        <Input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                            className="w-40"
                        />
                    </div>
                </div>
            </div>

            <Tabs defaultValue="sales" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="sales">Sales</TabsTrigger>
                    <TabsTrigger value="purchases">Purchases</TabsTrigger>
                    <TabsTrigger value="stock">Stock Levels</TabsTrigger>
                </TabsList>

                <TabsContent value="sales" className="space-y-4">
                    {viewType === 'summary' ? (
                        <>
                            <div className="grid gap-4 md:grid-cols-3">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">${salesSummaryData.revenue.toFixed(2)}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{salesSummaryData.orders}</div>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>Sales Over Time</CardTitle>
                                    <Button size="sm" onClick={() => downloadPDF('sales')}>
                                        <Download className="mr-2 h-4 w-4" /> Download PDF
                                    </Button>
                                </CardHeader>
                                <CardContent className="h-[400px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={salesReport}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="date"
                                                tickFormatter={(str) => format(new Date(str), "MMM d")}
                                            />
                                            <YAxis />
                                            <Tooltip
                                                labelFormatter={(str) => format(new Date(str), "PPP")}
                                                formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
                                            />
                                            <Line type="monotone" dataKey="total" stroke="#8884d8" strokeWidth={2} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Sales Details</CardTitle>
                                <Button size="sm" onClick={() => downloadPDF('sales')}>
                                    <Download className="mr-2 h-4 w-4" /> Download PDF
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Order ID</TableHead>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Total</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {Array.isArray(salesReport) && salesReport.map((order: any) => (
                                            <TableRow key={order.id}>
                                                <TableCell>{format(new Date(order.createdAt), "PPP p")}</TableCell>
                                                <TableCell>#{order.id}</TableCell>
                                                <TableCell>{order.userId ? `User ${order.userId}` : 'Guest'}</TableCell>
                                                <TableCell>${order.total}</TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-1 rounded-full text-xs ${order.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                        {order.status}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {(!salesReport || salesReport.length === 0) && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-4">No sales records found.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="purchases" className="space-y-4">
                    {viewType === 'summary' ? (
                        <>
                            <div className="grid gap-4 md:grid-cols-2">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">${purchaseSummaryData.expense.toFixed(2)}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Purchase Count</CardTitle>
                                        <Package className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{purchaseSummaryData.count}</div>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>Expenses Over Time</CardTitle>
                                    <Button size="sm" onClick={() => downloadPDF('purchases')}>
                                        <Download className="mr-2 h-4 w-4" /> Download PDF
                                    </Button>
                                </CardHeader>
                                <CardContent className="h-[400px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={purchaseReport}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="date"
                                                tickFormatter={(str) => format(new Date(str), "MMM d")}
                                            />
                                            <YAxis />
                                            <Tooltip
                                                labelFormatter={(str) => format(new Date(str), "PPP")}
                                                formatter={(value: number) => [`$${value.toFixed(2)}`, "Expense"]}
                                            />
                                            <Bar dataKey="total" fill="#82ca9d" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Purchase Details</CardTitle>
                                <Button size="sm" onClick={() => downloadPDF('purchases')}>
                                    <Download className="mr-2 h-4 w-4" /> Download PDF
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Invoice #</TableHead>
                                            <TableHead>Supplier</TableHead>
                                            <TableHead>Total Amount</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {Array.isArray(purchaseReport) && purchaseReport.map((purchase: any) => (
                                            <TableRow key={purchase.id}>
                                                <TableCell>{format(new Date(purchase.date), "PPP")}</TableCell>
                                                <TableCell>{purchase.invoiceNumber}</TableCell>
                                                <TableCell>ID: {purchase.supplierId}</TableCell>
                                                <TableCell>${purchase.totalAmount}</TableCell>
                                                <TableCell>{purchase.status}</TableCell>
                                            </TableRow>
                                        ))}
                                        {(!purchaseReport || purchaseReport.length === 0) && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-4">No purchase records found.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="stock" className="space-y-4">
                    {viewType === 'summary' ? (
                        <>
                            <div className="grid gap-4 md:grid-cols-2">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                                        <AlertTriangle className="h-4 w-4 text-red-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{stockReport?.lowStockItems?.length || 0}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
                                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">${stockReport?.totalValue?.toFixed(2) || "0.00"}</div>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>Low Stock Alerts</CardTitle>
                                    <Button size="sm" onClick={() => downloadPDF('stock')}>
                                        <Download className="mr-2 h-4 w-4" /> Download PDF
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Product Name</TableHead>
                                                <TableHead>Current Stock</TableHead>
                                                <TableHead>Min. Threshold</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {stockReport?.lowStockItems?.map((product: any) => (
                                                <TableRow key={product.id}>
                                                    <TableCell className="font-medium">{product.name}</TableCell>
                                                    <TableCell>{product.stock}</TableCell>
                                                    <TableCell>{product.lowStockThreshold}</TableCell>
                                                    <TableCell>
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${product.stock === 0 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            {product.stock === 0 ? 'Out of Stock' : 'Low Stock'}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>All Inventory Details</CardTitle>
                                <Button size="sm" onClick={() => downloadPDF('stock')}>
                                    <Download className="mr-2 h-4 w-4" /> Download PDF
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Product Name</TableHead>
                                            <TableHead>Stock</TableHead>
                                            <TableHead>Price</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {Array.isArray(stockReport) && stockReport.map((product: any) => (
                                            <TableRow key={product.id}>
                                                <TableCell>{product.category?.name || 'Uncategorized'}</TableCell>
                                                <TableCell className="font-medium">{product.name}</TableCell>
                                                <TableCell>{product.stock}</TableCell>
                                                <TableCell>${product.price}</TableCell>
                                                <TableCell>
                                                    {product.stock <= product.lowStockThreshold ? (
                                                        <span className="text-red-500 font-medium">Low Stock</span>
                                                    ) : (
                                                        <span className="text-green-500">OK</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
