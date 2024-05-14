/* eslint-disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export interface CreateEntityFields {
  /**
   * the ID of the entity in which the fields are created.
   */
  entityId: string;
  /**
   * a list of fields of the entity. assume that 'id', 'createAt', and 'updatedAt' are already created by default so do not include them. When creating a relation, instead of using the form customerId, just send the name 'Customer' with a type 'lookup' - the name of the field must be identical to the name of the related entity. Use the name of the related entity in singular form. When creating relation fields, the related entity should already exist. Create relation fields only on one side of the relation, the other side will be created automatically. Do not create relation fields on both sides.
   */
  fields: {
    /**
     * the name of the field.
     */
    name?: string;
    /**
     * the type of the field.
     */
    type?:
      | "SingleLineText"
      | "MultiLineText"
      | "Email"
      | "WholeNumber"
      | "DateTime"
      | "DecimalNumber"
      | "Lookup"
      | "MultiSelectOptionSet"
      | "OptionSet"
      | "Boolean"
      | "Json"
      | "File";
  }[];
}