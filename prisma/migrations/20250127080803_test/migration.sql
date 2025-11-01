-- AlterTable
ALTER TABLE `Appointment` MODIFY `status` ENUM('scheduled', 'approved', 'canceled', 'completed') NOT NULL DEFAULT 'scheduled';

-- AlterTable
ALTER TABLE `Patient` ADD COLUMN `status` ENUM('active', 'scheduled', 'followeup') NOT NULL DEFAULT 'active';
