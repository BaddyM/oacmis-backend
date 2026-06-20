import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { AppSettingsService } from './app-settings.service';
import { UpsertSettingDto } from './app-settings.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('app-settings')
export class AppSettingsController {
    constructor(private readonly service: AppSettingsService) { }

    // Reads stay open to any authenticated user (school profile, grading scale,
    // designs, etc. are needed across the app).
    @Get(':key')
    @ApiParam({ name: 'key' })
    get(@Param('key') key: string) {
        return this.service.get(key);
    }

    // Only admins can change shared settings.
    @Roles('admin')
    @Put(':key')
    @ApiParam({ name: 'key' })
    set(@Param('key') key: string, @Body() dto: UpsertSettingDto) {
        return this.service.set(key, dto.value);
    }
}
