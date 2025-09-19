/**
 * Values supported by BigQuery.
 */
export type Value = unknown;

/**
 * Plain object structure for BigQuery queries.
 */
export interface SqlQuery {
  query: string;
  params: Value[];
}

/**
 * Supported value or SQL query.
 */
export type RawValue = Value | SqlQuery;

/**
 * Type guard to check if value is a SqlQuery object.
 */
function isQueryObject(value: unknown): value is SqlQuery {
  return (
    typeof value === "object" &&
    value !== null &&
    "query" in value &&
    "params" in value
  );
}

/**
 * Process raw strings and values into a BigQuery-compatible query object.
 */
function processQuery(
  rawStrings: readonly string[],
  rawValues: readonly RawValue[],
): SqlQuery {
  if (rawStrings.length - 1 !== rawValues.length) {
    if (rawStrings.length === 0) {
      throw new TypeError("Expected at least 1 string");
    }

    throw new TypeError(
      `Expected ${rawStrings.length} strings to have ${
        rawStrings.length - 1
      } values`,
    );
  }

  const allParams: Value[] = [];
  let result = rawStrings[0];

  for (let i = 0; i < rawValues.length; i++) {
    const value = rawValues[i];

    if (isQueryObject(value)) {
      // For nested queries, we need to inline the query and add its params
      result += value.query;
      for (const param of value.params) {
        allParams.push(param);
      }
    } else {
      allParams.push(value);
      result += "?";
    }

    result += rawStrings[i + 1];
  }

  return { query: result, params: allParams };
}

/**
 * Create a SQL query for a list of values.
 */
export function join(
  values: readonly RawValue[],
  separator = ",",
  prefix = "",
  suffix = "",
): SqlQuery {
  if (values.length === 0) {
    throw new TypeError(
      "Expected `join([])` to be called with an array of multiple elements, but got an empty array",
    );
  }

  return processQuery(
    [prefix, ...Array(values.length - 1).fill(separator), suffix],
    values,
  );
}

/**
 * Create a SQL query for a list of structured values.
 */
export function bulk(
  data: ReadonlyArray<ReadonlyArray<RawValue>>,
  separator = ",",
  prefix = "",
  suffix = "",
): SqlQuery {
  const length = data.length && data[0].length;

  if (length === 0) {
    throw new TypeError(
      "Expected `bulk([][])` to be called with a nested array of multiple elements, but got an empty array",
    );
  }

  const values = data.map((item, index) => {
    if (item.length !== length) {
      throw new TypeError(
        `Expected \`bulk([${index}][])\` to have a length of ${length}, but got ${item.length}`,
      );
    }

    return processQuery(
      ["(", ...Array(item.length - 1).fill(separator), ")"],
      item,
    );
  });

  return processQuery(
    [prefix, ...Array(values.length - 1).fill(separator), suffix],
    values,
  );
}

/**
 * Create raw SQL statement.
 */
export function raw(value: string): SqlQuery {
  return { query: value, params: [] };
}

/**
 * Placeholder value for "no text".
 */
export const empty = raw("");

/**
 * Create a SQL object from a template string.
 */
export default function sql(
  strings: readonly string[],
  ...values: readonly RawValue[]
): SqlQuery {
  return processQuery(strings, values);
}
