import { IsEnum, IsString } from 'class-validator';
import { PlanType } from '@prisma/client';

export class CreateSubscriptionDto {
    @IsString()
    tenantId: string;

    @IsEnum(PlanType)
    plan: PlanType;
}
