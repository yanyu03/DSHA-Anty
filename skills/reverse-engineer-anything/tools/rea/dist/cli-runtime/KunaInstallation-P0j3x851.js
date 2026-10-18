import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { err, init_binaryTargetTypes, init_result, isMachOFormat, ok } from "./reconstructionObligationLedgerSchemas-Bi6sect1.js";
import { AnalysisAccessDeniedError, AnalysisArtifactChangedError, AnalysisCancelledError, AnalysisError, AnalysisResourceConstraintError, ConfigurationError, init_analysisErrorBase, init_analysisErrorCore, init_configurationErrors, init_jsonValue, jsonValueSchema } from "./errorSchemas-Ixz_q7qt.js";
import { NonRegularFileReadError, RegularFileChangedError, RegularFileCleanupFailure, assertRegularFileActive, init_OwnedRegularFile, init_RegularFile, regularFileCancellation, sameRegularFileState, withOwnedRegularFile } from "./OwnedRegularFile-D1f5nUCx.js";
import { ArtifactReaderFailure, init_ArtifactReader } from "./ArtifactReader-DMwm42bk.js";
import { AnalysisCleanupLease, init_AnalysisCleanupLease } from "./AnalysisCleanupLease-CWfTGYKd.js";
import { ArtifactFileCancelled, ArtifactFileCleanupFailure, artifactFileCancellationCause, artifactFilePrimaryFailure, assertArtifactReadActive, bindArtifactFileCleanup, init_ArtifactFileOperation, mapArtifactFileFailure, withArtifactFileHandle, withArtifactRegularFile } from "./ArtifactFileOperation-Dg4BcoEM.js";
import { ProviderAdapterError, hopperStartupExitCode, init_analysisErrorProjection, init_hopperStartupFailure, init_providerAdapterError, isHopperStartupFailureCode, projectAnalysisError } from "./cliResultOutput-10sd6xGx.js";
import { analysisErrorWithCleanupFailure, init_analysisErrorCleanup } from "./analysisErrorCleanup-COdAmDsb.js";
import { ProviderCleanupError, init_providerCleanupError } from "./providerCleanupError-BhsJyAhk.js";
import { DarwinProcessOwnershipInspectionError, boundedUtf8Text, init_DarwinProcessRunTokenReader, init_boundedUtf8Text } from "./ProcessOwnershipObservation-C006iCtZ.js";
import { execFileOutput, execFileOutputFailure, init_ExecFileOutput } from "./ExecFileOutput-D6KLYTve.js";
import { init_providerStartupTimeout, providerStartupTimeoutSchema } from "./providerStartupTimeout-B2tF2LtZ.js";
import { init_safeJson, safeParseJson } from "./safeJson-DKKACtdy.js";
import { ProviderProcessSupervisor, init_ProviderProcess, spawnOwnedProviderProcess } from "./ProviderProcess-D87A7ctp.js";
import { cleanupOwnedProcessGroup, init_ProcessOwnership } from "./ProcessOwnership-CtrNr6ee.js";
import { OwnedCommandFailure, init_OwnedCommand, init_snapshotEnvironment, prepareOwnedCommand, runOwnedCommand, snapshotEnvironment } from "./snapshotEnvironment-Yvx5qwsl.js";
import { homeDirectoryFromEnvironment, init_homeDirectory } from "./homeDirectory-DC_DeJIg.js";
import { hashStableFile, init_StableFileHash, stableFileHashCause } from "./StableFileHash-Ame_h3lY.js";
import { init_binaryTarget, parseExecutableHeader } from "./BinaryTargetResolver-tuCTjBlQ.js";
import { analysisClientFailureForOperation, init_AnalysisClientFailure, init_OwnedCommandCleanup, retainOwnedCommandCleanup } from "./OwnedCommandCleanup-BN_V6Erc.js";
import { z } from "zod";
import { delimiter, dirname, isAbsolute, join, posix, win32 } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { accessSync, constants, readFileSync, realpathSync, statSync } from "node:fs";
import { access, lstat, open, realpath, stat } from "node:fs/promises";

//#region dist/hopper/LinuxPrivateDisplayDiagnostic.js
var LINUX_PRIVATE_DISPLAY_DIAGNOSTIC_PREFIX, diagnosticContextSchema, failureCodeSchema, diagnosticSchema, parseLinuxPrivateDisplayDiagnostic;
function init_LinuxPrivateDisplayDiagnostic() {
	return (init_LinuxPrivateDisplayDiagnostic = __esmMin((() => {
		init_hopperStartupFailure();
		init_safeJson();
		LINUX_PRIVATE_DISPLAY_DIAGNOSTIC_PREFIX = "REA_X11_DIAGNOSTIC=";
		diagnosticContextSchema = z.object({
			component: z.literal("hopper_private_display"),
			operation: z.enum(["probe", "launch"]),
			reason: z.string().regex(/^[a-z0-9_]+$/u),
			socket_directory: z.literal("/tmp/.X11-unix"),
			socket_directory_mode: z.string().regex(/^[0-7]{4}$/u).nullable(),
			mount_read_only: z.boolean().nullable(),
			effective_socket_directory_mode: z.string().regex(/^[0-7]{4}$/u).nullable(),
			effective_mount_read_only: z.boolean().nullable(),
			wsl: z.boolean(),
			strategy: z.enum([
				"direct",
				"user-mount-namespace",
				"unavailable"
			]),
			fallback_reason: z.string().regex(/^[a-z0-9_]+$/u).nullable(),
			xvfb_stderr_bytes: z.number().int().nonnegative().safe()
		});
		failureCodeSchema = z.string().transform((value, context) => {
			if (isHopperStartupFailureCode(value)) return value;
			context.addIssue({
				code: "custom",
				message: "Unknown startup failure code"
			});
			return z.NEVER;
		});
		diagnosticSchema = z.discriminatedUnion("status", [diagnosticContextSchema.extend({
			status: z.literal("ready"),
			failure_code: z.null()
		}).strict(), diagnosticContextSchema.extend({
			status: z.literal("error"),
			failure_code: failureCodeSchema
		}).strict()]);
		parseLinuxPrivateDisplayDiagnostic = (stderr) => {
			const records = stderr.split("\n").filter((line) => line.startsWith(LINUX_PRIVATE_DISPLAY_DIAGNOSTIC_PREFIX));
			if (records.length === 0) return {
				ok: false,
				reason: "diagnostic_missing"
			};
			if (records.length !== 1) return {
				ok: false,
				reason: "diagnostic_multiple"
			};
			const record = records[0];
			if (record === undefined) return {
				ok: false,
				reason: "diagnostic_missing"
			};
			const decoded = safeParseJson(record.slice(LINUX_PRIVATE_DISPLAY_DIAGNOSTIC_PREFIX.length));
			if (!decoded.ok) return {
				ok: false,
				reason: "diagnostic_malformed"
			};
			const parsed = diagnosticSchema.safeParse(decoded.value);
			if (!parsed.success) return {
				ok: false,
				reason: "diagnostic_malformed"
			};
			return {
				ok: true,
				value: parsed.data
			};
		};
	})))();
}

//#endregion
//#region dist/hopper/LinuxPrivateDisplayProbe.js
var PYTHON_PATH, UNSHARE_PATH, DEFAULT_PROBE_TIMEOUT_MS, isAborted, selectLinuxPrivateDisplayStrategy, runLinuxPrivateDisplayProbe, privateDisplayProbeCommand, evaluatedProbe, exitMatchesDiagnostic, syntheticDiagnostic, unavailable, emptyProcessResult, waitForProbeOutputClose;
function init_LinuxPrivateDisplayProbe() {
	return (init_LinuxPrivateDisplayProbe = __esmMin((() => {
		init_hopperStartupFailure();
		init_ProcessOwnership();
		init_ProviderProcess();
		init_LinuxPrivateDisplayDiagnostic();
		PYTHON_PATH = "/usr/bin/python3";
		UNSHARE_PATH = "/usr/bin/unshare";
		DEFAULT_PROBE_TIMEOUT_MS = 5e3;
		isAborted = (signal) => signal?.aborted === true;
		selectLinuxPrivateDisplayStrategy = async (options) => {
			const timeoutMs = options.timeoutMs ?? DEFAULT_PROBE_TIMEOUT_MS;
			const runner = options.runProbe ?? runLinuxPrivateDisplayProbe;
			const direct = await evaluatedProbe("direct", options, timeoutMs, runner);
			if (direct.ok) return direct;
			if (direct.diagnostic.failure_code !== "x11_socket_directory_unusable") return unavailable(direct.diagnostic);
			const isolated = await evaluatedProbe("user-mount-namespace", options, timeoutMs, runner);
			if (!isolated.ok) return unavailable({
				...direct.diagnostic,
				strategy: "unavailable",
				reason: "namespace_unavailable",
				fallback_reason: isolated.diagnostic.reason,
				effective_socket_directory_mode: isolated.diagnostic.effective_socket_directory_mode,
				effective_mount_read_only: isolated.diagnostic.effective_mount_read_only,
				xvfb_stderr_bytes: isolated.diagnostic.xvfb_stderr_bytes
			});
			return {
				ok: true,
				strategy: "user-mount-namespace",
				diagnostic: {
					...isolated.diagnostic,
					socket_directory_mode: direct.diagnostic.socket_directory_mode,
					mount_read_only: direct.diagnostic.mount_read_only,
					fallback_reason: null
				}
			};
		};
		runLinuxPrivateDisplayProbe = async (strategy, options) => {
			if (isAborted(options.signal)) return emptyProcessResult("cancelled");
			const command = privateDisplayProbeCommand(options.helperPath, strategy);
			let started;
			try {
				started = await spawnOwnedProviderProcess({
					command: command.command,
					arguments: command.arguments,
					runId: randomUUID(),
					expectedCommand: null,
					...options.environment === undefined ? {} : { hostEnvironment: options.environment },
					...options.signal === undefined ? {} : { signal: options.signal }
				});
			} catch (cause) {
				void cause;
				return emptyProcessResult(isAborted(options.signal) ? "cancelled" : "launch-failed");
			}
			const launch = {
				process: started.process,
				ownsProcessLifetime: true,
				cleanup: () => cleanupOwnedProcessGroup(started.ownership)
			};
			const supervisor = new ProviderProcessSupervisor(launch);
			const outcome = await waitForProbeOutputClose(supervisor, options.timeoutMs, options.signal);
			let cleanupIncomplete = false;
			if (outcome !== "exit") {
				const stopped = await supervisor.stop();
				cleanupIncomplete = stopped.status === "incomplete";
			} else supervisor.dispose();
			const snapshot = supervisor.snapshot();
			return {
				outcome: outcome === "exit" ? "exited" : outcome === "timeout" ? "timed-out" : "cancelled",
				exitCode: snapshot.exitCode,
				stderr: snapshot.stderr.text,
				stderrBytes: snapshot.stderr.bytes,
				cleanupIncomplete
			};
		};
		privateDisplayProbeCommand = (helperPath, strategy) => strategy === "direct" ? {
			command: PYTHON_PATH,
			arguments: [
				helperPath,
				"--probe",
				"--strategy",
				"direct"
			]
		} : {
			command: UNSHARE_PATH,
			arguments: [
				"--user",
				"--map-root-user",
				"--mount",
				"--propagation",
				"private",
				PYTHON_PATH,
				helperPath,
				"--probe",
				"--strategy",
				"user-mount-namespace",
				"--mount-private-x11"
			]
		};
		evaluatedProbe = async (strategy, options, timeoutMs, runner) => {
			let processResult;
			try {
				processResult = await runner(strategy, {
					helperPath: options.helperPath,
					...options.environment === undefined ? {} : { environment: options.environment },
					timeoutMs,
					...options.signal === undefined ? {} : { signal: options.signal }
				});
			} catch (cause) {
				void cause;
				return {
					ok: false,
					diagnostic: syntheticDiagnostic(strategy, "probe_failed")
				};
			}
			if (processResult.outcome === "cancelled") return {
				ok: false,
				diagnostic: syntheticDiagnostic(strategy, "cancelled")
			};
			if (processResult.outcome === "timed-out") return {
				ok: false,
				diagnostic: syntheticDiagnostic(strategy, "probe_timeout")
			};
			if (processResult.outcome === "launch-failed") return {
				ok: false,
				diagnostic: syntheticDiagnostic(strategy, "probe_failed")
			};
			if (processResult.cleanupIncomplete) return {
				ok: false,
				diagnostic: syntheticDiagnostic(strategy, "cleanup_incomplete")
			};
			const parsed = parseLinuxPrivateDisplayDiagnostic(processResult.stderr);
			if (!parsed.ok) return {
				ok: false,
				diagnostic: syntheticDiagnostic(strategy, parsed.reason)
			};
			const diagnostic = parsed.value;
			if (diagnostic.strategy !== strategy || diagnostic.operation !== "probe" || !exitMatchesDiagnostic(processResult.exitCode, diagnostic)) return {
				ok: false,
				diagnostic: syntheticDiagnostic(strategy, "diagnostic_malformed")
			};
			return diagnostic.status === "ready" ? {
				ok: true,
				strategy,
				diagnostic
			} : {
				ok: false,
				diagnostic
			};
		};
		exitMatchesDiagnostic = (exitCode, diagnostic) => diagnostic.status === "ready" ? exitCode === 0 : hopperStartupExitCode(diagnostic.failure_code) === exitCode;
		syntheticDiagnostic = (strategy, reason, failureCode = "private_display_unavailable") => ({
			component: "hopper_private_display",
			operation: "probe",
			status: "error",
			failure_code: failureCode,
			reason,
			socket_directory: "/tmp/.X11-unix",
			socket_directory_mode: null,
			mount_read_only: null,
			effective_socket_directory_mode: null,
			effective_mount_read_only: null,
			wsl: false,
			strategy,
			fallback_reason: null,
			xvfb_stderr_bytes: 0
		});
		unavailable = (diagnostic) => ({
			ok: false,
			strategy: "unavailable",
			exitCode: hopperStartupExitCode(diagnostic.failure_code) ?? 70,
			diagnostic: {
				...diagnostic,
				strategy: "unavailable"
			}
		});
		emptyProcessResult = (outcome) => ({
			outcome,
			exitCode: undefined,
			stderr: "",
			stderrBytes: 0,
			cleanupIncomplete: false
		});
		waitForProbeOutputClose = async (supervisor, timeoutMs, signal) => {
			if (signal?.aborted === true) return "cancelled";
			let releaseAbort;
			const aborted = new Promise((resolve) => {
				if (signal === undefined) return;
				const listener = () => resolve("cancelled");
				signal.addEventListener("abort", listener, { once: true });
				releaseAbort = () => signal.removeEventListener("abort", listener);
			});
			try {
				return await Promise.race([supervisor.waitForOutputClose(Math.max(1, timeoutMs)).then((closed) => closed ? "exit" : "timeout"), aborted]);
			} finally {
				releaseAbort?.();
			}
		};
	})))();
}

