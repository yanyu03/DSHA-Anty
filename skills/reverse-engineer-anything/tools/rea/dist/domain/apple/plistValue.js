import { types } from "node:util";
import { z } from "zod";
import { UnknownPlistReal } from "./plistNumbers.js";
/**
 * Maximum plist value nesting the JSON projection supports. The XML decode
 * preflight shares this limit so oversized documents are rejected before any
 * recursive pass rather than during one.
 */
export const MAX_PLIST_DEPTH = 128;
/** Limitation for results whose plist held dates the decoder could not represent. */
export const unknownDateLimitation = (count) => `${String(count)} date value(s) are reported as { "$plist_type": "date", "iso8601": null } because the decoder could not represent them, such as XML dates with years beyond 9999 or negative years, or dates outside the JavaScript date range.`;
/** Limitation for known non-finite values; the labels do not imply XML provenance. */
export const nonFiniteRealLimitation = (count) => `${String(count)} non-finite real value(s) are reported as { "$plist_type": "real", "value": "<spelling>" } using canonical numeric labels nan, +infinity or -infinity because a JSON number cannot carry them.`;
/** Limitation for XML numeric values the decoder could not establish. */
export const unknownRealLimitation = (count) => `${String(count)} numeric value(s) are reported as { "$plist_type": "real", "value": null } because XML numeric decoding could not establish their value identity.`;
/** The typed scalar that keeps a negative-zero real distinct from positive zero. */
export const negativeZeroReal = () => ({
    $plist_type: "real",
    value: "-0",
});
/** Limitation for results whose plist held negative-zero reals. */
export const negativeZeroRealLimitation = (count) => `${String(count)} negative-zero real value(s) are reported as { "$plist_type": "real", "value": "-0" } because a JSON number cannot carry the sign of zero.`;
/**
 * Project a decoded plist into JSON. Data, dates, retained big integers and
 * known non-finite reals become explicit `$plist_type` objects. Unresolved XML
 * numeric values remain explicit unknowns, and a negative-zero
 * real keeps its sign, which JSON serialization would drop.
 */
export const projectPlistValue = (value, 
/** Observe generated wrappers before consumers classify the JSON value tree. */
onWrappedScalar) => {
    let nonFiniteRealCount = 0;
    let unknownRealCount = 0;
    let negativeZeroRealCount = 0;
    let unknownDateCount = 0;
    const scalar = (value) => {
        onWrappedScalar?.(value);
        return value;
    };
    const project = (item, depth) => {
        if (depth > MAX_PLIST_DEPTH)
            throw new RangeError(`Plist exceeds ${String(MAX_PLIST_DEPTH)} nesting levels`);
        if (item !== null && typeof item === "object" && types.isProxy(item))
            throw new TypeError("Plist values cannot contain proxies");
        if (item instanceof Uint8Array)
            return scalar({
                $plist_type: "data",
                base64: Buffer.from(item).toString("base64"),
            });
        if (item instanceof UnknownPlistReal) {
            unknownRealCount += 1;
            return scalar({ $plist_type: "real", value: null });
        }
        if (item instanceof Date) {
            if (!Number.isNaN(Date.prototype.getTime.call(item)))
                return scalar({
                    $plist_type: "date",
                    iso8601: Date.prototype.toISOString.call(item),
                });
            unknownDateCount += 1;
            return scalar({ $plist_type: "date", iso8601: null });
        }
        if (typeof item === "number" && !Number.isFinite(item)) {
            nonFiniteRealCount += 1;
            const label = Number.isNaN(item)
                ? "nan"
                : item > 0
                    ? "+infinity"
                    : "-infinity";
            return scalar({ $plist_type: "real", value: label });
        }
        // Integer decoders never yield -0, so a signed zero here is a real.
        if (typeof item === "number" && Object.is(item, -0)) {
            negativeZeroRealCount += 1;
            return scalar(negativeZeroReal());
        }
        if (typeof item === "bigint")
            return scalar({ $plist_type: "integer", decimal: item.toString() });
        if (Array.isArray(item)) {
            const result = [];
            for (let index = 0; index < item.length; index++) {
                const descriptor = Object.getOwnPropertyDescriptor(item, index);
                if (descriptor === undefined || !Object.hasOwn(descriptor, "value"))
                    throw new TypeError("Plist arrays require dense data properties without accessors");
                result.push(project(descriptor.value, depth + 1));
            }
            return result;
        }
        if (item !== null && typeof item === "object") {
            const entries = [];
            for (const key of Reflect.ownKeys(item)) {
                const descriptor = Object.getOwnPropertyDescriptor(item, key);
                if (descriptor?.enumerable !== true)
                    continue;
                if (typeof key !== "string" || !Object.hasOwn(descriptor, "value"))
                    throw new TypeError("Plist dictionary entries require string keys and data properties");
                entries.push([key, project(descriptor.value, depth + 1)]);
            }
            return Object.fromEntries(entries);
        }
        return z.union([z.string(), z.number(), z.boolean(), z.null()]).parse(item);
    };
    const projected = project(value, 0);
    return {
        value: projected,
        nonFiniteRealCount,
        unknownRealCount,
        negativeZeroRealCount,
        unknownDateCount,
    };
};
