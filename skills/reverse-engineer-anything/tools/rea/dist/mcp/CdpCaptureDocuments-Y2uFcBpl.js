import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { A as err, M as ok, j as init_result } from "./analysisErrorCore-BIEP7tvF.js";
import { l as init_unicodeCodePointOrder, s as compareUnicodeCodePoints } from "./providerOperationHealth-9DRSGM8N.js";
import { a as init_CdpCaptureValues, c as recordValue, f as resourceContentSize, l as recordsValue, n as allowedSanitizedUrl, o as isHttpUrl, r as cdpStringValue, s as numberValue, t as admitRecords, u as requiredRecord } from "./CdpCaptureValues-tNIg-gQK.js";

//#region dist/browser/CdpSnapshotStrings.js
var CDP_EMPTY_STRING_INDEX, cdpSnapshotString, cdpSnapshotValueString;
function init_CdpSnapshotStrings() {
	return (init_CdpSnapshotStrings = __esmMin((() => {
		init_CdpCaptureValues();
		CDP_EMPTY_STRING_INDEX = -1;
		cdpSnapshotString = (strings, index) => {
			const integer = numberValue(index);
			if (integer === undefined || !Number.isSafeInteger(integer) || integer < 0) return undefined;
			return strings[integer];
		};
		cdpSnapshotValueString = (strings, index) => numberValue(index) === CDP_EMPTY_STRING_INDEX ? "" : cdpSnapshotString(strings, index);
	})))();
}

//#endregion
//#region dist/browser/CdpSnapshotNodes.js
var integer, attributes, invalidateParentCycles, snapshotDocumentNodes, snapshotNodeAt;
function init_CdpSnapshotNodes() {
	return (init_CdpSnapshotNodes = __esmMin((() => {
		init_result();
		init_CdpCaptureValues();
		init_CdpSnapshotStrings();
		integer = (value) => {
			const parsed = numberValue(value);
			return parsed !== undefined && Number.isSafeInteger(parsed) ? parsed : undefined;
		};
		attributes = (value, strings) => {
			if (!Array.isArray(value) || value.length % 2 !== 0) return undefined;
			const pairs = [];
			for (let offset = 0; offset < value.length; offset += 2) {
				const name = cdpSnapshotString(strings, value[offset]);
				const text = cdpSnapshotValueString(strings, value[offset + 1]);
				if (name === undefined || text === undefined) return undefined;
				pairs.push([name, text]);
			}
			return pairs;
		};
		invalidateParentCycles = (parents) => {
			const state = new Uint8Array(parents.length);
			const path = [];
			for (let start = 0; start < parents.length; start += 1) {
				if (state[start] !== 0) continue;
				path.length = 0;
				let cursor = start;
				while (cursor >= 0 && state[cursor] === 0) {
					state[cursor] = 1;
					path.push(cursor);
					cursor = parents[cursor] ?? -1;
				}
				if (cursor >= 0 && state[cursor] === 1) for (let index = path.indexOf(cursor); index < path.length; index += 1) parents[path[index]] = undefined;
				for (const index of path) state[index] = 2;
			}
		};
		snapshotDocumentNodes = (value, strings) => {
			const raw = recordValue(value);
			if (raw === undefined || !Array.isArray(raw.nodeType) || !Array.isArray(raw.nodeName) || !Array.isArray(raw.nodeValue) || !Array.isArray(raw.parentIndex) || !Array.isArray(raw.attributes)) return undefined;
			const count = raw.nodeType.length;
			if (raw.nodeName.length !== count || raw.nodeValue.length !== count || raw.parentIndex.length !== count) return undefined;
			const parents = raw.parentIndex.map((value, index) => {
				const parent = integer(value);
				return parent !== undefined && parent >= -1 && parent < count && parent !== index ? parent : undefined;
			});
			invalidateParentCycles(parents);
			const backend = Array.isArray(raw.backendNodeId) ? raw.backendNodeId : [];
			return {
				nodeTypes: raw.nodeType.map((value) => {
					const type = integer(value);
					return type !== undefined && type >= 0 ? type : undefined;
				}),
				nodeNames: raw.nodeName.map((value) => cdpSnapshotString(strings, value)),
				nodeValues: raw.nodeValue.map((value) => cdpSnapshotValueString(strings, value)),
				parents,
				attributes: raw.attributes.slice(0, count).map((value) => attributes(value, strings)),
				backendNodeIds: backend.slice(0, count).map((value) => {
					const id = integer(value);
					return id !== undefined && id > 0 ? id : undefined;
				}),
				excessAttributes: Math.max(0, raw.attributes.length - count)
			};
		};
		snapshotNodeAt = (nodes, index) => {
			const nodeType = nodes.nodeTypes[index];
			const nodeName = nodes.nodeNames[index];
			const nodeValue = nodes.nodeValues[index];
			const parent = nodes.parents[index];
			const attributes = nodes.attributes[index];
			return nodeType === undefined || nodeName === undefined || nodeValue === undefined || parent === undefined || attributes === undefined ? err({
				_tag: "InvalidCdpSnapshotNode",
				index
			}) : ok({
				nodeType,
				nodeName,
				nodeValue,
				parent,
				attributes
			});
		};
	})))();
}

