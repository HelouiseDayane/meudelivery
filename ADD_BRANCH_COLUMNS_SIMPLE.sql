-- Script SQL SIMPLIFICADO para adicionar sistema de filiais
-- Use este se o script principal der erro de sintaxe

USE brunocakes;

-- 1. Criar tabela branches
CREATE TABLE IF NOT EXISTS branches (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  name varchar(255) NOT NULL,
  code varchar(10) NOT NULL,
  address text NOT NULL,
  phone varchar(20) DEFAULT NULL,
  email varchar(255) DEFAULT NULL,
  opening_hours json DEFAULT NULL,
  is_open tinyint(1) NOT NULL DEFAULT 1,
  is_active tinyint(1) NOT NULL DEFAULT 1,
  created_at timestamp NULL DEFAULT NULL,
  updated_at timestamp NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY branches_code_unique (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Adicionar colunas na tabela users (ignora erro se já existir)
ALTER TABLE users ADD COLUMN role enum('master','admin','employee') NOT NULL DEFAULT 'employee' AFTER is_admin;
ALTER TABLE users ADD COLUMN branch_id bigint(20) unsigned DEFAULT NULL AFTER role;
ALTER TABLE users ADD CONSTRAINT users_branch_id_foreign FOREIGN KEY (branch_id) REFERENCES branches (id) ON DELETE SET NULL;

-- 3. Atualizar usuários existentes
UPDATE users SET role = 'master', branch_id = NULL WHERE is_admin = 1;

-- 4. Adicionar branch_id em products
ALTER TABLE products ADD COLUMN branch_id bigint(20) unsigned DEFAULT NULL AFTER id;
ALTER TABLE products ADD CONSTRAINT products_branch_id_foreign FOREIGN KEY (branch_id) REFERENCES branches (id) ON DELETE CASCADE;

-- 5. Adicionar branch_id em orders
ALTER TABLE orders ADD COLUMN branch_id bigint(20) unsigned DEFAULT NULL AFTER id;
ALTER TABLE orders ADD CONSTRAINT orders_branch_id_foreign FOREIGN KEY (branch_id) REFERENCES branches (id) ON DELETE SET NULL;

-- 6. Adicionar branch_id em addresses
ALTER TABLE addresses ADD COLUMN branch_id bigint(20) unsigned DEFAULT NULL AFTER id;
ALTER TABLE addresses ADD CONSTRAINT addresses_branch_id_foreign FOREIGN KEY (branch_id) REFERENCES branches (id) ON DELETE CASCADE;

SELECT 'Migrations aplicadas com sucesso!' AS status;
