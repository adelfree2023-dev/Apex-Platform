import { Injectable, Logger, NotFoundException, OnModuleInit, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';
import { VendureService } from '../vendure/vendure.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { Prisma } from '@prisma/client';

@Injectable()
export class TenantsService implements OnModuleInit {
    private readonly logger = new Logger(TenantsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly vendureService: VendureService,
    ) { }

    async onModuleInit() {
        this.logger.log('🚀 Tenants Module Initialized');
    }

    async create(createTenantDto: CreateTenantDto) {
        let slug = createTenantDto.slug;
        if (!slug) {
            slug = this.generateSlug(createTenantDto.name);
        }

        const { adminEmail, adminPassword, adminName, ...rest } = createTenantDto;

        // Check availability (Optimization, not atomic protection)
        const existingTenant = await this.prisma.tenant.findUnique({ where: { slug } });
        if (existingTenant) {
            throw new ConflictException(`Tenant with slug "${slug}" already exists`);
        }

        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        try {
            const result = await this.prisma.$transaction(async (prisma) => {
                const tenant = await prisma.tenant.create({
                    data: {
                        name: rest.name,
                        slug: slug as string,
                        domain: rest.domain,
                        type: rest.type,
                        status: 'ACTIVE',
                    },
                });

                await prisma.user.create({
                    data: {
                        email: adminEmail,
                        passwordHash: hashedPassword,
                        name: adminName,
                        role: 'TENANT_ADMIN', // Ensure this maps to your actual Enum
                        tenants: {
                            create: {
                                tenantId: tenant.id,
                                role: 'TENANT_ADMIN',
                            }
                        }
                    },
                });

                try {
                    const channel = await this.vendureService.createChannel(slug as string, rest.name);
                    return await prisma.tenant.update({
                        where: { id: tenant.id },
                        data: {
                            vendureChannelId: channel.id,
                            vendureChannelToken: channel.token
                        },
                    });

                } catch (error: any) {
                    this.logger.error(`Failed to create Vendure channel for ${slug}`, error);
                    // This will trigger transaction rollback
                    throw new BadRequestException(`Failed to setup commerce engine: ${error.message}`);
                }
            });

            this.logger.log(`✅ Tenant created successfully: ${result.name} (${result.slug})`);
            return result;
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ConflictException('Tenant with this name or slug already exists');
                }
            }
            throw error;
        }
    }

    async findAll() {
        return this.prisma.tenant.findMany();
    }

    async findById(id: string) {
        return this.prisma.tenant.findUnique({ where: { id } });
    }

    async findBySlug(slug: string) {
        const tenant = await this.prisma.tenant.findUnique({ where: { slug } });
        if (!tenant) throw new NotFoundException(`Tenant not found: ${slug}`);
        return tenant;
    }

    async update(id: string, updateTenantDto: UpdateTenantDto) {
        return this.prisma.tenant.update({
            where: { id },
            data: updateTenantDto,
        });
    }

    async suspend(id: string) {
        return this.prisma.tenant.update({
            where: { id },
            data: { status: 'SUSPENDED' },
        });
    }

    async reactivate(id: string) {
        return this.prisma.tenant.update({
            where: { id },
            data: { status: 'ACTIVE' },
        });
    }


    async delete(id: string) {
        const tenant = await this.prisma.tenant.findUnique({ where: { id } });
        if (!tenant) throw new NotFoundException('Tenant not found');

        // 🔥 FIX: Delete channel from Vendure first (sync deletion)
        if (tenant.vendureChannelId) {
            try {
                await this.vendureService.deleteChannel(tenant.vendureChannelId);
                this.logger.log(`🗑️ Vendure channel deleted: ${tenant.vendureChannelId}`);
            } catch (error) {
                this.logger.error(`Failed to delete Vendure channel: ${tenant.vendureChannelId}`, error);
                // Continue with tenant deletion even if Vendure fails
            }
        }

        await this.prisma.tenant.delete({ where: { id: tenant.id } });
        this.logger.log(`🗑️ Tenant deleted: ${tenant.slug}`);
    }

    async seedProducts(slug: string): Promise<any> {
        const tenant = await this.findBySlug(slug);
        if (!tenant.vendureChannelToken) {
            throw new NotFoundException('Tenant has no Vendure channel');
        }

        this.logger.log(`🌱 Seeding products for tenant: ${tenant.slug} (Token: ${tenant.vendureChannelToken})`);

        const realProducts = [
            { name: "iPhone 15 Pro Max", price: 5199, description: "Titanium design, A17 Pro chip." },
            { name: "MacBook Air 15-inch", price: 6299, description: "Supercharged by M2." },
            { name: "Sony WH-1000XM5", price: 1480, description: "Industry-leading noise canceling." },
            { name: "Samsung Galaxy S24 Ultra", price: 5299, description: "Galaxy AI is here." },
            { name: "PlayStation 5 Console", price: 2499, description: "Experience lightning fast loading." },
            { name: "Nike Air Jordan 1", price: 800, description: "Iconic style, everyday comfort." },
        ];

        let seededCount = 0;

        for (let i = 0; i < 15; i++) {
            const product = realProducts[i % realProducts.length];
            const uniqueName = i >= realProducts.length ? `${product.name} ${i}` : product.name;
            const uniqueSlug = this.generateSlug(uniqueName) + '-' + Math.floor(Math.random() * 100000);

            // 1. Create Product
            const createProductMutation = `
                mutation CreateProduct($input: CreateProductInput!) {
                    createProduct(input: $input) { id name variants { id } }
                }
            `;

            try {
                const pData = await this.vendureService.executeGraphQL(createProductMutation, {
                    input: {
                        translations: [{ languageCode: 'en', name: uniqueName, slug: uniqueSlug, description: product.description }],
                        enabled: true,
                    }
                }, tenant.vendureChannelToken);

                if (!pData || !pData.createProduct) {
                    this.logger.error(`❌ Create failed for ${uniqueName}`);
                    continue;
                }

                const productId = pData.createProduct.id;
                let variantId = pData.createProduct.variants?.[0]?.id;

                // 2. If no variants, create one explicitly
                if (!variantId) {
                    this.logger.warn(`⚠️ No variants found for ${uniqueName}, creating manually...`);
                    const createVariantMutation = `
                        mutation CreateProductVariants($input: [CreateProductVariantInput!]!) {
                            createProductVariants(input: $input) { 
                                id 
                                price
                                priceWithTax
                            }
                        }
                    `;
                    const vData = await this.vendureService.executeGraphQL(createVariantMutation, {
                        input: [{
                            productId: productId,
                            sku: `SKU-${uniqueSlug}`,
                            price: product.price * 100,
                            stockOnHand: 100,
                            translations: [{ languageCode: 'en', name: uniqueName }]
                        }]
                    }, tenant.vendureChannelToken);

                    variantId = vData.createProductVariants?.[0]?.id;
                    const createdPrice = vData.createProductVariants?.[0]?.price;
                    this.logger.log(`💰 Created variant with price: ${createdPrice}`);
                } else {
                    // 3. Update existing variant price
                    const updateVariantMutation = `
                        mutation UpdateVariant($input: [UpdateProductVariantInput!]!) {
                            updateProductVariants(input: $input) { id }
                        }
                    `;
                    await this.vendureService.executeGraphQL(updateVariantMutation, {
                        input: [{
                            id: variantId,
                            price: product.price * 100,
                            sku: `SKU-${uniqueSlug}`
                        }]
                    }, tenant.vendureChannelToken);
                }

                if (variantId) {
                    this.logger.log(`✅ Seeded: ${uniqueName} (Variant ID: ${variantId})`);
                    seededCount++;
                } else {
                    this.logger.error(`❌ Failed to get variant ID for ${uniqueName}`);
                }

            } catch (e) {
                this.logger.error(`❌ EXCEPTION seeding ${uniqueName}:`, e);
            }
        }

        return { success: true, seeded: seededCount };
    }

    private generateSlug(name: string): string {
        return name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    }
}