//#endregion
//#region dist/filesystem/readStableFileBytes.js
var RegularFileCapacityError, readStableFileBytes, readStableFilePrefix, readExtent, assertStableIdentity;
function init_readStableFileBytes() {
	return (init_readStableFileBytes = __esmMin((() => {
		init_RegularFile();
		RegularFileCapacityError = class extends Error {
			path;
			maximumBytes;
			observedBytes;
			_tag = "RegularFileCapacityError";
			constructor(path, maximumBytes, observedBytes) {
				super(`Selected file must be at most ${maximumBytes} bytes: ${path}`);
				this.path = path;
				this.maximumBytes = maximumBytes;
				this.observedBytes = observedBytes;
				this.name = this._tag;
			}
		};
		readStableFileBytes = async (file, path, maximumBytes, options) => {
			if (!Number.isSafeInteger(maximumBytes) || maximumBytes < 0) throw new RangeError("Maximum file bytes must be a nonnegative safe integer");
			assertRegularFileActive(options.signal);
			const before = await file.stat({ bigint: true });
			if (before.size > BigInt(maximumBytes)) throw new RegularFileCapacityError(path, maximumBytes, before.size);
			const bytes = await readExtent(file, path, Number(before.size), options.signal);
			assertRegularFileActive(options.signal);
			const extra = Buffer.alloc(1);
			if ((await file.read(extra, 0, 1, bytes.length)).bytesRead !== 0) throw new RegularFileChangedError(path);
			await assertStableIdentity(file, path, before, options);
			return bytes;
		};
		readStableFilePrefix = async (file, path, maximumBytes, options) => {
			if (!Number.isSafeInteger(maximumBytes) || maximumBytes < 0) throw new RangeError("Maximum prefix bytes must be a nonnegative safe integer");
			assertRegularFileActive(options.signal);
			const before = await file.stat({ bigint: true });
			const length = Number(before.size < BigInt(maximumBytes) ? before.size : BigInt(maximumBytes));
			const bytes = await readExtent(file, path, length, options.signal);
			await assertStableIdentity(file, path, before, options);
			return {
				bytes,
				size: before.size
			};
		};
		readExtent = async (file, path, length, signal) => {
			assertRegularFileActive(signal);
			const bytes = Buffer.alloc(length);
			let offset = 0;
			while (offset < bytes.length) {
				assertRegularFileActive(signal);
				const read = await file.read({
					buffer: bytes,
					offset,
					length: bytes.length - offset,
					position: offset
				});
				if (read.bytesRead === 0) throw new RegularFileChangedError(path);
				offset += read.bytesRead;
			}
			assertRegularFileActive(signal);
			return bytes;
		};
		assertStableIdentity = async (file, path, before, options) => {
			assertRegularFileActive(options.signal);
			const named = async () => {
				try {
					return await (options.symlinks === "follow" ? stat : lstat)(path, { bigint: true });
				} catch (cause) {
					if (cause instanceof Error && "code" in cause && (cause.code === "ENOENT" || cause.code === "ENOTDIR" || cause.code === "ELOOP")) throw new RegularFileChangedError(path, { cause });
					throw cause;
				}
			};
			if (!sameRegularFileState(before, await file.stat({ bigint: true })) || !sameRegularFileState(before, await named())) throw new RegularFileChangedError(path);
			assertRegularFileActive(options.signal);
		};
	})))();
}

//#endregion
//#region dist/ghidra/GhidraFileArtifacts.js
var readGhidraProfileArtifact, writeGhidraProfileArtifact, ghidraFileFailure;
function init_GhidraFileArtifacts() {
	return (init_GhidraFileArtifacts = __esmMin((() => {
		init_ArtifactReader();
		init_ArtifactFileOperation();
		init_readStableFileBytes();
		init_analysisErrorBase();
		init_analysisErrorCore();
		init_RegularFile();
		init_providerAdapterError();
		init_providerCleanupError();
		init_analysisErrorCleanup();
		readGhidraProfileArtifact = (path, maximumBytes, resources, signal, interpret) => withArtifactRegularFile(path, resources, signal, async (file) => {
			const bytes = await readStableFileBytes(file, path, maximumBytes, {
				symlinks: "reject",
				...signal === undefined ? {} : { signal }
			});
			return interpret(bytes);
		});
		writeGhidraProfileArtifact = async (path, bytes, resources, signal) => {
			assertArtifactReadActive(signal);
			const file = await open(path, "wx", 384);
			await withArtifactFileHandle(path, file, resources, signal, (handle) => handle.writeFile(bytes));
		};
		ghidraFileFailure = (cause, operation, diagnostics = {}) => {
			cause = mapArtifactFileFailure(cause, (primary) => {
				if (primary instanceof RegularFileCapacityError) return new AnalysisResourceConstraintError(operation, "file-size", primary.message, {
					maximum_bytes: primary.maximumBytes,
					observed_bytes: primary.observedBytes.toString()
				}, {
					cause: primary,
					diagnostics,
					retryable: false
				});
				if (primary instanceof RegularFileChangedError) return new AnalysisArtifactChangedError(operation, primary.path, primary.message, {
					cause: primary,
					diagnostics
				});
				if (primary instanceof Error && "code" in primary && (primary.code === "EACCES" || primary.code === "EPERM")) {
					const path = "path" in primary && typeof primary.path === "string" ? primary.path : diagnostics.path;
					if (typeof path === "string") return new AnalysisAccessDeniedError(operation, path, primary.code, {
						cause: primary,
						diagnostics
					});
				}
				return primary;
			});
			if (cause instanceof AnalysisError) return cause;
			const primary = artifactFilePrimaryFailure(cause);
			const reason = primary instanceof Error ? primary.message : String(primary);
			const cleanup = cause instanceof ArtifactReaderFailure ? cause.cleanup : undefined;
			if (primary instanceof AnalysisError) {
				if (cleanup === undefined) return primary;
				const failure = new ProviderCleanupError("ghidra", cleanup.resources, { reason: cleanup.reason }, { cause });
				bindArtifactFileCleanup(cause, failure);
				return analysisErrorWithCleanupFailure(primary, failure, operation).bindCleanupDependencies([...primary.cleanupIncomplete ? [primary] : [], failure]);
			}
			const error = cause instanceof ArtifactReaderFailure && cause.reason === "cancelled" ? new AnalysisCancelledError(operation, {
				cause: artifactFileCancellationCause(cause),
				cleanup,
				diagnostics
			}) : new ProviderAdapterError("ghidra", operation, {
				cause,
				cleanup,
				diagnostics: {
					...diagnostics,
					...primary instanceof Error && "code" in primary && typeof primary.code === "string" ? { system_code: primary.code } : {},
					...primary instanceof Error && "syscall" in primary && typeof primary.syscall === "string" ? { syscall: primary.syscall } : {},
					reason
				},
				userMessage: reason
			});
			bindArtifactFileCleanup(cause, error);
			return error;
		};
	})))();
}

