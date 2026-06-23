const { z } = require("zod");

/**
 * Builds middleware that validates and sanitizes request input against Zod
 * schemas. Parsed (and coerced) values replace the originals so downstream
 * handlers always receive well-typed data.
 *
 * Critically, this also closes a NoSQL-injection vector: by forcing string
 * fields to be strings, an attacker can no longer pass `{ "$gt": "" }` objects
 * into queries like `User.findOne({ email })`.
 *
 * Usage: router.post("/", validate({ body: schema }), handler)
 */
function validate(schemas) {
  return (req, _res, next) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.params) req.params = schemas.params.parse(req.params);
      if (schemas.query) {
        // req.query is a getter-only property on Express 5; mutate in place.
        const parsed = schemas.query.parse(req.query);
        Object.keys(req.query).forEach((k) => delete req.query[k]);
        Object.assign(req.query, parsed);
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

// Shared schema for Mongo ObjectId route params.
const objectIdParam = (name = "id") =>
  z.object({
    [name]: z.string().regex(/^[a-f\d]{24}$/i, `Invalid ${name}`),
  });

module.exports = { validate, objectIdParam };
