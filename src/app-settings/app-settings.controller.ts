import { Body, Controller, ForbiddenException, Get, Param, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { PageKey, resolveAllowedPages } from 'src/auth/page-access';
import { AppSettingsService } from './app-settings.service';
import { UpsertSettingDto } from './app-settings.dto';

/**
 * Settings that belong to one page rather than to the whole school. Anyone who
 * holds that page may save them — e.g. a Director of Studies with Reports can
 * edit the report card template. Every other key (school profile, academic
 * session, security…) stays admin-only.
 */
const PAGE_OWNED_SETTINGS: Record<string, PageKey[]> = {
    report_template: ['reports'],
    termly_report_template: ['reports'],
    termly_report_data: ['reports'],
    nursery_report_template: ['reports'],
    nursery_report_remarks: ['reports'],
    grading_scale: ['grades', 'settings'],
    certificate_design: ['certificates'],
    id_card_design: ['student-id'],
};

@ApiBearerAuth()
@UseGuards(AuthGuard)
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

    @Put(':key')
    @ApiParam({ name: 'key' })
    set(
        @Param('key') key: string,
        @Body() dto: UpsertSettingDto,
        @Req() req: { user?: { role?: string; permissions?: unknown } },
    ) {
        const user = req.user;
        const pages = PAGE_OWNED_SETTINGS[key];
        const allowed =
            user?.role === 'admin' ||
            (!!pages && pages.some((p) => resolveAllowedPages(user?.role, user?.permissions).has(p)));
        if (!allowed) throw new ForbiddenException('You do not have permission to change this setting');
        return this.service.set(key, dto.value);
    }
}
