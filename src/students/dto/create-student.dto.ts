import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

export class CreateStudentDto {
    // Admission number is optional — the server generates one when omitted.
    @ApiProperty({ required: false, example: 'ADM-1001' })
    @IsString()
    @IsOptional()
    admissionNo?: string;

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

    @ApiProperty({ example: 'Nursery' })
    @IsString()
    @IsNotEmpty()
    level!: string;

    @ApiProperty({ example: 'male' })
    @IsString()
    @IsNotEmpty()
    gender!: string;

    @ApiProperty({ required: false, example: 'East' })
    @IsString()
    @IsOptional()
    stream?: string;

    @ApiProperty({ required: false, description: "For secondary: 'O' or 'A'" })
    @IsString()
    @IsOptional()
    secondaryLevel?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    schoolPayNumber?: string;

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
