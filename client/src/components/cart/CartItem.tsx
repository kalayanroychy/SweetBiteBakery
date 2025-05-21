import { X, Minus, Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { CartItem as CartItemType } from '@shared/schema';
import { useCart } from '@/hooks/use-cart';

type CartItemProps = {
  item: CartItemType;
};

const CartItem = ({ item }: CartItemProps) => {
  const { removeFromCart, updateCartItemQuantity } = useCart();

  return (
    <div className="flex items-start py-4 border-b border-[#e3d9c8] group hover:bg-[#faf6f1]/50 rounded-lg transition-colors p-2 -mx-2">
      {/* Product Image */}
      <div className="w-20 h-20 rounded-lg overflow-hidden bg-white border border-[#e3d9c8] shadow-sm flex-shrink-0">
        <img 
          src={item.image} 
          alt={item.name} 
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Product Details */}
      <div className="ml-4 flex-1">
        <div className="flex justify-between">
          <h4 className="font-semibold text-text-dark group-hover:text-primary transition-colors">{item.name}</h4>
          <button 
            className="text-gray-400 hover:text-error transition-colors opacity-60 group-hover:opacity-100"
            onClick={() => removeFromCart(item.productId)}
            aria-label="Remove item"
          >
            <X size={16} />
          </button>
        </div>
        
        <p className="text-sm text-gray-500 mb-2">{formatCurrency(item.price)} each</p>
        
        {/* Quantity Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center border border-[#e3d9c8] rounded-full overflow-hidden bg-white">
            <button 
              className="text-xs w-8 h-8 flex items-center justify-center text-primary hover:bg-[#faf6f1] transition-colors"
              onClick={() => updateCartItemQuantity(item.productId, Math.max(1, item.quantity - 1))}
              aria-label="Decrease quantity"
            >
              <Minus size={14} />
            </button>
            <span className="text-sm font-medium px-3">{item.quantity}</span>
            <button 
              className="text-xs w-8 h-8 flex items-center justify-center text-primary hover:bg-[#faf6f1] transition-colors"
              onClick={() => updateCartItemQuantity(item.productId, item.quantity + 1)}
              aria-label="Increase quantity"
            >
              <Plus size={14} />
            </button>
          </div>
          
          {/* Subtotal */}
          <p className="font-semibold text-primary">
            {formatCurrency(item.price * item.quantity)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
