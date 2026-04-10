import { useState, Suspense } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Helmet } from "react-helmet";
import AdminLayout from "@/components/layout/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Product, Category } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, RotateCcw, Printer, CheckCircle, User, Loader2 } from "lucide-react";
import { createPortal } from "react-dom";
import { POSInvoice } from "@/components/pos/POSInvoice";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

interface CartItem extends Product {
    cartId: string;
    quantity: number;
}

const POSContent = () => {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [activeCategory, setActiveCategory] = useState("all");
    const [cart, setCart] = useState<CartItem[]>([]);
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lastOrder, setLastOrder] = useState<any>(null);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);

    // Fetch Products with ISR-like polling and stale time
    const { data: productsData } = useSuspenseQuery<any>({
        queryKey: ["/api/products", { limit: 1000 }],
        staleTime: 60 * 1000,
        refetchInterval: 5 * 60 * 1000,
    });

    const products = productsData?.products || productsData || [];

    // Fetch Categories
    const { data: categories } = useSuspenseQuery<Category[]>({
        queryKey: ["/api/categories"],
        staleTime: 300 * 1000,
        refetchInterval: 10 * 60 * 1000,
    });

    const addToCart = (product: Product) => {
        if (product.stock <= 0) {
            toast({
                title: "Out of Stock",
                description: `${product.name} is out of stock.`,
                variant: "destructive",
                duration: 2000,
            });
            return;
        }

        const existingItem = cart.find((item) => item.id === product.id);
        if (existingItem && existingItem.quantity >= product.stock) {
            toast({
                title: "Stock Limit Reached",
                description: `Cannot add more ${product.name}. Stock: ${product.stock}`,
                variant: "destructive",
                duration: 2000,
            });
            return;
        }

        setCart((prev) => {
            if (existingItem) {
                return prev.map((item) =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prev, { ...product, cartId: Math.random().toString(36).substr(2, 9), quantity: 1 }];
        });

        toast({
            title: "Added to cart",
            description: `${product.name} added to order.`,
            duration: 2000,
        });
    };

    const removeFromCart = (cartId: string) => {
        setCart((prev) => prev.filter((item) => item.cartId !== cartId));
    };

    const updateQuantity = (cartId: string, delta: number) => {
        setCart((prev) =>
            prev.map((item) => {
                if (item.cartId === cartId) {
                    const newQuantity = Math.max(1, item.quantity + delta);
                    return { ...item, quantity: newQuantity };
                }
                return item;
            })
        );
    };

    const clearCart = () => {
        setCart([]);
        setCustomerName("");
        setCustomerPhone("");
        setCustomerEmail("");
    };

    const calculateTotal = () => {
        return cart.reduce((total, item) => total + item.price * item.quantity, 0);
    };

    const filteredProducts = Array.isArray(products)
        ? products.filter((product: Product) => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = activeCategory === "all" || product.categoryId.toString() === activeCategory;
            return matchesSearch && matchesCategory;
        })
        : [];

    const handleCheckout = async () => {
        if (cart.length === 0) {
            toast({
                title: "Cart is empty",
                description: "Please add products to the cart first.",
                variant: "destructive",
            });
            return;
        }

        if (!customerName) {
            toast({
                title: "Customer Name Required",
                description: "Please enter a customer name (or 'Walk-in').",
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const orderData = {
                customerName,
                customerEmail: customerEmail || "walk-in@pos.local",
                customerPhone: customerPhone || "0000000000",
                address: "Store Pickup",
                city: "Store",
                state: "Store",
                zipCode: "0000",
                total: calculateTotal(),
                items: cart.map((item) => ({
                    productId: item.id,
                    quantity: item.quantity,
                    price: item.price,
                    name: item.name
                })),
                paymentMethod: "cash",
                status: "delivered"
            };

            const res = await apiRequest("POST", "/api/admin/orders/create", orderData);
            const newOrder = await res.json();

            setLastOrder(newOrder);
            setShowSuccessDialog(true);
            clearCart();
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to create order.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleNewOrder = () => {
        setShowSuccessDialog(false);
        setLastOrder(null);
    };

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden">
            {/* Left Side: Products */}
            <div className="flex-1 flex flex-col p-4 border-r bg-gray-50/50">
                <div className="flex space-x-4 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Search products..."
                            className="pl-9 bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory} className="w-full mb-4">
                    <TabsList className="w-full justify-start overflow-x-auto">
                        <TabsTrigger value="all">All Items</TabsTrigger>
                        {categories && Array.isArray(categories) && categories.map((cat: Category) => (
                            <TabsTrigger key={cat.id} value={cat.id.toString()}>
                                {cat.name}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>

                <ScrollArea className="flex-1 pr-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 pb-20">
                        {filteredProducts.length === 0 ? (
                            <div className="col-span-full text-center py-10 text-gray-500">No products found</div>
                        ) : (
                            filteredProducts.map((product: Product) => (
                                <Card
                                    key={product.id}
                                    className={`cursor-pointer hover:shadow-md transition-shadow group overflow-hidden border-0 shadow-sm ${product.stock <= 0 ? 'opacity-60 grayscale' : ''}`}
                                    onClick={() => product.stock > 0 && addToCart(product)}
                                >
                                    <div className="aspect-square relative overflow-hidden bg-gray-100">
                                        <img
                                            src={product.image || "/No_image_available.svg.webp"}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            onError={(e) => {
                                                e.currentTarget.src = "/No_image_available.svg.webp";
                                            }}
                                        />
                                        {product.stock <= 0 && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <span className="text-white font-bold text-sm bg-red-600 px-2 py-1 rounded">Out of Stock</span>
                                            </div>
                                        )}
                                        {product.stock > 0 && product.stock <= (product.lowStockThreshold || 5) && (
                                            <div className="absolute top-2 right-2">
                                                <Badge variant="destructive" className="bg-amber-500 hover:bg-amber-600 text-xs">Low: {product.stock}</Badge>
                                            </div>
                                        )}
                                    </div>
                                    <CardContent className="p-2">
                                        <h3 className="font-medium text-xs truncate" title={product.name}>{product.name}</h3>
                                        <div className="flex justify-between items-center mt-1">
                                            <p className="text-primary font-bold text-xs">{formatCurrency(product.price)}</p>
                                            {product.stock > 0 && (
                                                <span className="text-[10px] text-gray-500">Stock: {product.stock}</span>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Right Side: Cart */}
            <div className="w-[400px] bg-white flex flex-col shadow-xl z-10">
                <div className="p-4 border-b">
                    <h2 className="text-xl font-bold flex items-center">
                        <ShoppingCart className="mr-2 h-5 w-5" /> Current Order
                    </h2>
                </div>

                <div className="p-4 space-y-3 bg-gray-50 border-b">
                    <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Customer Name (e.g. Walk-in)"
                            className="pl-9 bg-white"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                        />
                    </div>
                    <Input
                        placeholder="Mobile Number"
                        className="bg-white"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                    <Input
                        placeholder="Email (Optional)"
                        className="bg-white"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                    />
                </div>

                <ScrollArea className="flex-1 p-4">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                            <ShoppingCart className="h-12 w-12 mb-2 opacity-20" />
                            <p>Cart is empty</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {cart.map((item) => (
                                <div key={item.cartId} className="flex gap-3">
                                    <div className="h-16 w-16 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                                        <img 
                                            src={item.image || "/No_image_available.svg.webp"} 
                                            className="h-full w-full object-cover" 
                                            onError={(e) => {
                                                e.currentTarget.src = "/No_image_available.svg.webp";
                                            }}
                                        />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-medium text-sm line-clamp-2">{item.name}</h4>
                                            <button onClick={() => removeFromCart(item.cartId)} className="text-gray-400 hover:text-red-500">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="flex justify-between items-center mt-2">
                                            <div className="flex items-center border rounded-md">
                                                <button
                                                    onClick={() => updateQuantity(item.cartId, -1)}
                                                    className="px-2 py-1 hover:bg-gray-100 border-r"
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </button>
                                                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.cartId, 1)}
                                                    className="px-2 py-1 hover:bg-gray-100 border-l"
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </button>
                                            </div>
                                            <span className="font-bold">{formatCurrency(item.price * item.quantity)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                <div className="p-4 border-t bg-gray-50">
                    <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Subtotal</span>
                            <span>{formatCurrency(calculateTotal())}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Tax</span>
                            <span>{formatCurrency(0)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                            <span>Total</span>
                            <span>{formatCurrency(calculateTotal())}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
                            onClick={clearCart} 
                            disabled={cart.length === 0}
                        >
                            <RotateCcw className="mr-2 h-4 w-4" /> Clear
                        </button>
                        <Button onClick={handleCheckout} disabled={cart.length === 0 || isSubmitting}>
                            <CreditCard className="mr-2 h-4 w-4" /> Charge
                        </Button>
                    </div>
                </div>
            </div>

            {/* Print Invoice Portal */}
            {
                lastOrder && createPortal(
                    <POSInvoice order={lastOrder} />,
                    document.body
                )
            }

            {/* Success Dialog */}
            <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center text-green-600">
                            <CheckCircle className="mr-2 h-6 w-6" />
                            Order Completed Successfully
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center py-6 space-y-2">
                        <p className="text-lg font-medium">Order #{lastOrder?.id}</p>
                        <p className="text-3xl font-bold">{lastOrder && formatCurrency(lastOrder.total)}</p>
                        <p className="text-gray-500 text-sm">Customer: {lastOrder?.customerName}</p>
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button variant="outline" onClick={handleNewOrder} className="w-full sm:w-auto">
                            <Plus className="mr-2 h-4 w-4" /> New Order
                        </Button>
                        <Button onClick={handlePrint} className="w-full sm:w-auto">
                            <Printer className="mr-2 h-4 w-4" /> Print Invoice
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

const AdminPOS = () => {
    return (
        <AdminLayout>
            <Helmet>
                <title>POS System | Probashi Admin</title>
            </Helmet>

            <Suspense fallback={
                <div className="flex h-[calc(100vh-64px)] items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">Loading POS System...</p>
                    </div>
                </div>
            }>
                <POSContent />
            </Suspense>
        </AdminLayout >
    );
};

export default AdminPOS;
