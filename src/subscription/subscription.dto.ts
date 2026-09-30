import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsISO8601, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export const SUBSCRIPTION_PLANS = ['daily', 'weekly', 'annual'] as const;
export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number] | 'trial';

export class GrantSubscriptionDto {
    @ApiProperty({ enum: SUBSCRIPTION_PLANS }) @IsIn(SUBSCRIPTION_PLANS) plan!: (typeof SUBSCRIPTION_PLANS)[number];
    /** How many days / weeks / years. */
    @ApiProperty({ default: 1 }) @IsInt() @Min(1) @Max(366) @IsOptional() quantity?: number;
    /**
     * When the period begins. Omitted, it starts when the current paid time
     * runs out (or now, if nothing is running) so paying early loses nothing.
     */
    @ApiProperty({ required: false }) @IsISO8601() @IsOptional() startsAt?: string;
    @ApiProperty({ required: false }) @IsNumber() @Min(0) @IsOptional() amount?: number;
    @ApiProperty({ required: false }) @IsString() @MaxLength(500) @IsOptional() notes?: string;
}

export class UpdateSubscriptionDto {
    @ApiProperty({ enum: SUBSCRIPTION_PLANS, required: false }) @IsIn(SUBSCRIPTION_PLANS) @IsOptional() plan?: (typeof SUBSCRIPTION_PLANS)[number];
    @ApiProperty({ required: false }) @IsInt() @Min(1) @Max(366) @IsOptional() quantity?: number;
    @ApiProperty({ required: false }) @IsISO8601() @IsOptional() startsAt?: string;
    /** Set directly to extend or shorten a period without changing its plan. */
    @ApiProperty({ required: false }) @IsISO8601() @IsOptional() endsAt?: string;
    @ApiProperty({ required: false }) @IsNumber() @Min(0) @IsOptional() amount?: number;
    @ApiProperty({ required: false }) @IsString() @MaxLength(500) @IsOptional() notes?: string;
}

export class RevokeSubscriptionDto {
    @ApiProperty({ required: false }) @IsString() @MaxLength(500) @IsOptional() reason?: string;
}
