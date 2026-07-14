import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

// The statuses a staff register supports. `leave` is distinct from `absent`:
// it means an approved absence, so it must not count against attendance rate.
export const STAFF_ATTENDANCE_STATUSES = ['present', 'absent', 'late', 'leave'] as const;
export type StaffAttendanceStatus = (typeof STAFF_ATTENDANCE_STATUSES)[number];

export class CreateStaffAttendanceDto {
    @ApiProperty() @IsString() @IsNotEmpty() staffId!: string;
    @ApiProperty() @IsString() @IsNotEmpty() staffName!: string;
    @ApiProperty({ description: 'ISO date, yyyy-mm-dd' }) @IsString() @IsNotEmpty() date!: string;
    @ApiProperty({ enum: STAFF_ATTENDANCE_STATUSES })
    @IsIn(STAFF_ATTENDANCE_STATUSES as unknown as string[])
    status!: StaffAttendanceStatus;
    @ApiProperty({ required: false }) @IsString() @IsOptional() note?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() term?: string;
    @ApiProperty({ required: false }) @IsInt() @IsOptional() year?: number;
}

export class UpdateStaffAttendanceDto extends PartialType(CreateStaffAttendanceDto) {}

// Body for POST /staff-attendance/mark — a whole day's register at once.
// @ValidateNested + @Type are required for the global ValidationPipe to
// validate each entry rather than waving the array through.
export class MarkStaffAttendanceDto {
    @ApiProperty({ type: [CreateStaffAttendanceDto] })
    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => CreateStaffAttendanceDto)
    entries!: CreateStaffAttendanceDto[];
}
