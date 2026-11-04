CREATE TABLE `finance_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`value_mode` text NOT NULL,
	`value` real NOT NULL,
	`icon` text NOT NULL,
	`color` text NOT NULL,
	`sort_order` integer NOT NULL,
	`is_active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `monthly_finance_configs` (
	`month_key` text PRIMARY KEY NOT NULL,
	`custom_start_date` text,
	`custom_end_date` text,
	`manual_gross_override` real,
	`notes` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `monthly_finance_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`month_key` text NOT NULL,
	`template_id` text,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`value_mode` text NOT NULL,
	`value` real NOT NULL,
	`icon` text NOT NULL,
	`color` text NOT NULL,
	`sort_order` integer NOT NULL,
	`is_paid` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE INDEX `monthly_finance_entries_month_key_idx` ON `monthly_finance_entries` (`month_key`);--> statement-breakpoint
ALTER TABLE `settings` ADD `pay_cycle_configured` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `settings` ADD `payday_day_of_month` integer DEFAULT 25 NOT NULL;--> statement-breakpoint
ALTER TABLE `settings` ADD `anchor_payday_date` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `settings` ADD `pay_cycle_length_unit` text DEFAULT 'financial-month' NOT NULL;--> statement-breakpoint
ALTER TABLE `settings` ADD `pay_cycle_length_days` integer DEFAULT 28 NOT NULL;