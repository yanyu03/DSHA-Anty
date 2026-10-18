import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { DEFAULT_BROWSER_SCENARIO_CAPTURE_LIMITS, PLAYWRIGHT_RESPONSE_BODY_PROVENANCE_LIMITATION, browserObservationEndpointSchema, browserScenarioCaptureSchema, browserScenarioEventSchema, browserScenarioStepSchema, browserStepArtifactsSchema, classifyBrowserScenarioCompleteness, err, init_browserNetworkEvidence, init_browserObservation, init_browserScenarioCapture, init_browserScenarioCaptureLimits, init_browserScenarioCaptureValues, init_result, isLiteralLoopbackHostname, ok, sanitizeBrowserUrl } from "./reconstructionObligationLedgerSchemas-Bi6sect1.js";
import { AnalysisCancelledError, AnalysisError, AnalysisTimeoutError, init_analysisErrorBase, init_analysisErrorCore } from "./errorSchemas-Ixz_q7qt.js";
import { AnalysisCleanupLease, AnalysisCleanupLeaseGroup, init_AnalysisCleanupLease } from "./AnalysisCleanupLease-CWfTGYKd.js";
import { BrowserObservationError, ProviderAdapterError, init_browserObservationError, init_providerAdapterError } from "./cliResultOutput-10sd6xGx.js";
import { analysisErrorWithCleanupFailure, init_analysisErrorCleanup } from "./analysisErrorCleanup-COdAmDsb.js";
import { ProviderCleanupError, init_providerCleanupError } from "./providerCleanupError-BhsJyAhk.js";
import { CdpConnection, attachCdpTargetSession, init_CdpConnection, init_CdpEndpoint, init_CdpTargetSession, openCdpEndpoint, withCdpDiscoveryDeadline } from "./CdpTargetSession-CQ08KHbh.js";
import { PLAYWRIGHT_BROWSER_SCENARIO_PROVIDER_IDENTITY, init_providerIdentities } from "./providerIdentities-Ao1XTvwx.js";
import { z } from "zod";
import { join, resolve } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { chmod, mkdtemp, rm } from "node:fs/promises";

//#region dist/browser/PlaywrightExecutionBoundary.js
var OPERATION$5, PLAYWRIGHT_CLEANUP_CONFIRMATION_TIMEOUT_MS, withPlaywrightExecutionBoundary;
function init_PlaywrightExecutionBoundary() {
	return (init_PlaywrightExecutionBoundary = __esmMin((() => {
		init_analysisErrorCore();
		OPERATION$5 = "capture_browser_scenario";
		PLAYWRIGHT_CLEANUP_CONFIRMATION_TIMEOUT_MS = 3e4;
		withPlaywrightExecutionBoundary = (work, timeoutMs, signal) => {
			if (timeoutMs !== undefined && timeoutMs <= 0) return Promise.reject(new AnalysisTimeoutError(OPERATION$5, timeoutMs));
			if (signal?.aborted === true) return Promise.reject(new AnalysisCancelledError(OPERATION$5, { cause: signal.reason }));
			return new Promise((resolve, reject) => {
				let settled = false;
				let timer;
				const deadline = timeoutMs === undefined ? undefined : performance.now() + timeoutMs;
				const scheduleTimeout = () => {
					if (deadline === undefined) return;
					const remaining = deadline - performance.now();
					if (remaining <= 0) {
						fail(new AnalysisTimeoutError(OPERATION$5, timeoutMs ?? 0));
						return;
					}
					timer = setTimeout(scheduleTimeout, Math.min(remaining, 2147483647));
					timer.unref();
				};
				const cleanup = () => {
					if (timer !== undefined) clearTimeout(timer);
					signal?.removeEventListener("abort", onAbort);
				};
				const succeed = (value) => {
					if (settled) return;
					settled = true;
					cleanup();
					resolve(value);
				};
				const fail = (error) => {
					if (settled) return;
					settled = true;
					cleanup();
					reject(error);
				};
				const onAbort = () => {
					fail(new AnalysisCancelledError(OPERATION$5, { cause: signal?.reason }));
				};
				scheduleTimeout();
				signal?.addEventListener("abort", onAbort, { once: true });
				if (signal?.aborted === true) {
					onAbort();
					return;
				}
				void work().then(succeed, fail);
			});
		};
	})))();
}

//#endregion
//#region dist/browser/BrowserScenarioPartialObservation.js
var OPERATION$4, browserScenarioLimitations, browserScenarioCaptureData, browserScenarioCleanupObservation, browserScenarioOperationFailure;
function init_BrowserScenarioPartialObservation() {
	return (init_BrowserScenarioPartialObservation = __esmMin((() => {
		init_browserNetworkEvidence();
		init_analysisErrorBase();
		init_analysisErrorCleanup();
		init_providerCleanupError();
		init_providerAdapterError();
		init_providerIdentities();
		OPERATION$4 = "capture_browser_scenario";
		browserScenarioLimitations = (session, scenario, events) => {
			const capturedResponseBody = scenario.capture.network.response_body && events.some((event) => event.kind === "network-content" && event.phase === "response" && event.body.state === "captured" && (event.body.representation === "playwright-response-body-bytes" || event.body.representation === "browser-decoded-response-bytes"));
			return [
				"Event sequence records provider receipt order; simultaneous browser causality is not inferred.",
				"Network content is retained only when selected; Playwright response-body bytes are API results and are not guaranteed to match wire bytes.",
				"Request bytes are limited to what Playwright exposes; not_exposed does not establish body absence or multipart file coverage.",
				"Network content reads settle within 5 seconds each and the observer does not request bodies from unfinished responses.",
				...capturedResponseBody ? [PLAYWRIGHT_RESPONSE_BODY_PROVENANCE_LIMITATION] : [],
				"Playwright scenario events do not expose request initiator stacks; receipt order does not prove causality.",
				"Storage values are hashed only after declared-secret redaction.",
				...scenario.storage.local_storage.length === 0 && scenario.storage.session_storage.length === 0 ? [] : ["Non-cookie storage seeds use CDP pre-script instrumentation; only pauses in the scenario's private seed script are resumed by this observer."],
				...session.eventLimitations?.() ?? [],
				...session.mode === "connect" ? [
					"CDP attachment cannot recover pre-attach events or guarantee launch-time context options.",
					`Attached locale ${scenario.environment.locale} applies to Intl formatting only; navigator.language(s) and Accept-Language remain caller-controlled. Use launch mode for matching page and request languages.`,
					"Detaching a CDP page session may clear caller-owned navigator.platform emulation. REA cannot snapshot the caller's complete user-agent/client-hint state before attachment; use launch mode to avoid mutating that external browser."
				] : []
			];
		};
		browserScenarioCaptureData = (input) => {
			const events = input.session.events();
			return {
				browser: {
					mode: input.session.mode,
					process_ownership: input.session.processOwnership,
					cleanup: input.cleanup,
					product: input.session.product,
					version: input.session.version
				},
				scenario: {
					start_origin: new URL(input.scenario.start_url.url).origin,
					action_count: input.scenario.actions.length,
					secret_references: input.scenario.secrets.map(({ secret_id: id }) => id).sort(),
					network_content: input.scenario.capture.network,
					event_families: [...new Set(input.scenario.capture.events)].sort(),
					limits: input.scenario.capture.limits
				},
				duration_ms: Math.max(0, Math.round(performance.now() - input.startedAt)),
				steps: [...input.steps],
				events,
				limitations: [...browserScenarioLimitations(input.session, input.scenario, events.items), ...input.limitations ?? []]
			};
		};
		browserScenarioCleanupObservation = (cause) => cause instanceof AnalysisError && cause.cleanup !== undefined ? cause.cleanup : {
			reason: cause instanceof Error ? cause.message : String(cause),
			resources: cause instanceof AnalysisError && cause.cleanupResources.length > 0 ? cause.cleanupResources : ["browser_transport"]
		};
		browserScenarioOperationFailure = (cause, partialObservation, cleanupFailure) => {
			const primary = cause instanceof AnalysisError ? cause : new ProviderAdapterError(PLAYWRIGHT_BROWSER_SCENARIO_PROVIDER_IDENTITY.id, OPERATION$4, { cause });
			primary.retainPartialObservation(partialObservation);
			if (cleanupFailure === undefined) return primary;
			const observation = browserScenarioCleanupObservation(cleanupFailure.cause);
			const cleanup = cleanupFailure.cause instanceof AnalysisError && cleanupFailure.cause.cleanupIncomplete ? cleanupFailure.cause : new ProviderCleanupError(PLAYWRIGHT_BROWSER_SCENARIO_PROVIDER_IDENTITY.id, observation.resources, { reason: observation.reason }, {
				operation: "close_browser_scenario",
				cause: cleanupFailure.cause
			});
			return analysisErrorWithCleanupFailure(primary, cleanup, OPERATION$4).bindCleanupDependencies([primary, cleanup]);
		};
	})))();
}

//#endregion
//#region dist/browser/PlaywrightBrowserScenarioProvider.js
var OPERATION$3, signalIsAborted, SNAPSHOT_KINDS, requestedForStep, unavailableArtifacts, stepCompleteness, createStep, initialStep, executeStep, globalCompleteness, runScenario, PlaywrightBrowserScenarioProvider;
function init_PlaywrightBrowserScenarioProvider() {
	return (init_PlaywrightBrowserScenarioProvider = __esmMin((() => {
		init_PlaywrightExecutionBoundary();
		init_analysisErrorCleanup();
		init_AnalysisCleanupLease();
		init_providerCleanupError();
		init_browserScenarioCapture();
		init_browserScenarioCaptureValues();
		init_analysisErrorBase();
		init_analysisErrorCore();
		init_browserObservationError();
		init_providerAdapterError();
		init_result();
		init_BrowserScenarioPartialObservation();
		init_providerIdentities();
		OPERATION$3 = "capture_browser_scenario";
		signalIsAborted = (signal) => signal?.aborted === true;
		SNAPSHOT_KINDS = [
			"screenshot",
			"dom",
			"accessibility",
			"url",
			"history",
			"storage"
		];
		requestedForStep = (scenario, stepIndex) => new Set([...scenario.capture.after_each_step, ...stepIndex === scenario.actions.length ? scenario.capture.at_end : []]);
		unavailableArtifacts = (requested, reason) => {
			const state = (kind) => requested.has(kind) ? {
				state: "missing",
				reason
			} : { state: "not_requested" };
			return browserStepArtifactsSchema.parse({
				screenshot: state("screenshot"),
				dom: state("dom"),
				accessibility: state("accessibility"),
				url: state("url"),
				history: state("history"),
				storage: state("storage")
			});
		};
		stepCompleteness = (artifacts, status) => {
			const missing = SNAPSHOT_KINDS.filter((section) => artifacts[section].state === "missing");
			const truncated = SNAPSHOT_KINDS.filter((section) => artifacts[section].state === "truncated");
			if (status !== "completed") missing.push("action");
			return classifyBrowserScenarioCompleteness(missing, truncated);
		};
		createStep = (input) => browserScenarioStepSchema.parse({
			step_index: input.stepIndex,
			step_id: input.stepId,
			action: input.action,
			status: input.status,
			elapsed_ms: input.elapsedMs,
			before_url: input.beforeUrl,
			after_url: input.afterUrl,
			error: input.error,
			event_sequence_start: input.eventStart,
			event_sequence_end: input.eventEnd,
			artifacts: input.artifacts,
			completeness: stepCompleteness(input.artifacts, input.status)
		});
		initialStep = async (input) => {
			const { session, scenario, elapsedMs, signal } = input;
			const artifacts = await session.capture(requestedForStep(scenario, 0), signal);
			return createStep({
				stepIndex: 0,
				stepId: "scenario_start",
				action: "goto_start",
				status: "completed",
				elapsedMs,
				beforeUrl: session.sanitizeUrl(session.initialUrl),
				afterUrl: session.sanitizeUrl(session.currentUrl()),
				error: null,
				eventStart: 1,
				eventEnd: session.lastEventSequence(),
				artifacts
			});
		};
		executeStep = async (input) => {
			const { session, scenario, action, stepIndex, priorFailure, signal } = input;
			const beforeUrl = session.sanitizeUrl(session.currentUrl());
			const eventStart = session.nextEventSequence();
			const requested = requestedForStep(scenario, stepIndex);
			if (priorFailure) return createStep({
				stepIndex,
				stepId: action.step_id,
				action: action.action,
				status: "cancelled",
				elapsedMs: 0,
				beforeUrl,
				afterUrl: beforeUrl,
				error: "not executed after an earlier action failure",
				eventStart,
				eventEnd: session.lastEventSequence(),
				artifacts: unavailableArtifacts(requested, "action was not executed after an earlier failure")
			});
			const actionStartedAt = performance.now();
			session.setStep(stepIndex);
			const requestCancelled = () => signal?.aborted === true;
			let outcome = {
				status: "completed",
				error: null
			};
			if (requestCancelled()) {
				outcome = {
					status: "cancelled",
					error: "scenario request cancelled"
				};
			} else {
				try {
					await session.perform(action, signal);
				} catch (cause) {
					outcome = {
						status: requestCancelled() ? "cancelled" : "failed",
						error: session.redactError(cause)
					};
				}
			}
			const artifacts = outcome.status === "cancelled" ? unavailableArtifacts(requested, "scenario request cancelled") : await session.capture(requested, signal);
			return createStep({
				stepIndex,
				stepId: action.step_id,
				action: action.action,
				...outcome,
				elapsedMs: Math.max(0, Math.round(performance.now() - actionStartedAt)),
				beforeUrl,
				afterUrl: session.sanitizeUrl(session.currentUrl()),
				eventStart,
				eventEnd: session.lastEventSequence(),
				artifacts
			});
		};
		globalCompleteness = (scenario, session, steps) => {
			const missing = steps.flatMap(({ completeness }) => completeness.missing_sections);
			const truncated = steps.flatMap(({ completeness }) => completeness.truncated_sections);
			if (session.mode === "connect") missing.push("events");
			if ((session.eventLimitations?.().length ?? 0) > 0) missing.push("events");
			return classifyBrowserScenarioCompleteness(missing, truncated);
		};
		runScenario = async (openSession, scenario, options, retainCleanup) => {
			if (options.signal?.aborted) throw new BrowserObservationError(OPERATION$3, "cancelled", { cause: options.signal.reason });
			const startedAt = performance.now();
			const session = await openSession(scenario, {
				...options.signal === undefined ? {} : { signal: options.signal },
				retainCleanup
			});
			const steps = [];
			let operationOutcome = { ok: true };
			try {
				steps.push(await initialStep({
					session,
					scenario,
					elapsedMs: Math.max(0, Math.round(performance.now() - startedAt)),
					signal: options.signal
				}));
				let failed = false;
				for (const [offset, action] of scenario.actions.entries()) {
					const step = await executeStep({
						session,
						scenario,
						action,
						stepIndex: offset + 1,
						priorFailure: failed,
						signal: options.signal
					});
					steps.push(step);
					failed ||= step.status !== "completed";
				}
			} catch (cause) {
				operationOutcome = {
					ok: false,
					cause
				};
			}
			let cleanupOutcome;
			try {
				cleanupOutcome = {
					ok: true,
					cleanup: await session.close()
				};
			} catch (cause) {
				const cleanup = browserScenarioCleanupObservation(cause);
				const failure = new BrowserObservationError(OPERATION$3, "cleanup_failed", {
					cause,
					cleanup
				});
				retainCleanup(session.cleanupLease);
				new AnalysisCleanupLeaseGroup(failure, [session.cleanupLease]);
				cleanupOutcome = {
					ok: false,
					cause: failure
				};
			}
			if (!cleanupOutcome.ok) {
				if (operationOutcome.ok && options.signal?.aborted) operationOutcome = {
					ok: false,
					cause: new AnalysisCancelledError(OPERATION$3, { cause: options.signal.reason })
				};
				const cleanup = browserScenarioCleanupObservation(cleanupOutcome.cause);
				const partialObservation = {
					kind: "browser-scenario-observation",
					capture: browserScenarioCaptureData({
						session,
						scenario,
						startedAt,
						steps,
						cleanup: "incomplete",
						limitations: ["Scenario observations are partial because browser cleanup could not be confirmed."]
					})
				};
				if (!operationOutcome.ok) throw browserScenarioOperationFailure(operationOutcome.cause, partialObservation, { cause: cleanupOutcome.cause });
				const failure = new BrowserObservationError(OPERATION$3, "cleanup_failed", {
					cause: cleanupOutcome.cause,
					cleanup,
					partialObservation,
					detail: `Browser scenario cleanup could not be confirmed: ${cleanup.reason}. Collected steps and events are retained in partial_observation. Review the reported resources before retrying.`
				});
				if (cleanupOutcome.cause instanceof AnalysisError && cleanupOutcome.cause.cleanupIncomplete) failure.bindCleanupDependencies([cleanupOutcome.cause]);
				throw failure;
			}
			if (!operationOutcome.ok) throw browserScenarioOperationFailure(operationOutcome.cause, {
				kind: "browser-scenario-observation",
				capture: browserScenarioCaptureData({
					session,
					scenario,
					startedAt,
					steps,
					cleanup: cleanupOutcome.cleanup,
					limitations: ["Scenario capture ended after an operation failed; uncollected steps are not represented."]
				})
			});
			const completeness = globalCompleteness(scenario, session, steps);
			const capture = browserScenarioCaptureSchema.parse({
				...browserScenarioCaptureData({
					session,
					scenario,
					startedAt,
					steps,
					cleanup: cleanupOutcome.cleanup
				}),
				completeness
			});
			if (signalIsAborted(options.signal)) throw new AnalysisCancelledError(OPERATION$3, {
				cause: options.signal?.reason,
				partialObservation: {
					kind: "browser-scenario-observation",
					capture: {
						...capture,
						limitations: [...capture.limitations, "Scenario capture was cancelled; collected steps, observations, and cleanup state are retained."]
					}
				}
			});
			return capture;
		};
		PlaywrightBrowserScenarioProvider = class {
			openSession;
			#tail = Promise.resolve();
			#closing = false;
			#closePromise;
			#pendingCleanup = new Set();
			constructor(openSession) {
				this.openSession = openSession;
			}
			identity() {
				return PLAYWRIGHT_BROWSER_SCENARIO_PROVIDER_IDENTITY;
			}
			captureScenario(scenario, options = {}) {
				if (this.#closing) return Promise.resolve(err(this.#closedError()));
				const operation = this.#tail.then(() => this.#closing ? err(this.#closedError()) : this.#captureScenario(scenario, options));
				this.#tail = operation.then(() => undefined, () => undefined);
				return operation;
			}
			async #captureScenario(scenario, options) {
				const pending = await this.#retryCleanup();
				if (pending !== undefined) return err(pending);
				const retained = [];
				try {
					return ok(await runScenario(this.openSession, scenario, options, (lease) => {
						this.#pendingCleanup.add(lease);
						retained.push(lease);
					}));
				} catch (cause) {
					const primary = cause instanceof AnalysisError ? cause : new ProviderAdapterError(PLAYWRIGHT_BROWSER_SCENARIO_PROVIDER_IDENTITY.id, OPERATION$3, { cause });
					if (retained.length === 0) return err(primary);
					const cleanup = new ProviderCleanupError(PLAYWRIGHT_BROWSER_SCENARIO_PROVIDER_IDENTITY.id, retained.flatMap((lease) => lease.cleanupResources ?? []), { reason: "Browser scenario cleanup capabilities remain retained." }, {
						operation: OPERATION$3,
						cause
					});
					new AnalysisCleanupLeaseGroup(cleanup, retained);
					return err(analysisErrorWithCleanupFailure(primary, cleanup, OPERATION$3).bindCleanupDependencies([primary, cleanup]));
				}
			}
			async close() {
				this.#closing = true;
				this.#closePromise ??= this.#tail.then(async () => {
					const failure = await this.#retryCleanup();
					if (failure !== undefined) throw failure;
				}).catch((cause) => {
					this.#closePromise = undefined;
					throw cause;
				});
				return this.#closePromise;
			}
			#closedError() {
				return new BrowserObservationError(OPERATION$3, "cleanup_failed", {
					detail: "Browser scenario provider is closing.",
					cleanup: {
						reason: "Provider is closing",
						resources: []
					}
				});
			}
			async #retryCleanup() {
				const failures = [];
				for (const pending of this.#pendingCleanup) {
					try {
						await withPlaywrightExecutionBoundary(() => pending.release(), PLAYWRIGHT_CLEANUP_CONFIRMATION_TIMEOUT_MS);
						this.#pendingCleanup.delete(pending);
					} catch (cause) {
						const failure = new ProviderCleanupError(PLAYWRIGHT_BROWSER_SCENARIO_PROVIDER_IDENTITY.id, pending.cleanupResources ?? [], { reason: cause instanceof Error ? cause.message : String(cause) }, {
							operation: OPERATION$3,
							cause
						});
						new AnalysisCleanupLeaseGroup(failure, [pending]);
						failures.push(failure);
					}
				}
				if (failures.length === 0) return undefined;
				if (failures.length === 1) return failures[0];
				return new ProviderCleanupError(PLAYWRIGHT_BROWSER_SCENARIO_PROVIDER_IDENTITY.id, failures.flatMap((failure) => failure.cleanupResources), { reason: "One or more browser scenario resources remain owned." }, {
					operation: OPERATION$3,
					cause: new AggregateError(failures, "Browser scenario cleanup failed")
				}).bindCleanupDependencies(failures);
			}
		};
	})))();
}

