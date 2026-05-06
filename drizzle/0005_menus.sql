CREATE TABLE `menu` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`location` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `menu_slug_unique` ON `menu` (`slug`);
--> statement-breakpoint
CREATE UNIQUE INDEX `menu_location_uniq` ON `menu` (`location`) WHERE location IS NOT NULL;
--> statement-breakpoint
CREATE TABLE `menu_item` (
	`id` text PRIMARY KEY NOT NULL,
	`menu_id` text NOT NULL,
	`parent_id` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`kind` text DEFAULT 'custom' NOT NULL,
	`ref_id` text,
	`url` text,
	`label_vi` text DEFAULT '' NOT NULL,
	`label_en` text,
	`target` text DEFAULT '_self' NOT NULL,
	`is_mega` integer DEFAULT false NOT NULL,
	`data` text DEFAULT '{}' NOT NULL,
	FOREIGN KEY (`menu_id`) REFERENCES `menu`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `menu_item_menu_idx` ON `menu_item` (`menu_id`);
--> statement-breakpoint
CREATE INDEX `menu_item_parent_idx` ON `menu_item` (`parent_id`);
