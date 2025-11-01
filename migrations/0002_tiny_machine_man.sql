CREATE TABLE `budget_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`pet_id` text NOT NULL,
	`category` text,
	`amount` real NOT NULL,
	`currency` text DEFAULT 'TRY' NOT NULL,
	`period` text NOT NULL,
	`alert_threshold` real DEFAULT 0.8 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`pet_id`) REFERENCES `pets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`pet_id` text NOT NULL,
	`category` text NOT NULL,
	`amount` real NOT NULL,
	`currency` text DEFAULT 'TRY' NOT NULL,
	`payment_method` text,
	`description` text,
	`date` integer NOT NULL,
	`receipt_photo` text,
	`vendor` text,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`pet_id`) REFERENCES `pets`(`id`) ON UPDATE no action ON DELETE cascade
);