//#endregion
//#region dist/browser/BrowserScenarioSecrets.js
var REDACTION_PREFIX, encodedSecretValues, normalizePercentEscapes, secretPatterns, declaredPatterns, secretReplacements, normalizePercentEscapesBytes, isHexByte, lowercaseHexByte, patternMatches, containsSecretPattern, containsSecretBytePattern, redactionMarker, replaceSecretLiterals, secretNeedles, BrowserScenarioSecrets;
function init_BrowserScenarioSecrets() {
	return (init_BrowserScenarioSecrets = __esmMin((() => {
		init_browserObservation();
		REDACTION_PREFIX = "[REDACTED:";
		encodedSecretValues = (secret) => new Set([encodeURIComponent(secret), new URLSearchParams([["value", secret]]).toString().slice("value=".length)]);
		normalizePercentEscapes = (value) => {
			if (!value.includes("%")) return value;
			return value.replace(/%[0-9a-f]{2}/giu, (escape) => escape.toLowerCase());
		};
		secretPatterns = (secret, spellings) => {
			if (secret === "") return [];
			const patterns = [{
				text: secret,
				searchText: secret,
				percentInsensitive: false
			}, ...[...encodedSecretValues(secret)].map((text) => ({
				text,
				searchText: normalizePercentEscapes(text),
				percentInsensitive: true
			}))];
			if (spellings === "text") patterns.push({
				text: JSON.stringify(secret).slice(1, -1),
				searchText: JSON.stringify(secret).slice(1, -1),
				percentInsensitive: false
			});
			const seen = new Set();
			return patterns.filter(({ text, percentInsensitive }) => {
				if (text === "") return false;
				const key = `${percentInsensitive ? "percent" : "literal"}:${text}`;
				if (seen.has(key)) return false;
				seen.add(key);
				return true;
			});
		};
		declaredPatterns = (values, spellings) => {
			const seen = new Set();
			return [...values.values()].flatMap((secret) => secretPatterns(secret, spellings)).filter(({ text, percentInsensitive }) => {
				const key = `${percentInsensitive ? "percent" : "literal"}:${text}`;
				if (seen.has(key)) return false;
				seen.add(key);
				return true;
			});
		};
		secretReplacements = (values, spellings) => [...values].flatMap(([id, secret]) => secretPatterns(secret, spellings).map((pattern) => ({
			id,
			...pattern
		}))).sort((left, right) => right.text.length - left.text.length || (left.id < right.id ? -1 : left.id > right.id ? 1 : 0));
		normalizePercentEscapesBytes = (value) => {
			if (value.indexOf(37) < 0) return value;
			const normalized = Buffer.from(value);
			for (let index = 0; index + 2 < normalized.length; index += 1) if (normalized[index] === 37 && isHexByte(normalized[index + 1]) && isHexByte(normalized[index + 2])) {
				normalized[index + 1] = lowercaseHexByte(normalized[index + 1]);
				normalized[index + 2] = lowercaseHexByte(normalized[index + 2]);
				index += 2;
			}
			return normalized;
		};
		isHexByte = (value) => value !== undefined && (value >= 48 && value <= 57 || value >= 65 && value <= 70 || value >= 97 && value <= 102);
		lowercaseHexByte = (value) => value >= 65 && value <= 70 ? value + 32 : value;
		patternMatches = (value, normalizedValue, pattern) => (pattern.percentInsensitive ? normalizedValue : value).includes(pattern.searchText);
		containsSecretPattern = (value, normalizedValue, patterns) => {
			if (patterns.length === 0) return false;
			return patterns.some((pattern) => patternMatches(value, normalizedValue, pattern));
		};
		containsSecretBytePattern = (value, normalizedValue, needles) => needles.some((needle) => (needle.percentInsensitive ? normalizedValue : value).includes(needle.needle));
		redactionMarker = (id, patterns) => {
			const candidates = [
				`${REDACTION_PREFIX}${id}]`,
				"[REDACTED]",
				"…",
				""
			];
			return candidates.find((candidate) => patterns.every((pattern) => !patternMatches(candidate, normalizePercentEscapes(candidate), pattern))) ?? "";
		};
		replaceSecretLiterals = (value, replacements, patterns) => {
			const normalizedValue = replacements.some(({ percentInsensitive }) => percentInsensitive) ? normalizePercentEscapes(value) : value;
			const parts = [];
			let offset = 0;
			while (offset < value.length) {
				let next;
				for (const replacement of replacements) {
					const search = replacement.searchText;
					const view = replacement.percentInsensitive ? normalizedValue : value;
					const index = view.indexOf(search, offset);
					if (index >= 0 && (next === undefined || index < next.index || index === next.index && replacement.text.length > next.text.length)) next = {
						...replacement,
						index
					};
				}
				if (next === undefined) break;
				const marker = redactionMarker(next.id, patterns);
				parts.push(value.slice(offset, next.index), marker);
				offset = next.index + next.text.length;
			}
			if (parts.length === 0) return value;
			parts.push(value.slice(offset));
			return parts.join("");
		};
		secretNeedles = (replacements, patterns) => replacements.map((pattern) => ({
			id: pattern.id,
			needle: Buffer.from(pattern.searchText),
			percentInsensitive: pattern.percentInsensitive,
			marker: Buffer.from(redactionMarker(pattern.id, patterns))
		}));
		BrowserScenarioSecrets = class BrowserScenarioSecrets {
			values;
			urlPatterns;
			textPatterns;
			urlReplacements;
			textReplacements;
			textNeedles;
			redactionCostPerCharacter;
			constructor(values) {
				this.values = values;
				this.urlPatterns = declaredPatterns(values, "url");
				this.textPatterns = declaredPatterns(values, "text");
				this.urlReplacements = secretReplacements(values, "url");
				this.textReplacements = secretReplacements(values, "text");
				this.textNeedles = secretNeedles(this.textReplacements, this.textPatterns);
				this.redactionCostPerCharacter = 8;
				for (const [replacements, patterns] of [[this.textReplacements, this.textPatterns], [this.urlReplacements, this.urlPatterns]]) for (const replacement of replacements) this.redactionCostPerCharacter = Math.max(this.redactionCostPerCharacter, 8 + (Buffer.byteLength(redactionMarker(replacement.id, patterns)) * 8 + 128) / replacement.text.length);
			}
			static resolve(scenario, environment) {
				const values = new Map();
				for (const declaration of scenario.secrets) {
					const value = environment[declaration.environment_variable];
					if (!Object.hasOwn(environment, declaration.environment_variable) || typeof value !== "string") return undefined;
					values.set(declaration.secret_id, value);
				}
				return new BrowserScenarioSecrets(values);
			}
			value(source) {
				if (source.source === "literal") return source.value;
				const value = this.values.get(source.secret_id);
				if (value === undefined) throw new Error("Validated browser secret was not resolved");
				return value;
			}
			url(destination) {
				const url = new URL(destination.url);
				for (const { name, value } of destination.query) url.searchParams.append(name, this.value(value));
				return url.href;
			}
			/** Conservative preflight for output expansion and per-match part arrays.
			* Callers measuring untrusted observations must reserve this cost before
			* invoking redaction. A one-byte secret can otherwise expand every byte.
			*/
			redactionAllocationCost(length) {
				return Math.ceil(length * this.redactionCostPerCharacter);
			}
			redact(value) {
				const patterns = this.textPatterns;
				if (patterns.length === 0) return value;
				const output = replaceSecretLiterals(value, this.textReplacements, patterns);
				return containsSecretPattern(output, normalizePercentEscapes(output), patterns) ? "" : output;
			}
			/** Replace declared UTF-8, URI/form, and JSON-escaped secret spellings. */
			redactBytes(value) {
				const patterns = this.textPatterns;
				if (patterns.length === 0) return value;
				const candidates = this.textNeedles;
				const hasPercentPatterns = candidates.some(({ percentInsensitive }) => percentInsensitive);
				const normalizedValue = hasPercentPatterns && value.indexOf(37) >= 0 ? normalizePercentEscapesBytes(value) : value;
				const sortedCandidates = candidates.map((candidate) => ({
					...candidate,
					index: (candidate.percentInsensitive ? normalizedValue : value).indexOf(candidate.needle)
				})).sort((left, right) => right.needle.length - left.needle.length || (left.id < right.id ? -1 : left.id > right.id ? 1 : 0));
				const parts = [];
				let offset = 0;
				while (true) {
					let next;
					for (const candidate of sortedCandidates) {
						if (candidate.index >= 0 && candidate.index < offset) candidate.index = (candidate.percentInsensitive ? normalizedValue : value).indexOf(candidate.needle, offset);
						if (candidate.index >= 0 && (next === undefined || candidate.index < next.index || candidate.index === next.index && candidate.needle.length > next.needle.length)) next = candidate;
					}
					if (next === undefined) break;
					parts.push(value.subarray(offset, next.index), next.marker);
					offset = next.index + next.needle.length;
				}
				if (parts.length === 0) return value;
				parts.push(value.subarray(offset));
				const redacted = Buffer.concat(parts);
				const normalizedRedacted = hasPercentPatterns && redacted.indexOf(37) >= 0 ? normalizePercentEscapesBytes(redacted) : redacted;
				return containsSecretBytePattern(redacted, normalizedRedacted, candidates) ? Buffer.alloc(0) : redacted;
			}
			/** Remove only declared secret values from one URL and report that action. */
			sanitizeUrl(value) {
				const patterns = this.urlPatterns;
				if (patterns.length === 0) return sanitizeBrowserUrl(value);
				const output = replaceSecretLiterals(value, this.urlReplacements, patterns);
				if (containsSecretPattern(output, normalizePercentEscapes(output), patterns)) return {
					url: "",
					origin: null,
					query_parameter_names: [],
					redacted: true
				};
				const sanitized = sanitizeBrowserUrl(output);
				return {
					...sanitized,
					redacted: sanitized.redacted || output !== value
				};
			}
			fingerprint(value) {
				const patterns = this.textPatterns;
				if (patterns.length > 0 && containsSecretPattern(value, normalizePercentEscapes(value), patterns)) return {
					value_state: "redacted-secret",
					value_sha256: null
				};
				return {
					value_state: "hashed",
					value_sha256: createHash("sha256").update(value).digest("hex")
				};
			}
		};
	})))();
}

