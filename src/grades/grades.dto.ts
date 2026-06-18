import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateGradeRecordDto {
    @ApiProperty() @IsString() @IsNotEmpty() student!: string;
    @ApiProperty() @IsString() @IsNotEmpty() className!: string;
    @ApiProperty() @IsString() @IsNotEmpty() subject!: string;
    @ApiProperty({ default: 0 }) @IsNumber() @IsOptional() midterm?: number;
    @ApiProperty({ default: 0 }) @IsNumber() @IsOptional() final?: number;
    @ApiProperty({ required: false }) @IsString() @IsOptional() overall?: string;
    @ApiProperty({ default: 0 }) @IsNumber() @IsOptional() gpa?: number;
}

export class UpdateGradeRecordDto extends PartialType(CreateGradeRecordDto) {}