//#endregion
//#region dist/ghidra/GhidraJavaProbe.js
var JAVA_PROBE_MAX_OUTPUT_BYTES, JAVA_DIAGNOSTIC_STREAM_BYTES, capturedProbeOutput, executablePath$1, probeGhidraJava, observeGhidraJava, systemCode, probeFailureError, parseGhidraJavaOutput, javaProperty, javaMajor;
function init_GhidraJavaProbe() {
	return (init_GhidraJavaProbe = __esmMin((() => {
		init_OwnedCommandCleanup();
		init_AnalysisClientFailure();
		init_analysisErrorBase();
		init_analysisErrorCore();
		init_providerAdapterError();
		init_analysisErrorCleanup();
		init_jsonValue();
		init_DarwinProcessRunTokenReader();
		init_OwnedCommand();
		init_boundedUtf8Text();
		init_result();
		JAVA_PROBE_MAX_OUTPUT_BYTES = 1024 * 1024;
		JAVA_DIAGNOSTIC_STREAM_BYTES = 8192;
		capturedProbeOutput = (observed) => {
			const stdout = boundedUtf8Text(observed.stdout.text, JAVA_DIAGNOSTIC_STREAM_BYTES);
			const stderr = boundedUtf8Text(observed.stderr.text, JAVA_DIAGNOSTIC_STREAM_BYTES);
			return {
				stdout: stdout.text,
				stderr: stderr.text,
				truncated: stdout.truncated || stderr.truncated || observed.diagnosticTruncated === true || observed.outputIncomplete === true,
				stdout_bytes: observed.stdout.observedBytes,
				stderr_bytes: observed.stderr.observedBytes,
				exit_code: observed.exitCode ?? null,
				signal: observed.signal ?? null
			};
		};
		executablePath$1 = (path) => {
			try {
				accessSync(path, constants.X_OK);
				return statSync(path).isFile();
			} catch {
				return false;
			}
		};
		probeGhidraJava = async (command, environment, options) => {
			try {
				return await options.resourceOwner.run(() => observeGhidraJava(command, environment, options));
			} catch (cause) {
				return err(analysisClientFailureForOperation(cause, "ghidra", "ghidra:java"));
			}
		};
		observeGhidraJava = async (command, environment, options) => {
			let interpreted;
			try {
				await prepareOwnedCommand(options.signal);
				await runOwnedCommand({
					command,
					arguments: [
						"-Dstdout.encoding=UTF-8",
						"-Dstderr.encoding=UTF-8",
						"-Dsun.stdout.encoding=UTF-8",
						"-Dsun.stderr.encoding=UTF-8",
						"-XX:-UsePerfData",
						"-XshowSettings:properties",
						"-version"
					],
					runId: randomUUID(),
					expectedCommand: null,
					hostEnvironment: environment,
					sweepTokenOwnedProcesses: true
				}, {
					timeoutMs: options.timeoutMs ?? 5e3,
					diagnosticBytes: JAVA_PROBE_MAX_OUTPUT_BYTES,
					acceptNonZeroExit: true,
					observeCompleted: (snapshot) => {
						interpreted = parseGhidraJavaOutput(command, snapshot);
					}
				}, {
					signal: options.signal,
					...options.launcher === undefined ? {} : { launcher: options.launcher }
				});
				if (interpreted === undefined) throw new Error("Java command completed without an output observation");
				return interpreted;
			} catch (cause) {
				const commandFailure = cause instanceof OwnedCommandFailure ? cause : undefined;
				const preparation = commandFailure?.preparationFailure ?? (cause instanceof DarwinProcessOwnershipInspectionError ? cause : undefined);
				const output = commandFailure?.snapshot === undefined || commandFailure.snapshot === null ? preparation?.capturedOutput : capturedProbeOutput(commandFailure.snapshot);
				if (interpreted !== undefined && !interpreted.ok && commandFailure?.cancellation !== undefined) Object.defineProperty(interpreted.error, "cancellation", { value: commandFailure.cancellation });
				const cleanups = retainOwnedCommandCleanup(cause, options.resourceOwner, "ghidra", "ghidra:java");
				let primary;
				if (interpreted !== undefined && !interpreted.ok) {
					if (cleanups.length === 0) return interpreted;
					primary = probeFailureError(interpreted.error, cause);
				} else if (commandFailure?.reason === "cancelled" && commandFailure.cancellation !== undefined) {
					primary = new AnalysisCancelledError("ghidra:java", {
						cause: commandFailure.cancellation.reason,
						...output === undefined ? {} : { capturedOutput: output },
						...interpreted?.ok === true ? { diagnostics: { java_observation: jsonValueSchema.parse(interpreted.value) } } : {}
					});
				} else if (interpreted?.ok === true && commandFailure?.cleanupOwner !== undefined) {
					primary = new ProviderAdapterError("ghidra", "ghidra:java", {
						cause,
						...output === undefined ? {} : { capturedOutput: output },
						diagnostics: {
							java_observation: jsonValueSchema.parse(interpreted.value),
							stage: "cleanup",
							...commandFailure.cancellation === undefined ? {} : { cancellation_observed: true }
						}
					});
				} else if (preparation !== undefined) {
					primary = new ProviderAdapterError("ghidra", "ghidra:java", {
						cause,
						...output === undefined ? {} : { capturedOutput: output },
						diagnostics: {
							stage: "ownership_preparation",
							...preparation.compilerOutcome === undefined ? {} : { compiler_outcome: jsonValueSchema.parse(preparation.compilerOutcome) }
						}
					});
				} else if (cause instanceof AnalysisError) {
					primary = cause;
				}
				if (primary === undefined) {
					const code = commandFailure?.reason === "timeout" ? "ETIMEDOUT" : commandFailure?.reason === "output-limit" ? "ENOBUFS" : systemCode(commandFailure?.processError ?? cause);
					const failed = {
						_tag: "GhidraJavaProbeFailure",
						code: code === "ENOENT" ? "runtime_missing" : "runtime_unavailable",
						detail: `${command}: ${cause instanceof Error ? cause.message : String(cause)}`,
						...code === undefined ? {} : { processErrorCode: code },
						...output === undefined ? {} : { output }
					};
					if (commandFailure?.cancellation !== undefined) Object.defineProperty(failed, "cancellation", { value: commandFailure.cancellation });
					if (cleanups.length === 0) return err(failed);
					primary = probeFailureError(failed, cause);
				}
				for (const cleanup of cleanups) primary = analysisErrorWithCleanupFailure(primary, cleanup, "ghidra:java").bindCleanupDependencies([primary, cleanup]);
				return err(primary);
			}
		};
		systemCode = (cause) => cause instanceof Error && "code" in cause && typeof cause.code === "string" ? cause.code : undefined;
		probeFailureError = (failure, cause) => {
			const { output, ...facts } = failure;
			return new ProviderAdapterError("ghidra", "ghidra:java", {
				cause,
				...output === undefined ? {} : { capturedOutput: output },
				diagnostics: {
					java_probe_failure: jsonValueSchema.parse(facts),
					...failure.cancellation === undefined ? {} : { cancellation_observed: true }
				}
			});
		};
		parseGhidraJavaOutput = (command, observed) => {
			if (observed.exitCode !== 0 || observed.signal !== null) return err({
				_tag: "GhidraJavaProbeFailure",
				code: "runtime_unavailable",
				detail: `${command}: Java exited ${String(observed.exitCode)}${observed.signal == null ? "" : ` (${observed.signal})`}`,
				output: capturedProbeOutput(observed)
			});
			const output = `${observed.stdout.text}\n${observed.stderr.text}`;
			const version = javaProperty(output, "java.version") || null;
			const home = javaProperty(output, "java.home") || null;
			const vmName = javaProperty(output, "java.vm.name");
			const osArch = javaProperty(output, "os.arch");
			const osName = javaProperty(output, "os.name");
			const reportedBits = javaProperty(output, "sun.arch.data.model");
			const parsedBits = reportedBits !== null && /^\d+$/.test(reportedBits) ? Number(reportedBits) : null;
			const bits = parsedBits !== null && Number.isSafeInteger(parsedBits) ? parsedBits : null;
			const major = version === null ? undefined : javaMajor(version);
			if (version === null || home === null || major === undefined) return err({
				_tag: "GhidraJavaProbeFailure",
				code: "version_unresolved",
				detail: `${command}: successful Java probe did not establish a valid java.version and nonempty java.home`,
				output: capturedProbeOutput(observed),
				properties: {
					version,
					home,
					vmName,
					osArch,
					osName,
					bits
				}
			});
			return ok({
				version,
				major,
				home,
				...vmName === null ? {} : { vmName },
				...osArch === null ? {} : { osArch },
				...osName === null ? {} : { osName },
				bits,
				...reportedBits === null || bits !== null ? {} : { unparsedBits: reportedBits },
				runtime: executablePath$1((process.platform === "win32" ? win32 : posix).join(home, "bin", process.platform === "win32" ? "javac.exe" : "javac")) ? "jdk" : "jre"
			});
		};
		javaProperty = (output, name) => new RegExp(`^[ \\t]*${name.replaceAll(".", "\\.")}[ \\t]*=[ \\t]*([^\\r\\n]*?)[ \\t]*\\r?$`, "mu").exec(output)?.[1] ?? null;
		javaMajor = (version) => {
			const legacy = /^1\.([1-8])(?:\.[0-9]+)*(?:_[0-9]+)?(?:-[-a-zA-Z0-9.]+)?$/u.exec(version);
			if (legacy?.[1] !== undefined) return Number(legacy[1]);
			const modern = /^(?<number>[1-9][0-9]*(?:(?:\.0)*\.[1-9][0-9]*)*)(?:(?:-[a-zA-Z0-9]+)?\+(?<build>0|[1-9][0-9]*)(?:-[-a-zA-Z0-9.]+)?|-[a-zA-Z0-9]+(?:-[-a-zA-Z0-9.]+)?|\+-[-a-zA-Z0-9.]+)?$/u.exec(version);
			const number = modern?.groups?.number;
			if (number === undefined) return undefined;
			const parts = number.split(".").map(Number);
			const build = modern?.groups?.build;
			if ([...parts, ...build === undefined ? [] : [Number(build)]].some((value) => !Number.isSafeInteger(value) || value > 2147483647)) return undefined;
			return parts[0];
		};
	})))();
}

//#endregion
//#region dist/ghidra/GhidraExecutableHeader.js
var GHIDRA_EXECUTABLE_HEADER_BYTES, readGhidraExecutableHeader;
function init_GhidraExecutableHeader() {
	return (init_GhidraExecutableHeader = __esmMin((() => {
		init_result();
		init_analysisErrorCore();
		init_ArtifactFileOperation();
		init_readStableFileBytes();
		init_GhidraFileArtifacts();
		GHIDRA_EXECUTABLE_HEADER_BYTES = 4096;
		readGhidraExecutableHeader = async (path, options) => {
			let completedHeader;
			try {
				return ok(await options.resourceOwner.run(() => withArtifactRegularFile(path, { retain: (resource) => options.resourceOwner.retain({ close: () => resource.lease.release() }, resource.resource) }, options.signal, async (file) => {
					const observed = await readStableFilePrefix(file, path, GHIDRA_EXECUTABLE_HEADER_BYTES, {
						symlinks: "follow",
						...options.signal === undefined ? {} : { signal: options.signal }
					});
					if (observed.size > BigInt(Number.MAX_SAFE_INTEGER)) throw new AnalysisResourceConstraintError("ghidra:installation", "file-size", "Executable extent cannot be represented exactly by the header parser", {
						maximum_bytes: Number.MAX_SAFE_INTEGER,
						observed_bytes: observed.size.toString()
					}, {
						diagnostics: {
							path,
							stage: "native_decompiler_header"
						},
						retryable: false
					});
					completedHeader = {
						bytes: observed.bytes,
						size: Number(observed.size)
					};
					return completedHeader;
				}, "follow")));
			} catch (cause) {
				return err(ghidraFileFailure(cause, "ghidra:installation", {
					path,
					stage: "native_decompiler_header",
					...completedHeader === undefined ? {} : { completed_header: {
						file_bytes: completedHeader.size,
						examined_bytes: completedHeader.bytes.length,
						prefix_sha256: createHash("sha256").update(completedHeader.bytes).digest("hex")
					} }
				}));
			}
		};
	})))();
}

