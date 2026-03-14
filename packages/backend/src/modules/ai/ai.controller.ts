import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AiService } from './ai.service';
import { AnalyzeDto, GenerateDto, GenerateSqlDto, ModifyAppDto, ApplyPatchDto } from './dto/ai.dto';
import { Roles } from '../../common/guards/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('ai')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin', 'builder')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('analyze')
  async analyze(@Body() dto: AnalyzeDto, @Req() req: any) {
    return this.aiService.analyzeRequirement(dto.input, dto.appId, req.user.id);
  }

  @Post('generate')
  async generate(@Body() dto: GenerateDto, @Req() req: any) {
    return this.aiService.generateApp(dto.requirement, dto.appId, req.user.id, req.user.role);
  }

  @Post('generate-sql')
  async generateSQL(@Body() dto: GenerateSqlDto) {
    return this.aiService.generateSQL(dto.description, dto.dataSourceId);
  }

  // Step 8: 增量修改
  @Post('modify')
  async modify(@Body() dto: ModifyAppDto, @Req() req: any) {
    return this.aiService.modifyApp(dto.instruction, dto.appId, dto.pageId, req.user.id, req.user.role);
  }

  @Post('apply-patch')
  async applyPatch(@Body() dto: ApplyPatchDto, @Req() req: any) {
    return this.aiService.applyPatch(dto.appId, dto.patch, dto.pageId, req.user.id, req.user.role);
  }

  @Get('sessions/:appId')
  async getHistory(@Param('appId') appId: string, @Req() req: any) {
    return this.aiService.getSessionMessages(appId, req.user.id);
  }
}
