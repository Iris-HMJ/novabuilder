import { IsString, IsNotEmpty, IsOptional, IsUUID, IsObject } from 'class-validator';

export class AnalyzeDto {
  @IsString()
  @IsNotEmpty()
  input: string;

  @IsOptional()
  @IsUUID()
  appId?: string;
}

export class GenerateDto {
  @IsObject()
  requirement: any;

  @IsUUID()
  appId: string;
}

export class GenerateSqlDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsUUID()
  dataSourceId: string;
}

// Step 8: Modify App DTOs
export class ModifyAppDto {
  @IsString()
  @IsNotEmpty()
  instruction: string;

  @IsUUID()
  appId: string;

  @IsOptional()
  @IsString()
  pageId?: string;
}

export class ApplyPatchDto {
  @IsUUID()
  appId: string;

  @IsObject()
  patch: any;

  @IsOptional()
  @IsString()
  pageId?: string;
}
