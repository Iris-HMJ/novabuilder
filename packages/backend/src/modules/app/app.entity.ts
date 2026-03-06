import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { AppStatus, AppDefinition } from '@novabuilder/shared/types/app';

@Entity('apps')
export class App {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ default: 'default' })
  workspaceId: string;

  @Column({ type: 'enum', enum: ['draft', 'published'], default: 'draft' })
  status: AppStatus;

  @Column({ type: 'jsonb', nullable: true })
  definitionDraft: AppDefinition | null;

  @Column({ type: 'jsonb', nullable: true })
  definitionPublished: AppDefinition | null;

  @Column({ type: 'jsonb', nullable: true })
  definitionPrevious: AppDefinition | null;

  @Column()
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date | null;
}
