import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { err, init_result, ok } from "./reconstructionObligationLedgerSchemas-Bi6sect1.js";
import { AnalysisCapabilityUnavailableError, init_analysisErrorCore } from "./errorSchemas-Ixz_q7qt.js";
import { analysisErrorWithCleanupFailure, init_analysisErrorCleanup } from "./analysisErrorCleanup-COdAmDsb.js";
import { ProviderCleanupError, init_providerCleanupError } from "./providerCleanupError-BhsJyAhk.js";
import { execFileOutput, execFileOutputFailure, init_ExecFileOutput } from "./ExecFileOutput-D6KLYTve.js";
import { DEFAULT_SWIFTC_COMPILE_TIMEOUT_MS, init_providerStartupTimeout, providerStartupTimeoutSchema } from "./providerStartupTimeout-B2tF2LtZ.js";
import { init_safeJson, safeParseJson } from "./safeJson-DKKACtdy.js";
import { z } from "zod";
import { basename, isAbsolute, join } from "node:path";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";

//#region dist/process/ProcessCommandIdentity.js
var matchesOwnedProcessCommand;
function init_ProcessCommandIdentity() {
	return (init_ProcessCommandIdentity = __esmMin((() => {
		matchesOwnedProcessCommand = (actual, expected, platform = process.platform) => {
			const actualCommand = actual.trim();
			const expectedCommand = expected.trim();
			if (actualCommand === expectedCommand || actualCommand.startsWith(`${expectedCommand} `)) return true;
			if (platform !== "darwin") return false;
			const actualExecutable = actualCommand.split(/\s+/u, 1)[0];
			const expectedExecutable = expectedCommand.split(/\s+/u, 1)[0];
			const normalizedActualExecutable = actualExecutable?.startsWith("(") === true && actualExecutable.endsWith(")") ? actualExecutable.slice(1, -1) : actualExecutable;
			return normalizedActualExecutable !== undefined && expectedExecutable !== undefined && basename(normalizedActualExecutable) === basename(expectedExecutable);
		};
	})))();
}

//#endregion
//#region dist/process/ProcessOwnershipIdentity.js
var launcherIdentityFailure;
function init_ProcessOwnershipIdentity() {
	return (init_ProcessOwnershipIdentity = __esmMin((() => {
		init_ProcessCommandIdentity();
		launcherIdentityFailure = (launcher, ownership) => {
			if (launcher.processGroupId !== ownership.processGroupId) return "owned launcher process-group identity did not match";
			if (ownership.expectedParentPid !== undefined && launcher.parentPid !== ownership.expectedParentPid) return "owned launcher parent identity did not match";
			if (ownership.expectedCommand !== undefined && !matchesOwnedProcessCommand(launcher.command, ownership.expectedCommand)) return `owned launcher command identity did not match (observed=${launcher.command}; expected=${ownership.expectedCommand})`;
			return null;
		};
	})))();
}

//#endregion
//#region dist/process/ProcessOwnershipProcessTree.js
var liveProcesses, descendantsOf, selectCapturedProcessGroupIds;
function init_ProcessOwnershipProcessTree() {
	return (init_ProcessOwnershipProcessTree = __esmMin((() => {
		liveProcesses = (members) => members.filter(({ state }) => !state.startsWith("Z"));
		descendantsOf = (rootPids, processes) => {
			const childrenByParent = new Map();
			for (const process of processes) {
				const siblings = childrenByParent.get(process.parentPid) ?? [];
				siblings.push(process);
				childrenByParent.set(process.parentPid, siblings);
			}
			const descendants = [];
			const pending = rootPids.flatMap((pid) => childrenByParent.get(pid) ?? []);
			const visited = new Set(rootPids);
			for (const process of pending) {
				if (visited.has(process.pid)) continue;
				visited.add(process.pid);
				descendants.push(process);
				pending.push(...childrenByParent.get(process.pid) ?? []);
			}
			return descendants;
		};
		selectCapturedProcessGroupIds = (rootPid, samples) => {
			const processGroupIds = new Set([rootPid]);
			for (const sample of samples) {
				if (sample.pid === sample.process_group_id) processGroupIds.add(sample.pid);
			}
			return [...processGroupIds];
		};
	})))();
}

//#endregion
//#region dist/process/boundedUtf8Text.js
var boundedUtf8Text;
function init_boundedUtf8Text() {
	return (init_boundedUtf8Text = __esmMin((() => {
		boundedUtf8Text = (value, maximumBytes) => {
			let bytes = 0;
			let end = 0;
			for (const codePoint of value) {
				const codePointBytes = Buffer.byteLength(codePoint, "utf8");
				if (bytes + codePointBytes > maximumBytes) return {
					text: value.slice(0, end),
					truncated: true
				};
				bytes += codePointBytes;
				end += codePoint.length;
			}
			return {
				text: value,
				truncated: false
			};
		};
	})))();
}

