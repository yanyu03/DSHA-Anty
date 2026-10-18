import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { b as jsonValueSchema, v as init_jsonValue, y as jsonObjectSchema } from "./analysisErrorCore-BIEP7tvF.js";
import { Qt as relationshipCoverageSchema, Wt as init_evidence, Xt as init_relationshipCoverage, zt as createEvidence } from "./nativeValueTrace-BEZbDieM.js";

//#region dist/application/AnalysisProvider.js
function createAnalysisExecution(result, provider, options = {}) {
	return {
		result: jsonValueSchema.parse(result),
		rawResult: options.rawResult === undefined ? null : jsonValueSchema.parse(options.rawResult),
		provider,
		...options.analysisProfile === undefined ? {} : { analysisProfile: structuredClone(options.analysisProfile) },
		limitations: [...options.limitations ?? []],
		...options.relationshipCoverage === undefined ? {} : { relationshipCoverage: relationshipCoverageSchema.parse(options.relationshipCoverage) },
		...options.referencesTruncated === undefined ? {} : { referencesTruncated: options.referencesTruncated },
		locations: [...options.locations ?? []],
		subject: options.subject ?? null
	};
}
var createAnalysisExecutionEvidence;
function init_AnalysisProvider() {
	return (init_AnalysisProvider = __esmMin((() => {
		init_evidence();
		init_jsonValue();
		init_relationshipCoverage();
		createAnalysisExecutionEvidence = (operation, input, execution, confidence) => createEvidence(execution.subject ?? undefined, execution.provider, {
			operation,
			parameters: jsonObjectSchema.parse(input),
			result: execution.result,
			rawResult: execution.rawResult,
			limitations: execution.limitations,
			locations: execution.locations,
			confidence
		});
	})))();
}

//#endregion
export { createAnalysisExecutionEvidence as n, init_AnalysisProvider as r, createAnalysisExecution as t };