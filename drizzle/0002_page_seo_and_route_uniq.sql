ALTER TABLE `page` ADD `og_image` text;--> statement-breakpoint
ALTER TABLE `page` ADD `canonical_url` text;--> statement-breakpoint
ALTER TABLE `page` ADD `robots` text DEFAULT 'index,follow' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `page_override_route_uniq` ON `page` (`route_pattern`) WHERE type = 'override' AND route_pattern IS NOT NULL;