//#endregion
//#region dist/browser/CdpCaptureEventHelpers.js
var isMainFrameNavigation, firstCallFrame, initiatorLocation, exclusionReasonForUrl, integerOrNull, executionContextKey, isJsonContentType, isJsonMediaType, consolePrimitive, BASE64, decodeBase64;
function init_CdpCaptureEventHelpers() {
	return (init_CdpCaptureEventHelpers = __esmMin((() => {
		init_CdpCaptureValues();
		isMainFrameNavigation = (event, mainFrameId) => {
			const params = recordValue(event.params);
			if (params === undefined) return false;
			const frameId = event.method === "Page.frameNavigated" ? cdpStringValue(recordValue(params.frame)?.id) : event.method === "Page.frameRequestedNavigation" || event.method === "Page.navigatedWithinDocument" ? cdpStringValue(params.frameId) : undefined;
			return frameId === mainFrameId;
		};
		firstCallFrame = (value) => recordsValue(value?.callFrames)[0];
		initiatorLocation = (initiator) => {
			let stack = recordValue(initiator?.stack);
			for (let depth = 0; depth < 32 && stack !== undefined; depth += 1) {
				const frame = firstCallFrame(stack);
				if (frame !== undefined) return frame;
				stack = recordValue(stack.parent);
			}
			return cdpStringValue(initiator?.url) === undefined ? undefined : initiator;
		};
		exclusionReasonForUrl = (value) => value === undefined || value === "" ? "unattributed_origin" : isHttpUrl(value) ? "disallowed_origin" : "unsupported_url";
		integerOrNull = (value) => {
			const number = numberValue(value);
			return number === undefined ? null : Math.max(0, Math.trunc(number));
		};
		executionContextKey = (value) => {
			const identifier = numberValue(value);
			return identifier !== undefined && Number.isSafeInteger(identifier) ? String(identifier) : null;
		};
		isJsonContentType = (headers) => {
			if (headers === undefined) return false;
			for (const [name, value] of Object.entries(headers)) if (name.toLowerCase() === "content-type" && isJsonMediaType(cdpStringValue(value))) return true;
			return false;
		};
		isJsonMediaType = (value) => {
			const mediaType = value?.split(";", 1)[0]?.trim().toLowerCase();
			return mediaType === "application/json" || mediaType?.endsWith("+json") === true;
		};
		consolePrimitive = (value) => {
			const type = cdpStringValue(value.type);
			switch (type) {
				case "string": return typeof value.value === "string" ? {
					type,
					text: value.value
				} : undefined;
				case "boolean": return typeof value.value === "boolean" ? {
					type,
					text: String(value.value)
				} : undefined;
				case "number": return typeof value.value === "number" ? {
					type,
					text: String(value.value)
				} : typeof value.unserializableValue === "string" ? {
					type,
					text: value.unserializableValue
				} : undefined;
				case "bigint": return typeof value.unserializableValue === "string" ? {
					type,
					text: value.unserializableValue
				} : undefined;
				case "undefined": return {
					type,
					text: "undefined"
				};
				default: return undefined;
			}
		};
		BASE64 = /^(?:[A-Za-z\d+/]{4})*(?:[A-Za-z\d+/]{2}==|[A-Za-z\d+/]{3}=)?$/u;
		decodeBase64 = (value) => value.length % 4 === 0 && BASE64.test(value) ? Buffer.from(value, "base64") : undefined;
	})))();
}

