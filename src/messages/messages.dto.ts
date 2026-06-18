import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMessageDto {
    @ApiProperty({ required: false }) @IsString() @IsOptional() from?: string;
    @ApiProperty() @IsString() @IsNotEmpty() to!: string;
    @ApiProperty() @IsString() @IsNotEmpty() subject!: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() body?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() sentAt?: string;
}

export class UpdateMessageDto extends PartialType(CreateMessageDto) {}
