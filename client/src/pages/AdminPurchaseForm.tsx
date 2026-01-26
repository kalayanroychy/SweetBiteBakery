import { useState, useEffect } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { Helmet } from "react-helmet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Supplier, Product, Purchase, InsertPurchase, InsertPurchaseItem } from "@shared/schema";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Trash2, Save, ArrowLeft, Search, Printer } from "lucide-react";
import { z } from "zod";

// Helper type for form items
type FormItem = {
    productId: number;
    productName: string;
    quantity: number;
    unitCost: number;
    subtotal: number;
};

export default function AdminPurchaseForm() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Form State
    const [supplierId, setSupplierId] = useState<string>("");
    const [invoiceNumber, setInvoiceNumber] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState("pending");
    const [notes, setNotes] = useState("");
    const [items, setItems] = useState<FormItem[]>([]);

    // Item adding state
    const [selectedProductId, setSelectedProductId] = useState<string>("");
    const [itemQuantity, setItemQuantity] = useState(1);
    const [itemCost, setItemCost] = useState(0);

    // Queries
    const { data: suppliers = [] } = useQuery<Supplier[]>({
        queryKey: ["/api/admin/suppliers"],
    });

    const { data: productsData } = useQuery({
        queryKey: ["/api/products"],
    });

    const products = (Array.isArray(productsData) ? productsData : (productsData as any)?.products || []) as Product[];

    const [match, params] = useRoute("/admin/purchases/:id");
    const id = params?.id;
    const isEditing = !!id;

    // Fetch existing purchase if editing
    const { data: existingPurchase, isLoading: isLoadingPurchase } = useQuery<Purchase & { items: FormItem[] }>({
        queryKey: [`/api/admin/purchases/${id}`],
        enabled: isEditing,
    });

    // Populate form when data loads
    useEffect(() => {
        if (existingPurchase) {
            setSupplierId(existingPurchase.supplierId.toString());
            setInvoiceNumber(existingPurchase.invoiceNumber);
            setDate(new Date(existingPurchase.date).toISOString().split('T')[0]);
            setStatus(existingPurchase.status);
            setNotes(existingPurchase.notes || "");
            const formattedItems = existingPurchase.items?.map((item: any) => ({
                productId: item.productId,
                productName: products.find(p => p.id === item.productId)?.name || "Unknown Product",
                quantity: item.quantity,
                unitCost: item.unitCost,
                subtotal: item.subtotal
            })) || [];
            setItems(formattedItems);
        }
    }, [existingPurchase, products]);

    // Mutations
    const mutation = useMutation({
        mutationFn: async (data: any) => {
            const method = isEditing ? "PUT" : "POST";
            const url = isEditing ? `/api/admin/purchases/${id}` : "/api/admin/purchases";
            // Ensure status update logic is handled by backend correctly if it changes
            const res = await apiRequest(method, url, data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/purchases"] });
            queryClient.invalidateQueries({ queryKey: [`/api/admin/purchases/${id}`] });
            queryClient.invalidateQueries({ queryKey: ["/api/products"] }); // Stock updated
            toast({ title: `Purchase invoice ${isEditing ? "updated" : "created"} successfully` });
            setLocation("/admin/purchases");
        },
        onError: (error: Error) => {
            toast({ title: `Failed to ${isEditing ? "update" : "create"} invoice`, description: error.message, variant: "destructive" });
        },
    });

    // Handlers
    const handleAddItem = () => {
        if (!selectedProductId) return;

        const product = products.find(p => p.id === parseInt(selectedProductId));
        if (!product) return;

        const newItem: FormItem = {
            productId: product.id,
            productName: product.name,
            quantity: itemQuantity,
            unitCost: itemCost,
            subtotal: itemQuantity * itemCost
        };

        setItems([...items, newItem]);

        // Reset item inputs
        setSelectedProductId("");
        setItemQuantity(1);
        setItemCost(0);
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + item.subtotal, 0);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!supplierId || !invoiceNumber || items.length === 0) {
            toast({ title: "Validation Error", description: "Please fill all required fields and add items.", variant: "destructive" });
            return;
        }

        const payload = {
            supplierId: parseInt(supplierId),
            invoiceNumber,
            date: new Date(date).toISOString(),
            status,
            notes,
            totalAmount: calculateTotal(),
            items: items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                unitCost: item.unitCost,
                subtotal: item.subtotal
            }))
        };

        mutation.mutate(payload);
    };

    if (isEditing && isLoadingPurchase) {
        return (
            <AdminLayout>
                <div className="flex justify-center items-center h-screen">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <Helmet>
                <title>New Purchase Invoice | Probashi Bakery Admin</title>
            </Helmet>

            {/* Header with Print Button */}
            <div className="flex items-center justify-between mb-6 px-6 pt-6 gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/purchases">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-800">{isEditing ? "Edit Purchase Invoice" : "New Purchase Invoice"}</h1>
                </div>
                {isEditing && (
                    <Button onClick={() => window.print()} variant="outline" className="gap-2">
                        <Printer className="h-4 w-4" />
                        Print Invoice
                    </Button>
                )}
            </div>

            {/* Hidden Printable Invoice Section */}
            {isEditing && (
                <div id="printable-invoice" className="hidden print:block bg-white text-black p-0 font-serif leading-relaxed">
                    <div className="p-10 max-w-[210mm] mx-auto">
                        {/* Invoice Header */}
                        <div className="flex justify-between items-start mb-12 border-b-2 border-gray-800 pb-6">
                            <div>
                                <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-2">INVOICE</h1>
                                <p className="text-gray-600 font-medium tracking-wide">ORIGINAL</p>
                            </div>
                            <div className="text-right">
                                <h2 className="text-2xl font-bold text-primary mb-1">Probashi Bakery</h2>
                                <p className="text-sm text-gray-600">25 katalgonj,Panchalish Thana</p>
                                <p className="text-sm text-gray-600">Chattogram, Bangladesh</p>
                                <p className="text-sm text-gray-600">Phone: 01829 88 88 88</p>
                                <p className="text-sm text-gray-600">Email: probashibakery@gmail.com</p>
                            </div>
                        </div>

                        {/* Invoice Meta & Address */}
                        <div className="flex flex-row justify-between mb-12">
                            {/* Bill To / Supplier */}
                            <div className="w-1/2 pr-8">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-300 pb-1 mb-3">Bill To (Supplier)</h3>
                                <div className="text-gray-800">
                                    <h4 className="text-lg font-bold mb-1">{suppliers.find(s => s.id.toString() === supplierId)?.name || "Unknown Supplier"}</h4>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        {/* Ideally we would have address here, showing placeholder if not available */}
                                        <p>Supplier ID: #{supplierId}</p>
                                        <p>Email: {suppliers.find(s => s.id.toString() === supplierId)?.email || "N/A"}</p>
                                        <p>Phone: {suppliers.find(s => s.id.toString() === supplierId)?.phone || "N/A"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Invoice Details */}
                            <div className="w-1/3">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-300 pb-1 mb-3">Invoice Details</h3>
                                <div className="grid grid-cols-2 gap-y-2 text-sm">
                                    <span className="font-semibold text-gray-600">Invoice No:</span>
                                    <span className="font-bold text-gray-900 text-right">{invoiceNumber}</span>

                                    <span className="font-semibold text-gray-600">Date:</span>
                                    <span className="font-medium text-gray-800 text-right">{new Date(date).toLocaleDateString()}</span>

                                    <span className="font-semibold text-gray-600">Status:</span>
                                    <span className="font-medium text-gray-800 text-right capitalize">{status}</span>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="mb-12">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-100 border-y border-gray-800">
                                        <th className="text-left py-3 px-4 font-bold text-xs uppercase tracking-wider text-gray-700">Item / Description</th>
                                        <th className="text-center py-3 px-4 font-bold text-xs uppercase tracking-wider text-gray-700 w-24">Qty</th>
                                        <th className="text-right py-3 px-4 font-bold text-xs uppercase tracking-wider text-gray-700 w-32">Unit Price</th>
                                        <th className="text-right py-3 px-4 font-bold text-xs uppercase tracking-wider text-gray-700 w-32">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {items.map((item, index) => (
                                        <tr key={index} className="border-b border-gray-200">
                                            <td className="py-4 px-4 text-gray-800 font-medium">
                                                {item.productName}
                                                <div className="text-xs text-gray-500 mt-0.5">Product ID: {item.productId}</div>
                                            </td>
                                            <td className="text-center py-4 px-4 text-gray-600">{item.quantity}</td>
                                            <td className="text-right py-4 px-4 text-gray-600">৳{item.unitCost.toFixed(2)}</td>
                                            <td className="text-right py-4 px-4 font-bold text-gray-900">৳{item.subtotal.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer / Totals */}
                        <div className="flex justify-end mb-16">
                            <div className="w-1/3">
                                <div className="flex justify-between py-2 border-b border-gray-200">
                                    <span className="text-sm font-semibold text-gray-600">Subtotal</span>
                                    <span className="font-medium">৳{calculateTotal().toFixed(2)}</span>
                                </div>
                                {/* Tax/Shipping placehodlers can go here */}
                                <div className="flex justify-between py-3 border-b-2 border-gray-800 text-xl font-bold mt-2">
                                    <span>Total</span>
                                    <span>৳{calculateTotal().toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Notes & Signature */}
                        <div className="grid grid-cols-2 gap-12 mt-auto">
                            <div className="text-sm text-gray-600">
                                <h4 className="font-bold text-gray-800 mb-2">Notes & Terms</h4>
                                {notes ? (
                                    <p className="bg-gray-50 p-3 rounded">{notes}</p>
                                ) : (
                                    <p className="italic">No additional notes.</p>
                                )}
                                <p className="mt-4 text-xs">Thank you for your business!</p>
                            </div>

                            <div className="flex flex-col justify-end items-center">
                                <div className="w-48 border-b border-gray-400 mb-2"></div>
                                <p className="text-xs font-semibold uppercase text-gray-500">Authorized Signature</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="px-6 mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Invoice Details */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Invoice Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Supplier <span className="text-red-500">*</span></label>
                                <Select value={supplierId} onValueChange={setSupplierId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Supplier" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {suppliers.map(s => (
                                            <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Invoice Number <span className="text-red-500">*</span></label>
                                <Input
                                    value={invoiceNumber}
                                    onChange={e => setInvoiceNumber(e.target.value)}
                                    placeholder="e.g. INV-2024-001"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Date <span className="text-red-500">*</span></label>
                                <Input
                                    type="date"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Status</label>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="received">Received (Updates Stock)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-gray-500">
                                    Selecting <strong>Received</strong> will automatically increase product stock.
                                </p>
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-sm font-medium">Notes</label>
                                <Textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Additional notes about this purchase..."
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* Add Item Form */}
                            <div className="flex flex-col md:flex-row gap-4 items-end mb-6 p-4 bg-gray-50 rounded-lg border">
                                <div className="flex-1 space-y-2 w-full">
                                    <label className="text-sm font-medium">Product</label>
                                    <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Product" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {products.map(p => (
                                                <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="w-24 space-y-2">
                                    <label className="text-sm font-medium">Qty</label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={itemQuantity}
                                        onChange={e => setItemQuantity(parseInt(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="w-32 space-y-2">
                                    <label className="text-sm font-medium">Unit Cost</label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={itemCost}
                                        onChange={e => setItemCost(parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <Button type="button" onClick={handleAddItem} disabled={!selectedProductId}>
                                    <Plus className="h-4 w-4" /> Add
                                </Button>
                            </div>

                            {/* Items Table */}
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead className="text-center">Qty</TableHead>
                                        <TableHead className="text-right">Unit Cost</TableHead>
                                        <TableHead className="text-right">Subtotal</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                                No items added yet.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        items.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">{item.productName}</TableCell>
                                                <TableCell className="text-center">{item.quantity}</TableCell>
                                                <TableCell className="text-right">৳{item.unitCost.toFixed(2)}</TableCell>
                                                <TableCell className="text-right font-bold">৳{item.subtotal.toFixed(2)}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(index)}>
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Summary */}
                <div className="space-y-6">
                    <Card className="sticky top-6">
                        <CardHeader>
                            <CardTitle>Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center text-lg font-bold">
                                <span>Total Amount:</span>
                                <span className="text-primary text-2xl">৳{calculateTotal().toFixed(2)}</span>
                            </div>
                            <div className="pt-4 border-t">
                                <Button type="submit" className="w-full" size="lg" disabled={mutation.isPending}>
                                    {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Invoice
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </AdminLayout>
    );
}
