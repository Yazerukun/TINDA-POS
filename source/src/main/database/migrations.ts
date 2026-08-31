import type Database from 'better-sqlite3'

export interface Migration {
  version: number
  name: string
  sql: string
}

export function runMigrations(db: Database.Database): void {
  db.exec(
    `CREATE TABLE IF NOT EXISTS app_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    )`
  )
  const applied = new Set(
    (db.prepare('SELECT version FROM app_migrations').all() as { version: number }[]).map((r) => r.version)
  )
  for (const m of migrations) {
    if (applied.has(m.version)) continue
    const txn = db.transaction(() => {
      db.exec(m.sql)
      db.prepare('INSERT INTO app_migrations (version, name) VALUES (?, ?)').run(m.version, m.name)
    })
    txn()
  }
}

// All amounts are INTEGER centavos (peso * 100). All stock is INTEGER base units.
export const migrations: Migration[] = [
  {
    version: 1,
    name: 'initial_schema',
    sql: `
CREATE TABLE roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);
INSERT INTO roles (name, description) VALUES
  ('ADMIN', 'Full access to everything.'),
  ('MANAGER', 'Store management plus POS, refunds, voids, reports.'),
  ('CASHIER', 'POS, customers, transactions and own shift.');

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE user_roles (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE shifts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  opened_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  closed_at TEXT,
  starting_cash_c INTEGER NOT NULL DEFAULT 0,
  cash_sales_c INTEGER NOT NULL DEFAULT 0,
  gcash_c INTEGER NOT NULL DEFAULT 0,
  maya_c INTEGER NOT NULL DEFAULT 0,
  utang_sold_c INTEGER NOT NULL DEFAULT 0,
  refund_cash_c INTEGER NOT NULL DEFAULT 0,
  cash_expenses_c INTEGER NOT NULL DEFAULT 0,
  cash_in_c INTEGER NOT NULL DEFAULT 0,
  cash_out_c INTEGER NOT NULL DEFAULT 0,
  expected_cash_c INTEGER NOT NULL DEFAULT 0,
  actual_cash_c INTEGER,
  difference_c INTEGER,
  closing_note TEXT,
  status TEXT NOT NULL DEFAULT 'OPENED'
);
CREATE INDEX idx_shifts_user ON shifts(user_id);
CREATE INDEX idx_shifts_status ON shifts(status);

CREATE TABLE cash_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shift_id INTEGER NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount_c INTEGER NOT NULL,
  reason TEXT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE INDEX idx_cash_movements_shift ON cash_movements(shift_id);

CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  contact_person TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  barcode TEXT UNIQUE,
  description TEXT,
  base_unit TEXT NOT NULL DEFAULT 'piece',
  purchase_cost_c INTEGER NOT NULL DEFAULT 0,
  default_price_c INTEGER NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  has_expiration INTEGER NOT NULL DEFAULT 0,
  image_path TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_search ON products(name, sku, barcode);

CREATE TABLE product_units (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  conversion_to_base INTEGER NOT NULL DEFAULT 1,
  barcode TEXT UNIQUE,
  selling_price_c INTEGER NOT NULL DEFAULT 0,
  is_default INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_units_product ON product_units(product_id);
CREATE INDEX idx_units_barcode ON product_units(barcode);

CREATE TABLE purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  purchase_no TEXT NOT NULL UNIQUE,
  supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
  purchase_date TEXT NOT NULL DEFAULT (date('now','localtime')),
  reference TEXT,
  total_c INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE INDEX idx_purchases_date ON purchases(purchase_date);

CREATE TABLE purchase_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  purchase_id INTEGER NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  unit_name TEXT NOT NULL,
  qty INTEGER NOT NULL,
  qty_base INTEGER NOT NULL,
  unit_cost_c INTEGER NOT NULL,
  subtotal_c INTEGER NOT NULL
);
CREATE INDEX idx_purchase_items_purchase ON purchase_items(purchase_id);
CREATE INDEX idx_purchase_items_product ON purchase_items(product_id);

CREATE TABLE inventory_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity_before INTEGER NOT NULL,
  quantity_change INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  unit TEXT NOT NULL DEFAULT 'base',
  movement_type TEXT NOT NULL,
  reason TEXT,
  reference TEXT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE INDEX idx_movements_product ON inventory_movements(product_id);
CREATE INDEX idx_movements_type ON inventory_movements(movement_type);
CREATE INDEX idx_movements_date ON inventory_movements(created_at);

CREATE TABLE customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  nickname TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  credit_limit_c INTEGER NOT NULL DEFAULT 0,
  balance_c INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE INDEX idx_customers_name ON customers(full_name);

CREATE TABLE credit_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL,
  amount_c INTEGER NOT NULL,
  balance_before_c INTEGER NOT NULL,
  balance_after_c INTEGER NOT NULL,
  reference_type TEXT,
  reference_id INTEGER,
  notes TEXT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE INDEX idx_credit_customer ON credit_ledger(customer_id);
CREATE INDEX idx_credit_date ON credit_ledger(created_at);

CREATE TABLE sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_no TEXT NOT NULL UNIQUE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  subtotal_c INTEGER NOT NULL DEFAULT 0,
  discount_c INTEGER NOT NULL DEFAULT 0,
  total_c INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'COMPLETED',
  shift_id INTEGER REFERENCES shifts(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  voided_at TEXT,
  voided_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  void_reason TEXT
);
CREATE INDEX idx_sales_date ON sales(created_at);
CREATE INDEX idx_sales_cashier ON sales(user_id);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_shift ON sales(shift_id);

CREATE TABLE sale_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  unit_name TEXT NOT NULL,
  qty INTEGER NOT NULL,
  qty_base INTEGER NOT NULL,
  unit_price_c INTEGER NOT NULL,
  subtotal_c INTEGER NOT NULL,
  cost_base_c INTEGER NOT NULL DEFAULT 0,
  refunded_qty_base INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);

CREATE TABLE payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  amount_c INTEGER NOT NULL,
  reference TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE INDEX idx_payments_sale ON payments(sale_id);

CREATE TABLE held_sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL UNIQUE,
  subtotal_c INTEGER NOT NULL DEFAULT 0,
  discount_c INTEGER NOT NULL DEFAULT 0,
  total_c INTEGER NOT NULL DEFAULT 0,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE held_sale_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  held_sale_id INTEGER NOT NULL REFERENCES held_sales(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  unit_name TEXT NOT NULL,
  qty INTEGER NOT NULL,
  qty_base INTEGER NOT NULL,
  unit_price_c INTEGER NOT NULL,
  subtotal_c INTEGER NOT NULL,
  cost_base_c INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE expense_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  is_system INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
INSERT INTO expense_categories (name, is_system) VALUES
  ('Electricity',1),('Rent',1),('Transportation',1),('Salary',1),('Store Supplies',1),
  ('Repairs',1),('Food',1),('Ice',1),('Miscellaneous',1);

CREATE TABLE expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL REFERENCES expense_categories(id),
  amount_c INTEGER NOT NULL,
  expense_date TEXT NOT NULL DEFAULT (date('now','localtime')),
  description TEXT,
  reference TEXT,
  notes TEXT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_category ON expenses(category_id);

CREATE TABLE refunds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  refund_no TEXT NOT NULL UNIQUE,
  sale_id INTEGER NOT NULL REFERENCES sales(id),
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  total_c INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE INDEX idx_refunds_sale ON refunds(sale_id);

CREATE TABLE refund_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  refund_id INTEGER NOT NULL REFERENCES refunds(id) ON DELETE CASCADE,
  sale_item_id INTEGER REFERENCES sale_items(id),
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  qty INTEGER NOT NULL,
  qty_base INTEGER NOT NULL,
  unit_name TEXT,
  amount_c INTEGER NOT NULL
);
CREATE INDEX idx_refund_items_refund ON refund_items(refund_id);

CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  entity_type TEXT,
  entity_id INTEGER,
  old_value TEXT,
  new_value TEXT,
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE INDEX idx_audit_date ON audit_logs(created_at);
CREATE INDEX idx_audit_action ON audit_logs(action);

CREATE TABLE backup_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  path TEXT NOT NULL,
  size INTEGER NOT NULL DEFAULT 0,
  kind TEXT NOT NULL DEFAULT 'MANUAL',
  status TEXT NOT NULL DEFAULT 'OK',
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);`
  }
]