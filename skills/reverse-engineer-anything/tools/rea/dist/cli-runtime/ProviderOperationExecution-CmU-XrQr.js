import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { err, init_result, ok } from "./reconstructionObligationLedgerSchemas-Bi6sect1.js";
import { AnalysisCancelledError, AnalysisInputError, init_analysisErrorCore } from "./errorSchemas-Ixz_q7qt.js";
import { createAnalysisExecutionEvidence, init_AnalysisProvider } from "./AnalysisProvider-BGrYaMVo.js";
import { z } from "zod";

//#region dist/application/ProviderOperationExecution.js
var executeProviderOperation, completeProviderEvidence;
function init_ProviderOperationExecution() {
	return (init_ProviderOperationExecution = __esmMin((() => {
		init_analysisErrorCore();
		init_result();
		init_AnalysisProvider();
		executeProviderOperation = async (operation, input, options, schema, provider, confidence) => {
			if (options?.signal?.aborted) return err(new AnalysisCancelledError(operation, { cause: options.signal.reason }));
			const request = schema.safeParse({
				operation,
				input
			});
			if (!request.success) return err(new AnalysisInputError(operation, { cause: request.error }));
			const executed = await provider.execute(request.data, options);
			if (!executed.ok) return executed;
			const evidence = createAnalysisExecutionEvidence(operation, request.data.input, executed.value, confidence);
			return completeProviderEvidence(evidence, options?.signal);
		};
		completeProviderEvidence = (evidence, signal, capturedOutput) => {
			if (signal?.aborted) return err(new AnalysisCancelledError(evidence.operation, {
				cause: signal.reason,
				partialObservation: evidence,
				...capturedOutput === undefined ? {} : { capturedOutput }
			}));
			return ok(evidence);
		};
	})))();
}

//#endregion
export { completeProviderEvidence, executeProviderOperation, init_ProviderOperationExecution };