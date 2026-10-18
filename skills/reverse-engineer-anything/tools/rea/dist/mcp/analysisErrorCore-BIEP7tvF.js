import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { z } from "zod";
import { types } from "node:util";

//#region dist/domain/result.js
var ok, err;
function init_result() {
	return (init_result = __esmMin((() => {
		ok = (value) => ({
			ok: true,
			value
		});
		err = (error) => ({
			ok: false,
			error
		});
	})))();
}

//#endregion
//#region dist/domain/analysisErrorBase.js
var ANALYSIS_ERROR_TAGS, AnalysisError, resolvedAnalysisError;
function init_analysisErrorBase() {
	return (init_analysisErrorBase = __esmMin((() => {
		ANALYSIS_ERROR_TAGS = [
			"AnalysisProtocolError",
			"AnalysisInputError",
			"AnalysisAccessDeniedError",
			"AnalysisArtifactChangedError",
			"AnalysisOutputError",
			"AnalysisCapabilityUnavailableError",
			"AnalysisUnsupportedTargetError",
			"AnalysisCancelledError",
			"AnalysisTimeoutError",
			"AnalysisResourceConstraintError",
			"ProviderSelectionError",
			"ProviderAdapterError",
			"BrowserObservationError",
			"ArtifactOperationError",
			"ProcessCaptureError",
			"EvidenceIntegrityError",
			"EvidenceFileError",
			"UnknownRegistryError",
			"HopperTimeoutError",
			"HopperCancelledError",
			"HopperProtocolError",
			"HopperRemoteError",
			"HopperProcessError",
			"HopperStartError",
			"ConfigurationError",
			"NoBinaryOpenError",
			"BinaryTargetError"
		];
		AnalysisError = class extends Error {
			#cleanupPrimary;
			#cleanupDependencies;
			#cleanupDependents = [];
			diagnostics;
			capturedOutput;
			cleanup;
			cleanupIncomplete;
			#ownedCleanupResources;
			#cleanupResourceOwner;
			constructor(message, options) {
				super(message, options);
				this.#cleanupPrimary = options?.cleanupPrimary;
				this.diagnostics = options?.diagnostics === undefined ? undefined : structuredClone(options.diagnostics);
				this.capturedOutput = options?.capturedOutput === undefined ? undefined : { ...options.capturedOutput };
				this.cleanup = options?.cleanup;
				this.cleanupIncomplete = options?.cleanup !== undefined;
				this.#ownedCleanupResources = [...options?.cleanup?.resources ?? []];
				this.partialObservation = options?.partialObservation;
			}
			userMessage = undefined;
			userCategory = undefined;
			executionFailure = undefined;
			partialObservation;
			get cleanupPrimary() {
				return this.#cleanupPrimary;
			}
			cleanupReport = undefined;
			/** Live dependencies own current resource attribution; cleanup keeps history. */
			get cleanupResources() {
				if (this.#cleanupDependencies === undefined) return this.#cleanupResourceOwner?.cleanupResources ?? this.#ownedCleanupResources;
				return [...new Set([...this.#cleanupDependencies].filter((dependency) => dependency.cleanupIncomplete).flatMap((dependency) => dependency.cleanupResources))];
			}
			/** Bind attribution only to the producer that owns the complete cleanup set. */
			bindCleanupResourceOwner(owner) {
				this.#cleanupResourceOwner = owner;
				return this;
			}
			/** Initialize resource facts supplied by a more specific error producer. */
			setCleanupResources(resources) {
				this.#ownedCleanupResources = [...resources];
			}
			/** Retain a later lifecycle failure without replacing the original typed error. */
			retainSecondaryFailure(failure, diagnostics) {
				Object.assign(this, {
					diagnostics: structuredClone({
						...this.diagnostics,
						...diagnostics
					}),
					cause: new AggregateError(this.cause === undefined ? [failure] : [this.cause, failure], "Analysis failed and a later lifecycle operation also failed.", { cause: this.cause })
				});
				return this;
			}
			/** Keep a composed error incomplete until all explicitly owned source errors resolve. */
			bindCleanupDependencies(dependencies) {
				const pending = this.#cleanupDependencies ??= new Set();
				for (const dependency of dependencies) {
					if (!dependency.cleanupIncomplete || pending.has(dependency)) continue;
					pending.add(dependency);
					dependency.#cleanupDependents = [...dependency.#cleanupDependents.filter((reference) => reference.deref() !== undefined), new WeakRef(this)];
				}
				if (pending.size === 0) this.resolveCleanup();
				return this;
			}
			/** Clear live cleanup status only after its owning resource confirms retry success. */
			resolveCleanup() {
				if ([...this.#cleanupDependencies ?? []].some((dependency) => dependency.cleanupIncomplete)) return this;
				this.#cleanupDependencies?.clear();
				this.cleanupIncomplete = false;
				for (const reference of this.#cleanupDependents) reference.deref()?.resolveCleanup();
				this.#cleanupDependents = [];
				return this;
			}
			/** Retain a completed observation when a later step fails. */
			retainPartialObservation(observation) {
				this.partialObservation ??= observation;
				return this;
			}
		};
		resolvedAnalysisError = (error) => {
			while (!error.cleanupIncomplete && error.cleanupPrimary !== undefined) error = error.cleanupPrimary;
			return error;
		};
	})))();
}

//#endregion
//#region dist/domain/immutableJson.js
/**
* Seal exclusively owned JSON in bounded steps, authenticating only completion.
* Abandonment or failure can leave the provisional input partly frozen.
*/
function* freezeOwnedJsonSnapshotSteps(value) {
	const pending = [{
		value,
		exiting: false
	}];
	const visited = new Set();
	const ancestors = new Set();
	let examined = 0;
	try {
		while (pending.length > 0) {
			if (examined++ === 4096) {
				examined = 0;
				yield;
			}
			const entry = pending.pop();
			if (entry === undefined) break;
			const item = entry.value;
			if (entry.exiting && typeof item === "object" && item !== null) {
				ancestors.delete(item);
				visited.add(item);
				continue;
			}
			if (isImmutableJsonSnapshot(item)) continue;
			if (typeof item !== "object" || item === null) throw new TypeError("Immutable JSON snapshots require JSON values");
			if (ancestors.has(item)) throw new TypeError("Immutable JSON snapshots cannot contain circular references");
			if (visited.has(item)) continue;
			ancestors.add(item);
			pending.push({
				value: item,
				exiting: true
			});
			pushSnapshotChildren(item, pending);
			Object.freeze(item);
		}
		if (typeof value === "object" && value !== null) immutableSnapshots.add(value);
		return value;
	} finally {
		pending.length = 0;
		visited.clear();
		ancestors.clear();
	}
}
var immutableSnapshots, isImmutableJsonSnapshot, freezeJsonSnapshot, pushSnapshotChildren;
function init_immutableJson() {
	return (init_immutableJson = __esmMin((() => {
		immutableSnapshots = new WeakSet();
		isImmutableJsonSnapshot = (value) => value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "number" && Number.isFinite(value) || typeof value === "object" && immutableSnapshots.has(value);
		freezeJsonSnapshot = (value) => {
			const pending = [{
				value,
				exiting: false
			}];
			const visited = new Set();
			const ancestors = new Set();
			const objects = [];
			while (pending.length > 0) {
				const entry = pending.pop();
				if (entry === undefined) break;
				const item = entry.value;
				if (entry.exiting && typeof item === "object" && item !== null) {
					ancestors.delete(item);
					visited.add(item);
					objects.push(item);
					continue;
				}
				if (isImmutableJsonSnapshot(item)) continue;
				if (typeof item !== "object" || item === null) throw new TypeError("Immutable JSON snapshots require JSON values");
				if (ancestors.has(item)) throw new TypeError("Immutable JSON snapshots cannot contain circular references");
				if (visited.has(item)) continue;
				ancestors.add(item);
				pending.push({
					value: item,
					exiting: true
				});
				pushSnapshotChildren(item, pending);
			}
			for (const item of objects) Object.freeze(item);
			if (typeof value === "object" && value !== null) immutableSnapshots.add(value);
			return value;
		};
		pushSnapshotChildren = (item, pending) => {
			const prototype = Object.getPrototypeOf(item);
			if (!Array.isArray(item) && prototype !== Object.prototype && prototype !== null) throw new TypeError("Immutable JSON snapshots require ordinary objects");
			if (Array.isArray(item)) {
				for (let index = 0; index < item.length; index += 1) if (!Object.hasOwn(item, index)) throw new TypeError("Immutable JSON snapshots cannot contain sparse arrays");
			}
			for (const key of Object.getOwnPropertyNames(item)) {
				const descriptor = Object.getOwnPropertyDescriptor(item, key);
				if (descriptor === undefined || !Object.hasOwn(descriptor, "value")) throw new TypeError("Immutable JSON snapshots cannot contain accessors");
				const child = descriptor.value;
				pending.push({
					value: child,
					exiting: false
				});
			}
		};
	})))();
}

//#endregion
//#region dist/domain/jsonValue.js
/** Validate JSON in bounded steps; cache only authenticated immutable roots. */
function* jsonValueValidationSteps(root) {
	const immutable = typeof root === "object" && root !== null && isImmutableJsonSnapshot(root) ? root : undefined;
	if (immutable !== undefined && immutableValidation.has(immutable)) return immutableValidation.get(immutable);
	const finish = (issue) => {
		if (immutable !== undefined) immutableValidation.set(immutable, issue);
		return issue;
	};
	const pending = [{
		value: root,
		depth: 0
	}];
	let examined = 0;
	while (pending.length > 0) {
		if (examined++ === 4096) {
			examined = 0;
			yield;
		}
		const item = pending.pop();
		if (item === undefined) break;
		if (item.depth > 1e3) return finish(`JSON value exceeds maximum nesting depth of ${MAX_JSON_DEPTH}`);
		const value = item.value;
		if (typeof value === "object" && value !== null && types.isProxy(value)) return finish("JSON values cannot contain proxies");
		if (value === null || typeof value === "string" || typeof value === "boolean") continue;
		if (typeof value === "number") {
			if (!Number.isFinite(value)) return finish("JSON numbers must be finite");
		} else if (Array.isArray(value)) {
			for (let index = 0; index < value.length; index += 1) {
				const descriptor = Object.getOwnPropertyDescriptor(value, index);
				if (descriptor === undefined || !Object.hasOwn(descriptor, "value")) return finish("JSON arrays require dense data properties without accessors");
				pending.push({
					value: descriptor.value,
					depth: item.depth + 1
				});
			}
		} else if (isRecord(value)) {
			const prototype = Object.getPrototypeOf(value);
			if (prototype !== Object.prototype && prototype !== null) return finish("JSON objects require ordinary data properties");
			for (const key of Reflect.ownKeys(value)) {
				const descriptor = Object.getOwnPropertyDescriptor(value, key);
				if (descriptor?.enumerable !== true) continue;
				if (typeof key !== "string") return finish("JSON object keys must be strings");
				if (!Object.hasOwn(descriptor, "value")) return finish("JSON objects cannot contain accessors");
				pending.push({
					value: descriptor.value,
					depth: item.depth + 1
				});
			}
		} else return finish("Invalid JSON value");
	}
	return finish(undefined);
}
var MAX_JSON_DEPTH, isRecord, immutableValidation, jsonValueValidationIssue, preserveJsonValue, validatedJsonValue, jsonValueSchema, objectValidation, objectProjection, jsonObjectSchema;
function init_jsonValue() {
	return (init_jsonValue = __esmMin((() => {
		init_immutableJson();
		MAX_JSON_DEPTH = 1e3;
		isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
		immutableValidation = new WeakMap();
		jsonValueValidationIssue = (root) => {
			const steps = jsonValueValidationSteps(root);
			for (;;) {
				const step = steps.next();
				if (step.done) return step.value;
			}
		};
		preserveJsonValue = (value) => {
			const immutableCandidate = value;
			if (isImmutableJsonSnapshot(immutableCandidate)) return value;
			if (Array.isArray(value)) {
				const copy = [];
				for (let index = 0; index < value.length; index += 1) copy.push(preserveJsonValue(value[index]));
				return copy;
			}
			if (value !== null && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, preserveJsonValue(child)]));
			return value;
		};
		validatedJsonValue = z.unknown().superRefine((value, context) => {
			const issue = jsonValueValidationIssue(value);
			if (issue !== undefined) context.addIssue({
				code: "custom",
				message: issue,
				continue: false
			});
		}).transform((value) => value);
		validatedJsonValue._zod.toJSONSchema = () => ({});
		jsonValueSchema = z.unknown().nonoptional().pipe(validatedJsonValue).transform(preserveJsonValue);
		jsonValueSchema._zod.toJSONSchema = () => ({});
		objectValidation = z.custom(isRecord, "Expected JSON object");
		objectProjection = () => ({
			type: "object",
			additionalProperties: {}
		});
		objectValidation._zod.toJSONSchema = objectProjection;
		jsonObjectSchema = jsonValueSchema.pipe(objectValidation);
		jsonObjectSchema._zod.toJSONSchema = objectProjection;
	})))();
}

//#endregion
//#region dist/domain/digests.js
var SHA256_PATTERN, digestSchema, prefixedDigestSchema, isDigest;
function init_digests() {
	return (init_digests = __esmMin((() => {
		SHA256_PATTERN = /^[a-f0-9]{64}$/u;
		digestSchema = z.string().regex(SHA256_PATTERN);
		prefixedDigestSchema = (prefix) => z.string().regex(new RegExp(`^${prefix}_[a-f0-9]{64}$`, "u"), `Expected a ${prefix}_ prefixed lowercase sha256 digest`);
		isDigest = (value) => typeof value === "string" && SHA256_PATTERN.test(value);
	})))();
}

//#endregion
//#region dist/domain/analysisErrorCore.js
var AnalysisUnsupportedTargetError, ANALYSIS_RESOURCE_KINDS, AnalysisResourceConstraintError, AnalysisProtocolError, AnalysisInputError, AnalysisOutputError, AnalysisCapabilityUnavailableError, AnalysisCancelledError, AnalysisTimeoutError, AnalysisAccessDeniedError, AnalysisArtifactChangedError;
function init_analysisErrorCore() {
	return (init_analysisErrorCore = __esmMin((() => {
		init_analysisErrorBase();
		AnalysisUnsupportedTargetError = class extends AnalysisError {
			operation;
			path;
			reason;
			_tag = "AnalysisUnsupportedTargetError";
			/** Refusal-specific recovery, when the producer knows an available workflow. */
			remediationAction;
			constructor(operation, path, reason, options) {
				super(`Unsupported target for ${operation} at ${path}: ${reason}`, options);
				this.operation = operation;
				this.path = path;
				this.reason = reason;
				this.remediationAction = options?.remediationAction;
			}
		};
		ANALYSIS_RESOURCE_KINDS = [
			"memory",
			"cpu",
			"file-size",
			"transport",
			"capacity"
		];
		AnalysisResourceConstraintError = class extends AnalysisError {
			operation;
			resource;
			reason;
			reportedLimits;
			_tag = "AnalysisResourceConstraintError";
			remediationAction;
			/**
			* Whether retrying the same request can succeed. A caller-selected bound is
			* deterministic for the same input, so it is not retryable even when its
			* resource kind would otherwise be treated as admission capacity.
			*/
			retryable;
			constructor(operation, resource, reason, reportedLimits, options) {
				super(`Resource constraint during ${operation}: ${reason}`, options);
				this.operation = operation;
				this.resource = resource;
				this.reason = reason;
				this.reportedLimits = reportedLimits;
				this.remediationAction = options?.remediationAction;
				this.retryable = options?.retryable;
			}
		};
		AnalysisProtocolError = class extends AnalysisError {
			_tag = "AnalysisProtocolError";
		};
		AnalysisInputError = class extends AnalysisError {
			operation;
			issues;
			_tag = "AnalysisInputError";
			userMessage;
			constructor(operation, options, issues = []) {
				super(`Invalid analysis input for ${operation}`, options);
				this.operation = operation;
				this.issues = issues;
				this.userMessage = options?.userMessage;
			}
		};
		AnalysisOutputError = class extends AnalysisError {
			operation;
			reason;
			_tag = "AnalysisOutputError";
			userMessage;
			remediationAction;
			cleanupOnly;
			constructor(operation, reason, options) {
				super(`Invalid analysis output for ${operation}: ${reason}`, options);
				this.operation = operation;
				this.reason = reason;
				this.userMessage = options?.userMessage;
				this.remediationAction = options?.remediationAction;
				this.cleanupOnly = options?.cleanupOnly ?? false;
			}
		};
		AnalysisCapabilityUnavailableError = class extends AnalysisError {
			providerId;
			operation;
			reason;
			_tag = "AnalysisCapabilityUnavailableError";
			userMessage;
			remediationAction;
			/** Incomplete cleanup must settle before the operation can be retried. */
			retryable;
			constructor(providerId, operation, reason, options) {
				super(`Provider ${providerId} cannot execute ${operation}: ${reason}`, options);
				this.providerId = providerId;
				this.operation = operation;
				this.reason = reason;
				this.userMessage = options?.userMessage;
				this.remediationAction = options?.remediationAction;
				this.retryable = options?.retryable === true && !this.cleanupIncomplete;
			}
		};
		AnalysisCancelledError = class extends AnalysisError {
			operation;
			_tag = "AnalysisCancelledError";
			constructor(operation, options) {
				super(`Analysis operation was cancelled: ${operation}`, options);
				this.operation = operation;
			}
		};
		AnalysisTimeoutError = class extends AnalysisError {
			operation;
			timeoutMs;
			_tag = "AnalysisTimeoutError";
			userMessage;
			remediationAction;
			constructor(operation, timeoutMs, options) {
				super(`Analysis operation timed out after ${String(timeoutMs)}ms: ${operation}`, options);
				this.operation = operation;
				this.timeoutMs = timeoutMs;
				this.userMessage = options?.userMessage;
				this.remediationAction = options?.remediationAction;
			}
		};
		AnalysisAccessDeniedError = class extends AnalysisError {
			operation;
			path;
			systemCode;
			_tag = "AnalysisAccessDeniedError";
			constructor(operation, path, systemCode, options) {
				super(`Host filesystem read access denied (${systemCode}) for ${path} during ${operation}`, options);
				this.operation = operation;
				this.path = path;
				this.systemCode = systemCode;
			}
		};
		AnalysisArtifactChangedError = class extends AnalysisError {
			operation;
			path;
			reason;
			_tag = "AnalysisArtifactChangedError";
			constructor(operation, path, reason, options) {
				super(`Selected artifact changed during acquisition: ${reason}`, options);
				this.operation = operation;
				this.path = path;
				this.reason = reason;
			}
		};
	})))();
}

//#endregion
export { err as A, freezeJsonSnapshot as C, AnalysisError as D, isImmutableJsonSnapshot as E, ok as M, init_analysisErrorBase as O, jsonValueValidationSteps as S, init_immutableJson as T, MAX_JSON_DEPTH as _, AnalysisCapabilityUnavailableError as a, jsonValueSchema as b, AnalysisProtocolError as c, AnalysisUnsupportedTargetError as d, init_analysisErrorCore as f, prefixedDigestSchema as g, isDigest as h, AnalysisCancelledError as i, init_result as j, resolvedAnalysisError as k, AnalysisResourceConstraintError as l, init_digests as m, AnalysisAccessDeniedError as n, AnalysisInputError as o, digestSchema as p, AnalysisArtifactChangedError as r, AnalysisOutputError as s, ANALYSIS_RESOURCE_KINDS as t, AnalysisTimeoutError as u, init_jsonValue as v, freezeOwnedJsonSnapshotSteps as w, jsonValueValidationIssue as x, jsonObjectSchema as y };