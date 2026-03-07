import { IsString, IsOptional, IsBoolean, IsEnum, IsNumber, IsArray, IsUUID, IsNumberString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTableDto {
  @IsString()
  name: string;

  @IsString()
  createdBy: string;
}

export class UpdateTableDto {
  @IsString()
  @IsOptional()
  name?: string;
}

export class CreateColumnDto {
  @IsString()
  name: string;

  @IsEnum(['text', 'number', 'boolean', 'datetime'])
  type: 'text' | 'number' | 'boolean' | 'datetime';

  @IsBoolean()
  @IsOptional()
  isNullable?: boolean;

  @IsString()
  @IsOptional()
  defaultValue?: string;

  @IsNumber()
  @IsOptional()
  columnOrder?: number;
}

export class UpdateColumnDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(['text', 'number', 'boolean', 'datetime'])
  @IsOptional()
  type?: 'text' | 'number' | 'boolean' | 'datetime';

  @IsBoolean()
  @IsOptional()
  isNullable?: boolean;

  @IsString()
  @IsOptional()
  defaultValue?: string;

  @IsNumber()
  @IsOptional()
  columnOrder?: number;
}

// Filter operator types for different column types
export type TextOperator = 'eq' | 'neq' | 'contains' | 'not_contains' | 'is_empty' | 'is_not_empty';
export type NumberOperator = 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'is_empty' | 'is_not_empty';
export type BooleanOperator = 'eq';
export type DateTimeOperator = 'eq' | 'before' | 'after' | 'is_empty' | 'is_not_empty';

export interface FilterCondition {
  column: string;
  operator: string;
  value: any;
}

export class QueryRowsDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  sortBy?: string;

  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc';

  @IsNumberString()
  @IsOptional()
  page?: string;

  @IsNumberString()
  @IsOptional()
  pageSize?: string;

  @IsString()
  @IsOptional()
  filters?: string; // JSON stringified array of FilterCondition

  @IsString()
  @IsOptional()
  sorts?: string; // JSON stringified array of { column: string; order: 'asc' | 'desc' }
}

export class CreateRowDto {
  @IsArray()
  @IsOptional()
  data: Record<string, any>;
}

export class UpdateRowDto {
  @IsObject()
  data: Record<string, any>;
}

export class DeleteRowsDto {
  @IsArray()
  ids: string[];
}

export class ExecuteSqlDto {
  @IsString()
  sql: string;

  @IsArray()
  @IsOptional()
  params?: any[];
}

function IsObject(): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    // class-validator doesn't have IsObject, using type check in service
  };
}
