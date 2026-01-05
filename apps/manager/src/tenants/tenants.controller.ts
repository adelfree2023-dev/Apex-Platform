import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';

@Controller('tenants')
export class TenantsController {
    constructor(private readonly tenantsService: TenantsService) { }

    /**
     * Create a new tenant
     * POST /api/tenants
     * 
     * This is the NUCLEAR TEST endpoint:
     * - Creates tenant in SaaS DB
     * - Creates channel in Vendure
     * - Links them together
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() dto: CreateTenantDto) {
        return this.tenantsService.create(dto);
    }

    /**
     * Get all tenants
     * GET /api/tenants
     */
    @Get()
    async findAll() {
        return this.tenantsService.findAll();
    }

    /**
     * Get tenant by ID
     * GET /api/tenants/:id
     */
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.tenantsService.findById(id);
    }

    /**
     * Get tenant by slug
     * GET /api/tenants/slug/:slug
     */
    @Get('slug/:slug')
    async findBySlug(@Param('slug') slug: string) {
        return this.tenantsService.findBySlug(slug);
    }

    /**
     * Update tenant
     * PATCH /api/tenants/:id
     */
    @Patch(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
        return this.tenantsService.update(id, dto);
    }

    /**
     * Suspend tenant
     * PATCH /api/tenants/:id/suspend
     */
    @Patch(':id/suspend')
    async suspend(@Param('id') id: string) {
        return this.tenantsService.suspend(id);
    }

    /**
     * Reactivate tenant
     * PATCH /api/tenants/:id/reactivate
     */
    @Patch(':id/reactivate')
    async reactivate(@Param('id') id: string) {
        return this.tenantsService.reactivate(id);
    }

    /**
     * Delete tenant (DANGER!)
     * DELETE /api/tenants/:id
     */
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async delete(@Param('id') id: string) {
        await this.tenantsService.delete(id);
    }
}
