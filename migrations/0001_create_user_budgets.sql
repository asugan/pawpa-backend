CREATE TABLE `user_budgets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`amount` real NOT NULL,
	`currency` text DEFAULT 'TRY' NOT NULL,
	`alert_threshold` real DEFAULT 0.8 NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_budgets_user_id_unique` ON `user_budgets` (`user_id`);--> statement-breakpoint
-- Migrate existing overall budget data from budget_limits to user_budgets
INSERT INTO `user_budgets` (
	`id`,
	`user_id`,
	`amount`,
	`currency`,
	`alert_threshold`,
	`is_active`,
	`created_at`,
	`updated_at`
)
SELECT 
	'ub_' || hex(randomblob(16)) as id,
	user_id,
	SUM(amount) as amount,
	currency,
	AVG(alert_threshold) as alert_threshold,
	MAX(is_active) as is_active,
	MIN(created_at) as created_at,
	UNIXEPOCH() * 1000 as updated_at
FROM budget_limits 
WHERE category IS NULL AND period = 'monthly'
GROUP BY user_id, currency;