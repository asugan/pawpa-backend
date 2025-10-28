CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`pet_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`type` text NOT NULL,
	`start_time` integer NOT NULL,
	`end_time` integer,
	`location` text,
	`notes` text,
	`reminder` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`pet_id`) REFERENCES `pets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `feeding_schedules` (
	`id` text PRIMARY KEY NOT NULL,
	`pet_id` text NOT NULL,
	`time` text NOT NULL,
	`food_type` text NOT NULL,
	`amount` text NOT NULL,
	`days` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`pet_id`) REFERENCES `pets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `health_records` (
	`id` text PRIMARY KEY NOT NULL,
	`pet_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`date` integer NOT NULL,
	`veterinarian` text,
	`clinic` text,
	`cost` real,
	`next_due_date` integer,
	`attachments` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`pet_id`) REFERENCES `pets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `pets` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`breed` text,
	`birth_date` integer,
	`weight` real,
	`gender` text,
	`profile_photo` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
