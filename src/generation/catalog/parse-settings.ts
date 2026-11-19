import type { ModelEntry } from "./types";

type Field = ModelEntry["settings"][string];

function isValid(field: Field, value: unknown): boolean {
  if (field.type === "enum") return typeof value === "string" && field.values.includes(value);
  if (field.type === "range") {
    return (
      typeof value === "number" &&
      Number.isFinite(value) &&
      value >= field.min &&
      value <= field.max
    );
  }
  return typeof value === "boolean";
}

/** Strict: the server's gate. A missing value takes the default; a present but
    illegal one is rejected rather than silently rewritten. */
export function parseSettings(
  model: ModelEntry,
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, field] of Object.entries(model.settings)) {
    const value = raw[key] === undefined ? field.default : raw[key];
    if (!isValid(field, value)) throw new Error(`Invalid ${key}`);
    out[key] = value;
  }
  return out;
}

/** Lenient: for values read back from the browser (persisted settings, an old
    run being retried). The catalog can change between visits, so a value it no
    longer allows falls back to the default instead of crashing the studio. */
export function coerceSettings(
  model: ModelEntry,
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, field] of Object.entries(model.settings)) {
    out[key] = isValid(field, raw[key]) ? raw[key] : field.default;
  }
  return out;
}
