/**
 * Values supported by SQL engine.
 */
export type Value = unknown;
/**
 * Supported value or SQL instance.
 */
export type RawValue = Value | Sql;
/**
 * A SQL instance can be nested within each other to build SQL strings.
 */
export declare class Sql {
  readonly values: Value[];
  readonly strings: string[];
  constructor(rawStrings: readonly string[], rawValues: readonly RawValue[]);
  get sql(): string;
  get statement(): string;
  get text(): string;
  get query(): string;
  get params(): unknown[];
  inspect(): {
    sql: string;
    statement: string;
    text: string;
    query: string;
    params: unknown[];
    values: unknown[];
  };
}
/**
 * Create a SQL query for a list of values.
 */
export declare function join(
  values: readonly RawValue[],
  separator?: string,
  prefix?: string,
  suffix?: string,
): Sql;
/**
 * Create a SQL query for a list of structured values.
 */
export declare function bulk(
  data: ReadonlyArray<ReadonlyArray<RawValue>>,
  separator?: string,
  prefix?: string,
  suffix?: string,
): Sql;
/**
 * Create raw SQL statement.
 */
export declare function raw(value: string): Sql;
/**
 * Placeholder value for "no text".
 */
export declare const empty: Sql;
/**
 * Create a SQL object from a template string.
 */
export default function sql(
  strings: readonly string[],
  ...values: readonly RawValue[]
): Sql;
