
import { baseLogger } from "@/lib/logger";
import { deepStrip } from "@/lib/schema-map";
import { z } from "zod";

export const recursivelyStripSchema = (schema: z.ZodTypeAny): z.ZodTypeAny => {
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    const strippedShape: Record<string, z.ZodTypeAny> = {};
    for (const key in shape) {
      strippedShape[key] = recursivelyStripSchema(shape[key]);
    }
    return z.object(strippedShape).strip();
  } else if (schema instanceof z.ZodArray) {
    return z.array(recursivelyStripSchema(schema.element));
  } else if (schema instanceof z.ZodOptional) {
    return recursivelyStripSchema(schema.unwrap()).optional();
  } else if (schema instanceof z.ZodNullable) {
    return recursivelyStripSchema(schema.unwrap()).nullable();
  } else if (schema instanceof z.ZodNumber) {
    // Special handling for number fields that might be null
    return z.number().nullable();
  } else {
    return schema;
  }
};

export const validateAndLogExtras = (data: any, schema: z.ZodObject<any> | z.ZodArray<any>): any => {
  try {
    const validatedData = schema.parse(data);
    return validatedData;
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Check if we only have unrecognized keys errors
      const hasOnlyUnrecognizedKeys = error.errors.every(e => e.code === "unrecognized_keys");

      if (hasOnlyUnrecognizedKeys) {
        const strippedSchema = recursivelyStripSchema(schema);
        baseLogger.debug("Using stripped schema for:", data);
        return strippedSchema.parse(data);
      }

      // Log unrecognized fields
      const unrecognizedFields = new Set<string>();
      error.errors.forEach(e => {
        if (e.code === "unrecognized_keys") {
          e.keys.forEach(key => {
            const path = e.path.filter(p => typeof p === "string").join(".");
            const fullPath = path ? `${path}.${key}` : key;
            unrecognizedFields.add(fullPath);
          });
        }
      });
      if (unrecognizedFields.size > 0) {
        baseLogger.warn(`Received unrecognized fields from Strava: ${Array.from(unrecognizedFields).join(", ")}`);
      }

      // If we only have unrecognized key errors, we can safely strip and continue
      if (hasOnlyUnrecognizedKeys) {
        const strippedSchema = deepStrip(schema);
        const validatedData = strippedSchema.parse(data);
        return validatedData;
      }

      // If we have other validation errors, throw them
      // Remove unrecognized key errors from the error object
      const filteredErrors = error.errors.filter(e => e.code !== "unrecognized_keys");
      throw new z.ZodError(filteredErrors);
    }
    throw error;
  }
};