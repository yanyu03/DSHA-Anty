import { electronPageInspectionSchema, electronTargetListSchema, } from "../domain/javascript/electronObservation.js";
import { AnalysisError } from "../domain/analysisErrorBase.js";
import { AnalysisCancelledError } from "../domain/analysisErrorCore.js";
import { BrowserObservationError } from "../domain/browserObservationError.js";
import { ProviderAdapterError } from "../domain/providerAdapterError.js";
import { err, ok } from "../domain/result.js";
import { discoverCdpEndpoint, hasCdpTargetWebSocket, } from "./CdpEndpoint.js";
import { closeCdpTargetSession, openCdpTargetSession, } from "./CdpTargetSession.js";
import { inspectCdpElectronPage } from "./CdpElectronInspection.js";
import { authorizedElectronFile } from "./ElectronFileScope.js";
import { CDP_ELECTRON_PROVIDER_IDENTITY } from "./providerIdentities.js";
import { compareUnicodeCodePoints } from "../domain/unicodeCodePointOrder.js";
import { analysisErrorWithCleanupFailure } from "../domain/analysisErrorCleanup.js";
import { ProviderCleanupError } from "../domain/providerCleanupError.js";
import { CdpTargetSessionOwner, bindCdpTransportCleanup, } from "./CdpTargetSessionOwner.js";
/** Passive Electron provider for local file pages exposed by loopback CDP. */
export class CdpElectronProvider {
    #owner = new CdpTargetSessionOwner();
    close() {
        return this.#owner.close();
    }
    identity() {
        return CDP_ELECTRON_PROVIDER_IDENTITY;
    }
    async listTargets(input, options = {}) {
        try {
            const discovery = await discoverCdpEndpoint(input.cdp_endpoint, "list_electron_targets", options.signal);
            const allowed = [];
            let unsupportedUrl = 0;
            let nonPage = 0;
            let unconnectable = 0;
            for (const target of discovery.targets) {
                if (target.type !== "page") {
                    nonPage += 1;
                    continue;
                }
                const path = await authorizedElectronFile(target.url);
                if (path === undefined) {
                    unsupportedUrl += 1;
                    continue;
                }
                if (!hasCdpTargetWebSocket(discovery, target)) {
                    unconnectable += 1;
                    continue;
                }
                allowed.push({
                    target_id: target.id,
                    type: target.type,
                    title: target.title,
                    file_path: path,
                    attached: target.attached,
                });
            }
            allowed.sort((left, right) => compareUnicodeCodePoints(left.target_id, right.target_id));
            return ok(electronTargetListSchema.parse({
                browser: discovery.version,
                targets: allowed,
                excluded: {
                    unsupported_url: unsupportedUrl,
                    non_page: nonPage,
                },
                limitations: [
                    "Every local file page exposed by the selected loopback CDP endpoint is eligible for listing.",
                    ...(unconnectable === 0
                        ? []
                        : [
                            `${String(unconnectable)} otherwise allowed page target(s) lacked a validated direct CDP WebSocket and were excluded.`,
                        ]),
                    ...(allowed.some((target) => target.attached === null)
                        ? [
                            "CDP discovery omitted attachment state for one or more targets; attached is reported as unknown.",
                        ]
                        : []),
                ],
            }));
        }
        catch (cause) {
            return err(providerError(cause, "list_electron_targets"));
        }
    }
    async inspectPage(input, options = {}) {
        let targetSession;
        let cleanupFailure;
        let result;
        try {
            const discovery = await discoverCdpEndpoint(input.cdp_endpoint, "inspect_electron_page", options.signal);
            const target = await authorizeTarget(discovery.targets, input.target_id);
            targetSession = await openCdpTargetSession(discovery, target, "inspect_electron_page", options.signal, undefined, this.#owner);
            result = ok(electronPageInspectionSchema.parse(await inspectCdpElectronPage({
                connection: targetSession.connection,
                sessionId: targetSession.sessionId,
                discovery,
                target,
                input,
                ...(options.signal === undefined ? {} : { signal: options.signal }),
                ...(options.progress === undefined
                    ? {}
                    : { progress: options.progress }),
            })));
        }
        catch (cause) {
            result = err(providerError(cause, "inspect_electron_page"));
        }
        finally {
            if (targetSession !== undefined)
                try {
                    await closeCdpTargetSession(targetSession, ["Debugger", "Runtime", "Page"], options.signal, this.#owner);
                }
                catch (cause) {
                    cleanupFailure =
                        cause instanceof AnalysisError
                            ? cause
                            : new ProviderCleanupError(CDP_ELECTRON_PROVIDER_IDENTITY.id, [input.target_id], {
                                reason: cause instanceof Error ? cause.message : String(cause),
                            }, { operation: "inspect_electron_page", cause });
                }
        }
        const finalCancellation = result.ok && options.signal?.aborted === true
            ? new AnalysisCancelledError("inspect_electron_page", {
                cause: options.signal.reason,
                partialObservation: {
                    kind: "electron-page-observation",
                    inspection: result.value,
                    cleanup: cleanupFailure === undefined
                        ? "transport-closed"
                        : "incomplete",
                },
            })
            : undefined;
        if (cleanupFailure !== undefined) {
            if (finalCancellation !== undefined)
                return err(bindCdpTransportCleanup(cleanupFailure, analysisErrorWithCleanupFailure(finalCancellation, cleanupFailure, "inspect_electron_page")));
            if (!result.ok)
                return err(bindCdpTransportCleanup(cleanupFailure, analysisErrorWithCleanupFailure(result.error, cleanupFailure, "inspect_electron_page")));
            return err(bindCdpTransportCleanup(cleanupFailure, new ProviderCleanupError(CDP_ELECTRON_PROVIDER_IDENTITY.id, cleanupFailure.cleanupResources, { cleanup_error: cleanupFailure.message }, {
                operation: "inspect_electron_page",
                cause: cleanupFailure,
                partialObservation: {
                    kind: "electron-page-observation",
                    inspection: result.value,
                    cleanup: "incomplete",
                },
            })));
        }
        if (!result.ok)
            return result;
        if (finalCancellation !== undefined)
            return err(finalCancellation);
        return result;
    }
}
const authorizeTarget = async (targets, targetId) => {
    const target = targets.find(({ id }) => id === targetId);
    if (target === undefined)
        throw new BrowserObservationError("inspect_web_page", "target_not_found");
    if (target.type !== "page" ||
        (await authorizedElectronFile(target.url)) === undefined)
        throw new BrowserObservationError("inspect_web_page", "target_not_allowed");
    return target;
};
const providerError = (cause, operation) => cause instanceof BrowserObservationError && cause.operation !== operation
    ? new BrowserObservationError(operation, cause.reason, { cause })
    : cause instanceof AnalysisError
        ? cause
        : new ProviderAdapterError(CDP_ELECTRON_PROVIDER_IDENTITY.id, operation, {
            cause,
        });
