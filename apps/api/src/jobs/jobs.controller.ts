import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthUser, RoleName } from '@aiwms/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateJobDto, UpdateJobDto } from './dto/job.dto';
import { JobsService } from './jobs.service';

@Controller('jobs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class JobsController {
  constructor(private jobsService: JobsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.jobsService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.jobsService.findOne(id, user);
  }

  @Post()
  @Roles(RoleName.ADMIN, RoleName.OWNER)
  create(@Body() dto: CreateJobDto, @CurrentUser() user: AuthUser) {
    return this.jobsService.create(dto, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateJobDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.jobsService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(RoleName.ADMIN, RoleName.OWNER)
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.jobsService.remove(id, user);
  }
}
