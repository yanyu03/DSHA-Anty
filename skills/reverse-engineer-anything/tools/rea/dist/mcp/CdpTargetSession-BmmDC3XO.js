import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { D as AnalysisError, O as init_analysisErrorBase, f as init_analysisErrorCore, i as AnalysisCancelledError } from "./analysisErrorCore-BIEP7tvF.js";
import { a as init_AnalysisCleanupLease, i as AnalysisCleanupLeaseGroup, n as init_providerCleanupError, r as AnalysisCleanupLease, t as ProviderCleanupError } from "./providerCleanupError-DIRHxzWo.js";
import { n as init_browserObservationError, t as BrowserObservationError } from "./browserObservationError-C5okJ5el.js";
import { n as init_analysisErrorCleanup, t as analysisErrorWithCleanupFailure } from "./analysisErrorCleanup-Q344SnTO.js";
import { a as init_CdpEndpoint, c as withCdpDiscoveryDeadline, l as CdpConnection, n as discoverCdpBrowserSocket, r as discoverCdpEndpoint, t as cdpTargetWebSocket, u as init_CdpConnection } from "./CdpEndpoint-BrhMhpSi.js";

//#region dist/browser/CdpTargetSessionOwner.js
var CdpTransportCleanupFailure, bindCdpTransportCleanup, CdpTargetSessionOwner, cleanupError, aggregateCleanupFailures;
function init_CdpTargetSessionOwner() {
	return (init_CdpTargetSessionOwner = __esmMin((() => {
		init_AnalysisCleanupLease();
		init_analysisErrorBase();
		init_providerCleanupError();
		init_analysisErrorCore();
		init_analysisErrorCleanup();
		init_CdpConnection();
		CdpTransportCleanupFailure = class extends ProviderCleanupError {
			cleanupLeases;
			constructor(cleanupLeases, failure) {
				super("rea-cdp-browser", failure.resources, failure.diagnostics, {
					operation: failure.operation,
					cause: failure.cause
				});
				this.cleanupLeases = cleanupLeases;
				new AnalysisCleanupLeaseGroup(this, cleanupLeases);
			}
		};
		bindCdpTransportCleanup = (cause, failure) => {
			if (cause instanceof CdpTransportCleanupFailure) new AnalysisCleanupLeaseGroup(failure, cause.cleanupLeases);
			return failure;
		};
		CdpTargetSessionOwner = class {
			#connections = new Map();
			#closing = false;
			#admissions = 0;
			#closePromise;
			#admissionWaiters = new Set();
			/** Admit and own one WebSocket from handshake completion onward. */
			async connect(url, operation, options, resource, limits) {
				if (this.#closing) throw new ProviderCleanupError("rea-cdp-browser", [resource], { reason: "CDP provider is closing and cannot admit another session." }, { operation });
				await this.retryPending();
				if (this.#closing) throw new ProviderCleanupError("rea-cdp-browser", [resource], { reason: "CDP provider is closing and cannot admit another session." }, { operation });
				if (options.signal?.aborted === true) throw new AnalysisCancelledError(operation, { cause: options.signal.reason });
				this.#admissions += 1;
				let connection;
				try {
					return await CdpConnection.connect(url, operation, options.signal, limits, (opened) => {
						connection = opened;
						this.register(opened, operation, resource);
					});
				} catch (cause) {
					if (connection === undefined) throw cause;
					try {
						await this.finish(connection);
					} catch (cleanupCause) {
						if (cause instanceof AnalysisError && cleanupCause instanceof AnalysisError) throw bindCdpTransportCleanup(cleanupCause, analysisErrorWithCleanupFailure(cause, cleanupCause, operation));
						throw new AggregateError([cause, cleanupCause], `CDP operation ${operation} failed during handshake and cleanup remains incomplete.`, { cause });
					}
					throw cause;
				} finally {
					this.#admissions -= 1;
					if (this.#admissions === 0) {
						for (const resolve of this.#admissionWaiters) resolve();
						this.#admissionWaiters.clear();
					}
				}
			}
			/** Register synchronously before awaiting the WebSocket handshake. */
			register(connection, operation, resource) {
				let settle = () => undefined;
				const settled = new Promise((resolve) => {
					settle = resolve;
				});
				this.#connections.set(connection, {
					connection,
					operation,
					resource,
					cleanupLease: new AnalysisCleanupLease(() => connection.close(), [resource]),
					active: true,
					settled,
					settle,
					cleanup: undefined,
					cleanupAttempted: false,
					failure: undefined
				});
			}
			/** Finish one admitted operation, retaining a failed transport for retry. */
			async finish(connection, cleanup) {
				const record = this.#connections.get(connection);
				if (record === undefined) return;
				if (record.failure !== undefined) throw record.failure;
				record.cleanup ??= cleanup;
				try {
					if (!record.cleanupAttempted && record.cleanup !== undefined) {
						record.cleanupAttempted = true;
						await record.cleanup();
					}
					await record.cleanupLease.release();
					this.#connections.delete(connection);
				} catch (cause) {
					const failure = cleanupError(record, cause);
					record.failure = failure;
					throw failure;
				} finally {
					record.active = false;
					record.settle();
				}
			}
			/** Retry only retained failed transports; active peers finish their own cleanup. */
			async close() {
				this.#closing = true;
				this.#closePromise ??= this.#closeAll().catch((cause) => {
					this.#closePromise = undefined;
					throw cause;
				});
				return await this.#closePromise;
			}
			/** Retry retained failures without touching concurrently active sessions. */
			async retryPending() {
				const failures = [];
				for (const record of this.#connections.values()) {
					if (record.active || record.failure === undefined) continue;
					try {
						await record.cleanupLease.release();
						this.#connections.delete(record.connection);
					} catch (cause) {
						const failure = cleanupError(record, cause);
						record.failure = failure;
						failures.push(failure);
					}
				}
				if (failures.length === 1) throw failures[0];
				if (failures.length > 1) throw aggregateCleanupFailures(failures);
			}
			async #closeAll() {
				while (this.#admissions > 0) await new Promise((resolve) => this.#admissionWaiters.add(resolve));
				while (true) {
					const active = [...this.#connections.values()].filter(({ active }) => active);
					if (active.length === 0) break;
					await Promise.all(active.map(({ settled }) => settled));
				}
				const failures = [];
				for (const record of this.#connections.values()) {
					try {
						await record.cleanupLease.release();
						this.#connections.delete(record.connection);
					} catch (cause) {
						const failure = cleanupError(record, cause);
						record.failure = failure;
						failures.push(failure);
					}
				}
				if (failures.length === 1) throw failures[0];
				if (failures.length > 1) throw aggregateCleanupFailures(failures);
			}
		};
		cleanupError = (record, cause) => new CdpTransportCleanupFailure([record.cleanupLease], {
			resources: [record.resource],
			operation: record.operation,
			cause,
			diagnostics: { reason: cause instanceof AnalysisError ? cause.userMessage ?? cause.message : cause instanceof Error ? cause.message : String(cause) }
		});
		aggregateCleanupFailures = (failures) => new CdpTransportCleanupFailure(failures.flatMap((failure) => failure.cleanupLeases), {
			resources: failures.flatMap(({ cleanupResources }) => cleanupResources),
			operation: "close_cdp_transports",
			cause: new AggregateError(failures, "One or more REA-owned CDP transports remain open."),
			diagnostics: { failures: failures.map(({ message, diagnostics }) => ({
				message,
				diagnostics: diagnostics ?? {}
			})) }
		});
	})))();
}

