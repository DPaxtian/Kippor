import * as SQLite from 'expo-sqlite';

const DB_NAME = 'kippor.db';
const LATEST_VERSION = 5;

// Singleton: una sola instancia de la DB por proceso
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbPromise;
}

// ─── Migraciones ──────────────────────────────────────────────────────────────

const MIGRATIONS: Record<number, string> = {
  5: `
    CREATE TABLE IF NOT EXISTS expenses (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      amount     REAL    NOT NULL,
      category   TEXT    NOT NULL,
      date       TEXT    NOT NULL,
      notes      TEXT,
      created_at TEXT    NOT NULL
    );
  `,
  4: `
    ALTER TABLE orders ADD COLUMN delivery_date    TEXT;
    ALTER TABLE orders ADD COLUMN advance_payment  REAL NOT NULL DEFAULT 0;
  `,
  3: `
    CREATE TABLE IF NOT EXISTS labels (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL UNIQUE,
      color      TEXT    NOT NULL,
      created_at TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_labels (
      order_id  INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      label_id  INTEGER NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
      PRIMARY KEY (order_id, label_id)
    );
  `,
  2: `
    ALTER TABLE products ADD COLUMN emoji TEXT;
  `,
  1: `
    CREATE TABLE IF NOT EXISTS products (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      price       REAL    NOT NULL,
      description TEXT,
      image_uri   TEXT,
      is_active   INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      client_name      TEXT    NOT NULL,
      client_address   TEXT,
      has_delivery     INTEGER NOT NULL DEFAULT 0,
      shipping_cost    REAL    NOT NULL DEFAULT 0,
      delivery_status  TEXT    NOT NULL DEFAULT 'pending',
      payment_status   TEXT    NOT NULL DEFAULT 'unpaid',
      payment_method   TEXT    NOT NULL DEFAULT 'cash',
      notes            TEXT,
      subtotal         REAL    NOT NULL DEFAULT 0,
      total            REAL    NOT NULL DEFAULT 0,
      created_at       TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id      INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id    INTEGER REFERENCES products(id) ON DELETE SET NULL,
      product_name  TEXT    NOT NULL,
      product_price REAL    NOT NULL,
      quantity      INTEGER NOT NULL,
      subtotal      REAL    NOT NULL
    );
  `,
};

// ─── Inicialización ───────────────────────────────────────────────────────────

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await getDatabase();

  // Optimizaciones de rendimiento
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // Leer versión actual del schema
  const result = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  const currentVersion = result?.user_version ?? 0;

  // Aplicar migraciones pendientes
  for (let v = currentVersion + 1; v <= LATEST_VERSION; v++) {
    const migration = MIGRATIONS[v];
    if (migration) {
      await db.withTransactionAsync(async () => {
        await db.execAsync(migration);
        await db.execAsync(`PRAGMA user_version = ${v}`);
      });
    }
  }

  return db;
}
