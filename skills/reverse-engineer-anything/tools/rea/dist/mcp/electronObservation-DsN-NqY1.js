import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { A as err, D as AnalysisError, M as ok, O as init_analysisErrorBase, f as init_analysisErrorCore, i as AnalysisCancelledError, j as init_result } from "./analysisErrorCore-BIEP7tvF.js";
import { n as init_providerCleanupError, t as ProviderCleanupError } from "./providerCleanupError-DIRHxzWo.js";
import { n as init_canonicalDigest, t as digestCanonicalValue } from "./canonicalDigest-Bi_0_zGi.js";
import { l as init_unicodeCodePointOrder, s as compareUnicodeCodePoints } from "./providerOperationHealth-9DRSGM8N.js";
import { i as init_providerAdapterError, n as init_browserObservationError, r as ProviderAdapterError, t as BrowserObservationError } from "./browserObservationError-C5okJ5el.js";
import { n as init_analysisErrorCleanup, t as analysisErrorWithCleanupFailure } from "./analysisErrorCleanup-Q344SnTO.js";
import { n as init_webContentArtifact, t as createWebTextArtifact } from "./webContentArtifact-DfGkgDcI.js";
import { n as electronTargetListSchema, r as init_electronObservation$1, t as electronPageInspectionSchema } from "./electronObservation-wOYWwqgF.js";
import { a as init_providerIdentities, n as CDP_ELECTRON_PROVIDER_IDENTITY } from "./providerIdentities--ptAh481.js";
import { a as init_CdpEndpoint, i as hasCdpTargetWebSocket, r as discoverCdpEndpoint } from "./CdpEndpoint-BrhMhpSi.js";
import { a as openCdpTargetSession, c as init_CdpTargetSessionOwner, n as closeCdpTargetSession, o as CdpTargetSessionOwner, r as init_CdpTargetSession, s as bindCdpTransportCleanup } from "./CdpTargetSession-BmmDC3XO.js";
import { a as init_CdpCaptureValues, c as recordValue, d as requiredScriptSource, f as resourceContentSize, i as delayWithCancellation, p as scriptMetadataValues, r as cdpStringValue, s as numberValue, u as requiredRecord } from "./CdpCaptureValues-tNIg-gQK.js";
import { C as init_CdpSnapshotNodes, D as init_CdpSnapshotStrings, E as cdpSnapshotString, T as snapshotNodeAt, a as frameTreeResources, c as snapshotDocuments, l as walkFrameTrees, o as init_CdpCaptureDocuments, w as snapshotDocumentNodes } from "./CdpCaptureDocuments-Y2uFcBpl.js";
import { i as init_CdpCaptureCompleteness, n as optionalCdpCommand, r as CdpCaptureCompleteness, t as init_CdpOptionalCommand } from "./CdpOptionalCommand-PZZhlqxv.js";
import { n as init_ElectronFileScope, t as authorizedElectronFile } from "./ElectronFileScope-FXtK0d6I.js";

//#region dist/browser/CdpElectronScriptEvents.js
var ingestElectronScriptEvent, retainExecutionContext, executionContextKey;
function init_CdpElectronScriptEvents() {
	return (init_CdpElectronScriptEvents = __esmMin((() => {
		init_CdpCaptureCompleteness();
		init_CdpCaptureValues();
		ingestElectronScriptEvent = (input) => {
			if (input.event.method === "Runtime.executionContextsCleared") {
				input.executionContextFrames.clear();
				return;
			}
			if (input.event.method === "Runtime.executionContextDestroyed") {
				const parameters = recordValue(input.event.params);
				const key = executionContextKey(parameters?.executionContextId);
				if (key !== null) input.executionContextFrames.delete(key);
				return;
			}
			if (input.event.method === "Runtime.executionContextCreated") {
				retainExecutionContext(input.event, input.executionContextFrames);
				return;
			}
			if (input.event.method !== "Debugger.scriptParsed") return;
			const value = recordValue(input.event.params);
			const scriptId = cdpStringValue(value?.scriptId);
			const rawUrl = cdpStringValue(value?.url);
			if (scriptId === undefined) {
				input.completeness.exclude("scripts", "invalid_protocol_value");
				return;
			}
			if (rawUrl === undefined || rawUrl === "") {
				input.completeness.exclude("scripts", "unattributed_origin");
				return;
			}
			const contextKey = executionContextKey(value?.executionContextId);
			input.scripts.push({
				scriptId,
				rawUrl,
				...scriptMetadataValues(value),
				language: cdpStringValue(value?.scriptLanguage) ?? null,
				frameId: contextKey === null ? null : input.executionContextFrames.get(contextKey) ?? null
			});
		};
		retainExecutionContext = (event, frames) => {
			const parameters = recordValue(event.params);
			const runtimeContext = recordValue(parameters?.context);
			const contextKey = executionContextKey(runtimeContext?.id);
			const frameId = cdpStringValue(recordValue(runtimeContext?.auxData)?.frameId);
			if (contextKey === null || frameId === undefined) return;
			frames.set(contextKey, frameId);
		};
		executionContextKey = (value) => {
			const identifier = numberValue(value);
			return identifier !== undefined && Number.isSafeInteger(identifier) ? String(identifier) : null;
		};
	})))();
}

