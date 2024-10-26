/**
 * Types
 */
export type Models = Record<string, Record<string, Property>>;

/**
 * Interfaces:
 * - ModelField: Represents a field in a model
 * - TypeField: Represents a field in a type
 * - Property: Represents a property of a field
 */
export interface ModelField {
  property: string;
  label: string;
  type: string;
  required: boolean;
  relation?: string;
  default?: string;
  metadataLabel?: string;
}

export interface TypeField {
  name: string;
  description?: string;
  schema: string;
  precision: string;
  validation?: string;
}

export interface Property {
  type:
    | ReturnType<typeof getTypeFromSchema>
    | 'relation-primary'
    | 'relation-secondary';
  required: boolean;
  default?: string;
  description?: string;
  exclude?: boolean;
  subType?: ReturnType<typeof getSubTypeFromSchema>;
  metadataLabel?: string;
}

/**
 * Enums:
 * - SchemaTypesEnum: Represents the type of a field in a schema
 */
export enum SchemaTypesEnum {
  string = 'String',
  boolean = 'Boolean',
  int = 'Int',
  bigint = 'BigInt',
  float = 'Float',
  decimal = 'Decimal',
  dateTime = 'DateTime',
  json = 'Json',
  relation = 'Relation',
}

/**
 * Functions:
 * - getTypeFromSchema: Returns the type of a field based on the schema
 * - getSubTypeFromSchema: Returns the sub-type of a field based on the schema
 * - getSchema: Returns the schema of a field based on the type and required status
 * - getAttributes: Returns the attributes of a field based on the type field and model field
 * - getFieldOptions: Returns the options of a field based on the property
 * - getFieldDecorator: Returns the decorator of a field based on the sub-type and field options
 * - getClassValidatorDecorator: Returns the decorator of a field based on the type and required status
 */
export const getTypeFromSchema = (schema: string) => {
  if (['int', 'bigint', 'float', 'decimal'].includes(schema)) return 'number';
  if (['string', 'json'].includes(schema)) return 'string';
  if (schema === 'boolean') return 'boolean';
  if (schema === 'dateTime') return 'Date';
};

export const getSubTypeFromSchema = (schema: string) => {
  if (['int', 'bigint'].includes(schema)) return SchemaTypesEnum.int;
  if (['float', 'decimal'].includes(schema)) return SchemaTypesEnum.float;

  return undefined;
};

export const getSchema = (schema: string, required: boolean) =>
  `${SchemaTypesEnum[schema as keyof typeof SchemaTypesEnum]}${
    !required ? '?' : ''
  }`;

export const getAttributes = (typeField: TypeField, modelField: ModelField) => {
  const attributes = [];
  if (modelField.label) attributes.push(`@map(name: "${modelField.label}")`);

  if (!modelField.required && modelField.default !== undefined)
    attributes.push(
      `@default(${
        typeof modelField.default === 'string'
          ? `"${modelField.default}"`
          : modelField.default
      })`
    );

  if (
    typeField.schema in SchemaTypesEnum &&
    SchemaTypesEnum[typeField.schema as keyof typeof SchemaTypesEnum] ===
      SchemaTypesEnum.string
  )
    attributes.push(`@db.VarChar(${typeField.precision})`);

  return attributes.join(' ');
};

export function getFieldOptions(attributes: Property) {
  const schemaOptions = {
    ...(!attributes.required && { nullable: true }),
    ...(attributes.default && { defaultValue: attributes.default }),
    ...(attributes.description && { description: attributes.description }),
  };

  return Object.keys(schemaOptions).length
    ? `, ${JSON.stringify(schemaOptions, null, 2)}`
    : '';
}

export function getFieldDecorator(
  subType: Property['subType'],
  fieldOptions: string
) {
  return {
    boolean: `  @Field(() => Boolean${fieldOptions})\n`,
    number: `  @Field(() => ${subType}${fieldOptions})\n`,
    string: `  @Field(${fieldOptions.substring(2)})\n`,
    Date: `  @Field(() => Date${fieldOptions})\n`,
  };
}

export function getClassValidatorDecorator(
  type: Exclude<
    Property['type'],
    'relation-primary' | 'relation-secondary' | undefined
  >,
  required: boolean
) {
  return (
    {
      boolean: `  @IsBoolean()\n`,
      number: `  @IsNumber()\n`,
      string: `  @IsString()\n`,
      Date: `  @IsDate()\n`,
    }[type] + (required ? `  @IsNotEmpty()\n` : '  @IsOptional()\n')
  );
}
