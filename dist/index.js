"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.empty = exports.raw = exports.bulk = exports.join = void 0;
/**
 * Type guard to check if value is a SqlQuery object.
 */
function isQueryObject(value) {
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
function processQuery(rawStrings, rawValues) {
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
  const allParams = [];
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
function join(values, separator = ",", prefix = "", suffix = "") {
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
exports.join = join;
/**
 * Create a SQL query for a list of structured values.
 */
function bulk(data, separator = ",", prefix = "", suffix = "") {
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
exports.bulk = bulk;
/**
 * Create raw SQL statement.
 */
function raw(value) {
  return { query: value, params: [] };
}
exports.raw = raw;
/**
 * Placeholder value for "no text".
 */
exports.empty = raw("");
/**
 * Create a SQL object from a template string.
 */
function sql(strings, ...values) {
  return processQuery(strings, values);
}
exports.default = sql;
//# sourceMappingURL=index.js.map
