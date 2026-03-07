import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataSource, DataSourceStatus } from './datasource.entity';
import { EncryptionService } from '../../common/encryption.service';
import { DataSourceAdapterFactory } from './adapters/datasource-adapter.factory';
import { TestConnectionResult, SchemaResult } from './adapters/datasource-adapter.interface';

@Injectable()
export class DataSourceService implements OnModuleInit {
  constructor(
    @InjectRepository(DataSource)
    private dataSourceRepository: Repository<DataSource>,
    private encryptionService: EncryptionService,
  ) {}

  async onModuleInit() {
    await this.registerNovaDBAsBuiltIn();
  }

  // Register NovaDB as a built-in datasource
  async registerNovaDBAsBuiltIn() {
    const existing = await this.dataSourceRepository.findOne({
      where: { type: 'novadb', name: 'NovaDB (内置)' },
    });

    if (!existing) {
      const novadbDataSource = this.dataSourceRepository.create({
        name: 'NovaDB (内置)',
        workspaceId: 'system',
        type: 'novadb',
        config: this.encryptionService.encrypt(JSON.stringify({})),
        status: 'connected',
        createdBy: 'system',
      });
      await this.dataSourceRepository.save(novadbDataSource);
      console.log('NovaDB registered as built-in datasource');
    }
  }

  async findAll(workspaceId: string): Promise<DataSource[]> {
    return this.dataSourceRepository.find({
      where: { workspaceId },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<DataSource> {
    const dataSource = await this.dataSourceRepository.findOne({ where: { id } });
    if (!dataSource) {
      throw new NotFoundException('数据源不存在');
    }
    return dataSource;
  }

  // Get data source with decrypted config (password masked)
  async getDecryptedConfigWithMask(id: string): Promise<any> {
    const dataSource = await this.findById(id);
    const config = JSON.parse(this.encryptionService.decrypt(dataSource.config));

    // Mask password
    if (config.password) {
      config.password = '******';
    }

    // For REST API, mask auth tokens
    if (dataSource.type === 'restapi' && config.authToken) {
      config.authToken = '******';
    }

    return {
      ...dataSource,
      config,
    };
  }

  async create(data: {
    name: string;
    workspaceId: string;
    type: string;
    config: any;
    userId: string;
  }): Promise<DataSource> {
    // Encrypt config
    const encryptedConfig = this.encryptionService.encrypt(JSON.stringify(data.config));

    const dataSource = this.dataSourceRepository.create({
      name: data.name,
      workspaceId: data.workspaceId,
      type: data.type as any,
      config: encryptedConfig,
      status: 'untested',
      createdBy: data.userId,
    });

    return this.dataSourceRepository.save(dataSource);
  }

  async update(id: string, data: { name?: string; config?: any }): Promise<DataSource> {
    const dataSource = await this.findById(id);

    if (data.name) {
      dataSource.name = data.name;
    }

    if (data.config) {
      // If password is empty or not provided, keep the original password
      const existingConfig = JSON.parse(this.encryptionService.decrypt(dataSource.config));
      if (!data.config.password) {
        data.config.password = existingConfig.password;
      }

      dataSource.config = this.encryptionService.encrypt(JSON.stringify(data.config));
    }

    return this.dataSourceRepository.save(dataSource);
  }

  async delete(id: string): Promise<void> {
    const result = await this.dataSourceRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('数据源不存在');
    }
  }

  async testConnection(id: string): Promise<TestConnectionResult> {
    const dataSource = await this.findById(id);
    const result = await this.testConnectionByType(dataSource.type, dataSource.config);

    // Update status based on result
    dataSource.status = result.success ? 'connected' : 'failed';
    dataSource.lastTestedAt = new Date();
    await this.dataSourceRepository.save(dataSource);

    return result;
  }

  async testConnectionByType(type: string, encryptedConfig: string): Promise<TestConnectionResult> {
    const config = JSON.parse(this.encryptionService.decrypt(encryptedConfig));
    const adapter = DataSourceAdapterFactory.createAdapter(type, config);
    return adapter.testConnection();
  }

  async testConnectionByTypeDirect(type: string, config: any): Promise<TestConnectionResult> {
    const adapter = DataSourceAdapterFactory.createAdapter(type, config);
    return adapter.testConnection();
  }

  async getSchema(id: string): Promise<SchemaResult> {
    const dataSource = await this.findById(id);
    const config = JSON.parse(this.encryptionService.decrypt(dataSource.config));
    const adapter = DataSourceAdapterFactory.createAdapter(dataSource.type, config);
    return adapter.getSchema();
  }

  // Get decrypted config (for internal use only, don't expose via API)
  getDecryptedConfig(encryptedConfig: string): any {
    return JSON.parse(this.encryptionService.decrypt(encryptedConfig));
  }
}
