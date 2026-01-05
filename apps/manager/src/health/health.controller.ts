import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
    constructor(private readonly prisma: PrismaService) { }

    @Get()
    async check() {
        const checks: Record<string, string> = {
            status: 'ok',
            timestamp: new Date().toISOString(),
        };

        // Check database
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            checks.database = 'connected';
        } catch {
            checks.database = 'disconnected';
            checks.status = 'degraded';
        }

        return checks;
    }
}
