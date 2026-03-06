import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DataSourceService } from './datasource.service';
import { Roles } from '../../common/guards/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('data-sources')
@UseGuards(AuthGuard('jwt'))
export class DataSourceController {
  constructor(private dataSourceService: DataSourceService) {}

  @Get()
  async findAll(@Request() req: any) {
    const workspaceId = 'default';
    const dataSources = await this.dataSourceService.findAll(workspaceId);
    // Don't return decrypted config
    return dataSources.map(ds => ({
      id: ds.id,
      name: ds.name,
      type: ds.type,
      status: ds.status,
      createdBy: ds.createdBy,
      createdAt: ds.createdAt,
      updatedAt: ds.updatedAt,
    }));
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    // Return decrypted config with masked password
    return this.dataSourceService.getDecryptedConfigWithMask(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'builder')
  async create(@Request() req: any, @Body() data: { name: string; type: string; config: any }) {
    return this.dataSourceService.create({
      name: data.name,
      workspaceId: 'default',
      type: data.type,
      config: data.config,
      userId: req.user.id,
    });
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'builder')
  async update(@Param('id') id: string, @Body() data: { name?: string; config?: any }) {
    return this.dataSourceService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'builder')
  async delete(@Param('id') id: string) {
    await this.dataSourceService.delete(id);
    return { message: '删除成功' };
  }

  @Post('test')
  @UseGuards(RolesGuard)
  @Roles('admin', 'builder')
  async testConnection(@Body() data: { type: string; config: any }) {
    return this.dataSourceService.testConnectionByTypeDirect(data.type, data.config);
  }

  @Post(':id/test')
  @UseGuards(RolesGuard)
  @Roles('admin', 'builder')
  async testConnectionById(@Param('id') id: string) {
    return this.dataSourceService.testConnection(id);
  }

  @Get(':id/schema')
  @UseGuards(RolesGuard)
  @Roles('admin', 'builder')
  async getSchema(@Param('id') id: string) {
    return this.dataSourceService.getSchema(id);
  }
}
