CREATE TABLE `app_locale` (
	`code` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`dir` text DEFAULT 'ltr' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `app_translation` (
	`key` text NOT NULL,
	`locale` text NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`key`, `locale`),
	FOREIGN KEY (`key`) REFERENCES `app_translation_key`(`key`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`locale`) REFERENCES `app_locale`(`code`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `app_translation_locale_idx` ON `app_translation` (`locale`);--> statement-breakpoint
CREATE TABLE `app_translation_key` (
	`key` text PRIMARY KEY NOT NULL,
	`description` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `page` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`type` text DEFAULT 'custom' NOT NULL,
	`route_pattern` text,
	`title_vi` text NOT NULL,
	`title_en` text NOT NULL,
	`meta_desc_vi` text,
	`meta_desc_en` text,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `page_slug_unique` ON `page` (`slug`);--> statement-breakpoint
CREATE TABLE `page_block` (
	`id` text PRIMARY KEY NOT NULL,
	`page_id` text NOT NULL,
	`type` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`global_settings` text DEFAULT '{}' NOT NULL,
	FOREIGN KEY (`page_id`) REFERENCES `page`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `page_block_page_idx` ON `page_block` (`page_id`);--> statement-breakpoint
CREATE TABLE `page_block_content` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`block_id` text NOT NULL,
	`locale` text NOT NULL,
	`content` text DEFAULT '{}' NOT NULL,
	FOREIGN KEY (`block_id`) REFERENCES `page_block`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `page_block_content_block_idx` ON `page_block_content` (`block_id`);--> statement-breakpoint
CREATE INDEX `page_block_content_locale_idx` ON `page_block_content` (`locale`);--> statement-breakpoint
ALTER TABLE `user` ADD `role` text DEFAULT 'user' NOT NULL;