//#endregion
//#region dist/ghidra/GhidraJavaProperties.js
/** Join odd-backslash continuations while stripping leading continuation space. */
function* logicalPropertyLines(content) {
	let physicalStart = 0;
	let logical = "";
	let continuing = false;
	while (physicalStart <= content.length) {
		let physicalEnd = physicalStart;
		while (physicalEnd < content.length && content[physicalEnd] !== "\n" && content[physicalEnd] !== "\r") physicalEnd += 1;
		let line = content.slice(physicalStart, physicalEnd);
		let leading = 0;
		while (isPropertyWhitespace(line[leading])) leading += 1;
		const comment = !continuing && (line[leading] === "#" || line[leading] === "!");
		if (continuing) line = line.slice(leading);
		let continued = false;
		if (!comment) {
			let slashes = 0;
			for (let index = line.length - 1; index >= 0 && line[index] === "\\"; index -= 1) slashes += 1;
			continued = slashes % 2 === 1;
			logical += continued ? line.slice(0, -1) : line;
		}
		if (!continued) {
			yield logical;
			logical = "";
		}
		continuing = continued;
		if (physicalEnd === content.length) break;
		physicalStart = content[physicalEnd] === "\r" && content[physicalEnd + 1] === "\n" ? physicalEnd + 2 : physicalEnd + 1;
	}
	if (continuing) yield logical;
}
var parseGhidraJavaProperties, isPropertyWhitespace, decodePropertyEscapes;
function init_GhidraJavaProperties() {
	return (init_GhidraJavaProperties = __esmMin((() => {
		parseGhidraJavaProperties = (content) => {
			const values = new Map();
			for (const line of logicalPropertyLines(content)) {
				let start = 0;
				while (isPropertyWhitespace(line[start])) start += 1;
				if (start === line.length || line[start] === "#" || line[start] === "!") continue;
				let end = start;
				let escaped = false;
				while (end < line.length) {
					const character = line[end];
					if (!escaped && (character === "=" || character === ":" || isPropertyWhitespace(character))) break;
					if (character === "\\") escaped = !escaped;
					else escaped = false;
					end += 1;
				}
				let valueStart = end;
				while (isPropertyWhitespace(line[valueStart])) valueStart += 1;
				if (line[valueStart] === "=" || line[valueStart] === ":") valueStart += 1;
				while (isPropertyWhitespace(line[valueStart])) valueStart += 1;
				const key = decodePropertyEscapes(line.slice(start, end));
				if (!key.ok) return key;
				const value = decodePropertyEscapes(line.slice(valueStart));
				if (!value.ok) return value;
				values.set(key.value, value.value);
			}
			return {
				ok: true,
				value: values
			};
		};
		isPropertyWhitespace = (value) => value === " " || value === "	" || value === "\f";
		decodePropertyEscapes = (value) => {
			let result = "";
			for (let index = 0; index < value.length; index += 1) {
				const character = value[index];
				if (character !== "\\") {
					result += character;
					continue;
				}
				const escaped = value[++index];
				if (escaped === undefined) return {
					ok: false,
					error: "Trailing escape in Java properties value"
				};
				if (escaped === "t") result += "	";
				else if (escaped === "n") result += "\n";
				else if (escaped === "r") result += "\r";
				else if (escaped === "f") result += "\f";
				else if (escaped === "u") {
					const digits = value.slice(index + 1, index + 5);
					if (digits.length !== 4 || !/^[0-9a-f]{4}$/iu.test(digits)) return {
						ok: false,
						error: "Malformed Unicode escape in Java properties file"
					};
					result += String.fromCharCode(Number.parseInt(digits, 16));
					index += 4;
				} else result += escaped;
			}
			return {
				ok: true,
				value: result
			};
		};
	})))();
}

//#endregion
//#region dist/ghidra/GhidraReleasePolicy.js
var SUPPORTED_GHIDRA_VERSION, SUPPORTED_GHIDRA_JAVA_MAJOR, GHIDRA_RELEASE_PATTERN, ghidraReleaseCompatibility, unverifiedGhidraBuildLimitation, ghidraReleaseLine, ghidraVersionDetail, ghidraReleaseAccepted, verifiedGhidraRelease, parseGhidraRelease, ghidraConfigurationVersion, integerGroup;
function init_GhidraReleasePolicy() {
	return (init_GhidraReleasePolicy = __esmMin((() => {
		SUPPORTED_GHIDRA_VERSION = "12.1.4";
		SUPPORTED_GHIDRA_JAVA_MAJOR = 21;
		GHIDRA_RELEASE_PATTERN = /^(\d+)\.(\d+)(?:\.(\d+))?([-+].*)?$/u;
		ghidraReleaseCompatibility = (raw) => {
			if (raw === null || raw === undefined) return {
				status: "unresolved",
				raw: null
			};
			const version = parseGhidraRelease(raw);
			if (version === undefined) return {
				status: "unresolved",
				raw
			};
			if (raw === "12.1.4") return {
				status: "verified",
				version,
				raw
			};
			const verified = verifiedGhidraRelease();
			return version.major === verified.major && version.minor === verified.minor ? {
				status: "compatible",
				version,
				raw
			} : {
				status: "unsupported",
				version,
				raw
			};
		};
		unverifiedGhidraBuildLimitation = (providerVersion) => {
			const compatibility = ghidraReleaseCompatibility(providerVersion);
			if (compatibility.status !== "compatible") return undefined;
			return `This session uses Ghidra ${providerVersion}. The bridge is verified against ${SUPPORTED_GHIDRA_VERSION}; other ${ghidraReleaseLine()} builds are accepted and the observed version is reported.`;
		};
		ghidraReleaseLine = () => {
			const verified = verifiedGhidraRelease();
			return `${String(verified.major)}.${String(verified.minor)}.x`;
		};
		ghidraVersionDetail = (raw) => {
			const compatibility = ghidraReleaseCompatibility(raw);
			switch (compatibility.status) {
				case "unresolved": return compatibility.raw ?? "unknown";
				case "verified": return compatibility.raw;
				case "compatible": return `${compatibility.raw}; compatible ${ghidraReleaseLine()} release (verified build ${SUPPORTED_GHIDRA_VERSION})`;
				case "unsupported": return `${compatibility.raw}; accepted releases are ${ghidraReleaseLine()} (verified build ${SUPPORTED_GHIDRA_VERSION})`;
				default: {
					const unreachable = compatibility;
					return unreachable;
				}
			}
		};
		ghidraReleaseAccepted = (raw) => {
			const status = ghidraReleaseCompatibility(raw).status;
			return status === "verified" || status === "compatible";
		};
		verifiedGhidraRelease = () => {
			const version = parseGhidraRelease(SUPPORTED_GHIDRA_VERSION);
			if (version === undefined) throw new TypeError(`SUPPORTED_GHIDRA_VERSION ${SUPPORTED_GHIDRA_VERSION} is not a Ghidra release`);
			return version;
		};
		parseGhidraRelease = (raw) => {
			const match = GHIDRA_RELEASE_PATTERN.exec(raw);
			const major = integerGroup(match?.[1]);
			const minor = integerGroup(match?.[2]);
			if (match === null || major === undefined || minor === undefined) return undefined;
			const patch = match[3] === undefined ? 0 : integerGroup(match[3]);
			return patch === undefined ? undefined : {
				major,
				minor,
				patch,
				suffix: match[4] ?? ""
			};
		};
		ghidraConfigurationVersion = (raw) => {
			const version = parseGhidraRelease(raw);
			if (version === undefined || version.suffix.startsWith("+")) return undefined;
			const patch = version.patch === 0 ? "" : `.${String(version.patch)}`;
			const suffix = version.suffix === "-" ? "" : version.suffix;
			return `${String(version.major)}.${String(version.minor)}${patch}${suffix}`;
		};
		integerGroup = (value) => {
			if (value === undefined) return undefined;
			const parsed = Number(value);
			return Number.isSafeInteger(parsed) ? parsed : undefined;
		};
	})))();
}

//#endregion
//#region dist/ghidra/GhidraInstallationPolicy.js
var ghidraApplicationProperties, ghidraJavaRequirement, ghidraJavaRangeLabel, ghidraJavaMajorAccepted, parseJavaBound, parseJavaMaximum, parseJavaInteger, javaDecimalDigit, unresolvedJavaRequirement;
function init_GhidraInstallationPolicy() {
	return (init_GhidraInstallationPolicy = __esmMin((() => {
		init_GhidraJavaProperties();
		init_GhidraReleasePolicy();
		ghidraApplicationProperties = (content) => {
			const parsed = parseGhidraJavaProperties(content);
			if (!parsed.ok) return {
				providerVersion: null,
				configurationDirectoryName: null,
				javaMinimum: {
					status: "unresolved",
					raw: parsed.error
				},
				javaMaximum: {
					status: "unresolved",
					raw: parsed.error
				},
				parseError: parsed.error
			};
			const providerVersion = parsed.value.get("application.version");
			const releaseName = parsed.value.get("application.release.name")?.replaceAll(/[ \t\n\r\f\v]/gu, "").toUpperCase();
			const configurationVersion = providerVersion === undefined ? undefined : ghidraConfigurationVersion(providerVersion);
			const configurationDirectoryName = providerVersion !== undefined && configurationVersion !== undefined && releaseName !== undefined && /^[A-Za-z0-9][A-Za-z0-9._+-]*$/u.test(providerVersion) && /^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(releaseName) ? `ghidra_${configurationVersion}_${releaseName}` : null;
			const minimum = parsed.value.get("application.java.min");
			const maximum = parsed.value.get("application.java.max");
			return {
				providerVersion: providerVersion ?? null,
				configurationDirectoryName,
				javaMinimum: minimum === undefined ? { status: "absent" } : parseJavaBound(minimum),
				javaMaximum: parseJavaMaximum(maximum),
				parseError: null
			};
		};
		ghidraJavaRequirement = (properties) => {
			if (properties?.parseError !== null && properties?.parseError !== undefined) return unresolvedJavaRequirement(`application.properties parse failed: ${properties.parseError}`);
			if (properties === undefined) return unresolvedJavaRequirement("application.properties is unavailable");
			const minimum = properties.javaMinimum;
			const maximum = properties.javaMaximum;
			if (minimum.status === "unresolved") return unresolvedJavaRequirement(`application.java.min=${minimum.raw}`);
			if (minimum.status === "absent") return unresolvedJavaRequirement("application.java.min is missing");
			if (maximum.status === "unresolved") return unresolvedJavaRequirement(`application.java.max=${maximum.raw}`);
			const minimumMajor = minimum.major;
			const maximumMajor = maximum.status === "major" ? maximum.major : null;
			if (maximumMajor !== null && maximumMajor < minimumMajor) return unresolvedJavaRequirement(`application.java.max=${String(maximumMajor)} is below application.java.min=${String(minimumMajor)}`);
			return {
				minimumMajor,
				maximumMajor,
				unresolved: null
			};
		};
		ghidraJavaRangeLabel = (requirement) => {
			if (requirement.unresolved !== null) return "a 64-bit full JDK matching the installation's declared Java bounds";
			if (requirement.maximumMajor === null) return `a 64-bit full JDK ${String(requirement.minimumMajor)} or newer`;
			if (requirement.maximumMajor === requirement.minimumMajor) return `a 64-bit full JDK ${String(requirement.minimumMajor)}`;
			return `a 64-bit full JDK ${String(requirement.minimumMajor)} through ${String(requirement.maximumMajor)}`;
		};
		ghidraJavaMajorAccepted = (major, requirement) => requirement.unresolved === null && major >= requirement.minimumMajor && (requirement.maximumMajor === null || major <= requirement.maximumMajor);
		parseJavaBound = (raw) => {
			const major = parseJavaInteger(raw);
			return major === undefined ? {
				status: "unresolved",
				raw
			} : {
				status: "major",
				major
			};
		};
		parseJavaMaximum = (raw) => {
			if (raw === undefined || raw === "") return { status: "absent" };
			const bound = parseJavaBound(raw);
			return bound.status === "major" && bound.major === 0 ? { status: "absent" } : bound;
		};
		parseJavaInteger = (raw) => {
			let index = 0;
			let sign = 1;
			if (raw[index] === "+" || raw[index] === "-") {
				if (raw[index] === "-") sign = -1;
				index += 1;
			}
			if (index === raw.length) return undefined;
			const limit = sign < 0 ? 2147483648 : 2147483647;
			let value = 0;
			for (; index < raw.length; index += 1) {
				const character = raw[index];
				if (character === undefined) return undefined;
				const digit = javaDecimalDigit(character);
				if (digit === undefined) return undefined;
				if (value > Math.floor((limit - digit) / 10)) return undefined;
				value = value * 10 + digit;
			}
			return sign * value;
		};
		javaDecimalDigit = (character) => {
			const code = character.charCodeAt(0);
			if (code >= 48 && code <= 57) return code - 48;
			if (!/^\p{Decimal_Number}$/u.test(character)) return undefined;
			let blockStart = code;
			while (blockStart > 0 && /^\p{Decimal_Number}$/u.test(String.fromCharCode(blockStart - 1))) blockStart -= 1;
			return (code - blockStart) % 10;
		};
		unresolvedJavaRequirement = (unresolved) => ({ unresolved });
	})))();
}

