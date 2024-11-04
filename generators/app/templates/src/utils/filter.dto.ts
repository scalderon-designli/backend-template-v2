import {
  ISingleFilter,
  FilterOperationType,
  ISingleOrder,
  FilterOrder,
  IFilter,
  IGeneratedFilter,
  GeneratedFindOptions,
} from '@chax-at/prisma-filter';
import { Type } from 'class-transformer';
import {
  IsString,
  IsEnum,
  IsDefined,
  IsIn,
  IsArray,
  ValidateNested,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class SingleFilter<T> implements ISingleFilter<T> {
  @IsString()
  field!: keyof T & string;

  @IsEnum(FilterOperationType)
  type!: FilterOperationType;

  @IsDefined()
  value: unknown;
}

export class SingleFilterOrder<T> implements ISingleOrder<T> {
  @IsString()
  field!: keyof T & string;

  @IsIn(['asc', 'desc'])
  dir!: FilterOrder;
}

export class Filter<T = unknown> implements IFilter<T> {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SingleFilter)
  @IsOptional()
  filter?: Array<SingleFilter<T>>;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SingleFilterOrder)
  @IsOptional()
  order?: Array<SingleFilterOrder<T>>;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset = 0;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit = 100;
}

export class FilterDto<TWhereInput = unknown> extends Filter implements IGeneratedFilter<TWhereInput> {
  findOptions!: GeneratedFindOptions<TWhereInput>;
}
