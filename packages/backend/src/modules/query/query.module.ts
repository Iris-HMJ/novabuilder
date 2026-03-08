import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueryController } from './query.controller';
import { QueryService } from './query.service';
import { Query } from './query.entity';
import { DataSourceModule } from '../datasource/datasource.module';
import { NovaDBModule } from '../novadb/novadb.module';
import { EncryptionService } from '../../common/encryption.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Query]),
    DataSourceModule,
    NovaDBModule,
  ],
  controllers: [QueryController],
  providers: [QueryService, EncryptionService],
  exports: [QueryService],
})
export class QueryModule {}
