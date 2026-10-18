import { createEvidence, } from "../domain/evidence.js";
import { jsonObjectSchema, jsonValueSchema } from "../domain/jsonValue.js";
import { relationshipCoverageSchema, } from "../domain/relationshipCoverage.js";
export function createAnalysisExecution(result, provider, options = {}) {
    return {
        result: jsonValueSchema.parse(result),
        rawResult: options.rawResult === undefined
            ? null
            : jsonValueSchema.parse(options.rawResult),
        provider,
        ...(options.analysisProfile === undefined
            ? {}
            : { analysisProfile: structuredClone(options.analysisProfile) }),
        limitations: [...(options.limitations ?? [])],
        ...(options.relationshipCoverage === undefined
            ? {}
            : {
                relationshipCoverage: relationshipCoverageSchema.parse(options.relationshipCoverage),
            }),
        ...(options.referencesTruncated === undefined
            ? {}
            : { referencesTruncated: options.referencesTruncated }),
        locations: [...(options.locations ?? [])],
        subject: options.subject ?? null,
    };
}
/**
 * Compose one completed provider execution into its caller-visible Evidence,
 * so success and a late cancellation that retains it carry identical facts.
 */
export const createAnalysisExecutionEvidence = (operation, input, execution, confidence) => createEvidence(execution.subject ?? undefined, execution.provider, {
    operation,
    parameters: jsonObjectSchema.parse(input),
    result: execution.result,
    rawResult: execution.rawResult,
    limitations: execution.limitations,
    locations: execution.locations,
    confidence,
});
