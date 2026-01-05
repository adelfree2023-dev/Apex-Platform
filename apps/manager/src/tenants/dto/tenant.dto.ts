import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, IsEnum, Matches } from 'class-validator';
import { BusinessType } from '@prisma/client';

export class CreateTenantDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(100)
    name: string;

    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    @Matches(/^[a-z0-9-]+$/, {
        message: 'Slug must contain only lowercase letters, numbers, and hyphens',
    })
    slug?: string;

    @IsOptional()
    @IsString()
    @Matches(/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/, {
        message: 'Invalid domain format',
    })
    domain?: string;

    @IsOptional()
    @IsEnum(BusinessType)
    type?: BusinessType;
}

export class UpdateTenantDto {
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    name?: string;

    @IsOptional()
    @IsString()
    @Matches(/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/, {
        message: 'Invalid domain format',
    })
    domain?: string;
}
