import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { AnalysisAccessDeniedError, AnalysisArtifactChangedError, AnalysisCancelledError, AnalysisCapabilityUnavailableError, AnalysisError, AnalysisOutputError, AnalysisResourceConstraintError, AnalysisTimeoutError, init_analysisErrorBase, init_analysisErrorCore, init_jsonValue, jsonValueSchema } from "./errorSchemas-Ixz_q7qt.js";
import { ArtifactReaderFailure, init_ArtifactReader } from "./ArtifactReader-DMwm42bk.js";
import { AnalysisCleanupLease, init_AnalysisCleanupLease } from "./AnalysisCleanupLease-CWfTGYKd.js";
import { bindArtifactFileCleanup, init_ArtifactFileOperation } from "./ArtifactFileOperation-Dg4BcoEM.js";
import { HopperProcessError, HopperRemoteError, HopperTimeoutError, ProviderAdapterError, init_hopperErrors, init_providerAdapterError } from "./cliResultOutput-10sd6xGx.js";
import { ProviderCleanupError, init_providerCleanupError } from "./providerCleanupError-BhsJyAhk.js";
import { DarwinProcessOwnershipInspectionError, init_DarwinProcessRunTokenReader } from "./ProcessOwnershipObservation-C006iCtZ.js";
import { OwnedCommandFailure, init_OwnedCommand } from "./snapshotEnvironment-Yvx5qwsl.js";

//#region dist/providers/AnalysisClientFailure.js
var analysisClientFailureContext, analysisClientFailureForOperation;
function init_AnalysisClientFailure() {
	return (init_AnalysisClientFailure = __esmMin((() => {
		init_hopperErrors();
		init_analysisErrorBase();
		init_analysisErrorCore();
		init_providerAdapterError();
		init_providerCleanupError();
		init_ArtifactReader();
		init_ArtifactFileOperation();
		analysisClientFailureContext = (cause, providerId, operation) => {
			const providerRequest = cause instanceof HopperRemoteError || cause instanceof HopperTimeoutError || cause instanceof HopperProcessError ? {
				...cause.operation === undefined ? {} : { operation: cause.operation },
				...cause.requestId === undefined ? {} : { request_id: cause.requestId },
				...cause instanceof HopperRemoteError ? {
					provider_code: cause.code,
					diagnostic_type: cause.diagnosticType
				} : {}
			} : undefined;
			const diagnostics = providerRequest === undefined ? cause.diagnostics : {
				provider_request: providerRequest,
				...cause.diagnostics === undefined ? {} : { provider_diagnostics: cause.diagnostics }
			};
			return {
				cause,
				...cause.cleanupPrimary === undefined ? {} : { cleanupPrimary: analysisClientFailureForOperation(cause.cleanupPrimary, providerId, operation) },
				...cause.partialObservation === undefined ? {} : { partialObservation: cause.partialObservation },
				...cause.capturedOutput === undefined ? {} : { capturedOutput: cause.capturedOutput },
				...diagnostics === undefined ? {} : { diagnostics },
				...cause.cleanupIncomplete ? { cleanup: {
					reason: cause.cleanup?.reason ?? cause.message,
					resources: cause.cleanupResources
				} } : {}
			};
		};
		analysisClientFailureForOperation = (cause, providerId, operation, callerDiagnostics) => {
			if (!(cause instanceof AnalysisError)) {
				const failure = new ProviderAdapterError(providerId, operation, {
					cause,
					...callerDiagnostics === undefined ? {} : { diagnostics: callerDiagnostics },
					...cause instanceof ArtifactReaderFailure && cause.cleanup !== undefined ? { cleanup: cause.cleanup } : {}
				});
				bindArtifactFileCleanup(cause, failure);
				return failure;
			}
			if (!(cause instanceof HopperRemoteError) && !(cause instanceof HopperTimeoutError) && !(cause instanceof HopperProcessError) && !(cause instanceof AnalysisCancelledError) && !(cause instanceof ProviderAdapterError) && !(cause instanceof AnalysisCapabilityUnavailableError) && !(cause instanceof AnalysisAccessDeniedError) && !(cause instanceof AnalysisArtifactChangedError) && !(cause instanceof AnalysisTimeoutError) && !(cause instanceof AnalysisOutputError) && !(cause instanceof AnalysisResourceConstraintError)) return cause;
			const sourceContext = analysisClientFailureContext(cause, providerId, operation);
			const context = {
				...sourceContext,
				...callerDiagnostics === undefined ? {} : { diagnostics: {
					...sourceContext.diagnostics,
					...callerDiagnostics
				} }
			};
			let result;
			if (cause instanceof HopperRemoteError) result = new HopperRemoteError(cause.code, cause.safeMessage, {
				...context,
				operation,
				requestId: cause.requestId,
				diagnosticType: cause.diagnosticType
			});
			else if (cause instanceof HopperTimeoutError) result = new HopperTimeoutError(cause.timeoutMs, operation, cause.requestId, cause.providerState, cause.stage, cause.launcherOutcome, context);
			else if (cause instanceof HopperProcessError) result = new HopperProcessError(cause.exitCode, {
				...context,
				operation,
				requestId: cause.requestId,
				providerState: cause.providerState,
				stage: cause.stage,
				...cause.diagnostic === undefined ? {} : { diagnostic: cause.diagnostic },
				...cause.launcherFailure === undefined ? {} : { launcherFailure: cause.launcherFailure }
			});
			else if (cause instanceof ProviderCleanupError) {
				const { diagnostics, ...outcomeContext } = context;
				result = new ProviderCleanupError(cause.providerId, cause.cleanupResources, diagnostics ?? {}, {
					...outcomeContext,
					operation,
					...cause.remediationAction === undefined ? {} : { remediationAction: cause.remediationAction }
				});
			} else if (cause instanceof AnalysisTimeoutError) result = new AnalysisTimeoutError(operation, cause.timeoutMs, {
				...context,
				...cause.userMessage === undefined ? {} : { userMessage: cause.userMessage },
				...cause.remediationAction === undefined ? {} : { remediationAction: cause.remediationAction }
			});
			else if (cause instanceof AnalysisOutputError) result = new AnalysisOutputError(operation, cause.reason, {
				...context,
				cleanupOnly: cause.cleanupOnly,
				...cause.userMessage === undefined ? {} : { userMessage: cause.userMessage },
				...cause.remediationAction === undefined ? {} : { remediationAction: cause.remediationAction }
			});
			else if (cause instanceof AnalysisCancelledError) result = new AnalysisCancelledError(operation, {
				...context,
				cause: cause.cause
			});
			else if (cause instanceof AnalysisCapabilityUnavailableError) result = new AnalysisCapabilityUnavailableError(cause.providerId, operation, cause.reason, {
				...context,
				...cause.userMessage === undefined ? {} : { userMessage: cause.userMessage },
				retryable: cause.retryable
			});
			else if (cause instanceof AnalysisAccessDeniedError) result = new AnalysisAccessDeniedError(operation, cause.path, cause.systemCode, context);
			else if (cause instanceof AnalysisArtifactChangedError) result = new AnalysisArtifactChangedError(operation, cause.path, cause.reason, context);
			else if (cause instanceof AnalysisResourceConstraintError) result = new AnalysisResourceConstraintError(operation, cause.resource, cause.reason, cause.reportedLimits, {
				...context,
				...cause.retryable === undefined ? {} : { retryable: cause.retryable },
				...cause.remediationAction === undefined ? {} : { remediationAction: cause.remediationAction }
			});
			else result = new ProviderAdapterError(providerId, operation, {
				...context,
				...cause.userMessage === undefined ? {} : { userMessage: cause.userMessage },
				...cause.remediationAction === undefined ? {} : { remediationAction: cause.remediationAction }
			});
			return cause.cleanupIncomplete ? result.bindCleanupDependencies([cause]) : result.resolveCleanup();
		};
	})))();
}

