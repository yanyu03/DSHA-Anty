import { z } from "zod";
import { AnalysisCancelledError, AnalysisInputError, } from "../domain/analysisErrorCore.js";
import { err, ok } from "../domain/result.js";
import { createAnalysisExecutionEvidence, } from "./AnalysisProvider.js";
/**
 * Shared CLI/MCP admission, execution, and Evidence composition for
 * single-request providers. The caller retains its operation vocabulary and
 * confidence; this normalizes cancellation, input validation, and Evidence
 * assembly once instead of per provider.
 */
export const executeProviderOperation = async (operation, input, options, schema, provider, confidence) => {
    if (options?.signal?.aborted)
        return err(new AnalysisCancelledError(operation, { cause: options.signal.reason }));
    const request = schema.safeParse({ operation, input });
    if (!request.success)
        return err(new AnalysisInputError(operation, { cause: request.error }));
    const executed = await provider.execute(request.data, options);
    if (!executed.ok)
        return executed;
    const evidence = createAnalysisExecutionEvidence(operation, request.data.input, executed.value, confidence);
    return completeProviderEvidence(evidence, options?.signal);
};
/** Classify completion after Evidence assembly, preserving facts on late abort. */
export const completeProviderEvidence = (evidence, signal, capturedOutput) => {
    if (signal?.aborted)
        return err(new AnalysisCancelledError(evidence.operation, {
            cause: signal.reason,
            partialObservation: evidence,
            ...(capturedOutput === undefined ? {} : { capturedOutput }),
        }));
    return ok(evidence);
};
