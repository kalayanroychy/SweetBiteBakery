import { useRef, forwardRef } from 'react';
import { formatCurrency } from '@/lib/utils';
import { Order, OrderItem } from '@shared/schema';

interface POSInvoiceProps {
    order: (Order & { items: (OrderItem & { name?: string })[] }) | null;
}

export const POSInvoice = forwardRef<HTMLDivElement, POSInvoiceProps>(({ order }, ref) => {
    if (!order) return null;

    return (
        <div ref={ref} className="pos-invoice-print hidden">
            <style>
                {`
                    @media print {
                        @page { margin: 0; size: auto; }
                        body * {
                            visibility: hidden;
                        }
                        .pos-invoice-print, .pos-invoice-print * {
                            visibility: visible;
                        }
                        .pos-invoice-print {
                            display: block !important;
                            position: fixed;
                            left: 0;
                            top: 0;
                            width: 100%;
                            height: 100%;
                            z-index: 9999;
                            background: white;
                            padding: 10px;
                        }
                    }
                `}
            </style>
            <div className="w-[80mm] max-w-full mx-auto border sm:border-0 p-2">
                {/* Header */}
                <div className="text-center mb-4">
                    <h1 className="text-xl font-bold uppercase">Probashi Bakery</h1>
                    <p className="text-xs">25 katalgonj,Panchalish ThanaChattogram, 4203</p>
                    <p className="text-xs">Phone: 01829 88 88 88</p>
                </div>

                {/* Order Info */}
                <div className="mb-4 border-b border-black pb-2 border-dashed">
                    <p>Order #: {order.id}</p>
                    <p>Date: {new Date().toLocaleString()}</p>
                    <p>Customer: {order.customerName}</p>
                    {order.customerPhone && <p>Mobile: {order.customerPhone}</p>}
                </div>

                {/* Items */}
                <div className="mb-4">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-black border-dashed">
                                <th className="py-1">Item</th>
                                <th className="py-1 text-right">Qty</th>
                                <th className="py-1 text-right">Price</th>
                                <th className="py-1 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.items?.map((item, index) => (
                                <tr key={index}>
                                    <td className="py-1 pr-2">
                                        <div className="font-bold">{item.name || `Pro #${item.productId}`}</div>
                                    </td>
                                    <td className="py-1 text-right align-top">{item.quantity}</td>
                                    <td className="py-1 text-right align-top">{item.price}</td>
                                    <td className="py-1 text-right align-top">{item.price * item.quantity}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="border-t border-black border-dashed pt-2 mb-6">
                    <div className="flex justify-between font-bold text-lg">
                        <span>TOTAL</span>
                        <span>{order.total}</span>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                        <span>Payment Method</span>
                        <span className="uppercase">{order.paymentMethod}</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center text-xs space-y-2">
                    <p>Thank you for your purchase!</p>
                    <p>Visit us at www.probashibakery.com</p>
                </div>
            </div>
        </div>
    );
});

POSInvoice.displayName = 'POSInvoice';
