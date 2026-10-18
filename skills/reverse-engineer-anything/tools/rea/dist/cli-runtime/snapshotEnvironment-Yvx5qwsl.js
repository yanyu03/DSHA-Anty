import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { DarwinProcessOwnershipInspectionError, init_DarwinProcessRunTokenReader, init_ProcessOwnershipObservation, prepareProcessOwnershipInspection, systemProcessOwnershipHost } from "./ProcessOwnershipObservation-C006iCtZ.js";
import { ProviderProcessSupervisor, init_ProviderProcess, spawnOwnedProviderProcess } from "./ProviderProcess-D87A7ctp.js";
import { cleanupOwnedProcessGroup, init_ProcessOwnership } from "./ProcessOwnership-CtrNr6ee.js";
import { ABORTED, ProviderStartupDeadline, init_AbortablePromise, init_ProviderDeadline, waitForAbortable, waitForAbortableDelay } from "./ProviderDeadline-rSuH4Pm8.js";
import { pipeline } from "node:stream/promises";

//#region dist/process/OwnedCommand.js
/** Both preparation stages preserve physical failures, opaque cancellation and exact owners. */
function throwCommandPreparationFailure(cause, signal, interruption) {
	const preparationFailure = cause instanceof DarwinProcessOwnershipInspectionError && !(signal?.aborted === true && cause === signal.reason) ? cause : undefined;
	if (preparationFailure !== undefined && preparationFailure.cancellation === undefined) throw preparationFailure;
	if (interruption !== undefined) throw new OwnedCommandFailure(interruption, interruption === "cancelled" ? "Command cancelled during ownership preparation." : "Command deadline elapsed during ownership preparation.", null, null, {
		cause,
		...interruption === "cancelled" ? { cancellation: { reason: signal?.reason } } : {},
		...preparationFailure === undefined ? {} : { preparationFailure }
	});
	throw cause;
}
var OwnedCommandFailure, ownedCommandResources, prepareOwnedCommand, runOwnedCommand, collectOwnedCommand, consumeStdout;
function init_OwnedCommand() {
	return (init_OwnedCommand = __esmMin((() => {
		init_ProcessOwnershipObservation();
		init_DarwinProcessRunTokenReader();
		init_ProviderProcess();
		init_ProcessOwnership();
		init_AbortablePromise();
		init_ProviderDeadline();
		OwnedCommandFailure = class extends Error {
			reason;
			snapshot;
			cleanupFailure;
			resources;
			cleanupOwner;
			#cancellation;
			/** Opaque caller reason observed by the owner, distinct from physical causes. */
			get cancellation() {
				return this.#cancellation;
			}
			processError;
			cleanupResult;
			collectionFailure;
			preparationFailure;
			constructor(reason, message, snapshot = null, cleanupFailure = null, options, resources = [], cleanupOwner) {
				super(message, options);
				this.reason = reason;
				this.snapshot = snapshot;
				this.cleanupFailure = cleanupFailure;
				this.resources = resources;
				this.cleanupOwner = cleanupOwner;
				this.#cancellation = options?.cancellation === undefined ? undefined : { reason: options.cancellation.reason };
				this.processError = options?.processError;
				this.cleanupResult = options?.cleanupResult;
				this.collectionFailure = options?.collectionFailure ?? false;
				this.preparationFailure = options?.preparationFailure;
			}
		};
		ownedCommandResources = (ownership, directory) => [
			ownership.runId,
			...directory === undefined ? [] : [directory],
			`pid:${ownership.leaderPid}`,
			`process-group:${ownership.processGroupId}`
		];
		prepareOwnedCommand = async (signal) => {
			if (systemProcessOwnershipHost.platform !== "darwin") return;
			try {
				signal?.throwIfAborted();
				await prepareProcessOwnershipInspection(signal);
			} catch (cause) {
				throwCommandPreparationFailure(cause, signal, signal?.aborted === true ? "cancelled" : undefined);
			}
		};
		runOwnedCommand = async (spawn, limits, options = {}) => {
			const callerSignal = options.signal ?? spawn.signal;
			if (callerSignal?.aborted) throw new OwnedCommandFailure("cancelled", "Command cancelled before launch.", null, null, { cancellation: { reason: callerSignal.reason } });
			const deadline = new ProviderStartupDeadline(limits.timeoutMs, callerSignal);
			try {
				return await collectOwnedCommand(spawn, limits, options.launcher ?? spawnOwnedProviderProcess, deadline, callerSignal, options.retainCleanup);
			} finally {
				deadline.dispose();
			}
		};
		collectOwnedCommand = async (spawn, limits, launcher, deadline, callerSignal, retainCleanup) => {
			const signal = deadline.signal;
			let launched;
			try {
				launched = await launcher({
					...spawn,
					signal
				});
			} catch (cause) {
				throwCommandPreparationFailure(cause, signal, deadline.interruption);
			}
			let exceeded = false;
			let processFailure;
			let processError;
			const supervisor = new ProviderProcessSupervisor({
				...launched,
				ownsProcessLifetime: true,
				cleanup: launched.cleanup ?? (() => cleanupOwnedProcessGroup(launched.ownership))
			}, {
				captureStdout: limits.stdout === undefined,
				maxDiagnosticBytes: limits.diagnosticBytes,
				onDiagnostic: (event) => {
					if (event.type === "output" && event.truncated === true) exceeded = true;
					if (event.type === "error") {
						processFailure ??= event.message;
						processError ??= event.cause;
					}
				}
			});
			const abandoned = new AbortController();
			const consumed = consumeStdout(launched.process.stdout, limits.stdout, AbortSignal.any([signal, abandoned.signal]));
			void consumed.then((failed) => {
				processFailure ??= failed;
			});
			let failure;
			try {
				while (!await supervisor.waitForOutputClose(10)) {
					const interruption = deadline.interruption;
					if (interruption !== undefined) throw new OwnedCommandFailure(interruption, interruption === "cancelled" ? "Command cancelled." : "Command deadline elapsed.", null, null, interruption === "cancelled" ? { cancellation: { reason: signal.reason } } : undefined);
					if (exceeded) throw new OwnedCommandFailure("output-limit", "Command diagnostic output exceeded its complete-output budget.");
					if (processFailure !== undefined) throw new OwnedCommandFailure("process", processFailure, null, null, {
						processError,
						collectionFailure: true
					});
					await waitForAbortableDelay(25, signal);
				}
				const sinkFailure = await waitForAbortable(consumed, signal);
				if (sinkFailure !== ABORTED) processFailure ??= sinkFailure;
				const snapshot = supervisor.snapshot();
				const interruption = deadline.interruption;
				if (interruption !== undefined) throw new OwnedCommandFailure(interruption, interruption === "cancelled" ? "Command cancelled." : "Command deadline elapsed.", snapshot, null, interruption === "cancelled" ? { cancellation: { reason: signal.reason } } : undefined);
				if (exceeded) throw new OwnedCommandFailure("output-limit", "Command diagnostic output exceeded its complete-output budget.", snapshot);
				const acceptedNonzeroExit = limits.acceptNonZeroExit === true && snapshot.exitCode !== null && snapshot.exitCode !== undefined && snapshot.exitCode !== 0 && snapshot.signal === null;
				if (processFailure !== undefined || (snapshot.exitCode !== 0 || snapshot.signal !== null) && !acceptedNonzeroExit) throw new OwnedCommandFailure("process", processFailure ?? "Command failed; inspect its exit status and diagnostics.", snapshot, null, {
					processError,
					collectionFailure: processFailure !== undefined
				});
				limits.observeCompleted?.(snapshot);
			} catch (cause) {
				failure = cause instanceof OwnedCommandFailure ? cause : new OwnedCommandFailure("process", "Command collection failed.", null, null, { cause });
			}
			abandoned.abort();
			const stopped = await supervisor.stop();
			const snapshot = supervisor.snapshot();
			const cancellation = failure?.cancellation ?? (callerSignal?.aborted ? { reason: callerSignal.reason } : undefined);
			if (stopped.status === "incomplete" && retainCleanup !== undefined) retainCleanup(supervisor, stopped);
			else if (stopped.status === "incomplete") throw new OwnedCommandFailure(failure?.reason ?? "process", failure?.message ?? "Command cleanup failed.", snapshot, stopped.reason, {
				cancellation,
				...failure === undefined ? {} : {
					cause: failure,
					processError: failure.processError
				},
				...stopped.cleanupResult === undefined ? {} : { cleanupResult: stopped.cleanupResult },
				...failure?.collectionFailure === true ? { collectionFailure: true } : {}
			}, ownedCommandResources(launched.ownership, spawn.cwd), supervisor);
			if (failure !== undefined) throw new OwnedCommandFailure(failure.reason, failure.message, snapshot, failure.cleanupFailure, {
				cause: failure,
				cancellation,
				processError: failure.processError,
				...failure.cleanupResult === undefined ? {} : { cleanupResult: failure.cleanupResult },
				...failure.collectionFailure ? { collectionFailure: true } : {}
			}, failure.resources);
			if (callerSignal?.aborted) throw new OwnedCommandFailure("cancelled", "Command cancelled.", snapshot, null, { cancellation: { reason: callerSignal.reason } });
			return snapshot;
		};
		consumeStdout = (stdout, sink, signal) => {
			if (sink === undefined) return Promise.resolve(undefined);
			if (stdout === null) {
				sink.destroy();
				return Promise.resolve("stdout stream is unavailable");
			}
			return pipeline(stdout, sink, { signal }).then(() => undefined, (cause) => `stdout stream failed: ${cause instanceof Error ? cause.message : String(cause)}`);
		};
	})))();
}

//#endregion
//#region dist/process/snapshotEnvironment.js
var snapshotEnvironment;
function init_snapshotEnvironment() {
	return (init_snapshotEnvironment = __esmMin((() => {
		snapshotEnvironment = (environment, platform = process.platform) => {
			if (platform !== "win32") return Object.freeze({ ...environment });
			const selected = new Map();
			for (const [key, value] of Object.entries(environment)) selected.set(key.toUpperCase(), value);
			const snapshot = {};
			for (const key of [...selected.keys()].sort()) snapshot[key] = selected.get(key);
			return Object.freeze(snapshot);
		};
	})))();
}

//#endregion
export { OwnedCommandFailure, init_OwnedCommand, init_snapshotEnvironment, ownedCommandResources, prepareOwnedCommand, runOwnedCommand, snapshotEnvironment };