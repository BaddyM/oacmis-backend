import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCertificateDto {
    @ApiProperty() @IsString() @IsNotEmpty() studentName!: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() studentId?: string;
    @ApiProperty() @IsString() @IsNotEmpty() certificateType!: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() issuedDate?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() description?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() signedBy?: string;
}

export class UpdateCertificateDto extends PartialType(CreateCertificateDto) {}