//#endregion
//#region dist/browser/CdpElectronScripts.js
var captureElectronScripts, captureScriptSource;
function init_CdpElectronScripts() {
	return (init_CdpElectronScripts = __esmMin((() => {
		init_canonicalDigest();
		init_webContentArtifact();
		init_CdpCaptureCompleteness();
		init_CdpCaptureValues();
		init_ElectronFileScope();
		init_unicodeCodePointOrder();
		captureElectronScripts = async (input) => {
			let total = 0;
			const items = [];
			const seen = new Set();
			for (const script of input.scripts) {
				const path = await authorizedElectronFile(script.rawUrl);
				if (path === undefined) {
					input.completeness.exclude("scripts", "out_of_target_scope");
					continue;
				}
				const identity = {
					frame_id: script.frameId !== null && input.frameIds.has(script.frameId) ? script.frameId : null,
					file_path: path,
					cdp_hash: script.hash,
					length: script.length,
					is_module: script.isModule,
					language: script.language
				};
				const scriptKey = `electron_script_${digestCanonicalValue(identity, "CDP capture")}`;
				if (seen.has(scriptKey)) continue;
				seen.add(scriptKey);
				total += 1;
				const capturedSource = await captureScriptSource(input, script);
				items.push({
					script_key: scriptKey,
					...identity,
					source: capturedSource.source
				});
			}
			if (!input.request.include_script_sources) input.completeness.exclude("script_sources", "not_approved", total);
			return {
				total,
				items: items.sort((left, right) => compareUnicodeCodePoints(left.script_key, right.script_key))
			};
		};
		captureScriptSource = async (input, script) => {
			if (!input.request.include_script_sources) return { source: {
				included: false,
				reason: "source capture was not selected"
			} };
			const text = requiredScriptSource(await input.connection.send("Debugger.getScriptSource", { scriptId: script.scriptId }, input.sessionId, input.signal), "inspect_electron_page");
			return { source: {
				included: true,
				artifact: createWebTextArtifact(text, "text/javascript")
			} };
		};
	})))();
}

//#endregion
//#region dist/browser/CdpElectronWorkers.js
var captureElectronWorkers, boundedTargetField;
function init_CdpElectronWorkers() {
	return (init_CdpElectronWorkers = __esmMin((() => {
		init_CdpCaptureCompleteness();
		init_CdpCaptureValues();
		init_CdpOptionalCommand();
		init_ElectronFileScope();
		init_unicodeCodePointOrder();
		captureElectronWorkers = async (input) => {
			const result = await optionalCdpCommand({
				connection: input.connection,
				sessionId: undefined,
				...input.signal === undefined ? {} : { signal: input.signal }
			}, "Target.getTargets", {}, input.limitations);
			if (result === undefined) {
				input.completeness.unavailable("workers");
				return [];
			}
			const workers = [];
			const targetInfos = recordValue(result)?.targetInfos;
			if (!Array.isArray(targetInfos)) {
				input.completeness.exclude("workers", "invalid_protocol_value", null);
				return [];
			}
			for (const entry of targetInfos) {
				const target = recordValue(entry);
				if (target === undefined) {
					input.completeness.exclude("workers", "invalid_protocol_value");
					continue;
				}
				const type = cdpStringValue(target.type) ?? "";
				if (!type.includes("worker")) continue;
				const openerTargetId = boundedTargetField(target.openerId);
				const parentFrameId = boundedTargetField(target.parentFrameId);
				if (openerTargetId !== input.target.id && (parentFrameId === null || !input.frameIds.has(parentFrameId))) {
					input.completeness.exclude("workers", "out_of_target_scope");
					continue;
				}
				const path = await authorizedElectronFile(cdpStringValue(target.url) ?? "");
				if (path === undefined) {
					input.completeness.exclude("workers", "out_of_target_scope");
					continue;
				}
				const targetId = boundedTargetField(target.targetId);
				if (targetId === null) {
					input.completeness.exclude("workers", "invalid_protocol_value");
					continue;
				}
				if (typeof target.attached !== "boolean") {
					input.completeness.exclude("workers", "invalid_protocol_value");
					continue;
				}
				workers.push({
					target_id: targetId,
					type,
					file_path: path,
					attached: target.attached,
					opener_target_id: openerTargetId,
					parent_frame_id: parentFrameId
				});
			}
			return workers.sort((left, right) => compareUnicodeCodePoints(left.target_id, right.target_id));
		};
		boundedTargetField = (value) => {
			const field = cdpStringValue(value);
			return field === undefined || field === "" ? null : field;
		};
	})))();
}

