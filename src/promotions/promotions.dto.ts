import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    ArrayNotEmpty,
    IsArray,
    IsIn,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';

// What happens to a pupil at the end of the year.
//  promoted    → moves up to `toClass`
//  repeated    → stays in `fromClass` for another year
//  transferred → left the school; record kept, roster cleared
//  graduated   → finished the top class; becomes an Alumnus
export const PROMOTION_OUTCOMES = ['promoted', 'repeated', 'transferred', 'graduated'] as const;
export type PromotionOutcome = (typeof PROMOTION_OUTCOMES)[number];

export class PromotionEntryDto {
    @ApiProperty() @IsString() @IsNotEmpty() studentId!: string;
    @ApiProperty({ enum: PROMOTION_OUTCOMES })
    @IsIn(PROMOTION_OUTCOMES as unknown as string[])
    outcome!: PromotionOutcome;
    @ApiProperty({ required: false }) @IsString() @IsOptional() note?: string;
}

export class RunPromotionDto {
    @ApiProperty() @IsString() @IsNotEmpty() fromClass!: string;
    // Required for anyone marked `promoted`; ignored for the other outcomes.
    @ApiProperty({ required: false }) @IsString() @IsOptional() toClass?: string;
    @ApiProperty() @IsInt() fromYear!: number;
    @ApiProperty() @IsInt() toYear!: number;
    @ApiProperty({ type: [PromotionEntryDto] })
    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => PromotionEntryDto)
    entries!: PromotionEntryDto[];
}
