import fs from 'fs';
import xlsx from 'xlsx';
import {
  getAttributes,
  getSchema,
  getSubTypeFromSchema,
  getTypeFromSchema,
  ModelField,
  Models,
  TypeField,
} from './prisma.util.js';
import { toCamel, toSnake } from './utils.js';
import path from 'path';
export class ExcelCommand {
  async generatePrismaSchema(filePath: string, destinationPath: string) {
    try {
      const models: Models = {};

      const workbook = xlsx.readFile(filePath);
      const sheetNames = workbook.SheetNames;
      const types = sheetNames.shift();
      if (!types) throw new Error('No types sheet found');
      const sheetTypes = workbook.Sheets[types];

      const typesData: TypeField[] = xlsx.utils.sheet_to_json(sheetTypes);
      let schemaPrismaContent = '';
      schemaPrismaContent =
        'datasource db {\n  provider = "mysql"\n  url = env("DATABASE_URL")\n}\n\n';
      schemaPrismaContent +=
        'generator client {\n  provider = "prisma-client-js"\n  output = "../node_modules/.prisma/client"\n  previewFeatures = ["fullTextSearch"] \n}\n\n';

      sheetNames.forEach((sheet) => {
        const sheetName = workbook.Sheets[sheet];

        const sheetData = xlsx.utils.sheet_to_json(sheetName) as ModelField[];

        models[sheet] = {
          id: {
            type: 'number',
            required: true,
            exclude: true,
          },
          uuid: {
            type: 'string',
            required: true,
          },
          createdAt: {
            type: 'Date',
            required: true,
          },
          updatedAt: {
            type: 'Date',
            required: false,
          },
          deletedAt: {
            type: 'Date',
            required: false,
            exclude: true,
          },
        };

        if (sheetData.length > 0) {
          schemaPrismaContent += `model ${sheet} {\n`;

          schemaPrismaContent += `  id Int @id @default(autoincrement())`;
          schemaPrismaContent += `\n  uuid String @unique @default(cuid())`;

          sheetData.forEach((item: ModelField) => {
            item.required = (item.required as unknown) === 'true';
            const typeData = typesData.filter(
              (typeItem: TypeField) => typeItem.name === item.type
            );
            if (typeData.length) {
              schemaPrismaContent += `\n  ${toCamel(item.property)} ${getSchema(
                typeData[0].schema,
                item.required
              )} ${getAttributes(typeData[0], item)}`;

              models[sheet][toCamel(item.property)] = {
                type: getTypeFromSchema(typeData[0].schema),
                required: item.required,
                default: item.default,
                description: typeData[0].description,
                subType: getSubTypeFromSchema(typeData[0].schema),
              };
            } else {
              if (item.type === 'relation') {
                const tableRelation = workbook.Sheets[item.property];
                const tableRelationData =
                  xlsx.utils.sheet_to_json(tableRelation);
                if (tableRelationData.length > 0) {
                  if (item.relation === 'primary') {
                    schemaPrismaContent += `\n  ${toCamel(item.property)}s ${
                      item.property
                    }[]`;

                    models[sheet][toCamel(item.property)] = {
                      type: 'relation-primary',
                      required: false,
                    };
                  } else {
                    schemaPrismaContent += `\n  ${toCamel(item.property)} ${
                      item.property
                    }?  @relation(fields: [${toCamel(
                      item.property
                    )}Id], references: [id])`;
                    schemaPrismaContent += `\n  ${
                      item.property.charAt(0).toLowerCase() +
                      item.property.slice(1)
                    }Id Int? @map(name: "${toSnake(item.property)}_id")`;

                    models[sheet][toCamel(item.property)] = {
                      type: 'relation-secondary',
                      required: true,
                    };
                  }
                }
              }
            }
          });

          schemaPrismaContent += `\n  createdAt DateTime @default(now())`;
          schemaPrismaContent += `\n  updatedAt DateTime? @updatedAt`;
          schemaPrismaContent += `\n  deletedAt DateTime?`;
          schemaPrismaContent += `\n\n @@map(name: "${sheet.toLowerCase()}s") \n`;
          schemaPrismaContent += '}\n\n';
        }

        sheetData.forEach((element) => {
          if (element['metadataLabel']) {
            models[sheet][toCamel(element['property'])]['metadataLabel'] =
              element['metadataLabel'];
          }
        });
      });

      fs.writeFileSync(path.join(destinationPath, 'prisma/schema.prisma'), schemaPrismaContent);

      console.log('The file was generated successfully');

      return models;
    } catch (error) {
      console.error('Something went wrong:', error);
    }
  }
}