//#endregion
//#region dist/providers/OwnedCommandCleanup.js
var retainOwnedCommandCleanup;
function init_OwnedCommandCleanup() {
	return (init_OwnedCommandCleanup = __esmMin((() => {
		init_jsonValue();
		init_AnalysisCleanupLease();
		init_providerCleanupError();
		init_DarwinProcessRunTokenReader();
		init_OwnedCommand();
		retainOwnedCommandCleanup = (cause, resourceOwner, providerId, operation) => {
			const commandFailure = cause instanceof OwnedCommandFailure ? cause : undefined;
			const preparation = commandFailure?.preparationFailure ?? (cause instanceof DarwinProcessOwnershipInspectionError ? cause : undefined);
			const cleanups = [];
			if (preparation?.cleanupFailure !== undefined) {
				const cleanup = preparation.cleanupFailure;
				const lease = new AnalysisCleanupLease(async () => {
					if (!cleanup.cleanupIncomplete) return;
					if (preparation.cleanupOwner === undefined) throw cleanup;
					await preparation.cleanupOwner.close();
					if (cleanup.cleanupIncomplete) throw cleanup;
				}, cleanup);
				resourceOwner.retain({
					close: () => lease.release(),
					get cleanupResources() {
						return cleanup.cleanupResources;
					}
				}, cleanup.cleanupResources[0] ?? "Provider prerequisite ownership preparation");
				cleanups.push(cleanup);
			}
			if (commandFailure !== undefined && (commandFailure.cleanupOwner !== undefined || commandFailure.cleanupFailure !== null)) {
				const supervisor = commandFailure.cleanupOwner;
				const cleanup = new ProviderCleanupError(providerId, commandFailure.resources, {
					reason: commandFailure.cleanupFailure ?? "Provider prerequisite cleanup remains incomplete",
					...commandFailure.cleanupResult === undefined ? {} : { process_cleanup: jsonValueSchema.parse(commandFailure.cleanupResult) }
				}, {
					cause,
					operation
				});
				const lease = new AnalysisCleanupLease(async () => {
					if (supervisor === undefined) throw cleanup;
					const stopped = await supervisor.stop();
					if (stopped.status === "incomplete") throw cleanup;
				}, commandFailure.resources);
				cleanup.bindCleanupResourceOwner(lease);
				lease.bindCleanupError(cleanup);
				resourceOwner.retain({
					close: () => lease.release(),
					get cleanupResources() {
						return cleanup.cleanupResources;
					}
				}, commandFailure.resources[0] ?? "Provider prerequisite process");
				cleanups.push(cleanup);
			}
			return cleanups;
		};
	})))();
}

//#endregion
export { analysisClientFailureContext, analysisClientFailureForOperation, init_AnalysisClientFailure, init_OwnedCommandCleanup, retainOwnedCommandCleanup };