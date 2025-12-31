-- Script SQL para adicionar sistema de filiais ao BrunoCakes
-- Execute este script diretamente no MySQL se as migrations não funcionarem

USE brunocakes;

-- 1. Criar tabela branches
CREATE TABLE IF NOT EXISTS `branches` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(10) NOT NULL,
  `address` text NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `opening_hours` json DEFAULT NULL,
  `is_open` tinyint(1) NOT NULL DEFAULT 1,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `branches_code_unique` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Adicionar role e branch_id na tabela users
ALTER TABLE `users` 
  ADD COLUMN IF NOT EXISTS `role` enum('master','admin','employee') NOT NULL DEFAULT 'employee' AFTER `is_admin`,
  ADD COLUMN IF NOT EXISTS `branch_id` bigint(20) unsigned DEFAULT NULL AFTER `role`,
  ADD CONSTRAINT `users_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL;

-- 3. Atualizar usuários existentes para master
UPDATE `users` SET `role` = 'master', `branch_id` = NULL WHERE `is_admin` = 1;

-- 4. Adicionar branch_id na tabela products
ALTER TABLE `products` 
  ADD COLUMN IF NOT EXISTS `branch_id` bigint(20) unsigned DEFAULT NULL AFTER `id`,
  ADD CONSTRAINT `products_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE;

-- 5. Adicionar branch_id na tabela orders
ALTER TABLE `orders` 
  ADD COLUMN IF NOT EXISTS `branch_id` bigint(20) unsigned DEFAULT NULL AFTER `id`,
  ADD CONSTRAINT `orders_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL;

-- 6. Adicionar branch_id na tabela addresses
ALTER TABLE `addresses` 
  ADD COLUMN IF NOT EXISTS `branch_id` bigint(20) unsigned DEFAULT NULL AFTER `id`,
  ADD CONSTRAINT `addresses_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE;

-- 7. Inserir filial exemplo (opcional)
INSERT INTO `branches` (`name`, `code`, `address`, `phone`, `email`, `opening_hours`, `is_open`, `is_active`, `created_at`, `updated_at`) 
VALUES 
  ('Filial Centro', 'CTR', 'Av. Principal, 123 - Centro - Cidade/RN', '(84) 99999-9999', 'centro@brunocakes.com', '{"seg-sex": "08:00 às 18:00", "sabado": "09:00 às 13:00"}', 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE `name` = `name`;

-- Verificar se as alterações foram feitas
SHOW TABLES;
DESCRIBE users;
DESCRIBE products;
DESCRIBE orders;
DESCRIBE addresses;
DESCRIBE branches;

SELECT 'Script executado com sucesso!' AS resultado;
