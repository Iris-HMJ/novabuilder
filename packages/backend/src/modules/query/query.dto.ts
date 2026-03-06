import { IsString, IsEnum, IsObject, IsOptional, IsUUID } from 'class-validator';

export type QueryType = 'sql' | 'javascript' | 'visual' | 'rest';

export class CreateQueryDto {
  @IsUUID()
  appId: string;

  @IsString()
  name: string;

  @IsUUID()
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

  @IsUUID()
  dataSourceId: string;

  @IsEnum(['sql', 'javascript', 'visual', 'rest'])
  type: QueryType;

  @IsObject()
  content: any;

  @IsOptional()
  @IsObject()
  parameters?: Record<string, any>;
}
