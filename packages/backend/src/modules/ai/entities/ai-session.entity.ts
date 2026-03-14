import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { AiMessage } from './ai-message.entity';

@Entity('ai_sessions')
export class AiSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'app_id', nullable: true })
  appId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @OneToMany(() => AiMessage, (msg) => msg.session)
  messages: AiMessage[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