//#endregion
//#region dist/browser/CdpCaptureDomSvg.js
var SVG_NAMESPACE, XLINK_NAMESPACE, capturedSvgNodeKind, xmlDocument, createDocumentSvgAncestry, domSvgLink, resolveXmlElements, applyDeclarations, xmlnsPrefix, elementNamespace, xlinkHrefValue, svgSourceNode;
function init_CdpCaptureDomSvg() {
	return (init_CdpCaptureDomSvg = __esmMin((() => {
		init_CdpCaptureValues();
		SVG_NAMESPACE = "http://www.w3.org/2000/svg";
		XLINK_NAMESPACE = "http://www.w3.org/1999/xlink";
		capturedSvgNodeKind = (query, result) => {
			const node = recordValue(recordValue(result)?.node);
			if (node?.backendNodeId !== query.backendNodeId || node.nodeName !== query.nodeName || node.nodeType !== 1) return undefined;
			return node.isSVG === undefined ? false : typeof node.isSVG === "boolean" ? node.isSVG : undefined;
		};
		xmlDocument = (nodes) => {
			const documentIndex = nodes.nodeTypes.findIndex((nodeType) => nodeType === 9);
			if (documentIndex < 0) return false;
			if (svgSourceNode(nodes, documentIndex) === undefined || nodes.parents[documentIndex] !== -1) return undefined;
			for (let index = 0; index < nodes.nodeTypes.length; index += 1) {
				if (nodes.nodeTypes[index] !== 1) continue;
				if (nodes.parents[index] !== documentIndex) continue;
				const source = svgSourceNode(nodes, index);
				if (source === undefined) return undefined;
				const name = source.nodeName;
				if (name === "HTML") return false;
				if (name === "html" || name.includes(":")) return true;
				const attributes = source.attributes;
				for (const [attributeName] of attributes) if (xmlnsPrefix(attributeName) !== undefined) return true;
				return false;
			}
			return false;
		};
		createDocumentSvgAncestry = (nodes) => {
			const xml = xmlDocument(nodes);
			return {
				xml,
				xmlLinks: xml === true ? resolveXmlElements(nodes) : new Map()
			};
		};
		domSvgLink = (ancestry, index) => {
			if (ancestry.xml === false) {
				return {
					svgElement: false,
					xmlDocument: false,
					xlinkHref: undefined
				};
			}
			if (ancestry.xml === undefined) {
				return {
					svgElement: false,
					xmlDocument: undefined,
					xlinkHref: undefined
				};
			}
			const resolved = ancestry.xmlLinks.get(index);
			if (resolved === undefined) {
				return {
					svgElement: false,
					xmlDocument: undefined,
					xlinkHref: undefined
				};
			}
			return {
				svgElement: resolved.svgElement,
				xmlDocument: true,
				xlinkHref: resolved.xlinkHref
			};
		};
		resolveXmlElements = (nodes) => {
			const children = new Map();
			const pending = [];
			for (let node = 0; node < nodes.nodeNames.length; node += 1) {
				const parent = nodes.parents[node];
				if (parent === undefined) continue;
				if (parent < 0) pending.push({ node });
				else {
					const siblings = children.get(parent);
					if (siblings === undefined) children.set(parent, [node]);
					else siblings.push(node);
				}
			}
			const bindings = new Map();
			const resolved = new Map();
			while (pending.length > 0) {
				const step = pending.pop();
				if (step === undefined) break;
				if ("restore" in step) {
					for (const { prefix, previous } of step.restore) {
						if (previous === undefined) bindings.delete(prefix);
						else bindings.set(prefix, previous);
					}
					continue;
				}
				const { node } = step;
				const source = svgSourceNode(nodes, node);
				if (source === undefined) continue;
				const attributes = source.attributes;
				const restore = applyDeclarations(bindings, attributes);
				const svgElement = source.nodeType === 1 && elementNamespace(source.nodeName, bindings) === SVG_NAMESPACE;
				resolved.set(node, {
					svgElement,
					xlinkHref: svgElement ? xlinkHrefValue(attributes, bindings) : undefined
				});
				pending.push({ restore });
				for (const child of children.get(node) ?? []) pending.push({ node: child });
			}
			return resolved;
		};
		applyDeclarations = (bindings, attributes) => {
			const restore = [];
			const seen = new Set();
			for (const [name, value] of attributes) {
				const prefix = xmlnsPrefix(name);
				if (prefix === undefined || seen.has(prefix)) continue;
				seen.add(prefix);
				restore.push({
					prefix,
					previous: bindings.get(prefix)
				});
				if (value.length === 0) bindings.delete(prefix);
				else bindings.set(prefix, value);
			}
			return restore;
		};
		xmlnsPrefix = (name) => {
			if (name === undefined) return undefined;
			if (name === "xmlns") return "";
			if (!name.startsWith("xmlns:")) return undefined;
			const prefix = name.slice("xmlns:".length);
			if (prefix.length === 0 || prefix === "xmlns" || prefix.includes(":")) return undefined;
			return prefix;
		};
		elementNamespace = (nodeName, bindings) => {
			if (nodeName === undefined) return "";
			const colon = nodeName.indexOf(":");
			if (colon < 0) return bindings.get("") ?? "";
			const prefix = nodeName.slice(0, colon);
			const local = nodeName.slice(colon + 1);
			if (prefix.length === 0 || local.length === 0 || local.includes(":") || prefix === "xmlns") return "";
			return bindings.get(prefix) ?? "";
		};
		xlinkHrefValue = (attributes, bindings) => {
			const seen = new Set();
			for (const [name, value] of attributes) {
				if (seen.has(name)) continue;
				seen.add(name);
				const colon = name.indexOf(":");
				if (colon <= 0) continue;
				const prefix = name.slice(0, colon);
				const local = name.slice(colon + 1);
				if (local !== "href" || bindings.get(prefix) !== XLINK_NAMESPACE) continue;
				return value;
			}
			return undefined;
		};
		svgSourceNode = (nodes, index) => {
			const nodeType = nodes.nodeTypes[index];
			const nodeName = nodes.nodeNames[index];
			const attributes = nodes.attributes[index];
			return nodeType === undefined || nodeName === undefined || attributes === undefined ? undefined : {
				nodeType,
				nodeName,
				attributes
			};
		};
	})))();
}

