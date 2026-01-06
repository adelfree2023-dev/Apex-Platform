import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Find user by ID (without password)
     */
    async findById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                emailVerified: true,
                lastLoginAt: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    /**
     * Find user by email
     */
    async findByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    /**
     * Update user profile
     */
    async updateProfile(id: string, data: { name?: string }) {
        const user = await this.prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                emailVerified: true,
                updatedAt: true,
            },
        });

        return user;
    }

    /**
     * Get all users (admin only)
     */
    async findAll() {
        return this.prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                emailVerified: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
}