//#endregion
//#region dist/ghidra/GhidraInstallationProperties.js
var MAX_GHIDRA_INSTALLATION_PROPERTIES_BYTES, readGhidraInstallationProperties;
function init_GhidraInstallationProperties() {
	return (init_GhidraInstallationProperties = __esmMin((() => {
		init_ArtifactFileOperation();
		init_jsonValue();
		init_RegularFile();
		init_readStableFileBytes();
		init_GhidraInstallationPolicy();
		init_GhidraFileArtifacts();
		MAX_GHIDRA_INSTALLATION_PROPERTIES_BYTES = 1024 * 1024;
		readGhidraInstallationProperties = async (path, options) => {
			try {
				return await options.resourceOwner.run(() => withArtifactRegularFile(path, { retain: (resource) => options.resourceOwner.retain({ close: () => resource.lease.release() }, resource.resource) }, options.signal, async (file) => (await readStableFileBytes(file, path, MAX_GHIDRA_INSTALLATION_PROPERTIES_BYTES, {
					symlinks: "follow",
					...options.signal === undefined ? {} : { signal: options.signal }
				})).toString("latin1"), "follow"));
			} catch (cause) {
				const physical = artifactFilePrimaryFailure(cause);
				if (!(cause instanceof ArtifactFileCleanupFailure) && physical instanceof Error && "code" in physical && "syscall" in physical && physical.syscall === "open" && (physical.code === "ENOENT" || physical.code === "ENOTDIR")) return undefined;
				const completed = cause instanceof ArtifactFileCancelled ? cause.fileCancellation.outcome.value : cause instanceof ArtifactFileCleanupFailure && cause.fileCleanupFailure.outcome.kind === "completed" ? cause.fileCleanupFailure.outcome.value : undefined;
				const diagnostics = {
					path,
					stage: "installation_properties",
					...physical instanceof NonRegularFileReadError ? { system_code: physical.code } : {},
					...typeof completed !== "string" ? {} : { completed_properties: {
						bytes: Buffer.byteLength(completed, "latin1"),
						sha256: createHash("sha256").update(completed, "latin1").digest("hex"),
						properties: jsonValueSchema.parse(ghidraApplicationProperties(completed))
					} }
				};
				throw ghidraFileFailure(cause, "ghidra:installation", diagnostics);
			}
		};
	})))();
}

