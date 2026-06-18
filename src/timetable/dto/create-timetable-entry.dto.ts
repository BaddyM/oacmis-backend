import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export const DAYS_OF_WEEK = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
] as const;

export class CreateTimetableEntryDto {
    @ApiProperty({ example: 'Grade 10 East' })
    @IsString()
    @IsNotEmpty()
    className!: string;

    @ApiProperty({ enum: DAYS_OF_WEEK, example: 'Monday' })
    @IsIn(DAYS_OF_WEEK as unknown as string[])
    day!: string;

    @ApiProperty({ example: '08:00' })
    @IsString()
    @IsNotEmpty()
    startTime!: string;

    @ApiProperty({ example: '09:00' })
    @IsString()
    @IsNotEmpty()
    endTime!: string;

    @ApiProperty({ example: 'Mathematics' })
    @IsString()
    @IsNotEmpty()
    subject!: string;

    @ApiProperty({ required: false, example: 'Sarah Johnson' })
    @IsString()
    @IsOptional()
    teacher?: string;

    @ApiProperty({ required: false, example: 'Room 204' })
    @IsString()
    @IsOptional()
    room?: string;
}
