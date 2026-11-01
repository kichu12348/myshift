CREATE TABLE `rotation_exceptions` (
	`rotation_id` text NOT NULL,
	`date` text NOT NULL,
	`kind` text NOT NULL,
	`template_id` text,
	PRIMARY KEY(`rotation_id`, `date`),
	FOREIGN KEY (`rotation_id`) REFERENCES `rotations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`template_id`) REFERENCES `shift_templates`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `rotations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`anchor_date` text NOT NULL,
	`pattern` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text,
	`active` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `scheduled_reminders` (
	`id` text PRIMARY KEY NOT NULL,
	`shift_key` text NOT NULL,
	`offset_minutes` integer NOT NULL,
	`notification_id` text NOT NULL,
	`fire_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `scheduled_reminders_shift_key_offset_minutes_idx` ON `scheduled_reminders` (`shift_key`,`offset_minutes`);--> statement-breakpoint
CREATE INDEX `scheduled_reminders_fire_at_idx` ON `scheduled_reminders` (`fire_at`);--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`reminders_enabled` integer NOT NULL,
	`default_minutes_before` text NOT NULL,
	`theme_mode` text NOT NULL,
	`week_start` integer NOT NULL,
	`time_format` text NOT NULL,
	CONSTRAINT "settings_id_check" CHECK("settings"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE `shift_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`icon` text NOT NULL,
	`color` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`break_minutes` integer NOT NULL,
	`hourly_rate` real,
	`is_off` integer NOT NULL,
	`reminder_override` text,
	`archived_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shifts` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`template_id` text,
	`name` text NOT NULL,
	`icon` text NOT NULL,
	`color` text NOT NULL,
	`is_off` integer NOT NULL,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL,
	`break_minutes` integer NOT NULL,
	`notes` text NOT NULL,
	`source` text NOT NULL,
	`rotation_id` text,
	`reminder_override` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`template_id`) REFERENCES `shift_templates`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`rotation_id`) REFERENCES `rotations`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `shifts_date_idx` ON `shifts` (`date`);--> statement-breakpoint
CREATE INDEX `shifts_starts_at_idx` ON `shifts` (`starts_at`);