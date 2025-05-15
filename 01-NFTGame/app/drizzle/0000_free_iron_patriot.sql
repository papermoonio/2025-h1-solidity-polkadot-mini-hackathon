CREATE TABLE `nft_game_nft_images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`token_id` text NOT NULL,
	`owner_address` text NOT NULL,
	`image_data` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`rarity` integer NOT NULL,
	`power` integer NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `nft_game_nft_images_token_id_unique` ON `nft_game_nft_images` (`token_id`);