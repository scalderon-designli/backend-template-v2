import { PageInfoDto } from 'src/utils/page-info.dto';
import { Base } from '@prisma/client';

export class PaginatedBase extends PageInfoDto {
  items!: Base[];
}
