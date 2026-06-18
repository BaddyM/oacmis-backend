import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateResourceDto {
    @ApiProperty() @IsString() @IsNotEmpty() title!: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() type?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() subject?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() fileUrl?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() className?: string;
}

export class UpdateResourceDto extends PartialType(CreateResourceDto) {}
