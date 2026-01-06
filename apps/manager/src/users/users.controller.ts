import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/auth.decorators';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    /**
     * GET /api/users/me
     * Get current user profile
     */
    @Get('me')
    async getProfile(@Request() req: any) {
        return this.usersService.findById(req.user.userId);
    }

    /**
     * PATCH /api/users/me
     * Update current user profile
     */
    @Patch('me')
    async updateProfile(
        @Request() req: any,
        @Body() body: { name?: string },
    ) {
        return this.usersService.updateProfile(req.user.userId, body);
    }

    /**
     * GET /api/users
     * Get all users (SUPERADMIN only)
     */
    @Get()
    @Roles('SUPER_ADMIN')
    async findAll() {
        return this.usersService.findAll();
    }
}
