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
 * Create a SQL query for a list of values.
 */
export declare function join(
  values: readonly RawValue[],
  separator?: string,
  prefix?: string,
  suffix?: string,
): SqlQuery;
/**
 * Create a SQL query for a list of structured values.
 */
export declare function bulk(
  data: ReadonlyArray<ReadonlyArray<RawValue>>,
  separator?: string,
  prefix?: string,
  suffix?: string,
): SqlQuery;
/**
 * Create raw SQL statement.
 */
export declare function raw(value: string): SqlQuery;
/**
 * Placeholder value for "no text".
 */
export declare const empty: SqlQuery;
/**
 * Create a SQL object from a template string.
 */
export default function sql(
  strings: readonly string[],
  ...values: readonly RawValue[]
): SqlQuery;
