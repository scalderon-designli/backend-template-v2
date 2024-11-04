import { Injectable, Logger, UnprocessableEntityException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { PrismaService } from 'src/prisma.service';
import { Base, Prisma } from '@prisma/client';
import { CreateBaseDto } from './dto/create-base.dto';
import { FilterDto } from 'src/utils/filter.dto';
import { PaginatedBase } from './dto/paginated-base.dto';
import { UpdateBaseDto } from './dto/update-base.dto';

@Injectable()
export class BaseService {
  private readonly logger: Logger;
  constructor(private readonly prismaService: PrismaService) {
    this.logger = new Logger(BaseService.name);
  }

  async create(relations: string[], data: CreateBaseDto): Promise<Base> {
    try {
      const result = await this.prismaService.base.create({
        data,
      });

      return plainToInstance(Base, result);
    } catch (error) {
      this.logger.error(error);

      throw new UnprocessableEntityException(error);
    }
  }

  async findAll(relations: string[], filter: FilterDto<Prisma.BaseWhereInput>): Promise<PaginatedBase> {
    try {
      const where = {
        deletedAt: null,
      };

      filter.findOptions.where = {
        ...filter.findOptions.where,
        ...where,
      };

      const [result, count] = await Promise.all([
        this.prismaService.base.findMany({
          ...filter.findOptions,
        }),
        this.prismaService.base.count({
          where: filter.findOptions.where,
        }),
      ]);

      return {
        items: plainToInstance(Base, result),
        hasNextPage: count > (filter.findOptions.skip || 0) + (filter.findOptions.take || 0),
        totalCount: count,
      };
    } catch (error) {
      this.logger.error(error);

      throw new UnprocessableEntityException(error);
    }
  }

  async findByUUID(relations: string[], uuid: string): Promise<Base> {
    try {
      const result = await this.prismaService.base.findUniqueOrThrow({
        where: {
          uuid,
          deletedAt: null,
        },
      });

      return plainToInstance(Base, result);
    } catch (error) {
      this.logger.error(error);

      throw new UnprocessableEntityException(error);
    }
  }

  async update(relations: string[], uuid: string, data: UpdateBaseDto): Promise<Base> {
    try {
      const result = await this.prismaService.base.update({
        data: {
          ...data,

          updatedAt: new Date(),
        },

        where: {
          uuid,
        },
      });

      return plainToInstance(Base, result);
    } catch (error) {
      this.logger.error(error);

      throw new UnprocessableEntityException(error);
    }
  }

  async delete(relations: string[], uuid: string): Promise<Base> {
    try {
      const result = await this.prismaService.base.update({
        data: {
          deletedAt: new Date(),
        },

        where: {
          uuid,
        },
      });

      return plainToInstance(Base, result);
    } catch (error) {
      this.logger.error(error);

      throw new UnprocessableEntityException(error);
    }
  }
}
