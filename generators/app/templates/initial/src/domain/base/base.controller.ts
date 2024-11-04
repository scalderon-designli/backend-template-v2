import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseArrayPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { GeneratedFindOptions } from '@chax-at/prisma-filter';

import { FilterDto } from 'src/utils/filter.dto';
import { BaseService } from './base.service';
import { CreateBaseDto } from './dto/create-base.dto';
import { UpdateBaseDto } from './dto/update-base.dto';

@Controller('base')
export class BaseController {
  constructor(private readonly baseService: BaseService) {}

  @Post()
  @ApiQuery({ name: 'relations', type: 'string', isArray: true, required: false })
  async createBase(
    @Body() createDto: CreateBaseDto,
    @Query('relations', new ParseArrayPipe({ items: String, separator: ',', optional: true })) relations: string[] = [],
  ) {
    try {
      const newBase = await this.baseService.create(relations, createDto);
      return { statusCode: HttpStatus.CREATED, message: 'Resource created successfully', data: newBase };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  @ApiQuery({ name: 'relations', type: 'string', isArray: true, required: false })
  @ApiQuery({ name: '_start', type: 'number', required: false })
  @ApiQuery({ name: '_end', type: 'number', required: false })
  @ApiQuery({ name: '_sort', type: 'string', required: false })
  @ApiQuery({ name: '_order', type: 'string', required: false })
  async findAllBase(
    @Query()
    query: FilterDto<Prisma.BaseWhereInput>,
    @Query('relations', new ParseArrayPipe({ items: String, separator: ',', optional: true }))
    relations: string[] = [],
    @Query('_start') start?: number,
    @Query('_end') end?: number,
    @Query('_sort') sort?: string,
    @Query('_order') order?: 'asc' | 'desc',
  ) {
    try {
      query.findOptions = query.findOptions || ({} as GeneratedFindOptions<Prisma.BaseWhereInput>);
      query.findOptions.where = query.findOptions.where || {};
      const filters = { ...query, ...query.findOptions?.where };
      const transformedFilters = this.transformFilters(filters);
      if (start && end) {
        query.findOptions.skip = start;
        query.findOptions.take = end - start;
      }
      let orderBy: Prisma.BaseOrderByWithRelationInput | undefined;
      if (sort && order) {
        orderBy = { [sort]: order };
      }
      return await this.baseService.findAll(relations, {
        ...query,
        findOptions: {
          ...query.findOptions,
          where: transformedFilters,
          orderBy: orderBy,
        },
      });
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('/metadata')
  @ApiQuery({ required: false })
  async getMetadataBase() {
    return BaseMetadata;
  }

  @Get(':uuid')
  @ApiQuery({ name: 'relations', type: 'string', isArray: true, required: false })
  async findBaseByUuid(
    @Query('relations', new ParseArrayPipe({ items: String, separator: ',', optional: true })) relations: string[] = [],
    @Param('uuid') uuid: string,
  ) {
    try {
      const base = await this.baseService.findByUUID(relations, uuid);
      if (!base) {
        throw new HttpException('Resource not found', HttpStatus.NOT_FOUND);
      }
      return base;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Patch(':uuid')
  @ApiQuery({ name: 'relations', type: 'string', isArray: true, required: false })
  async updateFavorites(
    @Param('uuid') uuid: string,
    @Query('relations', new ParseArrayPipe({ items: String, separator: ',', optional: true })) relations: string[] = [],
    @Body() updateDto: UpdateBaseDto,
  ) {
    try {
      const updatedBase = await this.baseService.update(relations, uuid, updateDto);
      return { statusCode: HttpStatus.OK, message: 'Resource updated successfully', data: updatedBase };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete(':uuid')
  @ApiQuery({ name: 'relations', type: 'string', isArray: true, required: false })
  async deleteBase(
    @Query('relations', new ParseArrayPipe({ items: String, separator: ',', optional: true })) relations: string[] = [],
    @Param('uuid') uuid: string,
  ) {
    try {
      await this.baseService.delete(relations, uuid);
      return { message: 'Resource deleted successfully' };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  private transformFilters(filters: any): Prisma.BaseWhereInput {
    const where: Prisma.BaseWhereInput = {};
    if (filters && Object.keys(filters).length > 0) {
      for (const key in filters) {
        if (filters.hasOwnProperty(key)) {
          const [field, operator] = key.split('_');
          if (!field || !operator) {
            continue;
          }
          const prismaOperator = this.mapRefineOperatorToPrisma(operator);
          if (!prismaOperator) {
            continue;
          }
          let value = filters[key];
          if (value === 'true') {
            value = true;
          } else if (value === 'false') {
            value = false;
          }
          if (prismaOperator === 'in' || prismaOperator === 'notIn') {
            value = value.split(',');
          }

          where[field] = {
            [prismaOperator]: value,
          };
        }
      }
    }
    return where;
  }

  private mapRefineOperatorToPrisma(operator: string): string | undefined {
    const operatorMapping: Record<string, string> = {
      eq: 'equals',
      ne: 'not',
      lt: 'lt',
      gt: 'gt',
      lte: 'lte',
      gte: 'gte',
      in: 'in',
      nin: 'notIn',
      contains: 'contains',
      ncontains: 'not',
      startswith: 'startsWith',
      endswith: 'endsWith',
      or: 'OR',
      between: 'AND',
    };
    return operatorMapping[operator];
  }
}
