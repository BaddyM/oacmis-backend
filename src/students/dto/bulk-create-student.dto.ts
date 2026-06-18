import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateStudentDto } from './create-student.dto';

export class BulkCreateStudentDto {
    @ApiProperty({ type: [CreateStudentDto] })
    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => CreateStudentDto)
    students!: CreateStudentDto[];
}
