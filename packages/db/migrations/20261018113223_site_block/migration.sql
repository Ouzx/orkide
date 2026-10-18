CREATE TABLE `site_block` (
	`id` text PRIMARY KEY,
	`locale` text NOT NULL,
	`key` text NOT NULL,
	`data` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `site_block_locale_key_idx` ON `site_block` (`locale`,`key`);