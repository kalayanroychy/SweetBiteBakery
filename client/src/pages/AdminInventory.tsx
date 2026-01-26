import { useState } from "react";
import { Link } from "wouter";
import { Helmet } from "react-helmet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ProductWithCategory } from "@shared/schema";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Search, AlertTriangle, Package, Loader2, Save } from "lucide-react";

export default function AdminInventory() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProduct, setSelectedProduct] = useState<ProductWithCategory | null>(null);
    const [adjustmentAmount, setAdjustmentAmount] = useState<number>(0);
    const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = useState(false);

    const { data: productsData, isLoading } = useQuery({
        queryKey: ["/api/products"],
    });

    const products = (Array.isArray(productsData) ? productsData : (productsData as any)?.products || []) as ProductWithCategory[];

    const updateStockMutation = useMutation({
        mutationFn: async ({ id, stock }: { id: number; stock: number }) => {
            const res = await apiRequest("PUT", `/api/admin/products/${id}`, { stock });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/products"] });
            toast({
                title: "Stock updated",
                description: "Inventory level has been updated successfully.",
            });
            setIsAdjustmentDialogOpen(false);
            setSelectedProduct(null);
            setAdjustmentAmount(0);
        },
        onError: (error: Error) => {
            toast({
                title: "Failed to update stock",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const filteredProducts = products.filter((product: ProductWithCategory) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAdjustStock = () => {
        if (!selectedProduct) return;
        const newStock = selectedProduct.stock + adjustmentAmount;
        if (newStock < 0) {
            toast({
                title: "Invalid Stock",
                description: "Stock cannot be negative.",
                variant: "destructive"
            });
            return;
        }
        updateStockMutation.mutate({ id: selectedProduct.id, stock: newStock });
    };

    const handleSetStock = () => {
        if (!selectedProduct) return;
        if (adjustmentAmount < 0) {
            toast({
                title: "Invalid Stock",
                description: "Stock cannot be negative.",
                variant: "destructive"
            });
            return;
        }
        updateStockMutation.mutate({ id: selectedProduct.id, stock: adjustmentAmount });
    }

    return (
        <AdminLayout>
            <Helmet>
                <title>Inventory Management | Probashi Bakery Admin</title>
            </Helmet>

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Inventory Management</h1>
            </div>

            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Current Stock</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">
                                    <div className="flex justify-center items-center">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredProducts?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                    No products found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredProducts?.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell>{product.category?.name || "Uncategorized"}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold">{product.stock}</span>
                                            {product.stock <= product.lowStockThreshold && (
                                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {product.stock === 0 ? (
                                            <Badge variant="destructive">Out of Stock</Badge>
                                        ) : product.stock <= product.lowStockThreshold ? (
                                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                                                Low Stock
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                                In Stock
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Dialog open={isAdjustmentDialogOpen && selectedProduct?.id === product.id} onOpenChange={(open) => {
                                            setIsAdjustmentDialogOpen(open);
                                            if (!open) {
                                                setSelectedProduct(null);
                                                setAdjustmentAmount(0);
                                            } else {
                                                setSelectedProduct(product);
                                                setAdjustmentAmount(product.stock); // Default to current stock for "Set" mode might be better UX, or 0 for "Add"
                                            }
                                        }}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm" onClick={() => {
                                                    setSelectedProduct(product);
                                                    setAdjustmentAmount(product.stock);
                                                    setIsAdjustmentDialogOpen(true);
                                                }}>
                                                    <Package className="h-4 w-4 mr-2" />
                                                    Adjust Stock
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Adjust Stock: {product.name}</DialogTitle>
                                                </DialogHeader>
                                                <div className="py-4 space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium">Current Stock:</span>
                                                        <span className="text-lg font-bold">{product.stock}</span>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">New Stock Level</label>
                                                        <Input
                                                            type="number"
                                                            value={adjustmentAmount}
                                                            onChange={(e) => setAdjustmentAmount(parseInt(e.target.value) || 0)}
                                                            min="0"
                                                        />
                                                        <p className="text-xs text-gray-500">
                                                            Enter the total quantity available in stock.
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="outline" onClick={() => setIsAdjustmentDialogOpen(false)}>Cancel</Button>
                                                    <Button onClick={handleSetStock} disabled={updateStockMutation.isPending}>
                                                        {updateStockMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                        Update Stock
                                                    </Button>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </AdminLayout>
    );
}
