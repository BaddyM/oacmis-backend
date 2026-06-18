import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

export class CreateStudentDto {
    @ApiProperty({ example: 'ADM-1001' })
    @IsString()
    @IsNotEmpty()
    admissionNo!: string;

    @ApiProperty({ example: 'Alice' })
    @IsString()
    @IsNotEmpty()
    firstName!: string;

    @ApiProperty({ example: 'Johnson' })
    @IsString()
    @IsNotEmpty()
    lastName!: string;

    @ApiProperty({ example: 'Grade 10' })
    @IsString()
    @IsNotEmpty()
    className!: string;

    @ApiProperty({ example: 'East' })
    @IsString()
    @IsNotEmpty()
    stream!: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    location?: string;

    @ApiProperty({ required: false })
    @ValidateIf((o) => o.email !== undefined && o.email !== '')
    @IsEmail()
    @IsOptional()
    email?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    house?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    phone?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    gender?: string;

    @ApiProperty({ required: false, example: '2009-05-10' })
    @IsString()
    @IsOptional()
    dateOfBirth?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    passportPhoto?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    parentName?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    parentPhone?: string;

    @ApiProperty({ required: false })
    @ValidateIf((o) => o.parentEmail !== undefined && o.parentEmail !== '')
    @IsEmail()
    @IsOptional()
    parentEmail?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    parentRelation?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    parentAddress?: string;
}
