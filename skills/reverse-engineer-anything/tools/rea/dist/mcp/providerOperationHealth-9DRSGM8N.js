import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";

//#region dist/domain/unicodeCodePointOrder.js
var compareUnicodeCodePoints, compositeKey;
function init_unicodeCodePointOrder() {
	return (init_unicodeCodePointOrder = __esmMin((() => {
		compareUnicodeCodePoints = (left, right) => {
			let leftIndex = 0;
			let rightIndex = 0;
			while (leftIndex < left.length && rightIndex < right.length) {
				const leftPoint = left.codePointAt(leftIndex) ?? 0;
				const rightPoint = right.codePointAt(rightIndex) ?? 0;
				const difference = leftPoint - rightPoint;
				if (difference !== 0) return difference;
				leftIndex += leftPoint > 65535 ? 2 : 1;
				rightIndex += rightPoint > 65535 ? 2 : 1;
			}
			if (leftIndex === left.length && rightIndex === right.length) return 0;
			return leftIndex === left.length ? -1 : 1;
		};
		compositeKey = (parts) => JSON.stringify(parts);
	})))();
}

//#endregion
//#region dist/domain/providerOperationHealth.js
var PROVIDER_OPERATION_STATES, PROVIDER_RETRY_ACTIONS, PROVIDER_FAILURE_STAGES, providerRetryAction, sharedProviderFailureStage;
function init_providerOperationHealth() {
	return (init_providerOperationHealth = __esmMin((() => {
		PROVIDER_OPERATION_STATES = [
			"idle",
			"busy",
			"exited",
			"unreachable",
			"not_started",
			"unknown"
		];
		PROVIDER_RETRY_ACTIONS = [
			"retry",
			"wait",
			"restart_provider",
			"unknown"
		];
		PROVIDER_FAILURE_STAGES = [
			"launch",
			"connection",
			"analysis",
			"decompilation",
			"unknown"
		];
		providerRetryAction = (state, startupFailure = false) => {
			if (state === "idle") return null;
			if (startupFailure && state === "exited") return "retry";
			switch (state) {
				case "busy": return "wait";
				case "exited":
				case "unreachable": return "restart_provider";
				case "not_started": return "retry";
				case "unknown": return "unknown";
			}
		};
		sharedProviderFailureStage = (requests) => {
			const first = requests[0]?.stage;
			if (first === undefined) return null;
			return requests.every((request) => request.stage === first) ? first : "unknown";
		};
	})))();
}

//#endregion
export { providerRetryAction as a, compositeKey as c, init_providerOperationHealth as i, init_unicodeCodePointOrder as l, PROVIDER_OPERATION_STATES as n, sharedProviderFailureStage as o, PROVIDER_RETRY_ACTIONS as r, compareUnicodeCodePoints as s, PROVIDER_FAILURE_STAGES as t };