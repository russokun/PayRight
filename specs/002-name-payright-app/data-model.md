# Data Model: PayRight App Core

This document describes the primary entities, fields, relationships and sample Postgres table definitions (for Supabase) including PostGIS usage for location queries.

## Entities

### Product
- product_id: uuid PK
- sku: text NULLABLE (source SKU/barcode)
- name: text
- brand: text
- category: text
- normalized_name: text (for search)
- created_at, updated_at

### Supermarket
- supermarket_id: uuid PK
- name: text
- chain_name: text
- branch_name: text NULLABLE
- address: text NULLABLE
- location: geography(Point, 4326) NULLABLE
- created_at, updated_at

### Price (canonical from scraper)
- price_id: uuid PK
- product_id: uuid FK -> products(product_id)
- supermarket_id: uuid FK -> supermarkets(supermarket_id)
- price: numeric(12,2)
- currency: text (e.g., CLP)
- source: text ('online_scraper')
- sku_source: text NULLABLE
- recorded_at: timestamptz
- created_at, updated_at

### PriceReport (user-submitted)
- report_id: uuid PK
- product_id: uuid FK
- supermarket_id: uuid FK NULLABLE
- user_id: uuid NULLABLE
- price: numeric(12,2)
- currency: text
- geolocation: geography(Point,4326) NULLABLE
- photo_url: text NULLABLE
- status: text ('pending','verified','reported','under_review')
- confirmations: int default 0
- reports: int default 0
- created_at, updated_at

### User
- user_id: uuid PK
- username: text NULLABLE
- email: text NULLABLE
- hashed_password: text NULLABLE
- points: int default 0
- rank: int default 0
- created_at, updated_at

### PointsLedger (audit)
- ledger_id: uuid PK
- user_id: uuid FK
- delta: int
- reason: text
- reference_id: uuid NULLABLE (e.g., report_id)
- created_at

## Sample Postgres DDL (Supabase)
```sql
-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE products (
  product_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text,
  name text NOT NULL,
  brand text,
  category text,
  normalized_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE supermarkets (
  supermarket_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  chain_name text NOT NULL,
  branch_name text,
  address text,
  location geography(Point,4326),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE prices (
  price_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(product_id),
  supermarket_id uuid REFERENCES supermarkets(supermarket_id),
  price numeric(12,2) NOT NULL,
  currency text DEFAULT 'CLP',
  source text NOT NULL,
  sku_source text,
  recorded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE price_reports (
  report_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(product_id),
  supermarket_id uuid REFERENCES supermarkets(supermarket_id),
  user_id uuid REFERENCES users(user_id),
  price numeric(12,2) NOT NULL,
  currency text DEFAULT 'CLP',
  geolocation geography(Point,4326),
  photo_url text,
  status text DEFAULT 'pending',
  confirmations int DEFAULT 0,
  reports int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE users (
  user_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text,
  email text,
  hashed_password text,
  points int DEFAULT 0,
  rank int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE points_ledger (
  ledger_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(user_id),
  delta int NOT NULL,
  reason text,
  reference_id uuid,
  created_at timestamptz DEFAULT now()
);
```

## Indexing & Performance
- Index products.normalized_name using gin_trgm_ops for fast fuzzy search
- Index supermarkets.location using PostGIS spatial index
- Partition prices by supermarket or date if volume grows

## Validation & Constraints
- price >= 0
- confirmations >= 0
- reports >= 0

## Notes
- Supabase RLS policies will be required to restrict who can insert/update certain tables (e.g., only the scraper service can write to `prices` with source='online_scraper' unless otherwise allowed).
