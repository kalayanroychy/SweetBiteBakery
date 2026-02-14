import {
  categories, products, users, orders, orderItems,
  type Category, type InsertCategory,
  type Product, type InsertProduct,
  type User, type InsertUser,
  type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem,
  type Setting, settings,
  suppliers, type Supplier, type InsertSupplier,
  purchases, type Purchase, type InsertPurchase,
  purchaseItems, type PurchaseItem, type InsertPurchaseItem,
  type ProductWithCategory
} from "../shared/schema.js";
import { getDb as getDbInstance } from "./db.js";
import { eq, desc, and, asc, sql, like, gte, lte, ilike, or } from "drizzle-orm";
import { IStorage, ProductFilters } from "./storage.js";

// Helper function to ensure db is not null
function getDb() {
  const db = getDbInstance();
  if (!db) {
    throw new Error("Database not initialized. Please set DATABASE_URL environment variable.");
  }
  return db;
}

export class DatabaseStorage implements IStorage {
  // Category operations
  async getCategories(): Promise<Category[]> {
    return await getDb().select().from(categories).orderBy(asc(categories.name));
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    const [category] = await getDb().select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await getDb().select().from(categories).where(eq(categories.slug, slug));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await getDb().insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updatedCategory] = await getDb()
      .update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await getDb().delete(categories).where(eq(categories.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Product operations
  async getProducts(limit?: number, offset?: number, filters?: ProductFilters): Promise<Product[]> {
    let query = getDb().select().from(products).$dynamic();
    const conditions = [];

    if (filters) {
      if (filters.category) {
        // We need to join or subquery, but since we have categoryId, we can first get the category
        // or assumes the caller passes category slug.
        // For performance, let's look up category by slug first if needed, 
        // or clearer to just filter by categoryId if we had it.
        // But the interface uses slug.
        const [category] = await getDb().select().from(categories).where(eq(categories.slug, filters.category));
        if (category) {
          conditions.push(eq(products.categoryId, category.id));
        } else {
          // If category not found, return empty? or ignore?
          // Returning empty is safer strictly speaking.
          return [];
        }
      }

      if (filters.minPrice !== undefined) {
        conditions.push(gte(products.price, filters.minPrice));
      }

      if (filters.maxPrice !== undefined) {
        conditions.push(lte(products.price, filters.maxPrice));
      }

      if (filters.search) {
        const searchTerm = `%${filters.search}%`;
        conditions.push(or(
          ilike(products.name, searchTerm),
          ilike(products.description, searchTerm)
        ));
      }

      // Dietary is harder in SQL without specific JSON operators depending on DB support.
      // Postgres supports JSONB containment but let's see schema.
      // dietaryOptions is jsonb or similar? 
      // If it's simple array of strings in JSON column:
      if (filters.dietary && filters.dietary.length > 0) {
        // Postgres specific JSON operator for "contains" is @>
        // But drizzle needs SQL operator.
        // For now, let's skip complex JSON filtering in DB if strictly types are tricky,
        // OR use sql`` operator.
        // Assuming dietaryOptions is a JSONB column.
        for (const option of filters.dietary) {
          conditions.push(sql`${products.dietaryOptions} @> ${JSON.stringify([option])}`);
        }
      }
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    query = query.orderBy(desc(products.createdAt));

    // Build query based on parameters
    if (limit !== undefined && offset !== undefined) {
      query = query.limit(limit).offset(offset);
    } else if (limit !== undefined) {
      query = query.limit(limit);
    } else if (offset !== undefined) {
      query = query.offset(offset);
    }

    return await query;
  }

  async getProductsCount(filters?: ProductFilters): Promise<number> {
    let query = getDb().select({ count: sql<number>`count(*)` }).from(products).$dynamic();
    const conditions = [];

    if (filters) {
      if (filters.category) {
        const [category] = await getDb().select().from(categories).where(eq(categories.slug, filters.category));
        if (category) {
          conditions.push(eq(products.categoryId, category.id));
        } else {
          return 0;
        }
      }

      if (filters.minPrice !== undefined) {
        conditions.push(gte(products.price, filters.minPrice));
      }

      if (filters.maxPrice !== undefined) {
        conditions.push(lte(products.price, filters.maxPrice));
      }

      if (filters.search) {
        const searchTerm = `%${filters.search}%`;
        conditions.push(or(
          ilike(products.name, searchTerm),
          ilike(products.description, searchTerm)
        ));
      }

      if (filters.dietary && filters.dietary.length > 0) {
        for (const option of filters.dietary) {
          conditions.push(sql`${products.dietaryOptions} @> ${JSON.stringify([option])}`);
        }
      }
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const result = await query;
    return Number(result[0]?.count || 0);
  }

  async getProductById(id: number): Promise<Product | undefined> {
    const [product] = await getDb().select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const [product] = await getDb().select().from(products).where(eq(products.slug, slug));
    return product;
  }

  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return await getDb()
      .select()
      .from(products)
      .where(eq(products.categoryId, categoryId))
      .orderBy(desc(products.createdAt));
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return await getDb()
      .select()
      .from(products)
      .where(eq(products.featured, true))
      .orderBy(desc(products.createdAt))
      .limit(6);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    // Ensure all boolean fields have a value
    const productWithDefaults = {
      ...product,
      featured: product.featured ?? false,
      isBestseller: product.isBestseller ?? false,
      isNew: product.isNew ?? false,
      isPopular: product.isPopular ?? false
    };

    const [newProduct] = await getDb().insert(products).values(productWithDefaults).returning();
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updatedProduct] = await getDb()
      .update(products)
      .set(product)
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await getDb().delete(products).where(eq(products.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await getDb().select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await getDb().select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await getDb().select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error(`Database Error in getUserByUsername for ${username}:`, error);
      throw error; // Re-throw so auth.ts catches it
    }
  }

  async getUserByUsernameOrEmail(username: string, email: string): Promise<User | undefined> {
    const [user] = await getDb().select().from(users).where(
      and(eq(users.username, username), eq(users.email, email))
    );
    // If exact match not found, check for either username OR email
    if (!user) {
      const results = await getDb().select().from(users);
      return results.find((u: User) => u.username === username || u.email === email);
    }
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Ensure isAdmin field has a value
    const userWithDefaults = {
      ...insertUser,
      isAdmin: insertUser.isAdmin ?? false
    };

    const [user] = await getDb().insert(users).values(userWithDefaults).returning();
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await getDb().select().from(users).orderBy(asc(users.createdAt));
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await getDb()
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await getDb().delete(users).where(eq(users.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Order operations
  async getOrders(): Promise<Order[]> {
    return await getDb().select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    const [order] = await getDb().select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    // Add status field with default value
    const orderWithStatus = {
      ...order,
      status: order.status || 'pending'
    };

    const [newOrder] = await getDb().insert(orders).values(orderWithStatus).returning();
    return newOrder;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [updatedOrder] = await getDb()
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  async updateOrderPathaoInfo(id: number, info: { consignmentId: string, merchantOrderId: string, status: string }): Promise<Order | undefined> {
    const [updatedOrder] = await getDb()
      .update(orders)
      .set({
        pathaoConsignmentId: info.consignmentId,
        pathaoMerchantOrderId: info.merchantOrderId,
        pathaoStatus: info.status
      })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  // Order Item operations
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await getDb().select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    const [newOrderItem] = await getDb().insert(orderItems).values(orderItem).returning();
    return newOrderItem;
  }

  async createOrderItems(items: InsertOrderItem[]): Promise<OrderItem[]> {
    if (items.length === 0) return [];
    return await getDb().insert(orderItems).values(items).returning();
  }

  // Settings operations
  async getSettings(key: string): Promise<any> {
    const [setting] = await getDb().select().from(settings).where(eq(settings.key, key));
    return setting ? setting.value : undefined;
  }

  async updateSettings(key: string, value: any): Promise<Setting> {
    const [existingSetting] = await getDb().select().from(settings).where(eq(settings.key, key));

    if (existingSetting) {
      const [updatedSetting] = await getDb()
        .update(settings)
        .set({ value, updatedAt: new Date() })
        .where(eq(settings.key, key))
        .returning();
      return updatedSetting;
    } else {
      const [newSetting] = await getDb()
        .insert(settings)
        .values({ key, value })
        .returning();
      return newSetting;
    }
  }

  async processOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    return await getDb().transaction(async (tx) => {
      // 1. Verify stock for all items
      for (const item of items) {
        const [product] = await tx
          .select()
          .from(products)
          .where(eq(products.id, item.productId));

        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }

        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
        }
      }

      // 2. Deduct stock
      for (const item of items) {
        await tx
          .update(products)
          .set({ stock: sql`${products.stock} - ${item.quantity}` })
          .where(eq(products.id, item.productId));
      }

      // 3. Create order
      // Add status field with default value
      const orderWithStatus = {
        ...order,
        status: order.status || 'pending'
      };

      const [newOrder] = await tx.insert(orders).values(orderWithStatus).returning();

      // 4. Create order items
      if (items.length > 0) {
        const itemsWithOrderId = items.map(item => ({
          ...item,
          orderId: newOrder.id
        }));
        await tx.insert(orderItems).values(itemsWithOrderId);
      }
      return newOrder;
    });
  }

  // Supplier operations
  async getSuppliers(): Promise<Supplier[]> {
    return await getDb().select().from(suppliers).orderBy(desc(suppliers.createdAt));
  }

  async getSupplierById(id: number): Promise<Supplier | undefined> {
    const [supplier] = await getDb().select().from(suppliers).where(eq(suppliers.id, id));
    return supplier;
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [newSupplier] = await getDb().insert(suppliers).values(supplier).returning();
    return newSupplier;
  }

  async updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const [updatedSupplier] = await getDb()
      .update(suppliers)
      .set(supplier)
      .where(eq(suppliers.id, id))
      .returning();
    return updatedSupplier;
  }

  async deleteSupplier(id: number): Promise<boolean> {
    const result = await getDb().delete(suppliers).where(eq(suppliers.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Purchase operations
  async getPurchases(): Promise<Purchase[]> {
    try {
      const result = await getDb().select().from(purchases).orderBy(desc(purchases.createdAt));
      console.log(`getPurchases fetched ${result.length} records`);
      return result;
    } catch (e) {
      console.error("getPurchases error:", e);
      throw e;
    }
  }

  async getPurchaseById(id: number): Promise<Purchase | undefined> {
    const [purchase] = await getDb().select().from(purchases).where(eq(purchases.id, id));
    return purchase;
  }

  async createPurchase(purchase: InsertPurchase): Promise<Purchase> {
    // Ensure status and date are set correctly
    const purchaseWithDefaults = {
      ...purchase,
      status: purchase.status || 'pending',
      date: purchase.date ? new Date(purchase.date) : new Date()
    };

    const [newPurchase] = await getDb().insert(purchases).values(purchaseWithDefaults).returning();
    return newPurchase;
  }

  async updatePurchaseStatus(id: number, status: string): Promise<Purchase | undefined> {
    const [updatedPurchase] = await getDb()
      .update(purchases)
      .set({ status })
      .where(eq(purchases.id, id))
      .returning();
    return updatedPurchase;
  }

  async getPurchaseItems(purchaseId: number): Promise<PurchaseItem[]> {
    return await getDb().select().from(purchaseItems).where(eq(purchaseItems.purchaseId, purchaseId));
  }

  async processPurchase(purchase: InsertPurchase, items: InsertPurchaseItem[]): Promise<Purchase> {
    return await getDb().transaction(async (tx) => {
      // 1. Create purchase
      const purchaseWithDefaults = {
        ...purchase,
        status: purchase.status || 'pending',
        date: purchase.date ? new Date(purchase.date) : new Date()
      };

      const [newPurchase] = await tx.insert(purchases).values(purchaseWithDefaults).returning();

      // 2. Create purchase items
      if (items.length > 0) {
        const itemsWithPurchaseId = items.map(item => ({
          ...item,
          purchaseId: newPurchase.id
        }));
        await tx.insert(purchaseItems).values(itemsWithPurchaseId);

        // 3. Update stock if status is 'received'
        if (newPurchase.status === 'received') {
          console.log(`Processing stock update for purchase ${newPurchase.id}, items: ${items.length}`);
          for (const item of items) {
            console.log(`Updating stock for product ${item.productId} by +${item.quantity}`);
            await tx
              .update(products)
              .set({ stock: sql`${products.stock} + ${item.quantity}` })
              .where(eq(products.id, item.productId));
          }
        } else {
          console.log(`Purchase status is ${newPurchase.status}, skipping stock update`);
        }
      }

      return newPurchase;
    });
  }

  async updatePurchase(id: number, purchase: InsertPurchase, items: InsertPurchaseItem[]): Promise<Purchase | undefined> {
    const existing = await this.getPurchaseById(id);
    if (!existing) return undefined;

    return await getDb().transaction(async (tx) => {
      // 1. Revert stock if previously received
      if (existing.status === 'received') {
        const oldItems = await this.getPurchaseItems(id);
        console.log(`Reverting stock for purchase ${id} (items: ${oldItems.length})`);
        for (const item of oldItems) {
          await tx
            .update(products)
            .set({ stock: sql`${products.stock} - ${item.quantity}` })
            .where(eq(products.id, item.productId));
        }
      }

      // 2. Delete old items
      await tx.delete(purchaseItems).where(eq(purchaseItems.purchaseId, id));

      // 3. Update purchase details
      const purchaseWithDefaults = {
        ...purchase,
        status: purchase.status || existing.status,
        date: purchase.date ? new Date(purchase.date) : new Date(existing.date)
      };

      const [updatedPurchase] = await tx
        .update(purchases)
        .set(purchaseWithDefaults)
        .where(eq(purchases.id, id))
        .returning();

      // 4. Insert new items
      if (items.length > 0) {
        const itemsWithPurchaseId = items.map(item => ({
          ...item,
          purchaseId: id
        }));
        await tx.insert(purchaseItems).values(itemsWithPurchaseId);

        // 5. Apply new stock if status is received
        if (updatedPurchase.status === 'received') {
          console.log(`Applying new stock for purchase ${id} (items: ${items.length})`);
          for (const item of items) {
            await tx
              .update(products)
              .set({ stock: sql`${products.stock} + ${item.quantity}` })
              .where(eq(products.id, item.productId));
          }
        }
      }

      return updatedPurchase;
    });
  }

  async getSalesReport(startDate: Date, endDate: Date): Promise<any[]> {
    return await getDb()
      .select({
        date: sql`DATE(created_at)`.as('date'),
        count: sql`count(*)`.mapWith(Number).as('count'),
        total: sql`sum(total)`.mapWith(Number).as('total')
      })
      .from(orders)
      .where(and(
        gte(orders.createdAt, startDate),
        lte(orders.createdAt, endDate)
      ))
      .groupBy(sql`DATE(created_at)`)
      .orderBy(sql`DATE(created_at)`);
  }

  async getPurchaseReport(startDate: Date, endDate: Date): Promise<any[]> {
    return await getDb()
      .select({
        date: sql`DATE(date)`.as('date'),
        count: sql`count(*)`.mapWith(Number).as('count'),
        total: sql`sum(total_amount)`.mapWith(Number).as('total')
      })
      .from(purchases)
      .where(and(
        gte(purchases.date, startDate),
        lte(purchases.date, endDate)
      ))
      .groupBy(sql`DATE(date)`)
      .orderBy(sql`DATE(date)`);
  }

  async getStockReport(): Promise<{ lowStockItems: Product[], totalValue: number }> {
    const lowStockItems = await getDb()
      .select()
      .from(products)
      .where(lte(products.stock, products.lowStockThreshold))
      .orderBy(asc(products.stock));

    const [result] = await getDb()
      .select({
        totalValue: sql`sum(${products.price} * ${products.stock})`.mapWith(Number)
      })
      .from(products);

    return {
      lowStockItems,
      totalValue: result?.totalValue || 0
    };
  }

  async getSalesDetails(startDate: Date, endDate: Date): Promise<Order[]> {
    return await getDb()
      .select()
      .from(orders)
      .where(and(
        gte(orders.createdAt, startDate),
        lte(orders.createdAt, endDate)
      ))
      .orderBy(desc(orders.createdAt));
  }

  async getPurchaseDetails(startDate: Date, endDate: Date): Promise<Purchase[]> {
    return await getDb()
      .select()
      .from(purchases)
      .where(and(
        gte(purchases.date, startDate),
        lte(purchases.date, endDate)
      ))
      .orderBy(desc(purchases.date));
  }

  async getStockDetails(): Promise<ProductWithCategory[]> {
    const result = await getDb()
      .select({
        product: products,
        category: categories
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .orderBy(asc(products.name));

    return result.map(({ product, category }) => ({
      ...product,
      category
    }));
  }
}