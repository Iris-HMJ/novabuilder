import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NovaTable } from './nova-table.entity';
import { NovaColumn } from './nova-column.entity';
import { NovaDBService } from './novadb.service';
import { NovaDBController } from './novadb.controller';

@Module({
  imports: [TypeOrmModule.forFeature([NovaTable, NovaColumn])],
  providers: [NovaDBService],
  controllers: [NovaDBController],
  exports: [NovaDBService],
})
export class NovaDBModule {}
