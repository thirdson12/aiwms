import {
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import type { Response } from 'express';
import { RoleName } from '@aiwms/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

const uploadsDir = join(process.cwd(), 'uploads');

function ensureUploadsDir() {
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }
}

@Controller('uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.ADMIN, RoleName.OWNER)
export class UploadsController {
  @Post('invoice')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          ensureUploadsDir();
          cb(null, uploadsDir);
        },
        filename: (_req, file, cb) => {
          cb(null, `${randomUUID()}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadInvoice(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return { fileName: null };
    }
    return { fileName: file.filename };
  }

  @Get('invoice/:fileName')
  getInvoice(@Param('fileName') fileName: string, @Res() res: Response) {
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '');
    const filePath = join(uploadsDir, safeName);
    if (!existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }
    return res.sendFile(filePath);
  }
}
