import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpsertAttendanceDto {
    @ApiProperty() @IsString() @IsNotEmpty() date!: string;
    @ApiProperty() @IsString() @IsNotEmpty() className!: string;
    @ApiProperty() @IsString() @IsNotEmpty() studentId!: string;
    @ApiProperty({ example: 'present' }) @IsString() @IsNotEmpty() status!: string;
}
