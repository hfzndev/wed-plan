CREATE TABLE `budget_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kategori` text NOT NULL,
	`nama` text NOT NULL,
	`tipe` text DEFAULT 'lumpsum' NOT NULL,
	`harga_satuan` integer DEFAULT 0 NOT NULL,
	`qty` integer DEFAULT 1 NOT NULL,
	`aktual` integer,
	`vendor_nama` text DEFAULT '' NOT NULL,
	`catatan` text DEFAULT '' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `decisions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`topik` text NOT NULL,
	`keputusan` text NOT NULL,
	`alasan` text DEFAULT '' NOT NULL,
	`tanggal` text NOT NULL,
	`oleh` text DEFAULT 'berdua' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nama` text NOT NULL,
	`pihak` text NOT NULL,
	`status` text DEFAULT 'belum' NOT NULL,
	`instansi` text DEFAULT '' NOT NULL,
	`deadline` text,
	`catatan` text DEFAULT '' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`dari_template` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ideas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`judul` text NOT NULL,
	`url` text DEFAULT '' NOT NULL,
	`kategori` text DEFAULT '' NOT NULL,
	`catatan` text DEFAULT '' NOT NULL,
	`favorit` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`budget_item_id` integer NOT NULL,
	`jenis` text NOT NULL,
	`jumlah` integer DEFAULT 0 NOT NULL,
	`jatuh_tempo` text NOT NULL,
	`status` text DEFAULT 'belum' NOT NULL,
	`dibayar_tanggal` text,
	`metode` text DEFAULT '' NOT NULL,
	`catatan` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`budget_item_id`) REFERENCES `budget_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `rundown_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`acara` text NOT NULL,
	`waktu_mulai` text NOT NULL,
	`waktu_selesai` text DEFAULT '' NOT NULL,
	`kegiatan` text NOT NULL,
	`pic` text DEFAULT '' NOT NULL,
	`catatan` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `seserahan_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nama` text NOT NULL,
	`kategori` text DEFAULT 'lain' NOT NULL,
	`is_mahar` integer DEFAULT false NOT NULL,
	`estimasi` integer DEFAULT 0 NOT NULL,
	`aktual` integer,
	`status` text DEFAULT 'belum' NOT NULL,
	`catatan` text DEFAULT '' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`nama_pria` text DEFAULT '' NOT NULL,
	`nama_wanita` text DEFAULT '' NOT NULL,
	`tanggal_akad` text,
	`tanggal_resepsi` text,
	`venue_akad` text DEFAULT '' NOT NULL,
	`venue_resepsi` text DEFAULT '' NOT NULL,
	`target_tamu` integer DEFAULT 0 NOT NULL,
	`total_budget` integer DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`judul` text NOT NULL,
	`deskripsi` text DEFAULT '' NOT NULL,
	`kategori` text DEFAULT '' NOT NULL,
	`fase` text NOT NULL,
	`offset_hari` integer,
	`due_date_override` text,
	`assignee` text DEFAULT 'berdua' NOT NULL,
	`status` text DEFAULT 'todo' NOT NULL,
	`done_at` integer,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`dari_template` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`nama` text NOT NULL,
	`peran` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `vendor_files` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`vendor_id` integer NOT NULL,
	`nama_asli` text NOT NULL,
	`path` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `vendors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nama` text NOT NULL,
	`kategori` text NOT NULL,
	`status` text DEFAULT 'shortlist' NOT NULL,
	`kontak_nama` text DEFAULT '' NOT NULL,
	`whatsapp` text DEFAULT '' NOT NULL,
	`instagram` text DEFAULT '' NOT NULL,
	`website` text DEFAULT '' NOT NULL,
	`lokasi` text DEFAULT '' NOT NULL,
	`harga_penawaran` integer DEFAULT 0 NOT NULL,
	`rating` integer,
	`catatan` text DEFAULT '' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
