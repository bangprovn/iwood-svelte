CREATE TABLE `site_setting` (
	`key` text PRIMARY KEY NOT NULL,
	`group` text NOT NULL,
	`value` text DEFAULT '' NOT NULL,
	`is_public` integer DEFAULT false NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `site_setting_group_idx` ON `site_setting` (`group`);
