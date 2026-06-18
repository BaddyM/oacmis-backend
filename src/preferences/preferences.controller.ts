import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthGuard } from 'src/auth/auth.guard';
import { PreferencesService } from './preferences.service';
import { UpsertPreferencesDto } from './preferences.dto';

// AuthGuard attaches { id, role } to request.user.
interface AuthedRequest extends Request {
    user: { id: string; role: string };
}

@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('me/preferences')
export class PreferencesController {
    constructor(private readonly service: PreferencesService) { }

    @Get()
    get(@Req() req: AuthedRequest) {
        return this.service.get(req.user.id);
    }

    @Put()
    set(@Req() req: AuthedRequest, @Body() dto: UpsertPreferencesDto) {
        return this.service.set(req.user.id, dto.value);
    }
}
