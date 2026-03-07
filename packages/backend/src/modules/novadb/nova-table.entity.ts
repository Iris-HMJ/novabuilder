import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { NovaColumn } from './nova-column.entity';

@Entity('nova_tables')
export class NovaTable {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => NovaColumn, (column) => column.table, { cascade: true, eager: true })
  columns: NovaColumn[];
}
