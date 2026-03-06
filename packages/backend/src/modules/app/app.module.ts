import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { App } from './app.entity';

@Module({
  imports: [TypeOrmModule.forFeature([App])],
  controllers: [AppController],
  providers: [AppService],
  exports: [AppService],
})
export class AppModule {}
