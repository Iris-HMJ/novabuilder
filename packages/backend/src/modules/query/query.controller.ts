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

@Controller('queries')
@UseGuards(AuthGuard('jwt'))
export class QueryController {
  constructor(private readonly queryService: QueryService) {}

  @Get()
  async findAll(@Query('appId') appId: string) {
    return this.queryService.findAllByAppId(appId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.queryService.findById(id);
  }

  @Post()
  async create(@Body() createQueryDto: CreateQueryDto) {
    return this.queryService.create(createQueryDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateQueryDto: UpdateQueryDto) {
    return this.queryService.update(id, updateQueryDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.queryService.delete(id);
    return { success: true };
  }

  @Post(':id/run')
  async execute(@Param('id') id: string, @Body() executeQueryDto: ExecuteQueryDto) {
    return this.queryService.executeQuery(id, executeQueryDto.parameters);
  }

  @Post('preview')
  async preview(@Body() previewQueryDto: PreviewQueryDto) {
    const { appId, dataSourceId, type, content, parameters } = previewQueryDto;
    return this.queryService.previewQuery(dataSourceId, type, content, {}, parameters);
  }
}
