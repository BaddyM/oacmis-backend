import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min, ValidateIf } from 'class-validator';

// Amounts are whole shillings — UGX has no subunit in everyday use.

export class DepositDto {
    @ApiProperty() @IsString() @IsNotEmpty() studentId!: string;
    @ApiProperty() @IsInt() @Min(1) amount!: number;
    @ApiProperty({ required: false, example: 'Cash' }) @IsString() @IsOptional() method?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() @MaxLength(100) reference?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() @MaxLength(200) description?: string;
    /** Text the parent a receipt. */
    @ApiProperty({ required: false }) @IsBoolean() @IsOptional() notifyParent?: boolean;
}

export class SpendDto {
    @ApiProperty() @IsInt() @Min(1) amount!: number;
    @ApiProperty({ required: false }) @IsString() @IsOptional() @MaxLength(200) description?: string;
}

export class ReverseDto {
    @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(200) reason!: string;
}

export class UpdateWalletDto {
    /** null removes the limit. */
    @ApiProperty({ required: false, nullable: true })
    @ValidateIf((_, v) => v !== null) @IsInt() @Min(0) @IsOptional()
    dailyLimit?: number | null;

    /** Empty string or null unassigns the card. */
    @ApiProperty({ required: false, nullable: true })
    @ValidateIf((_, v) => v !== null) @IsString() @IsOptional() @MaxLength(100)
    rfidTag?: string | null;

    @ApiProperty({ required: false, enum: ['active', 'frozen'] })
    @IsIn(['active', 'frozen']) @IsOptional()
    status?: string;
}
