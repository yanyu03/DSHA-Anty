import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { A as err, M as ok, j as init_result } from "./analysisErrorCore-BIEP7tvF.js";
import { E as parsePlistNonFiniteRealLiteral, T as parsePlistIntegerLiteral, b as UnknownPlistReal, w as init_plistNumbers, x as createPlistNumberCollector } from "./nativeValueTrace-BEZbDieM.js";
import { bt as init_plistValue } from "./toolOutputSchemaGroups-MJ_f-PMK.js";
import { DOMParser, normalizeLineEndings, onErrorStopParsing } from "@xmldom/xmldom";
import { SaxesParser } from "saxes";
import { parseOpenStep } from "plist";

//#region dist/domain/xmlDocument.js
var XmlDocumentParseError, parseXmlDocument;
function init_xmlDocument() {
	return (init_xmlDocument = __esmMin((() => {
		init_result();
		XmlDocumentParseError = class extends Error {
			reason;
			_tag = "XmlDocumentParseError";
			constructor(reason, cause) {
				super(reason === "doctype" ? "XML document types are unsupported" : `XML is not well-formed${cause instanceof Error ? `: ${cause.message}` : ""}`, { cause });
				this.reason = reason;
			}
		};
		parseXmlDocument = (source, policy) => {
			try {
				const syntax = new SaxesParser({
					defaultXMLVersion: "1.0",
					forceXMLVersion: true
				});
				syntax.on("doctype", () => {
					if (policy.doctype === "reject") throw new XmlDocumentParseError("doctype");
				});
				syntax.write(source).close();
				return ok(new DOMParser({
					normalizeLineEndings: policy.lineEndings === "preserve" ? (text) => text : normalizeLineEndings,
					onError: onErrorStopParsing
				}).parseFromString(source, "application/xml"));
			} catch (cause) {
				return err(cause instanceof XmlDocumentParseError ? cause : new XmlDocumentParseError("malformed", cause));
			}
		};
	})))();
}

//#endregion
//#region dist/domain/propertyListXml.js
var decodeXmlPropertyList;
function init_propertyListXml() {
	return (init_propertyListXml = __esmMin((() => {
		init_plistNumbers();
		decodeXmlPropertyList = (document) => {
			const root = document.documentElement;
			if (root?.nodeName !== "plist") throw new TypeError("malformed document. First element should be <plist>");
			const numbers = createPlistNumberCollector();
			const requireContent = (node) => {
				if (node.firstChild === null) throw new TypeError(`Cannot parse "" as ${node.nodeName}`);
				return node.firstChild;
			};
			const textNode = (node) => node.nodeType === node.TEXT_NODE;
			const characterNode = (node) => textNode(node) || node.nodeType === node.CDATA_SECTION_NODE;
			const content = (node, accepts) => {
				let text = "";
				let complete = true;
				for (let child = node.firstChild; child !== null; child = child.nextSibling) {
					if (accepts(child)) text += child.nodeValue ?? "";
					else complete = false;
				}
				return {
					text,
					complete
				};
			};
			const dictionaryKey = (node) => {
				for (let child = node.firstChild; child !== null; child = child.nextSibling) if (child.nodeType === child.ELEMENT_NODE) return String(node.firstChild?.nodeValue ?? null);
				return content(node, characterNode).text;
			};
			const members = function* (node) {
				for (let child = node.firstChild; child !== null; child = child.nextSibling) if (child.nodeType !== child.TEXT_NODE && child.nodeType !== child.CDATA_SECTION_NODE && child.nodeType !== child.COMMENT_NODE) yield child;
			};
			const decode = (node) => {
				switch (node.nodeName) {
					case "plist": return Array.from(members(node), decode);
					case "array": {
						const values = [];
						for (const member of members(node)) {
							const value = decode(member);
							if (value !== null) values.push(value);
						}
						return values;
					}
					case "dict": {
						const entries = [];
						let key;
						for (const child of members(node)) {
							if (key === undefined) {
								if (child.nodeName !== "key") throw new TypeError("Missing key while parsing <dict/>");
								key = dictionaryKey(child);
							} else {
								if (child.nodeName === "key") throw new TypeError("Unexpected <key> while parsing <dict/>. Keys and values must alternate.");
								entries.push([key, decode(child)]);
								key = undefined;
							}
						}
						if (key !== undefined) entries.push([key, ""]);
						return Object.fromEntries(entries);
					}
					case "key": {
						const value = node.firstChild === null ? "" : node.firstChild.nodeValue;
						if (value === "__proto__") throw new TypeError("__proto__ is not a scalar plist key");
						return value;
					}
					case "string": return content(node, characterNode).text;
					case "integer": {
						const first = requireContent(node);
						const literal = content(node, textNode);
						const exact = literal.complete ? parsePlistIntegerLiteral(literal.text) : undefined;
						if (exact === undefined) {
							numbers.markIncomplete();
							const partial = Number.parseInt(first.nodeValue ?? "", 10);
							return !Number.isFinite(partial) ? new UnknownPlistReal() : partial === 0 ? 0 : partial;
						}
						numbers.integer(exact);
						const decoded = Number(exact);
						return Number.isFinite(decoded) ? decoded : exact;
					}
					case "real": {
						requireContent(node);
						const literal = content(node, characterNode);
						if (!literal.complete) numbers.markIncomplete();
						const known = literal.complete ? parsePlistNonFiniteRealLiteral(literal.text) : undefined;
						if (known !== undefined) {
							numbers.real(known);
							return known;
						}
						const value = Number.parseFloat(literal.text);
						if (!Number.isFinite(value)) return new UnknownPlistReal();
						if (literal.complete) numbers.real(value);
						return value;
					}
					case "data": {
						const binary = atob(content(node, textNode).text.replace(/\s+/gu, ""));
						return Uint8Array.from(binary, (character) => character.charCodeAt(0));
					}
					case "date": {
						const value = requireContent(node).nodeValue;
						return new Date(value === null ? 0 : value);
					}
					case "null": return null;
					case "true": return true;
					case "false": return false;
					default: throw new TypeError(`Invalid PLIST tag ${node.nodeName}`);
				}
			};
			const values = Array.from(members(root), decode);
			return {
				value: values.length === 1 ? values[0] : values,
				numberLiterals: numbers.result()
			};
		};
	})))();
}

