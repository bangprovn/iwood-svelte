ALTER TABLE `page` ADD `published_at` integer;--> statement-breakpoint
ALTER TABLE `page` ADD `published_snapshot` text;--> statement-breakpoint
CREATE TABLE `page_revision` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`page_id` text NOT NULL,
	`snapshot` text NOT NULL,
	`published_at` integer DEFAULT (unixepoch()) NOT NULL,
	`published_by` text,
	`note` text,
	FOREIGN KEY (`page_id`) REFERENCES `page`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
CREATE INDEX `page_revision_page_idx` ON `page_revision` (`page_id`);
