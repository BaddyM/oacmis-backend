import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export const SMS_AUDIENCES = [
    'All Parents',
    'Class Parents',
    'All Students',
    'All Teachers',
    'Custom Numbers',
] as const;

export type SmsAudience = (typeof SMS_AUDIENCES)[number];

// Six concatenated 153-character parts — beyond that most handsets and the
// gateway start splitting unpredictably, and each part is billed.
export const SMS_MAX_LENGTH = 918;

export class SendSmsDto {
    @ApiProperty({ enum: SMS_AUDIENCES }) @IsIn(SMS_AUDIENCES) audience!: SmsAudience;
    @ApiProperty({ required: false }) @IsString() @IsOptional() className?: string;
    /** Comma/space/newline separated, for the "Custom Numbers" audience. */
    @ApiProperty({ required: false }) @IsString() @IsOptional() numbers?: string;
    @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(200) subject!: string;
    @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(SMS_MAX_LENGTH) message!: string;
}
