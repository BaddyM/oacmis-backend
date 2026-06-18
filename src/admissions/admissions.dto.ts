import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAdmissionDto {
    @ApiProperty() @IsString() @IsNotEmpty() applicantName!: string;
    @ApiProperty() @IsString() @IsNotEmpty() dob!: string;
    @ApiProperty() @IsString() @IsNotEmpty() gradeApplied!: string;
    @ApiProperty() @IsString() @IsNotEmpty() parentName!: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() parentEmail?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() parentPhone?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() priorSchool?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() documentUrl?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() status?: string;
}

export class UpdateAdmissionDto extends PartialType(CreateAdmissionDto) {}
