import { IDataSourceAdapter } from './datasource-adapter.interface';
import { PostgresAdapter } from './postgres.adapter';
import { MysqlAdapter } from './mysql.adapter';
import { RestApiAdapter } from './restapi.adapter';
import { NovaDBAdapter } from './novadb.adapter';
import { DataSourceConfig } from '@novabuilder/shared/types/datasource';

export class DataSourceAdapterFactory {
  static createAdapter(type: string, config: DataSourceConfig): IDataSourceAdapter {
    switch (type) {
      case 'postgresql':
        return new PostgresAdapter(config as any);
      case 'mysql':
        return new MysqlAdapter(config as any);
      case 'restapi':
        return new RestApiAdapter(config as any);
      case 'novadb':
        return new NovaDBAdapter(config);
      default:
        throw new Error(`Unsupported data source type: ${type}`);
    }
  }
}