//#endregion
//#region dist/process/DarwinProcessRunTokenReader.js
var responseSchema, identityResponseSchema, sourceFiles, SWIFTC_INTERRUPT, resolveSwiftcCompileTimeoutMs, STDERR_EXCERPT_LIMIT, DarwinProcessOwnershipInspectionError, MAX_COMPILER_OUTPUT_BYTES, compilerFailureFacts, compilerOutcomeDescription, compilerInspectionError, abortReason, isExpectedAbort$1, waitForCompilation, createDarwinProcessRunTokenReader;
function init_DarwinProcessRunTokenReader() {
	return (init_DarwinProcessRunTokenReader = __esmMin((() => {
		init_providerStartupTimeout();
		init_result();
		init_providerCleanupError();
		init_analysisErrorCleanup();
		init_safeJson();
		init_boundedUtf8Text();
		init_ExecFileOutput();
		responseSchema = z.strictObject({ results: z.array(z.discriminatedUnion("state", [z.strictObject({
			pid: z.number().int().positive(),
			state: z.literal("readable"),
			run_id: z.string().optional(),
			reason: z.null().optional()
		}), z.strictObject({
			pid: z.number().int().positive(),
			state: z.literal("unavailable"),
			run_id: z.union([z.string(), z.null()]).optional(),
			reason: z.string().min(1)
		})])) });
		identityResponseSchema = z.strictObject({ results: z.array(z.discriminatedUnion("state", [z.strictObject({
			pid: z.number().int().positive(),
			state: z.literal("readable"),
			identity: z.string().min(1),
			reason: z.null().optional()
		}), z.strictObject({
			pid: z.number().int().positive(),
			state: z.literal("unavailable"),
			identity: z.null().optional(),
			reason: z.string().min(1)
		})])) });
		sourceFiles = [fileURLToPath(new URL("../../bridge/process/ProcessRunTokenReader.swift", new URL("../process/DarwinProcessRunTokenReader.js", import.meta.url).href)), fileURLToPath(new URL("../../bridge/process/ProcessRunTokenReaderMain.swift", new URL("../process/DarwinProcessRunTokenReader.js", import.meta.url).href))];
		SWIFTC_INTERRUPT = "SIGINT";
		resolveSwiftcCompileTimeoutMs = (options = {}) => {
			if (options.compileTimeoutMs !== undefined) return options.compileTimeoutMs;
			const raw = (options.environment ?? process.env).REA_SWIFTC_COMPILE_TIMEOUT_MS;
			if (raw === undefined) return DEFAULT_SWIFTC_COMPILE_TIMEOUT_MS;
			const parsed = providerStartupTimeoutSchema.safeParse(raw);
			return parsed.success ? parsed.data : DEFAULT_SWIFTC_COMPILE_TIMEOUT_MS;
		};
		STDERR_EXCERPT_LIMIT = 512;
		DarwinProcessOwnershipInspectionError = class DarwinProcessOwnershipInspectionError extends Error {
			#cleanupOwner;
			get cleanupOwner() {
				return this.#cleanupOwner;
			}
			constructor(message, options) {
				const { compilerOutcome, capturedOutput, cleanupFailure, cleanupOwner, cancellation, ...errorOptions } = options ?? {};
				super(message, errorOptions);
				this.name = "DarwinProcessOwnershipInspectionError";
				this.compilerOutcome = compilerOutcome;
				this.capturedOutput = capturedOutput;
				this.#cleanupOwner = cleanupOwner;
				this.cleanupFailure = cleanupFailure;
				this.cancellation = cancellation;
			}
			compilerOutcome;
			capturedOutput;
			cleanupFailure;
			cancellation;
			/** Preserve the physical preparation failure while following the exact cleanup owner. */
			withCleanupFailure(cleanup, owner) {
				const combined = this.cleanupFailure === undefined || this.cleanupFailure === cleanup ? cleanup : analysisErrorWithCleanupFailure(this.cleanupFailure, cleanup).bindCleanupDependencies([this.cleanupFailure, cleanup]);
				return new DarwinProcessOwnershipInspectionError(this.message, {
					...Object.hasOwn(this, "cause") ? { cause: this.cause } : {},
					...this.compilerOutcome === undefined ? {} : { compilerOutcome: this.compilerOutcome },
					...this.capturedOutput === undefined ? {} : { capturedOutput: this.capturedOutput },
					cleanupFailure: combined,
					cleanupOwner: owner ?? this.cleanupOwner,
					...this.cancellation === undefined ? {} : { cancellation: this.cancellation }
				});
			}
		};
		MAX_COMPILER_OUTPUT_BYTES = 8 * 1024;
		compilerFailureFacts = (cause, timeoutMs) => {
			const failure = execFileOutputFailure(cause);
			if (failure === undefined) return undefined;
			const stderr = boundedUtf8Text(failure.stderr, MAX_COMPILER_OUTPUT_BYTES);
			const stdout = boundedUtf8Text(failure.stdout, MAX_COMPILER_OUTPUT_BYTES);
			const outcome = failure.code === "ETIMEDOUT" ? "timed_out" : typeof failure.code === "number" ? "exited" : failure.signal !== null ? "signaled" : failure.code === "ENOENT" ? "spawn_failed" : "failed";
			return {
				outcome: {
					outcome,
					code: failure.code,
					signal: failure.signal,
					stderr: stderr.text,
					...failure.stderrBytes === undefined ? {} : { stderrBytes: failure.stderrBytes },
					stderrTruncated: stderr.truncated,
					outputTruncated: failure.outputTruncated,
					killed: failure.killed,
					...outcome === "timed_out" ? { timeoutMs } : {}
				},
				capturedOutput: {
					stdout: stdout.text,
					stderr: stderr.text,
					truncated: stdout.truncated || stderr.truncated || failure.outputTruncated,
					...failure.stdoutBytes === undefined ? {} : { stdout_bytes: failure.stdoutBytes },
					...failure.stderrBytes === undefined ? {} : { stderr_bytes: failure.stderrBytes },
					exit_code: typeof failure.code === "number" ? failure.code : null,
					signal: failure.signal
				}
			};
		};
		compilerOutcomeDescription = (outcome, fallbackCode) => {
			if (outcome === undefined) return `compiler result: ${String(fallbackCode)}`;
			if (outcome.outcome === "exited") return `compiler result: exit code ${String(outcome.code)}`;
			if (outcome.outcome === "timed_out") return `compiler result: timed out after ${String(outcome.timeoutMs)} ms`;
			if (outcome.outcome === "signaled") return `compiler result: stopped by signal ${outcome.signal ?? "an unknown signal"}`;
			return `compiler result: ${String(outcome.code)}`;
		};
		compilerInspectionError = (cause, timeoutMs, compiler) => {
			const facts = compilerFailureFacts(cause, timeoutMs);
			const outcome = facts?.outcome;
			const code = outcome?.code ?? "unknown";
			const description = compilerOutcomeDescription(outcome, code);
			const launcher = compiler.kind === "xcrun" ? "xcrun" : "the selected Swift compiler (REA_DARWIN_SWIFTC_PATH)";
			const prefix = code === "ENOENT" ? `macOS process ownership inspection requires the Apple Swift compiler via ${launcher}` : `macOS process ownership helper compilation failed via ${launcher}`;
			const stderr = boundedUtf8Text(outcome?.stderr ?? "", STDERR_EXCERPT_LIMIT);
			const diagnostics = stderr.text.trim();
			const truncated = stderr.truncated || outcome?.stderrTruncated === true || outcome?.outputTruncated === true;
			const suffix = diagnostics ? `: ${diagnostics}${truncated ? "… [diagnostics truncated]" : ""}` : outcome === undefined ? `: ${cause instanceof Error ? cause.message : String(cause)}` : ": no compiler diagnostics were captured";
			return new DarwinProcessOwnershipInspectionError(`${prefix} (${description})${suffix}`, {
				cause,
				...facts === undefined ? {} : {
					compilerOutcome: facts.outcome,
					capturedOutput: facts.capturedOutput
				}
			});
		};
		abortReason = (signal) => {
			if (signal.reason !== undefined) return signal.reason;
			const error = new Error("The operation was aborted");
			error.name = "AbortError";
			return error;
		};
		isExpectedAbort$1 = (cause, signal) => signal.aborted && (cause === signal.reason || cause instanceof Error && cause.name === "AbortError");
		waitForCompilation = async (operation, signal) => {
			if (signal === undefined) return {
				kind: "completed",
				result: await operation.promise
			};
			return new Promise((resolve) => {
				let completed = false;
				const finish = (outcome) => {
					if (completed) return;
					completed = true;
					signal.removeEventListener("abort", onAbort);
					resolve(outcome);
				};
				const onAbort = () => {
					if (operation.primaryFailure !== undefined) return;
					finish({
						kind: "cancelled",
						reason: signal.reason
					});
				};
				signal.addEventListener("abort", onAbort, { once: true });
				void operation.promise.then((result) => finish({
					kind: "completed",
					result
				}));
				if (signal.aborted) onAbort();
			});
		};
		createDarwinProcessRunTokenReader = (options = {}) => {
			const compiler = options.compiler ?? {
				kind: "xcrun",
				executable: "/usr/bin/xcrun"
			};
			const compilerTimeoutMs = resolveSwiftcCompileTimeoutMs(options);
			const moduleCachePath = options.moduleCachePath ?? "";
			let root;
			let executable;
			let compilation;
			let closePromise;
			let closed = false;
			let exitCleanupInstalled = false;
			const cleanupAtExit = () => {
				if (root !== undefined) rmSync(root.path, {
					recursive: true,
					force: true
				});
			};
			const cleanupRoot = (target = root) => {
				if (target === undefined) return Promise.resolve();
				target.cleanupPromise ??= Promise.resolve().then(async () => {
					try {
						await rm(target.path, {
							recursive: true,
							force: true
						});
					} catch (cause) {
						const failure = new ProviderCleanupError("process-ownership", [target.path], { reason: "The Darwin ownership helper root remains owned until removal succeeds." }, {
							cause,
							operation: "prepare_owned_process"
						});
						if (target.cleanupAnchor === undefined) target.cleanupAnchor = failure;
						else failure.bindCleanupDependencies([target.cleanupAnchor]);
						throw failure;
					}
					target.cleanupAnchor?.resolveCleanup();
					target.cleanupAnchor = undefined;
					if (root !== target) return;
					root = undefined;
					executable = undefined;
					if (exitCleanupInstalled) process.removeListener("exit", cleanupAtExit);
					exitCleanupInstalled = false;
				}).catch((cause) => {
					target.cleanupPromise = undefined;
					throw cause;
				});
				return target.cleanupPromise;
			};
			const runCompilation = async (operation) => {
				const signal = operation.controller.signal;
				let operationRoot;
				try {
					if (compiler.kind === "swiftc" && (!isAbsolute(compiler.executable) || !isAbsolute(compiler.sdkRoot))) {
						throw new DarwinProcessOwnershipInspectionError("Direct Darwin helper compilation requires absolute REA_DARWIN_SWIFTC_PATH and SDKROOT paths selecting a compatible installed Swift compiler and macOS SDK.");
					}
					operationRoot = { path: await mkdtemp(join(tmpdir(), "rea-process-token-")) };
					root = operationRoot;
					process.once("exit", cleanupAtExit);
					exitCleanupInstalled = true;
					if (signal.aborted || closed) throw abortReason(signal);
					const output = join(operationRoot.path, "reader");
					const compilerTemporary = join(operationRoot.path, "tmp");
					await mkdir(compilerTemporary);
					const compilerEnvironment = {
						...process.env,
						TMPDIR: compilerTemporary
					};
					const compilerArguments = compiler.kind === "xcrun" ? ["swiftc"] : ["-sdk", compiler.sdkRoot];
					if (compiler.kind === "swiftc") compilerEnvironment.SDKROOT = compiler.sdkRoot;
					if (moduleCachePath === "") {
						delete compilerEnvironment.CLANG_MODULE_CACHE_PATH;
					} else {
						await mkdir(moduleCachePath, { recursive: true });
						compilerArguments.push("-module-cache-path", moduleCachePath);
						compilerEnvironment.CLANG_MODULE_CACHE_PATH = moduleCachePath;
					}
					compilerArguments.push(...sourceFiles, "-o", output);
					try {
						await execFileOutput(compiler.executable, compilerArguments, {
							timeout: compilerTimeoutMs,
							maxBuffer: 1024 * 1024,
							signal,
							stopSignal: SWIFTC_INTERRUPT,
							env: compilerEnvironment
						});
					} catch (cause) {
						if (isExpectedAbort$1(cause, signal)) throw cause;
						throw compilerInspectionError(cause, compilerTimeoutMs, compiler);
					}
					if (signal.aborted || closed) throw abortReason(signal);
					executable = output;
					return output;
				} catch (cause) {
					operation.primaryFailure = { cause };
					if (operationRoot !== undefined) {
						try {
							await cleanupRoot(operationRoot);
						} catch (cleanup) {
							if (!(cleanup instanceof ProviderCleanupError)) throw cleanup;
							const primary = cause instanceof DarwinProcessOwnershipInspectionError ? cause : new DarwinProcessOwnershipInspectionError("Darwin process ownership helper preparation failed", { cause });
							throw primary.withCleanupFailure(cleanup, { close: () => cleanupRoot(operationRoot) });
						}
					}
					throw cause;
				}
			};
			const beginCompilation = () => {
				const controller = new AbortController();
				const operation = {
					controller,
					promise: Promise.resolve().then(() => runCompilation(operation)).then(ok, err).finally(() => {
						operation.settled = true;
						if (compilation === operation) compilation = undefined;
					}),
					waiters: 0,
					aborting: false,
					settled: false
				};
				compilation = operation;
				return operation;
			};
			const compile = async (signal) => {
				if (closed) throw new Error("Darwin process token reader is closed");
				signal?.throwIfAborted();
				while (true) {
					if (closed) throw new Error("Darwin process token reader is closed");
					signal?.throwIfAborted();
					if (executable !== undefined) return executable;
					if (compilation === undefined && root !== undefined) {
						await cleanupRoot();
						continue;
					}
					let operation = compilation;
					if (operation?.aborting === true) {
						const waited = await waitForCompilation(operation, signal);
						if (waited.kind === "cancelled") throw waited.reason;
						if (!waited.result.ok && waited.result.error instanceof DarwinProcessOwnershipInspectionError && waited.result.error.cleanupFailure !== undefined) throw waited.result.error;
						continue;
					}
					operation ??= beginCompilation();
					operation.waiters += 1;
					const waited = await waitForCompilation(operation, signal);
					operation.waiters -= 1;
					if (operation.waiters === 0 && !operation.settled && !operation.aborting) {
						operation.aborting = true;
						operation.controller.abort();
						const finalized = await operation.promise;
						if (waited.kind === "cancelled" && !finalized.ok && finalized.error instanceof DarwinProcessOwnershipInspectionError && finalized.error.cleanupFailure !== undefined) {
							throw new DarwinProcessOwnershipInspectionError("Darwin process ownership helper preparation was cancelled", {
								cause: waited.reason,
								cancellation: { reason: waited.reason },
								cleanupFailure: finalized.error.cleanupFailure,
								cleanupOwner: finalized.error.cleanupOwner
							});
						}
					}
					if (waited.kind === "cancelled") throw waited.reason;
					if (!waited.result.ok) throw waited.result.error;
					return waited.result.value;
				}
			};
			const read = async (processes, signal) => {
				signal?.throwIfAborted();
				if (processes.length === 0) return new Map();
				const binary = await compile(signal);
				const pids = processes.map(({ pid }) => String(pid));
				const { stdout } = await execFileOutput(binary, pids, {
					timeout: 15e3,
					...signal === undefined ? {} : { signal }
				});
				signal?.throwIfAborted();
				const decoded = safeParseJson(stdout);
				if (!decoded.ok) throw new Error(`macOS process token helper returned invalid JSON: ${decoded.error}`, { cause: decoded.cause });
				const parsed = responseSchema.safeParse(decoded.value);
				if (!parsed.success) throw new Error("macOS process token helper returned an invalid response", { cause: parsed.error });
				const requested = new Set(processes.map(({ pid }) => pid));
				const observations = new Map();
				for (const result of parsed.data.results) {
					if (!requested.has(result.pid) || observations.has(result.pid)) throw new Error("macOS process token helper returned an unexpected PID set");
					observations.set(result.pid, result.state === "readable" ? {
						state: "readable",
						runId: result.run_id
					} : {
						state: "unavailable",
						reason: result.reason ?? "process token observation is unavailable"
					});
				}
				if (observations.size !== requested.size) throw new Error("macOS process token helper returned an incomplete PID set");
				return observations;
			};
			const identities = async (processes, signal) => {
				if (processes.length === 0) return new Map();
				const binary = await compile(signal);
				const pids = processes.map(({ pid }) => String(pid));
				const { stdout } = await execFileOutput(binary, ["--identities", ...pids], {
					timeout: 15e3,
					...signal === undefined ? {} : { signal }
				});
				const decoded = safeParseJson(stdout);
				if (!decoded.ok) throw new Error(`macOS process identity helper returned invalid JSON: ${decoded.error}`, { cause: decoded.cause });
				const parsed = identityResponseSchema.safeParse(decoded.value);
				if (!parsed.success) throw new Error("macOS process identity helper returned an invalid response", { cause: parsed.error });
				const requested = new Set(processes.map(({ pid }) => pid));
				const observations = new Map();
				for (const result of parsed.data.results) {
					if (!requested.has(result.pid) || observations.has(result.pid)) throw new Error("macOS process identity helper returned an unexpected PID set");
					observations.set(result.pid, result.state === "readable" ? {
						state: "readable",
						identity: result.identity
					} : {
						state: "unavailable",
						reason: result.reason
					});
				}
				if (observations.size !== requested.size) throw new Error("macOS process identity helper returned an incomplete PID set");
				return observations;
			};
			const close = () => {
				if (closePromise !== undefined) return closePromise;
				closed = true;
				const pendingClose = (async () => {
					const operation = compilation;
					if (operation !== undefined && !operation.settled) {
						operation.aborting = true;
						operation.controller.abort();
						await operation.promise;
					}
					await cleanupRoot();
				})().catch((cause) => {
					if (closePromise === pendingClose) closePromise = undefined;
					throw cause;
				});
				closePromise = pendingClose;
				return closePromise;
			};
			return {
				read,
				identities,
				prepare: compile,
				close
			};
		};
	})))();
}

