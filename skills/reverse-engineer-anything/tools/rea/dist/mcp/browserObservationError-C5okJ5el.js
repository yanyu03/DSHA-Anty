import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { D as AnalysisError, O as init_analysisErrorBase, f as init_analysisErrorCore, i as AnalysisCancelledError } from "./analysisErrorCore-BIEP7tvF.js";

//#region dist/domain/providerAdapterError.js
var ProviderAdapterError;
function init_providerAdapterError() {
	return (init_providerAdapterError = __esmMin((() => {
		init_analysisErrorBase();
		ProviderAdapterError = class extends AnalysisError {
			providerId;
			operation;
			_tag = "ProviderAdapterError";
			userMessage;
			remediationAction;
			constructor(providerId, operation, options = {}) {
				super(`Provider ${providerId} adapter failed during ${operation}`, options);
				this.providerId = providerId;
				this.operation = operation;
				this.userMessage = options.userMessage;
				this.remediationAction = options.remediationAction;
			}
		};
	})))();
}

//#endregion
//#region dist/domain/browserObservationError.js
var BrowserObservationError, observationFailureMessage;
function init_browserObservationError() {
	return (init_browserObservationError = __esmMin((() => {
		init_analysisErrorBase();
		init_analysisErrorCore();
		BrowserObservationError = class extends AnalysisError {
			operation;
			reason;
			_tag = "BrowserObservationError";
			cleanupIncomplete;
			userCategory;
			userMessage;
			constructor(operation, reason, options) {
				super(`Browser observation ${operation} failed: ${reason}`, options);
				this.operation = operation;
				this.reason = reason;
				this.userMessage = options?.detail ?? observationFailureMessage(operation, reason);
				this.cleanupIncomplete = this.cleanup !== undefined || reason === "cleanup_failed";
				this.setCleanupResources(this.cleanup?.resources ?? (reason === "cleanup_failed" ? ["browser_transport"] : []));
				this.userCategory = reason === "cancelled" || options?.cause instanceof AnalysisCancelledError || options?.cause instanceof AnalysisError && options.cause.userCategory === "cancelled" ? "cancelled" : undefined;
			}
		};
		observationFailureMessage = (operation, reason) => {
			if (reason === "cancelled") return `${operation} was cancelled. Collected observations and cleanup status are reported when available.`;
			if (reason === "timeout") return `${operation} exceeded its execution deadline. Review the target's responsiveness and retained observations before retrying.`;
			if (reason === "endpoint_unreachable") return `${operation} could not reach the selected loopback debugging endpoint. Verify that the target process is running with debugging enabled and that the endpoint's port matches it, then retry.`;
			if (reason === "target_not_found") return `${operation} could not find the selected target at the debugging endpoint. Refresh target discovery for that endpoint and retry with a returned target ID.`;
			if (reason === "service_worker_blocked") return `${operation} refused the selected page because it is controlled by or has a registered service worker while the service-worker policy is block. Set environment.service_workers to allow to permit observation, or remove the service worker registration through the browser.`;
			if (reason === "disconnected") return `${operation} lost its debugging connection. Verify that the target process is still running, refresh target discovery, and retry the observation.`;
			return undefined;
		};
	})))();
}

//#endregion
export { init_providerAdapterError as i, init_browserObservationError as n, ProviderAdapterError as r, BrowserObservationError as t };