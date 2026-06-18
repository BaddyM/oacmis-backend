import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateEventDto {
    @ApiProperty() @IsString() @IsNotEmpty() title!: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() date?: string;
    @ApiProperty() @IsString() @IsNotEmpty() type!: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() audience?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() description?: string;
}

export class UpdateEventDto extends PartialType(CreateEventDto) {}