//#endregion
//#region dist/browser/CdpCaptureDocuments.js
/** Project one snapshot, requesting bounded batches of SVG identity facts. */
function* captureDom(result, allowedOrigins, input, completeness) {
	const root = requiredRecord(result);
	const strings = Array.isArray(root.strings) ? root.strings.map(cdpStringValue) : [];
	const nodes = [];
	const urls = [];
	const agentHints = [];
	let excludedUrls = 0;
	let total = 0;
	let unresolvedSvgNodes = 0;
	if (!Array.isArray(root.strings)) excludeDocumentEvidence(completeness, "invalid_protocol_value", null);
	for (const document of snapshotDocuments(root.documents, (count) => excludeDocumentEvidence(completeness, "invalid_protocol_value", count))) {
		const documentUrl = cdpSnapshotString(strings, document.documentURL);
		if (documentUrl === undefined) {
			excludeDocumentEvidence(completeness, "invalid_protocol_value");
			continue;
		}
		if (allowedSanitizedUrl(documentUrl, allowedOrigins) === undefined) {
			excludeDocumentEvidence(completeness, exclusionReasonForUrl(documentUrl));
			continue;
		}
		const baseUrlValue = document.baseURL === undefined ? documentUrl : cdpSnapshotValueString(strings, document.baseURL);
		if (baseUrlValue === undefined) {
			excludeDocumentEvidence(completeness, "invalid_protocol_value");
			continue;
		}
		const baseUrl = baseUrlValue || documentUrl;
		const documentNodes = snapshotDocumentNodes(document.nodes, strings);
		if (documentNodes === undefined) {
			excludeDocumentEvidence(completeness, "invalid_protocol_value");
			continue;
		}
		const { nodeTypes, backendNodeIds } = documentNodes;
		if (documentNodes.excessAttributes > 0) excludeDocumentEvidence(completeness, "invalid_protocol_value", documentNodes.excessAttributes);
		const baseIndex = total;
		total += nodeTypes.length;
		const ancestry = createDocumentSvgAncestry(documentNodes);
		const pendingMetadata = [];
		for (let index = 0; index < nodeTypes.length; index += 1) {
			const admitted = snapshotNodeAt(documentNodes, index);
			if (!admitted.ok) {
				excludeDocumentEvidence(completeness, "invalid_protocol_value");
				continue;
			}
			const { nodeType, nodeName, nodeValue, parent, attributes } = admitted.value;
			const nodeIndex = baseIndex + index;
			const attributeNames = [...new Set(attributes.map(([name]) => name))];
			const svgLink = domSvgLink(ancestry, index);
			if (svgLink.xmlDocument === undefined) completeness?.exclude("metadata", "invalid_protocol_value");
			let svgQuery;
			if (svgLink.xmlDocument === false && nodeType === 1 && attributeNames.includes("xlink:href") && !attributeNames.includes("href")) {
				const backendNodeId = backendNodeIds[index];
				svgQuery = backendNodeId !== undefined ? {
					backendNodeId,
					nodeName
				} : null;
			}
			nodes.push({
				index: nodeIndex,
				parent_index: parent < 0 ? -1 : baseIndex + parent,
				node_type: nodeType,
				node_name: nodeName,
				node_value_length: nodeValue.length,
				attribute_names: attributeNames
			});
			pendingMetadata.push({
				svgQuery,
				options: {
					attributes,
					baseUrl: nodeName.toLowerCase() === "base" ? documentUrl : baseUrl,
					documentUrl,
					nodeIndex,
					nodeName,
					allowedOrigins,
					...svgLink
				}
			});
			if (pendingMetadata.length === DOM_METADATA_BATCH_SIZE || index === nodeTypes.length - 1) {
				const metadata = yield* captureDomMetadata(pendingMetadata, completeness);
				urls.push(...metadata.urls);
				agentHints.push(...metadata.agentHints);
				excludedUrls += metadata.excludedUrls;
				unresolvedSvgNodes += metadata.unresolvedSvgNodes;
				pendingMetadata.length = 0;
			}
		}
		if (pendingMetadata.length > 0) {
			const metadata = yield* captureDomMetadata(pendingMetadata, completeness);
			urls.push(...metadata.urls);
			agentHints.push(...metadata.agentHints);
			excludedUrls += metadata.excludedUrls;
			unresolvedSvgNodes += metadata.unresolvedSvgNodes;
			pendingMetadata.length = 0;
		}
	}
	return {
		total,
		nodes,
		urls,
		agentHints,
		excludedUrls,
		unresolvedSvgNodes
	};
}
function* captureDomMetadata(pending, completeness) {
	const queries = pending.flatMap(({ svgQuery }) => svgQuery == null ? [] : [svgQuery]);
	const kinds = queries.length > 0 ? yield queries : [];
	const urls = [];
	const agentHints = [];
	let queryIndex = 0;
	let unresolvedSvgNodes = 0;
	let excludedUrls = 0;
	for (const { options, svgQuery } of pending) {
		let svgElement = options.svgElement;
		if (svgQuery !== undefined) {
			const kind = svgQuery === null ? undefined : kinds[queryIndex++];
			svgElement = kind === true;
			if (kind === undefined) {
				unresolvedSvgNodes += 1;
				completeness?.exclude("metadata", "provider_unavailable");
			}
		}
		const metadata = domMetadata({
			...options,
			svgElement
		});
		for (const url of metadata.urls) {
			urls.push(url);
			if (url.destination_scope !== "approved") {
				excludedUrls += 1;
				completeness?.exclude("metadata", url.destination_scope === "outside_policy" ? "disallowed_origin" : "unsupported_url");
			}
		}
		agentHints.push(...metadata.agentHints);
	}
	return {
		urls,
		agentHints,
		unresolvedSvgNodes,
		excludedUrls
	};
}
var captureFrames, mainFrameUrl, captureResources, frameTreeResources, walkFrameTrees, DOM_METADATA_BATCH_SIZE, excludeDocumentEvidence, snapshotDocuments, captureAccessibility, ACCESSIBILITY_STATE_NAMES, accessibilityStates, axText, hrefAttributeValue, domMetadata, domDestination, domUrlAttributes, agentRelValues;
function init_CdpCaptureDocuments() {
	return (init_CdpCaptureDocuments = __esmMin((() => {
		init_CdpCaptureValues();
		init_CdpSnapshotStrings();
		init_CdpSnapshotNodes();
		init_CdpCaptureEventHelpers();
		init_CdpCaptureDomSvg();
		init_unicodeCodePointOrder();
		captureFrames = (result, allowedOrigins, maximum, completeness) => {
			const root = recordValue(recordValue(result)?.frameTree);
			if (root === undefined) {
				completeness?.exclude("frames", "invalid_protocol_value");
				return { items: [] };
			}
			const items = [];
			for (const tree of walkFrameTrees(root, (omittedCount) => completeness?.exclude("frames", "invalid_protocol_value", omittedCount))) {
				const frame = recordValue(tree.frame);
				const frameId = cdpStringValue(frame?.id);
				const sanitized = allowedSanitizedUrl(frame?.url, allowedOrigins);
				if (frame === undefined || frameId === undefined) {
					completeness?.exclude("frames", "invalid_protocol_value");
					continue;
				}
				if (sanitized === undefined || sanitized.origin === null) {
					completeness?.exclude("frames", exclusionReasonForUrl(cdpStringValue(frame.url)));
					continue;
				}
				if (maximum !== undefined && items.length >= maximum) continue;
				const parentFrameId = cdpStringValue(frame.parentId);
				if ((tree !== root || Object.hasOwn(frame, "parentId")) && (parentFrameId === undefined || parentFrameId.length === 0)) completeness?.exclude("frames", "invalid_protocol_value");
				items.push({
					frame_id: frameId,
					parent_frame_id: parentFrameId ?? null,
					url: sanitized.url,
					origin: sanitized.origin
				});
			}
			return { items };
		};
		mainFrameUrl = (result) => cdpStringValue(recordValue(recordValue(requiredRecord(result).frameTree)?.frame)?.url);
		captureResources = (result, allowedOrigins, completeness) => {
			const root = recordValue(recordValue(result)?.frameTree);
			if (root === undefined) {
				completeness?.exclude("resources", "invalid_protocol_value");
				return { items: [] };
			}
			const items = [];
			for (const resource of frameTreeResources(root, (count) => completeness?.exclude("resources", "invalid_protocol_value", count))) {
				const url = allowedSanitizedUrl(resource.url, allowedOrigins);
				if (url === undefined || url.origin === null) {
					completeness?.exclude("resources", exclusionReasonForUrl(cdpStringValue(resource.url)));
					continue;
				}
				const type = cdpStringValue(resource.type);
				const mimeType = cdpStringValue(resource.mimeType);
				if (type === undefined || type.length === 0 || mimeType === undefined) {
					completeness?.exclude("resources", "invalid_protocol_value");
					continue;
				}
				const contentSize = resourceContentSize(resource.contentSize);
				if (!contentSize.ok) completeness?.exclude("resources", "invalid_protocol_value");
				items.push({
					rawUrl: cdpStringValue(resource.url) ?? "",
					url: url.url,
					origin: url.origin,
					type,
					mime_type: mimeType,
					content_size: contentSize.ok ? contentSize.value : null
				});
			}
			return { items };
		};
		frameTreeResources = function* (root, onInvalid) {
			for (const tree of walkFrameTrees(root, onInvalid)) {
				if (!Array.isArray(tree.resources)) {
					onInvalid(null);
					continue;
				}
				for (const entry of tree.resources) {
					const resource = recordValue(entry);
					if (resource === undefined) onInvalid(1);
					else yield resource;
				}
			}
		};
		walkFrameTrees = function* (root, onMalformedChild) {
			const pending = [root];
			while (pending.length > 0) {
				const tree = pending.pop();
				if (tree === undefined) return;
				const rawChildren = tree.childFrames;
				if (rawChildren !== undefined && !Array.isArray(rawChildren)) onMalformedChild?.(null);
				const children = Array.isArray(rawChildren) ? rawChildren.flatMap((child) => {
					const parsed = recordValue(child);
					if (parsed === undefined) onMalformedChild?.(null);
					return parsed === undefined ? [] : [parsed];
				}) : [];
				for (let index = children.length - 1; index >= 0; index -= 1) {
					const child = children[index];
					if (child !== undefined) pending.push(child);
				}
				yield tree;
			}
		};
		DOM_METADATA_BATCH_SIZE = 8;
		excludeDocumentEvidence = (completeness, reason, count = 1) => {
			completeness?.exclude("dom", reason, count);
			completeness?.exclude("metadata", reason, count);
		};
		snapshotDocuments = (value, onInvalid) => {
			if (!Array.isArray(value) || value.length === 0) {
				onInvalid(null);
				return [];
			}
			return value.flatMap((item) => {
				const document = recordValue(item);
				if (document === undefined) onInvalid(1);
				return document === undefined ? [] : [document];
			});
		};
		captureAccessibility = (results, options) => {
			const all = results.flatMap((result) => {
				const inventory = admitRecords(requiredRecord(result).nodes);
				if (inventory === undefined) {
					options.completeness?.exclude("accessibility", "invalid_protocol_value", null);
					return [];
				}
				const nodes = [];
				let malformedCount = 0;
				for (const entry of inventory) {
					const node = recordValue(entry);
					if (node === undefined || cdpStringValue(node.nodeId) === undefined || cdpStringValue(node.nodeId)?.length === 0 || typeof node.ignored !== "boolean") {
						malformedCount += 1;
						continue;
					}
					const parentId = cdpStringValue(node.parentId);
					if (node.parentId !== undefined && (parentId === undefined || parentId.length === 0)) malformedCount += 1;
					if (node.childIds !== undefined && (!Array.isArray(node.childIds) || node.childIds.some((childId) => cdpStringValue(childId) === undefined || cdpStringValue(childId)?.length === 0))) malformedCount += 1;
					nodes.push(node);
				}
				if (malformedCount > 0) options.completeness?.exclude("accessibility", "invalid_protocol_value", malformedCount);
				return nodes;
			});
			const nodeIds = new Set(all.flatMap((node) => {
				const nodeId = cdpStringValue(node.nodeId);
				return nodeId === undefined ? [] : [nodeId];
			}));
			let excludedFields = 0;
			const nodes = all.map((node) => {
				const captureText = (value) => {
					const raw = cdpStringValue(recordValue(value)?.value);
					if (raw === undefined) return null;
					if (!options.includeText) {
						excludedFields += 1;
						return null;
					}
					return raw;
				};
				return {
					node_id: cdpStringValue(node.nodeId) ?? "",
					parent_id: cdpStringValue(node.parentId) ?? null,
					role: axText(node.role),
					name: captureText(node.name),
					description: captureText(node.description),
					ignored: node.ignored === true,
					states: accessibilityStates(node.properties)
				};
			});
			return {
				total: all.length,
				nodes,
				hasUnobservedChildren: all.some((node) => Array.isArray(node.childIds) && node.childIds.some((childId) => {
					const id = cdpStringValue(childId);
					return id !== undefined && !nodeIds.has(id);
				})),
				textCapture: {
					status: options.unavailable ? "unavailable" : !options.includeText ? "not_approved" : "included",
					retained_bytes: nodes.reduce((total, node) => total + Buffer.byteLength(node.name ?? "") + Buffer.byteLength(node.description ?? ""), 0),
					excluded_fields: excludedFields
				}
			};
		};
		ACCESSIBILITY_STATE_NAMES = new Set([
			"atomic",
			"autocomplete",
			"busy",
			"checked",
			"disabled",
			"editable",
			"expanded",
			"focusable",
			"focused",
			"hasPopup",
			"hidden",
			"invalid",
			"level",
			"live",
			"modal",
			"multiline",
			"multiselectable",
			"orientation",
			"pressed",
			"readonly",
			"required",
			"selected",
			"valuemax",
			"valuemin"
		]);
		accessibilityStates = (value) => {
			const states = new Map();
			for (const property of recordsValue(value)) {
				const name = cdpStringValue(property.name);
				if (name === undefined || !ACCESSIBILITY_STATE_NAMES.has(name)) continue;
				const raw = recordValue(property.value)?.value;
				const state = typeof raw === "boolean" ? raw : typeof raw === "number" ? numberValue(raw) : typeof raw === "string" ? raw : undefined;
				if (state !== undefined) states.set(name, state);
			}
			return [...states].sort(([left], [right]) => compareUnicodeCodePoints(left, right)).map(([name, state]) => ({
				name,
				value: state
			}));
		};
		axText = (value) => cdpStringValue(recordValue(value)?.value) ?? null;
		hrefAttributeValue = (pairs, attribute, options) => {
			const declared = pairs.get(attribute);
			if (declared !== undefined) return declared;
			if (attribute !== "href" || !options.svgElement) return undefined;
			return options.xmlDocument ? options.xlinkHref : pairs.get("xlink:href");
		};
		domMetadata = (options) => {
			const { attributes, baseUrl, documentUrl, nodeIndex, nodeName, allowedOrigins } = options;
			const pairs = new Map();
			for (const [name, value] of attributes) {
				if (!pairs.has(name)) pairs.set(name, value);
			}
			const urls = [];
			for (const attribute of domUrlAttributes) {
				const value = hrefAttributeValue(pairs, attribute, options);
				if (value === undefined) continue;
				const tagName = nodeName.toLowerCase();
				const usesDocumentUrl = tagName === "form" && attribute === "action" && /^[\t\n\f\r ]*$/u.test(value) || (tagName === "button" || tagName === "input") && attribute === "formaction" && value === "";
				const destination = domDestination(usesDocumentUrl ? documentUrl : value, baseUrl, allowedOrigins);
				urls.push({
					node_index: nodeIndex,
					attribute,
					url: destination.url,
					destination_scope: destination.scope
				});
			}
			const rel = (pairs.get("rel") ?? "").toLowerCase().split(/[\t\n\f\r ]+/u).filter((value) => agentRelValues.includes(value));
			const href = urls.find(({ attribute }) => attribute === "href")?.url ?? null;
			const agentHints = nodeName.toLowerCase() === "link" && rel.length > 0 ? rel.map((declaration) => ({
				mechanism: "dom_link_rel",
				declaration,
				url: href,
				trust: "page-declared-untrusted"
			})) : [];
			return {
				urls,
				agentHints
			};
		};
		domDestination = (value, baseUrl, allowedOrigins) => {
			try {
				const parsed = new URL(value, baseUrl);
				if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return {
					url: null,
					scope: "unsupported"
				};
				if (!allowedOrigins.has(parsed.origin)) return {
					url: null,
					scope: "outside_policy"
				};
				return {
					url: allowedSanitizedUrl(parsed.href, allowedOrigins)?.url ?? null,
					scope: "approved"
				};
			} catch (cause) {
				void cause;
				return {
					url: null,
					scope: "unsupported"
				};
			}
		};
		domUrlAttributes = [
			"href",
			"src",
			"action",
			"formaction",
			"poster"
		];
		agentRelValues = [
			"mcp",
			"model-context",
			"ai-plugin",
			"service-desc"
		];
	})))();
}

//#endregion
export { init_CdpSnapshotNodes as C, init_CdpSnapshotStrings as D, cdpSnapshotString as E, isMainFrameNavigation as S, snapshotNodeAt as T, init_CdpCaptureEventHelpers as _, frameTreeResources as a, isJsonContentType as b, snapshotDocuments as c, init_CdpCaptureDomSvg as d, consolePrimitive as f, firstCallFrame as g, executionContextKey as h, captureResources as i, walkFrameTrees as l, exclusionReasonForUrl as m, captureDom as n, init_CdpCaptureDocuments as o, decodeBase64 as p, captureFrames as r, mainFrameUrl as s, captureAccessibility as t, capturedSvgNodeKind as u, initiatorLocation as v, snapshotDocumentNodes as w, isJsonMediaType as x, integerOrNull as y };