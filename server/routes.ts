import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { ZodError } from "zod";
import {
  insertCategorySchema,
  insertProductSchema,
  insertOrderSchema,
  insertOrderItemSchema,
  insertUserSchema,
  loginSchema,
  registerSchema,
  newsletterSchema,
  contactFormSchema,
  insertSupplierSchema,
  insertPurchaseSchema,
  insertPurchaseItemSchema,
  type InsertPurchase,
  type InsertPurchaseItem
} from "../shared/schema.js";
import { checkAuth, authenticateUser } from "./auth.js";
import { loadInitialData } from "./loadInitialData.js";
import { checkDatabaseConnection } from "./db.js";
import { optimizeImage } from "./utils/image.js";
import { isrCache } from "./utils/isr-cache.js";


export async function registerRoutes(app: Express): Promise<Server> {
  // Check database connection or initialize storage
  try {
    const isConnected = await checkDatabaseConnection();

    if (isConnected) {
      console.log("Database connected, loading initial data if needed...");
      await loadInitialData(storage);
    } else {
      console.warn("Database connection failed, using MemStorage and loading initial data...");
      await loadInitialData(storage);
    }
  } catch (error) {
    console.error("Error checking database connection or initializing data:", error);
    // Even if check fails, try to load data into whatever storage we have
    await loadInitialData(storage);
  }

  // Debug endpoint
  app.get("/api/debug", async (_req: Request, res: Response) => {
    try {
      const { checkDatabaseConnection } = await import("./db.js");
      const isConnected = await checkDatabaseConnection();
      const hasUrl = !!process.env.DATABASE_URL;

      res.json({
        env: {
          hasDatabaseUrl: hasUrl,
          nodeEnv: process.env.NODE_ENV,
          vercelEnv: process.env.VERCEL_ENV || "not detected",
        },
        database: {
          connected: isConnected,
          storageType: process.env.DATABASE_URL ? "Database" : "In-Memory",
        }
      });
    } catch (error: any) {
      res.status(500).json({
        message: "Debug check failed",
        error: error.message
      });
    }
  });

  // Settings Routes
  app.get("/api/settings/:key", async (req: Request, res: Response) => {
    try {
      const key = req.params.key;
      // Allow public access mostly to store settings
      if (key !== 'store' && key !== 'payment') {
        // Optionally restrict other keys if needed, but for now allow public read
        // or checkAuth for sensitive keys if we add them later
      }
      const settings = await storage.getSettings(key);
      res.json(settings || {});
    } catch (error) {
      console.error(`Failed to fetch settings for key ${req.params.key}:`, error);
      res.json({});
    }
  });

  app.get("/api/admin/settings/:key", checkAuth, async (req: Request, res: Response) => {
    try {
      const key = req.params.key;
      const settings = await storage.getSettings(key);
      res.json(settings || {});
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put("/api/admin/settings/:key", checkAuth, async (req: Request, res: Response) => {
    try {
      const key = req.params.key;
      const value = req.body;
      const settings = await storage.updateSettings(key, value);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Admin Reports
  app.get("/api/admin/reports/sales", checkAuth, async (req: Request, res: Response) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(new Date().setMonth(new Date().getMonth() - 1));
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
      const type = req.query.type as string;

      if (type === 'details') {
        const report = await storage.getSalesDetails(startDate, endDate);
        res.json(report);
      } else {
        const report = await storage.getSalesReport(startDate, endDate);
        res.json(report);
      }
    } catch (error) {
      console.error("Sales Report Error:", error);
      res.status(500).json({ message: "Failed to generate sales report" });
    }
  });

  app.get("/api/admin/reports/purchases", checkAuth, async (req: Request, res: Response) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(new Date().setMonth(new Date().getMonth() - 1));
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
      const type = req.query.type as string;

      if (type === 'details') {
        const report = await storage.getPurchaseDetails(startDate, endDate);
        res.json(report);
      } else {
        const report = await storage.getPurchaseReport(startDate, endDate);
        res.json(report);
      }
    } catch (error) {
      console.error("Purchase Report Error:", error);
      res.status(500).json({ message: "Failed to generate purchase report" });
    }
  });

  app.get("/api/admin/reports/stock", checkAuth, async (req: Request, res: Response) => {
    try {
      const type = req.query.type as string;

      if (type === 'details') {
        const report = await storage.getStockDetails();
        res.json(report);
      } else {
        const report = await storage.getStockReport();
        res.json(report);
      }
    } catch (error) {
      console.error("Stock Report Error:", error);
      res.status(500).json({ message: "Failed to generate stock report" });
    }
  });

  // Categories
  app.get("/api/categories", async (_req: Request, res: Response) => {
    try {
      const categories = await isrCache.getData('categories:all', async () => {
        return await storage.getCategories();
      });
      
      res.set({
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      });
      
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });


  app.get("/api/categories/:slug", async (req: Request, res: Response) => {
    try {
      const category = await storage.getCategoryBySlug(req.params.slug);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  // Products
  app.get("/api/products", async (req: Request, res: Response) => {
    try {
      // Parse pagination parameters
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;

      // Parse filters
      const category = req.query.category as string | undefined;
      const search = req.query.q as string | undefined;

      let minPrice: number | undefined;
      let maxPrice: number | undefined;
      if (req.query.price) {
        const priceParam = req.query.price as string;
        // Handle "10-50,50-100" format by taking global min and max
        const ranges = priceParam.split(',');
        let globalMin = Infinity;
        let globalMax = -Infinity;

        ranges.forEach(range => {
          const [min, max] = range.split('-').map(Number);
          if (!isNaN(min) && min < globalMin) globalMin = min;
          if (!isNaN(max) && max > globalMax) globalMax = max;
        });

        if (globalMin !== Infinity) minPrice = globalMin;
        if (globalMax !== -Infinity) maxPrice = globalMax;
      }

      let dietary: string[] | undefined;
      if (req.query.dietary) {
        dietary = (req.query.dietary as string).split(',');
      }

      // Parse sort parameter
      const sort = req.query.sort as string | undefined;

      const filters = {
        category,
        search,
        minPrice,
        maxPrice,
        dietary,
        sort
      };

      const cacheKey = `products:${JSON.stringify({ limit, offset, filters })}`;

      const result = await isrCache.getData(cacheKey, async () => {
        const products = await storage.getProducts(limit, offset, filters);
        const categories = await storage.getCategories();
        const total = await storage.getProductsCount(filters);

        // Create a map of categories for O(1) lookup
        const categoryMap = new Map(categories.map(c => [c.id, c]));

        // Add category information to each product
        const productsWithCategory = products.map(product => {
          const category = categoryMap.get(product.categoryId);
          return {
            ...product,
            category: category || { id: 0, name: "Unknown", slug: "unknown" }
          };
        });

        return {
          products: productsWithCategory,
          total,
          limit,
          offset
        };
      });

      // Enable caching with stale-while-revalidate for browsers/CDNs
      res.set({
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      });

      res.json(result);

    } catch (error) {
      console.error("Products API Error:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/featured", async (_req: Request, res: Response) => {
    try {
      const productsWithCategory = await isrCache.getData('products:featured', async () => {
        const products = await storage.getFeaturedProducts();
        const categories = await storage.getCategories();

        // Add category information to each product
        return products.map(product => {
          const category = categories.find(c => c.id === product.categoryId);
          return {
            ...product,
            category: category || { id: 0, name: "Unknown", slug: "unknown" }
          };
        });
      });

      // Add HTTP caching headers for performance
      res.set({
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'ETag': `W/"featured-${productsWithCategory.length}"`,
      });

      res.json(productsWithCategory);

    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured products" });
    }
  });

  app.get("/api/products/category/:categoryId", async (req: Request, res: Response) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }

      const products = await storage.getProductsByCategory(categoryId);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products by category" });
    }
  });

  // Get product by ID (for admin editing)
  app.get("/api/admin/products/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const product = await storage.getProductById(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const category = await storage.getCategoryById(product.categoryId);
      const productWithCategory = {
        ...product,
        category: category || { id: 0, name: "Unknown", slug: "unknown" }
      };

      res.json(productWithCategory);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.get("/api/products/:slug", async (req: Request, res: Response) => {
    try {
      const product = await storage.getProductBySlug(req.params.slug);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const category = await storage.getCategoryById(product.categoryId);

      res.json({
        ...product,
        category: category || { id: 0, name: "Unknown", slug: "unknown" }
      });
    } catch (error) {
      console.error("Product by Slug API Error:", error); // Added logging
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Admin routes - protected by auth
  app.post("/api/admin/login", async (req: Request, res: Response) => {
    try {
      const credentials = loginSchema.parse(req.body);
      const result = await authenticateUser(credentials);

      if (result.success) {
        req.session.userId = result.userId;
        req.session.isAdmin = result.isAdmin;
        req.session.role = result.role;
        res.json({ success: true, isAdmin: result.isAdmin, role: result.role });
      } else {
        res.status(401).json({ message: result.error || "Invalid credentials" });
      }
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(500).json({ message: "Login failed" });
      }
    }
  });

  app.post("/api/admin/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  // User authentication routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const userData = registerSchema.parse(req.body);

      // Check if username or email already exists
      const existingUser = await storage.getUserByUsernameOrEmail(userData.username, userData.email);
      if (existingUser) {
        return res.status(400).json({
          message: existingUser.username === userData.username
            ? "Username already exists"
            : "Email already registered"
        });
      }

      // Create new user
      const newUser = await storage.createUser({
        username: userData.username,
        email: userData.email,
        password: userData.password,
        name: userData.name,
        isAdmin: false
      });

      // Automatically log in the user after registration
      req.session.userId = newUser.id;
      req.session.isAdmin = false;
      req.session.role = newUser.role;

      res.json({
        success: true,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          name: newUser.name
        }
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Registration failed" });
      }
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const credentials = loginSchema.parse(req.body);
      const result = await authenticateUser(credentials);

      if (result.success) {
        req.session.userId = result.userId;
        req.session.isAdmin = result.isAdmin;

        // Get user details to return
        const user = await storage.getUserById(result.userId!);

        res.json({
          success: true,
          isAdmin: result.isAdmin,
          role: result.role,
          user: user ? {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name,
            role: user.role
          } : null
        });
      } else {
        res.status(401).json({ message: result.error || "Invalid credentials" });
      }
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(500).json({ message: "Login failed" });
      }
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await storage.getUserById(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        role: user.role
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.put("/api/auth/password", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new password are required" });
      }

      const user = await storage.getUserById(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check current password
      // Note: In a real app with hashed passwords, use bcrypt.compare
      if (user.password !== currentPassword) {
        return res.status(400).json({ message: "Incorrect current password" });
      }

      // Update password
      await storage.updateUser?.(user.id, { password: newPassword });

      res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
      console.error("Password update error:", error);
      res.status(500).json({ message: "Failed to update password" });
    }
  });



  // Supplier Routes
  app.get("/api/admin/suppliers", checkAuth, async (_req: Request, res: Response) => {
    try {
      const suppliers = await storage.getSuppliers();
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  app.post("/api/admin/suppliers", checkAuth, async (req: Request, res: Response) => {
    try {
      const supplierData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(supplierData);
      res.status(201).json(supplier);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create supplier" });
      }
    }
  });

  app.put("/api/admin/suppliers/:id", checkAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

      const supplierData = insertSupplierSchema.partial().parse(req.body);
      const supplier = await storage.updateSupplier(id, supplierData);
      if (!supplier) return res.status(404).json({ message: "Supplier not found" });

      res.json(supplier);
    } catch (error) {
      res.status(500).json({ message: "Failed to update supplier" });
    }
  });

  app.delete("/api/admin/suppliers/:id", checkAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

      const success = await storage.deleteSupplier(id);
      if (!success) return res.status(404).json({ message: "Supplier not found" });

      res.json({ message: "Supplier deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete supplier" });
    }
  });

  // Purchase Routes
  app.get("/api/admin/purchases", checkAuth, async (_req: Request, res: Response) => {
    try {
      const purchases = await storage.getPurchases();
      // Enrich with supplier names if possible, or fetch separate
      // For simplicity, returning raw purchase first
      res.json(purchases);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch purchases" });
    }
  });

  app.put("/api/admin/purchases/:id", checkAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

      const { items, ...purchaseData } = req.body;
      const purchase = insertPurchaseSchema.partial().parse(purchaseData);

      // Need full items schema for validation
      const purchaseItems = items.map((item: any) => insertPurchaseItemSchema.parse(item));

      const updatedPurchase = await storage.updatePurchase(id, purchase as InsertPurchase, purchaseItems);
      if (!updatedPurchase) return res.status(404).json({ message: "Purchase not found" });

      res.json(updatedPurchase);
    } catch (error) {
      console.error("Purchase update error:", error);
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update purchase" });
      }
    }
  });

  app.get("/api/admin/purchases/:id", checkAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

      const purchase = await storage.getPurchaseById(id);
      if (!purchase) return res.status(404).json({ message: "Purchase not found" });

      const items = await storage.getPurchaseItems(id);
      res.json({ ...purchase, items });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch purchase" });
    }
  });

  app.post("/api/admin/purchases", checkAuth, async (req: Request, res: Response) => {
    try {
      const { items, ...purchaseData } = req.body;
      const purchase = insertPurchaseSchema.parse(purchaseData);
      const purchaseItems = items.map((item: any) => insertPurchaseItemSchema.parse(item));

      const newPurchase = await storage.processPurchase(purchase, purchaseItems);
      res.status(201).json(newPurchase);
    } catch (error) {
      console.error("Purchase creation error:", error);
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create purchase" });
      }
    }
  });

  // Admin products list with ISR caching
  app.get("/api/admin/products", checkAuth, async (req: Request, res: Response) => {
    try {
      const productsWithCategory = await isrCache.getData('admin:products:all', async () => {
        const products = await storage.getProducts();
        const categories = await storage.getCategories();

        // Create a map of categories for O(1) lookup
        const categoryMap = new Map(categories.map(c => [c.id, c]));

        // Add category information to each product
        return products.map(product => {
          const category = categoryMap.get(product.categoryId);
          return {
            ...product,
            category: category || { id: 0, name: "Unknown", slug: "unknown" }
          };
        });
      }, 60);

      // Add caching headers
      res.set({
        'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=120',
      });

      res.json(productsWithCategory);
    } catch (error) {
      console.error("Admin Products API Error:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Protected admin routes
  app.post("/api/admin/products", checkAuth, async (req: Request, res: Response) => {
    try {
      const productData = insertProductSchema.parse(req.body);

      // Optimize main image
      if (productData.image) {
        productData.image = await optimizeImage(productData.image);
      }

      // Optimize images array
      if (productData.images && Array.isArray(productData.images)) {
        productData.images = await Promise.all(
          productData.images.map(img => optimizeImage(img))
        );
      }

      const product = await storage.createProduct(productData);
      
      // Invalidate products cache
      isrCache.invalidatePattern('products');
      
      res.status(201).json(product);

    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create product" });
      }
    }
  });

  app.put("/api/admin/products/:id", checkAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const productData = insertProductSchema.partial().parse(req.body);
      console.log(`Updating product ${id} with:`, productData.name); // Debug log

      // Optimize main image if present
      if (productData.image) {
        productData.image = await optimizeImage(productData.image);
      }

      // Optimize images array if present
      if (productData.images && Array.isArray(productData.images)) {
        productData.images = await Promise.all(
          productData.images.map(img => optimizeImage(img))
        );
      }

      const product = await storage.updateProduct(id, productData);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Invalidate products cache
      isrCache.invalidatePattern('products');

      res.json(product);

    } catch (error) {
      console.error("Product Update Error:", error); // Debug log
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update product" });
      }
    }
  });

  app.delete("/api/admin/products/:id", checkAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const success = await storage.deleteProduct(id);
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Invalidate products cache
      isrCache.invalidatePattern('products');

      res.json({ success: true });

    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  app.post("/api/admin/categories", checkAuth, async (req: Request, res: Response) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);

      // Optimize category image if present
      if (categoryData.image) {
        categoryData.image = await optimizeImage(categoryData.image);
      }

      const category = await storage.createCategory(categoryData);
      
      // Invalidate products cache since categories moved
      isrCache.invalidatePattern('products');
      
      res.status(201).json(category);

    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create category" });
      }
    }
  });

  // Admin: User Management
  app.get("/api/admin/users", checkAuth, async (req: Request, res: Response) => {
    try {
      // Get all users from storage
      const allUsers = await storage.getUsers?.() || [];

      // Return users without passwords
      const users = allUsers.map((user: any) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        role: user.role,
        createdAt: user.createdAt
      }));

      res.json(users);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/users/:id", checkAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const user = await storage.getUserById(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return user without password
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        role: user.role,
        createdAt: user.createdAt
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/admin/users", checkAuth, async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Check if username or email already exists
      const existingUser = await storage.getUserByUsernameOrEmail(userData.username, userData.email);
      if (existingUser) {
        return res.status(400).json({
          message: existingUser.username === userData.username
            ? "Username already exists"
            : "Email already registered"
        });
      }

      // Create new user
      const newUser = await storage.createUser(userData);

      // Return user without password
      res.status(201).json({
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        name: newUser.name,
        isAdmin: newUser.isAdmin,
        role: newUser.role,
        createdAt: newUser.createdAt
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        console.error("User creation error:", error);
        res.status(500).json({ message: "Failed to create user" });
      }
    }
  });

  app.put("/api/admin/users/:id", checkAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const userData = insertUserSchema.partial().parse(req.body);

      // If updating username or email, check for conflicts
      if (userData.username || userData.email) {
        const existingUser = await storage.getUserById(id);
        if (!existingUser) {
          return res.status(404).json({ message: "User not found" });
        }

        if (userData.username && userData.username !== existingUser.username) {
          const usernameExists = await storage.getUserByUsername(userData.username);
          if (usernameExists) {
            return res.status(400).json({ message: "Username already exists" });
          }
        }
      }

      const updatedUser = await storage.updateUser?.(id, userData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return user without password
      res.json({
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        name: updatedUser.name,
        isAdmin: updatedUser.isAdmin,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        console.error("User update error:", error);
        res.status(500).json({ message: "Failed to update user" });
      }
    }
  });

  app.delete("/api/admin/users/:id", checkAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Prevent deleting yourself
      if (req.session.userId === id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      const success = await storage.deleteUser?.(id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("User deletion error:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Admin: Dashboard statistics
  app.get("/api/admin/dashboard", checkAuth, async (req: Request, res: Response) => {
    try {
      const dashboardData = await isrCache.getData('admin:dashboard', async () => {
        // Fetch all necessary data sequentially to prevent connection pool exhaustion
        const products = await storage.getProducts();
        const categories = await storage.getCategories();
        const orders = await storage.getOrders();

        // Calculate total revenue
        const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);

        // Get recent orders (last 10)
        const recentOrders = orders
          .sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          })
          .slice(0, 10);

        // Calculate products by category
        const categoryDistribution = categories.map(category => {
          const count = products.filter(p => p.categoryId === category.id).length;
          return {
            name: category.name,
            count
          };
        });

        // Calculate orders by month (last 6 months)
        const now = new Date();
        const monthlyOrders = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthName = date.toLocaleDateString('en-US', { month: 'short' });
          const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
          const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

          const count = orders.filter(order => {
            if (!order.createdAt) return false;
            const orderDate = new Date(order.createdAt);
            return orderDate >= monthStart && orderDate <= monthEnd;
          }).length;

          monthlyOrders.push({
            name: monthName,
            orders: count
          });
        }

        return {
          totalProducts: products.length,
          totalCategories: categories.length,
          totalOrders: orders.length,
          totalRevenue,
          recentOrders,
          categoryDistribution,
          monthlyOrders
        };
      }, 60);

      // Add caching headers for browsers/CDNs
      res.set({
        'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=120',
      });

      res.json(dashboardData);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Admin: Get all orders (for admin panel)
  // Admin: Get all orders (for admin panel)
  app.get("/api/admin/orders", checkAuth, async (req: Request, res: Response) => {
    try {
      const ordersWithItems = await isrCache.getData('admin:orders:all', async () => {
        const [orders, products] = await Promise.all([
          storage.getOrders(),
          storage.getProducts() // Fetch all products once
        ]);

        // Create product lookup map for O(1) access
        const productMap = new Map(products.map(p => [p.id, p]));

        // Fetch order items for each order and include product names
        // We still map over orders to get items, but we avoid the inner product fetch loop
        return await Promise.all(
          orders.map(async (order) => {
            const items = await storage.getOrderItems(order.id);

            // Get product details for each item from map
            const itemsWithProductNames = items.map((item) => {
              const product = productMap.get(item.productId);
              return {
                ...item,
                productName: product?.name || `Product #${item.productId}`
              };
            });

            return {
              ...order,
              items: itemsWithProductNames
            };
          })
        );
      }, 60);

      // Add caching headers
      res.set({
        'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=120',
      });

      res.json(ordersWithItems);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Admin: Create new order (POS)
  app.post("/api/admin/orders/create", checkAuth, async (req: Request, res: Response) => {
    try {
      const { items, status, ...orderData } = req.body;

      // Validate order data (excluding items and status which are handled separately)
      const validOrderData = insertOrderSchema.parse(orderData);

      // Create order with status
      // Create order items data first
      let orderItemsData: any[] = [];
      if (items && Array.isArray(items) && items.length > 0) {
        orderItemsData = items.map(item => ({
          orderId: 0, // Temporary
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity
        }));
      }

      // Use processOrder to handle transaction and stock deduction
      const order = await storage.processOrder({
        ...validOrderData,
        status: status || 'delivered'
      }, orderItemsData);

      // Return complete order with items and product names
      const orderItems = await storage.getOrderItems(order.id);

      const itemsWithNames = await Promise.all(orderItems.map(async (item) => {
        const product = await storage.getProductById(item.productId);
        return {
          ...item,
          name: product?.name || `Product #${item.productId}`
        };
      }));

      res.status(201).json({
        ...order,
        items: itemsWithNames
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        console.error("Failed to create admin order:", error);
        // Check if it's a stock error or other known error
        const message = error instanceof Error ? error.message : "Failed to create order";
        res.status(500).json({ message });
      }
    }
  });

  // Admin: Update order status
  app.patch("/api/admin/orders/:id/status", checkAuth, async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.id);
      const { status } = req.body;

      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }

      if (!status || !['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const updated = await storage.updateOrderStatus(orderId, status);

      if (!updated) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json({ success: true, order: updated });
    } catch (error) {
      console.error("Failed to update order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Admin: Get all customers (from users and orders)
  app.get("/api/admin/customers", checkAuth, async (req: Request, res: Response) => {
    try {
      const orders = await storage.getOrders();

      // Create a map to store unique customers by email
      const customersMap = new Map<string, {
        email: string;
        name: string;
        phone: string;
        totalOrders: number;
        totalSpent: number;
        lastOrderDate: Date | null;
        isRegistered: boolean;
        userId?: number;
      }>();

      // Process orders to extract customer data
      for (const order of orders) {
        const email = order.customerEmail.toLowerCase();

        if (customersMap.has(email)) {
          // Update existing customer
          const customer = customersMap.get(email)!;
          customer.totalOrders += 1;
          customer.totalSpent += order.total || 0;

          // Update last order date if this order is more recent
          const orderDate = order.createdAt ? new Date(order.createdAt) : null;
          if (orderDate && (!customer.lastOrderDate || orderDate > customer.lastOrderDate)) {
            customer.lastOrderDate = orderDate;
          }
        } else {
          // Add new customer from order
          customersMap.set(email, {
            email: order.customerEmail,
            name: order.customerName,
            phone: order.customerPhone,
            totalOrders: 1,
            totalSpent: order.total || 0,
            lastOrderDate: order.createdAt ? new Date(order.createdAt) : null,
            isRegistered: false,
            userId: order.userId || undefined
          });
        }
      }

      // Convert map to array and sort by total spent (descending)
      const customers = Array.from(customersMap.values())
        .sort((a, b) => b.totalSpent - a.totalSpent);

      res.json({
        customers,
        total: customers.length
      });
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  // Get user's orders (for logged-in users)
  app.get("/api/orders/user", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const allOrders = await storage.getOrders();
      // Filter orders for the current user
      const userOrders = allOrders.filter(order => order.userId === req.session.userId);
      res.json(userOrders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Public: Track order by ID and email
  app.get("/api/orders/track", async (req: Request, res: Response) => {
    try {
      const { orderId, email } = req.query;

      if (!orderId || !email) {
        return res.status(400).json({ message: "Order ID and email are required" });
      }

      const id = parseInt(orderId as string);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }

      // Get the order
      const order = await storage.getOrderById(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Verify email matches (case-insensitive)
      if (order.customerEmail.toLowerCase() !== (email as string).toLowerCase()) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Get order items with product names and images
      const items = await storage.getOrderItems(id);
      const itemsWithProductDetails = await Promise.all(
        items.map(async (item) => {
          const product = await storage.getProductById(item.productId);
          return {
            ...item,
            productName: product?.name || `Product #${item.productId}`,
            productImage: product?.image || null
          };
        })
      );

      res.json({
        ...order,
        items: itemsWithProductDetails
      });
    } catch (error) {
      console.error("Failed to track order:", error);
      res.status(500).json({ message: "Failed to track order" });
    }
  });

  // Orders
  app.post("/api/orders", async (req: Request, res: Response) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);

      // Add userId if user is logged in
      const orderWithUser = {
        ...orderData,
        userId: req.session.userId || null
      };

      // Create the order with stock deduction using processOrder
      const items = req.body.items || [];
      const orderItemsData = items.map((item: any) => insertOrderItemSchema.parse({
        orderId: 0, // Temporary ID, will be set by processOrder
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity
      }));

      const order = await storage.processOrder(orderWithUser, orderItemsData);

      // ─── SSLCommerz Integration ───────────────────────────────────────────
      if (orderData.paymentMethod === "credit-card") {
        const storeId = process.env.STORE_ID;
        const storePassword = process.env.STORE_PASSWORD;
        const isLive = process.env.SSLCOMMERZ_MODE === "live";
        const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";

        const sslUrl = isLive
          ? "https://securepay.sslcommerz.com/gwprocess/v4/api.php"
          : "https://sandbox.sslcommerz.com/gwprocess/v4/api.php";

        const params = new URLSearchParams({
          store_id: storeId || "",
          store_passwd: storePassword || "",
          total_amount: order.total.toString(),
          currency: "BDT",
          tran_id: `SBB-${order.id}-${Date.now()}`,
          success_url: `${backendUrl}/api/payment/success`,
          fail_url: `${backendUrl}/api/payment/fail`,
          cancel_url: `${backendUrl}/api/payment/cancel`,
          ipn_url: `${backendUrl}/api/payment/ipn`,
          cus_name: order.customerName,
          cus_email: order.customerEmail,
          cus_add1: order.address,
          cus_city: order.city || "Dhaka",
          cus_state: order.state || "Dhaka",
          cus_postcode: order.zipCode || "1000",
          cus_country: "Bangladesh",
          cus_phone: order.customerPhone,
          ship_name: order.customerName,
          ship_add1: order.address,
          ship_city: order.city || "Dhaka",
          ship_state: order.state || "Dhaka",
          ship_postcode: order.zipCode || "1000",
          ship_country: "Bangladesh",
          shipping_method: "Courier",
          product_name: "Bakery Items",
          product_category: "Food",
          product_profile: "general",
          value_a: order.id.toString(), // Carry order ID through transaction
        });

        const response = await fetch(sslUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params.toString(),
        });

        const sslData: any = await response.json();

        if (sslData?.status === "SUCCESS" && sslData?.GatewayPageURL) {
          return res.status(201).json({ order, gatewayUrl: sslData.GatewayPageURL });
        } else {
          console.error("SSLCommerz init failed:", sslData);
          return res.status(502).json({ message: "Payment gateway initialization failed", sslData });
        }
      }
      // ─────────────────────────────────────────────────────────────────────

      res.status(201).json({ order });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        // Check if it's a stock error or other known error
        const message = error instanceof Error ? error.message : "Failed to create order";
        res.status(500).json({ message });
      }
    }
  });

  // =================== SSLCOMMERZ PAYMENT CALLBACK ROUTES ===================

  // SSLCommerz: Payment Success
  app.post("/api/payment/success", async (req: Request, res: Response) => {
    try {
      const { val_id, tran_id, value_a, status } = req.body;
      console.log("[SSLCommerz] Success callback:", req.body);

      const orderId = parseInt(value_a);
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5000";

      if (!isNaN(orderId)) {
        await storage.updateOrderStatus(orderId, "processing");
        // Store order info needed for confirmation page in query params
        // so we can redirect without session
      }

      return res.redirect(`${frontendUrl}/order-confirmation?ssl=1&order=${orderId}&tran=${tran_id}`);
    } catch (error) {
      console.error("[SSLCommerz] Success handler error:", error);
      res.redirect(`/order-confirmation?ssl=err`);
    }
  });

  // SSLCommerz: Payment Fail
  app.post("/api/payment/fail", async (req: Request, res: Response) => {
    try {
      const { value_a } = req.body;
      console.log("[SSLCommerz] Fail callback:", req.body);

      const orderId = parseInt(value_a);
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5000";

      if (!isNaN(orderId)) {
        await storage.updateOrderStatus(orderId, "cancelled");
      }

      return res.redirect(`${frontendUrl}/checkout?ssl=fail&order=${orderId}`);
    } catch (error) {
      console.error("[SSLCommerz] Fail handler error:", error);
      res.redirect(`/checkout?ssl=err`);
    }
  });

  // SSLCommerz: Payment Cancel
  app.post("/api/payment/cancel", async (req: Request, res: Response) => {
    try {
      const { value_a } = req.body;
      console.log("[SSLCommerz] Cancel callback:", req.body);

      const orderId = parseInt(value_a);
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5000";

      if (!isNaN(orderId)) {
        await storage.updateOrderStatus(orderId, "cancelled");
      }

      return res.redirect(`${frontendUrl}/checkout?ssl=cancel&order=${orderId}`);
    } catch (error) {
      console.error("[SSLCommerz] Cancel handler error:", error);
      res.redirect(`/checkout?ssl=err`);
    }
  });

  // SSLCommerz: IPN (Instant Payment Notification - backend webhook)
  app.post("/api/payment/ipn", async (req: Request, res: Response) => {
    try {
      const { val_id, status, value_a, tran_id } = req.body;
      console.log("[SSLCommerz] IPN callback:", req.body);

      const orderId = parseInt(value_a);

      if (!isNaN(orderId) && status === "VALID") {
        // Optionally verify with SSLCommerz validation API here
        await storage.updateOrderStatus(orderId, "processing");
        console.log(`[SSLCommerz] IPN: Order ${orderId} marked as processing. TranID: ${tran_id}`);
      }

      return res.status(200).json({ received: true });
    } catch (error) {
      console.error("[SSLCommerz] IPN handler error:", error);
      res.status(500).json({ error: "IPN handling failed" });
    }
  });

  // =================== END SSLCOMMERZ ROUTES ===================


  app.get("/api/orders/:id", checkAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }

      const order = await storage.getOrderById(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const items = await storage.getOrderItems(id);

      res.json({ order, items });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  // Newsletter subscription
  app.post("/api/newsletter", async (req: Request, res: Response) => {
    try {
      const subscription = newsletterSchema.parse(req.body);
      // In a real app, we'd store this in a database
      res.status(200).json({
        success: true,
        message: `Thank you for subscribing with ${subscription.email}!`
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to subscribe to newsletter" });
      }
    }
  });

  // =================== PATHAO COURIER API ROUTES ===================

  // Get Pathao cities
  app.get("/api/pathao/cities", async (_req: Request, res: Response) => {
    try {
      const { getPathaoService } = await import("./pathao.js");
      const pathao = getPathaoService();
      const cities = await pathao.getCities();
      res.json(cities);
    } catch (error: any) {
      console.error("Pathao cities error:", error);
      res.status(500).json({ message: "Failed to fetch cities", error: error.message });
    }
  });

  // Get Pathao zones for a city
  app.get("/api/pathao/zones/:cityId", async (req: Request, res: Response) => {
    try {
      const cityId = parseInt(req.params.cityId);
      if (isNaN(cityId)) {
        return res.status(400).json({ message: "Invalid city ID" });
      }

      const { getPathaoService } = await import("./pathao.js");
      const pathao = getPathaoService();
      const zones = await pathao.getZones(cityId);
      res.json(zones);
    } catch (error: any) {
      console.error("Pathao zones error:", error);
      res.status(500).json({ message: "Failed to fetch zones", error: error.message });
    }
  });

  // Get Pathao areas for a zone
  app.get("/api/pathao/areas/:zoneId", async (req: Request, res: Response) => {
    try {
      const zoneId = parseInt(req.params.zoneId);
      if (isNaN(zoneId)) {
        return res.status(400).json({ message: "Invalid zone ID" });
      }

      const { getPathaoService } = await import("./pathao.js");
      const pathao = getPathaoService();
      const areas = await pathao.getAreas(zoneId);
      res.json(areas);
    } catch (error: any) {
      console.error("Pathao areas error:", error);
      res.status(500).json({ message: "Failed to fetch areas", error: error.message });
    }
  });

  // Get Pathao stores
  app.get("/api/pathao/stores", async (_req: Request, res: Response) => {
    try {
      const { getPathaoService } = await import("./pathao.js");
      const pathao = getPathaoService();
      let stores = await pathao.getStores();

      // Fallback: If no stores are returned from API, use the store ID from .env
      if (stores.length === 0 && process.env.PATHAO_STORE_ID) {
        stores = [{
          store_id: parseInt(process.env.PATHAO_STORE_ID),
          store_name: "Default Store",
          store_address: "Address configured in Pathao panel",
          city_id: 1, // Default to Dhaka
          zone_id: 1,
          area_id: 1
        }];
      }

      res.json(stores);
    } catch (error: any) {
      console.error("Pathao stores error:", error);
      res.status(500).json({ message: "Failed to fetch stores", error: error.message });
    }
  });


  // Calculate delivery price
  app.post("/api/pathao/calculate-price", async (req: Request, res: Response) => {
    try {
      const { storeId, recipientCity, recipientZone, deliveryType, itemType, itemWeight } = req.body;

      if (!storeId || !recipientCity || !recipientZone) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const { getPathaoService } = await import("./pathao.js");
      const pathao = getPathaoService();

      const price = await pathao.calculatePrice({
        storeId: parseInt(storeId),
        recipientCity: parseInt(recipientCity),
        recipientZone: parseInt(recipientZone),
        deliveryType: deliveryType === "normal" ? 48 : 48, // Default to 48 (Standard)
        itemType: itemType === "document" ? 2 : 1, // Default to 1 (Parcel)
        item_weight: parseFloat(itemWeight) || 0.5,
      });

      res.json(price);
    } catch (error: any) {
      console.error("Pathao price calculation error:", error);
      res.status(500).json({ message: "Failed to calculate price", error: error.message });
    }
  });

  // Create Pathao order
  app.post("/api/pathao/create-order", async (req: Request, res: Response) => {
    try {
      const orderData = req.body;

      if (!orderData.storeId || !orderData.recipientName || !orderData.recipientPhone) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const { getPathaoService } = await import("./pathao.js");
      const pathao = getPathaoService();

      const result = await pathao.createOrder({
        storeId: parseInt(orderData.storeId),
        merchantOrderId: orderData.merchantOrderId || `ORD-${Date.now()}`,
        recipientName: orderData.recipientName,
        recipientPhone: orderData.recipientPhone.replace(/\D/g, ''),
        recipientAddress: orderData.recipientAddress,
        recipientCity: parseInt(orderData.recipientCity),
        recipientZone: parseInt(orderData.recipientZone),
        recipientArea: parseInt(orderData.recipientArea),
        deliveryType: orderData.deliveryType === "normal" ? 48 : 48,
        itemType: orderData.itemType === "document" ? 2 : 1,
        itemQuantity: parseInt(orderData.itemQuantity) || 1,
        itemWeight: parseFloat(orderData.itemWeight) || 0.5,
        itemDescription: orderData.itemDescription || "Bakery Items",
        amountToCollect: parseFloat(orderData.amountToCollect) || 0,
        specialInstruction: orderData.specialInstruction || "",
      });

      res.json(result);
    } catch (error: any) {
      console.error("Pathao order creation error:", error);
      res.status(500).json({ message: "Failed to create Pathao order", error: error.message });
    }
  });

  // Track Pathao order
  app.get("/api/pathao/track/:consignmentId", async (req: Request, res: Response) => {
    try {
      const { consignmentId } = req.params;

      if (!consignmentId) {
        return res.status(400).json({ message: "Consignment ID is required" });
      }

      const { getPathaoService } = await import("./pathao.js");
      const pathao = getPathaoService();
      const tracking = await pathao.trackOrder(consignmentId);

      // If we found the order locally, update it
      // This allows "passive" tracking updates when someone views the tracking
      // We need to find the order by consignmentId first - tricky if we don't have that index/lookup easily
      // But usually this is called contextually.

      res.json(tracking);
    } catch (error: any) {
      console.error("Pathao tracking error:", error);
      res.status(500).json({ message: "Failed to track order", error: error.message });
    }
  });



  // Manual Send to Pathao (Admin)
  app.post("/api/admin/orders/:id/pathao", checkAuth, async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) return res.status(400).json({ message: "Invalid order ID" });

      const orderData = req.body; // Contains params for Pathao like weight, storeId

      const order = await storage.getOrderById(orderId);
      if (!order) return res.status(404).json({ message: "Order not found" });

      const { getPathaoService } = await import("./pathao.js");
      const pathao = getPathaoService();

      const getPhone = (p: string) => {
        const d = p.replace(/\D/g, '');
        if (d.startsWith('880')) return d.substring(2);
        if (d.startsWith('88')) return '0' + d.substring(2);
        return d;
      };

      const phoneToUse = orderData.recipientPhone || order.customerPhone;
      const processedPhone = getPhone(phoneToUse);

      console.log(`[Pathao Debug] Using Phone: "${phoneToUse}", Processed: "${processedPhone}"`);

      // Create order in Pathao
      const result = await pathao.createOrder({
        storeId: parseInt(orderData.storeId),
        merchantOrderId: `ORD-${orderId}`, // Use our Order ID
        recipientName: order.customerName,
        recipientPhone: processedPhone,
        recipientAddress: order.address,
        recipientCity: parseInt(orderData.recipientCity),
        recipientZone: parseInt(orderData.recipientZone),
        recipientArea: parseInt(orderData.recipientArea),
        deliveryType: 48,
        itemType: 2, // 2 is Parcel, 1 is Document (which is restricted)
        itemQuantity: parseInt(orderData.itemQuantity) || 1,
        itemWeight: parseFloat(orderData.itemWeight) || 0.5,
        itemDescription: orderData.itemDescription || `Order #${orderId}`,
        amountToCollect: parseFloat(orderData.amountToCollect) || (order.paymentMethod === 'cod' ? order.total : 0),
        specialInstruction: orderData.specialInstruction || "",
      });

      // Update local order with Pathao details
      if (result?.data?.consignment_id) {
        await storage.updateOrderPathaoInfo(orderId, {
          consignmentId: result.data.consignment_id,
          merchantOrderId: result.data.merchant_order_id,
          status: result.data.order_status
        });
      }

      res.json(result);
    } catch (error: any) {
      console.error("Pathao send error:", error);
      res.status(500).json({ message: "Failed to send to Pathao", error: error.message });
    }
  });

  // Sync Pathao Status (Admin/Auto)
  app.post("/api/admin/orders/pathao/sync", checkAuth, async (_req: Request, res: Response) => {
    try {
      const orders = await storage.getOrders();
      // Filter orders that have Pathao ID and are not delivered/cancelled
      const activePathaoOrders = orders.filter(o =>
        o.pathaoConsignmentId &&
        o.pathaoStatus !== 'Delivered' &&
        o.pathaoStatus !== 'Cancelled'
      );

      const { getPathaoService } = await import("./pathao.js");
      const pathao = getPathaoService();

      const results = [];

      // Process in parallel with concurrency limit is better, but simple loop for now
      for (const order of activePathaoOrders) {
        if (!order.pathaoConsignmentId) continue;

        try {
          // Pathao API might not have bulk status? Checking individually.
          // Note: trackOrder returns { data: { ... } } often
          // Actually trackOrder wrapper returns data.data
          const trackingData = await pathao.trackOrder(order.pathaoConsignmentId);

          if (trackingData && trackingData.order_status) {
            const currentStatus = trackingData.order_status;
            if (currentStatus !== order.pathaoStatus) {
              await storage.updateOrderPathaoInfo(order.id, {
                consignmentId: order.pathaoConsignmentId,
                merchantOrderId: order.pathaoMerchantOrderId || "",
                status: currentStatus
              });
              results.push({ id: order.id, status: currentStatus, updated: true });
            } else {
              results.push({ id: order.id, status: currentStatus, updated: false });
            }
          }
        } catch (e) {
          console.error(`Failed to sync order ${order.id}:`, e);
          results.push({ id: order.id, error: true });
        }
      }

      res.json({ success: true, synced: results.length, details: results });
    } catch (error: any) {
      console.error("Pathao sync error:", error);
      res.status(500).json({ message: "Failed to sync Pathao statuses", error: error.message });
    }
  });

  // =================== END PATHAO ROUTES ===================

  // Contact form
  app.post("/api/contact", async (req: Request, res: Response) => {
    try {
      const contactForm = contactFormSchema.parse(req.body);
      // In a real app, we'd send an email or store this in a database
      res.status(200).json({
        success: true,
        message: `Thank you for your message, ${contactForm.name}! We'll get back to you soon.`
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to submit contact form" });
      }
    }
  });

  // Placeholder image endpoint
  app.get("/api/placeholder/:width/:height", (req: Request, res: Response) => {
    const { width, height } = req.params;
    const text = req.query.text || "No Image";

    // Generate a simple SVG placeholder
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" 
              fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">
          ${text}
        </text>
      </svg>
    `;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  });

  const httpServer = createServer(app);
  return httpServer;
}
