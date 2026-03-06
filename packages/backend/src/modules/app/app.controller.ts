import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AppService } from './app.service';
import { Roles } from '../../common/guards/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@novabuilder/shared/types/user';

@Controller('apps')
@UseGuards(AuthGuard('jwt'))
export class AppController {
  constructor(private appService: AppService) {}

  @Get()
  async findAll(@Request() req: any, @Query('search') search?: string) {
    const workspaceId = 'default';
    return this.appService.findAll(workspaceId, search);
  }

  @Get(':id')
  async findOne(@Request() req: any, @Param('id') id: string) {
    const app = await this.appService.findById(id);
    // end_user can only access published apps
    if (req.user.role === 'end_user' && app.status !== 'published') {
      throw new ForbiddenException('无权限访问该应用');
    }
    return app;
  }

  @Get(':id/published')
  async findPublished(@Param('id') id: string) {
    const app = await this.appService.findById(id);
    if (app.status !== 'published') {
      throw new ForbiddenException('该应用未发布');
    }
    return {
      id: app.id,
      name: app.name,
      definition: app.definitionPublished,
    };
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'builder')
  async create(@Request() req: any, @Body() data: { name: string; workspaceId?: string }) {
    return this.appService.create(data.name, data.workspaceId || 'default', req.user.id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'builder')
  async update(@Param('id') id: string, @Body() data: { name?: string; definitionDraft?: any }) {
    return this.appService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'builder')
  async delete(@Param('id') id: string) {
    await this.appService.delete(id);
    return { message: '删除成功' };
  }

  @Post(':id/clone')
  @UseGuards(RolesGuard)
  @Roles('admin', 'builder')
  async clone(@Request() req: any, @Param('id') id: string) {
    return this.appService.clone(id, req.user.id);
  }

  @Post(':id/publish')
  @UseGuards(RolesGuard)
  @Roles('admin', 'builder')
  async publish(@Param('id') id: string) {
    return this.appService.publish(id);
  }

  @Post(':id/rollback')
  @UseGuards(RolesGuard)
  @Roles('admin', 'builder')
  async rollback(@Param('id') id: string) {
    return this.appService.rollback(id);
  }
}