//#endregion
//#region dist/browser/PlaywrightScenarioBrowser.js
var OPERATION$2, throwIfScenarioCancelled$1, PlaywrightScenarioBrowserCleanupOwner, attachedScenarioAdmissions, releaseAttachedScenario, createAttachedScenarioRelease, attachedScenarioLeaseKey, acquireAttachedScenario, allowedBrowserEnvironment, findConnectedPage, AttachedScenarioEnvironmentOwner, failBrowserScenarioOperation, openAttachedScenarioBrowser, openPlaywrightScenarioBrowser;
function init_PlaywrightScenarioBrowser() {
	return (init_PlaywrightScenarioBrowser = __esmMin((() => {
		init_providerIdentities();
		init_analysisErrorCleanup();
		init_providerAdapterError();
		init_AnalysisCleanupLease();
		init_analysisErrorBase();
		init_browserObservation();
		init_browserObservationError();
		init_PlaywrightExecutionBoundary();
		OPERATION$2 = "capture_browser_scenario";
		throwIfScenarioCancelled$1 = (signal) => {
			if (signal?.aborted === true) throw new BrowserObservationError(OPERATION$2, "cancelled", { cause: signal?.reason });
		};
		PlaywrightScenarioBrowserCleanupOwner = class {
			resources;
			#browserClosed = false;
			#profileRemoved;
			#eventFinalizationPromise;
			#eventsFinalized = false;
			cleanupLease;
			/** Keep the narrow provider actions needed to release one opened browser. */
			constructor(resources) {
				this.resources = resources;
				this.#profileRemoved = resources.removeProfile === undefined;
				this.cleanupLease = new AnalysisCleanupLease(() => this.#closeResources().finally(() => this.resources.onSettled?.(this.#browserClosed)), this);
			}
			get browserClosed() {
				return this.#browserClosed;
			}
			get cleanupResources() {
				return [
					...!this.#eventsFinalized ? ["browser_events"] : [],
					...!this.#browserClosed ? ["browser_transport"] : [],
					...!this.#profileRemoved ? ["browser_profile"] : []
				];
			}
			/** Await actual resource release, including a late browser acknowledgement. */
			release(finishEvents) {
				this.#prepareEvents(finishEvents);
				return this.cleanupLease.release();
			}
			close(finishEvents) {
				return this.#awaitCleanup(this.release(finishEvents));
			}
			#prepareEvents(finishEvents) {
				this.#eventFinalizationPromise ??= Promise.resolve().then(async () => {
					await finishEvents?.();
					this.#eventsFinalized = true;
				});
			}
			async #awaitCleanup(cleanup) {
				try {
					await withPlaywrightExecutionBoundary(() => cleanup, PLAYWRIGHT_CLEANUP_CONFIRMATION_TIMEOUT_MS);
				} catch (cause) {
					const failure = new BrowserObservationError(OPERATION$2, "cleanup_failed", {
						cause,
						cleanup: {
							reason: cause instanceof Error ? cause.message : String(cause),
							resources: this.cleanupResources
						}
					});
					new AnalysisCleanupLeaseGroup(failure, [this.cleanupLease]);
					throw failure;
				}
			}
			async #closeResources() {
				const failures = [];
				this.#prepareEvents();
				try {
					await this.#eventFinalizationPromise;
				} catch (cause) {
					failures.push(cause);
				}
				if (!this.#browserClosed) {
					try {
						await this.resources.closeBrowser();
						this.#browserClosed = true;
					} catch (cause) {
						failures.push(cause);
					}
				}
				if (this.#browserClosed && !this.#profileRemoved && this.resources.removeProfile !== undefined) {
					try {
						await this.resources.removeProfile();
						this.#profileRemoved = true;
					} catch (cause) {
						failures.push(cause);
					}
				}
				if (failures.length === 1) throw failures[0];
				if (failures.length > 1) throw new AggregateError(failures, "Browser session cleanup failed");
			}
		};
		attachedScenarioAdmissions = new Map();
		releaseAttachedScenario = (key, admission) => {
			const waiter = admission.waiters.shift();
			if (waiter === undefined) {
				admission.active = false;
				if (admission.cleanupOwner === undefined && attachedScenarioAdmissions.get(key) === admission) attachedScenarioAdmissions.delete(key);
				return;
			}
			if (waiter.onAbort !== undefined) waiter.signal?.removeEventListener("abort", waiter.onAbort);
			if (waiter.signal?.aborted === true) {
				waiter.reject(new BrowserObservationError(OPERATION$2, "cancelled", { cause: waiter.signal.reason }));
				releaseAttachedScenario(key, admission);
				return;
			}
			waiter.resolve(createAttachedScenarioRelease(key, admission));
		};
		createAttachedScenarioRelease = (key, admission) => {
			let released = false;
			return () => {
				if (released) return;
				released = true;
				releaseAttachedScenario(key, admission);
			};
		};
		attachedScenarioLeaseKey = (endpoint, targetId) => {
			const discovery = new URL("/json/version", endpoint);
			if (isLiteralLoopbackHostname(discovery.hostname)) discovery.hostname = "127.0.0.1";
			return JSON.stringify([discovery.href, targetId]);
		};
		acquireAttachedScenario = (scenario, signal) => {
			if (signal?.aborted === true) return Promise.reject(new BrowserObservationError(OPERATION$2, "cancelled", { cause: signal?.reason }));
			const key = attachedScenarioLeaseKey(scenario.cdp_endpoint, scenario.target_id);
			const admission = attachedScenarioAdmissions.get(key) ?? {
				active: false,
				waiters: [],
				cleanupOwner: undefined
			};
			attachedScenarioAdmissions.set(key, admission);
			return new Promise((resolve, reject) => {
				const grant = (release) => resolve({
					admission,
					release
				});
				if (!admission.active) {
					admission.active = true;
					grant(createAttachedScenarioRelease(key, admission));
					return;
				}
				const waiter = {
					signal,
					resolve: (release) => grant(release),
					reject,
					onAbort: undefined
				};
				admission.waiters.push(waiter);
				if (signal !== undefined) {
					const onAbort = () => {
						const index = admission.waiters.indexOf(waiter);
						if (index < 0) return;
						admission.waiters.splice(index, 1);
						signal.removeEventListener("abort", onAbort);
						reject(new BrowserObservationError(OPERATION$2, "cancelled", { cause: signal?.reason }));
						if (!admission.active && admission.waiters.length === 0) releaseAttachedScenario(key, admission);
					};
					waiter.onAbort = onAbort;
					signal.addEventListener("abort", onAbort, { once: true });
					if (signal.aborted) {
						onAbort();
						return;
					}
				}
			});
		};
		allowedBrowserEnvironment = (environment) => {
			const allowed = [
				"DBUS_SESSION_BUS_ADDRESS",
				"DISPLAY",
				"HOME",
				"LANG",
				"LD_LIBRARY_PATH",
				"PATH",
				"SystemRoot",
				"TEMP",
				"TMP",
				"TMPDIR",
				"WAYLAND_DISPLAY",
				"XAUTHORITY",
				"XDG_RUNTIME_DIR"
			];
			const selected = Object.fromEntries(allowed.map((name) => [name, environment[name]]).filter((entry) => entry[1] !== undefined));
			if (process.platform !== "android") return selected;
			const prefix = environment.PREFIX;
			if (prefix === undefined) return selected;
			return {
				...selected,
				LD_PRELOAD: `${prefix}/lib/libtermux-exec.so`,
				TERMUX_EXEC__PROC_SELF_EXE: process.execPath
			};
		};
		findConnectedPage = async (browser, targetId, signal) => {
			for (const context of browser.contexts()) for (const page of context.pages()) {
				const session = await context.newCDPSession(page);
				try {
					throwIfScenarioCancelled$1(signal);
					const { targetInfo } = await session.send("Target.getTargetInfo");
					throwIfScenarioCancelled$1(signal);
					if (targetInfo.targetId !== targetId) continue;
					return {
						context,
						page
					};
				} finally {
					await session.detach();
				}
			}
			throw new BrowserObservationError(OPERATION$2, "target_not_found");
		};
		AttachedScenarioEnvironmentOwner = class AttachedScenarioEnvironmentOwner {
			page;
			session;
			#mediaOverride = false;
			#deviceMetricsOverride = false;
			#localeOverride = false;
			#timezoneOverride = false;
			#detached = false;
			#application;
			constructor(page, session) {
				this.page = page;
				this.session = session;
			}
			static async create(context, page) {
				return new AttachedScenarioEnvironmentOwner(page, await context.newCDPSession(page));
			}
			get restored() {
				return !this.#mediaOverride && !this.#deviceMetricsOverride && !this.#localeOverride && !this.#timezoneOverride;
			}
			get targetClosed() {
				return this.page.isClosed();
			}
			apply(environment, signal) {
				const application = this.#application ?? this.#applyEnvironment(environment, signal);
				this.#application = application;
				return application;
			}
			async #applyEnvironment(environment, signal) {
				await this.page.emulateMedia({
					colorScheme: environment.color_scheme,
					reducedMotion: environment.reduced_motion
				});
				this.#mediaOverride = true;
				throwIfScenarioCancelled$1(signal);
				await this.session.send("Emulation.setDeviceMetricsOverride", {
					width: environment.viewport.width,
					height: environment.viewport.height,
					deviceScaleFactor: environment.viewport.device_scale_factor,
					mobile: false,
					dontSetVisibleSize: true
				});
				this.#deviceMetricsOverride = true;
				throwIfScenarioCancelled$1(signal);
				await this.session.send("Emulation.setLocaleOverride", { locale: environment.locale });
				this.#localeOverride = true;
				throwIfScenarioCancelled$1(signal);
				await this.session.send("Emulation.setTimezoneOverride", { timezoneId: environment.timezone });
				this.#timezoneOverride = true;
				throwIfScenarioCancelled$1(signal);
			}
			async close() {
				if (this.#detached) return;
				try {
					await this.#application;
				} catch {}
				const failures = [];
				if (this.#timezoneOverride) {
					try {
						await this.session.send("Emulation.setTimezoneOverride", { timezoneId: "" });
						this.#timezoneOverride = false;
					} catch (cause) {
						failures.push(cause);
					}
				}
				if (this.#localeOverride) {
					try {
						await this.session.send("Emulation.setLocaleOverride", { locale: "" });
						this.#localeOverride = false;
					} catch (cause) {
						failures.push(cause);
					}
				}
				if (this.#deviceMetricsOverride) {
					try {
						await this.session.send("Emulation.clearDeviceMetricsOverride");
						this.#deviceMetricsOverride = false;
					} catch (cause) {
						failures.push(cause);
					}
				}
				if (this.#mediaOverride) {
					try {
						await this.page.emulateMedia({
							colorScheme: null,
							reducedMotion: null
						});
						this.#mediaOverride = false;
					} catch (cause) {
						failures.push(cause);
					}
				}
				if (failures.length === 1) throw failures[0];
				if (failures.length > 1) throw new AggregateError(failures, "Attached browser environment restoration failed");
				await this.session.detach();
				this.#detached = true;
			}
		};
		failBrowserScenarioOperation = async (cleanup, primaryFailure) => {
			try {
				await withPlaywrightExecutionBoundary(() => cleanup.release(), PLAYWRIGHT_CLEANUP_CONFIRMATION_TIMEOUT_MS);
			} catch (cause) {
				const primary = primaryFailure instanceof AnalysisError ? primaryFailure : new ProviderAdapterError(PLAYWRIGHT_BROWSER_SCENARIO_PROVIDER_IDENTITY.id, OPERATION$2, { cause: primaryFailure });
				const failure = new BrowserObservationError(OPERATION$2, "cleanup_failed", {
					cause,
					cleanup: {
						reason: cause instanceof Error ? cause.message : String(cause),
						resources: cleanup.cleanupResources ?? []
					}
				});
				new AnalysisCleanupLeaseGroup(failure, [cleanup]);
				throw analysisErrorWithCleanupFailure(primary, failure, OPERATION$2).bindCleanupDependencies([primary, failure]);
			}
			throw primaryFailure;
		};
		openAttachedScenarioBrowser = async (browserRequest, environment, launcher, signal, retainCleanup) => {
			const lease = await acquireAttachedScenario(browserRequest, signal);
			let cleanupOwner;
			let environmentOwner;
			try {
				const priorOwner = lease.admission.cleanupOwner;
				if (priorOwner !== undefined) await priorOwner.close();
				throwIfScenarioCancelled$1(signal);
				const browser = await launcher.connectOverCDP(browserRequest.cdp_endpoint);
				const cleanup = new PlaywrightScenarioBrowserCleanupOwner({
					closeBrowser: async () => {
						let environmentFailure;
						const ownedEnvironment = environmentOwner;
						if (ownedEnvironment !== undefined) {
							try {
								await ownedEnvironment.close();
								environmentOwner = undefined;
							} catch (cause) {
								environmentFailure = cause;
								const browserConnected = browser.isConnected();
								if (ownedEnvironment.targetClosed || !browserConnected) {
									environmentOwner = undefined;
									if (!browserConnected) return;
								} else if (!ownedEnvironment.restored) {
									throw cause;
								}
							}
						}
						try {
							await browser.close();
							environmentOwner = undefined;
						} catch (browserFailure) {
							if (environmentFailure !== undefined) throw new AggregateError([environmentFailure, browserFailure], "Attached browser environment cleanup failed");
							throw browserFailure;
						}
					},
					onSettled: (browserClosed) => {
						if (browserClosed && lease.admission.cleanupOwner === cleanup) lease.admission.cleanupOwner = undefined;
						lease.release();
					},
					removeProfile: undefined
				});
				cleanupOwner = cleanup;
				lease.admission.cleanupOwner = cleanup;
				throwIfScenarioCancelled$1(signal);
				const target = await withPlaywrightExecutionBoundary(() => findConnectedPage(browser, browserRequest.target_id, signal), undefined, signal);
				throwIfScenarioCancelled$1(signal);
				const configuredEnvironment = await withPlaywrightExecutionBoundary(() => AttachedScenarioEnvironmentOwner.create(target.context, target.page), undefined, signal);
				environmentOwner = configuredEnvironment;
				await withPlaywrightExecutionBoundary(() => configuredEnvironment.apply(environment, signal), undefined, signal);
				return {
					...target,
					browser,
					profilePath: undefined,
					cleanup
				};
			} catch (cause) {
				if (cleanupOwner === undefined) {
					lease.release();
					throw cause;
				}
				const cleanup = cleanupOwner;
				const recovery = cleanup.cleanupLease;
				try {
					return await failBrowserScenarioOperation(recovery, cause);
				} catch (failure) {
					if (failure !== cause) retainCleanup?.(recovery);
					throw failure;
				}
			}
		};
		openPlaywrightScenarioBrowser = async (scenario, environment, options = {}) => {
			const launcher = options.launcher ?? (await import("playwright-core")).chromium;
			if (scenario.browser.mode === "connect") return openAttachedScenarioBrowser(scenario.browser, scenario.environment, launcher, options.signal, options.retainCleanup);
			const profilePath = await mkdtemp(join(tmpdir(), "rea-browser-scenario-"));
			let context;
			try {
				await chmod(profilePath, 448);
				context = await launcher.launchPersistentContext(profilePath, {
					executablePath: resolve(scenario.browser.executable_path),
					headless: scenario.browser.headless,
					acceptDownloads: false,
					viewport: {
						width: scenario.environment.viewport.width,
						height: scenario.environment.viewport.height
					},
					deviceScaleFactor: scenario.environment.viewport.device_scale_factor,
					locale: scenario.environment.locale,
					timezoneId: scenario.environment.timezone,
					colorScheme: scenario.environment.color_scheme,
					reducedMotion: scenario.environment.reduced_motion,
					serviceWorkers: scenario.environment.service_workers,
					env: allowedBrowserEnvironment(environment),
					handleSIGHUP: false,
					handleSIGINT: false,
					handleSIGTERM: false,
					timeout: 0,
					args: process.platform === "android" ? ["--no-sandbox", "--single-process"] : []
				});
			} catch (cause) {
				const cleanup = new AnalysisCleanupLease(() => rm(profilePath, {
					recursive: true,
					force: true,
					maxRetries: 3
				}), ["browser_profile"]);
				try {
					return await failBrowserScenarioOperation(cleanup, cause);
				} catch (failure) {
					if (failure !== cause) options.retainCleanup?.(cleanup);
					throw failure;
				}
			}
			const cleanup = new PlaywrightScenarioBrowserCleanupOwner({
				closeBrowser: () => context.close(),
				removeProfile: () => rm(profilePath, {
					recursive: true,
					force: true,
					maxRetries: 3
				})
			});
			try {
				const browser = context.browser();
				if (browser === null) throw new BrowserObservationError(OPERATION$2, "protocol_error");
				const page = context.pages()[0] ?? await context.newPage();
				return {
					context,
					page,
					browser,
					profilePath,
					cleanup
				};
			} catch (cause) {
				const recovery = cleanup.cleanupLease;
				try {
					return await failBrowserScenarioOperation(recovery, cause);
				} catch (failure) {
					if (failure !== cause) options.retainCleanup?.(recovery);
					throw failure;
				}
			}
		};
	})))();
}

