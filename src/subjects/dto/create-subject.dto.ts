import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSubjectDto {
    @ApiProperty({ example: 'Mathematics' })
    @IsString()
    @IsNotEmpty()
    name!: string;

    @ApiProperty({ required: false, example: 'MATH' })
    @IsString()
    @IsOptional()
    code?: string;
}
