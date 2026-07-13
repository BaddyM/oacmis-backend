import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthGuard } from 'src/auth/auth.guard';
import { GeneratePdfDto } from './pdf.dto';
import { PdfService } from './pdf.service';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('pdf')
export class PdfController {
    constructor(private readonly pdf: PdfService) { }

    // Accepts a full HTML document and streams back a single downloadable PDF.
    @Post()
    async generate(@Body() dto: GeneratePdfDto, @Res() res: Response) {
        const buffer = await this.pdf.htmlToPdf(dto.html);
        const safe = (dto.filename || 'report').replace(/[^a-z0-9._-]+/gi, '_').slice(0, 120);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${safe}.pdf"`,
            'Content-Length': String(buffer.length),
        });
        res.end(buffer);
    }
}
