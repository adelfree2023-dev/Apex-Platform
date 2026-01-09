/**
 * ⚔️ APEX Encryption Service
 * CRITICAL SECURITY: AES-256-GCM encryption for sensitive data
 * 
 * Part of Operation Phoenix - Phase 4 REFACTOR
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService implements OnModuleInit {
    private readonly logger = new Logger(EncryptionService.name);
    private readonly algorithm = 'aes-256-gcm';
    private readonly keyLength = 32; // 256 bits
    private readonly ivLength = 16; // 128 bits
    private readonly authTagLength = 16; // 128 bits
    private encryptionKey: Buffer;

    onModuleInit() {
        const key = process.env.ENCRYPTION_KEY;

        if (!key) {
            this.logger.error('ENCRYPTION_KEY environment variable is not set!');
            throw new Error('ENCRYPTION_KEY is required for secure operation');
        }

        // Derive a 256-bit key from the provided key
        this.encryptionKey = crypto
            .createHash('sha256')
            .update(key)
            .digest();

        this.logger.log('Encryption service initialized');
    }

    /**
     * Encrypt sensitive data
     * @param plaintext - Data to encrypt
     * @returns Encrypted string in format: iv:authTag:ciphertext (all base64)
     */
    encrypt(plaintext: string): string {
        if (!plaintext) return '';

        const iv = crypto.randomBytes(this.ivLength);
        const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

        let encrypted = cipher.update(plaintext, 'utf8', 'base64');
        encrypted += cipher.final('base64');

        const authTag = cipher.getAuthTag();

        // Combine: iv:authTag:ciphertext
        return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
    }

    /**
     * Decrypt encrypted data
     * @param encryptedData - Data in format: iv:authTag:ciphertext
     * @returns Decrypted plaintext
     */
    decrypt(encryptedData: string): string {
        if (!encryptedData) return '';

        try {
            const parts = encryptedData.split(':');
            if (parts.length !== 3) {
                throw new Error('Invalid encrypted data format');
            }

            const [ivB64, authTagB64, ciphertext] = parts;
            const iv = Buffer.from(ivB64, 'base64');
            const authTag = Buffer.from(authTagB64, 'base64');

            const decipher = crypto.createDecipheriv(
                this.algorithm,
                this.encryptionKey,
                iv,
            );
            decipher.setAuthTag(authTag);

            let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (error) {
            this.logger.error('Decryption failed:', error);
            throw new Error('Failed to decrypt data');
        }
    }

    /**
     * Hash sensitive data (one-way, for comparison)
     * @param data - Data to hash
     * @returns SHA-256 hash
     */
    hash(data: string): string {
        return crypto
            .createHash('sha256')
            .update(data)
            .digest('hex');
    }

    /**
     * Generate a secure random token
     * @param length - Token length in bytes (default: 32)
     * @returns Random token as hex string
     */
    generateToken(length: number = 32): string {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Mask sensitive data for logging
     * @param data - Data to mask
     * @param visibleChars - Number of visible characters at start/end
     * @returns Masked string
     */
    mask(data: string, visibleChars: number = 4): string {
        if (!data || data.length <= visibleChars * 2) {
            return '****';
        }
        const start = data.slice(0, visibleChars);
        const end = data.slice(-visibleChars);
        return `${start}****${end}`;
    }
}
