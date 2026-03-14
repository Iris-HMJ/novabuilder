import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  Res,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { NovaDBService } from './novadb.service';
import { CreateTableDto, CreateColumnDto, UpdateColumnDto, QueryRowsDto, DeleteRowsDto, ExecuteSqlDto } from './dto/nova-db.dto';
import { Roles } from '../../common/guards/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('novadb')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin', 'builder')
export class NovaDBController {
  constructor(private readonly novadbService: NovaDBService) {}

  // ========== Tables ==========

  @Get('tables')
  async findAllTables() {
    return this.novadbService.findAllTables();
  }

  @Get('tables/:id')
  async findTableById(@Param('id', ParseUUIDPipe) id: string) {
    return this.novadbService.findTableById(id);
  }

  @Post('tables')
  async createTable(@Body() dto: CreateTableDto) {
    return this.novadbService.createTable(dto.name, dto.createdBy);
  }

  @Patch('tables/:id')
  async updateTable(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { name: string },
  ) {
    return this.novadbService.updateTable(id, body.name);
  }

  @Delete('tables/:id')
  async deleteTable(@Param('id', ParseUUIDPipe) id: string) {
    await this.novadbService.deleteTable(id);
    return { success: true };
  }

  // ========== Columns ==========

  @Get('tables/:id/columns')
  async findColumns(@Param('id', ParseUUIDPipe) id: string) {
    return this.novadbService.findColumnsByTableId(id);
  }

  @Post('tables/:id/columns')
  async addColumn(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateColumnDto,
  ) {
    return this.novadbService.addColumn(id, dto);
  }

  @Put('tables/:tableId/columns/:colId')
  async updateColumn(
    @Param('tableId', ParseUUIDPipe) tableId: string,
    @Param('colId', ParseUUIDPipe) colId: string,
    @Body() dto: UpdateColumnDto,
  ) {
    return this.novadbService.updateColumn(tableId, colId, dto);
  }

  @Delete('tables/:tableId/columns/:colId')
  async deleteColumn(
    @Param('tableId', ParseUUIDPipe) tableId: string,
    @Param('colId', ParseUUIDPipe) colId: string,
  ) {
    await this.novadbService.deleteColumn(tableId, colId);
    return { success: true };
  }

  // ========== Rows ==========

  @Get('tables/:id/rows')
  async queryRows(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: QueryRowsDto,
  ) {
    return this.novadbService.queryRows(id, query);
  }

  @Post('tables/:id/rows')
  async createRow(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { data: Record<string, any> },
  ) {
    return this.novadbService.createRow(id, body.data);
  }

  @Put('tables/:tableId/rows/:rowId')
  async updateRow(
    @Param('tableId', ParseUUIDPipe) tableId: string,
    @Param('rowId', ParseIntPipe) rowId: number,
    @Body() body: { data: Record<string, any> },
  ) {
    return this.novadbService.updateRow(tableId, String(rowId), body.data);
  }

  @Delete('tables/:id/rows')
  async deleteRows(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DeleteRowsDto,
  ) {
    // Convert string IDs to numbers since they are now SERIAL integers
    const numericIds = dto.ids.map((id) => (isNaN(Number(id)) ? id : Number(id)));
    await this.novadbService.deleteRows(id, numericIds as string[]);
    return { success: true };
  }

  // ========== SQL ==========

  @Post('sql')
  async executeSql(@Body() dto: ExecuteSqlDto) {
    return this.novadbService.executeSql(dto.sql, dto.params);
  }

  // ========== Template & Import ==========

  @Get('tables/:id/template')
  async getTemplate(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const { filename, content } = await this.novadbService.generateTemplate(id);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.send(content);
  }

  @Post('tables/:id/import')
  @UseInterceptors(FileInterceptor('file'))
  async importData(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.novadbService.importData(id, file);
  }
}
