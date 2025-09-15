"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.empty =
  exports.raw =
  exports.bulk =
  exports.join =
  exports.Sql =
    void 0;
/**
 * A SQL instance can be nested within each other to build SQL strings.
 */
class Sql {
  constructor(rawStrings, rawValues) {
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
    const valuesLength = rawValues.reduce(
      (len, value) => len + (value instanceof Sql ? value.values.length : 1),
      0,
    );
    this.values = new Array(valuesLength);
    this.strings = new Array(valuesLength + 1);
    this.strings[0] = rawStrings[0];
    // Iterate over raw values, strings, and children. The value is always
    // positioned between two strings, e.g. `index + 1`.
    let i = 0,
      pos = 0;
    while (i < rawValues.length) {
      const child = rawValues[i++];
      const rawString = rawStrings[i];
      // Check for nested `sql` queries.
      if (child instanceof Sql) {
        // Append child prefix text to current string.
        this.strings[pos] += child.strings[0];
        let childIndex = 0;
        while (childIndex < child.values.length) {
          this.values[pos++] = child.values[childIndex++];
          this.strings[pos] = child.strings[childIndex];
        }
        // Append raw string to current string.
        this.strings[pos] += rawString;
      } else {
        this.values[pos++] = child;
        this.strings[pos] = rawString;
      }
    }
  }
  get sql() {
    const len = this.strings.length;
    let i = 1;
    let value = this.strings[0];
    while (i < len) value += `?${this.strings[i++]}`;
    return value;
  }
  get statement() {
    const len = this.strings.length;
    let i = 1;
    let value = this.strings[0];
    while (i < len) value += `:${i}${this.strings[i++]}`;
    return value;
  }
  get text() {
    const len = this.strings.length;
    let i = 1;
    let value = this.strings[0];
    while (i < len) value += `$${i}${this.strings[i++]}`;
    return value;
  }
  get query() {
    return this.sql;
  }
  get params() {
    return this.values;
  }
  inspect() {
    return {
      sql: this.sql,
      statement: this.statement,
      text: this.text,
      query: this.query,
      params: this.params,
      values: this.values,
    };
  }
}
exports.Sql = Sql;
/**
 * Create a SQL query for a list of values.
 */
function join(values, separator = ",", prefix = "", suffix = "") {
  if (values.length === 0) {
    throw new TypeError(
      "Expected `join([])` to be called with an array of multiple elements, but got an empty array",
    );
  }
  return new Sql(
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
    return new Sql(["(", ...Array(item.length - 1).fill(separator), ")"], item);
  });
  return new Sql(
    [prefix, ...Array(values.length - 1).fill(separator), suffix],
    values,
  );
}
exports.bulk = bulk;
/**
 * Create raw SQL statement.
 */
function raw(value) {
  return new Sql([value], []);
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
  return new Sql(strings, values);
}
exports.default = sql;
//# sourceMappingURL=index.js.map
