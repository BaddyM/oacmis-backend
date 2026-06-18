import { ApiProperty } from '@nestjs/swagger';
import { IsDefined } from 'class-validator';

export class UpsertPreferencesDto {
    @ApiProperty({ description: 'Arbitrary JSON preferences blob for the current user' })
    @IsDefined()
    value!: any;
}
