import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateHostelRoomDto {
    @ApiProperty() @IsString() @IsNotEmpty() hostelName!: string;
    @ApiProperty() @IsString() @IsNotEmpty() roomNumber!: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() type?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() gender?: string;
    @ApiProperty({ default: 0 }) @IsInt() @Min(0) @IsOptional() capacity?: number;
    @ApiProperty({ default: 0 }) @IsInt() @Min(0) @IsOptional() occupied?: number;
    @ApiProperty({ required: false }) @IsString() @IsOptional() warden?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() status?: string;
    @ApiProperty({ default: 0 }) @IsNumber() @Min(0) @IsOptional() monthlyFee?: number;
}

export class UpdateHostelRoomDto extends PartialType(CreateHostelRoomDto) {}