//#endregion
//#region dist/browser/PlaywrightScenarioActions.js
var resolveLocator, resolveValue, performPlaywrightScenarioAction;
function init_PlaywrightScenarioActions() {
	return (init_PlaywrightScenarioActions = __esmMin((() => {
		resolveLocator = (page, locator) => {
			switch (locator.kind) {
				case "test_id": return page.getByTestId(locator.value);
				case "role": return page.getByRole(locator.role, {
					name: locator.name,
					exact: true
				});
				case "css": return page.locator(locator.selector);
			}
		};
		resolveValue = (value, secrets) => secrets.value(value);
		performPlaywrightScenarioAction = async (input) => {
			const { page, action, secrets } = input;
			const timeout = "timeout_ms" in action ? action.timeout_ms : undefined;
			const options = timeout === undefined ? {} : { timeout };
			switch (action.action) {
				case "goto":
					await page.goto(secrets.url(action.destination), {
						...options,
						waitUntil: action.wait_until
					});
					return;
				case "click":
					await resolveLocator(page, action.locator).click({
						...options,
						button: action.button,
						clickCount: action.click_count
					});
					return;
				case "fill":
					await resolveLocator(page, action.locator).fill(resolveValue(action.value, secrets), options);
					return;
				case "press":
					await resolveLocator(page, action.locator).press(action.key, options);
					return;
				case "select_option":
					await resolveLocator(page, action.locator).selectOption(resolveValue(action.value, secrets), options);
					return;
				case "check":
					await resolveLocator(page, action.locator).check(options);
					return;
				case "uncheck":
					await resolveLocator(page, action.locator).uncheck(options);
					return;
				case "wait_for":
					await resolveLocator(page, action.locator).waitFor({
						...options,
						state: action.state
					});
					return;
				case "wait_for_timeout": await page.waitForTimeout(action.duration_ms);
			}
		};
	})))();
}

//#endregion
//#region dist/browser/PlaywrightScenarioArtifacts.js
var historyValueSchema, storageValueSchema, notRequested, missing, textArtifact, captureScreenshot, captureDom, captureAccessibility, navigationType, captureHistory, captureStorage, capturePlaywrightStepArtifacts;
function init_PlaywrightScenarioArtifacts() {
	return (init_PlaywrightScenarioArtifacts = __esmMin((() => {
		init_browserScenarioCaptureValues();
		historyValueSchema = z.strictObject({
			length: z.number().int().min(0),
			navigation_entries: z.array(z.strictObject({
				type: z.string(),
				name: z.string()
			}))
		});
		storageValueSchema = z.strictObject({
			local_storage: z.array(z.tuple([z.string(), z.string()])),
			session_storage: z.array(z.tuple([z.string(), z.string()]))
		});
		notRequested = () => ({ state: "not_requested" });
		missing = (reason) => ({
			state: "missing",
			reason
		});
		textArtifact = (text) => {
			const bytes = Buffer.from(text);
			return {
				state: "captured",
				value: {
					sha256: createHash("sha256").update(bytes).digest("hex"),
					bytes: bytes.byteLength,
					text
				}
			};
		};
		captureScreenshot = async (page) => {
			try {
				const bytes = await page.screenshot({
					type: "png",
					fullPage: false,
					animations: "disabled",
					caret: "hide"
				});
				const sha256 = createHash("sha256").update(bytes).digest("hex");
				return {
					state: "captured",
					value: {
						sha256,
						bytes: bytes.byteLength,
						media_type: "image/png",
						data_base64: bytes.toString("base64")
					}
				};
			} catch (cause) {
				void cause;
				return missing("screenshot capture failed");
			}
		};
		captureDom = async (input) => {
			const { page, secrets } = input;
			try {
				return textArtifact(secrets.redact(await page.content()));
			} catch (cause) {
				void cause;
				return missing("DOM capture failed");
			}
		};
		captureAccessibility = async (input) => {
			const { page, secrets } = input;
			try {
				const text = await page.locator("html").ariaSnapshot();
				return textArtifact(secrets.redact(text));
			} catch (cause) {
				void cause;
				return missing("accessibility capture failed");
			}
		};
		navigationType = (value) => {
			switch (value) {
				case "navigate":
				case "reload":
				case "back_forward":
				case "prerender": return value;
				default: return "unknown";
			}
		};
		captureHistory = async (page, secrets) => {
			try {
				const raw = historyValueSchema.parse(await page.evaluate(`(() => ({
        length: window.history.length,
        navigation_entries: performance.getEntriesByType("navigation").map(
          entry => ({
            type: typeof entry.type === "string" ? entry.type : "unknown",
            name: entry.name
          })
        )
      }))()`));
				const value = {
					length: raw.length,
					current_url: secrets.sanitizeUrl(page.url()),
					navigation_entries: raw.navigation_entries.map(({ type, name }) => ({
						type: navigationType(type),
						name: secrets.sanitizeUrl(name)
					}))
				};
				return {
					state: "captured",
					value
				};
			} catch (cause) {
				void cause;
				return missing("history capture failed");
			}
		};
		captureStorage = async (input) => {
			const { context, page, secrets } = input;
			try {
				const pageUrl = new URL(page.url());
				const cookies = pageUrl.protocol === "http:" || pageUrl.protocol === "https:" ? await context.cookies(pageUrl.href) : [];
				const pageStorage = storageValueSchema.parse(await page.evaluate(`(() => ({
        local_storage: Object.entries(window.localStorage),
        session_storage: Object.entries(window.sessionStorage)
      }))()`));
				const value = {
					cookies: cookies.map((cookie) => ({
						name: secrets.redact(cookie.name),
						domain: secrets.redact(cookie.domain),
						path: secrets.redact(cookie.path),
						secure: cookie.secure,
						http_only: cookie.httpOnly,
						same_site: cookie.sameSite,
						...secrets.fingerprint(cookie.value)
					})),
					local_storage: pageStorage.local_storage.map(([name, value]) => ({
						name: secrets.redact(name),
						...secrets.fingerprint(value)
					})),
					session_storage: pageStorage.session_storage.map(([name, value]) => ({
						name: secrets.redact(name),
						...secrets.fingerprint(value)
					}))
				};
				return {
					state: "captured",
					value
				};
			} catch (cause) {
				void cause;
				return missing("storage capture failed");
			}
		};
		capturePlaywrightStepArtifacts = async (input) => {
			const { context, page, secrets, requested } = input;
			const state = (kind, capture) => !requested.has(kind) ? Promise.resolve(notRequested()) : capture();
			return browserStepArtifactsSchema.parse({
				screenshot: await state("screenshot", () => captureScreenshot(page)),
				dom: await state("dom", () => captureDom({
					page,
					secrets
				})),
				accessibility: await state("accessibility", () => captureAccessibility({
					page,
					secrets
				})),
				url: await state("url", async () => ({
					state: "captured",
					value: secrets.sanitizeUrl(page.url())
				})),
				history: await state("history", () => captureHistory(page, secrets)),
				storage: await state("storage", () => captureStorage({
					context,
					page,
					secrets
				}))
			});
		};
	})))();
}

//#endregion
//#region dist/browser/network/PlaywrightNetworkContent.js
var credentialHeaders, errorMessage, captureNetworkHeaders, captureNetworkBody;
function init_PlaywrightNetworkContent() {
	return (init_PlaywrightNetworkContent = __esmMin((() => {
		init_analysisErrorCore();
		init_PlaywrightExecutionBoundary();
		credentialHeaders = new Set([
			"authorization",
			"proxy-authorization",
			"cookie",
			"set-cookie"
		]);
		errorMessage = (cause, secrets, maxMetadataAllocationBytes) => {
			const message = cause instanceof Error && cause.message !== "" ? cause.message : "Network read failed";
			return secrets.redactionAllocationCost(message.length) <= maxMetadataAllocationBytes ? secrets.redact(message) : "Network read failed; diagnostic exceeds the allocation budget.";
		};
		captureNetworkHeaders = async (source, secrets, options) => {
			try {
				const headers = await withPlaywrightExecutionBoundary(() => source.headersArray(), options.timeoutMs, options.signal);
				let cost = 0;
				for (const { name, value } of headers) {
					cost += secrets.redactionAllocationCost(name.length + value.length) + 128;
					if (cost > options.maxHeaderAllocationBytes) return {
						state: "unavailable",
						message: `Headers exceed the ${String(options.maxHeaderAllocationBytes)}-byte allocation budget.`
					};
				}
				return {
					state: "captured",
					items: headers.map(({ name, value }) => {
						const safeName = secrets.redact(name);
						const credential = credentialHeaders.has(name.toLowerCase());
						const safeValue = credential ? null : secrets.redactBytes(Buffer.from(value)).toString("utf8");
						return {
							name: safeName,
							value: safeValue,
							redacted: credential || safeName !== name || safeValue !== value
						};
					})
				};
			} catch (cause) {
				return {
					state: "unavailable",
					message: errorMessage(cause, secrets, options.maxMetadataAllocationBytes)
				};
			}
		};
		captureNetworkBody = async (read, phase, source, secrets, options, preflight) => {
			try {
				const observed = await withPlaywrightExecutionBoundary(read, options.timeoutMs, options.signal);
				if (observed === null) return { state: "not_exposed" };
				const maxBodyBytes = options.maxBodyBytes;
				if (observed.length > maxBodyBytes) return {
					state: "unavailable",
					reason: "body-size-limit",
					message: `Playwright materialized the body before its ${String(maxBodyBytes)}-byte retained-body budget was checked.`,
					limit_bytes: maxBodyBytes,
					observed_bytes: observed.length
				};
				const bodyAllocationCost = secrets.redactionAllocationCost(observed.length);
				const base64AllocationCost = Math.ceil(observed.length / 3) * 4 * 8 + 2;
				const maxBodyAllocationBytes = options.maxBodyAllocationBytes;
				const observedBodyAllocationBytes = Math.max(bodyAllocationCost, base64AllocationCost);
				if (observedBodyAllocationBytes > maxBodyAllocationBytes) return {
					state: "unavailable",
					reason: "body-allocation-limit",
					message: "Body redaction exceeds the selected network body allocation budget.",
					limit_allocation_bytes: maxBodyAllocationBytes,
					observed_allocation_bytes: observedBodyAllocationBytes
				};
				const contentType = source.headers()["content-type"];
				if (contentType !== undefined && secrets.redactionAllocationCost(contentType.length) > options.maxHeaderAllocationBytes) return {
					state: "unavailable",
					reason: "body-allocation-limit",
					message: "Content type exceeds the selected network header allocation budget.",
					limit_allocation_bytes: options.maxHeaderAllocationBytes,
					observed_allocation_bytes: secrets.redactionAllocationCost(contentType.length)
				};
				const admission = preflight?.({
					observedBytes: observed.length,
					allocationBytes: observedBodyAllocationBytes,
					mediaType: contentType
				});
				if (admission?.status === "omitted") return {
					state: "omitted",
					reason: admission.reason
				};
				const retained = secrets.redactBytes(observed);
				return {
					state: "captured",
					representation: phase === "request" ? "browser-exposed-request-bytes" : "playwright-response-body-bytes",
					encoding: "base64",
					content: retained.toString("base64"),
					bytes: retained.length,
					sha256: createHash("sha256").update(retained).digest("hex"),
					media_type: contentType === undefined ? null : secrets.redactBytes(Buffer.from(contentType)).toString("utf8"),
					redacted: !retained.equals(observed)
				};
			} catch (cause) {
				return {
					state: "unavailable",
					reason: cause instanceof AnalysisCancelledError ? "cancelled" : cause instanceof AnalysisTimeoutError ? "body-read-timeout" : "body-read-failed",
					message: errorMessage(cause, secrets, options.maxMetadataAllocationBytes)
				};
			}
		};
	})))();
}

