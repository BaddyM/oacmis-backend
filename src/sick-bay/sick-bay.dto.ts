import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

export const SICK_BAY_STATUSES = ['in-sickbay', 'returned-to-class', 'sent-home', 'referred'] as const;

export class CreateSickBayVisitDto {
    @ApiProperty({ required: false }) @IsString() @IsOptional() studentId?: string;
    @ApiProperty() @IsString() @IsNotEmpty() studentName!: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() className?: string;
    @ApiProperty() @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'visitDate must be YYYY-MM-DD' }) visitDate!: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() timeIn?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() timeOut?: string;
    @ApiProperty() @IsString() @IsNotEmpty() complaint!: string;
    @ApiProperty({ required: false }) @IsNumber() @Min(30) @Max(45) @IsOptional() temperature?: number;
    @ApiProperty({ required: false }) @IsString() @IsOptional() diagnosis?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() treatment?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() medication?: string;
    @ApiProperty({ enum: SICK_BAY_STATUSES, required: false }) @IsIn(SICK_BAY_STATUSES) @IsOptional() status?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() referredTo?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() attendedBy?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() notes?: string;
}

export class UpdateSickBayVisitDto extends PartialType(CreateSickBayVisitDto) {}

export class CreateSickBayVisitRequestDto extends CreateSickBayVisitDto {
    /** Text the parent as soon as the visit is saved. */
    @ApiProperty({ required: false }) @IsBoolean() @IsOptional() notifyParent?: boolean;
}

export class NotifyParentDto {
    /** Overrides the standard message. */
    @ApiProperty({ required: false }) @IsString() @IsOptional() @MaxLength(918) message?: string;
}