//#endregion
//#region dist/process/ProcessRunTokenObservations.js
/** Read only ownership tokens, using per-process fallback for missing batch rows. */
async function* readProcessRunTokens(host, processes, signal) {
	signal?.throwIfAborted();
	if (processes.length === 0) return;
	let batch;
	let batchFailure;
	if (host.runTokens !== undefined) {
		try {
			batch = signal === undefined ? await host.runTokens(processes) : await host.runTokens(processes, signal);
		} catch (cause) {
			signal?.throwIfAborted();
			batchFailure = errorMessage$1(cause);
		}
	}
	for (const process of processes) {
		signal?.throwIfAborted();
		let observation = batch?.get(process.pid);
		if (observation === undefined) {
			try {
				const environment = signal === undefined ? await host.environment(process.pid) : await host.environment(process.pid, signal);
				observation = {
					state: "readable",
					runId: environment.REA_PROCESS_RUN_ID
				};
			} catch (cause) {
				signal?.throwIfAborted();
				const reason = errorMessage$1(cause);
				observation = {
					state: "unavailable",
					reason: batchFailure === undefined ? reason : `${reason}; run-token batch failed: ${batchFailure}`
				};
			}
		}
		signal?.throwIfAborted();
		yield {
			process,
			observation
		};
	}
}
var errorMessage$1;
function init_ProcessRunTokenObservations() {
	return (init_ProcessRunTokenObservations = __esmMin((() => {
		errorMessage$1 = (cause) => cause instanceof Error ? cause.message : String(cause);
	})))();
}

