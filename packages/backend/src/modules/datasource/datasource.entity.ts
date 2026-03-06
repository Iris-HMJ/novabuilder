import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type DataSourceType = 'postgresql' | 'mysql' | 'restapi' | 'novadb';
export type DataSourceStatus = 'connected' | 'untested' | 'failed';

@Entity('data_sources')
export class DataSource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  workspaceId: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: ['postgresql', 'mysql', 'restapi', 'novadb'] })
  type: DataSourceType;

  @Column({ type: 'jsonb' })
  config: any; // 加密存储

  @Column({ type: 'enum', enum: ['connected', 'untested', 'failed'], default: 'untested' })
  status: DataSourceStatus;

  @Column({ nullable: true })
  lastTestedAt: Date; // 最后测试时间

  @Column()
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
