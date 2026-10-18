import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { hasBinaryPlistSignature, init_appleArchiveFormat } from "./appleArchiveFormat-Bb3G5CCI.js";
import { posix, win32 } from "node:path";

//#region dist/filesystem/callerPath.js
var absoluteCallerPath;
function init_callerPath() {
	return (init_callerPath = __esmMin((() => {
		absoluteCallerPath = (path, { cwd = process.cwd(), platform = process.platform } = {}) => {
			if (platform === "win32") return win32.resolve(cwd, path);
			if (!posix.isAbsolute(path)) {
				const base = posix.isAbsolute(cwd) ? cwd : absoluteCallerPath(cwd, { platform });
				return absoluteCallerPath(`${base}/${path}`, { platform });
			}
			const segments = path.split("/").filter((segment) => segment !== "" && segment !== ".");
			const directory = /\/\.?$/u.test(path) && segments.length > 0;
			return `/${segments.join("/")}${directory ? "/" : ""}`;
		};
	})))();
}

//#endregion
//#region dist/domain/propertyListXmlText.js
var XmlPlistTextDecodeError, decodeXmlPlistText;
function init_propertyListXmlText() {
	return (init_propertyListXmlText = __esmMin((() => {
		XmlPlistTextDecodeError = class extends TypeError {
			reason;
			declaredEncoding;
			constructor(reason, message, declaredEncoding, options) {
				super(message, options);
				this.reason = reason;
				this.declaredEncoding = declaredEncoding;
				this.name = "XmlPlistTextDecodeError";
			}
		};
		decodeXmlPlistText = (bytes) => {
			const encoding = bytes[0] === 255 && bytes[1] === 254 ? "utf-16le" : bytes[0] === 254 && bytes[1] === 255 ? "utf-16be" : "utf-8";
			let text;
			try {
				text = new TextDecoder(encoding, { fatal: true }).decode(bytes);
			} catch (cause) {
				throw new XmlPlistTextDecodeError("invalid-bytes", "XML text bytes are invalid for the detected encoding", undefined, { cause });
			}
			const declaration = /^<\?xml\s[^?]*\bencoding\s*=\s*["']([^"']+)["']/u.exec(text)?.[1];
			const declared = declaration?.toLowerCase();
			if (declared !== undefined && ![
				"utf-8",
				"utf-16",
				"utf-16le",
				"utf-16be"
			].includes(declared)) throw new XmlPlistTextDecodeError("unsupported-encoding", `Unsupported XML encoding declaration: ${declaration}. Supported encodings are UTF-8 and BOM-marked UTF-16 in either byte order.`, declaration);
			if (declared !== undefined && declared !== encoding && !(encoding !== "utf-8" && declared === "utf-16")) throw new XmlPlistTextDecodeError("encoding-mismatch", "XML encoding declaration disagrees with its bytes", declaration);
			return text;
		};
	})))();
}

