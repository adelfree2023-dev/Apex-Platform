import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { TenantEmailService } from './tenant-email.service';
import { TenantEmailController, InternalEmailController } from './tenant-email.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [TenantEmailController, InternalEmailController],
    providers: [EmailService, TenantEmailService],
    exports: [EmailService, TenantEmailService],
})
export class EmailModule { }