//#endregion
//#region dist/domain/propertyListKeys.js
var PROTOTYPE_KEY, omittedPrototypeKeysLimitation, omitPrototypeKeys, XML_ENTITIES, decodeXmlText, parseXmlPropertyList, consumeOpenStepSeparator, admitsOpenStepCloser, scanOpenStep, isOpenStepPrototypeKey, skipOpenStepTrivia, skipOpenStepScalar, PLIST_CONTAINER_ELEMENTS, assertXmlPlistDepthWithinLimit;
function init_propertyListKeys() {
	return (init_propertyListKeys = __esmMin((() => {
		init_propertyListXml();
		init_plistNumbers();
		init_plistValue();
		init_xmlDocument();
		PROTOTYPE_KEY = "__proto__";
		omittedPrototypeKeysLimitation = (count) => count === null ? "Dictionary entries keyed __proto__ were omitted because REA results cannot represent that key." : `${String(count)} dictionary ${count === 1 ? "entry" : "entries"} keyed __proto__ ${count === 1 ? "was" : "were"} omitted because REA results cannot represent that key.`;
		omitPrototypeKeys = (value) => {
			let omitted = 0;
			const strip = (item) => {
				if (Array.isArray(item)) return item.map(strip);
				if (item === null || typeof item !== "object" || item instanceof Date || item instanceof Uint8Array || item instanceof UnknownPlistReal) return item;
				return Object.fromEntries(Object.entries(item).flatMap(([name, entry]) => {
					if (name !== PROTOTYPE_KEY) return [[name, strip(entry)]];
					omitted += 1;
					return [];
				}));
			};
			const stripped = strip(value);
			return {
				value: stripped,
				omittedPrototypeKeys: omitted
			};
		};
		XML_ENTITIES = {
			amp: "&",
			apos: "'",
			gt: ">",
			lt: "<",
			quot: "\""
		};
		decodeXmlText = (text) => text.replace(/&(?:#x([\da-f]+)|#(\d+)|([a-z]+));/giu, (entity, hex, decimal, name) => {
			const codePoint = hex !== undefined ? parseInt(hex, 16) : decimal !== undefined ? parseInt(decimal, 10) : undefined;
			if (codePoint !== undefined) return codePoint <= 1114111 ? String.fromCodePoint(codePoint) : entity;
			return name !== undefined && Object.hasOwn(XML_ENTITIES, name) ? XML_ENTITIES[name] : entity;
		});
		parseXmlPropertyList = (text) => {
			const first = text.trimStart()[0];
			if (first === "{" || first === "(") {
				const prototypeKeys = scanOpenStep(text);
				return {
					value: omitPrototypeKeys(parseOpenStep(text)).value,
					numberLiterals: createPlistNumberCollector().result(true),
					omittedPrototypeKeys: prototypeKeys
				};
			}
			const normalized = normalizeLineEndings(text);
			const parsed = parseXmlDocument(normalized, {
				doctype: "allow",
				lineEndings: "preserve"
			});
			if (!parsed.ok) throw parsed.error;
			const document = parsed.value;
			assertXmlPlistDepthWithinLimit(document);
			const decoded = decodeXmlPropertyList(document);
			return {
				...omitPrototypeKeys(decoded.value),
				numberLiterals: decoded.numberLiterals
			};
		};
		consumeOpenStepSeparator = (parent, character) => {
			if (parent?.next === "after-value") {
				parent.next = "key";
				return character === ";" ? "consumed" : "none";
			}
			if (parent?.next !== "equals" && parent?.next !== "separator") return "none";
			if (character !== (parent.next === "equals" ? "=" : ",")) return "invalid";
			parent.next = "value";
			return "consumed";
		};
		admitsOpenStepCloser = (parent, character) => parent?.end === character && parent.next !== "equals" && !(parent.end === "}" && parent.next === "value");
		scanOpenStep = (text) => {
			let prototypeKeys = 0;
			const containers = [];
			const completeValue = () => {
				const parent = containers.at(-1);
				if (parent !== undefined) parent.next = parent.next === "key" ? "equals" : parent.end === "}" ? "after-value" : "separator";
			};
			const assertDepth = () => {
				if (containers.length > 128) throw new RangeError(`Plist exceeds ${String(128)} nesting levels`);
			};
			let cursor = 0;
			while (cursor < text.length) {
				const afterTrivia = skipOpenStepTrivia(text, cursor);
				if (afterTrivia !== cursor) {
					cursor = afterTrivia;
					continue;
				}
				const character = text[cursor] ?? "";
				const parent = containers.at(-1);
				if (character === "}" || character === ")") {
					if (!admitsOpenStepCloser(parent, character)) return prototypeKeys;
					const closed = containers.pop();
					if (closed?.keyStart !== undefined && isOpenStepPrototypeKey(text.slice(closed.keyStart, cursor + 1))) prototypeKeys += 1;
					if (containers.length === 0) return prototypeKeys;
					completeValue();
					cursor += 1;
					continue;
				}
				const separator = consumeOpenStepSeparator(parent, character);
				if (separator === "invalid") return prototypeKeys;
				if (separator === "consumed") {
					cursor += 1;
					continue;
				}
				if (character === "{" || character === "(") {
					assertDepth();
					containers.push({
						end: character === "{" ? "}" : ")",
						next: character === "{" ? "key" : "value",
						...parent?.next === "key" ? { keyStart: cursor } : {}
					});
					cursor += 1;
					continue;
				}
				const end = skipOpenStepScalar(text, cursor);
				if (end === cursor) return prototypeKeys;
				if (parent?.next === "key") {
					if (isOpenStepPrototypeKey(text.slice(cursor, end))) prototypeKeys += 1;
				} else assertDepth();
				cursor = end;
				completeValue();
			}
			return prototypeKeys;
		};
		isOpenStepPrototypeKey = (token) => {
			if (!/^["({<]/u.test(token)) return token === PROTOTYPE_KEY;
			if (token.startsWith("\"") && !token.includes("\\")) return token === `"${PROTOTYPE_KEY}"`;
			try {
				return String(parseOpenStep(token)) === PROTOTYPE_KEY;
			} catch {
				return false;
			}
		};
		skipOpenStepTrivia = (text, cursor) => {
			if (/\s/u.test(text[cursor] ?? "")) return cursor + 1;
			if (!text.startsWith("//", cursor) && !text.startsWith("/*", cursor)) return cursor;
			const line = text[cursor + 1] === "/";
			const end = text.indexOf(line ? "\n" : "*/", cursor + 2);
			return end === -1 ? text.length : end + (line ? 1 : 2);
		};
		skipOpenStepScalar = (text, start) => {
			let cursor = start;
			const character = text[cursor];
			if (character === "\"") {
				cursor += 1;
				while (cursor < text.length) {
					const next = text[cursor];
					cursor += next === "\\" ? 2 : 1;
					if (next === "\"") break;
				}
			} else if (character === "<") {
				const end = text.indexOf(">", cursor + 1);
				cursor = end === -1 ? text.length : end + 1;
			} else {
				while (cursor < text.length && /[a-zA-Z0-9._/$:-]/u.test(text[cursor] ?? "")) cursor += 1;
			}
			return cursor;
		};
		PLIST_CONTAINER_ELEMENTS = new Set([
			"plist",
			"dict",
			"array"
		]);
		assertXmlPlistDepthWithinLimit = (document) => {
			const root = document.documentElement;
			if (root === null) return;
			const pending = [{
				node: root,
				depth: -1
			}];
			while (pending.length > 0) {
				const entry = pending.pop();
				if (entry === undefined) break;
				const { node, depth } = entry;
				if (node.nextSibling !== null) pending.push({
					node: node.nextSibling,
					depth
				});
				if (node.nodeType !== node.ELEMENT_NODE) continue;
				if (node.nodeName !== "key" && depth > 128) throw new RangeError(`Plist exceeds ${String(128)} nesting levels`);
				if (PLIST_CONTAINER_ELEMENTS.has(node.nodeName) && node.firstChild !== null) pending.push({
					node: node.firstChild,
					depth: depth + 1
				});
			}
		};
	})))();
}

//#endregion
export { init_xmlDocument as a, parseXmlPropertyList as i, omitPrototypeKeys as n, parseXmlDocument as o, omittedPrototypeKeysLimitation as r, init_propertyListKeys as t };