//#endregion
//#region dist/browser/CdpElectronInspection.js
var inspectCdpElectronPage, runElectronInspection, authorizeInitialFrames, enableElectronCapture, captureElectronContent, assertStableMainFrame, navigatedFrameId, captureFrames, captureResources, captureDom, mainFilePath, report;
function init_CdpElectronInspection() {
	return (init_CdpElectronInspection = __esmMin((() => {
		init_canonicalDigest();
		init_browserObservationError();
		init_CdpCaptureCompleteness();
		init_CdpCaptureValues();
		init_CdpCaptureDocuments();
		init_CdpSnapshotNodes();
		init_CdpSnapshotStrings();
		init_CdpElectronScriptEvents();
		init_CdpElectronScripts();
		init_CdpElectronWorkers();
		init_ElectronFileScope();
		init_unicodeCodePointOrder();
		inspectCdpElectronPage = async (context) => {
			const state = {
				completeness: new CdpCaptureCompleteness(),
				scripts: [],
				executionContextFrames: new Map(),
				limitations: [
					"Local file paths exposed by the selected CDP target are retained in the observation.",
					"REA does not evaluate renderer JavaScript, invoke Electron APIs, navigate, click, or close the page.",
					"Select include_script_sources to retain script contents.",
					...context.target.attached === null ? ["CDP discovery omitted the target attachment state; attached is reported as unknown."] : []
				],
				mainFrameId: undefined,
				navigationDuringCapture: false
			};
			const removeListener = context.connection.onEvent((event) => {
				if (event.sessionId !== context.sessionId) return;
				ingestElectronScriptEvent({
					event,
					scripts: state.scripts,
					executionContextFrames: state.executionContextFrames,
					completeness: state.completeness
				});
				if (state.mainFrameId !== undefined && navigatedFrameId(event) === state.mainFrameId) state.navigationDuringCapture = true;
			});
			try {
				return await runElectronInspection(context, state, new Date().toISOString());
			} finally {
				removeListener();
			}
		};
		runElectronInspection = async (context, state, startedAt) => {
			const frames = await authorizeInitialFrames(context, state);
			const main = frames.at(0);
			if (main === undefined) throw new BrowserObservationError("inspect_web_page", "target_not_allowed");
			state.mainFrameId = main.frame_id;
			await enableElectronCapture(context);
			await delayWithCancellation(context.input.observation_ms, "inspect_electron_page", context.signal);
			const captured = await captureElectronContent(context, state, frames);
			await assertStableMainFrame(context, state, main.file_path);
			await report(context.progress, 3, "Electron inspection complete");
			return {
				browser: context.discovery.version,
				target: {
					target_id: context.target.id,
					type: context.target.type,
					title: context.target.title,
					file_path: main.file_path,
					attached: context.target.attached
				},
				capture_window: {
					started_at: startedAt,
					ended_at: new Date().toISOString(),
					observation_ms: context.input.observation_ms
				},
				completeness: state.completeness.snapshot(),
				frames,
				...captured,
				limitations: state.limitations
			};
		};
		authorizeInitialFrames = async (context, state) => {
			await report(context.progress, 1, "Authorizing Electron file frames");
			await context.connection.send("Page.enable", {}, context.sessionId, context.signal);
			const result = await context.connection.send("Page.getFrameTree", {}, context.sessionId, context.signal);
			const frames = await captureFrames(result, state.completeness);
			if (frames[0] === undefined) throw new BrowserObservationError("inspect_web_page", "target_not_allowed");
			return frames;
		};
		enableElectronCapture = async (context) => {
			await context.connection.send("Runtime.enable", {}, context.sessionId, context.signal);
			await context.connection.send("Debugger.enable", {}, context.sessionId, context.signal);
		};
		captureElectronContent = async (context, state, frames) => {
			await report(context.progress, 2, "Capturing Electron structure");
			const frameIds = new Set(frames.map((frame) => frame.frame_id));
			const resources = await captureResources(context, state.completeness);
			const dom = await captureDom(context, state.completeness);
			const scripts = await captureElectronScripts({
				connection: context.connection,
				sessionId: context.sessionId,
				...context.signal === undefined ? {} : { signal: context.signal },
				request: context.input,
				scripts: state.scripts,
				frameIds,
				completeness: state.completeness
			});
			const workers = await captureElectronWorkers({
				connection: context.connection,
				...context.signal === undefined ? {} : { signal: context.signal },
				target: context.target,
				request: context.input,
				frameIds,
				completeness: state.completeness,
				limitations: state.limitations
			});
			return {
				dom,
				scripts,
				resources,
				workers
			};
		};
		assertStableMainFrame = async (context, state, expectedPath) => {
			const result = await context.connection.send("Page.getFrameTree", {}, context.sessionId, context.signal);
			const afterPath = await mainFilePath(result);
			if (afterPath === undefined) throw new BrowserObservationError("inspect_web_page", "target_not_allowed");
			if (state.navigationDuringCapture || afterPath !== expectedPath) throw new BrowserObservationError("inspect_web_page", "target_changed");
		};
		navigatedFrameId = (event) => {
			const params = recordValue(event.params);
			if (params === undefined) return undefined;
			if (event.method === "Page.frameNavigated") return cdpStringValue(recordValue(params.frame)?.id);
			if (event.method === "Page.navigatedWithinDocument") return cdpStringValue(params.frameId);
			return undefined;
		};
		captureFrames = async (result, completeness) => {
			const frameTree = recordValue(requiredRecord(result).frameTree);
			if (frameTree === undefined) throw new BrowserObservationError("inspect_web_page", "protocol_error");
			const frames = [];
			for (const tree of walkFrameTrees(frameTree, () => completeness.exclude("frames", "invalid_protocol_value"))) {
				const frame = recordValue(tree.frame);
				const frameId = cdpStringValue(frame?.id);
				if (frame === undefined || frameId === undefined) {
					completeness.exclude("frames", "invalid_protocol_value");
					continue;
				}
				const path = await authorizedElectronFile(cdpStringValue(frame.url) ?? "");
				if (path === undefined) {
					completeness.exclude("frames", "out_of_target_scope");
					continue;
				}
				frames.push({
					frame_id: frameId,
					parent_frame_id: cdpStringValue(frame?.parentId) ?? null,
					file_path: path
				});
			}
			return frames;
		};
		captureResources = async (context, completeness) => {
			const result = await context.connection.send("Page.getResourceTree", {}, context.sessionId, context.signal);
			const root = recordValue(requiredRecord(result).frameTree);
			if (root === undefined) throw new BrowserObservationError("inspect_web_page", "protocol_error");
			const resources = [];
			const seen = new Set();
			for (const resource of frameTreeResources(root, (count) => completeness.exclude("resources", "invalid_protocol_value", count))) {
				const path = await authorizedElectronFile(cdpStringValue(resource.url) ?? "");
				if (path === undefined) {
					completeness.exclude("resources", "out_of_target_scope");
					continue;
				}
				const contentSize = resourceContentSize(resource.contentSize);
				if (!contentSize.ok) completeness.exclude("resources", "invalid_protocol_value");
				const item = {
					file_path: path,
					type: cdpStringValue(resource.type) ?? "Other",
					mime_type: cdpStringValue(resource.mimeType) ?? "",
					content_size: contentSize.ok ? contentSize.value : null
				};
				const resourceKey = `electron_resource_${digestCanonicalValue(item, "CDP capture")}`;
				if (seen.has(resourceKey)) continue;
				seen.add(resourceKey);
				resources.push({
					resource_key: resourceKey,
					...item
				});
			}
			return resources.sort((left, right) => compareUnicodeCodePoints(left.resource_key, right.resource_key));
		};
		captureDom = async (context, completeness) => {
			const result = requiredRecord(await context.connection.send("DOMSnapshot.captureSnapshot", {
				computedStyles: [],
				includePaintOrder: false,
				includeDOMRects: false
			}, context.sessionId, context.signal));
			const invalid = (count) => completeness.exclude("dom", "invalid_protocol_value", count);
			if (!Array.isArray(result.strings)) {
				invalid(null);
				return {
					total_nodes: 0,
					nodes: []
				};
			}
			const strings = result.strings.map(cdpStringValue);
			const nodes = [];
			let total = 0;
			for (const document of snapshotDocuments(result.documents, invalid)) {
				const documentUrl = cdpSnapshotString(strings, document.documentURL);
				if (documentUrl === undefined) {
					invalid(1);
					continue;
				}
				if (await authorizedElectronFile(documentUrl) === undefined) {
					completeness.exclude("dom", "out_of_target_scope");
					continue;
				}
				const documentNodes = snapshotDocumentNodes(document.nodes, strings);
				if (documentNodes === undefined) {
					invalid(1);
					continue;
				}
				if (documentNodes.excessAttributes > 0) invalid(documentNodes.excessAttributes);
				const baseIndex = total;
				total += documentNodes.nodeTypes.length;
				for (let index = 0; index < documentNodes.nodeTypes.length; index += 1) {
					const admitted = snapshotNodeAt(documentNodes, index);
					if (!admitted.ok) {
						invalid(1);
						continue;
					}
					const { nodeType, nodeName, nodeValue, parent, attributes } = admitted.value;
					nodes.push({
						index: baseIndex + index,
						parent_index: parent < 0 ? -1 : baseIndex + parent,
						node_type: nodeType,
						node_name: nodeName,
						node_value_length: Buffer.byteLength(nodeValue),
						attribute_names: attributes.map(([name]) => name)
					});
				}
			}
			return {
				total_nodes: total,
				nodes
			};
		};
		mainFilePath = async (result) => {
			const frameTree = recordValue(requiredRecord(result).frameTree);
			const frame = recordValue(frameTree?.frame);
			return await authorizedElectronFile(cdpStringValue(frame?.url) ?? "");
		};
		report = async (progress, completed, message) => await progress?.report({
			phase: "browser_observation",
			completed,
			total: 3,
			message,
			...completed === 3 ? { terminal: true } : {}
		});
	})))();
}