//#endregion
//#region dist/browser/network/PlaywrightScenarioNetwork.js
var PlaywrightScenarioNetwork;
function init_PlaywrightScenarioNetwork() {
	return (init_PlaywrightScenarioNetwork = __esmMin((() => {
		init_PlaywrightNetworkContent();
		PlaywrightScenarioNetwork = class {
			options;
			transactions = new Map();
			omittedRequests = new WeakSet();
			omittedPhases = new WeakMap();
			totalTransactions = 0;
			omittedTransactionCount = 0;
			firstOmittedTransaction = 0;
			lastOmittedTransaction = 0;
			/** One request and one response-content job at most per admitted transaction. */
			pending = [];
			queuedReads = [];
			gaps = new Set();
			accepting = true;
			activeReads = 0;
			readOptions;
			limits;
			constructor(options) {
				this.options = options;
				this.limits = options.limits;
				this.readOptions = {
					timeoutMs: options.readTimeoutMs ?? 5e3,
					maxBodyBytes: this.limits.max_network_body_bytes,
					maxBodyAllocationBytes: this.limits.max_network_body_allocation_bytes,
					maxHeaderAllocationBytes: this.limits.max_network_header_allocation_bytes,
					maxMetadataAllocationBytes: this.limits.max_network_metadata_allocation_bytes,
					...options.signal === undefined ? {} : { signal: options.signal }
				};
			}
			/** Observe a request start, retaining the producer's redirect relationship when known. */
			request(request) {
				if (!this.accepting) return;
				const transaction = this.transaction(request);
				if (transaction === undefined) {
					this.omitOmittedTransactionPhase(request, "request");
					if (this.options.selection.request_body || this.options.selection.header_values) this.omitOmittedTransactionContent(request, "request");
					return;
				}
				if (transaction.requestObserved) return;
				if (!this.admitMetadata(transaction, "request", request)) return;
				transaction.requestObserved = true;
				const admission = this.options.emit({
					...this.metadata(request, transaction),
					kind: "request",
					status: null,
					failure: null
				});
				if (admission.status === "omitted") {
					this.options.omitNetwork(transaction.id, "request", admission.reason);
					return;
				}
				const sequence = admission.sequence;
				if (this.options.selection.request_body || this.options.selection.header_values) this.collect(transaction, sequence, "request", request, (headers) => this.options.selection.request_body ? captureNetworkBody(async () => request.postDataBuffer(), "request", request, this.options.secrets, this.readOptions, (body) => this.options.admitContentBody({
					transactionId: transaction.id,
					sourceEventSequence: sequence,
					phase: "request",
					headers,
					observedBytes: body.observedBytes,
					allocationBytes: body.allocationBytes,
					mediaType: body.mediaType
				})) : Promise.resolve({ state: "not_requested" }), this.options.selection.header_values);
			}
			/** Observe response metadata without starting a potentially unfinished body read. */
			response(response) {
				if (!this.accepting) return;
				const request = response.request();
				const transaction = this.transaction(request);
				if (transaction === undefined) {
					this.omitOmittedTransactionPhase(request, "response");
					this.observeOmittedTransactionPhase(request, "response");
					return;
				}
				if (!this.admitMetadata(transaction, "response", request, undefined, [], [{
					source: response,
					url: response.url()
				}])) return;
				const admission = this.options.emit({
					...this.metadata(request, transaction),
					kind: "response",
					url: this.options.secrets.sanitizeUrl(response.url()),
					status: response.status(),
					header_names: this.headerNames(response),
					failure: null
				});
				if (admission.status === "omitted") {
					this.options.omitNetwork(transaction.id, "response", admission.reason);
					return;
				}
				const sequence = admission.sequence;
				transaction.response = {
					source: response,
					sequence
				};
			}
			/** Record completion and read selected content through the response API. */
			finished(request) {
				if (!this.accepting) return;
				const transaction = this.transaction(request);
				if (transaction === undefined) {
					this.omitOmittedTransactionPhase(request, "request-finished");
					const observed = this.omittedPhases.get(request);
					if (observed?.has("response") && (this.options.selection.response_body || this.options.selection.header_values)) this.omitOmittedTransactionContent(request, "response");
					return;
				}
				if (!this.admitMetadata(transaction, "request-finished", request)) return;
				transaction.terminal = "finished";
				const admission = this.options.emit({
					...this.metadata(request, transaction),
					kind: "request-finished",
					status: null,
					failure: null
				});
				if (admission.status === "omitted") {
					this.options.omitNetwork(transaction.id, "request-finished", admission.reason);
					transaction.responseScheduled = true;
					return;
				}
				this.responseContent(transaction);
			}
			/** Preserve request failure separately from missing or unreadable response content. */
			failed(request) {
				if (!this.accepting) return;
				const transaction = this.transaction(request);
				if (transaction === undefined) {
					this.omitOmittedTransactionPhase(request, "request-failed");
					return;
				}
				transaction.terminal = "failed";
				const failure = request.failure()?.errorText || "Unknown request failure";
				if (!this.admitMetadata(transaction, "request-failed", request, undefined, [failure])) return;
				const message = this.options.secrets.redact(failure);
				const admission = this.options.emit({
					...this.metadata(request, transaction),
					kind: "request-failed",
					status: null,
					failure: message
				});
				if (admission.status === "omitted") {
					this.options.omitNetwork(transaction.id, "request-failed", admission.reason);
					transaction.responseScheduled = true;
					return;
				}
				this.responseContent(transaction, {
					state: "unavailable",
					reason: "request-failed",
					message
				});
			}
			/** Stop observing, mark unfinished transactions, and drain admitted content reads. */
			async finish() {
				if (!this.accepting) {
					await this.settlePendingReads();
					return;
				}
				this.accepting = false;
				for (const [request, transaction] of this.transactions) {
					if (transaction.terminal === undefined) {
						if (!this.admitMetadata(transaction, "request-unfinished", request)) continue;
						this.gaps.add("Some network requests had not completed when capture ended; later activity is unknown.");
						const admission = this.options.emit({
							...this.metadata(request, transaction),
							kind: "request-unfinished",
							status: null,
							failure: null,
							reason: this.options.signal?.aborted === true ? "cancelled" : "capture-ended"
						});
						if (admission.status === "omitted") {
							this.options.omitNetwork(transaction.id, "request-unfinished", admission.reason);
							transaction.responseScheduled = true;
							continue;
						}
						this.responseContent(transaction, {
							state: "unavailable",
							reason: this.options.signal?.aborted === true ? "cancelled" : "response-unfinished",
							message: "The response had not finished at the capture cutoff; no body read or refetch was attempted."
						});
					}
				}
				await this.settlePendingReads();
			}
			async settlePendingReads() {
				const results = await Promise.allSettled(this.pending);
				const failed = results.find((result) => result.status === "rejected");
				if (failed !== undefined) throw failed.reason;
			}
			/** Missing selected content contributes to aggregate completeness. */
			limitations() {
				return [...this.gaps];
			}
			omittedTransactionRange() {
				return this.omittedTransactionCount === 0 ? null : {
					first_transaction_id: `request-${String(this.firstOmittedTransaction)}`,
					last_transaction_id: `request-${String(this.lastOmittedTransaction)}`,
					count: this.omittedTransactionCount,
					reason: "max-network-transactions"
				};
			}
			transaction(request) {
				const known = this.transactions.get(request);
				if (known !== undefined) return known;
				if (this.omittedRequests.has(request)) return undefined;
				this.totalTransactions += 1;
				const id = `request-${String(this.totalTransactions)}`;
				if (this.transactions.size >= this.limits.max_network_transactions) {
					this.omittedRequests.add(request);
					if (this.omittedTransactionCount === 0) this.firstOmittedTransaction = this.totalTransactions;
					this.lastOmittedTransaction = this.totalTransactions;
					this.omittedTransactionCount += 1;
					this.gaps.add(`Network collection reached its ${String(this.limits.max_network_transactions)}-transaction resource budget; omitted transaction IDs are listed in events.omissions.network_transaction_range.`);
					return undefined;
				}
				const predecessor = request.redirectedFrom();
				const predecessorTransaction = predecessor === null ? undefined : this.transactions.get(predecessor);
				const transaction = {
					id,
					redirectedFrom: predecessorTransaction?.id ?? null,
					redirectedFromState: predecessor === null ? "root" : predecessorTransaction === undefined ? "unknown" : undefined,
					responseScheduled: false,
					requestObserved: false
				};
				this.transactions.set(request, transaction);
				return transaction;
			}
			admitProducerStrings(transaction, kind, values) {
				const admission = this.options.admitText(kind, values);
				if (admission.status === "retained") return true;
				this.options.omitNetwork(transaction.id, kind, admission.reason);
				this.gaps.add(`Network ${kind} metadata was omitted for ${transaction.id} because ${admission.reason} was reached; network coverage is incomplete.`);
				return false;
			}
			omitOmittedTransactionPhase(request, kind) {
				if (!this.omittedRequests.has(request)) return;
				if (!this.observeOmittedTransactionPhase(request, kind)) return;
				this.options.omitEvent(kind, "max-network-transactions");
			}
			observeOmittedTransactionPhase(request, phase) {
				let observed = this.omittedPhases.get(request);
				if (observed === undefined) {
					observed = new Set();
					this.omittedPhases.set(request, observed);
				}
				if (observed.has(phase)) return false;
				observed.add(phase);
				return true;
			}
			omitOmittedTransactionContent(request, phase) {
				if (!this.omittedRequests.has(request)) return;
				if (!this.observeOmittedTransactionPhase(request, `network-content:${phase}`)) return;
				this.options.omitEvent("network-content", "max-network-transactions");
			}
			admitMetadata(transaction, kind, source, url, additionalStrings = [], additionalSources = []) {
				return this.admitProducerStrings(transaction, kind, this.metadataStrings(source, url, additionalStrings, additionalSources));
			}
			*metadataStrings(source, url, additionalStrings, additionalSources) {
				yield* this.retainedMetadataStrings(source, source.headers(), url);
				yield* additionalStrings;
				for (const extra of additionalSources) yield* this.retainedMetadataStrings(extra.source, extra.source.headers(), extra.url);
			}
			*retainedMetadataStrings(source, headers, url) {
				if (url !== undefined) yield url;
				for (const name in headers) {
					if (!Object.hasOwn(headers, name)) continue;
					yield name;
					if (this.options.selection.header_values) yield headers[name];
				}
				if ("method" in source) {
					const request = source;
					yield request.method();
					yield request.url();
					yield request.resourceType();
				}
			}
			headerNames(source) {
				return Object.keys(source.headers()).map((name) => this.options.secrets.redact(name)).sort();
			}
			metadata(request, transaction) {
				return {
					transaction_id: transaction.id,
					redirected_from_transaction_id: transaction.redirectedFrom,
					...transaction.redirectedFromState === undefined ? {} : { redirected_from_transaction_state: transaction.redirectedFromState },
					method: this.options.secrets.redact(request.method()),
					url: this.options.secrets.sanitizeUrl(request.url()),
					resource_type: this.options.secrets.redact(request.resourceType()),
					header_names: this.headerNames(request)
				};
			}
			responseContent(transaction, unavailable) {
				const response = transaction.response;
				if (response === undefined || transaction.responseScheduled || !this.options.selection.response_body && !this.options.selection.header_values) return;
				transaction.responseScheduled = true;
				this.collect(transaction, response.sequence, "response", response.source, (headers) => this.options.selection.response_body ? unavailable === undefined ? captureNetworkBody(() => response.source.body(), "response", response.source, this.options.secrets, this.readOptions, (body) => this.options.admitContentBody({
					transactionId: transaction.id,
					sourceEventSequence: response.sequence,
					phase: "response",
					headers,
					observedBytes: body.observedBytes,
					allocationBytes: body.allocationBytes,
					mediaType: body.mediaType
				})) : Promise.resolve(unavailable) : Promise.resolve({ state: "not_requested" }), this.options.selection.header_values);
			}
			collect(transaction, sequence, phase, source, body, includeHeaders) {
				const collect = async () => {
					const retainedHeaders = includeHeaders ? await captureNetworkHeaders(source, this.options.secrets, this.readOptions) : { state: "not_requested" };
					const retainedBody = await body(retainedHeaders);
					if (retainedBody.state === "omitted") {
						this.options.omitNetwork(transaction.id, "network-content", retainedBody.reason);
						return;
					}
					if (retainedHeaders.state === "unavailable" || retainedBody.state === "unavailable" || retainedBody.state === "not_exposed") this.gaps.add("Some selected network content was unavailable; per-transaction content states retain the reason.");
					const admission = this.options.emit({
						kind: "network-content",
						transaction_id: transaction.id,
						source_event_sequence: sequence,
						phase,
						headers: retainedHeaders,
						body: retainedBody
					});
					if (admission.status === "omitted") this.options.omitNetwork(transaction.id, "network-content", admission.reason);
				};
				this.pending.push(new Promise((resolve, reject) => {
					this.queuedReads.push({
						run: collect,
						resolve,
						reject
					});
					this.pumpContentReads();
				}));
			}
			pumpContentReads() {
				while (this.activeReads < 16 && this.queuedReads.length > 0) {
					const job = this.queuedReads.shift();
					if (job === undefined) return;
					this.activeReads += 1;
					void job.run().then(job.resolve, job.reject).finally(() => {
						this.activeReads -= 1;
						this.pumpContentReads();
					});
				}
			}
		};
	})))();
}

//#endregion
//#region dist/browser/PlaywrightScenarioEvents.js
var MAX_LISTENER_OWNERS, allocationCost, PlaywrightScenarioEvents;
function init_PlaywrightScenarioEvents() {
	return (init_PlaywrightScenarioEvents = __esmMin((() => {
		init_browserScenarioCaptureValues();
		init_browserScenarioCaptureLimits();
		init_PlaywrightScenarioNetwork();
		MAX_LISTENER_OWNERS = 2048;
		allocationCost = (value, remaining) => {
			if (typeof value === "string") return value.length * 8 + 2;
			if (value === null || typeof value !== "object") return 32;
			let cost = 2;
			for (const key in value) {
				if (!Object.hasOwn(value, key)) continue;
				const item = value[key];
				cost += key.length * 8 + 4 + allocationCost(item, remaining - cost);
				if (cost > remaining) break;
			}
			return cost;
		};
		PlaywrightScenarioEvents = class {
			items = [];
			retainedCost = 0;
			dropped = 0;
			omittedKinds = new Map();
			omittedNetwork = new Map();
			stepIndex = 0;
			sequence = 0;
			enabled;
			secrets;
			limits;
			ownsContext;
			pages = new WeakSet();
			incompleteFamilies = new Set();
			network;
			stopNetwork;
			stopListeners = new Map();
			sealed = false;
			constructor(options) {
				const network = options.network ?? {
					request_body: false,
					response_body: false,
					header_values: false
				};
				this.enabled = new Set(options.enabled);
				if (network.request_body || network.response_body || network.header_values) this.enabled = new Set([...this.enabled, "network"]);
				this.secrets = options.secrets;
				this.limits = options.limits ?? DEFAULT_BROWSER_SCENARIO_CAPTURE_LIMITS;
				this.ownsContext = options.ownsContext === true;
				this.pages.add(options.page);
				if (this.ownsContext && this.enabled.size > 0) {
					const context = options.context ?? options.page.context();
					const onPage = (page) => this.popup(page);
					context.on("page", onPage);
					this.retainListener(context, () => context.off("page", onPage));
				}
				if (this.enabled.has("network")) {
					const context = options.context ?? options.page.context();
					const collector = new PlaywrightScenarioNetwork({
						selection: network,
						limits: this.limits,
						secrets: options.secrets,
						emit: (event) => this.push(event),
						admitText: (kind, values) => this.admitProducerText(kind, values, true),
						admitContentBody: (input) => this.admitContentBody(input),
						omitNetwork: (id, kind, reason) => this.omitNetwork(id, kind, reason),
						omitEvent: (kind, reason) => this.omitEvent(kind, reason),
						...options.signal === undefined ? {} : { signal: options.signal }
					});
					this.network = collector;
					const inScope = (request) => {
						if (this.ownsContext) return true;
						try {
							return this.pages.has(request.frame().page());
						} catch (cause) {
							void cause;
							return false;
						}
					};
					const onRequest = (request) => {
						if (inScope(request)) collector.request(request);
					};
					const onResponse = (response) => {
						if (inScope(response.request())) collector.response(response);
					};
					const onFailed = (request) => {
						if (inScope(request)) collector.failed(request);
					};
					const onFinished = (request) => {
						if (inScope(request)) collector.finished(request);
					};
					context.on("request", onRequest);
					context.on("response", onResponse);
					context.on("requestfailed", onFailed);
					context.on("requestfinished", onFinished);
					this.stopNetwork = () => {
						context.off("request", onRequest);
						context.off("response", onResponse);
						context.off("requestfailed", onFailed);
						context.off("requestfinished", onFinished);
					};
				}
				this.observePage(options.page);
			}
			setStep(index) {
				this.stepIndex = index;
			}
			nextSequence() {
				return this.sequence + 1;
			}
			lastSequence() {
				return this.sequence;
			}
			/** Drain selected network content and freeze the result before browser teardown. */
			async finish() {
				this.stopNetwork?.();
				this.stopNetwork = undefined;
				for (const owner of this.stopListeners.keys()) this.releaseListeners(owner);
				this.pages = new WeakSet();
				try {
					await this.network?.finish();
				} finally {
					this.sealed = true;
				}
			}
			/** Report selected popup event families with unrecoverable pre-discovery gaps. */
			limitations() {
				const popupGaps = [...this.incompleteFamilies].map((family) => `Popup ${family} events before Page discovery are unavailable; later events are retained.`);
				const gaps = [...popupGaps, ...this.network?.limitations() ?? []];
				if (this.dropped > 0) gaps.push("Browser event collection reached a selected resource budget; per-kind omissions and affected network transaction IDs are listed in events.omissions, and event coverage is incomplete.");
				return this.enabled.has("network") && !this.ownsContext ? ["Shared-context network capture excludes requests without a known root or descendant Page frame.", ...gaps] : gaps;
			}
			result() {
				const omittedKinds = new Map([...this.omittedKinds].map(([kind, omission]) => [kind, {
					count: omission.count,
					reasons: new Set(omission.reasons)
				}]));
				return {
					retained: this.items.length,
					dropped: this.dropped,
					items: this.items,
					omissions: {
						by_kind: [...omittedKinds].sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0).map(([kind, omission]) => ({
							kind,
							count: omission.count,
							reasons: [...omission.reasons].sort()
						})),
						network_transactions: [...this.omittedNetwork].sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0).map(([transaction_id, omission]) => ({
							transaction_id,
							omitted_kinds: [...omission.kinds].sort(),
							reasons: [...omission.reasons].sort()
						})),
						network_transaction_range: this.network?.omittedTransactionRange() ?? null
					}
				};
			}
			push(event) {
				this.sequence += 1;
				const cost = allocationCost(event, this.limits.max_event_allocation_bytes) + 128;
				const reason = this.admissionReason(cost);
				if (this.sealed || reason !== undefined) {
					const finalReason = reason ?? "max-events";
					this.omitEvent(event.kind, finalReason);
					return {
						status: "omitted",
						sequence: this.sequence,
						reason: finalReason
					};
				}
				this.retainedCost += cost;
				const parsed = browserScenarioEventSchema.parse({
					...event,
					sequence: this.sequence,
					step_index: this.stepIndex
				});
				this.items.push(parsed);
				return {
					status: "retained",
					sequence: this.sequence
				};
			}
			admitText(kind, ...values) {
				return this.admitProducerText(kind, values, false).status === "retained";
			}
			/** Admit conservative output cost before running redaction or cloning. */
			admitProducerText(kind, values, networkMetadata) {
				let cost = 4096;
				for (const value of values) {
					cost += this.secrets.redactionAllocationCost(value.length);
				}
				const reason = networkMetadata && cost > this.limits.max_network_metadata_allocation_bytes ? "max-network-metadata-allocation-bytes" : this.admissionReason(cost);
				if (reason !== undefined) {
					this.sequence += 1;
					this.omitEvent(kind, reason);
					return {
						status: "omitted",
						sequence: this.sequence,
						reason
					};
				}
				return {
					status: "retained",
					sequence: this.sequence + 1
				};
			}
			admissionReason(cost) {
				if (this.sealed || this.items.length >= this.limits.max_events) return "max-events";
				if (cost > this.limits.max_event_allocation_bytes) return "max-event-allocation-bytes";
				if (cost > this.limits.max_total_event_allocation_bytes - this.retainedCost) return "max-total-event-allocation-bytes";
				return undefined;
			}
			admitContentBody(input) {
				const kind = "network-content";
				const eventCost = allocationCost({
					kind,
					sequence: this.sequence + 1,
					step_index: this.stepIndex,
					transaction_id: input.transactionId,
					source_event_sequence: input.sourceEventSequence,
					phase: input.phase,
					headers: input.headers,
					body: {
						state: "captured",
						representation: input.phase === "request" ? "browser-exposed-request-bytes" : "playwright-response-body-bytes",
						encoding: "base64",
						content: null,
						bytes: input.observedBytes,
						sha256: "0".repeat(64),
						media_type: null,
						redacted: false
					}
				}, this.limits.max_event_allocation_bytes) - 64 + input.allocationBytes + (input.mediaType === undefined ? 0 : Math.max(input.mediaType.length * 8 + 2, this.secrets.redactionAllocationCost(input.mediaType.length))) + 128;
				const reason = this.admissionReason(eventCost);
				if (reason !== undefined) {
					this.sequence += 1;
					this.omitEvent(kind, reason);
					return {
						status: "omitted",
						sequence: this.sequence,
						reason
					};
				}
				return {
					status: "retained",
					sequence: this.sequence + 1
				};
			}
			omitEvent(kind, reason) {
				this.dropped += 1;
				let omission = this.omittedKinds.get(kind);
				if (omission === undefined) {
					omission = {
						count: 0,
						reasons: new Set()
					};
					this.omittedKinds.set(kind, omission);
				}
				omission.count += 1;
				omission.reasons.add(reason);
			}
			omitNetwork(transactionId, kind, reason) {
				let omission = this.omittedNetwork.get(transactionId);
				if (omission === undefined) {
					omission = {
						kinds: new Set(),
						reasons: new Set()
					};
					this.omittedNetwork.set(transactionId, omission);
				}
				omission.kinds.add(kind);
				omission.reasons.add(reason);
			}
			admitOwner(kind) {
				if (this.stopListeners.size < MAX_LISTENER_OWNERS) return true;
				this.sequence += 1;
				this.omitEvent(kind, "max-listener-owners");
				return false;
			}
			retainListener(owner, stop) {
				let stops = this.stopListeners.get(owner);
				if (stops === undefined) {
					stops = new Set();
					this.stopListeners.set(owner, stops);
				}
				stops.add(stop);
			}
			releaseListeners(owner) {
				const stops = this.stopListeners.get(owner);
				this.stopListeners.delete(owner);
				for (const stop of stops ?? []) stop();
			}
			observePage(page) {
				if (this.enabled.size > 0) {
					const onClose = () => {
						this.releaseListeners(page);
					};
					page.on("close", onClose);
					this.retainListener(page, () => page.off("close", onClose));
				}
				if (this.enabled.has("console")) {
					const onConsole = (message) => this.console(message);
					page.on("console", onConsole);
					this.retainListener(page, () => page.off("console", onConsole));
				}
				if (this.enabled.has("page-errors")) {
					const onError = (error) => {
						if (!this.admitText("page-error", error.message, error.stack ?? "")) return;
						this.push({
							kind: "page-error",
							message: this.secrets.redact(error.message),
							stack: error.stack === undefined ? null : this.secrets.redact(error.stack)
						});
					};
					page.on("pageerror", onError);
					this.retainListener(page, () => page.off("pageerror", onError));
				}
				if (this.enabled.has("websockets")) {
					const onWebSocket = (socket) => this.webSocket(socket);
					page.on("websocket", onWebSocket);
					this.retainListener(page, () => page.off("websocket", onWebSocket));
				}
				if (this.enabled.has("frames")) {
					const onAttached = (frame) => this.frame("frame-attached", frame);
					const onDetached = (frame) => this.frame("frame-detached", frame);
					const onNavigated = (frame) => this.frame("frame-navigated", frame);
					page.on("frameattached", onAttached);
					page.on("framedetached", onDetached);
					page.on("framenavigated", onNavigated);
					this.retainListener(page, () => page.off("frameattached", onAttached));
					this.retainListener(page, () => page.off("framedetached", onDetached));
					this.retainListener(page, () => page.off("framenavigated", onNavigated));
				}
				if (this.enabled.has("workers")) {
					const onWorker = (worker) => this.worker(worker);
					page.on("worker", onWorker);
					this.retainListener(page, () => page.off("worker", onWorker));
				}
				if (this.enabled.size > 0) {
					const onPopup = (popup) => this.popup(popup);
					page.on("popup", onPopup);
					this.retainListener(page, () => page.off("popup", onPopup));
				}
				if (this.enabled.has("downloads")) {
					const onDownload = (download) => this.download(download);
					page.on("download", onDownload);
					this.retainListener(page, () => page.off("download", onDownload));
				}
			}
			safeUrl(value) {
				return this.secrets.sanitizeUrl(value);
			}
			console(message) {
				const rawText = message.text();
				const location = message.location();
				if (!this.admitText("console", rawText, location.url, message.type())) return;
				this.push({
					kind: "console",
					level: this.secrets.redact(message.type()),
					text: this.secrets.redact(rawText),
					url: location.url === "" ? null : this.safeUrl(location.url)
				});
			}
			webSocket(socket) {
				if (!this.admitOwner("websocket-opened")) return;
				if (!this.admitText("websocket-opened", socket.url())) return;
				const url = this.safeUrl(socket.url());
				this.push({
					kind: "websocket-opened",
					url
				});
				const onSent = ({ payload }) => this.webSocketFrame("websocket-frame-sent", url, payload);
				const onReceived = ({ payload }) => this.webSocketFrame("websocket-frame-received", url, payload);
				const onClose = () => {
					this.push({
						kind: "websocket-closed",
						url
					});
					this.releaseListeners(socket);
				};
				socket.on("framesent", onSent);
				socket.on("framereceived", onReceived);
				socket.on("close", onClose);
				this.retainListener(socket, () => socket.off("framesent", onSent));
				this.retainListener(socket, () => socket.off("framereceived", onReceived));
				this.retainListener(socket, () => socket.off("close", onClose));
			}
			webSocketFrame(kind, url, payload) {
				const bytes = Buffer.byteLength(payload);
				const isText = typeof payload === "string";
				if (!isText) {
					this.push({
						kind,
						url,
						payload_type: "binary",
						payload_bytes: bytes,
						payload_text: null,
						truncated: false
					});
					return;
				}
				if (!this.admitText(kind, payload)) return;
				const text = this.secrets.redact(payload);
				this.push({
					kind,
					url,
					payload_type: "text",
					payload_bytes: bytes,
					payload_text: text,
					truncated: false
				});
			}
			frame(kind, frame) {
				if (!this.admitText(kind, frame.url(), frame.name())) return;
				this.push({
					kind,
					url: frame.url() === "" ? null : this.safeUrl(frame.url()),
					name: frame.name() === "" ? null : this.secrets.redact(frame.name())
				});
			}
			worker(worker) {
				if (!this.admitOwner("worker-created") || !this.admitText("worker-created", worker.url())) return;
				const details = {
					url: this.safeUrl(worker.url()),
					name: null
				};
				this.push({
					kind: "worker-created",
					...details
				});
				const onClose = () => {
					this.push({
						kind: "worker-closed",
						...details
					});
					this.releaseListeners(worker);
				};
				worker.on("close", onClose);
				this.retainListener(worker, () => worker.off("close", onClose));
			}
			popup(page) {
				if (this.pages.has(page)) return;
				if (!this.admitOwner("popup-opened") || !this.admitText("popup-opened", page.url())) return;
				this.pages.add(page);
				for (const family of [
					"frames",
					"workers",
					"websockets",
					"downloads"
				]) if (this.enabled.has(family)) this.incompleteFamilies.add(family);
				const opened = {
					url: page.url() === "" ? null : this.safeUrl(page.url()),
					name: null
				};
				if (this.enabled.has("popups")) {
					this.push({
						kind: "popup-opened",
						...opened
					});
					const onClose = () => {
						if (!this.admitText("popup-closed", page.url())) return;
						this.push({
							kind: "popup-closed",
							url: page.url() === "" ? null : this.safeUrl(page.url()),
							name: null
						});
					};
					page.on("close", onClose);
					this.retainListener(page, () => page.off("close", onClose));
				}
				this.observePage(page);
			}
			download(download) {
				if (this.admitText("download-cancelled", download.suggestedFilename(), download.url())) this.push({
					kind: "download-cancelled",
					suggested_filename: this.secrets.redact(download.suggestedFilename()),
					url: this.safeUrl(download.url())
				});
				void download.cancel().catch((cause) => {
					void cause;
				});
			}
		};
	})))();
}

