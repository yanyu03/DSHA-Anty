import { z } from "zod";
import { AnalysisCancelledError, AnalysisOutputError, } from "../domain/analysisErrorCore.js";
import { createEvidence } from "../domain/evidence.js";
import { jsonObjectSchema } from "../domain/jsonValue.js";
import { analysisInputErrorFromIssues } from "../domain/inputIssueProjection.js";
import { err, ok } from "../domain/result.js";
import { observeWebExecutionInputSchema, webExecutionSchema, } from "../domain/webExecution.js";
import { inspectWebEventListenersInputSchema, webEventListenersSchema, } from "../domain/webEventListeners.js";
import { completeProviderEvidence } from "./ProviderOperationExecution.js";
/** Shared public workflows keep instrumentation and listener inspection independently selectable. */
export class WebRuntimeService {
    provider;
    constructor(provider) {
        this.provider = provider;
    }
    /** Observe externally triggered execution; selection authorizes the declared instrumentation. */
    async observe(rawInput, options) {
        const operation = "observe_web_execution";
        const parsed = parseInput(observeWebExecutionInputSchema, rawInput, operation, options);
        if (!parsed.ok)
            return parsed;
        const result = await this.provider.observeExecution(parsed.value, options);
        if (!result.ok) {
            const partial = result.error.partialObservation;
            if (partial !== undefined &&
                !("evidence_id" in partial) &&
                "instrumentation" in partial &&
                "window" in partial) {
                const verifiedPartial = webExecutionSchema.safeParse(partial);
                if (verifiedPartial.success) {
                    const evidence = this.evidence(operation, parsed.value, verifiedPartial.data);
                    if (evidence.ok)
                        result.error.partialObservation = evidence.value;
                    else if (result.error instanceof AnalysisCancelledError)
                        return evidence;
                }
                else if (result.error instanceof AnalysisCancelledError)
                    return err(new AnalysisOutputError(operation, "Provider retained a malformed completed execution observation.", { cause: verifiedPartial.error }));
            }
            return result;
        }
        const verified = webExecutionSchema.safeParse(result.value);
        if (!verified.success)
            return err(new AnalysisOutputError(operation, verified.error.message));
        if (verified.data.target.target_id !== parsed.value.target_id ||
            verified.data.window.requested_ms !== parsed.value.observation_ms)
            return err(new AnalysisOutputError(operation, "Provider changed the selected target or requested window."));
        return this.evidence(operation, parsed.value, verified.data, options);
    }
    /** Inspect one selected node's listener declarations without dispatching an event. */
    async inspect(rawInput, options) {
        const operation = "inspect_web_event_listeners";
        const parsed = parseInput(inspectWebEventListenersInputSchema, rawInput, operation, options);
        if (!parsed.ok)
            return parsed;
        const result = await this.provider.inspectEventListeners(parsed.value, options);
        if (!result.ok) {
            const partial = result.error.partialObservation;
            if (partial !== undefined &&
                !("evidence_id" in partial) &&
                "selected_node" in partial &&
                "listeners" in partial) {
                const verifiedPartial = webEventListenersSchema.safeParse(partial);
                if (verifiedPartial.success) {
                    const evidence = this.evidence(operation, parsed.value, verifiedPartial.data);
                    if (evidence.ok)
                        result.error.partialObservation = evidence.value;
                    else if (result.error instanceof AnalysisCancelledError)
                        return evidence;
                }
                else if (result.error instanceof AnalysisCancelledError)
                    return err(new AnalysisOutputError(operation, "Provider retained malformed completed event-listener data.", { cause: verifiedPartial.error }));
            }
            return result;
        }
        const verified = webEventListenersSchema.safeParse(result.value);
        if (!verified.success)
            return err(new AnalysisOutputError(operation, verified.error.message));
        if (verified.data.target.target_id !== parsed.value.target_id ||
            verified.data.selected_node.selector !== parsed.value.selector)
            return err(new AnalysisOutputError(operation, "Provider changed the selected target or node selector."));
        return this.evidence(operation, parsed.value, verified.data, options);
    }
    evidence(operation, input, result, options) {
        if (input.allowed_origins.length > 0 &&
            !input.allowed_origins.includes(result.target.origin))
            return err(new AnalysisOutputError(operation, "Provider returned a document outside the selected origin scope."));
        return completeProviderEvidence(createEvidence(undefined, this.provider.identity(), {
            predicateType: `rea.${operation.replaceAll("_", "-")}`,
            operation,
            parameters: jsonObjectSchema.parse(input),
            result,
            confidence: "observed",
            authority: "external-service",
            limitations: result.limitations,
        }), options?.signal);
    }
}
const parseInput = (schema, rawInput, operation, options) => {
    if (options?.signal?.aborted)
        return err(new AnalysisCancelledError(operation));
    const parsed = schema.safeParse(rawInput);
    return parsed.success
        ? ok(parsed.data)
        : err(analysisInputErrorFromIssues(operation, parsed.error.issues, rawInput, {
            cause: parsed.error,
        }));
};
