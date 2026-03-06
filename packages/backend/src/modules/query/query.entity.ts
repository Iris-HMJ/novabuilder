import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type QueryType = 'sql' | 'javascript' | 'visual' | 'rest';

@Entity('queries')
export class Query {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  appId: string;

  @Column()
  name: string;

  @Column()
  dataSourceId: string;

  @Column({ type: 'enum', enum: ['sql', 'javascript', 'visual', 'rest'] })
  type: QueryType;

  @Column({ type: 'jsonb' })
  content: any;

  @Column({ type: 'jsonb', default: {} })
  options: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
