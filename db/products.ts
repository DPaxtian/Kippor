import type { SQLiteDatabase } from 'expo-sqlite';
import type { CreateProductInput, Product, UpdateProductInput } from '@/types';

export async function getAllProducts(db: SQLiteDatabase): Promise<Product[]> {
  return db.getAllAsync<Product>(
    'SELECT * FROM products WHERE is_active = 1 ORDER BY name ASC'
  );
}

export async function getProductById(
  db: SQLiteDatabase,
  id: number
): Promise<Product | null> {
  return db.getFirstAsync<Product>('SELECT * FROM products WHERE id = ?', [id]);
}

export async function createProduct(
  db: SQLiteDatabase,
  data: CreateProductInput
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO products (name, price, description, image_uri, emoji, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.name,
      data.price,
      data.description ?? null,
      data.image_uri ?? null,
      data.emoji ?? null,
      new Date().toISOString(),
    ]
  );
  return result.lastInsertRowId;
}

export async function updateProduct(
  db: SQLiteDatabase,
  id: number,
  data: UpdateProductInput
): Promise<void> {
  await db.runAsync(
    `UPDATE products
     SET name = COALESCE(?, name),
         price = COALESCE(?, price),
         description = ?,
         image_uri = ?,
         emoji = ?
     WHERE id = ?`,
    [
      data.name ?? null,
      data.price ?? null,
      data.description !== undefined ? data.description : null,
      data.image_uri !== undefined ? data.image_uri : null,
      data.emoji !== undefined ? data.emoji : null,
      id,
    ]
  );
}

export async function softDeleteProduct(
  db: SQLiteDatabase,
  id: number
): Promise<void> {
  await db.runAsync('UPDATE products SET is_active = 0 WHERE id = ?', [id]);
}
