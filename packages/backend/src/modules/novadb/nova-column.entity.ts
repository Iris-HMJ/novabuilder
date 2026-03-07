import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { NovaTable } from './nova-table.entity';

export type ColumnType = 'text' | 'number' | 'boolean' | 'datetime';

@Entity('nova_columns')
export class NovaColumn {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tableId: string;

  @ManyToOne(() => NovaTable, (table) => table.columns, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tableId' })
  table: NovaTable;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: ['text', 'number', 'boolean', 'datetime'] })
  type: ColumnType;

  @Column({ default: true })
  isNullable: boolean;

  @Column({ nullable: true })
  defaultValue: string;

  @Column({ default: 0 })
  columnOrder: number;

  @CreateDateColumn()
  createdAt: Date;
}
