import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { createEvidence, init_evidence, init_relationshipCoverage, relationshipCoverageSchema } from "./reconstructionObligationLedgerSchemas-Bi6sect1.js";
import { init_jsonValue, jsonObjectSchema, jsonValueSchema } from "./errorSchemas-Ixz_q7qt.js";

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
export { createAnalysisExecution, createAnalysisExecutionEvidence, init_AnalysisProvider };