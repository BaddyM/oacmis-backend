import {
    BadRequestException,
    Controller,
    Delete,
    Param,
    Post,
    Query,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, resolve, sep } from 'path';
import { mkdirSync, existsSync, unlinkSync } from 'fs';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const MAX_SIZE = 5 * 1024 * 1024;

// Sub-folders under /uploads that callers may target. Anything else falls
// back to "website" so a bad value can't write outside the uploads tree.
const ALLOWED_FOLDERS = ['website', 'users', 'reports'];
const resolveFolder = (folder?: string) =>
    folder && ALLOWED_FOLDERS.includes(folder) ? folder : 'website';

// Absolute path to the uploads tree; used to keep deletes confined to it.
const UPLOADS_ROOT = resolve('./uploads');

@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('upload')
export class UploadController {
    @Post(['image', 'image/:folder'])
    @ApiParam({ name: 'folder', required: false, enum: ALLOWED_FOLDERS })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: { file: { type: 'string', format: 'binary' } },
        },
    })
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: (req, _file, cb) => {
                    const dest = `./uploads/${resolveFolder(req.params.folder)}`;
                    mkdirSync(dest, { recursive: true });
                    cb(null, dest);
                },
                filename: (_req, file, cb) => {
                    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
                    cb(null, `${unique}${extname(file.originalname).toLowerCase()}`);
                },
            }),
            fileFilter: (_req, file, cb) => {
                if (!ALLOWED_MIME.includes(file.mimetype)) {
                    return cb(new BadRequestException('Only JPG, PNG or WEBP images allowed'), false);
                }
                cb(null, true);
            },
            limits: { fileSize: MAX_SIZE },
        }),
    )
    upload(@UploadedFile() file: Express.Multer.File, @Param('folder') folder?: string) {
        if (!file) throw new BadRequestException('No file uploaded');
        return {
            filename: file.filename,
            url: `/uploads/${resolveFolder(folder)}/${file.filename}`,
        };
    }

    // Removes a previously uploaded file. Accepts the public path the upload
    // endpoint returned, e.g. /uploads/reports/123.png. The resolved path is
    // checked to stay inside the uploads tree so it can't delete elsewhere.
    @Delete('image')
    @ApiQuery({ name: 'path', required: true, description: 'Public path, e.g. /uploads/reports/123.png' })
    deleteImage(@Query('path') path?: string) {
        if (!path) throw new BadRequestException('Missing path');
        const relative = path.replace(/^\/?uploads\/?/, '');
        const target = resolve(UPLOADS_ROOT, relative);
        if (target !== UPLOADS_ROOT && !target.startsWith(UPLOADS_ROOT + sep)) {
            throw new BadRequestException('Invalid path');
        }
        if (existsSync(target)) unlinkSync(target);
        return { deleted: true };
    }
}
