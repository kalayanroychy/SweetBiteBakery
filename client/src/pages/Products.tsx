import { useEffect, useMemo, Suspense } from "react";
import { useSuspenseQuery, useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import Layout from "@/components/layout/Layout";
import ProductGrid from "@/components/products/ProductGrid";
import { ProductWithCategory, Category } from "@shared/schema";
import { useQueryState } from "@/hooks/use-query-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ProductSkeleton = () => (
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
);

const CategorySelectorSkeleton = () => (
  <div className="h-10 w-full md:w-48 bg-gray-200 animate-pulse rounded-md"></div>
);

const CategorySelectorSuspense = ({ queryParams, onCategoryChange }: { queryParams: any, onCategoryChange: (v: string) => void }) => {
  const { data: categories } = useSuspenseQuery<Category[]>({
    queryKey: ['/api/categories'],
    staleTime: 5 * 60 * 1000,
  });

  return (
    <Select
      value={queryParams.category || 'all'}
      onValueChange={onCategoryChange}
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
  );
};

const ProductStream = ({ queryParams, setQueryParams }: { queryParams: any, setQueryParams: (v: any) => void }) => {
  // Fetch products with suspense infinite query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useSuspenseInfiniteQuery({
    queryKey: ['/api/products', queryParams],
    queryFn: async ({ pageParam = 0 }) => {
      const limit = 6;
      const offset = pageParam;

      const searchParams = new URLSearchParams();
      searchParams.append('limit', limit.toString());
      searchParams.append('offset', offset.toString());

      if (queryParams.category) searchParams.append('category', queryParams.category);
      if (queryParams.price) searchParams.append('price', queryParams.price);
      if (queryParams.q) searchParams.append('q', queryParams.q);
      if (queryParams.dietary) searchParams.append('dietary', queryParams.dietary);
      if (queryParams.sort) searchParams.append('sort', queryParams.sort);

      const response = await fetch(`/api/products?${searchParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce((sum, page) => sum + page.products.length, 0);
      return loadedCount < lastPage.total ? loadedCount : undefined;
    },
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000,
  });

  const products = data?.pages.flatMap(page => page.products) || [];

  const handleCategoryChange = (value: string) => {
    const newParams = { ...queryParams };
    if (value === 'all') {
      delete newParams.category;
    } else {
      newParams.category = value;
    }
    setQueryParams(newParams);
  };

  return (
    <ProductGrid
      products={products}
      isLoading={false}
      error={null}
      fetchNextPage={fetchNextPage}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      queryParams={queryParams}
      setQueryParams={setQueryParams}
      categorySelector={
        <Suspense fallback={<CategorySelectorSkeleton />}>
          <CategorySelectorSuspense 
            queryParams={queryParams} 
            onCategoryChange={handleCategoryChange} 
          />
        </Suspense>
      }
    />
  );
};

const Products = () => {
  const [queryParams, setQueryParams] = useQueryState();

  return (
    <Layout>
      <Helmet>
        <title>Products | Probashi Bakery</title>
        <meta name="description" content="Browse our delicious selection of freshly baked goods including cakes, pastries, cookies, and artisan breads." />
        <meta property="og:title" content="Products | Probashi Bakery" />
        <meta property="og:description" content="Browse our delicious selection of freshly baked goods including cakes, pastries, cookies, and artisan breads." />
      </Helmet>

      <section className="py-20 bg-neutral">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-primary mb-4">Our Products</h1>
          </div>

          <Suspense fallback={<ProductSkeleton />}>
            <ProductStream queryParams={queryParams} setQueryParams={setQueryParams} />
          </Suspense>
        </div>
      </section>
    </Layout>
  );
};

export default Products;
