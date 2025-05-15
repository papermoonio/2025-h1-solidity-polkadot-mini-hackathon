PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_nft_game_nft_images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`token_id` integer NOT NULL,
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
INSERT INTO `__new_nft_game_nft_images`("id", "token_id", "owner_address", "image_data", "name", "description", "rarity", "power", "created_at", "updated_at") SELECT "id", "token_id", "owner_address", "image_data", "name", "description", "rarity", "power", "created_at", "updated_at" FROM `nft_game_nft_images`;--> statement-breakpoint
DROP TABLE `nft_game_nft_images`;--> statement-breakpoint
ALTER TABLE `__new_nft_game_nft_images` RENAME TO `nft_game_nft_images`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `nft_game_nft_images_token_id_unique` ON `nft_game_nft_images` (`token_id`);