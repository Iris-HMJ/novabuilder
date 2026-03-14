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

@Controller('apps')
@UseGuards(AuthGuard('jwt'))
export class AppController {
  constructor(private appService: AppService) {}

  @Get()
  async findAll(@Request() req: any, @Query('search') search?: string) {
    const workspaceId = 'default';
    const userRole = req.user.role;
    const userId = req.user.id;

    // End users can only see published apps
    if (userRole === 'end_user') {
      return this.appService.findAllPublished(workspaceId, search);
    }

    // Builders can only see their own apps (plus they can see all published apps)
    if (userRole === 'builder') {
      return this.appService.findAll(workspaceId, search, { createdBy: userId });
    }

    // Admins can see all apps
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
  async update(@Request() req: any, @Param('id') id: string, @Body() data: { name?: string; definitionDraft?: any }) {
    return this.appService.update(id, req.user.id, req.user.role, data);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'builder')
  async delete(@Request() req: any, @Param('id') id: string) {
    await this.appService.delete(id, req.user.id, req.user.role);
    return { message: '删除成功' };
  }

  @Post(':id/clone')
  @UseGuards(RolesGuard)
  @Roles('admin', 'builder')
  async clone(@Request() req: any, @Param('id') id: string) {
    return this.appService.clone(id, req.user.id, req.user.role);
  }

  @Post(':id/publish')
  @UseGuards(RolesGuard)
  @Roles('admin', 'builder')
  async publish(@Request() req: any, @Param('id') id: string) {
    return this.appService.publish(id, req.user.id, req.user.role);
  }

  @Post(':id/rollback')
  @UseGuards(RolesGuard)
  @Roles('admin', 'builder')
  async rollback(@Request() req: any, @Param('id') id: string) {
    return this.appService.rollback(id, req.user.id, req.user.role);
  }
}
