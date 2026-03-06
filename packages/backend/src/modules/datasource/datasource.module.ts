import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from './datasource.entity';
import { DataSourceService } from './datasource.service';
import { DataSourceController } from './datasource.controller';
import { EncryptionService } from '../../common/encryption.service';

@Module({
  imports: [TypeOrmModule.forFeature([DataSource])],
  providers: [DataSourceService, EncryptionService],
  controllers: [DataSourceController],
  exports: [DataSourceService, EncryptionService],
})
export class DataSourceModule {}
