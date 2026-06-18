import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsArray,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';

export class MarkEntryDto {
    @ApiProperty() @IsString() @IsNotEmpty() studentId!: string;
    @ApiProperty() @IsNumber() score!: number;
}

export class BulkUpsertMarksDto {
    @ApiProperty({ example: 'primary' }) @IsString() @IsNotEmpty() level!: string;
    @ApiProperty({ example: 'Term 1' }) @IsString() @IsNotEmpty() term!: string;
    @ApiProperty() @IsString() @IsNotEmpty() className!: string;
    @ApiProperty() @IsString() @IsNotEmpty() subject!: string;
    @ApiProperty({ required: false, default: '' }) @IsString() @IsOptional() topic?: string;
    @ApiProperty({ type: [MarkEntryDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MarkEntryDto)
    marks!: MarkEntryDto[];
}
