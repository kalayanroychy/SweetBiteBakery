import { useState, useEffect, useMemo, useRef } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { Search } from 'lucide-react';
import { ProductWithCategory, Category } from '@shared/schema';
import ProductCard from './ProductCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type ProductGridProps = {
  products: ProductWithCategory[];
  isLoading: boolean;
  error: unknown;
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  queryParams: any; // Using any for now to match the hook return type, but interface is better
  setQueryParams: (params: any) => void;
  categories: Category[];
};

const ProductGrid = ({
  products,
  isLoading,
  error,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  queryParams,
  setQueryParams,
  categories
}: ProductGridProps) => {
  // Local state for search input to avoid triggering fetch on every keystroke
  const [localSearch, setLocalSearch] = useState(queryParams.q || '');
  const gridRef = useRef<HTMLDivElement>(null);

  // Debounce search update
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== (queryParams.q || '')) {
        const newParams = { ...queryParams };
        if (localSearch) {
          newParams.q = localSearch;
        } else {
          delete newParams.q;
        }
        setQueryParams(newParams);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localSearch, queryParams, setQueryParams]);

  // Sync local search if URL changes externally
  useEffect(() => {
    if (queryParams.q !== localSearch) {
      setLocalSearch(queryParams.q || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams.q]);

  const handleSortChange = (value: string) => {
    const newParams = { ...queryParams, sort: value };
    setQueryParams(newParams);
  };

  const handleCategoryChange = (value: string) => {
    const newParams = { ...queryParams };
    if (value === 'all') {
      delete newParams.category;
    } else {
      newParams.category = value;
    }
    setQueryParams(newParams);
  };

  // Virtualization Setup
  const [columns, setColumns] = useState(6);

  useEffect(() => {
    const updateColumns = () => {
      if (window.innerWidth < 768) setColumns(2); // Mobile
      else if (window.innerWidth < 1024) setColumns(4); // Tablet
      else setColumns(6); // Desktop
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  const rows = useMemo(() => {
    const result = [];
    for (let i = 0; i < products.length; i += columns) {
      result.push(products.slice(i, i + columns));
    }
    return result;
  }, [products, columns]);

  const rowVirtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => 400, // Approximate height of a row
    overscan: 5,
    scrollMargin: gridRef.current?.offsetTop ?? 0,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  // Infinite Scroll Trigger
  useEffect(() => {
    const onScroll = () => {
      // Check if we're near the bottom of the page
      if (
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage?.();
      }
    };

    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="w-full lg:pl-8" ref={gridRef}>
      {/* Search, Category, and Sort */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="w-full md:w-auto">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search products..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full md:w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
            <Search className="absolute left-3 top-3 text-gray-400" size={16} />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          {/* Category Dropdown */}
          <Select
            value={queryParams.category || 'all'}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary w-full md:w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.slug}>{category.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort Dropdown */}
          <Select
            value={queryParams.sort || 'featured'}
            onValueChange={handleSortChange}
          >
            <SelectTrigger className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary w-full md:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="bestselling">Bestselling</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Product Grid */}
      {isLoading && products.length === 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden p-6 animate-pulse">
              <div className="w-full h-48 bg-gray-200 mb-4"></div>
              <div className="h-6 bg-gray-200 w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 w-full mb-4"></div>
              <div className="h-4 bg-gray-200 w-5/6 mb-4"></div>
              <div className="flex justify-between items-center">
                <div className="h-6 bg-gray-200 w-20"></div>
                <div className="h-10 bg-gray-200 w-32 rounded-md"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center text-red-500 p-4">
          Failed to load products. Please try again later.
        </div>
      ) : products.length === 0 ? (
        <div className="text-center p-8">
          <h3 className="text-xl font-semibold mb-2">No products found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <>
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualItems.map((virtualRow) => {
              const rowProducts = rows[virtualRow.index];
              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start - rowVirtualizer.options.scrollMargin}px)`,
                  }}
                  className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
                >
                  {rowProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      priority={virtualRow.index === 0}
                    />
                  ))}
                </div>
              );
            })}
          </div>

          {/* Load More Button - kept as backup/indicator */}
          {hasNextPage && (
            <div className="flex justify-center mt-8 py-4">
              {isFetchingNextPage ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              ) : (
                <button
                  onClick={() => fetchNextPage?.()}
                  className="px-8 py-3 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Load More
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductGrid;
