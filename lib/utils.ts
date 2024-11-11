import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type SnakeToCamelCase<S extends string> = S extends `${infer T}_${infer U}`
  ? `${T}${Capitalize<SnakeToCamelCase<U>>}`
  : S;

type ConvertKeysToCamelCase<T> = T extends Array<infer U>
  ? Array<ConvertKeysToCamelCase<U>>
  : T extends object
  ? {
    [K in keyof T as SnakeToCamelCase<string & K>]: T[K] extends object | Array<any>
    ? ConvertKeysToCamelCase<T[K]>
    : T[K];
  }
  : T;

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
}

export function convertKeysToCamelCase<T>(obj: T): ConvertKeysToCamelCase<T> {
  if (Array.isArray(obj)) {
    return obj.map((item) => convertKeysToCamelCase(item)) as ConvertKeysToCamelCase<T>;
  } else if (obj !== null && typeof obj === "object") {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = toCamelCase(key);
      acc[camelKey] = convertKeysToCamelCase((obj as any)[key]);
      return acc;
    }, {} as ConvertKeysToCamelCase<T>);
  }
  return obj as ConvertKeysToCamelCase<T>;
}