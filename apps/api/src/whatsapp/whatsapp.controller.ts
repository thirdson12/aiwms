import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RenderWhatsappDto } from './dto/whatsapp.dto';
import { WhatsappService } from './whatsapp.service';

@Controller('whatsapp')
@UseGuards(JwtAuthGuard)
export class WhatsappController {
  constructor(private whatsappService: WhatsappService) {}

  @Get('templates')
  findTemplates(@Query('locale') locale?: string) {
    return this.whatsappService.findTemplates(locale ?? 'tr');
  }

  @Post('templates/:key/render')
  render(
    @Param('key') key: string,
    @Body() dto: RenderWhatsappDto,
    @Query('locale') locale?: string,
  ) {
    return this.whatsappService.renderTemplate(key, dto, locale ?? 'tr');
  }
}
