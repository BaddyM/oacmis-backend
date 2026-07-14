import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
    ArrayNotEmpty,
    IsArray,
    IsBoolean,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Min,
    ValidateNested,
} from 'class-validator';

export class FeeLineItemDto {
    @ApiProperty() @IsString() @IsNotEmpty() name!: string;
    @ApiProperty() @IsNumber() @Min(0) amount!: number;
}

export class CreateFeeStructureDto {
    @ApiProperty() @IsString() @IsNotEmpty() className!: string;
    @ApiProperty() @IsString() @IsNotEmpty() term!: string;
    @ApiProperty() @IsInt() year!: number;
    @ApiProperty({ type: [FeeLineItemDto] })
    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => FeeLineItemDto)
    items!: FeeLineItemDto[];
    @ApiProperty({ required: false }) @IsString() @IsOptional() dueDate?: string;
}

export class UpdateFeeStructureDto extends PartialType(CreateFeeStructureDto) {}

export class GenerateInvoicesDto {
    // Roll each pupil's unpaid balance from the previous term into this term as
    // its own "Arrears" line.
    @ApiProperty({ default: true }) @IsBoolean() @IsOptional() carryForward?: boolean;

    // Bill only these pupils. Omit (or send empty) to bill the whole class —
    // that stays the default, since billing everyone is the common case.
    @ApiProperty({ required: false, type: [String] })
    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    studentIds?: string[];
}
