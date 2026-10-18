import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { A as err, M as ok, f as init_analysisErrorCore, j as init_result, s as AnalysisOutputError } from "./analysisErrorCore-BIEP7tvF.js";
import { l as init_unicodeCodePointOrder, s as compareUnicodeCodePoints } from "./providerOperationHealth-9DRSGM8N.js";

//#region dist/application/SourceLimitations.js
var sourceLimitationKey, renderSourceLimitations;
function init_SourceLimitations() {
	return (init_SourceLimitations = __esmMin((() => {
		init_unicodeCodePointOrder();
		sourceLimitationKey = ({ provider, operation, limitation }) => JSON.stringify([
			provider.id,
			provider.name,
			provider.version,
			operation,
			limitation
		]);
		renderSourceLimitations = (limitations) => {
			const groups = new Map();
			for (const { provider, operation, limitation } of limitations) {
				const key = JSON.stringify([
					provider.id,
					provider.name,
					provider.version,
					limitation
				]);
				const group = groups.get(key) ?? {
					provider,
					limitation,
					operations: new Set()
				};
				group.operations.add(operation);
				groups.set(key, group);
			}
			return [...groups.values()].map(({ provider, limitation, operations }) => {
				const version = provider.version === null ? "" : ` ${provider.version}`;
				const operationList = [...operations].sort(compareUnicodeCodePoints);
				return `${provider.name} (${provider.id}${version}) ${operationList.join(", ")}: ${limitation}`;
			}).sort(compareUnicodeCodePoints);
		};
	})))();
}

//#endregion
//#region dist/application/ProcedureAddressResolution.js
var resolveProcedureAddress;
function init_ProcedureAddressResolution() {
	return (init_ProcedureAddressResolution = __esmMin((() => {
		init_analysisErrorCore();
		init_result();
		resolveProcedureAddress = async (call, procedure, signal) => {
			const result = await call("procedure_address", { procedure }, signal);
			if (!result.ok) return result;
			return typeof result.value === "string" && result.value.length > 0 ? ok(result.value) : err(new AnalysisOutputError("procedure_address", "provider returned no canonical procedure address"));
		};
	})))();
}

//#endregion
export { sourceLimitationKey as a, renderSourceLimitations as i, resolveProcedureAddress as n, init_SourceLimitations as r, init_ProcedureAddressResolution as t };