import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { AppSettingsService } from './app-settings.service';
import { UpsertSettingDto } from './app-settings.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('app-settings')
export class AppSettingsController {
    constructor(private readonly service: AppSettingsService) { }

    @Get(':key')
    @ApiParam({ name: 'key' })
    get(@Param('key') key: string) {
        return this.service.get(key);
    }

    @Put(':key')
    @ApiParam({ name: 'key' })
    set(@Param('key') key: string, @Body() dto: UpsertSettingDto) {
        return this.service.set(key, dto.value);
    }
}
