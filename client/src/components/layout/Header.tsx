import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ShoppingCart, User, Menu } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import CartSidebar from '@/components/cart/CartSidebar';
import MobileSidebar from './MobileSidebar';

const Header = () => {
  const [location] = useLocation();
  const { cart, isOpen, setIsOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <header className="bg-gradient-to-r from-[#faf6f1] to-white shadow-md backdrop-blur-sm fixed top-0 left-0 right-0 z-50 border-b border-[#e3d9c8]">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <span className="text-primary text-3xl font-heading font-bold tracking-tight">SweetBite</span>
                <span className="ml-1 text-accent/80 text-xs uppercase tracking-widest font-semibold hidden sm:inline-block">Bakery</span>
              </div>
            </Link>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-10">
            <Link href="/">
              <div className={`text-text-dark hover:text-primary transition-colors duration-300 font-semibold relative cursor-pointer ${location === '/' ? 'text-primary' : ''}`}>
                <span>Home</span>
                {location === '/' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full transform translate-y-1"></span>}
              </div>
            </Link>
            <Link href="/products">
              <div className={`text-text-dark hover:text-primary transition-colors duration-300 font-semibold relative cursor-pointer ${location === '/products' ? 'text-primary' : ''}`}>
                <span>Products</span>
                {location === '/products' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full transform translate-y-1"></span>}
              </div>
            </Link>
            <Link href="/#about">
              <div className="text-text-dark hover:text-primary transition-colors duration-300 font-semibold cursor-pointer">
                About Us
              </div>
            </Link>
            <Link href="/#contact">
              <div className="text-text-dark hover:text-primary transition-colors duration-300 font-semibold cursor-pointer">
                Contact
              </div>
            </Link>
          </nav>

          {/* Cart and Account - Desktop */}
          <div className="hidden md:flex items-center space-x-5">
            <div className="relative group">
              <button 
                className="flex items-center text-text-dark hover:text-primary transition-colors"
                onClick={() => setIsOpen(true)}
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="ml-2 font-semibold">Cart</span>
                {cart.items.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    {cart.items.length}
                  </span>
                )}
              </button>
            </div>
            
            <Link href="/admin/login">
              <div className="flex items-center text-text-dark hover:text-primary transition-colors cursor-pointer">
                <User className="h-5 w-5" />
                <span className="ml-2 font-semibold">Account</span>
              </div>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden space-x-4">
            <button 
              className="p-2 text-primary relative"
              onClick={() => setIsOpen(true)}
              aria-label="Open cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {cart.items.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                  {cart.items.length}
                </span>
              )}
            </button>
            <button 
              className="text-primary p-2" 
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Cart Sidebar */}
      <CartSidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      
      {/* Mobile Menu Sidebar */}
      <MobileSidebar isOpen={mobileMenuOpen} setIsOpen={setMobileMenuOpen} />
    </header>
  );
};

export default Header;