//#endregion
//#region dist/browser/CdpElectronProvider.js
var CdpElectronProvider, authorizeTarget, providerError;
function init_CdpElectronProvider() {
	return (init_CdpElectronProvider = __esmMin((() => {
		init_electronObservation$1();
		init_analysisErrorBase();
		init_analysisErrorCore();
		init_browserObservationError();
		init_providerAdapterError();
		init_result();
		init_CdpEndpoint();
		init_CdpTargetSession();
		init_CdpElectronInspection();
		init_ElectronFileScope();
		init_providerIdentities();
		init_unicodeCodePointOrder();
		init_analysisErrorCleanup();
		init_providerCleanupError();
		init_CdpTargetSessionOwner();
		CdpElectronProvider = class {
			#owner = new CdpTargetSessionOwner();
			close() {
				return this.#owner.close();
			}
			identity() {
				return CDP_ELECTRON_PROVIDER_IDENTITY;
			}
			async listTargets(input, options = {}) {
				try {
					const discovery = await discoverCdpEndpoint(input.cdp_endpoint, "list_electron_targets", options.signal);
					const allowed = [];
					let unsupportedUrl = 0;
					let nonPage = 0;
					let unconnectable = 0;
					for (const target of discovery.targets) {
						if (target.type !== "page") {
							nonPage += 1;
							continue;
						}
						const path = await authorizedElectronFile(target.url);
						if (path === undefined) {
							unsupportedUrl += 1;
							continue;
						}
						if (!hasCdpTargetWebSocket(discovery, target)) {
							unconnectable += 1;
							continue;
						}
						allowed.push({
							target_id: target.id,
							type: target.type,
							title: target.title,
							file_path: path,
							attached: target.attached
						});
					}
					allowed.sort((left, right) => compareUnicodeCodePoints(left.target_id, right.target_id));
					return ok(electronTargetListSchema.parse({
						browser: discovery.version,
						targets: allowed,
						excluded: {
							unsupported_url: unsupportedUrl,
							non_page: nonPage
						},
						limitations: [
							"Every local file page exposed by the selected loopback CDP endpoint is eligible for listing.",
							...unconnectable === 0 ? [] : [`${String(unconnectable)} otherwise allowed page target(s) lacked a validated direct CDP WebSocket and were excluded.`],
							...allowed.some((target) => target.attached === null) ? ["CDP discovery omitted attachment state for one or more targets; attached is reported as unknown."] : []
						]
					}));
				} catch (cause) {
					return err(providerError(cause, "list_electron_targets"));
				}
			}
			async inspectPage(input, options = {}) {
				let targetSession;
				let cleanupFailure;
				let result;
				try {
					const discovery = await discoverCdpEndpoint(input.cdp_endpoint, "inspect_electron_page", options.signal);
					const target = await authorizeTarget(discovery.targets, input.target_id);
					targetSession = await openCdpTargetSession(discovery, target, "inspect_electron_page", options.signal, undefined, this.#owner);
					result = ok(electronPageInspectionSchema.parse(await inspectCdpElectronPage({
						connection: targetSession.connection,
						sessionId: targetSession.sessionId,
						discovery,
						target,
						input,
						...options.signal === undefined ? {} : { signal: options.signal },
						...options.progress === undefined ? {} : { progress: options.progress }
					})));
				} catch (cause) {
					result = err(providerError(cause, "inspect_electron_page"));
				} finally {
					if (targetSession !== undefined) try {
						await closeCdpTargetSession(targetSession, [
							"Debugger",
							"Runtime",
							"Page"
						], options.signal, this.#owner);
					} catch (cause) {
						cleanupFailure = cause instanceof AnalysisError ? cause : new ProviderCleanupError(CDP_ELECTRON_PROVIDER_IDENTITY.id, [input.target_id], { reason: cause instanceof Error ? cause.message : String(cause) }, {
							operation: "inspect_electron_page",
							cause
						});
					}
				}
				const finalCancellation = result.ok && options.signal?.aborted === true ? new AnalysisCancelledError("inspect_electron_page", {
					cause: options.signal.reason,
					partialObservation: {
						kind: "electron-page-observation",
						inspection: result.value,
						cleanup: cleanupFailure === undefined ? "transport-closed" : "incomplete"
					}
				}) : undefined;
				if (cleanupFailure !== undefined) {
					if (finalCancellation !== undefined) return err(bindCdpTransportCleanup(cleanupFailure, analysisErrorWithCleanupFailure(finalCancellation, cleanupFailure, "inspect_electron_page")));
					if (!result.ok) return err(bindCdpTransportCleanup(cleanupFailure, analysisErrorWithCleanupFailure(result.error, cleanupFailure, "inspect_electron_page")));
					return err(bindCdpTransportCleanup(cleanupFailure, new ProviderCleanupError(CDP_ELECTRON_PROVIDER_IDENTITY.id, cleanupFailure.cleanupResources, { cleanup_error: cleanupFailure.message }, {
						operation: "inspect_electron_page",
						cause: cleanupFailure,
						partialObservation: {
							kind: "electron-page-observation",
							inspection: result.value,
							cleanup: "incomplete"
						}
					})));
				}
				if (!result.ok) return result;
				if (finalCancellation !== undefined) return err(finalCancellation);
				return result;
			}
		};
		authorizeTarget = async (targets, targetId) => {
			const target = targets.find(({ id }) => id === targetId);
			if (target === undefined) throw new BrowserObservationError("inspect_web_page", "target_not_found");
			if (target.type !== "page" || await authorizedElectronFile(target.url) === undefined) throw new BrowserObservationError("inspect_web_page", "target_not_allowed");
			return target;
		};
		providerError = (cause, operation) => cause instanceof BrowserObservationError && cause.operation !== operation ? new BrowserObservationError(operation, cause.reason, { cause }) : cause instanceof AnalysisError ? cause : new ProviderAdapterError(CDP_ELECTRON_PROVIDER_IDENTITY.id, operation, { cause });
	})))();
}

//#endregion
//#region dist/composition/electronObservation.js
var createElectronObservationProvider;
function init_electronObservation() {
	return (init_electronObservation = __esmMin((() => {
		init_CdpElectronProvider();
		createElectronObservationProvider = () => new CdpElectronProvider();
	})))();
}

//#endregion
init_electronObservation();
export { createElectronObservationProvider };