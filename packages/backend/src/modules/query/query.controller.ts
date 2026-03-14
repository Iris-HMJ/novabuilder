import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { QueryService } from './query.service';
import { CreateQueryDto, UpdateQueryDto, ExecuteQueryDto, PreviewQueryDto } from './query.dto';
import { Roles } from '../../common/guards/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('queries')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class QueryController {
  constructor(private readonly queryService: QueryService) {}

  @Get()
  @Roles('admin', 'builder')
  async findAll(@Query('appId') appId: string) {
    return this.queryService.findAllByAppId(appId);
  }

  @Get(':id')
  @Roles('admin', 'builder')
  async findOne(@Param('id') id: string) {
    return this.queryService.findById(id);
  }

  @Post()
  @Roles('admin', 'builder')
  async create(@Body() createQueryDto: CreateQueryDto) {
    return this.queryService.create(createQueryDto);
  }

  @Put(':id')
  @Roles('admin', 'builder')
  async update(@Param('id') id: string, @Body() updateQueryDto: UpdateQueryDto) {
    return this.queryService.update(id, updateQueryDto);
  }

  @Delete(':id')
  @Roles('admin', 'builder')
  async delete(@Param('id') id: string) {
    await this.queryService.delete(id);
    return { success: true };
  }

  // End users can run saved queries when using published apps
  @Post(':id/run')
  @Roles('admin', 'builder', 'end_user')
  async execute(@Param('id') id: string, @Body() executeQueryDto: ExecuteQueryDto) {
    return this.queryService.executeQuery(id, executeQueryDto.parameters);
  }

  // Preview is only for builders/admins creating apps
  @Post('preview')
  @Roles('admin', 'builder')
  async preview(@Body() previewQueryDto: PreviewQueryDto) {
    const { appId, dataSourceId, type, content, parameters } = previewQueryDto;
    return this.queryService.previewQuery(dataSourceId, type, content, {}, parameters);
  }
}
