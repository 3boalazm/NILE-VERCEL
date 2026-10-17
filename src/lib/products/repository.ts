import type { Product, ProductCategory } from "./types"

/**
 * Data-access seam. `MockProductRepository` implements this today;
 * `VendureProductRepository` implements it once the commerce backend
 * is wired in — components and pages depend on this interface only,
 * never on a concrete implementation.
 */
export interface ProductRepository {
  getAllProducts(): Promise<Product[]>
  getProductBySlug(slug: string): Promise<Product | null>
  getProductsByCategory(categorySlug: string): Promise<Product[]>
  getAllCategories(): Promise<ProductCategory[]>
  getCategoryBySlug(slug: string): Promise<ProductCategory | null>
}
