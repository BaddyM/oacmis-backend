import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GeneratePdfDto {
    @ApiProperty({ description: 'Full HTML document to render into the PDF.' })
    @IsString()
    @IsNotEmpty()
    html!: string;

    @ApiProperty({ required: false, description: 'Download file name (without extension).' })
    @IsString()
    @IsOptional()
    filename?: string;
}
