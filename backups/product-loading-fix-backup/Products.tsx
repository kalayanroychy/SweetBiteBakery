import { useEffect, useMemo } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import Layout from "@/components/layout/Layout";
import ProductFilter from "@/components/products/ProductFilter";
import ProductGrid from "@/components/products/ProductGrid";
import { ProductWithCategory, Category } from "@shared/schema";
import { useQueryState } from "@/hooks/use-query-state";

const Products = () => {
  const [queryParams] = useQueryState();

  // Fetch products with infinite query for progressive loading
  const {
    data,
    isLoading: productsLoading,
    error: productsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['/api/products', queryParams],
    queryFn: async ({ pageParam = 0 }) => {
      const limit = 6;
      const offset = pageParam;

      const searchParams = new URLSearchParams();
      searchParams.append('limit', limit.toString());
      searchParams.append('offset', offset.toString()); // type-check: pageParam is offset

      if (queryParams.category) searchParams.append('category', queryParams.category);
      if (queryParams.price) searchParams.append('price', queryParams.price);
      if (queryParams.q) searchParams.append('q', queryParams.q);
      if (queryParams.dietary) searchParams.append('dietary', queryParams.dietary);

      const response = await fetch(`/api/products?${searchParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce((sum, page) => sum + page.products.length, 0);
      return loadedCount < lastPage.total ? loadedCount : undefined;
    },
    initialPageParam: 0
  });

  // Flatten all pages into single array
  const products = data?.pages.flatMap(page => page.products) || [];

  // Fetch categories for filtering
  const {
    data: categories,
    isLoading: categoriesLoading
  } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

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
            {/* <p className="text-text-dark max-w-2xl mx-auto">
              Browse our delicious selection of freshly baked goods made with love and the finest ingredients.
            </p> */}
          </div>

          <div className="flex flex-wrap ">
            <div className="w-full lg:w-1/4 mb-6 lg:mb-0">
              {categoriesLoading ? (
                <div className="animate-pulse bg-white p-6 rounded-lg shadow-md">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-6"></div>
                  <div className="h-5 bg-gray-200 rounded w-full mb-4"></div>
                  <div className="h-5 bg-gray-200 rounded w-full mb-4"></div>
                  <div className="h-5 bg-gray-200 rounded w-full mb-4"></div>
                  <div className="h-5 bg-gray-200 rounded w-full"></div>
                </div>
              ) : (
                <ProductFilter categories={categories || []} />
              )}
            </div>

            <div className="w-full lg:w-3/4">
              <ProductGrid
                products={products}
                isLoading={productsLoading}
                error={productsError}
                fetchNextPage={fetchNextPage}
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
              />
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Products;
