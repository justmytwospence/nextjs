import { baseLogger } from "@/lib/logger";
import { deepStrip } from "@/lib/schema-map";
import { z } from "zod";

export const validateAndLogExtras = <
  T extends z.ZodObject<any> | z.ZodArray<any>
>(
  data: unknown,
  schema: T
): {
  validatedData: z.infer<T>;
  unrecognizedKeys: Set<string>;
} => {
  try {
    const validatedData = schema.parse(data);
    return { validatedData, unrecognizedKeys: new Set<string>() };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const [unrecognizedKeys, otherErrors] = error.errors.reduce<
        [Set<string>, z.ZodIssue[] | null]
      >(
        ([unrecognizedKeys, otherErrors], error) => {
          if (error.code === "unrecognized_keys") {
            const path =
              error.path.filter((p) => typeof p === "string").join(".") +
              (error.path.filter((p) => typeof p === "string").length > 0
                ? "."
                : "");
            error.keys.forEach((key) => unrecognizedKeys.add(`${path}${key}`));
            return [unrecognizedKeys, otherErrors];
          }
          return [
            unrecognizedKeys,
            otherErrors ? [...otherErrors, error] : [error],
          ];
        },
        [new Set<string>(), null]
      );

      if (unrecognizedKeys.size > 0) {
        baseLogger.warn(
          `Received unrecognized fields from Strava: ${Array.from(
            unrecognizedKeys
          ).join(", ")}`
        );
      }

      if (otherErrors) {
        baseLogger.error(
          `Zod validation errors other than unrecognized keys: ${otherErrors}`
        );
        throw new z.ZodError(otherErrors);
      } else {
        const strippedSchema = deepStrip(schema);
        const validatedData = strippedSchema.parse(data);
        return { validatedData, unrecognizedKeys };
      }
    }
    throw error;
  }
};