//#endregion
//#region dist/browser/PlaywrightScenarioStorage.js
var breakpointResponse, scriptIdentifierResponse, storageKeyResponse, targetInfoResponse, STORAGE_EVENT_METHODS, attachedTargetEvent, targetSessionEvent, nestedMessageEvent, nestedProtocolMessage, executionContextEvent, scriptParsedEvent, pausedEvent, evaluationResponse, STORAGE_CLEANUP_TIMEOUT_MS, PlaywrightScenarioStorage;
function init_PlaywrightScenarioStorage() {
	return (init_PlaywrightScenarioStorage = __esmMin((() => {
		init_AnalysisCleanupLease();
		init_browserObservationError();
		init_PlaywrightExecutionBoundary();
		breakpointResponse = z.object({ breakpointId: z.string() });
		scriptIdentifierResponse = z.object({ identifier: z.string() });
		storageKeyResponse = z.object({ storageKey: z.string() });
		targetInfoResponse = z.object({ targetInfo: z.object({ targetId: z.string() }) });
		STORAGE_EVENT_METHODS = new Set([
			"Runtime.executionContextCreated",
			"Runtime.executionContextDestroyed",
			"Runtime.executionContextsCleared",
			"Debugger.scriptParsed",
			"Debugger.paused",
			"Target.attachedToTarget",
			"Target.detachedFromTarget",
			"Target.receivedMessageFromTarget"
		]);
		attachedTargetEvent = z.object({
			sessionId: z.string(),
			targetInfo: z.object({
				type: z.string(),
				targetId: z.string()
			})
		});
		targetSessionEvent = z.object({ sessionId: z.string() });
		nestedMessageEvent = z.object({
			sessionId: z.string(),
			message: z.string()
		});
		nestedProtocolMessage = z.object({
			id: z.number().optional(),
			method: z.string().optional(),
			params: z.unknown().optional(),
			result: z.unknown().optional(),
			error: z.object({ message: z.string() }).optional()
		});
		executionContextEvent = z.object({ context: z.object({
			id: z.number(),
			origin: z.string(),
			name: z.string(),
			auxData: z.object({ frameId: z.string().optional() }).optional()
		}) });
		scriptParsedEvent = z.object({
			scriptId: z.string(),
			executionContextId: z.number(),
			url: z.string()
		});
		pausedEvent = z.object({ callFrames: z.array(z.object({
			callFrameId: z.string(),
			location: z.object({ scriptId: z.string() })
		})) });
		evaluationResponse = z.object({ exceptionDetails: z.unknown().optional() });
		STORAGE_CLEANUP_TIMEOUT_MS = 1e3;
		PlaywrightScenarioStorage = class PlaywrightScenarioStorage {
			cdp;
			signal;
			#seeds = new Map();
			#initializedLocal = new Set();
			#initializedSession = new Set();
			#targets = new Map();
			#replies = new Map();
			#sourceUrl = `rea-storage-${randomUUID()}`;
			#listeners = [];
			#sequence = 0;
			#generation = 0;
			#closed = false;
			#cleanupCompleted = false;
			#loadingStopped = false;
			#failure;
			#closePromise;
			#detachPromise;
			#rootInitialization;
			#work = Promise.resolve();
			#removeListeners = () => undefined;
			constructor(cdp, signal) {
				this.cdp = cdp;
				this.signal = signal;
			}
			static async create(storagePage, scenario, secrets, options = {}) {
				const { signal, retainCleanup } = options;
				const { context, page } = storagePage;
				if (scenario.storage.local_storage.length === 0 && scenario.storage.session_storage.length === 0) return undefined;
				const connection = context.newCDPSession(page);
				let cdp;
				try {
					cdp = await withPlaywrightExecutionBoundary(() => connection, undefined, signal);
				} catch (cause) {
					if (signal?.aborted === true) {
						let detached = false;
						const lateCleanup = async () => {
							let session;
							try {
								session = await connection;
							} catch {
								return;
							}
							if (!detached) {
								await session.detach();
								detached = true;
							}
						};
						const cleanup = new AnalysisCleanupLease(lateCleanup, ["browser_storage_transport"]);
						retainCleanup?.(cleanup);
						void withPlaywrightExecutionBoundary(() => cleanup.release(), STORAGE_CLEANUP_TIMEOUT_MS).catch(() => undefined);
					}
					throw cause;
				}
				const owner = new PlaywrightScenarioStorage(cdp, signal);
				owner.addSeeds(scenario.storage.local_storage, "local", secrets);
				owner.addSeeds(scenario.storage.session_storage, "session", secrets);
				return owner;
			}
			async initialize(page, context) {
				const initialization = this.initializeRoot(page, context);
				this.#rootInitialization = initialization;
				await withPlaywrightExecutionBoundary(() => initialization, undefined, this.signal);
			}
			async initializeRoot(page, context) {
				const rootInfo = targetInfoResponse.parse(await this.cdp.send("Target.getTargetInfo"));
				if (this.#closed) return;
				const root = this.createTarget(undefined, rootInfo.targetInfo.targetId, (method, params) => this.cdp.send(method, params));
				this.#targets.set("", root);
				this.listen(page, context);
				const ready = this.initializeTarget(root);
				root.ready = ready;
				await ready;
			}
			addSeeds(blocks, kind, secrets) {
				for (const { origin, entries } of blocks) {
					const seed = this.#seeds.get(origin) ?? {
						local: [],
						session: []
					};
					seed[kind].push(...entries.map(({ name, value }) => [name, secrets.value(value)]));
					this.#seeds.set(origin, seed);
				}
			}
			listen(page, context) {
				const browser = context.browser();
				const detached = () => this.targetDetached("");
				page.on("close", detached);
				context.on("close", detached);
				browser?.on("disconnected", detached);
				this.#removeListeners = () => {
					page.off("close", detached);
					context.off("close", detached);
					browser?.off("disconnected", detached);
				};
				for (const method of [
					"Runtime.executionContextCreated",
					"Runtime.executionContextDestroyed",
					"Runtime.executionContextsCleared",
					"Debugger.scriptParsed",
					"Debugger.paused",
					"Target.attachedToTarget",
					"Target.detachedFromTarget",
					"Target.receivedMessageFromTarget"
				]) {
					const listener = (params) => this.event("", method, params);
					this.#listeners.push({
						method,
						listener
					});
					this.cdp.on(method, listener);
				}
			}
			createTarget(parentId, topLevelTargetId, send) {
				return {
					parentId,
					topLevelTargetId,
					send,
					contexts: new Map(),
					scripts: new Map(),
					ready: Promise.resolve(),
					waitingForDebugger: false
				};
			}
			async initializeTarget(target) {
				if (this.#closed) return;
				await target.send("Page.enable");
				if (this.#closed) return;
				await target.send("Runtime.enable");
				if (this.#closed) return;
				await target.send("Debugger.enable");
				if (this.#closed) return;
				breakpointResponse.parse(await target.send("Debugger.setBreakpointByUrl", {
					url: this.#sourceUrl,
					lineNumber: 1
				}));
				if (this.#closed) return;
				scriptIdentifierResponse.parse(await target.send("Page.addScriptToEvaluateOnNewDocument", {
					worldName: this.#sourceUrl,
					source: `(() => {\n  void 0;\n})()\n//# sourceURL=${this.#sourceUrl}`
				}));
				if (this.#closed) return;
				await target.send("Target.setAutoAttach", {
					autoAttach: true,
					waitForDebuggerOnStart: true,
					flatten: false
				});
			}
			sendObserved(target, method, params) {
				return withPlaywrightExecutionBoundary(() => target.send(method, params), undefined, this.signal);
			}
			event(sessionId, method, params) {
				if (this.#closed) return;
				const target = this.#targets.get(sessionId);
				if (target === undefined) return;
				try {
					if (method === "Runtime.executionContextCreated") {
						const { context } = executionContextEvent.parse(params);
						if (context.name === this.#sourceUrl) target.contexts.set(context.id, context);
					} else if (method === "Runtime.executionContextDestroyed") {
						const { executionContextId } = z.object({ executionContextId: z.number() }).parse(params);
						target.contexts.delete(executionContextId);
					} else if (method === "Runtime.executionContextsCleared") {
						target.contexts.clear();
						target.scripts.clear();
					} else if (method === "Debugger.scriptParsed") {
						const script = scriptParsedEvent.parse(params);
						if (script.url === this.#sourceUrl) target.scripts.set(script.scriptId, script.executionContextId);
					} else if (method === "Debugger.paused") {
						const pause = pausedEvent.parse(params);
						const frame = pause.callFrames[0];
						if (frame === undefined || !target.scripts.has(frame.location.scriptId)) return;
						this.#generation += 1;
						this.#work = this.#work.then(() => this.seed(target, pause)).catch((cause) => {
							if (sessionId === "" || this.#targets.get(sessionId) === target) this.fail(cause);
						});
					} else if (method === "Target.attachedToTarget") {
						this.#generation += 1;
						this.attach(sessionId, attachedTargetEvent.parse(params));
					} else if (method === "Target.detachedFromTarget") {
						this.#generation += 1;
						this.targetDetached(targetSessionEvent.parse(params).sessionId);
					} else if (method === "Target.receivedMessageFromTarget") {
						this.nestedMessage(nestedMessageEvent.parse(params));
					}
				} catch (cause) {
					this.fail(cause);
				}
			}
			nestedMessage(event) {
				const reply = nestedProtocolMessage.parse(JSON.parse(event.message));
				if (reply.id !== undefined) {
					const waiter = this.#replies.get(reply.id);
					if (waiter?.sessionId !== event.sessionId) return;
					this.#replies.delete(reply.id);
					if (reply.error !== undefined) waiter.reject(new Error(reply.error.message));
					else waiter.resolve(reply.result);
					return;
				}
				if (reply.method !== undefined && STORAGE_EVENT_METHODS.has(reply.method)) this.event(event.sessionId, reply.method, reply.params);
			}
			fail(cause) {
				this.#generation += 1;
				this.#failure ??= new BrowserObservationError("capture_browser_scenario", "protocol_error", { cause });
			}
			async seedPausedFrame(target, frame) {
				const contextId = target.scripts.get(frame.location.scriptId);
				const context = contextId === undefined ? undefined : target.contexts.get(contextId);
				const seed = context === undefined ? undefined : this.#seeds.get(context.origin);
				if (this.#closed || seed === undefined || context?.auxData?.frameId === undefined) return;
				const storageKey = storageKeyResponse.parse(await this.sendObserved(target, "Storage.getStorageKey", { frameId: context.auxData.frameId })).storageKey;
				const sessionKey = JSON.stringify([target.topLevelTargetId, storageKey]);
				const local = this.#initializedLocal.has(storageKey) || seed.local.length === 0 ? [] : seed.local;
				const session = this.#initializedSession.has(sessionKey) || seed.session.length === 0 ? [] : seed.session;
				if (local.length === 0 && session.length === 0) return;
				const payload = JSON.stringify({
					local,
					session
				}).replaceAll("<", "\\u003c");
				const response = evaluationResponse.parse(await this.sendObserved(target, "Debugger.evaluateOnCallFrame", {
					callFrameId: frame.callFrameId,
					expression: `(() => { const seed = ${payload}; for (const [name, value] of seed.local) localStorage.setItem(name, value); for (const [name, value] of seed.session) sessionStorage.setItem(name, value); })()`,
					returnByValue: true
				}));
				if (response.exceptionDetails !== undefined) throw new BrowserObservationError("capture_browser_scenario", "protocol_error", { detail: "The browser denied initial storage initialization." });
				if (local.length > 0) this.#initializedLocal.add(storageKey);
				if (session.length > 0) this.#initializedSession.add(sessionKey);
			}
			async seed(target, pause) {
				const frame = pause.callFrames[0];
				if (frame === undefined) return;
				let primaryFailure;
				let hasPrimaryFailure = false;
				try {
					await this.seedPausedFrame(target, frame);
				} catch (cause) {
					primaryFailure = cause;
					hasPrimaryFailure = true;
				}
				let resumeFailure;
				try {
					await withPlaywrightExecutionBoundary(() => target.send("Debugger.resume"), STORAGE_CLEANUP_TIMEOUT_MS);
				} catch (cause) {
					resumeFailure = cause;
				}
				if (hasPrimaryFailure && resumeFailure !== undefined) throw new AggregateError([primaryFailure, resumeFailure], "Storage initialization and debugger resume both failed", { cause: primaryFailure });
				if (this.signal?.aborted === true && resumeFailure === undefined) return;
				if (hasPrimaryFailure) throw primaryFailure;
				if (resumeFailure !== undefined) throw resumeFailure;
			}
			attach(parentId, event) {
				const parent = this.#targets.get(parentId);
				if (parent === undefined) return;
				const { sessionId, targetInfo } = event;
				const target = this.createTarget(parentId, event.targetInfo.type === "iframe" ? parent.topLevelTargetId : event.targetInfo.targetId, async (method, params = {}) => {
					const id = ++this.#sequence;
					const reply = new Promise((resolve, reject) => this.#replies.set(id, {
						sessionId,
						resolve,
						reject
					}));
					try {
						const sent = parent.send("Target.sendMessageToTarget", {
							sessionId,
							message: JSON.stringify({
								id,
								method,
								params
							})
						});
						const [, result] = await Promise.all([sent, reply]);
						return result;
					} finally {
						this.#replies.delete(id);
					}
				});
				target.waitingForDebugger = true;
				this.#targets.set(sessionId, target);
				target.ready = (async () => {
					try {
						if (!this.#closed && (targetInfo.type === "iframe" || targetInfo.type === "page")) await this.initializeTarget(target);
					} catch (cause) {
						if (this.signal?.aborted !== true && !this.#closed && this.#targets.get(sessionId) === target) this.fail(cause);
					}
					if (this.#targets.get(sessionId) !== target) return;
					try {
						await withPlaywrightExecutionBoundary(() => target.send("Runtime.runIfWaitingForDebugger"), STORAGE_CLEANUP_TIMEOUT_MS);
						target.waitingForDebugger = false;
					} catch (cause) {
						if (this.signal?.aborted !== true && !this.#closed && this.#targets.get(sessionId) === target) this.fail(cause);
					}
				})();
			}
			targetDetached(sessionId) {
				for (const [id, target] of this.#targets) if (target.parentId === sessionId) this.targetDetached(id);
				this.#targets.delete(sessionId);
				for (const [id, reply] of this.#replies) if (reply.sessionId === sessionId) {
					this.#replies.delete(id);
					reply.reject(new BrowserObservationError("capture_browser_scenario", "disconnected"));
				}
				this.#generation += 1;
			}
			async settle() {
				for (;;) {
					const generation = this.#generation;
					const work = this.#work;
					const targets = [...this.#targets.entries()];
					await withPlaywrightExecutionBoundary(() => Promise.all(targets.map(([, target]) => target.ready)), undefined, this.signal);
					await withPlaywrightExecutionBoundary(() => work, undefined, this.signal);
					await Promise.resolve();
					if (this.#failure !== undefined) throw this.#failure;
					if (generation === this.#generation && work === this.#work && targets.every(([id, target]) => this.#targets.get(id) === target)) return;
				}
			}
			close(stopLoading = false) {
				if (this.#cleanupCompleted) return Promise.resolve({ loadingStopped: this.#loadingStopped });
				if (this.#closePromise !== undefined) return this.#closePromise;
				const closing = this.closeResources(stopLoading).catch((cause) => {
					throw new BrowserObservationError("capture_browser_scenario", "cleanup_failed", {
						cause,
						cleanup: {
							reason: cause instanceof Error ? cause.message : String(cause),
							resources: ["browser_transport", "browser_storage_bootstrap"]
						}
					});
				});
				this.#closePromise = closing;
				void closing.catch(() => {
					if (this.#closePromise === closing) this.#closePromise = undefined;
				});
				return closing;
			}
			async closeResources(stopLoading) {
				this.#closed = true;
				let stopLoadingFailure;
				if (stopLoading && !this.#loadingStopped) {
					try {
						const root = this.#targets.get("");
						if (root !== undefined) {
							await withPlaywrightExecutionBoundary(() => root.send("Page.stopLoading"), STORAGE_CLEANUP_TIMEOUT_MS);
							this.#loadingStopped = true;
						}
					} catch (cause) {
						stopLoadingFailure = { cause };
					}
				}
				const work = this.#work;
				const rootInitialization = this.#rootInitialization;
				const targets = [...this.#targets.values()];
				try {
					await withPlaywrightExecutionBoundary(() => Promise.all([
						work.catch(() => undefined),
						...rootInitialization === undefined ? [] : [rootInitialization.catch(() => undefined)],
						...targets.map((target) => target.ready.catch(() => undefined))
					]), STORAGE_CLEANUP_TIMEOUT_MS);
				} catch {}
				let detach = this.#detachPromise;
				if (detach === undefined) {
					detach = Promise.resolve().then(() => this.cdp.detach());
					this.#detachPromise = detach;
					void detach.catch(() => {
						if (this.#detachPromise === detach) this.#detachPromise = undefined;
					});
				}
				await withPlaywrightExecutionBoundary(() => detach, STORAGE_CLEANUP_TIMEOUT_MS);
				for (const { method, listener } of this.#listeners) this.cdp.off(method, listener);
				this.#removeListeners();
				for (const reply of this.#replies.values()) reply.reject(new BrowserObservationError("capture_browser_scenario", "disconnected"));
				this.#targets.clear();
				this.#replies.clear();
				this.#cleanupCompleted = true;
				if (stopLoadingFailure !== undefined) throw stopLoadingFailure.cause;
				return { loadingStopped: this.#loadingStopped };
			}
		};
	})))();
}

//#endregion
//#region dist/browser/PlaywrightScenarioServiceWorkers.js
var OPERATION$1, POLICY_CLEANUP_CONFIRMATION_TIMEOUT_MS, scriptResponse, restorationResponse, attachedEvent, detachedEvent, PlaywrightScenarioServiceWorkers;
function init_PlaywrightScenarioServiceWorkers() {
	return (init_PlaywrightScenarioServiceWorkers = __esmMin((() => {
		init_browserObservation();
		init_browserObservationError();
		init_CdpConnection();
		init_CdpEndpoint();
		init_CdpTargetSession();
		init_PlaywrightExecutionBoundary();
		OPERATION$1 = "capture_browser_scenario";
		POLICY_CLEANUP_CONFIRMATION_TIMEOUT_MS = 5e3;
		scriptResponse = z.object({ identifier: z.string() });
		restorationResponse = z.object({ result: z.object({ value: z.literal("policy_owned").nullable() }) });
		attachedEvent = z.object({
			sessionId: z.string(),
			targetInfo: z.object({ type: z.string() })
		});
		detachedEvent = z.object({ sessionId: z.string() });
		PlaywrightScenarioServiceWorkers = class {
			page;
			endpoint;
			targetId;
			marker = JSON.stringify(`rea-service-workers-${randomUUID()}`);
			restoreKey = JSON.stringify(`rea-restore-${randomUUID()}`);
			secret = JSON.stringify(randomUUID());
			#initialization;
			#restoration;
			#session;
			#targets = new Map();
			#closed = false;
			#released = false;
			#detached = false;
			#loadingStopped = false;
			#removeListener;
			#setup = new AbortController();
			constructor(page, endpoint, targetId) {
				this.page = page;
				this.endpoint = endpoint;
				this.targetId = targetId;
			}
			initialize() {
				return this.#initialization ??= this.install();
			}
			async install() {
				this.#session = await withCdpDiscoveryDeadline(OPERATION$1, this.#setup.signal, async (signal) => {
					await withPlaywrightExecutionBoundary(() => this.assertBlocked(), undefined, signal);
					const opened = await openCdpEndpoint(browserObservationEndpointSchema.parse(this.endpoint), OPERATION$1, signal);
					const target = opened.discovery.targets.find(({ id }) => id === this.targetId);
					if (target === undefined) {
						await opened.connection?.close();
						throw new BrowserObservationError(OPERATION$1, "target_not_found");
					}
					const connection = opened.connection ?? await CdpConnection.connect(opened.discovery.webSocket.url, OPERATION$1, signal);
					return await attachCdpTargetSession(connection, target, OPERATION$1, signal);
				});
				const connection = this.#session.connection;
				this.#removeListener = connection.onEvent((event) => {
					if (event.method === "Target.attachedToTarget" && this.#targets.has(event.sessionId ?? "")) {
						const { sessionId, targetInfo } = attachedEvent.parse(event.params);
						if (targetInfo.type === "iframe") this.addTarget(sessionId);
					} else if (event.method === "Target.detachedFromTarget") {
						const id = detachedEvent.parse(event.params).sessionId;
						this.#targets.get(id)?.markDetached();
						this.#targets.delete(id);
						if (id === this.#session?.sessionId) this.#detached = true;
					}
				});
				const id = this.#session.sessionId;
				if (id === undefined) throw new BrowserObservationError(OPERATION$1, "protocol_error");
				this.addTarget(id);
				await this.settle();
				await withPlaywrightExecutionBoundary(() => this.assertBlocked(), undefined, this.#setup.signal);
			}
			addTarget(id) {
				this.#targets.get(id)?.markDetached();
				let markDetached = () => undefined;
				const detached = new Promise((resolve) => {
					markDetached = resolve;
				});
				const target = {
					id,
					detached,
					markDetached,
					ready: Promise.resolve()
				};
				this.#targets.set(id, target);
				const ready = this.initializeTarget(target);
				target.ready = ready;
				void ready.catch(() => undefined);
			}
			async initializeTarget(target) {
				try {
					if (this.#closed) return;
					await this.send(target.id, "Page.enable");
					if (this.#closed) return;
					const added = scriptResponse.parse(await this.send(target.id, "Page.addScriptToEvaluateOnNewDocument", {
						runImmediately: true,
						source: `(() => {
          if (!("serviceWorker" in navigator)) return;
          const prototype = ServiceWorkerContainer.prototype;
          const descriptor = Object.getOwnPropertyDescriptor(prototype, "register");
          if (typeof descriptor?.value === "function" && Object.hasOwn(descriptor.value, Symbol.for(${this.marker}))) return;
          const register = () => Promise.reject(new Error("service workers are blocked by scenario policy"));
          Object.defineProperty(register, Symbol.for(${this.marker}), { value: true });
          const secret = ${this.secret};
          Object.defineProperty(globalThis, ${this.restoreKey}, { configurable: true, value: (provided) => {
            if (provided !== secret) return false;
            if (Object.getOwnPropertyDescriptor(prototype, "register")?.value === register) {
              if (descriptor === undefined) delete prototype.register;
              else Object.defineProperty(prototype, "register", descriptor);
            }
            delete globalThis[${this.restoreKey}];
            return true;
          }});
          Object.defineProperty(prototype, "register", { ...descriptor, configurable: true, value: register });
        })()`
					}));
					target.identifier = added.identifier;
					if (!this.#closed) await this.send(target.id, "Target.setAutoAttach", {
						autoAttach: true,
						waitForDebuggerOnStart: true,
						flatten: true,
						filter: [{
							type: "iframe",
							exclude: false
						}, { exclude: true }]
					});
				} finally {
					if (this.#targets.has(target.id) && target.id !== this.#session?.sessionId) await this.send(target.id, "Runtime.runIfWaitingForDebugger");
				}
			}
			send(id, method, params = {}) {
				if (this.#session === undefined) throw new BrowserObservationError(OPERATION$1, "disconnected");
				return this.#session.connection.send(method, params, id);
			}
			async settle() {
				for (;;) {
					const targets = [...this.#targets.values()];
					await Promise.all(targets.map((target) => this.settleTarget(target)));
					if (targets.length === this.#targets.size && targets.every((target) => this.#targets.get(target.id) === target)) return;
				}
			}
			async settleTarget(target) {
				try {
					await Promise.race([target.ready, target.detached]);
				} catch (cause) {
					if (this.#targets.get(target.id) === target) throw cause;
				}
			}
			async settleTargetForRestore(target) {
				try {
					await Promise.race([target.ready, target.detached]);
				} catch {}
			}
			restorationScript() {
				return `(() => {
      const restore = globalThis[${this.restoreKey}];
      if (typeof restore === "function" && restore(${this.secret}) === true) return null;
      const register = globalThis.ServiceWorkerContainer?.prototype.register;
      return typeof register === "function" && Object.hasOwn(register, Symbol.for(${this.marker}))
        ? "policy_owned"
        : null;
    })()`;
			}
			async restoreMainFrame(id) {
				const { result } = restorationResponse.parse(await this.send(id, "Runtime.evaluate", {
					expression: this.restorationScript(),
					returnByValue: true
				}));
				if (result.value === "policy_owned") throw new Error("service-worker policy restoration could not be confirmed");
			}
			async restorePlaywrightFrame(frame) {
				try {
					const failure = await frame.evaluate(this.restorationScript());
					if (failure === "policy_owned") throw new Error("service-worker policy restoration could not be confirmed");
					if (failure !== null) throw new BrowserObservationError(OPERATION$1, "protocol_error");
				} catch (cause) {
					if (!this.page.isClosed() && !frame.isDetached()) throw cause;
				}
			}
			async stopMainFrame(frame) {
				try {
					await frame.evaluate("globalThis.stop()");
					this.#loadingStopped = true;
				} catch (cause) {
					if (!this.page.isClosed() && !frame.isDetached()) throw cause;
				}
			}
			async assertBlocked() {
				if (this.#session !== undefined) await this.settle();
				for (const frame of this.page.frames()) {
					let failure;
					try {
						failure = await frame.evaluate(`(async () => {
          if (!("serviceWorker" in navigator)) return null;
          const serviceWorker = navigator.serviceWorker;
          if (${this.#session !== undefined} &&
              (!Object.hasOwn(serviceWorker.register, Symbol.for(${this.marker})) ||
               typeof globalThis[${this.restoreKey}] !== "function")) return "policy_unprotected";
          if (serviceWorker.controller !== null) return "service_worker_blocked";
          return (await serviceWorker.getRegistrations()).length > 0
            ? "service_worker_blocked"
            : null;
        })()`);
					} catch (cause) {
						if (frame.isDetached()) continue;
						throw cause;
					}
					if (failure === "policy_unprotected") throw new BrowserObservationError(OPERATION$1, "target_not_allowed");
					if (failure === "service_worker_blocked") throw new BrowserObservationError(OPERATION$1, "service_worker_blocked");
					if (failure !== null) throw new BrowserObservationError(OPERATION$1, "protocol_error");
				}
			}
			close(stopLoading = false) {
				this.#closed = true;
				this.#setup.abort();
				const restoration = this.#restoration ??= this.restore(stopLoading);
				void restoration.then(() => {
					if (this.#restoration === restoration) this.#restoration = undefined;
				}, () => {
					if (this.#restoration === restoration) this.#restoration = undefined;
				});
				return withPlaywrightExecutionBoundary(() => restoration, POLICY_CLEANUP_CONFIRMATION_TIMEOUT_MS);
			}
			async restore(stopLoading) {
				await this.#initialization?.catch(() => undefined);
				if (this.#released) return;
				const session = this.#session;
				if (session === undefined) return;
				if (!this.page.isClosed()) {
					const mainFrame = this.page.mainFrame();
					if (stopLoading && !this.#loadingStopped) {
						if (!this.#detached && session.sessionId !== undefined) {
							await this.send(session.sessionId, "Page.stopLoading");
							this.#loadingStopped = true;
						} else {
							await this.stopMainFrame(mainFrame);
						}
					}
					await Promise.all([...this.#targets.values()].map((target) => this.settleTargetForRestore(target)));
					for (const target of this.#targets.values()) {
						if (!this.#detached && target.identifier !== undefined) {
							try {
								await this.send(target.id, "Page.removeScriptToEvaluateOnNewDocument", { identifier: target.identifier });
							} catch (cause) {
								if (this.#targets.get(target.id) === target) throw cause;
							}
							delete target.identifier;
						}
					}
					if (!this.#detached && session.sessionId !== undefined) {
						await this.restoreMainFrame(session.sessionId);
					} else {
						await this.restorePlaywrightFrame(mainFrame);
					}
					for (const frame of this.page.frames()) {
						if (frame === mainFrame) continue;
						if (frame.isDetached()) continue;
						if (frame.url().length === 0) continue;
						await this.restorePlaywrightFrame(frame);
					}
				}
				if (!this.page.isClosed() && !this.#detached && session.sessionId !== undefined) {
					await session.connection.send("Target.detachFromTarget", { sessionId: session.sessionId });
					this.#detached = true;
				}
				this.#removeListener?.();
				await session.connection.close();
				this.#released = true;
			}
		};
	})))();
}

//#endregion
//#region dist/browser/PlaywrightScenarioSession.js
var OPERATION, throwIfScenarioCancelled, throwCleanupFailures, installCookies, initializePage, PlaywrightScenarioSession;
function init_PlaywrightScenarioSession() {
	return (init_PlaywrightScenarioSession = __esmMin((() => {
		init_AnalysisCleanupLease();
		init_analysisErrorBase();
		init_browserObservationError();
		init_BrowserScenarioSecrets();
		init_PlaywrightScenarioBrowser();
		init_PlaywrightScenarioActions();
		init_PlaywrightScenarioArtifacts();
		init_PlaywrightScenarioEvents();
		init_PlaywrightScenarioStorage();
		init_PlaywrightScenarioServiceWorkers();
		init_PlaywrightExecutionBoundary();
		init_BrowserScenarioPartialObservation();
		OPERATION = "capture_browser_scenario";
		throwIfScenarioCancelled = (signal) => {
			if (signal?.aborted === true) throw new BrowserObservationError(OPERATION, "cancelled", { cause: signal?.reason });
		};
		throwCleanupFailures = (failures) => {
			if (failures.length === 1) throw failures[0];
			if (failures.length > 1) throw new AggregateError(failures, "Browser scenario cleanup failed");
		};
		installCookies = async (context, scenario, secrets) => {
			await context.addCookies(scenario.storage.cookies.map((cookie) => ({
				name: cookie.name,
				value: secrets.value(cookie.value),
				url: secrets.url(cookie.destination),
				httpOnly: cookie.http_only,
				secure: cookie.secure,
				sameSite: cookie.same_site
			})));
		};
		initializePage = async (context, scenario, secrets) => {
			context.setDefaultTimeout(0);
			context.setDefaultNavigationTimeout(0);
			await installCookies(context, scenario, secrets);
		};
		PlaywrightScenarioSession = class PlaywrightScenarioSession {
			opened;
			mode;
			processOwnership;
			product = "Chromium";
			version;
			initialUrl;
			secrets;
			eventCapture;
			storage;
			serviceWorkers;
			signal;
			#storageReleased = false;
			#stopLoading = false;
			cleanupLease;
			#policyStopsLoading = false;
			constructor(opened, options) {
				this.opened = opened;
				this.mode = options.mode;
				this.processOwnership = options.mode === "launch" ? "provider-owned" : "external";
				this.secrets = options.secrets;
				this.eventCapture = options.eventCapture;
				this.storage = options.storage;
				this.serviceWorkers = options.serviceWorkers;
				this.signal = options.signal;
				this.version = opened.browser.version();
				this.initialUrl = opened.page.url();
				this.cleanupLease = new AnalysisCleanupLease(async () => {
					await this.#closeResources();
				}, { get cleanupResources() {
					return opened.cleanup.cleanupResources;
				} });
			}
			static async open(scenario, environment, options) {
				throwIfScenarioCancelled(options.signal);
				const secrets = BrowserScenarioSecrets.resolve(scenario, environment);
				if (secrets === undefined) throw new BrowserObservationError(OPERATION, "secret_unavailable");
				const startedAt = performance.now();
				const openingCleanup = new Set();
				const opening = openPlaywrightScenarioBrowser(scenario, environment, {
					signal: options.signal,
					retainCleanup: (lease) => {
						openingCleanup.add(lease);
						options.retainCleanup?.(lease);
					}
				});
				let opened;
				try {
					opened = await withPlaywrightExecutionBoundary(() => opening, undefined, options.signal);
				} catch (cause) {
					let lateOpened;
					let openingFailure;
					const cleanup = new AnalysisCleanupLease(async () => {
						try {
							lateOpened = await opening;
						} catch (cause) {
							openingFailure = cause instanceof AnalysisError && !(options.signal?.aborted === true && cause === options.signal.reason) ? cause : undefined;
							const results = await Promise.allSettled([...openingCleanup].map((lease) => lease.release()));
							const failures = results.flatMap((result) => result.status === "rejected" ? [result.reason] : []);
							throwCleanupFailures(failures);
							if (openingFailure?.cleanupIncomplete === true) throw openingFailure;
							return;
						}
						await lateOpened.cleanup.release();
					}, { get cleanupResources() {
						return lateOpened?.cleanup.cleanupResources ?? openingFailure?.cleanupResources;
					} });
					options.retainCleanup?.(cleanup);
					void withPlaywrightExecutionBoundary(() => cleanup.release(), 1e3).catch(() => undefined);
					throw cause;
				}
				const session = await this.initializeSession(opened, scenario, secrets, options);
				try {
					await withPlaywrightExecutionBoundary(() => opened.page.goto(secrets.url(scenario.start_url), {
						waitUntil: "load",
						timeout: 0
					}), undefined, options.signal);
					await withPlaywrightExecutionBoundary(() => session.serviceWorkers?.assertBlocked() ?? Promise.resolve(), undefined, options.signal);
					await withPlaywrightExecutionBoundary(() => session.storage?.settle() ?? Promise.resolve(), undefined, options.signal);
					return session;
				} catch (cause) {
					let cleanup;
					let cleanupFailure;
					try {
						cleanup = await session.close(true);
					} catch (failure) {
						cleanup = "incomplete";
						cleanupFailure = { cause: failure };
						options.retainCleanup?.(session.cleanupLease);
					}
					throw browserScenarioOperationFailure(cause, {
						kind: "browser-scenario-observation",
						capture: browserScenarioCaptureData({
							session,
							scenario,
							startedAt,
							steps: [],
							cleanup,
							limitations: ["Scenario navigation failed before the initial state was captured."]
						})
					}, cleanupFailure);
				}
			}
			static async initializeSession(opened, scenario, secrets, options) {
				let events;
				let storage;
				const serviceWorkers = scenario.browser.mode === "connect" && scenario.environment.service_workers === "block" ? new PlaywrightScenarioServiceWorkers(opened.page, scenario.browser.cdp_endpoint, scenario.browser.target_id) : undefined;
				try {
					await withPlaywrightExecutionBoundary(async () => {
						await serviceWorkers?.initialize();
						await initializePage(opened.context, scenario, secrets);
					}, undefined, options.signal);
					storage = await PlaywrightScenarioStorage.create(opened, scenario, secrets, {
						...options.signal === undefined ? {} : { signal: options.signal },
						...options.retainCleanup === undefined ? {} : { retainCleanup: options.retainCleanup }
					});
					await storage?.initialize(opened.page, opened.context);
					throwIfScenarioCancelled(options.signal);
					events = new PlaywrightScenarioEvents({
						page: opened.page,
						context: opened.context,
						ownsContext: scenario.browser.mode === "launch",
						enabled: new Set(scenario.capture.events),
						secrets,
						network: scenario.capture.network,
						limits: scenario.capture.limits,
						...options.signal === undefined ? {} : { signal: options.signal }
					});
					return new PlaywrightScenarioSession(opened, {
						mode: scenario.browser.mode,
						secrets,
						eventCapture: events,
						storage,
						serviceWorkers,
						signal: options.signal
					});
				} catch (cause) {
					let storageReleased = false;
					const storageStopsLoading = storage !== undefined && options.signal?.aborted === true;
					let policyStopsLoading = !storageStopsLoading;
					const cleanup = async () => {
						let storageFailure;
						let policyFailure;
						let browserFailure;
						if (!storageReleased) {
							try {
								const result = await storage?.close(storageStopsLoading);
								if (storageStopsLoading && result?.loadingStopped !== true) policyStopsLoading = true;
							} catch (failure) {
								storageFailure = { cause: failure };
								policyStopsLoading = true;
							}
						}
						try {
							if (!opened.cleanup.browserClosed) await serviceWorkers?.close(policyStopsLoading);
						} catch (failure) {
							policyFailure = { cause: failure };
						}
						if (policyFailure === undefined) {
							try {
								await opened.cleanup.release(events === undefined ? undefined : () => events?.finish() ?? Promise.resolve());
							} catch (failure) {
								browserFailure = { cause: failure };
							}
						} else {
							try {
								await events?.finish();
							} catch (failure) {
								browserFailure = { cause: failure };
							}
						}
						if (opened.cleanup.browserClosed) storageReleased = true;
						throwCleanupFailures([
							...policyFailure === undefined ? [] : [policyFailure.cause],
							...storageReleased || storageFailure === undefined ? [] : [storageFailure.cause],
							...browserFailure === undefined ? [] : [browserFailure.cause]
						]);
					};
					const recovery = new AnalysisCleanupLease(cleanup, opened.cleanup);
					try {
						return await failBrowserScenarioOperation(recovery, cause);
					} catch (failure) {
						if (failure !== cause) options.retainCleanup?.(recovery);
						throw failure;
					}
				}
			}
			currentUrl() {
				return this.opened.page.url();
			}
			sanitizeUrl(value) {
				return this.secrets.sanitizeUrl(value);
			}
			setStep(index) {
				this.eventCapture.setStep(index);
			}
			nextEventSequence() {
				return this.eventCapture.nextSequence();
			}
			lastEventSequence() {
				return this.eventCapture.lastSequence();
			}
			events() {
				return this.eventCapture.result();
			}
			/** Preserve event coverage gaps for the aggregate capture's completeness. */
			eventLimitations() {
				return this.eventCapture.limitations();
			}
			async perform(action, signal) {
				await withPlaywrightExecutionBoundary(() => performPlaywrightScenarioAction({
					page: this.opened.page,
					action,
					secrets: this.secrets
				}), "timeout_ms" in action ? action.timeout_ms : undefined, signal);
				await withPlaywrightExecutionBoundary(() => this.storage?.settle() ?? Promise.resolve(), undefined, signal);
			}
			async capture(requested, signal) {
				await withPlaywrightExecutionBoundary(() => this.serviceWorkers?.assertBlocked() ?? Promise.resolve(), undefined, signal);
				await withPlaywrightExecutionBoundary(() => this.storage?.settle() ?? Promise.resolve(), undefined, signal);
				return withPlaywrightExecutionBoundary(() => capturePlaywrightStepArtifacts({
					context: this.opened.context,
					page: this.opened.page,
					secrets: this.secrets,
					requested
				}), undefined, signal);
			}
			async close(stopLoading = this.signal?.aborted === true) {
				this.#stopLoading ||= stopLoading;
				try {
					await withPlaywrightExecutionBoundary(() => this.cleanupLease.release(), PLAYWRIGHT_CLEANUP_CONFIRMATION_TIMEOUT_MS);
				} catch (cause) {
					const error = new BrowserObservationError(OPERATION, "cleanup_failed", {
						cause,
						cleanup: {
							reason: cause instanceof Error ? cause.message : String(cause),
							resources: this.cleanupLease.cleanupResources ?? []
						}
					});
					new AnalysisCleanupLeaseGroup(error, [this.cleanupLease]);
					throw error;
				}
				return this.mode === "launch" ? "terminated-owned-process" : "disconnected-external";
			}
			async #closeResources() {
				const stopLoading = this.#stopLoading || this.signal?.aborted === true;
				let storageFailure;
				let policyFailure;
				let browserFailure;
				if (stopLoading && this.storage === undefined) this.#policyStopsLoading = true;
				if (!this.#storageReleased) {
					try {
						const result = await this.storage?.close(stopLoading);
						if (stopLoading && result?.loadingStopped !== true) this.#policyStopsLoading = true;
					} catch (failure) {
						storageFailure = { cause: failure };
						if (stopLoading) this.#policyStopsLoading = true;
					}
				}
				try {
					if (!this.opened.cleanup.browserClosed) await this.serviceWorkers?.close(this.#policyStopsLoading);
				} catch (failure) {
					policyFailure = { cause: failure };
				}
				if (policyFailure === undefined) {
					try {
						await this.opened.cleanup.release(() => this.eventCapture.finish());
					} catch (failure) {
						browserFailure = { cause: failure };
					}
				} else {
					try {
						await this.eventCapture.finish();
					} catch (failure) {
						browserFailure = { cause: failure };
					}
				}
				if (this.opened.cleanup.browserClosed) this.#storageReleased = true;
				throwCleanupFailures([
					...policyFailure === undefined ? [] : [policyFailure.cause],
					...this.#storageReleased || storageFailure === undefined ? [] : [storageFailure.cause],
					...browserFailure === undefined ? [] : [browserFailure.cause]
				]);
			}
			redactError(error) {
				return this.secrets.redact(error instanceof Error ? error.message : "browser action failed");
			}
		};
	})))();
}

//#endregion
//#region dist/composition/browserScenario.js
var createBrowserScenarioProvider;
function init_browserScenario() {
	return (init_browserScenario = __esmMin((() => {
		init_PlaywrightBrowserScenarioProvider();
		init_PlaywrightScenarioSession();
		createBrowserScenarioProvider = (environment) => new PlaywrightBrowserScenarioProvider((scenario, options) => PlaywrightScenarioSession.open(scenario, environment, options));
	})))();
}

//#endregion
init_browserScenario();
export { createBrowserScenarioProvider };