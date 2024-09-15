CREATE TABLE `comments_summary` (
	`id` text PRIMARY KEY NOT NULL,
	`summary` text NOT NULL,
	`video_id` text(11) NOT NULL,
	`user_id` text(36) NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `summary_comment_ids` (
	`id` text PRIMARY KEY NOT NULL,
	`comments_ids` text NOT NULL,
	`comments_summary_id` text(30) NOT NULL,
	`total_comments_used` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`comments_summary_id`) REFERENCES `comments_summary`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `comments_summary_video_id_unique` ON `comments_summary` (`video_id`);