-- CreateTable
CREATE TABLE `organizations` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `legal_name` TEXT NULL,
    `email` VARCHAR(255) NOT NULL,
    `email_verified` BOOLEAN NOT NULL,
    `hash` TEXT NOT NULL,
    `password` TEXT NOT NULL,
    `credits` INTEGER NOT NULL,
    `logo` TEXT NULL,
    `pricing` FLOAT NOT NULL,
    `currency` VARCHAR(255) NOT NULL,
    `plan` VARCHAR(255) NOT NULL,
    `verified` INTEGER NOT NULL DEFAULT 0,
    `website` VARCHAR(255) NULL,
    `linkedin` VARCHAR(255) NULL,
    `date_joined` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_login` DATETIME(3) NOT NULL,
    `tax_id` VARCHAR(255) NULL,
    `country` VARCHAR(255) NULL,
    `state` VARCHAR(255) NULL,
    `user_ip` VARCHAR(191) NULL,
    `user_agent` VARCHAR(191) NULL,
    `geolocation` JSON NULL,
    `whitelabel` JSON NULL,

    UNIQUE INDEX `organizations_id_key`(`id`),
    UNIQUE INDEX `organizations_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `billings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `amount` DOUBLE NOT NULL,
    `credits` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `org_id` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `currency` VARCHAR(191) NOT NULL,
    `discount` DOUBLE NOT NULL,
    `tax_amount` DOUBLE NOT NULL,
    `order_id` VARCHAR(191) NOT NULL,
    `payment_id` VARCHAR(191) NOT NULL,
    `signature` VARCHAR(191) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `name` VARCHAR(255) NOT NULL,
    `legal_name` TEXT NULL,
    `tax_id` VARCHAR(255) NULL,
    `country` VARCHAR(255) NULL,
    `state` VARCHAR(255) NULL,

    UNIQUE INDEX `billings_id_key`(`id`),
    INDEX `billings_org_id_fkey`(`org_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `groups` (
    `id` VARCHAR(191) NOT NULL,
    `org_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `template` VARCHAR(191) NOT NULL,
    `custom_email` BOOLEAN NOT NULL,
    `email_content` VARCHAR(191) NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `description` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `total_credentials` INTEGER NOT NULL,

    UNIQUE INDEX `groups_id_key`(`id`),
    INDEX `groups_org_id_fkey`(`org_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `credentials` (
    `id` VARCHAR(191) NOT NULL,
    `org_id` VARCHAR(255) NOT NULL,
    `group_id` VARCHAR(191) NOT NULL,
    `recipient_email` VARCHAR(191) NOT NULL,
    `recipient_name` VARCHAR(191) NOT NULL,
    `extra` JSON NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(0) NULL,
    `delivered_at` DATETIME(3) NULL,
    `opened_at` DATETIME(3) NULL,
    `clicked_at` DATETIME(3) NULL,
    `viewed_at` DATETIME(3) NULL,
    `shared_at` DATETIME(3) NULL,

    UNIQUE INDEX `credentials_id_key`(`id`),
    INDEX `credentials_group_id_fkey`(`group_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `events` (
    `id` VARCHAR(191) NOT NULL,
    `credential_id` VARCHAR(191) NOT NULL,
    `org_id` VARCHAR(191) NOT NULL,
    `group_id` VARCHAR(191) NOT NULL,
    `event_type` VARCHAR(191) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `user_ip` VARCHAR(191) NULL,
    `user_agent` VARCHAR(191) NULL,
    `referrer_url` VARCHAR(191) NULL,
    `geolocation` JSON NULL,

    UNIQUE INDEX `events_id_key`(`id`),
    INDEX `groups_org_id_fkey`(`org_id`),
    INDEX `credentials_group_id_fkey`(`group_id`),
    INDEX `events_credential_id_fkey`(`credential_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `passwordreset` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `passwordreset_id_key`(`id`),
    UNIQUE INDEX `passwordreset_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `whitelabel` (
    `org_id` VARCHAR(255) NOT NULL,
    `domain` VARCHAR(255) NOT NULL,

    UNIQUE INDEX `domain`(`domain`),
    PRIMARY KEY (`org_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `billings` ADD CONSTRAINT `billings_org_id_fkey` FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `groups` ADD CONSTRAINT `groups_org_id_fkey` FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `credentials` ADD CONSTRAINT `credentials_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `events` ADD CONSTRAINT `events_credential_id_fkey` FOREIGN KEY (`credential_id`) REFERENCES `credentials`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `events` ADD CONSTRAINT `events_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `events` ADD CONSTRAINT `events_org_id_fkey` FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

