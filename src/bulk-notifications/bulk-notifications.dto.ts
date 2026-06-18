import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateBulkNotificationDto {
    @ApiProperty() @IsString() @IsNotEmpty() title!: string;
    @ApiProperty() @IsString() @IsNotEmpty() message!: string;
    @ApiProperty() @IsString() @IsNotEmpty() type!: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() recipients?: string;
    @ApiProperty({ default: 0 }) @IsInt() @Min(0) @IsOptional() recipientCount?: number;
    @ApiProperty({ required: false }) @IsString() @IsOptional() sentDate?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() status?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() createdBy?: string;
}

export class UpdateBulkNotificationDto extends PartialType(CreateBulkNotificationDto) {}
