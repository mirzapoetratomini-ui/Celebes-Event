-- ============================================================
-- DATABASE SCHEMA: Celebes Event (Event & Ticketing Management)
-- Database Engine: MySQL / MariaDB (mysqli compatible)
-- Character Set: utf8mb4_unicode_ci
-- Target: cPanel / VPS / Shared Hosting / Docker
-- ============================================================

-- CATATAN HOSTING / cPANEL:
-- Baris CREATE DATABASE dan USE dinonaktifkan agar 100% kompatibel dengan shared hosting (cPanel prefix).
-- Database otomatis digunakan sesuai database yang Anda klik di phpMyAdmin.
-- CREATE DATABASE IF NOT EXISTS `celebes_event_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE `celebes_event_db`;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `attendee_responses`;
DROP TABLE IF EXISTS `tickets`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `custom_form_fields`;
DROP TABLE IF EXISTS `ticket_tiers`;
DROP TABLE IF EXISTS `vouchers`;
DROP TABLE IF EXISTS `payout_requests`;
DROP TABLE IF EXISTS `events`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `system_settings`;
SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------
-- Table 1: users (Super Admin, Creator, Peserta/User)
-- ------------------------------------------------------------
CREATE TABLE `users` (
  `id` VARCHAR(50) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `password_hash` VARCHAR(255) NULL,
  `role` ENUM('admin', 'creator', 'user') NOT NULL DEFAULT 'user',
  `avatar` VARCHAR(255) NULL,
  `phone` VARCHAR(50) NULL,
  `organization` VARCHAR(191) NULL,
  `auth_provider` ENUM('local', 'google', 'facebook', 'twitter') NOT NULL DEFAULT 'local',
  `provider_id` VARCHAR(191) NULL,
  `status` ENUM('active', 'suspended', 'pending') NOT NULL DEFAULT 'active',
  `bank_name` VARCHAR(100) NULL,
  `bank_account_number` VARCHAR(100) NULL,
  `bank_account_name` VARCHAR(191) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_email` (`email`),
  KEY `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table 2: events (Dibuat oleh Kreator, Dikelola Super Admin)
-- ------------------------------------------------------------
CREATE TABLE `events` (
  `id` VARCHAR(50) NOT NULL,
  `creator_id` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `banner_image` TEXT NULL,
  `short_description` TEXT NULL,
  `description` LONGTEXT NULL,
  `start_date` DATETIME NOT NULL,
  `end_date` DATETIME NOT NULL,
  `location_type` ENUM('venue', 'online', 'hybrid') NOT NULL DEFAULT 'venue',
  `venue_name` VARCHAR(255) NULL,
  `venue_address` TEXT NULL,
  `online_meeting_url` TEXT NULL,
  `status` ENUM('published', 'draft', 'pending_approval', 'ended', 'cancelled') NOT NULL DEFAULT 'published',
  `is_featured` TINYINT(1) NOT NULL DEFAULT 0,
  `registration_limit` INT NOT NULL DEFAULT 0,
  `social_share_slug` VARCHAR(100) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_events_slug` (`slug`),
  KEY `idx_events_creator` (`creator_id`),
  KEY `idx_events_status` (`status`),
  KEY `idx_events_dates` (`start_date`, `end_date`),
  CONSTRAINT `fk_events_creator` FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table 3: ticket_tiers (Jenis Tiket per Event)
