import { describe, it, expect } from "vitest";
import sql, { empty, join, bulk, raw, type SqlQuery } from "./index.js";

describe("sql template tag for BigQuery", () => {
  it("should generate query", () => {
    const query = sql`SELECT * FROM books`;

    expect(query.query).toEqual("SELECT * FROM books");
    expect(query.params).toEqual([]);
  });

  it("should embed sql in sql", () => {
    const tableName = sql`books`;
    const query = sql`SELECT * FROM ${tableName}`;

    expect(query.query).toEqual("SELECT * FROM books");
    expect(query.params).toEqual([]);
  });

  it("should store values", () => {
    const name = "Blake";
    const query = sql`SELECT * FROM books WHERE author = ${name}`;

    expect(query.query).toEqual("SELECT * FROM books WHERE author = ?");
    expect(query.params).toEqual([name]);
  });

  it("should build sql with child sql statements", () => {
    const subquery = sql`SELECT id FROM authors WHERE name = ${"Blake"}`;
    const query = sql`SELECT * FROM books WHERE author_id IN (${subquery})`;

    expect(query.query).toEqual(
      "SELECT * FROM books WHERE author_id IN (SELECT id FROM authors WHERE name = ?)",
    );
    expect(query.params).toEqual(["Blake"]);
  });

  it("should not cache values for compatibility", () => {
    const ids = [1, 2, 3];
    const query = sql`SELECT * FROM books WHERE id IN (${join(
      ids,
    )}) OR author_id IN (${join(ids)})`;

    expect(query.query).toEqual(
      "SELECT * FROM books WHERE id IN (?,?,?) OR author_id IN (?,?,?)",
    );
    expect(query.params).toEqual([1, 2, 3, 1, 2, 3]);
  });

  it('should provide "empty" helper', () => {
    const query = sql`SELECT * FROM books ${empty}`;

    expect(query.query).toEqual("SELECT * FROM books ");
    expect(query.params).toEqual([]);
  });

  it("should throw when values is less than expected", () => {
    expect(() => sql`${"test"} ${"test2"} ${"test3"}`.query).not.toThrow();

    expect(() => {
      const strings = ["", ""];
      const values: any[] = [];
      return (sql as any)(strings, ...values);
    }).toThrowError("Expected 2 strings to have 1 values");
  });

  it("should handle escaped back ticks", () => {
    const query = sql`UPDATE user SET \`name\` = 'Taylor'`;

    expect(query.query).toEqual("UPDATE user SET `name` = 'Taylor'");
  });

  describe("join", () => {
    it("should join list", () => {
      const query = join([1, 2, 3]);

      expect(query.query).toEqual("?,?,?");
      expect(query.params).toEqual([1, 2, 3]);
    });

    it("should error joining an empty list", () => {
      expect(() => join([])).toThrowError(TypeError);
    });

    it("should join sql", () => {
      const query = join(
        [
          sql`user.first_name LIKE ${"Test"}`,
          sql`user.last_name LIKE ${"User"}`,
        ],
        " AND ",
      );

      expect(query.query).toEqual(
        "user.first_name LIKE ? AND user.last_name LIKE ?",
      );
      expect(query.params).toEqual(["Test", "User"]);
    });

    it("should support one term without separators", () => {
      const query = join([sql`user.first_name LIKE ${"Test"}`], " AND ");

      expect(query.query).toEqual("user.first_name LIKE ?");
      expect(query.params).toEqual(["Test"]);
    });

    it("should configure prefix and suffix characters", () => {
      const query = join([1, 2, 3], ",", "(", ")");

      expect(query.query).toEqual("(?,?,?)");
      expect(query.params).toEqual([1, 2, 3]);
    });
  });

  describe("raw", () => {
    it("should accept any string", () => {
      const value = Math.random().toString();
      const query = raw(value);

      expect(query.query).toEqual(value);
      expect(query.params).toEqual([]);
    });
  });

  describe("value typing", () => {
    it.each([
      ["string", "Blake"],
      ["number", 123],
      ["boolean", true],
      ["Date", new Date("2010-01-01T00:00:00Z")],
      ["null", null],
      ["undefined", undefined],
      ["string array", ["Blake", "Taylor"]],
      ["object", { name: "Blake" }],
    ])("should allow using %s as a value", (_type, value) => {
      const query = sql`UPDATE user SET any_value = ${value}`;
      expect(query.params).toEqual([value]);
    });
  });

  describe("bulk", () => {
    it("should join nested list", () => {
      const query = bulk([
        [1, 2, 3],
        [5, 2, 3],
      ]);

      expect(query.query).toEqual("(?,?,?),(?,?,?)");
      expect(query.params).toEqual([1, 2, 3, 5, 2, 3]);
    });

    it("should error joining an empty list", () => {
      expect(() => bulk([])).toThrowError(TypeError);
    });

    it("should error joining an nested empty list", () => {
      expect(() => bulk([[]])).toThrowError(TypeError);
    });

    it("should error joining an nested non uniform list", () => {
      expect(() => bulk([[1, 2], [1, 3], [1]])).toThrowError(TypeError);
    });
  });

  describe("BigQuery integration", () => {
    it("should handle reused parameters correctly", () => {
      const userId = 123;
      const query = sql`SELECT * FROM books WHERE author_id = ${userId} OR editor_id = ${userId}`;

      expect(query.query).toEqual(
        "SELECT * FROM books WHERE author_id = ? OR editor_id = ?",
      );
      expect(query.params).toEqual([123, 123]);
    });

    it("should handle multiple reused parameters correctly", () => {
      const userId = 123;
      const status = "active";
      const query = sql`SELECT * FROM books WHERE (author_id = ${userId} AND status = ${status}) OR (editor_id = ${userId} AND status = ${status})`;

      expect(query.query).toEqual(
        "SELECT * FROM books WHERE (author_id = ? AND status = ?) OR (editor_id = ? AND status = ?)",
      );
      expect(query.params).toEqual([123, "active", 123, "active"]);
    });

    it("should generate query and params for BigQuery", () => {
      const query = sql`SELECT * FROM books WHERE id = ${123}`;

      expect(query.query).toEqual("SELECT * FROM books WHERE id = ?");
      expect(query.params).toEqual([123]);
    });

    it("should generate query and params with multiple parameters", () => {
      const name = "Blake";
      const age = 30;
      const query = sql`SELECT * FROM users WHERE name = ${name} AND age = ${age}`;

      expect(query.query).toEqual(
        "SELECT * FROM users WHERE name = ? AND age = ?",
      );
      expect(query.params).toEqual([name, age]);
    });

    it("should generate query and params with nested SQL", () => {
      const subquery = sql`SELECT id FROM authors WHERE name = ${"Blake"}`;
      const query = sql`SELECT * FROM books WHERE author_id IN (${subquery})`;

      expect(query.query).toEqual(
        "SELECT * FROM books WHERE author_id IN (SELECT id FROM authors WHERE name = ?)",
      );
      expect(query.params).toEqual(["Blake"]);
    });

    it("should work with join in query format", () => {
      const ids = [1, 2, 3];
      const query = sql`SELECT * FROM books WHERE id IN (${join(ids)})`;

      expect(query.query).toEqual("SELECT * FROM books WHERE id IN (?,?,?)");
      expect(query.params).toEqual([1, 2, 3]);
    });

    it("should work with bulk in query format", () => {
      const data = [
        ["Blake", 30],
        ["Taylor", 25],
      ];
      const query = sql`INSERT INTO users (name, age) VALUES ${bulk(data)}`;

      expect(query.query).toEqual(
        "INSERT INTO users (name, age) VALUES (?,?),(?,?)",
      );
      expect(query.params).toEqual(["Blake", 30, "Taylor", 25]);
    });

    it("should handle complex nested queries", () => {
      const userId = 123;
      const minAge = 18;
      const subquery = sql`SELECT book_id FROM user_books WHERE user_id = ${userId}`;
      const query = sql`SELECT * FROM books WHERE id IN (${subquery}) AND age >= ${minAge}`;

      expect(query.query).toEqual(
        "SELECT * FROM books WHERE id IN (SELECT book_id FROM user_books WHERE user_id = ?) AND age >= ?",
      );
      expect(query.params).toEqual([userId, minAge]);
    });

    it("should work directly with BigQuery query interface", () => {
      const query = sql`SELECT * FROM books WHERE id = ${123} AND name = ${"test"}`;

      expect(query.query).toEqual(
        "SELECT * FROM books WHERE id = ? AND name = ?",
      );
      expect(query.params).toEqual([123, "test"]);
    });

    it("should return a plain object that BigQuery can use directly", () => {
      const query = sql`SELECT * FROM books WHERE id = ${123}`;

      // Ensure it's a plain object, not a class instance
      expect(Object.getPrototypeOf(query)).toBe(Object.prototype);
      expect(query.constructor).toBe(Object);

      // Ensure it has exactly the properties BigQuery expects
      expect(Object.keys(query).sort()).toEqual(["params", "query"]);
    });
  });
});
