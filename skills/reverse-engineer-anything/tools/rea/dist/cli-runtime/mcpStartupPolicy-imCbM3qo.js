import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";

//#region dist/mcpStartupPolicy.js
var MCP_STARTUP_POLICY, mcpProviderDeadlineAllowanceMs, recommendedMcpToolTimeoutMs, recommendedMcpToolTimeoutSeconds;
function init_mcpStartupPolicy() {
	return (init_mcpStartupPolicy = __esmMin((() => {
		MCP_STARTUP_POLICY = {
			codexStartupTimeoutSeconds: 30,
			kimiStartupTimeoutMs: 3e4,
			toolOperationHeadroomMs: 12e4,
			initializeBudgetMs: 15e3,
			toolsListBudgetMs: 5e3,
			firstCatalogBudgetMs: 2e4,
			doctorDeadlineMs: 3e4,
			doctorStderrBytes: 64 * 1024
		};
		mcpProviderDeadlineAllowanceMs = (inputs) => {
			const selectedProvider = inputs.analysisProvider;
			const selectedTimeout = selectedProvider === "ghidra" ? inputs.ghidraStartupTimeoutMs : selectedProvider === "hopper" ? inputs.hopperStartupTimeoutMs : Math.max(inputs.ghidraStartupTimeoutMs, inputs.hopperStartupTimeoutMs);
			return Math.max(selectedTimeout, inputs.jebMcpTimeoutMs ?? 0, inputs.providerRequestTimeoutMs ?? 0);
		};
		recommendedMcpToolTimeoutMs = (inputs) => mcpProviderDeadlineAllowanceMs(inputs) + MCP_STARTUP_POLICY.toolOperationHeadroomMs;
		recommendedMcpToolTimeoutSeconds = (inputs) => Math.ceil(recommendedMcpToolTimeoutMs(inputs) / 1e3);
	})))();
}

//#endregion
export { MCP_STARTUP_POLICY, init_mcpStartupPolicy, mcpProviderDeadlineAllowanceMs, recommendedMcpToolTimeoutMs, recommendedMcpToolTimeoutSeconds };