-- ------------------------------------------------------------
CREATE TABLE `ticket_tiers` (
  `id` VARCHAR(50) NOT NULL,
  `event_id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT NULL,
  `price` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `quota` INT NOT NULL DEFAULT 100,
  `sold_count` INT NOT NULL DEFAULT 0,
  `max_per_order` INT NOT NULL DEFAULT 5,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tiers_event` (`event_id`),
  CONSTRAINT `fk_tiers_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table 4: custom_form_fields (Form Pendaftaran Dinamis per Event)
-- ------------------------------------------------------------
CREATE TABLE `custom_form_fields` (
  `id` VARCHAR(50) NOT NULL,
  `event_id` VARCHAR(50) NOT NULL,
  `label` VARCHAR(255) NOT NULL,
  `field_type` ENUM('text', 'number', 'email', 'phone', 'dropdown', 'checkbox', 'textarea') NOT NULL DEFAULT 'text',
  `placeholder` VARCHAR(255) NULL,
  `options_json` TEXT NULL COMMENT 'JSON array jika field_type dropdown/checkbox',
  `is_required` TINYINT(1) NOT NULL DEFAULT 0,
  `order_index` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_form_fields_event` (`event_id`),
  CONSTRAINT `fk_fields_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table 5: vouchers (Kode Promo / Diskon)
-- ------------------------------------------------------------
CREATE TABLE `vouchers` (
  `id` VARCHAR(50) NOT NULL,
  `event_id` VARCHAR(50) NULL COMMENT 'NULL jika berlaku global',
  `code` VARCHAR(50) NOT NULL,
  `discount_type` ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
  `discount_value` DECIMAL(12, 2) NOT NULL,
  `quota` INT NOT NULL DEFAULT 50,
  `used_count` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `valid_until` DATETIME NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_vouchers_code` (`code`),
  KEY `idx_vouchers_event` (`event_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table 6: orders (Transaksi & Pembayaran)
-- ------------------------------------------------------------
CREATE TABLE `orders` (
  `id` VARCHAR(50) NOT NULL,
  `order_number` VARCHAR(50) NOT NULL,
  `user_id` VARCHAR(50) NOT NULL,
  `event_id` VARCHAR(50) NOT NULL,
  `buyer_name` VARCHAR(191) NOT NULL,
  `buyer_email` VARCHAR(191) NOT NULL,
  `buyer_phone` VARCHAR(50) NOT NULL,
  `subtotal` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `discount_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `platform_fee` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `total_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `payment_type` ENUM('automatic', 'manual') NOT NULL DEFAULT 'automatic',
  `payment_method` ENUM('qris', 'bank_transfer', 'virtual_account', 'credit_card', 'free', 'bank_transfer_manual') NOT NULL DEFAULT 'qris',
  `payment_channel` VARCHAR(100) NULL COMMENT 'BCA, Mandiri, BRI, GoPay, QRIS-Nusa, Transfer Manual',
  `payment_status` ENUM('pending', 'pending_manual_verification', 'paid', 'payment_rejected', 'expired', 'cancelled', 'refunded') NOT NULL DEFAULT 'pending',
  `payment_reference` VARCHAR(100) NULL,
  `payment_proof_url` LONGTEXT NULL COMMENT 'URL atau Data URI file bukti transfer',
  `sender_bank` VARCHAR(100) NULL,
  `sender_account_name` VARCHAR(191) NULL,
  `transfer_notes` TEXT NULL,
  `verified_by` VARCHAR(191) NULL,
  `verified_at` DATETIME NULL,
  `rejection_reason` TEXT NULL,
  `paid_at` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_orders_number` (`order_number`),
  KEY `idx_orders_user` (`user_id`),
  KEY `idx_orders_event` (`event_id`),
  KEY `idx_orders_status` (`payment_status`),
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_orders_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table 7: tickets (E-Ticket per Peserta)
-- ------------------------------------------------------------
CREATE TABLE `tickets` (
  `id` VARCHAR(50) NOT NULL,
  `order_id` VARCHAR(50) NOT NULL,
  `event_id` VARCHAR(50) NOT NULL,
  `tier_id` VARCHAR(50) NOT NULL,
  `ticket_code` VARCHAR(50) NOT NULL,
  `qr_payload` VARCHAR(255) NOT NULL,
  `attendee_name` VARCHAR(191) NOT NULL,
  `attendee_email` VARCHAR(191) NOT NULL,
  `check_in_status` ENUM('not_checked_in', 'checked_in') NOT NULL DEFAULT 'not_checked_in',
  `check_in_time` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tickets_code` (`ticket_code`),
  KEY `idx_tickets_order` (`order_id`),
  KEY `idx_tickets_event` (`event_id`),
  KEY `idx_tickets_tier` (`tier_id`),
  CONSTRAINT `fk_tickets_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tickets_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`),
  CONSTRAINT `fk_tickets_tier` FOREIGN KEY (`tier_id`) REFERENCES `ticket_tiers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table 8: attendee_responses (Jawaban Form Kustom)
-- ------------------------------------------------------------
CREATE TABLE `attendee_responses` (
  `id` VARCHAR(50) NOT NULL,
  `ticket_id` VARCHAR(50) NOT NULL,
  `field_id` VARCHAR(50) NOT NULL,
  `field_label` VARCHAR(255) NOT NULL,
  `response_value` TEXT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_resp_ticket` (`ticket_id`),
  KEY `idx_resp_field` (`field_id`),
  CONSTRAINT `fk_resp_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table 9: payout_requests (Penarikan Dana Kreator)
-- ------------------------------------------------------------
CREATE TABLE `payout_requests` (
  `id` VARCHAR(50) NOT NULL,
  `creator_id` VARCHAR(50) NOT NULL,
  `event_id` VARCHAR(50) NOT NULL,
  `amount` DECIMAL(12, 2) NOT NULL,
  `bank_name` VARCHAR(100) NOT NULL,
  `account_number` VARCHAR(100) NOT NULL,
  `account_name` VARCHAR(191) NOT NULL,
  `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  `admin_note` TEXT NULL,
  `processed_at` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_payout_creator` (`creator_id`),
  KEY `idx_payout_event` (`event_id`),
  CONSTRAINT `fk_payout_creator` FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_payout_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table 10: system_settings (Konfigurasi Platform)
-- ------------------------------------------------------------
CREATE TABLE `system_settings` (
  `setting_key` VARCHAR(100) NOT NULL,
  `setting_value` TEXT NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- SEED DATA AWAL (Initial Sample Records)
-- ------------------------------------------------------------

-- 1. Users: Super Admin, Creator, User
INSERT INTO `users` (`id`, `email`, `name`, `password_hash`, `role`, `avatar`, `phone`, `organization`, `auth_provider`, `status`, `bank_name`, `bank_account_number`, `bank_account_name`) VALUES
('usr-admin-01', 'admin@celebes-event.com', 'Super Administrator Celebes Event', 'demo123', 'admin', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80', '081241129988', 'Celebes Event Platform HQ', 'local', 'active', 'BCA', '8880192831', 'PT CELEBES EVENT NUSANTARA'),
('usr-creator-01', 'kreator@celebescreative.id', 'Celebes Creative Promosindo', 'demo123', 'creator', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80', '081398765432', 'Celebes Creative Promosindo', 'google', 'active', 'Bank Mandiri', '1370019283746', 'Celebes Creative Promosindo'),
('usr-user-01', 'budi.santoso@gmail.com', 'Budi Santoso', 'demo123', 'user', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80', '085712345678', 'Universitas Indonesia', 'google', 'active', NULL, NULL, NULL);

-- 2. Events
INSERT INTO `events` (`id`, `creator_id`, `title`, `slug`, `category`, `banner_image`, `short_description`, `description`, `start_date`, `end_date`, `location_type`, `venue_name`, `venue_address`, `online_meeting_url`, `status`, `is_featured`, `registration_limit`, `social_share_slug`) VALUES
('evt-001', 'usr-creator-01', 'Nusantara Tech Summit & AI Expo 2026', 'nusantara-tech-summit-2026', 'Teknologi & Bisnis', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80', 'Konferensi teknologi terbesar di Indonesia menghadirkan inovator AI, Cloud computing, dan Startup Unicorn global.', 'Bergabunglah dalam konferensi inovasi teknologi paling bergengsi di Asia Tenggara. Berisi sesi keynote, pameran stan AI, networking lunch, dan sertifikat berstandar internasional.', '2026-11-20 09:00:00', '2026-11-21 17:00:00', 'venue', 'Jakarta International Convention Center (JICC)', 'Jl. Gatot Subroto No. 1, Senayan, Jakarta Pusat', NULL, 'published', 1, 1500, 'techsummit26'),
('evt-002', 'usr-creator-01', 'Harmoni Senja Musik Festival Vol. 4', 'harmoni-senja-musik-festival', 'Musik & Hiburan', 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80', 'Malam keakraban musik indie akustik dan penampilan musisi nasional di bawah gemerlap lampu malam Bandung.', 'Festival musik terbuka dengan bazaar kuliner nusantara, pertunjukan kembang api ramah lingkungan, serta penampilan 12 musisi terkemuka.', '2026-12-05 15:00:00', '2026-12-05 23:00:00', 'venue', 'Taman Hutan Raya Djuanda', 'Dago Pakar, Ciburial, Kec. Cimenyan, Bandung, Jawa Barat', NULL, 'published', 1, 2000, 'harmonisenja4'),
('evt-003', 'usr-creator-01', 'Digital Marketing & Growth Masterclass', 'digital-marketing-growth-masterclass', 'Workshop & Edukasi', 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80', 'Pelatihan intensif optimasi conversion rate, funnel ads, dan implementasi automated CRM untuk bisnis UKM.', 'Workshop interaktif live streaming bersertifikat, lengkap dengan rekaman seumur hidup dan template spreadsheet strategi pertumbuhan.', '2026-11-28 13:00:00', '2026-11-28 17:30:00', 'online', 'Zoom Webinar VIP Room', 'Online via Zoom', 'https://zoom.us/j/9876543210', 'published', 0, 500, 'growthclass26');

-- 3. Ticket Tiers
INSERT INTO `ticket_tiers` (`id`, `event_id`, `name`, `description`, `price`, `quota`, `sold_count`, `max_per_order`, `is_active`) VALUES
('tier-001', 'evt-001', 'Early Bird - Regular Access', 'Akses penuh 2 hari ke seluruh stage utama, expo hall, & kit peserta digital.', 150000.00, 300, 142, 4, 1),
('tier-002', 'evt-001', 'VIP Executive Pass', 'Akses VIP front-row, lunch buffet bersama pembicara, VIP lounge, merchandise hoodie eksklusif.', 450000.00, 100, 48, 2, 1),
('tier-003', 'evt-002', 'Presale 1 - Festival A', 'Akses area depan panggung utama, free softdrink, gelang festival glow-in-the-dark.', 120000.00, 500, 310, 5, 1),
('tier-004', 'evt-002', 'General Admission (GA)', 'Akses reguler area rumput festival & area kuliner.', 85000.00, 1000, 420, 5, 1),
('tier-005', 'evt-003', 'Peserta Online Live + E-Sertifikat', 'Akses webinar interaktif, sesi Q&A langsung, rekaman video, modul materi PDF.', 75000.00, 300, 89, 10, 1);

-- 4. Custom Form Fields
INSERT INTO `custom_form_fields` (`id`, `event_id`, `label`, `field_type`, `placeholder`, `options_json`, `is_required`, `order_index`) VALUES
('cf-001', 'evt-001', 'Instansi / Perusahaan / Kampus', 'text', 'Contoh: PT Teknologi Maju / Univ Indonesia', NULL, 1, 1),
('cf-002', 'evt-001', 'Ukuran Kaos Official Event', 'dropdown', 'Pilih Ukuran Kaos', '["S", "M", "L", "XL", "XXL"]', 1, 2),
('cf-003', 'evt-001', 'Kebutuhan Khusus / Makanan (Dietary)', 'dropdown', 'Pilih Kategori Makanan', '["Halal / Standar", "Vegetarian", "No Seafood", "Tidak Ada"]', 0, 3),
('cf-004', 'evt-002', 'Komunitas / Asal Kota', 'text', 'Contoh: Bandung Indie Club', NULL, 0, 1),
('cf-005', 'evt-003', 'Tautan Profil LinkedIn / Website', 'text', 'https://linkedin.com/in/username', NULL, 0, 1);

-- 5. Vouchers
INSERT INTO `vouchers` (`id`, `event_id`, `code`, `discount_type`, `discount_value`, `quota`, `used_count`, `is_active`, `valid_until`) VALUES
('vch-001', NULL, 'CELEBESKEREN', 'percentage', 15.00, 100, 24, 1, '2026-12-31 23:59:59'),
('vch-002', 'evt-001', 'TECHAI2026', 'fixed', 50000.00, 50, 18, 1, '2026-11-20 00:00:00'),
('vch-003', 'evt-002', 'SENJAMUSIK', 'percentage', 20.00, 80, 12, 1, '2026-12-05 00:00:00');

-- 6. Initial Sample Orders
INSERT INTO `orders` (`id`, `order_number`, `user_id`, `event_id`, `buyer_name`, `buyer_email`, `buyer_phone`, `subtotal`, `discount_amount`, `platform_fee`, `total_amount`, `payment_method`, `payment_channel`, `payment_status`, `payment_reference`, `paid_at`) VALUES
('ord-sample-01', 'TN-202611-0001', 'usr-user-01', 'evt-001', 'Budi Santoso', 'budi.santoso@gmail.com', '085712345678', 150000.00, 0.00, 4500.00, 154500.00, 'qris', 'QRIS-Nusa', 'paid', 'REF-QRIS-992182', NOW()),
('ord-sample-02', 'TN-202611-0002', 'usr-user-01', 'evt-002', 'Budi Santoso', 'budi.santoso@gmail.com', '085712345678', 85000.00, 17000.00, 4500.00, 72500.00, 'virtual_account', 'BCA Virtual Account', 'paid', 'VA-BCA-10293847', NOW());

-- 7. Initial Sample Tickets
INSERT INTO `tickets` (`id`, `order_id`, `event_id`, `tier_id`, `ticket_code`, `qr_payload`, `attendee_name`, `attendee_email`, `check_in_status`, `check_in_time`) VALUES
('tkt-sample-01', 'ord-sample-01', 'evt-001', 'tier-001', 'CE-TKT-TECH-001', 'CELEBES:CE-TKT-TECH-001:evt-001:Budi-Santoso', 'Budi Santoso', 'budi.santoso@gmail.com', 'not_checked_in', NULL),
('tkt-sample-02', 'ord-sample-02', 'evt-002', 'tier-004', 'CE-TKT-SENJA-002', 'CELEBES:CE-TKT-SENJA-002:evt-002:Budi-Santoso', 'Budi Santoso', 'budi.santoso@gmail.com', 'checked_in', NOW());

-- 8. Attendee Responses
INSERT INTO `attendee_responses` (`id`, `ticket_id`, `field_id`, `field_label`, `response_value`) VALUES
('resp-001', 'tkt-sample-01', 'cf-001', 'Instansi / Perusahaan / Kampus', 'Universitas Indonesia'),
('resp-002', 'tkt-sample-01', 'cf-002', 'Ukuran Kaos Official Event', 'L'),
('resp-003', 'tkt-sample-01', 'cf-003', 'Kebutuhan Khusus / Makanan (Dietary)', 'Halal / Standar');

-- 9. System Settings
INSERT INTO `system_settings` (`setting_key`, `setting_value`) VALUES
('platform_name', 'Celebes Event Management'),
('platform_fee_fixed', '4500'),
('platform_fee_percentage', '2.5'),
('default_currency', 'IDR'),
('qris_merchant_name', 'CELEBES EVENT INDONESIA'),
('contact_email', 'support@celebes-event.com'),
('contact_whatsapp', '+6281241129988');
