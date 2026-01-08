import { IsEnum } from 'class-validator';
import { PlanType } from '@prisma/client';

export class UpdatePlanDto {
    @IsEnum(PlanType)
    plan: PlanType;
}