//#endregion
//#region dist/artifacts/apple/InterfaceBuilderDecodeBudget.js
/** Consume each XML span once; malformed tokens cannot restart suffix scans. */
function* xmlPreflightTokens(xml) {
	let cursor = 0;
	while (cursor < xml.length) {
		const start = xml.indexOf("<", cursor);
		if (start < 0) return;
		const opaqueEnd = xml.startsWith("<!--", start) ? "-->" : xml.startsWith("<![CDATA[", start) ? "]]>" : xml.startsWith("<?", start) ? "?>" : undefined;
		if (opaqueEnd !== undefined) {
			const end = xml.indexOf(opaqueEnd, start + 2);
			if (end < 0) return;
			cursor = end + opaqueEnd.length;
			continue;
		}
		const doctype = /^<!DOCTYPE\b/iu.test(xml.slice(start, start + 10));
		const element = /^<\/?[A-Za-z]/u.test(xml.slice(start, start + 4));
		let quote;
		let internalSubset = false;
		let end = start + 1;
		for (; end < xml.length; end += 1) {
			const character = xml[end];
			if (quote !== undefined) {
				if (character === quote) quote = undefined;
			} else if (character === "\"" || character === "'") quote = character;
			else if (character === ">") break;
			else if (doctype && character === "[") internalSubset = true;
		}
		if (end === xml.length) return;
		cursor = end + 1;
		if (doctype || element) yield {
			doctype,
			internalSubset
		};
	}
}
var InterfaceBuilderDecodeBudgetExceeded, InterfaceBuilderDecodeBudget, preflightPropertyListDecode, estimateXmlPlistExpansion, interfaceBuilderBudgetFailure, PROTOTYPE_KEY, estimateBinaryPlistExpansion;
function init_InterfaceBuilderDecodeBudget() {
	return (init_InterfaceBuilderDecodeBudget = __esmMin((() => {
		init_propertyListXmlText();
		init_appleArchiveFormat();
		InterfaceBuilderDecodeBudgetExceeded = class extends Error {
			reason;
			constructor(reason, message) {
				super(message);
				this.reason = reason;
				this.name = "InterfaceBuilderDecodeBudgetExceeded";
			}
		};
		InterfaceBuilderDecodeBudget = class {
			#initialBytes;
			#remainingBytes;
			constructor(maxBytes) {
				this.#initialBytes = maxBytes;
				this.#remainingBytes = maxBytes;
			}
			/** Representation bytes still available for the current inspection. */
			get remainingBytes() {
				return this.#remainingBytes;
			}
			/** Representation bytes reserved so far. */
			get usedBytes() {
				return this.#initialBytes - this.#remainingBytes;
			}
			/** Reserve representation bytes before allocation, or report exhaustion. */
			reserve(bytes, message) {
				if (!Number.isSafeInteger(bytes) || bytes < 0 || bytes > this.#remainingBytes) throw new InterfaceBuilderDecodeBudgetExceeded("aggregate_decode_budget_exhausted", message);
				this.#remainingBytes -= bytes;
			}
			/** Return a reservation whose representation was rejected and not retained. */
			release(bytes) {
				this.#remainingBytes = Math.min(this.#initialBytes, this.#remainingBytes + bytes);
			}
			/** Reserve an upper bound for one JSON-serialized string occurrence. */
			reserveJsonStringOccurrence(value) {
				this.reserve(value.length * 6 + 2, "projected JSON strings exceed the aggregate Interface Builder decode budget");
			}
			/** Reserve the exact JSON string length for a base64 value from Buffer. */
			reserveBase64JsonStringOccurrence(value) {
				this.reserve(value.length + 2, "projected NIB base64 values exceed the aggregate Interface Builder decode budget");
			}
			/** Reserve an upper bound for one JSON object property name occurrence. */
			reserveJsonPropertyNameOccurrence(value) {
				this.reserve(value.length * 6 + 3, "projected JSON property names exceed the aggregate Interface Builder decode budget");
			}
			/** Reserve bytes for an optional projection without throwing on exhaustion. */
			tryReserve(bytes) {
				if (!Number.isSafeInteger(bytes) || bytes < 0 || bytes > this.#remainingBytes) return false;
				this.#remainingBytes -= bytes;
				return true;
			}
		};
		preflightPropertyListDecode = (bytes, maxBytes, xmlText, options = {}) => {
			const { numberProjection = false } = options;
			const expansion = hasBinaryPlistSignature(bytes) ? estimateBinaryPlistExpansion(bytes, maxBytes, { numberProjection }) : {
				estimatedBytes: estimateXmlPlistExpansion(bytes, maxBytes, xmlText, numberProjection),
				binaryPrototypeKeyObserved: false
			};
			if (expansion.estimatedBytes > maxBytes) throw new InterfaceBuilderDecodeBudgetExceeded("aggregate_decode_budget_exhausted", "plist representation exceeds the aggregate Interface Builder decode budget");
			return expansion;
		};
		estimateXmlPlistExpansion = (bytes, maxBytes, xmlText, numberProjection = false) => {
			const xml = xmlText ?? decodeXmlPlistText(bytes);
			const decodedSourceBytes = xml.length * 2;
			let elementCount = 0;
			const elementBytes = numberProjection ? 256 : 128;
			for (const token of xmlPreflightTokens(xml)) {
				if (token.doctype) {
					if (token.internalSubset) throw new InterfaceBuilderDecodeBudgetExceeded("aggregate_decode_budget_exhausted", "XML plist internal entity expansion exceeds the aggregate Interface Builder decode budget");
					continue;
				}
				elementCount += 1;
				if (decodedSourceBytes * 2 + elementCount * elementBytes > maxBytes) return maxBytes + 1;
			}
			return decodedSourceBytes * 2 + elementCount * elementBytes;
		};
		interfaceBuilderBudgetFailure = (_kind, message) => new InterfaceBuilderDecodeBudgetExceeded("aggregate_decode_budget_exhausted", message);
		PROTOTYPE_KEY = "__proto__";
		estimateBinaryPlistExpansion = (bytes, maxBytes, { budget = "the aggregate Interface Builder decode budget", fail = interfaceBuilderBudgetFailure, bounds = "strict", numberProjection = false } = {}) => {
			if (bytes.length < 40) throw new TypeError("binary plist trailer is truncated");
			const trailer = bytes.length - 32;
			const offsetSize = bytes[trailer + 6] ?? 0;
			const referenceSize = bytes[trailer + 7] ?? 0;
			if (![
				1,
				2,
				4,
				8
			].includes(offsetSize) || ![
				1,
				2,
				4,
				8
			].includes(referenceSize)) throw new TypeError("binary plist trailer integer sizes are invalid");
			const readInteger = (offset, size) => {
				if (offset < 0 || size < 1 || offset + size > bytes.length) return -1;
				let value = 0;
				for (let index = 0; index < size; index += 1) value = value * 256 + (bytes[offset + index] ?? 0);
				return Number.isSafeInteger(value) ? value : -1;
			};
			const objectCount = readInteger(trailer + 8, 8);
			const topObject = readInteger(trailer + 16, 8);
			const offsetTable = readInteger(trailer + 24, 8);
			const tableEnd = bounds === "strict" ? trailer : bytes.length;
			const objectsEnd = bounds === "strict" ? offsetTable : bytes.length;
			if (objectCount < 1 || topObject < 0 || topObject >= objectCount || offsetTable < 8 || offsetTable + objectCount * offsetSize > tableEnd) throw new TypeError("binary plist trailer or object table is invalid");
			const objectBytes = numberProjection ? 144 : 16;
			const expandedNodeBytes = numberProjection ? 224 : 96;
			let estimate = bytes.length * (numberProjection ? 3 : 2) + objectCount * objectBytes;
			let binaryPrototypeKeyObserved = false;
			if (estimate > maxBytes) throw fail("expansion", `binary plist object table exceeds ${budget}`);
			const active = new Set();
			const pending = [{
				object: topObject,
				depth: 0,
				exit: false,
				dictionaryKey: false
			}];
			let pendingObjectCount = 1;
			while (pending.length > 0) {
				const entry = pending.pop();
				if (entry === undefined) break;
				if (entry.exit) {
					active.delete(entry.object);
					continue;
				}
				pendingObjectCount -= 1;
				if (entry.depth > 128) throw fail("depth", `binary plist nesting exceeds ${budget}`);
				if (active.has(entry.object)) throw fail("cycle", `binary plist reference cycle exceeds ${budget}`);
				estimate += expandedNodeBytes;
				if (estimate > maxBytes) throw fail("expansion", `binary plist reference expansion exceeds ${budget}`);
				const offset = readInteger(offsetTable + entry.object * offsetSize, offsetSize);
				if (offset < 8 || offset >= objectsEnd) throw new TypeError("binary plist object offset is invalid");
				const marker = bytes[offset] ?? 0;
				const type = marker >> 4;
				if (entry.dictionaryKey && type !== 5 && type !== 6) throw new TypeError("binary plist dictionary key is not a string");
				let size = marker & 15;
				let cursor = offset + 1;
				if (size === 15 && type !== 0 && type !== 8) {
					const extMarker = bytes[cursor] ?? 0;
					if (extMarker >> 4 !== 1 || (extMarker & 15) > 3) throw new TypeError("binary plist extended object size is invalid");
					cursor += 1;
					const integerSize = 1 << (extMarker & 15);
					size = readInteger(cursor, integerSize);
					cursor += integerSize;
					if (size < 0 || cursor > objectsEnd) throw new TypeError("binary plist extended object size is invalid");
				}
				if (type === 4 || type === 5 || type === 6) {
					const byteLength = type === 6 ? size * 2 : size;
					if (cursor + byteLength > objectsEnd) throw new TypeError("binary plist scalar object is truncated");
					if (!binaryPrototypeKeyObserved && entry.dictionaryKey && (type === 5 || type === 6) && size === PROTOTYPE_KEY.length) {
						let matches = true;
						for (let index = 0; index < PROTOTYPE_KEY.length; index += 1) {
							const codeUnit = type === 5 ? bytes[cursor + index] ?? 0 : (bytes[cursor + index * 2] ?? 0) << 8 | (bytes[cursor + index * 2 + 1] ?? 0);
							if (codeUnit !== PROTOTYPE_KEY.charCodeAt(index)) {
								matches = false;
								break;
							}
						}
						if (matches) binaryPrototypeKeyObserved = true;
					}
					estimate += type === 4 ? size + 4 * Math.ceil(size / 3) : byteLength * 2;
					if (estimate > maxBytes) throw fail("expansion", `binary plist scalar expansion exceeds ${budget}`);
					continue;
				}
				if (type !== 10 && type !== 13) continue;
				const childCount = type === 13 ? size * 2 : size;
				const refsEnd = cursor + childCount * referenceSize;
				if (!Number.isSafeInteger(refsEnd) || refsEnd > objectsEnd) throw new TypeError("binary plist reference table is truncated");
				const availableNodes = Math.floor((maxBytes - estimate) / expandedNodeBytes);
				if (childCount > availableNodes - pendingObjectCount) throw fail("expansion", `binary plist reference expansion exceeds ${budget}`);
				active.add(entry.object);
				pending.push({
					object: entry.object,
					depth: entry.depth,
					exit: true,
					dictionaryKey: false
				});
				for (let index = childCount - 1; index >= 0; index -= 1) {
					const reference = readInteger(cursor + index * referenceSize, referenceSize);
					if (reference < 0 || reference >= objectCount) throw new TypeError("binary plist reference is invalid");
					pending.push({
						object: reference,
						depth: entry.depth + 1,
						exit: false,
						dictionaryKey: type === 13 && index < size
					});
				}
				pendingObjectCount += childCount;
			}
			return {
				estimatedBytes: estimate,
				binaryPrototypeKeyObserved
			};
		};
	})))();
}

//#endregion
export { InterfaceBuilderDecodeBudget, InterfaceBuilderDecodeBudgetExceeded, absoluteCallerPath, decodeXmlPlistText, estimateBinaryPlistExpansion, init_InterfaceBuilderDecodeBudget, init_callerPath, init_propertyListXmlText, preflightPropertyListDecode };