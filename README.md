# SQL Template Tag for BigQuery

[![NPM version][npm-image]][npm-url]
[![NPM downloads][downloads-image]][downloads-url]
[![Build status][build-image]][build-url]
[![Build coverage][coverage-image]][coverage-url]

> ES2015 tagged template string for preparing BigQuery SQL statements.

## Installation

```
npm install sql-template-tag --save
```

## Usage

```js
const sql = require("sql-template-tag").default;
const { empty, join, raw, bulk } = require("sql-template-tag");

const query = sql`SELECT * FROM books WHERE id = ${id}`;

query.query; //=> "SELECT * FROM books WHERE id = ?"
query.params; //=> [id]

// BigQuery usage
const { BigQuery } = require("@google-cloud/bigquery");
const bigquery = new BigQuery();

// The query object works directly with BigQuery
const [rows] = await bigquery.query(query);

// Embed SQL instances inside SQL instances.
const nested = sql`SELECT id FROM authors WHERE name = ${"Blake"}`;
const query = sql`SELECT * FROM books WHERE author_id IN (${nested})`;

// Join and "empty" helpers (useful for nested queries).
sql`SELECT * FROM books ${hasIds ? sql`WHERE ids IN (${join(ids)})` : empty}`;
```

### Join

Accepts an array of values or SQL queries, and returns a query object with the values joined together using the separator.

```js
const query = join([1, 2, 3]);

query.query; //=> "?,?,?"
query.params; //=> [1, 2, 3]
```

**Tip:** You can set the second argument to change the join separator, for example:

```js
join(
  [sql`first_name LIKE ${firstName}`, sql`last_name LIKE ${lastName}`],
  " AND ",
); // => "first_name LIKE ? AND last_name LIKE ?"
```

### Raw

Accepts a string and returns a query object, useful if you want some part of the SQL to be dynamic.

```js
raw("SELECT"); // Returns a query object with { query: "SELECT", params: [] }
```

**Do not** accept user input to `raw`, this will create a SQL injection vulnerability.

### Empty

Simple placeholder value for an empty SQL string. Equivalent to `raw("")`.

### Bulk

Accepts an array of arrays, and returns the query object with the values joined together in a format useful for bulk inserts.

```js
const query = sql`INSERT INTO users (name) VALUES ${bulk([
  ["Blake"],
  ["Bob"],
  ["Joe"],
])}`;

query.query; //=> "INSERT INTO users (name) VALUES (?,?),(?),(?)"
query.params; //=> ["Blake", "Bob", "Joe"]
```

## BigQuery Integration

This package is specifically designed to work with Google Cloud BigQuery. The returned objects are plain JavaScript objects with `query` and `params` properties that BigQuery expects:

```js
const { BigQuery } = require("@google-cloud/bigquery");
const sql = require("sql-template-tag").default;

const bigquery = new BigQuery();
const dataset = bigquery.dataset("my_dataset");

// Create query with parameters
const query = sql`SELECT * FROM \`my_dataset.my_table\` WHERE id = ${123}`;

// Use directly with BigQuery
const [rows] = await dataset.query(query);
```

### TypeScript Support

The package includes full TypeScript support:

```ts
import sql, { SqlQuery } from "sql-template-tag";

const query: SqlQuery = sql`SELECT * FROM books WHERE id = ${123}`;
// query.query is string
// query.params is Value[]
```

### Stricter TypeScript

If you want stricter TypeScript values, you can define your own type for the values:

```ts
import sql, { type SqlQuery } from "sql-template-tag";

type SupportedValue =
  | string
  | number
  | boolean
  | Date
  | SupportedValue[]
  | { [key: string]: SupportedValue };

function typedSql(
  strings: readonly string[],
  ...values: Array<SupportedValue | SqlQuery>
): SqlQuery {
  return sql(strings, ...values);
}

// Now use typedSql instead of sql for stricter typing
const query = typedSql`SELECT * FROM books WHERE id = ${123}`;
```

## License

MIT

[npm-image]: https://img.shields.io/npm/v/sql-template-tag
[npm-url]: https://npmjs.org/package/sql-template-tag
[downloads-image]: https://img.shields.io/npm/dm/sql-template-tag
[downloads-url]: https://npmjs.org/package/sql-template-tag
[build-image]: https://img.shields.io/github/actions/workflow/status/blakeembrey/sql-template-tag/ci.yml?branch=main
[build-url]: https://github.com/blakeembrey/sql-template-tag/actions/workflows/ci.yml?query=branch%3Amain
[coverage-image]: https://img.shields.io/codecov/c/gh/blakeembrey/sql-template-tag
[coverage-url]: https://codecov.io/gh/blakeembrey/sql-template-tag
