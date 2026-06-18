import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsEmail,
    IsNotEmpty,
    IsObject,
    IsOptional,
    IsString,
    ValidateIf,
    ValidateNested,
} from 'class-validator';

export class SocialsDto {
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    website?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    linkedin?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    twitter?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    facebook?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    instagram?: string;
}

export class CreateStaffDto {
    @ApiProperty({ example: 'Sarah' })
    @IsString()
    @IsNotEmpty()
    firstName!: string;

    @ApiProperty({ example: 'Johnson' })
    @IsString()
    @IsNotEmpty()
    lastName!: string;

    @ApiProperty({ example: 'Teacher' })
    @IsString()
    @IsNotEmpty()
    role!: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    address?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    phone?: string;

    @ApiProperty({ required: false })
    @ValidateIf((o) => o.email !== undefined && o.email !== '')
    @IsEmail()
    @IsOptional()
    email?: string;

    @ApiProperty({ required: false, description: 'Kept as a string to match the frontend form' })
    @IsString()
    @IsOptional()
    salary?: string;

    @ApiProperty({ required: false, default: true })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    profileImage?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    banner?: string;

    @ApiProperty({ required: false, type: SocialsDto })
    @IsObject()
    @IsOptional()
    @ValidateNested()
    @Type(() => SocialsDto)
    socials?: SocialsDto;
}
