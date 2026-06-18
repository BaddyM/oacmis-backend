import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateClassDto {
    @ApiProperty({ example: 'Grade 10 East' })
    @IsString()
    @IsNotEmpty()
    name!: string;

    @ApiProperty({ required: false, example: 'Sarah Johnson' })
    @IsString()
    @IsOptional()
    teacher?: string;

    @ApiProperty({ required: false, default: 0 })
    @IsInt()
    @Min(0)
    @IsOptional()
    students?: number;

    @ApiProperty({ required: false, example: 'Mon/Wed 9:00 - 10:30' })
    @IsString()
    @IsOptional()
    schedule?: string;

    @ApiProperty({ required: false, example: 'Room 204' })
    @IsString()
    @IsOptional()
    room?: string;

    @ApiProperty({ required: false, description: 'Tailwind colour class, e.g. bg-blue-500' })
    @IsString()
    @IsOptional()
    color?: string;
}