//#endregion
//#region dist/browser/CdpTargetSession.js
var openCdpEndpoint, openCdpTargetSession, attachCdpTargetSession, combineOpenFailure, closeCdpTargetSession, cleanupCdpTargetCommands, attachedSessionId;
function init_CdpTargetSession() {
	return (init_CdpTargetSession = __esmMin((() => {
		init_analysisErrorBase();
		init_analysisErrorCleanup();
		init_browserObservationError();
		init_CdpConnection();
		init_CdpTargetSessionOwner();
		init_CdpEndpoint();
		openCdpEndpoint = async (endpoint, operation, signal, timeoutMs, owner) => {
			if (endpoint.transport === "http_discovery") return {
				discovery: await discoverCdpEndpoint(endpoint.url, operation, signal),
				connection: undefined
			};
			return await withCdpDiscoveryDeadline(operation, signal, async (deadlineSignal) => {
				const connection = owner === undefined ? await CdpConnection.connect(endpoint.url, operation, deadlineSignal) : await owner.connect(endpoint.url, operation, { signal: deadlineSignal }, "browser-endpoint");
				try {
					return {
						discovery: await discoverCdpBrowserSocket(connection, endpoint.url, operation, deadlineSignal),
						connection
					};
				} catch (cause) {
					if (owner === undefined) {
						await connection.close();
						throw cause;
					}
					try {
						await owner.finish(connection);
					} catch (cleanupCause) {
						throw combineOpenFailure(cause, cleanupCause, operation);
					}
					throw cause;
				}
			}, timeoutMs);
		};
		openCdpTargetSession = async (discovery, target, operation, signal, limits, owner) => {
			const webSocket = cdpTargetWebSocket(discovery, target, operation);
			const connection = owner === undefined ? await CdpConnection.connect(webSocket.url, operation, signal, limits) : await owner.connect(webSocket.url, operation, signal === undefined ? {} : { signal }, target.id, limits);
			if (webSocket.scope === "page") return {
				connection,
				sessionId: undefined
			};
			try {
				return await attachCdpTargetSession(connection, target, operation, signal, owner);
			} catch (cause) {
				if (owner === undefined) throw cause;
				try {
					await owner.finish(connection);
				} catch (cleanupCause) {
					throw combineOpenFailure(cause, cleanupCause, operation);
				}
				throw cause;
			}
		};
		attachCdpTargetSession = async (connection, target, operation, signal, owner) => {
			try {
				const attached = await connection.send("Target.attachToTarget", {
					targetId: target.id,
					flatten: true
				}, undefined, signal);
				return {
					connection,
					sessionId: attachedSessionId(attached, operation)
				};
			} catch (cause) {
				if (owner === undefined) {
					await connection.close();
					throw cause;
				}
				throw cause;
			}
		};
		combineOpenFailure = (primary, cleanup, operation) => primary instanceof AnalysisError && cleanup instanceof AnalysisError ? bindCdpTransportCleanup(cleanup, analysisErrorWithCleanupFailure(primary, cleanup, operation)) : new AggregateError([primary, cleanup], `CDP operation ${operation} failed and its transport cleanup is incomplete.`, { cause: primary });
		closeCdpTargetSession = async (targetSession, enabledDomains, signal, owner) => {
			if (owner !== undefined) {
				await owner.finish(targetSession.connection, () => cleanupCdpTargetCommands(targetSession, enabledDomains, signal));
				return;
			}
			await cleanupCdpTargetCommands(targetSession, enabledDomains, signal);
			await targetSession.connection.close();
		};
		cleanupCdpTargetCommands = async (targetSession, enabledDomains, signal) => {
			const { connection, sessionId } = targetSession;
			const cleanup = new AbortController();
			const domainSignal = signal === undefined ? cleanup.signal : AbortSignal.any([cleanup.signal, signal]);
			const timeout = setTimeout(() => cleanup.abort(), 1e3);
			timeout.unref();
			try {
				if (signal?.aborted !== true) {
					for (const domain of enabledDomains) {
						if (domainSignal.aborted) break;
						try {
							await connection.send(`${domain}.disable`, {}, sessionId, domainSignal);
						} catch {}
					}
				}
				if (!cleanup.signal.aborted && sessionId !== undefined) try {
					await connection.send("Target.detachFromTarget", { sessionId }, undefined, cleanup.signal);
				} catch {}
			} finally {
				clearTimeout(timeout);
				cleanup.abort();
			}
		};
		attachedSessionId = (value, operation) => {
			if (typeof value !== "object" || value === null || !("sessionId" in value) || typeof value.sessionId !== "string" || value.sessionId.length === 0) throw new BrowserObservationError(operation, "protocol_error");
			return value.sessionId;
		};
	})))();
}

//#endregion
export { openCdpTargetSession as a, init_CdpTargetSessionOwner as c, openCdpEndpoint as i, closeCdpTargetSession as n, CdpTargetSessionOwner as o, init_CdpTargetSession as r, bindCdpTransportCleanup as s, attachCdpTargetSession as t };