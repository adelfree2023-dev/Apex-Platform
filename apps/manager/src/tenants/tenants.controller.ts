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
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() dto: CreateTenantDto) {
        return this.tenantsService.create(dto);
    }
    @Get()
    async findAll() {
        return this.tenantsService.findAll();
    }
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.tenantsService.findById(id);
    }
    @Get('slug/:slug')
    async findBySlug(@Param('slug') slug: string) {
        return this.tenantsService.findBySlug(slug);
    }
    @Patch(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
        return this.tenantsService.update(id, dto);
    }
    @Patch(':id/suspend')
    async suspend(@Param('id') id: string) {
        return this.tenantsService.suspend(id);
    }
    @Patch(':id/reactivate')
    async reactivate(@Param('id') id: string) {
        return this.tenantsService.reactivate(id);
    }
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async delete(@Param('id') id: string) {
        await this.tenantsService.delete(id);
    }
    /**
     * Seed realistic products
     * POST /api/tenants/slug/:slug/seed
     */
    @Post('slug/:slug/seed')
    @HttpCode(HttpStatus.OK)
    async seed(@Param('slug') slug: string) {
        return this.tenantsService.seedProducts(slug);
    }
}