//#endregion
//#region dist/ghidra/GhidraInstallation.js
var NATIVE_PLATFORMS, NATIVE_TOOL_FORMATS, NATIVE_ARCHITECTURES, assessNativeDecompiler, inspectGhidraInstallation, availableInstallation, installationCoordinates, installationChecks, configurationCheck, ghidraInstallationDiagnostics, ghidraJavaEnvironment, installationCheck, nativeDecompilerCheck, jvmOsNameMatchesPlatform, jvmOsArchNativeDirectory, versionCheck, javaCheck, javaRemediation, systemGhidraInstallationHost, discoverGhidraInstallationOnPath, executablePath;
function init_GhidraInstallation() {
	return (init_GhidraInstallation = __esmMin((() => {
		init_analysisErrorBase();
		init_analysisErrorCore();
		init_GhidraJavaProbe();
		init_result();
		init_analysisErrorProjection();
		init_GhidraExecutableHeader();
		init_snapshotEnvironment();
		init_GhidraInstallationProperties();
		init_binaryTarget();
		init_binaryTargetTypes();
		init_GhidraInstallationPolicy();
		init_GhidraReleasePolicy();
		NATIVE_PLATFORMS = {
			linux: {
				x64: "linux_x86_64",
				arm64: "linux_arm_64"
			},
			darwin: {
				x64: "mac_x86_64",
				arm64: "mac_arm_64"
			},
			win32: { x64: "win_x86_64" }
		};
		NATIVE_TOOL_FORMATS = {
			linux: "elf",
			darwin: "mach-o",
			win32: "pe"
		};
		NATIVE_ARCHITECTURES = [
			{
				node: "x64",
				binary: "x86_64"
			},
			{
				node: "ia32",
				binary: "x86"
			},
			{
				node: "arm",
				binary: "arm"
			},
			{
				node: "arm64",
				binary: "arm64"
			}
		];
		assessNativeDecompiler = (path, platform, architecture, probe) => {
			const expectedFormat = NATIVE_TOOL_FORMATS[platform];
			const expectedArchitecture = NATIVE_ARCHITECTURES.find(({ node }) => node === architecture)?.binary;
			if (expectedFormat === undefined || expectedArchitecture === undefined) return {
				status: "unknown",
				detail: `${path} is executable, but no native tool format is defined for ${platform}/${architecture}`
			};
			let parsed = probe === undefined ? undefined : parseExecutableHeader(probe.bytes, architecture, probe.size);
			if (probe !== undefined && parsed !== undefined && !parsed.ok) {
				for (const { node } of NATIVE_ARCHITECTURES) {
					if (node === architecture) continue;
					const alternative = parseExecutableHeader(probe.bytes, node, probe.size);
					if (alternative.ok && !alternative.value.availableArchitectures.some((available) => available === expectedArchitecture)) {
						parsed = alternative;
						break;
					}
				}
			}
			if (parsed === undefined || !parsed.ok) return {
				status: "unknown",
				detail: `${path} is executable, but its executable format for ${platform}/${architecture} could not be established`
			};
			const observed = `${parsed.value.format} ${parsed.value.architecture}`;
			const expected = `${expectedFormat} ${expectedArchitecture}`;
			const formatMatches = isMachOFormat(expectedFormat) ? isMachOFormat(parsed.value.format) : parsed.value.format === expectedFormat;
			if (formatMatches && parsed.value.architecture === expectedArchitecture) return {
				status: "compatible",
				detail: `${path} reports ${observed}, which matches ${platform}/${architecture}`
			};
			const nativeDirectory = NATIVE_PLATFORMS[platform]?.[architecture];
			const executable = platform === "win32" ? "decompile.exe" : "decompile";
			return {
				status: "incompatible",
				detail: `${path} reports ${observed}, but ${platform}/${architecture} requires ${expected}`,
				remediation: `Provide an executable Ghidra/Features/Decompiler/os/${nativeDirectory ?? "<platform>"}/${executable} built for ${expected}, or its build/os equivalent. REA does not build or install native tools.`
			};
		};
		inspectGhidraInstallation = async (options, host = systemGhidraInstallationHost()) => {
			if (options.signal?.aborted) throw new AnalysisCancelledError("ghidra:installation", { cause: options.signal.reason });
			const platform = options.platform ?? process.platform;
			const architecture = options.architecture ?? process.arch;
			const coordinates = await installationCoordinates(options, platform, architecture, host);
			const checks = installationChecks({
				coordinates,
				platform,
				architecture,
				javaHome: options.javaHome,
				host
			});
			const failed = checks.find((check) => check.status === "failed");
			const javaObservation = coordinates.java ?? coordinates.javaProbeFailure?.properties;
			const observation = {
				platform,
				architecture,
				applicationPropertiesPath: coordinates.applicationPropertiesPath,
				configurationDirectoryName: coordinates.properties?.configurationDirectoryName ?? null,
				nativeDecompilerPath: coordinates.nativeDecompilerPath,
				...coordinates.nativeDecompilerHeader.ok ? {} : { nativeDecompilerHeaderFailure: coordinates.nativeDecompilerHeader.error },
				javaCommand: coordinates.javaCommand,
				...coordinates.javaProbeFailure === undefined ? {} : { javaProbeFailure: coordinates.javaProbeFailure },
				...javaObservation?.vmName == null ? {} : { javaVmName: javaObservation.vmName },
				...javaObservation?.osArch == null ? {} : { javaOsArch: javaObservation.osArch },
				...javaObservation?.osName == null ? {} : { javaOsName: javaObservation.osName },
				checks
			};
			if (failed !== undefined) return {
				status: "unavailable",
				...observation,
				installDir: coordinates.installDir,
				analyzeHeadlessPath: coordinates.analyzeHeadlessPath,
				providerVersion: coordinates.properties?.providerVersion ?? null,
				javaHome: javaObservation?.home ?? options.javaHome ?? null,
				javaVersion: javaObservation?.version ?? null,
				rejection: {
					code: failed.code,
					reason: failed.remediation
				}
			};
			if (options.signal?.aborted) throw new AnalysisCancelledError("ghidra:installation", {
				cause: options.signal.reason,
				diagnostics: ghidraInstallationDiagnostics(availableInstallation(coordinates, observation))
			});
			return availableInstallation(coordinates, observation);
		};
		availableInstallation = (coordinates, observation) => {
			const providerVersion = coordinates.properties?.providerVersion;
			if (coordinates.installDir === null || coordinates.applicationPropertiesPath === null || coordinates.analyzeHeadlessPath === null || providerVersion === null || providerVersion === undefined || coordinates.java === undefined) throw new TypeError("Passing Ghidra installation checks produced incomplete coordinates");
			return {
				status: "available",
				...observation,
				installDir: coordinates.installDir,
				analyzeHeadlessPath: coordinates.analyzeHeadlessPath,
				applicationPropertiesPath: coordinates.applicationPropertiesPath,
				providerVersion,
				javaHome: coordinates.java.home,
				javaVersion: coordinates.java.version
			};
		};
		installationCoordinates = async (options, platform, architecture, host) => {
			const path = platform === "win32" ? win32 : posix;
			const installDir = options.installDir ?? host.discoverInstallDirOnPath?.(options.environment, platform) ?? null;
			const applicationPropertiesPath = installDir === null ? null : path.join(installDir, "Ghidra", "application.properties");
			const analyzeHeadlessPath = installDir === null ? null : path.join(installDir, "support", platform === "win32" ? "analyzeHeadless.bat" : "analyzeHeadless");
			const decompilerPlatform = NATIVE_PLATFORMS[platform]?.[architecture];
			const decompilerExecutable = platform === "win32" ? "decompile.exe" : "decompile";
			const nativeDecompilerPath = installDir === null || decompilerPlatform === undefined ? null : [path.join(installDir, "Ghidra", "Features", "Decompiler", "os", decompilerPlatform, decompilerExecutable), path.join(installDir, "Ghidra", "Features", "Decompiler", "build", "os", decompilerPlatform, decompilerExecutable)].find((candidate) => host.executable(candidate)) ?? null;
			const properties = applicationPropertiesPath === null ? undefined : await host.readText(applicationPropertiesPath, {
				resourceOwner: options.resourceOwner,
				...options.signal === undefined ? {} : { signal: options.signal }
			});
			const nativeDecompilerHeader = nativeDecompilerPath === null || host.executableHeader === undefined ? ok(undefined) : await host.executableHeader(nativeDecompilerPath, {
				resourceOwner: options.resourceOwner,
				...options.signal === undefined ? {} : { signal: options.signal }
			});
			if (!nativeDecompilerHeader.ok && (nativeDecompilerHeader.error instanceof AnalysisCancelledError || nativeDecompilerHeader.error.cleanupIncomplete)) throw nativeDecompilerHeader.error;
			const javaCommand = (() => {
				if (options.javaHome !== undefined) return path.join(options.javaHome, "bin", platform === "win32" ? "java.exe" : "java");
				if (platform !== "darwin") return platform === "win32" ? "java.exe" : "java";
				const javaOnPath = options.environment.PATH?.split(":").some((directory) => path.isAbsolute(directory) && host.executable(path.join(directory, "java")));
				if (javaOnPath) return "java";
				const prefixes = architecture === "arm64" ? ["/opt/homebrew", "/usr/local"] : ["/usr/local", "/opt/homebrew"];
				return prefixes.map((prefix) => path.join(prefix, "opt/openjdk/libexec/openjdk.jdk/Contents/Home/bin/java")).find((candidate) => host.executable(candidate)) ?? "java";
			})();
			const javaProbe = options.javaHome === undefined || path.isAbsolute(options.javaHome) ? await host.probeJava(javaCommand, ghidraJavaEnvironment(options.javaHome, options.environment, platform), {
				resourceOwner: options.resourceOwner,
				...options.signal === undefined ? {} : { signal: options.signal }
			}) : undefined;
			if (javaProbe !== undefined && !javaProbe.ok && javaProbe.error instanceof AnalysisError) throw javaProbe.error;
			return {
				installDir,
				applicationPropertiesPath,
				analyzeHeadlessPath,
				nativeDecompilerPath,
				nativeDecompilerHeader,
				properties: properties === undefined ? undefined : ghidraApplicationProperties(properties),
				javaCommand,
				java: javaProbe?.ok === true ? javaProbe.value : undefined,
				javaProbeFailure: javaProbe !== undefined && !javaProbe.ok && !(javaProbe.error instanceof AnalysisError) ? javaProbe.error : undefined
			};
		};
		installationChecks = ({ coordinates, platform, architecture, javaHome, host }) => [
			configurationCheck(coordinates.installDir, javaHome, platform),
			installationCheck({
				name: "platform",
				passed: NATIVE_PLATFORMS[platform] !== undefined,
				code: "unsupported_host",
				detail: platform,
				remediation: "Use Linux or macOS x64/arm64, or Windows x64 with matching native Ghidra tools."
			}),
			installationCheck({
				name: "architecture",
				passed: NATIVE_PLATFORMS[platform]?.[architecture] !== undefined,
				code: "unsupported_host",
				detail: architecture,
				remediation: "Use x64/arm64 on Linux or macOS, or x64 on Windows."
			}),
			installationCheck({
				name: "installation",
				passed: coordinates.properties !== undefined,
				code: "executable_missing",
				detail: coordinates.applicationPropertiesPath ?? "Ghidra application properties unavailable",
				remediation: "Point GHIDRA_INSTALL_DIR at the root of an extracted official Ghidra release."
			}),
			versionCheck(coordinates.properties),
			installationCheck({
				name: "headless",
				passed: coordinates.analyzeHeadlessPath !== null && host.executable(coordinates.analyzeHeadlessPath),
				code: "executable_missing",
				detail: coordinates.analyzeHeadlessPath ?? "analyzeHeadless unavailable",
				remediation: "Restore support/analyzeHeadless or support/analyzeHeadless.bat from the official Ghidra release."
			}),
			nativeDecompilerCheck({
				coordinates,
				platform,
				architecture
			}),
			javaCheck(coordinates.java, coordinates.javaCommand, javaHome, coordinates.properties, platform, coordinates.javaProbeFailure)
		];
		configurationCheck = (installDir, javaHome, platform) => {
			const { isAbsolute } = platform === "win32" ? win32 : posix;
			const relative = [...installDir !== null && !isAbsolute(installDir) ? ["GHIDRA_INSTALL_DIR"] : [], ...javaHome !== undefined && !isAbsolute(javaHome) ? ["JAVA_HOME"] : []];
			if (installDir === null || relative.length === 0) return installationCheck({
				name: "configuration",
				passed: installDir !== null,
				code: "not_configured",
				detail: installDir ?? "GHIDRA_INSTALL_DIR is not set",
				remediation: `Set GHIDRA_INSTALL_DIR to an extracted Ghidra ${ghidraReleaseLine()} release directory.`
			});
			const settings = relative.join(" and ");
			return installationCheck({
				name: "configuration",
				passed: false,
				code: "not_configured",
				detail: `${settings} must be absolute`,
				remediation: `Set ${settings} to ${relative.length === 1 ? "an absolute path" : "absolute paths"}. REA's analysis and MCP server reject relative paths even when they resolve from the current directory.`
			});
		};
		ghidraInstallationDiagnostics = (inspection) => ({
			install_dir: inspection.installDir,
			analyze_headless_path: inspection.analyzeHeadlessPath,
			native_decompiler_path: inspection.nativeDecompilerPath,
			...inspection.nativeDecompilerHeaderFailure === undefined ? {} : { native_decompiler_header_failure: projectAnalysisError(inspection.nativeDecompilerHeaderFailure) },
			application_properties_path: inspection.applicationPropertiesPath,
			provider_version: inspection.providerVersion,
			java_command: inspection.javaCommand,
			...inspection.javaProbeFailure === undefined ? {} : { java_probe_failure: {
				code: inspection.javaProbeFailure.code,
				...inspection.javaProbeFailure.processErrorCode === undefined ? {} : { process_error_code: inspection.javaProbeFailure.processErrorCode },
				detail: inspection.javaProbeFailure.detail,
				...inspection.javaProbeFailure.cancellation === undefined ? {} : { cancellation_observed: true },
				...inspection.javaProbeFailure.properties === undefined ? {} : { properties: { ...inspection.javaProbeFailure.properties } },
				...inspection.javaProbeFailure.output === undefined ? {} : { output: { ...inspection.javaProbeFailure.output } }
			} },
			java_home: inspection.javaHome,
			java_version: inspection.javaVersion,
			java_vm_name: inspection.javaVmName ?? null,
			java_os_arch: inspection.javaOsArch ?? null,
			java_os_name: inspection.javaOsName ?? null,
			platform: inspection.platform,
			architecture: inspection.architecture,
			checks: inspection.checks.map((check) => ({
				name: check.name,
				ok: check.status === "passed",
				code: check.status === "failed" ? check.code : null,
				detail: check.detail
			}))
		});
		ghidraJavaEnvironment = (javaHome, environment, platform = process.platform) => {
			const selectedEnvironment = snapshotEnvironment(environment, platform);
			const boundedEnvironment = {
				...selectedEnvironment,
				_JAVA_OPTIONS: "",
				JAVA_TOOL_OPTIONS: "",
				JDK_JAVA_OPTIONS: "",
				GHIDRA_JAVA_OPTIONS: ""
			};
			return javaHome === undefined ? boundedEnvironment : {
				...boundedEnvironment,
				JAVA_HOME: javaHome,
				PATH: `${(platform === "win32" ? win32 : posix).join(javaHome, "bin")}${platform === "win32" ? win32.delimiter : posix.delimiter}${selectedEnvironment.PATH ?? ""}`
			};
		};
		installationCheck = (options) => options.passed ? {
			status: "passed",
			name: options.name,
			detail: options.detail
		} : {
			status: "failed",
			name: options.name,
			code: options.code,
			detail: options.detail,
			remediation: options.remediation
		};
		nativeDecompilerCheck = ({ coordinates, platform, architecture }) => {
			const path = coordinates.nativeDecompilerPath;
			const compatibility = path === null ? undefined : !coordinates.nativeDecompilerHeader.ok ? {
				status: "unknown",
				detail: `${path} header is unknown: ${coordinates.nativeDecompilerHeader.error.message}`
			} : assessNativeDecompiler(path, platform, architecture, coordinates.nativeDecompilerHeader.value);
			const osArch = coordinates.java?.osArch ?? coordinates.javaProbeFailure?.properties?.osArch ?? undefined;
			const osName = coordinates.java?.osName ?? coordinates.javaProbeFailure?.properties?.osName ?? undefined;
			const selectedDirectory = jvmOsArchNativeDirectory(platform, osArch);
			const validatedDirectory = NATIVE_PLATFORMS[platform]?.[architecture];
			if (coordinates.java !== undefined) {
				if (selectedDirectory === undefined) return installationCheck({
					name: "native_decompiler",
					passed: false,
					code: "executable_missing",
					detail: osArch === undefined ? "The Java probe did not report os.arch; the JVM-selected native decompiler directory is unknown and cannot be matched to the validated host directory" : `JVM reports unrecognized os.arch=${osArch}; its selected native decompiler directory is unknown and cannot be matched to the validated host directory`,
					remediation: `Point JAVA_HOME at a JDK whose reported architecture maps to the validated Ghidra decompiler (${validatedDirectory ?? "unsupported host"}). REA does not build or install native tools.`
				});
				if (validatedDirectory !== undefined && selectedDirectory !== validatedDirectory && path !== null) return installationCheck({
					name: "native_decompiler",
					passed: false,
					code: "executable_missing",
					detail: `JVM reports os.arch=${osArch}, so Ghidra selects its native decompiler from os/${selectedDirectory}, but the validated decompiler targets ${validatedDirectory} (host ${platform}/${architecture})`,
					remediation: `Point JAVA_HOME at a JDK whose architecture matches the built decompiler (${validatedDirectory}). REA does not build or install native tools.`
				});
				if (osName === undefined) return installationCheck({
					name: "native_decompiler",
					passed: false,
					code: "executable_missing",
					detail: "The Java probe did not report os.name; the JVM-selected native decompiler OS directory is unknown and cannot be matched to the validated host platform",
					remediation: `Point JAVA_HOME at a JDK whose reported operating system matches the host platform (${platform}). REA does not build or install native tools.`
				});
				if (!jvmOsNameMatchesPlatform(platform, osName) && path !== null) return installationCheck({
					name: "native_decompiler",
					passed: false,
					code: "executable_missing",
					detail: `JVM reports os.name=${osName}, which does not match the validated host platform ${platform} (host ${platform}/${architecture})`,
					remediation: `Point JAVA_HOME at a JDK whose reported operating system matches the host platform (${platform}). REA does not build or install native tools.`
				});
			}
			return installationCheck({
				name: "native_decompiler",
				passed: path !== null && compatibility?.status !== "incompatible",
				code: "executable_missing",
				detail: compatibility?.detail ?? `Matching native decompiler for ${platform}/${architecture} was not found`,
				remediation: compatibility?.status === "incompatible" ? compatibility.remediation : `Provide an executable Ghidra/Features/Decompiler/os/${NATIVE_PLATFORMS[platform]?.[architecture] ?? "<platform>"}/${platform === "win32" ? "decompile.exe" : "decompile"}, or its build/os equivalent. REA does not build or install native tools.`
			});
		};
		jvmOsNameMatchesPlatform = (platform, osName) => {
			const normalized = osName.toLowerCase();
			if (platform === "win32") return normalized.startsWith("windows");
			if (platform === "darwin") return normalized.startsWith("mac") || normalized.startsWith("darwin");
			if (platform === "linux") return normalized.startsWith("linux");
			return false;
		};
		jvmOsArchNativeDirectory = (platform, osArch) => {
			if (osArch === undefined) return undefined;
			const normalized = osArch.toLowerCase();
			const node = normalized === "x86_64" || normalized === "amd64" || normalized === "x64" ? "x64" : normalized === "aarch64" || normalized === "arm64" ? "arm64" : undefined;
			return node === undefined ? undefined : NATIVE_PLATFORMS[platform]?.[node];
		};
		versionCheck = (properties) => {
			const raw = properties?.providerVersion;
			const parseError = properties?.parseError;
			return installationCheck({
				name: "version",
				passed: parseError == null && ghidraReleaseAccepted(raw),
				code: parseError != null ? "version_unresolved" : ghidraReleaseCompatibility(raw).status === "unsupported" ? "unsupported_version" : "version_unresolved",
				detail: parseError == null ? ghidraVersionDetail(raw) : `application.properties could not be parsed: ${parseError}`,
				remediation: `Install a Ghidra ${ghidraReleaseLine()} release (verified with ${SUPPORTED_GHIDRA_VERSION}), or update REA for another Ghidra line.`
			});
		};
		javaCheck = (observation, command, configuredHome, properties, platform, failure) => {
			const requirement = ghidraJavaRequirement(properties);
			const range = ghidraJavaRangeLabel(requirement);
			const supported = observation !== undefined && ghidraJavaMajorAccepted(observation.major, requirement) && observation.bits === 64 && observation.runtime === "jdk";
			const bitness = observation === undefined ? undefined : observation.bits === null ? `bitness unknown${observation.unparsedBits === undefined ? "" : ` (sun.arch.data.model = ${JSON.stringify(observation.unparsedBits)})`}` : `${String(observation.bits)}-bit`;
			const knownMismatch = observation !== undefined && (!ghidraJavaMajorAccepted(observation.major, requirement) || observation.bits !== null && observation.bits !== 64 || observation.runtime !== "jdk");
			const detail = observation === undefined ? requirement.unresolved === null ? failure?.detail ?? `${command}: Java probe was not attempted` : `${failure?.detail ?? command}; ${requirement.unresolved}` : `${observation.version}; ${bitness}; ${observation.runtime === "jdk" ? "JDK" : "runtime only"}; ${observation.home}; accepted ${range}`;
			return installationCheck({
				name: "java",
				passed: supported,
				code: requirement.unresolved !== null ? "version_unresolved" : observation === undefined ? failure?.code ?? "version_unresolved" : knownMismatch ? "unsupported_version" : "version_unresolved",
				detail,
				remediation: javaRemediation(requirement, configuredHome, range, platform)
			});
		};
		javaRemediation = (requirement, configuredHome, range, platform) => {
			if (requirement.unresolved !== null) return `The Ghidra installation's Java bounds could not be read (${requirement.unresolved}). Install a 64-bit full JDK inside the declared application.java.min and application.java.max.`;
			return configuredHome === undefined ? `Select ${range} on PATH, or set JAVA_HOME to its installation root before starting REA.${platform === "darwin" ? " Homebrew OpenJDK can be keg-only: set JAVA_HOME to the selected formula's libexec/openjdk.jdk/Contents/Home (for example /opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home or /usr/local/opt/openjdk/libexec/openjdk.jdk/Contents/Home). The installed JDK must satisfy the declared Ghidra Java bounds." : ""}` : `Update JAVA_HOME to the root of ${range} installation.`;
		};
		systemGhidraInstallationHost = () => ({
			readText: readGhidraInstallationProperties,
			executableHeader: readGhidraExecutableHeader,
			executable(path) {
				try {
					accessSync(path, constants.X_OK);
					return statSync(path).isFile();
				} catch (cause) {
					void cause;
					return false;
				}
			},
			probeJava: probeGhidraJava,
			discoverInstallDirOnPath: discoverGhidraInstallationOnPath
		});
		discoverGhidraInstallationOnPath = (environment, platform) => {
			if (platform !== process.platform) return undefined;
			const path = platform === "win32" ? win32 : posix;
			const pathValue = environment.PATH;
			if (pathValue === undefined || pathValue.length === 0) return undefined;
			const launchers = platform === "win32" ? [
				"ghidra.bat",
				"ghidraRun.bat",
				"ghidra.exe",
				"ghidraRun.exe"
			] : ["ghidra", "ghidraRun"];
			for (const directory of pathValue.split(delimiter)) {
				if (directory.length === 0) continue;
				for (const launcher of launchers) {
					let resolved;
					try {
						const candidate = path.resolve(directory, launcher);
						if (!executablePath(candidate)) continue;
						resolved = realpathSync(candidate);
					} catch (cause) {
						void cause;
						continue;
					}
					const root = dirname(resolved);
					const properties = path.join(root, "Ghidra", "application.properties");
					const headless = path.join(root, "support", platform === "win32" ? "analyzeHeadless.bat" : "analyzeHeadless");
					try {
						if (statSync(properties).isFile() && executablePath(headless)) return root;
					} catch (cause) {
						void cause;
					}
				}
			}
			return undefined;
		};
		executablePath = (path) => {
			try {
				accessSync(path, constants.X_OK);
				return statSync(path).isFile();
			} catch (cause) {
				void cause;
				return false;
			}
		};
	})))();
}

