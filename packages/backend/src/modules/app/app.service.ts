import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { App } from './app.entity';
import { AppDefinition, defaultNavigationConfig } from '@novabuilder/shared/types/app';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(App)
    private appRepository: Repository<App>
  ) {}

  async findAll(workspaceId: string, search?: string): Promise<{ data: App[]; total: number }> {
    const query = this.appRepository
      .createQueryBuilder('app')
      .where('app.workspaceId = :workspaceId', { workspaceId });

    if (search) {
      query.andWhere('app.name ILIKE :search', { search: `%${search}%` });
    }

    const [data, total] = await query.orderBy('app.updatedAt', 'DESC').getManyAndCount();
    return { data, total };
  }

  async findById(id: string): Promise<App> {
    const app = await this.appRepository.findOne({ where: { id } });
    if (!app) {
      throw new NotFoundException('应用不存在');
    }
    return app;
  }

  async create(name: string, workspaceId: string, userId: string): Promise<App> {
    const homePageId = Math.random().toString(36).substring(2, 11);
    const app = this.appRepository.create({
      name,
      workspaceId,
      createdBy: userId,
      status: 'draft',
      definitionDraft: {
        version: '1.0.0',
        pages: [
          {
            id: homePageId,
            name: '首页',
            isHome: true,
            components: [],
            icon: 'HomeOutlined',
          },
        ],
        navigation: defaultNavigationConfig,
      },
    });
    return this.appRepository.save(app);
  }

  async update(id: string, data: { name?: string; definitionDraft?: AppDefinition }): Promise<App> {
    const app = await this.findById(id);
    if (data.name) app.name = data.name;
    if (data.definitionDraft) app.definitionDraft = data.definitionDraft;
    return this.appRepository.save(app);
  }

  async delete(id: string): Promise<void> {
    const result = await this.appRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('应用不存在');
    }
  }

  async clone(id: string, userId: string): Promise<App> {
    const original = await this.findById(id);
    const app = this.appRepository.create({
      name: `${original.name} (副本)`,
      workspaceId: original.workspaceId,
      createdBy: userId,
      status: 'draft',
      definitionDraft: original.definitionDraft,
      definitionPublished: original.definitionPublished,
    });
    return this.appRepository.save(app);
  }

  async publish(id: string): Promise<App> {
    const app = await this.findById(id);
    if (!app.definitionDraft) {
      throw new ForbiddenException('没有可发布的内容');
    }
    app.definitionPrevious = app.definitionPublished;
    app.definitionPublished = app.definitionDraft;
    app.status = 'published';
    app.publishedAt = new Date();
    return this.appRepository.save(app);
  }

  async rollback(id: string): Promise<App> {
    const app = await this.findById(id);
    if (!app.definitionPrevious) {
      throw new ForbiddenException('没有可回滚的版本');
    }
    app.definitionPublished = app.definitionPrevious;
    app.definitionPrevious = null;
    app.status = 'published';
    app.publishedAt = new Date();
    return this.appRepository.save(app);
  }
}