//#endregion
//#region dist/process/ProcessOwnershipObservation.js
var observeOwnedProcessGroups, observeOwnedProcessLineage, unavailableLineage, parseProcessEnvironment, parseLinuxProcessStartTime, isExpectedAbort, createSystemProcessOwnershipHost, systemProcessOwnershipHost, observeProcessStartIdentity, observeProcessStartIdentityExit, signalProcessWithStartIdentity, prepareProcessOwnershipInspection, processIsGone, errorMessage;
function init_ProcessOwnershipObservation() {
	return (init_ProcessOwnershipObservation = __esmMin((() => {
		init_analysisErrorCore();
		init_ProcessOwnershipIdentity();
		init_ProcessOwnershipProcessTree();
		init_ExecFileOutput();
		init_DarwinProcessRunTokenReader();
		init_ProcessRunTokenObservations();
		observeOwnedProcessGroups = async (runId, processGroupIds, host = systemProcessOwnershipHost, signal) => {
			signal?.throwIfAborted();
			const groupIds = [...new Set(processGroupIds)];
			if (groupIds.length === 0) return new Map();
			let processes;
			try {
				processes = liveProcesses(await host.listProcesses(signal));
			} catch (cause) {
				signal?.throwIfAborted();
				const failure = {
					state: "unverifiable",
					reason: `process group could not be inspected: ${errorMessage(cause)}`
				};
				return new Map(groupIds.map((groupId) => [groupId, failure]));
			}
			signal?.throwIfAborted();
			const membersByGroup = new Map(groupIds.map((groupId) => [groupId, []]));
			for (const process of processes) membersByGroup.get(process.processGroupId)?.push(process);
			const observations = new Map(groupIds.map((groupId) => [groupId, (membersByGroup.get(groupId)?.length ?? 0) > 0 ? { state: "alive" } : { state: "empty" }]));
			const liveMembers = groupIds.flatMap((groupId) => membersByGroup.get(groupId) ?? []);
			const pendingGroups = new Set(groupIds.filter((groupId) => (membersByGroup.get(groupId)?.length ?? 0) > 0));
			for await (const { process: member, observation } of readProcessRunTokens(host, liveMembers, signal)) {
				if (!pendingGroups.has(member.processGroupId)) continue;
				if (observation.state === "readable") {
					if (observation.runId !== runId) {
						observations.set(member.processGroupId, {
							state: "unverifiable",
							reason: "process ownership did not match"
						});
						pendingGroups.delete(member.processGroupId);
					}
				} else {
					const gone = await processIsGone(host, member.pid);
					signal?.throwIfAborted();
					if (!gone) {
						observations.set(member.processGroupId, {
							state: "unverifiable",
							reason: `process ownership could not be revalidated for PID ${member.pid}: ${observation.reason}`
						});
						pendingGroups.delete(member.processGroupId);
					}
				}
				if (pendingGroups.size === 0) break;
			}
			signal?.throwIfAborted();
			return observations;
		};
		observeOwnedProcessLineage = async (ownership, host = systemProcessOwnershipHost) => {
			let processes;
			try {
				processes = liveProcesses(await host.listProcesses());
			} catch (cause) {
				return unavailableLineage(ownership, `process table could not be inspected: ${errorMessage(cause)}`);
			}
			const launcher = processes.find(({ pid }) => pid === ownership.leaderPid);
			if (launcher === undefined) return unavailableLineage(ownership, "owned launcher is not live");
			const identityFailure = launcherIdentityFailure(launcher, ownership);
			if (identityFailure !== null) return unavailableLineage(ownership, identityFailure);
			const descendants = descendantsOf([launcher.pid], processes);
			const verifiedDescendants = [];
			for await (const { process: member, observation } of readProcessRunTokens(host, [launcher, ...descendants])) {
				if (observation.state === "readable") {
					if (observation.runId !== ownership.runId) return unavailableLineage(ownership, "process lineage contains an unowned or PID-reused process");
					if (member.pid !== launcher.pid) verifiedDescendants.push(member);
				} else {
					if (await processIsGone(host, member.pid)) {
						if (member.pid === launcher.pid) return unavailableLineage(ownership, "owned launcher exited during lineage validation");
						continue;
					}
					return unavailableLineage(ownership, `process ownership could not be revalidated for PID ${member.pid}: ${observation.reason}`);
				}
			}
			return {
				status: "verified",
				observedAt: new Date().toISOString(),
				lineage: {
					runId: ownership.runId,
					launcherPid: launcher.pid,
					launcherParentPid: launcher.parentPid,
					processGroupId: launcher.processGroupId,
					descendants: verifiedDescendants.sort((left, right) => left.pid - right.pid).map(({ pid, parentPid, processGroupId }) => ({
						pid,
						parentPid,
						processGroupId
					}))
				}
			};
		};
		unavailableLineage = (ownership, reason) => ({
			status: "unavailable",
			observedAt: new Date().toISOString(),
			runId: ownership.runId,
			launcherPid: ownership.leaderPid,
			processGroupId: ownership.processGroupId,
			reason
		});
		parseProcessEnvironment = (value) => Object.fromEntries(value.split("\0").filter((entry) => entry.indexOf("=") > 0).map((entry) => {
			const separator = entry.indexOf("=");
			return [entry.slice(0, separator), entry.slice(separator + 1)];
		}));
		parseLinuxProcessStartTime = (value) => {
			const commandEnd = value.lastIndexOf(")");
			if (commandEnd < 0) return undefined;
			const fields = value.slice(commandEnd + 1).trim().split(/\s+/u);
			const startTime = fields[19];
			return startTime !== undefined && /^\d+$/u.test(startTime) ? startTime : undefined;
		};
		isExpectedAbort = (cause, signal) => signal?.aborted === true && (cause === signal.reason || cause instanceof Error && cause.name === "AbortError");
		createSystemProcessOwnershipHost = (platform = process.platform, hostEnvironment = process.env, options = {}) => {
			const darwinModuleCachePath = options.darwinModuleCachePath ?? hostEnvironment.REA_DARWIN_MODULE_CACHE_PATH;
			const swiftcPath = hostEnvironment.REA_DARWIN_SWIFTC_PATH;
			const darwinCompiler = options.darwinCompiler ?? (swiftcPath === undefined || swiftcPath === "" ? undefined : {
				kind: "swiftc",
				executable: swiftcPath,
				sdkRoot: hostEnvironment.SDKROOT ?? ""
			});
			const darwinTokens = platform === "darwin" ? createDarwinProcessRunTokenReader({
				...darwinCompiler === undefined ? {} : { compiler: darwinCompiler },
				...darwinModuleCachePath === undefined ? {} : { moduleCachePath: darwinModuleCachePath },
				...options.compileTimeoutMs === undefined ? { environment: hostEnvironment } : { compileTimeoutMs: options.compileTimeoutMs }
			}) : undefined;
			const listProcesses = async (signal) => {
				if (platform === "win32") return [];
				const { stdout } = await execFileOutput("ps", ["-axo", "pid=,ppid=,pgid=,uid=,stat=,command="], {
					env: hostEnvironment,
					...signal === undefined ? {} : { signal }
				});
				return stdout.split("\n").map((line) => /\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\S+)\s+(.*)/u.exec(line)).filter((match) => match !== null).map((match) => ({
					pid: Number(match[1]),
					parentPid: Number(match[2]),
					processGroupId: Number(match[3]),
					uid: Number(match[4]),
					state: match[5] ?? "",
					command: match[6] ?? ""
				}));
			};
			const processIdentities = async (processes, signal) => {
				if (processes.length === 0) return new Map();
				if (platform === "linux") return new Map(await Promise.all(processes.map(async ({ pid }) => {
					try {
						const stat = await readFile(`/proc/${String(pid)}/stat`, {
							encoding: "utf8",
							...signal === undefined ? {} : { signal }
						});
						const identity = parseLinuxProcessStartTime(stat);
						return [pid, identity === undefined ? {
							state: "unavailable",
							reason: "malformed_proc_stat"
						} : {
							state: "readable",
							identity: `linux-starttime:${identity}`
						}];
					} catch (cause) {
						if (isExpectedAbort(cause, signal)) throw cause;
						return [pid, {
							state: "unavailable",
							reason: errorMessage(cause)
						}];
					}
				})));
				if (darwinTokens === undefined) return new Map();
				try {
					return await darwinTokens.identities(processes, signal);
				} catch (cause) {
					if (isExpectedAbort(cause, signal)) throw cause;
					const reason = errorMessage(cause);
					return new Map(processes.map(({ pid }) => [pid, {
						state: "unavailable",
						reason
					}]));
				}
			};
			const captureBaseline = async (signal) => {
				if (platform !== "linux" && darwinTokens === undefined) return [];
				const processes = liveProcesses(await listProcesses(signal));
				let identities = await processIdentities(processes, signal);
				const unreadable = processes.filter(({ pid }) => identities.get(pid)?.state !== "readable");
				if (unreadable.length > 0) {
					const stillLive = liveProcesses(await listProcesses(signal)).filter(({ pid }) => unreadable.some((entry) => entry.pid === pid));
					const retried = await processIdentities(stillLive, signal);
					identities = new Map([...identities, ...retried]);
					const unresolved = stillLive.filter(({ pid }) => identities.get(pid)?.state !== "readable");
					const liveAfterRetry = liveProcesses(await listProcesses(signal));
					const stillUnresolved = unresolved.filter(({ pid }) => liveAfterRetry.some((entry) => entry.pid === pid));
					if (stillUnresolved.length > 0) throw new Error(`process identity snapshot is unavailable for ${String(stillUnresolved.length)} live processes`);
				}
				return processes.map(({ pid }) => {
					const observation = identities.get(pid);
					return {
						pid,
						identity: observation?.state === "readable" ? observation.identity : null
					};
				});
			};
			return {
				platform,
				prepare: async (signal) => {
					await darwinTokens?.prepare(signal);
					if (platform === "linux") {
						try {
							const processes = await listProcesses(signal);
							if (!processes.some(({ pid }) => pid === process.pid)) throw new Error("ps did not report REA's current process");
						} catch (cause) {
							if (isExpectedAbort(cause, signal)) throw cause;
							const reason = `Linux process ownership inspection requires a procps-compatible ps on REA's PATH before launching a child: ${errorMessage(cause)}`;
							throw new AnalysisCapabilityUnavailableError("process-ownership", "prepare_owned_process", reason, {
								cause,
								userMessage: reason
							});
						}
					}
				},
				listProcesses,
				async environment(pid, signal) {
					signal?.throwIfAborted();
					if (platform === "linux") return parseProcessEnvironment(await readFile(`/proc/${pid}/environ`, {
						encoding: "utf8",
						signal
					}));
					if (platform === "darwin") {
						const process = (await listProcesses(signal)).find((entry) => entry.pid === pid);
						if (process === undefined) throw new Error(`process ${String(pid)} is not live`);
						const observation = (await darwinTokens?.read([process], signal))?.get(pid);
						if (observation === undefined || observation.state === "unavailable") throw new Error(observation?.reason ?? "process run token could not be read");
						return observation.runId === undefined ? {} : { REA_PROCESS_RUN_ID: observation.runId };
					}
					const { stdout } = await execFileOutput("ps", [
						"eww",
						"-p",
						String(pid)
					], {
						env: hostEnvironment,
						...signal === undefined ? {} : { signal }
					});
					const observedEnvironment = {};
					for (const match of stdout.matchAll(/(?:^|\s)([A-Za-z_][A-Za-z0-9_]*)=([^\s]*)/gu)) {
						const name = match[1];
						if (name !== undefined) observedEnvironment[name] = match[2] ?? "";
					}
					return observedEnvironment;
				},
				async runTokens(processes, signal) {
					signal?.throwIfAborted();
					if (platform !== "darwin" || processes.length === 0) return new Map();
					try {
						return await darwinTokens?.read(processes, signal) ?? new Map();
					} catch (cause) {
						if (isExpectedAbort(cause, signal)) throw cause;
						void cause;
						return new Map(processes.map(({ pid }) => [pid, {
							state: "unavailable",
							reason: "reader_failure"
						}]));
					}
				},
				...platform !== "linux" && darwinTokens === undefined ? {} : {
					processIdentities,
					captureBaseline,
					...darwinTokens === undefined ? {} : { close: darwinTokens.close }
				},
				signalGroup(processGroupId, signal) {
					process.kill(-processGroupId, signal);
				}
			};
		};
		systemProcessOwnershipHost = createSystemProcessOwnershipHost();
		observeProcessStartIdentity = async (pid, host = systemProcessOwnershipHost, expectedRunId) => {
			const process = (await host.listProcesses()).find((entry) => entry.pid === pid);
			if (process === undefined || liveProcesses([process]).length === 0) return undefined;
			if (host.processIdentities === undefined) return {
				state: "unavailable",
				reason: "process identity is unsupported"
			};
			const identity = (await host.processIdentities([process])).get(pid) ?? {
				state: "unavailable",
				reason: "process identity was not returned"
			};
			if (expectedRunId === undefined || identity.state !== "readable") return identity;
			let owned = false;
			for await (const { observation } of readProcessRunTokens(host, [process])) {
				if (observation.state === "unavailable") return {
					state: "unavailable",
					reason: `process ownership token could not be read for PID ${String(pid)}: ${observation.reason}`
				};
				if (observation.runId !== expectedRunId) return {
					state: "unavailable",
					reason: `process ownership token did not match the captured run for PID ${String(pid)}`
				};
				owned = true;
			}
			if (!owned) return {
				state: "unavailable",
				reason: `process ownership token was not returned for PID ${String(pid)}`
			};
			const confirmed = await observeProcessStartIdentity(pid, host);
			if (confirmed === undefined || confirmed.state !== "readable") return confirmed;
			return confirmed.identity === identity.identity ? identity : {
				state: "unavailable",
				reason: `process identity changed while validating the captured run token for PID ${String(pid)}`
			};
		};
		observeProcessStartIdentityExit = async (pid, expectedIdentity, host = systemProcessOwnershipHost) => {
			try {
				const observed = await observeProcessStartIdentity(pid, host);
				if (observed === undefined) return "exited";
				if (observed.state !== "readable") return "unverified";
				return observed.identity === expectedIdentity ? "present" : "exited";
			} catch {
				return "unverified";
			}
		};
		signalProcessWithStartIdentity = async (pid, expectedIdentity, signal, options = {}) => {
			const host = options.host ?? systemProcessOwnershipHost;
			try {
				const observed = await observeProcessStartIdentity(pid, host);
				if (observed === undefined) return "gone";
				if (observed.state !== "readable") return "unverified";
				if (observed.identity !== expectedIdentity) return "identity-changed";
				(options.sendSignal ?? process.kill)(pid, signal);
				return "signaled";
			} catch {
				return "unverified";
			}
		};
		prepareProcessOwnershipInspection = async (signal) => {
			await systemProcessOwnershipHost.prepare?.(signal);
		};
		processIsGone = async (host, pid) => {
			try {
				return !liveProcesses(await host.listProcesses()).some((process) => process.pid === pid);
			} catch (cause) {
				void cause;
				return false;
			}
		};
		errorMessage = (cause) => cause instanceof Error ? cause.message : String(cause);
	})))();
}

//#endregion
export { DarwinProcessOwnershipInspectionError, SWIFTC_INTERRUPT, boundedUtf8Text, descendantsOf, errorMessage, init_DarwinProcessRunTokenReader, init_ProcessOwnershipIdentity, init_ProcessOwnershipObservation, init_ProcessOwnershipProcessTree, init_ProcessRunTokenObservations, init_boundedUtf8Text, launcherIdentityFailure, liveProcesses, observeOwnedProcessGroups, observeOwnedProcessLineage, observeProcessStartIdentity, observeProcessStartIdentityExit, parseLinuxProcessStartTime, prepareProcessOwnershipInspection, readProcessRunTokens, selectCapturedProcessGroupIds, signalProcessWithStartIdentity, systemProcessOwnershipHost };