//#endregion
//#region dist/ida/IdaConfiguration.js
var common, registrationSchema, idaProtocol, readIdaConfiguration, idaConfigurationError;
function init_IdaConfiguration() {
	return (init_IdaConfiguration = __esmMin((() => {
		init_configurationErrors();
		init_result();
		common = {
			mode: z.enum(["attached", "headless"]).default("attached"),
			protocol: z.literal("native").optional(),
			timeoutMs: z.number().int().positive().max(2147483647).default(3e5),
			workspaceRoot: z.string().refine(isAbsolute, "workspaceRoot must be absolute on the REA host").optional()
		};
		registrationSchema = z.union([z.object({
			...common,
			type: z.literal("stdio").optional(),
			command: z.string().min(1),
			args: z.array(z.string()).default([]),
			env: z.record(z.string(), z.string()).default({})
		}).strict(), z.object({
			...common,
			type: z.literal("http").optional(),
			url: z.url().refine((value) => {
				const url = new URL(value);
				return ["http:", "https:"].includes(url.protocol) && [
					"localhost",
					"127.0.0.1",
					"[::1]"
				].includes(url.hostname) && url.username === "" && url.password === "";
			}, "IDA MCP must use a local HTTP endpoint without URL credentials"),
			headers: z.record(z.string(), z.string()).default({})
		}).strict()]).refine((config) => config.protocol !== "native" || config.mode === "attached", "The native IDA MCP protocol requires attached mode");
		idaProtocol = (config) => config.protocol ?? (config.mode === "attached" ? "legacy" : "modern");
		readIdaConfiguration = (path) => {
			try {
				if (statSync(path).size > 65536) return err(idaConfigurationError("REA_IDA_MCP_CONFIG exceeds the 64 KiB registration size."));
				const input = JSON.parse(readFileSync(path, "utf8"));
				const envelope = z.object({ mcpServers: z.object({ "ida-pro-mcp": z.unknown() }) }).safeParse(input);
				const parsed = registrationSchema.safeParse(envelope.success ? envelope.data.mcpServers["ida-pro-mcp"] : input);
				return parsed.success ? ok(parsed.data) : err(idaConfigurationError("REA_IDA_MCP_CONFIG must contain an IDA MCP command/args or local url registration; see docs/ida-provider.md.", parsed.error));
			} catch (cause) {
				return err(idaConfigurationError(`Cannot read IDA MCP registration ${path}; provide a readable JSON configuration.`, cause));
			}
		};
		idaConfigurationError = (constraint, cause) => new ConfigurationError(constraint, {
			...cause === undefined ? {} : { cause },
			settings: [{
				setting: "REA_IDA_MCP_CONFIG",
				constraint
			}]
		});
	})))();
}

//#endregion
//#region dist/kuna/KunaRelease.js
var KUNA_VERIFIED_VERSION, KUNA_PROVIDER_ID, KUNA_COMMAND_REMEDIATION, KUNA_UNSUPPORTED_HOST_REMEDIATION, KUNA_VERSION_PROBE_REMEDIATION;
function init_KunaRelease() {
	return (init_KunaRelease = __esmMin((() => {
		KUNA_VERIFIED_VERSION = "1.833";
		KUNA_PROVIDER_ID = "kuna";
		KUNA_COMMAND_REMEDIATION = `Set REA_KUNA_COMMAND to the absolute path of a caller-supplied kuna executable (verified with ${KUNA_VERIFIED_VERSION}). REA does not download, install or update Kuna.`;
		KUNA_UNSUPPORTED_HOST_REMEDIATION = "Use Linux or macOS for the Kuna provider. Windows process-tree ownership for Kuna is not verified.";
		KUNA_VERSION_PROBE_REMEDIATION = "Run the selected executable with --version: it must exit promptly and print `kuna <major>.<minor>`.";
	})))();
}

