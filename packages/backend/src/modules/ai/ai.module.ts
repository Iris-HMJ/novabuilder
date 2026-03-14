import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiSession, AiMessage } from './entities';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { PromptManager } from './prompts/prompt.manager';
import { NovaDBModule } from '../novadb/novadb.module';
import { AppModule } from '../app/app.module';
import { DataSourceModule } from '../datasource/datasource.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AiSession, AiMessage]),
    forwardRef(() => NovaDBModule),
    forwardRef(() => AppModule),
    forwardRef(() => DataSourceModule),
  ],
  controllers: [AiController],
  providers: [AiService, PromptManager],
  exports: [AiService],
})
export class AiModule {}
