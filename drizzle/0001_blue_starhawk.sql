CREATE TABLE `chat_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`peran` text NOT NULL,
	`oleh` text,
	`isi` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notification_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`job` text NOT NULL,
	`kunci` text NOT NULL,
	`tujuan` text NOT NULL,
	`status` text NOT NULL,
	`error` text DEFAULT '' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notification_log_unik` ON `notification_log` (`job`,`kunci`,`tujuan`);--> statement-breakpoint
ALTER TABLE `users` ADD `whatsapp` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `wa_aktif` integer DEFAULT true NOT NULL;