//#endregion
//#region dist/kuna/KunaConfiguration.js
var MAX_KUNA_JOBS, DEFAULT_PROJECT_TIMEOUT_MS, DEFAULT_FUNCTION_TIMEOUT_MS, DEFAULT_JOBS, DEFAULT_CACHE_MAX_BYTES, MIN_CACHE_MAX_BYTES, kunaFunctionDeadline, kunaProjectDeadline, failure$1, positiveInteger, defaultCacheRoot, readKunaConfiguration;
function init_KunaConfiguration() {
	return (init_KunaConfiguration = __esmMin((() => {
		init_homeDirectory();
		init_providerStartupTimeout();
		init_result();
		init_KunaRelease();
		MAX_KUNA_JOBS = 32;
		DEFAULT_PROJECT_TIMEOUT_MS = 30 * 60 * 1e3;
		DEFAULT_FUNCTION_TIMEOUT_MS = 12e4;
		DEFAULT_JOBS = 1;
		DEFAULT_CACHE_MAX_BYTES = 4 * 1024 ** 3;
		MIN_CACHE_MAX_BYTES = 1024 ** 2;
		kunaFunctionDeadline = (configuration) => ({
			setting: "REA_KUNA_TIMEOUT_MS",
			ms: configuration.functionTimeoutMs
		});
		kunaProjectDeadline = (configuration) => ({
			setting: "REA_KUNA_PROJECT_TIMEOUT_MS",
			ms: configuration.projectTimeoutMs
		});
		failure$1 = (code, reason, setting = null) => err({
			code,
			reason,
			setting
		});
		positiveInteger = (value) => /^[1-9]\d*$/u.test(value) && Number.isSafeInteger(Number(value)) ? Number(value) : undefined;
		defaultCacheRoot = (environment, platform) => {
			const home = homeDirectoryFromEnvironment(environment, platform);
			if (platform === "darwin") return join(home, "Library", "Caches", "rea", "kuna");
			const xdg = environment.XDG_CACHE_HOME;
			return join(xdg !== undefined && isAbsolute(xdg) ? xdg : join(home, ".cache"), "rea", "kuna");
		};
		readKunaConfiguration = (environment, platform = process.platform) => {
			const command = environment.REA_KUNA_COMMAND;
			if (command === undefined || command.length === 0) return failure$1("not_configured", KUNA_COMMAND_REMEDIATION);
			if (!isAbsolute(command)) return failure$1("open_options_invalid", `REA_KUNA_COMMAND must be an absolute path; received ${command}. ${KUNA_COMMAND_REMEDIATION}`, "REA_KUNA_COMMAND");
			if (platform !== "darwin" && platform !== "linux") return failure$1("unsupported_host", KUNA_UNSUPPORTED_HOST_REMEDIATION);
			const cacheRoot = environment.REA_KUNA_CACHE_DIR;
			if (cacheRoot !== undefined && !isAbsolute(cacheRoot)) return failure$1("open_options_invalid", `REA_KUNA_CACHE_DIR must be an absolute directory; received ${cacheRoot}.`, "REA_KUNA_CACHE_DIR");
			const rawMaxBytes = environment.REA_KUNA_CACHE_MAX_BYTES;
			const cacheMaxBytes = rawMaxBytes === undefined ? DEFAULT_CACHE_MAX_BYTES : positiveInteger(rawMaxBytes);
			if (cacheMaxBytes === undefined || cacheMaxBytes < MIN_CACHE_MAX_BYTES) return failure$1("open_options_invalid", `REA_KUNA_CACHE_MAX_BYTES must be a decimal byte count of at least ${String(MIN_CACHE_MAX_BYTES)}; received ${String(rawMaxBytes)}.`, "REA_KUNA_CACHE_MAX_BYTES");
			const rawTimeout = environment.REA_KUNA_PROJECT_TIMEOUT_MS;
			const timeout = rawTimeout === undefined ? undefined : providerStartupTimeoutSchema.safeParse(rawTimeout);
			if (timeout !== undefined && !timeout.success) return failure$1("open_options_invalid", `REA_KUNA_PROJECT_TIMEOUT_MS must be a decimal millisecond count from 1 to 2147483647; received ${String(rawTimeout)}.`, "REA_KUNA_PROJECT_TIMEOUT_MS");
			const rawFunctionTimeout = environment.REA_KUNA_TIMEOUT_MS;
			const functionTimeout = rawFunctionTimeout === undefined ? undefined : providerStartupTimeoutSchema.safeParse(rawFunctionTimeout);
			if (functionTimeout !== undefined && !functionTimeout.success) return failure$1("open_options_invalid", `REA_KUNA_TIMEOUT_MS must be a decimal millisecond count from 1 to 2147483647; received ${String(rawFunctionTimeout)}.`, "REA_KUNA_TIMEOUT_MS");
			const rawJobs = environment.REA_KUNA_JOBS;
			const jobs = rawJobs === undefined ? DEFAULT_JOBS : positiveInteger(rawJobs);
			if (jobs === undefined || jobs > MAX_KUNA_JOBS) return failure$1("open_options_invalid", `REA_KUNA_JOBS must be an integer from 1 to ${String(MAX_KUNA_JOBS)}; received ${String(rawJobs)}.`, "REA_KUNA_JOBS");
			return ok({
				command,
				cacheRoot: cacheRoot ?? defaultCacheRoot(environment, platform),
				cacheMaxBytes,
				projectTimeoutMs: timeout?.data ?? DEFAULT_PROJECT_TIMEOUT_MS,
				functionTimeoutMs: functionTimeout?.data ?? DEFAULT_FUNCTION_TIMEOUT_MS,
				jobs
			});
		};
	})))();
}

//#endregion
//#region dist/kuna/KunaInstallation.js
var VERSION_PROBE_TIMEOUT_MS, VERSION_PROBE_MAX_OUTPUT_BYTES, VERSION_LINE, createKunaFileCloseScope, kunaChildEnvironment, failure, message, inspectKunaInstallation, startsWithShebang;
function init_KunaInstallation() {
	return (init_KunaInstallation = __esmMin((() => {
		init_RegularFile();
		init_result();
		init_AnalysisCleanupLease();
		init_StableFileHash();
		init_OwnedRegularFile();
		init_ExecFileOutput();
		init_KunaConfiguration();
		init_KunaRelease();
		VERSION_PROBE_TIMEOUT_MS = 1e4;
		VERSION_PROBE_MAX_OUTPUT_BYTES = 64 * 1024;
		VERSION_LINE = /^kuna (\d+\.\d+(?:\.\d+)?)\r?\n?$/u;
		createKunaFileCloseScope = (parent) => {
			const leases = new Map();
			return {
				owner: {
					retain: (owner, resource) => {
						const lease = AnalysisCleanupLease.forCloseOwner(owner, resource);
						leases.set(owner, lease);
						parent.retain({
							close: () => lease.release(),
							get cleanupResources() {
								return lease.cleanupResources ?? [resource];
							}
						}, resource);
					},
					run: (operation) => parent.run(operation)
				},
				bindFailure: (failure, error) => leases.get(failure.owner)?.bindCleanupError(error)
			};
		};
		kunaChildEnvironment = (configuration) => {
			const home = join(configuration.cacheRoot, "home");
			return {
				HOME: home,
				XDG_CACHE_HOME: join(home, ".cache"),
				NO_COLOR: "1"
			};
		};
		failure = (code, reason, diagnostics) => err({
			code,
			reason,
			diagnostics
		});
		message = (cause) => cause instanceof Error ? cause.message : String(cause);
		inspectKunaInstallation = async (environment, options) => {
			const configuration = readKunaConfiguration(environment, options.platform);
			if (!configuration.ok) return failure(configuration.error.code, configuration.error.reason, {
				configured: configuration.error.code !== "not_configured",
				...configuration.error.setting === null ? {} : { setting: configuration.error.setting }
			});
			const { command } = configuration.value;
			let executable;
			try {
				executable = await realpath(command);
				await access(executable, constants.X_OK);
				if (!(await stat(executable)).isFile()) return failure("executable_missing", `REA_KUNA_COMMAND is not a regular file: ${command}. ${KUNA_COMMAND_REMEDIATION}`, { command });
			} catch (cause) {
				assertRegularFileActive(options.signal);
				return failure("executable_missing", `Cannot execute REA_KUNA_COMMAND ${command}: ${message(cause)}. ${KUNA_COMMAND_REMEDIATION}`, { command });
			}
			const deadline = options.probeTimeoutMs ?? VERSION_PROBE_TIMEOUT_MS;
			let stdout;
			try {
				({stdout} = await execFileOutput(executable, ["--version"], {
					env: kunaChildEnvironment(configuration.value),
					timeout: deadline,
					maxBuffer: VERSION_PROBE_MAX_OUTPUT_BYTES,
					stopSignal: "SIGTERM",
					...options.signal === undefined ? {} : { signal: options.signal }
				}));
			} catch (cause) {
				assertRegularFileActive(options.signal);
				const output = execFileOutputFailure(cause);
				return failure("version_unresolved", `${executable} --version failed: ${output?.stderr.trim() || message(cause)}. ${KUNA_VERSION_PROBE_REMEDIATION}`, {
					command,
					executable,
					exit_code: typeof output?.code === "number" ? output.code : null,
					signal: output?.signal ?? null,
					killed: output?.killed ?? false,
					output_truncated: output?.outputTruncated ?? false,
					deadline_ms: deadline
				});
			}
			const version = VERSION_LINE.exec(stdout)?.[1];
			if (version === undefined) return failure("version_unresolved", `${executable} --version printed no recognizable Kuna version. ${KUNA_VERSION_PROBE_REMEDIATION}`, {
				command,
				executable,
				stdout: stdout.slice(0, 256)
			});
			let fingerprint;
			let script;
			try {
				({fingerprint, script} = await options.fileCloseResources.run(async () => {
					const fingerprint = await hashStableFile(executable, {
						...options.signal === undefined ? {} : { signal: options.signal },
						retainFailedClose: (owner) => options.fileCloseResources.retain(owner, executable)
					});
					const script = await startsWithShebang(executable, options.fileCloseResources);
					assertRegularFileActive(options.signal);
					return {
						fingerprint,
						script
					};
				}));
			} catch (cause) {
				if (cause instanceof RegularFileCleanupFailure || regularFileCancellation(cause) !== undefined) throw cause;
				return failure("executable_missing", `Cannot fingerprint ${executable}: ${message(stableFileHashCause(cause))}`, {
					command,
					executable
				});
			}
			return ok({
				configuration: configuration.value,
				executable,
				version,
				verified: version === KUNA_VERIFIED_VERSION,
				...fingerprint,
				script
			});
		};
		startsWithShebang = (path, fileCloseResources) => withOwnedRegularFile(path, {
			symlinks: "follow",
			retainFailedClose: (owner) => fileCloseResources.retain(owner, path)
		}, async (handle) => {
			const prefix = Buffer.alloc(2);
			const { bytesRead } = await handle.read(prefix, 0, 2, 0);
			return bytesRead === 2 && prefix.toString("latin1") === "#!";
		});
	})))();
}

//#endregion
export { KUNA_COMMAND_REMEDIATION, KUNA_PROVIDER_ID, KUNA_UNSUPPORTED_HOST_REMEDIATION, KUNA_VERIFIED_VERSION, KUNA_VERSION_PROBE_REMEDIATION, createKunaFileCloseScope, ghidraFileFailure, ghidraInstallationDiagnostics, ghidraJavaEnvironment, idaConfigurationError, idaProtocol, init_GhidraFileArtifacts, init_GhidraInstallation, init_GhidraJavaProperties, init_GhidraReleasePolicy, init_IdaConfiguration, init_KunaConfiguration, init_KunaInstallation, init_KunaRelease, init_LinuxPrivateDisplayDiagnostic, init_LinuxPrivateDisplayProbe, inspectGhidraInstallation, inspectKunaInstallation, kunaChildEnvironment, kunaFunctionDeadline, kunaProjectDeadline, parseGhidraJavaProperties, parseLinuxPrivateDisplayDiagnostic, readGhidraProfileArtifact, readIdaConfiguration, readKunaConfiguration, selectLinuxPrivateDisplayStrategy, unverifiedGhidraBuildLimitation, writeGhidraProfileArtifact };