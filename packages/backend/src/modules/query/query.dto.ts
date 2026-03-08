import { IsString, IsEnum, IsObject, IsOptional, IsUUID, Matches } from 'class-validator';

export type QueryType = 'sql' | 'javascript' | 'visual' | 'rest';

export class CreateQueryDto {
  @IsUUID()
  appId: string;

  @IsString()
  name: string;

  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$|^novadb-builtin$/, {
    message: 'dataSourceId must be a valid UUID or novadb-builtin',
  })
  dataSourceId: string;

  @IsEnum(['sql', 'javascript', 'visual', 'rest'])
  type: QueryType;

  @IsObject()
  content: any;

  @IsOptional()
  @IsObject()
  options?: any;
}

export class UpdateQueryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsObject()
  content?: any;

  @IsOptional()
  @IsObject()
  options?: any;
}

export class ExecuteQueryDto {
  @IsOptional()
  @IsObject()
  parameters?: Record<string, any>;
}

export class PreviewQueryDto {
  @IsUUID()
  appId: string;

  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$|^novadb-builtin$/, {
    message: 'dataSourceId must be a valid UUID or novadb-builtin',
  })
  dataSourceId: string;

  @IsEnum(['sql', 'javascript', 'visual', 'rest'])
  type: QueryType;

  @IsObject()
  content: any;

  @IsOptional()
  @IsObject()
  parameters?: Record<string, any>;
}
