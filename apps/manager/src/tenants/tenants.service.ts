import { Injectable, Logger, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VendureService } from '../vendure/vendure.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';
import { Tenant, TenantStatus } from '@prisma/client';

@Injectable()
export class TenantsService {
    private readonly logger = new Logger(TenantsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly vendureService: VendureService,
    ) { }

    /**
     * Create a new tenant with Vendure channel integration
     * This is the CORE integration point
     */
    async create(dto: CreateTenantDto): Promise<{ tenant: Tenant; channel: any }> {
        // Generate slug from name if not provided
        const slug = dto.slug || this.generateSlug(dto.name);

        // Check if slug already exists
        const existing = await this.prisma.tenant.findUnique({ where: { slug } });
        if (existing) {
            throw new ConflictException(`Tenant with slug "${slug}" already exists`);
        }

        this.logger.log(`📦 Creating tenant: ${dto.name} (${slug})`);

        // Step 1: Create tenant in database (without Vendure info)
        let tenant = await this.prisma.tenant.create({
            data: {
                name: dto.name,
                slug,
                domain: dto.domain,
                type: dto.type || 'RETAIL',
                status: TenantStatus.TRIAL,
            },
        });

        this.logger.log(`✅ Tenant created in DB: ${tenant.id}`);

        // Step 2: Create Channel in Vendure
        try {
            const channel = await this.vendureService.createChannel(slug, dto.name);

            // Step 3: Update tenant with Vendure channel info
            tenant = await this.prisma.tenant.update({
                where: { id: tenant.id },
                data: {
                    vendureChannelId: channel.id,
                    vendureChannelToken: channel.token,
                },
            });

            this.logger.log(`🎉 INTEGRATION SUCCESS!`);
            this.logger.log(`   Tenant ID: ${tenant.id}`);
            this.logger.log(`   Channel ID: ${channel.id}`);

            return { tenant, channel };
        } catch (error) {
            // Rollback: delete tenant if Vendure fails
            this.logger.error('❌ Vendure integration failed, rolling back tenant creation');
            await this.prisma.tenant.delete({ where: { id: tenant.id } });
            throw new InternalServerErrorException(
                'Failed to create Vendure channel. Tenant creation rolled back.',
            );
        }
    }

    /**
     * Get all tenants
     */
    async findAll(): Promise<Tenant[]> {
        return this.prisma.tenant.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Get tenant by ID
     */
    async findById(id: string): Promise<Tenant> {
        const tenant = await this.prisma.tenant.findUnique({ where: { id } });
        if (!tenant) {
            throw new NotFoundException(`Tenant with ID "${id}" not found`);
        }
        return tenant;
    }

    /**
     * Get tenant by slug
     */
    async findBySlug(slug: string): Promise<Tenant> {
        const tenant = await this.prisma.tenant.findUnique({ where: { slug } });
        if (!tenant) {
            throw new NotFoundException(`Tenant with slug "${slug}" not found`);
        }
        return tenant;
    }

    /**
     * Update tenant
     */
    async update(id: string, dto: UpdateTenantDto): Promise<Tenant> {
        const tenant = await this.findById(id);

        return this.prisma.tenant.update({
            where: { id: tenant.id },
            data: dto,
        });
    }

    /**
     * Soft delete (suspend) tenant
     */
    async suspend(id: string): Promise<Tenant> {
        const tenant = await this.findById(id);

        return this.prisma.tenant.update({
            where: { id: tenant.id },
            data: { status: TenantStatus.SUSPENDED },
        });
    }

    /**
     * Reactivate tenant
     */
    async reactivate(id: string): Promise<Tenant> {
        const tenant = await this.findById(id);

        return this.prisma.tenant.update({
            where: { id: tenant.id },
            data: { status: TenantStatus.ACTIVE },
        });
    }

    /**
     * Hard delete tenant (use with caution!)
     */
    async delete(id: string): Promise<void> {
        const tenant = await this.findById(id);

        // Delete Vendure channel if exists
        if (tenant.vendureChannelId) {
            await this.vendureService.deleteChannel(tenant.vendureChannelId);
        }

        // Delete tenant from database
        await this.prisma.tenant.delete({ where: { id: tenant.id } });

        this.logger.log(`🗑️ Tenant deleted: ${tenant.slug}`);
    }

    /**
     * Generate URL-friendly slug from name
     */
    private generateSlug(name: string): string {
        return name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '') // Remove special chars
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-'); // Remove consecutive hyphens
    }
}
