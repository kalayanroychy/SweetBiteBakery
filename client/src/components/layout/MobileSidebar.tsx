import { useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { X, User, Home, ShoppingBag, Info, Phone, Package } from 'lucide-react';

type MobileSidebarProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

const MobileSidebar = ({ isOpen, setIsOpen }: MobileSidebarProps) => {
  const [location] = useLocation();

  // Close sidebar when location changes
  useEffect(() => {
    setIsOpen(false);
  }, [location, setIsOpen]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop with blur effect */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-[280px] max-w-[85vw] bg-gradient-to-b from-[#faf6f1] to-white shadow-xl overflow-y-auto translate-x-0 transition-transform duration-300 ease-in-out border-l border-[#e3d9c8]">
        {/* Header */}
        <div className="p-6 flex justify-between items-center border-b border-[#e3d9c8]">
          <h2 className="font-heading text-xl font-bold text-primary">Probashi Bakery</h2>
          <button
            className="rounded-full p-2 text-primary hover:bg-neutral transition-colors"
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-5">
          <ul className="space-y-4">
            <li>
              <Link href="/">
                <div className={`flex items-center p-3 hover:text-primary rounded-xl transition-all duration-200 cursor-pointer ${location === '/'
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-text-dark hover:bg-neutral'
                  }`}>
                  <Home className="mr-3" size={18} />
                  <span className="font-medium">Home</span>
                </div>
              </Link>
            </li>
            <li>
              <Link href="/products">
                <div className={`flex items-center p-3 hover:text-primary rounded-xl transition-all duration-200 cursor-pointer ${location === '/products'
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-text-dark hover:bg-neutral'
                  }`}>
                  <ShoppingBag className="mr-3" size={18} />
                  <span className="font-medium">Products</span>
                </div>
              </Link>
            </li>
            <li>
              <Link href="/#about">
                <div className="flex items-center p-3 text-text-dark hover:text-primary hover:bg-neutral rounded-xl transition-all duration-200 cursor-pointer">
                  <Info className="mr-3" size={18} />
                  <span className="font-medium">About Us</span>
                </div>
              </Link>
            </li>
            <li>
              <Link href="/#contact">
                <div className="flex items-center p-3 text-text-dark hover:text-primary hover:bg-neutral rounded-xl transition-all duration-200 cursor-pointer">
                  <Phone className="mr-3" size={18} />
                  <span className="font-medium">Contact</span>
                </div>
              </Link>
            </li>
            <li>
              <Link href="/order-tracking">
                <div className={`flex items-center p-3 hover:text-primary rounded-xl transition-all duration-200 cursor-pointer ${location === '/order-tracking'
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-text-dark hover:bg-neutral'
                  }`}>
                  <Package className="mr-3" size={18} />
                  <span className="font-medium">Order Tracking</span>
                </div>
              </Link>
            </li>
          </ul>
        </nav>

        {/* Account Section */}
        <div className="absolute bottom-0 left-0 right-0 p-5 border-t border-[#e3d9c8] bg-[#faf6f1]/80 backdrop-blur-sm">
          <Link href="/admin/login">
            <div className="flex items-center p-3 text-text-dark hover:text-primary hover:bg-neutral rounded-xl transition-all duration-200 cursor-pointer">
              <User className="mr-3" size={18} />
              <span className="font-medium">My Account</span>
            </div>
          </Link>
          <div className="mt-4 text-center text-xs text-gray-500">
            <p>© 2025 Probashi Bakery Bakery</p>
            <p className="mt-1">Hand-crafted with love</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileSidebar;
