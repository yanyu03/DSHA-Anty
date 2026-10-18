import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { err, init_result, ok } from "./reconstructionObligationLedgerSchemas-Bi6sect1.js";
import { RegularFileCancelled, RegularFileCleanupFailure, init_OwnedRegularFile, regularFileCancellation } from "./OwnedRegularFile-D1f5nUCx.js";
import { ArtifactReaderFailure, init_ArtifactReader } from "./ArtifactReader-DMwm42bk.js";
import { ArtifactResourceScope, init_ArtifactResourceScope } from "./ArtifactResourceScope-CokZGcII.js";
import { HopperStartError, init_hopperErrors } from "./cliResultOutput-10sd6xGx.js";
import { execFileOutput, init_ExecFileOutput } from "./ExecFileOutput-D6KLYTve.js";
import { init_safeJson, safeParseJson } from "./safeJson-DKKACtdy.js";
import { ABORTED, init_AbortablePromise, init_ProviderDeadline, waitForAbortable, waitForAbortableDelay } from "./ProviderDeadline-rSuH4Pm8.js";
import { PrivateRuntimeRoot, init_PrivateRuntimeRoot } from "./PrivateRuntimeRoot-Cd23u6jd.js";
import { init_BoundedFileBytes, readBoundedFileBytes } from "./BoundedFileBytes-DRtiQNAQ.js";
import { init_RegularFileRead, withRegularFile } from "./RegularFileRead-mbgGYtxe.js";
import { homeDirectoryFromEnvironment, init_homeDirectory } from "./homeDirectory-DC_DeJIg.js";
import { StableFileHashFailure, hashStableFile, init_StableFileHash } from "./StableFileHash-Ame_h3lY.js";
import { z } from "zod";
import { isAbsolute, join } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { tmpdir } from "node:os";
import { access, chmod, copyFile, lstat, mkdir, mkdtemp, open, readFile, realpath, rename, rm, rmdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { createConnection, createServer } from "node:net";

//#region dist/process/ExecFileBoundedOutput.js
var execFileBoundedOutput, retainedOutput;
function init_ExecFileBoundedOutput() {
	return (init_ExecFileBoundedOutput = __esmMin((() => {
		execFileBoundedOutput = (executable, args, options) => new Promise((resolve) => {
			const child = spawn(executable, [...args], {
				env: options.env,
				stdio: [
					"ignore",
					"pipe",
					"pipe"
				]
			});
			const headLimit = Math.ceil(options.limit / 2);
			const tailLimit = options.limit - headLimit;
			const stdout = {
				head: Buffer.alloc(0),
				tail: Buffer.alloc(0),
				total: 0
			};
			const stderr = {
				head: Buffer.alloc(0),
				tail: Buffer.alloc(0),
				total: 0
			};
			let outputTruncated = false;
			const capture = (stream) => (chunk) => {
				stream.total += chunk.length;
				const headCount = Math.min(chunk.length, Math.max(0, headLimit - stream.head.length));
				if (headCount > 0) stream.head = Buffer.concat([stream.head, chunk.subarray(0, headCount)]);
				const rest = chunk.subarray(headCount);
				if (rest.length > 0 && tailLimit > 0) stream.tail = Buffer.concat([stream.tail, rest]).subarray(-tailLimit);
				if (stream.total > options.limit) outputTruncated = true;
			};
			child.stdout.on("data", capture(stdout));
			child.stderr.on("data", capture(stderr));
			let spawnError;
			child.on("error", (error) => {
				spawnError = error;
			});
			child.on("close", (code, signal) => {
				resolve({
					exitCode: spawnError?.code ?? code ?? signal,
					stdout: retainedOutput(stdout, options.limit),
					stderr: retainedOutput(stderr, options.limit),
					outputTruncated
				});
			});
		});
		retainedOutput = (stream, limit) => stream.total > limit ? `${stream.head.toString("utf8")} … [output omitted] … ${stream.tail.toString("utf8")}` : Buffer.concat([stream.head, stream.tail]).toString("utf8");
	})))();
}

//#endregion
//#region dist/application/HopperDownload.js
var HOPPER_DOWNLOAD_BYTES, downloadHopperPackage;
function init_HopperDownload() {
	return (init_HopperDownload = __esmMin((() => {
		HOPPER_DOWNLOAD_BYTES = 1e8;
		downloadHopperPackage = async (url, options = {}) => {
			const timeoutMs = options.timeoutMs ?? 12e4;
			if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 12e4) throw new RangeError("Invalid Hopper response time budget");
			const deadline = AbortSignal.timeout(timeoutMs);
			const maxBytes = options.maxBytes ?? 1e8;
			if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > 1e8) throw new RangeError("Invalid Hopper response byte budget");
			const response = await fetch(url, {
				headers: {
					accept: "application/json",
					"user-agent": "rea-installer"
				},
				signal: options.signal === undefined ? deadline : AbortSignal.any([options.signal, deadline])
			});
			const refused = {
				ok: false,
				bytes: new Uint8Array()
			};
			if (!response.ok || Number(response.headers.get("content-length")) > maxBytes) {
				await response.body?.cancel();
				return refused;
			}
			if (response.body === null) return {
				ok: true,
				bytes: new Uint8Array()
			};
			const reader = response.body.getReader();
			const chunks = [];
			let bytes = 0;
			try {
				while (true) {
					const chunk = await reader.read();
					if (chunk.done) return {
						ok: true,
						bytes: Buffer.concat(chunks, bytes)
					};
					if (chunk.value.byteLength > maxBytes - bytes) {
						await reader.cancel();
						return refused;
					}
					chunks.push(chunk.value);
					bytes += chunk.value.byteLength;
				}
			} finally {
				reader.releaseLock();
			}
		};
	})))();
}

//#endregion
//#region dist/application/HopperReleaseFeed.js
var HOPPER_RELEASES_URL, HOPPER_PUBLIC_KEY_URL, HOPPER_DOWNLOAD_PREFIX, HOPPER_LINUX_PRIMARY_FINGERPRINT, platforms, suffixes, HopperReleaseError, sha256, releaseSchema, parseLinuxHopperRelease, parseLinuxHopperReleases;
function init_HopperReleaseFeed() {
	return (init_HopperReleaseFeed = __esmMin((() => {
		init_result();
		init_HopperDownload();
		HOPPER_RELEASES_URL = "https://www.hopperapp.com/include/files-api.php?request=releases&public=true";
		HOPPER_PUBLIC_KEY_URL = "https://www.hopperapp.com/hopper-public-key.asc";
		HOPPER_DOWNLOAD_PREFIX = "https://www.hopperapp.com:443/downloader/public/";
		HOPPER_LINUX_PRIMARY_FINGERPRINT = "7C2D73BAFAF5B9A710A69DA1A26DF815099B1BCD";
		platforms = {
			deb: "Ubuntu / Mint",
			rpm: "Fedora",
			arch: "Arch"
		};
		suffixes = {
			deb: ".deb",
			rpm: ".rpm",
			arch: ".pkg.tar.xz"
		};
		HopperReleaseError = class extends Error {
			reason;
			_tag = "HopperReleaseError";
			constructor(reason, message, options) {
				super(message, options);
				this.reason = reason;
				this.name = this._tag;
			}
		};
		sha256 = z.string().regex(/^[a-f0-9]{64}$/u);
		releaseSchema = z.object({
			version: z.string().min(1),
			filename: z.string().url(),
			file_length: z.string().regex(/^[1-9]\d*$/u).refine((text) => {
				const count = Number(text);
				return Number.isSafeInteger(count) && count <= 1e8;
			}),
			file_hash: z.string().regex(/^[a-f0-9]{40}$/u),
			main_exe_hash: sha256,
			signature: z.string().min(1).refine((text) => Buffer.from(text, "base64").toString("base64") === text),
			public: z.literal("1"),
			beta: z.literal("0")
		}).passthrough();
		parseLinuxHopperRelease = (raw, family) => {
			const parsed = releaseSchema.safeParse(raw);
			if (!parsed.success) return err(new HopperReleaseError("release_metadata", "The Hopper release omitted valid package identity or signature metadata."));
			const url = new URL(parsed.data.filename);
			if (url.origin !== "https://www.hopperapp.com" || url.username !== "" || url.password !== "" || url.search !== "" || url.hash !== "" || !url.pathname.startsWith("/downloader/public/Hopper-") || !url.pathname.endsWith(`-Linux-demo${suffixes[family]}`)) return err(new HopperReleaseError("release_metadata", "The Hopper release is outside the official public Linux demo channel."));
			return ok(parsed.data);
		};
		parseLinuxHopperReleases = (raw) => {
			const feed = z.record(z.string(), z.unknown()).safeParse(raw);
			if (!feed.success) return err(new HopperReleaseError("release_metadata", "The Hopper releases response is not an object."));
			return ok({
				deb: parseLinuxHopperRelease(feed.data[platforms.deb], "deb"),
				rpm: parseLinuxHopperRelease(feed.data[platforms.rpm], "rpm"),
				arch: parseLinuxHopperRelease(feed.data[platforms.arch], "arch")
			});
		};
	})))();
}

//#endregion
//#region dist/process/DetachedPgpSignature.js
var DetachedPgpSignatureError, verifyDetachedPgpSignature;
function init_DetachedPgpSignature() {
	return (init_DetachedPgpSignature = __esmMin((() => {
		init_result();
		DetachedPgpSignatureError = class extends Error {
			reason;
			_tag = "DetachedPgpSignatureError";
			constructor(reason, message, options) {
				super(message, options);
				this.reason = reason;
				this.name = this._tag;
			}
		};
		verifyDetachedPgpSignature = async (bytes, detachedSignature, armoredPublicKey, primaryFingerprint, signal) => {
			const cancelled = () => err(new DetachedPgpSignatureError("cancelled", "Package verification was cancelled."));
			const isAborted = () => signal?.aborted === true;
			if (isAborted()) return cancelled();
			try {
				const pgp = await import("openpgp");
				const key = await pgp.readKey({ armoredKey: armoredPublicKey });
				if (isAborted()) return cancelled();
				const fingerprint = key.getFingerprint().toUpperCase();
				if (fingerprint !== primaryFingerprint) return err(new DetachedPgpSignatureError("wrong_publisher", "The package signing key does not belong to the pinned publisher."));
				const signature = await pgp.readSignature({ binarySignature: detachedSignature });
				if (isAborted()) return cancelled();
				if (signature.packets.length !== 1 || signature.packets[0]?.signatureType !== pgp.enums.signature.binary) return err(new DetachedPgpSignatureError("invalid_signature", "Expected one detached binary package signature."));
				const verified = await pgp.verify({
					message: await pgp.createMessage({ binary: bytes }),
					signature,
					verificationKeys: key,
					format: "binary"
				});
				const signed = verified.signatures[0];
				if (signed === undefined || verified.signatures.length !== 1) return err(new DetachedPgpSignatureError("invalid_signature", "The package has no unique verified signature."));
				await signed.verified;
				const signingKey = await key.getSigningKey(signed.keyID, signature.packets[0].created);
				if (isAborted()) return cancelled();
				return ok({
					primaryFingerprint: fingerprint,
					signingFingerprint: signingKey.getFingerprint().toUpperCase()
				});
			} catch (cause) {
				if (isAborted()) return cancelled();
				return err(new DetachedPgpSignatureError("invalid_signature", "The package signature could not be verified.", { cause }));
			}
		};
	})))();
}

//#endregion
//#region dist/process/HopperLease.js
var HOPPER_TARGET_LEASE_DIRECTORY, acquireHopperTargetLease, acquireLinuxHopperApplicationLease, acquireHopperReleaseCacheLease, acquireLease, reserveRecovery, tryAcquireLease, ensureLeaseDirectory, bind, sendOwner, readOwner, closeServer;
function init_HopperLease() {
	return (init_HopperLease = __esmMin((() => {
		init_hopperErrors();
		init_safeJson();
		HOPPER_TARGET_LEASE_DIRECTORY = join("/tmp", `rea-hopper-${process.getuid?.() ?? 0}`);
		acquireHopperTargetLease = async (input) => {
			let targetPath;
			try {
				targetPath = await realpath(input.targetPath);
			} catch (cause) {
				throw new HopperStartError({
					cause,
					userMessage: `REA could not resolve Hopper target ${JSON.stringify(input.targetPath)} to a canonical path before reserving the document. Confirm that the target exists and its path is accessible.`
				});
			}
			return acquireLease({
				...input,
				identity: {
					targetPath,
					targetKind: input.targetKind,
					loaderArgs: input.loaderArgs
				}
			});
		};
		acquireLinuxHopperApplicationLease = (input) => acquireLease({
			...input,
			identity: { application: "linux-hopper-demo" }
		});
		acquireHopperReleaseCacheLease = async (input) => acquireLease({
			runId: input.runId,
			identity: {
				cacheDirectory: await realpath(input.cacheDirectory),
				launcherSha256: input.launcherSha256,
				operation: "signed-package-retention"
			}
		});
		acquireLease = async (input) => {
			const directory = input.directory ?? HOPPER_TARGET_LEASE_DIRECTORY;
			await ensureLeaseDirectory(directory);
			const key = createHash("sha256").update(JSON.stringify(input.identity)).digest("hex").slice(0, 32);
			const socketPath = join(directory, `${key}.sock`);
			const owner = {
				runId: input.runId,
				processId: process.pid
			};
			const acquisition = await tryAcquireLease(socketPath, owner);
			if (typeof acquisition !== "string") return acquisition;
			const recoveryPath = `${socketPath}.recovery`;
			await reserveRecovery(recoveryPath);
			let recovered;
			try {
				recovered = await tryAcquireLease(socketPath, owner);
				if (recovered === "stale") await rm(socketPath, { force: true });
				if (typeof recovered === "string") recovered = await tryAcquireLease(socketPath, owner);
				if (typeof recovered !== "string") return recovered;
				throw new HopperStartError({ userMessage: "REA could not reserve Hopper for this request. Close competing REA sessions and retry." });
			} finally {
				try {
					await rmdir(recoveryPath);
				} catch (cause) {
					if (typeof recovered !== "string" && recovered?.acquired) await recovered.lease.release();
					throw new HopperStartError({
						cause,
						userMessage: `REA could not remove its Hopper recovery directory at ${JSON.stringify(recoveryPath)}. Check this directory's write access before retrying.`
					});
				}
			}
		};
		reserveRecovery = async (recoveryPath) => {
			try {
				await mkdir(recoveryPath, { mode: 448 });
			} catch (cause) {
				const busy = typeof cause === "object" && cause !== null && Reflect.get(cause, "code") === "EEXIST";
				throw new HopperStartError({
					cause,
					userMessage: busy ? `REA could not reserve Hopper lease recovery at ${JSON.stringify(recoveryPath)}; the existing socket was left unchanged. Retry after concurrent startup finishes. If recovery was interrupted, stop REA sessions and remove this recovery directory before retrying.` : `REA could not create its Hopper recovery directory at ${JSON.stringify(recoveryPath)}; the existing socket was left unchanged. Check the parent directory's write access before retrying.`
				});
			}
		};
		tryAcquireLease = async (socketPath, owner) => {
			const server = createServer((socket) => sendOwner(socket, owner));
			server.unref();
			if (!await bind(server, socketPath)) {
				const existingOwner = await readOwner(socketPath);
				return typeof existingOwner === "string" ? existingOwner : {
					acquired: false,
					owner: existingOwner
				};
			}
			try {
				await chmod(socketPath, 384);
			} catch (cause) {
				await closeServer(server);
				throw cause;
			}
			let released = false;
			return {
				acquired: true,
				lease: {
					socketPath,
					release: async () => {
						if (released) return;
						await closeServer(server);
						released = true;
					}
				}
			};
		};
		ensureLeaseDirectory = async (directory) => {
			try {
				await mkdir(directory, {
					recursive: true,
					mode: 448
				});
			} catch (cause) {
				throw new HopperStartError({
					cause,
					userMessage: "REA could not create its private Hopper lease directory."
				});
			}
			let handle;
			try {
				handle = await open(directory, constants.O_RDONLY | (constants.O_DIRECTORY ?? 0) | (constants.O_NOFOLLOW ?? 0));
				const directoryStat = await handle.stat();
				if (directoryStat.isSymbolicLink() || directoryStat.isDirectory() === false || process.getuid !== undefined && directoryStat.uid !== process.getuid()) throw new HopperStartError({ userMessage: "REA's Hopper lease directory is not a private directory owned by this user." });
				const posixPermissionsApply = process.getuid !== undefined;
				if (posixPermissionsApply && (directoryStat.mode & 63) !== 0) {
					await handle.chmod(448);
					const afterChmod = await handle.stat();
					if (afterChmod.isSymbolicLink() || afterChmod.isDirectory() === false || (afterChmod.mode & 63) !== 0) throw new HopperStartError({ userMessage: "REA's Hopper lease directory permissions could not be secured." });
				}
			} catch (cause) {
				if (cause instanceof HopperStartError) throw cause;
				const accessDenied = process.getuid !== undefined && cause instanceof Error && "code" in cause && cause.code === "EACCES";
				throw new HopperStartError({
					cause,
					userMessage: accessDenied ? `REA could not access its Hopper lease directory at ${JSON.stringify(directory)}. Check its ownership and parent-directory access. For a directory you own, restore owner-only read, write, and search permissions (0700), then retry.` : "REA could not inspect its private Hopper lease directory."
				});
			} finally {
				await handle?.close();
			}
		};
		bind = (server, socketPath) => new Promise((resolveBind, reject) => {
			const onError = (error) => {
				server.removeListener("listening", onListening);
				if (error.code === "EADDRINUSE") resolveBind(false);
				else reject(error);
			};
			const onListening = () => {
				server.removeListener("error", onError);
				resolveBind(true);
			};
			server.once("error", onError);
			server.once("listening", onListening);
			server.listen(socketPath);
		});
		sendOwner = (socket, owner) => {
			socket.end(`${JSON.stringify(owner)}\n`);
		};
		readOwner = (socketPath) => new Promise((resolveOwner, rejectOwner) => {
			const socket = createConnection(socketPath);
			let response = "";
			let settled = false;
			const fail = (reason, cause) => {
				if (settled) return;
				settled = true;
				clearTimeout(timer);
				socket.destroy();
				rejectOwner(new HopperStartError({
					cause,
					userMessage: `REA could not verify the existing Hopper lease (${reason}); it was left unchanged. Retry when the owning REA session is responsive.`
				}));
			};
			const timer = setTimeout(() => fail("owner response timed out"), 250);
			const finish = (owner) => {
				if (settled) return;
				settled = true;
				clearTimeout(timer);
				socket.destroy();
				resolveOwner(owner);
			};
			socket.on("data", (chunk) => {
				response += chunk.toString("utf8");
				const newline = response.indexOf("\n");
				if (newline < 0) return;
				const parsed = safeParseJson(response.slice(0, newline));
				if (!parsed.ok) {
					fail("malformed owner response");
					return;
				}
				const value = parsed.value;
				const runId = typeof value === "object" && value !== null ? Reflect.get(value, "runId") : undefined;
				const processId = typeof value === "object" && value !== null ? Reflect.get(value, "processId") : undefined;
				if (typeof runId === "string" && runId.length > 0 && typeof processId === "number" && Number.isSafeInteger(processId) && processId > 0) finish({
					runId,
					processId
				});
				else fail("invalid owner identity");
			});
			socket.on("error", (cause) => {
				if (cause.code === "ENOENT") finish("missing");
				else if (cause.code === "ECONNREFUSED") finish("stale");
				else fail(cause.code ?? "owner connection failed", cause);
			});
			socket.on("end", () => fail("owner closed without a complete response"));
		});
		closeServer = (server) => new Promise((resolveClose, reject) => {
			if (!server.listening) {
				resolveClose();
				return;
			}
			server.close((error) => error ? reject(error) : resolveClose());
		});
	})))();
}

//#endregion
//#region dist/application/LinuxHopperPublisher.js
var RELEASE_METADATA_BYTES, RELEASE_METADATA_TIMEOUT_MS, cacheRecordSchema, pendingCleanup, packageProofs, liveLauncherProofs, retainProof, linuxHopperReleaseCacheDirectory, LinuxHopperPublisher, retryLinuxHopperPublisherCleanup, decodeUtf8, releaseFailure, launcherIdentity;
function init_LinuxHopperPublisher() {
	return (init_LinuxHopperPublisher = __esmMin((() => {
		init_ArtifactResourceScope();
		init_ArtifactReader();
		init_homeDirectory();
		init_result();
		init_StableFileHash();
		init_OwnedRegularFile();
		init_BoundedFileBytes();
		init_DetachedPgpSignature();
		init_ExecFileOutput();
		init_PrivateRuntimeRoot();
		init_ProviderDeadline();
		init_HopperLease();
		init_HopperDownload();
		init_HopperReleaseFeed();
		init_RegularFileRead();
		RELEASE_METADATA_BYTES = 1024 * 1024;
		RELEASE_METADATA_TIMEOUT_MS = 1e4;
		cacheRecordSchema = z.object({
			format: z.literal("rea-signed-hopper-release-v1"),
			family: z.enum([
				"deb",
				"rpm",
				"arch"
			]),
			release: z.unknown()
		});
		pendingCleanup = new Set();
		packageProofs = new Map();
		liveLauncherProofs = new Map();
		retainProof = (cache, key, proof) => {
			cache.delete(key);
			cache.set(key, proof);
			const oldest = cache.keys().next().value;
			if (cache.size > 8 && oldest !== undefined) cache.delete(oldest);
		};
		linuxHopperReleaseCacheDirectory = (environment) => {
			try {
				const supplied = environment.XDG_CACHE_HOME || undefined;
				if (supplied !== undefined && !isAbsolute(supplied)) return err(new HopperReleaseError("verification_unavailable", "XDG_CACHE_HOME must be an absolute filesystem path."));
				return ok(join(supplied ?? join(homeDirectoryFromEnvironment(environment, "linux"), ".cache"), "rea", "hopper-releases"));
			} catch (cause) {
				return err(new HopperReleaseError("verification_unavailable", "The Hopper release cache location could not be resolved.", { cause }));
			}
		};
		LinuxHopperPublisher = class {
			environment;
			packageFamily;
			#resources = new ArtifactResourceScope();
			#feed;
			constructor(environment, packageFamily) {
				this.environment = environment;
				this.packageFamily = packageFamily;
			}
			get cacheRoot() {
				const location = linuxHopperReleaseCacheDirectory(this.environment);
				if (!location.ok) throw location.error;
				return location.value;
			}
			async currentRelease(family, signal) {
				try {
					signal?.throwIfAborted();
					if (this.#feed === undefined) {
						const response = await downloadHopperPackage(HOPPER_RELEASES_URL, {
							...signal === undefined ? {} : { signal },
							maxBytes: RELEASE_METADATA_BYTES,
							timeoutMs: RELEASE_METADATA_TIMEOUT_MS
						});
						if (!response.ok) throw new HopperReleaseError("release_metadata", "The official Hopper release feed is unavailable.");
						this.#feed = parseLinuxHopperReleases(JSON.parse(decodeUtf8(response.bytes)));
					}
					if (!this.#feed.ok) return this.#feed;
					return this.#feed.value[family];
				} catch (cause) {
					return err(releaseFailure(cause, signal, "release_metadata"));
				}
			}
			async verifyArchive(family, release, archive, signal, suppliedPublicKey) {
				return this.#runOperation(signal, (resources) => this.#verifyArchive(family, release, archive, signal, suppliedPublicKey, resources));
			}
			async #verifyArchive(family, release, archive, signal, suppliedPublicKey, resources) {
				try {
					const bytes = await this.#read(archive, HOPPER_DOWNLOAD_BYTES, signal, resources);
					if (bytes.length !== Number(release.file_length) || createHash("sha1").update(bytes).digest("hex") !== release.file_hash) return err(new HopperReleaseError("integrity", "The Hopper package does not match the selected release bytes."));
					let publicKey = suppliedPublicKey;
					if (publicKey === undefined) {
						const response = await downloadHopperPackage(HOPPER_PUBLIC_KEY_URL, {
							...signal === undefined ? {} : { signal },
							maxBytes: RELEASE_METADATA_BYTES,
							timeoutMs: RELEASE_METADATA_TIMEOUT_MS
						});
						if (!response.ok) throw new HopperReleaseError("verification_unavailable", "The official Hopper public key is unavailable.");
						publicKey = decodeUtf8(response.bytes);
					}
					const packageSha256 = createHash("sha256").update(bytes).digest("hex");
					const proofKey = createHash("sha256").update(JSON.stringify([
						family,
						packageSha256,
						publicKey,
						release.signature,
						release.main_exe_hash
					])).digest("hex");
					signal?.throwIfAborted();
					const existingProof = packageProofs.get(proofKey);
					if (existingProof !== undefined) return ok({
						release,
						family,
						packageSha256,
						publicKey,
						...existingProof
					});
					const verified = await verifyDetachedPgpSignature(bytes, Buffer.from(release.signature, "base64"), publicKey, HOPPER_LINUX_PRIMARY_FINGERPRINT, signal);
					if (!verified.ok) return err(new HopperReleaseError(verified.error.reason === "cancelled" ? "cancelled" : "publisher_verification_failed", verified.error.message, { cause: verified.error }));
					const mainExeHash = await this.#withTemporary(async (root, temporaryResources) => {
						const snapshot = join(root, "package");
						await writeFile(snapshot, bytes, {
							flag: "wx",
							mode: 384
						});
						return this.#packageLauncherHash(family, snapshot, root, signal, temporaryResources);
					});
					if (mainExeHash !== release.main_exe_hash) return err(new HopperReleaseError("integrity", `The signed ${family} package launcher SHA-256 ${mainExeHash} differs from the release main_exe_hash ${release.main_exe_hash}.`));
					retainProof(packageProofs, proofKey, verified.value);
					return ok({
						release,
						family,
						packageSha256,
						publicKey,
						...verified.value
					});
				} catch (cause) {
					return err(releaseFailure(cause, signal, "verification_unavailable"));
				}
			}
			/** Durable evidence contains the signed bytes; an editable digest receipt cannot authorize a build. */
			async retainVerifiedArchive(verified, archive, signal) {
				return this.#runOperation(signal, (resources) => this.#retainVerifiedArchive(verified, archive, signal, resources));
			}
			async #retainVerifiedArchive(verified, archive, signal, resources) {
				try {
					signal?.throwIfAborted();
					await mkdir(this.cacheRoot, {
						recursive: true,
						mode: 448
					});
					const parent = await lstat(this.cacheRoot);
					if (!parent.isDirectory() || parent.isSymbolicLink() || parent.uid !== process.getuid?.()) throw new HopperReleaseError("verification_unavailable", "The Hopper release cache is not a caller-owned directory.");
					const target = join(this.cacheRoot, verified.release.main_exe_hash);
					const lease = await this.#acquireCacheLease(verified.release.main_exe_hash, signal);
					await this.#withOwnedResource({
						kind: "lease",
						resource: lease.socketPath ?? "hopper-release-cache-lease",
						lease
					}, async () => {
						signal?.throwIfAborted();
						await this.#withTemporary(async (stage, temporaryResources) => {
							await copyFile(archive, join(stage, "archive"));
							if ((await this.#hashFileWithResources(join(stage, "archive"), signal, temporaryResources)).sha256 !== verified.packageSha256) throw new HopperReleaseError("integrity", "The verified package changed before cache retention.");
							await writeFile(join(stage, "public-key.asc"), verified.publicKey, {
								flag: "wx",
								mode: 384
							});
							await writeFile(join(stage, "release.json"), JSON.stringify({
								format: "rea-signed-hopper-release-v1",
								family: verified.family,
								release: verified.release
							}) + "\n", {
								flag: "wx",
								mode: 384
							});
							await this.#publishCacheStage(stage, target, verified.release.main_exe_hash, signal, resources);
						}, this.cacheRoot);
					});
					return ok(undefined);
				} catch (cause) {
					return err(releaseFailure(cause, signal, "verification_unavailable"));
				}
			}
			async #publishCacheStage(stage, target, digest, signal, resources) {
				const existing = await this.#cachedPackage(digest, signal, resources);
				if (existing.ok) return;
				if (existing.error.reason === "cache_missing") {
					await rename(stage, target);
					return;
				}
				if (![
					"integrity",
					"release_metadata",
					"publisher_verification_failed"
				].includes(existing.error.reason)) throw existing.error;
				signal?.throwIfAborted();
				const previous = await lstat(target);
				if (!previous.isDirectory() || previous.isSymbolicLink() || previous.uid !== process.getuid?.()) throw existing.error;
				const backup = `${target}.backup-${randomUUID()}`;
				await rename(target, backup);
				try {
					const moved = await lstat(backup);
					if (moved.dev !== previous.dev || moved.ino !== previous.ino) throw new Error("The Hopper cache entry changed during repair.");
					await rename(stage, target);
				} catch (cause) {
					const replacement = await this.#cachedPackage(digest, signal, resources);
					if (replacement.ok) return;
					await this.#failedCachePublication(target, backup, [cause, replacement.error], replacement.error.reason === "cleanup_failed");
				}
			}
			async #acquireCacheLease(digest, signal) {
				const deadline = performance.now() + 12e4;
				const runId = randomUUID();
				let delay = 25;
				while (true) {
					signal?.throwIfAborted();
					const acquired = await acquireHopperReleaseCacheLease({
						cacheDirectory: this.cacheRoot,
						launcherSha256: digest,
						runId
					});
					if (acquired.acquired) return acquired.lease;
					const remaining = deadline - performance.now();
					if (remaining <= 0) throw new HopperReleaseError("verification_unavailable", "Another approved Hopper setup still owns this release cache. Retry after it finishes.");
					await waitForAbortableDelay(Math.min(delay, remaining), signal);
					delay = Math.min(delay * 2, 200);
				}
			}
			async #failedCachePublication(target, backup, causes, cleanupFailed = false) {
				let preserved = backup;
				try {
					await rename(backup, target);
					preserved = target;
				} catch (cause) {
					causes.push(cause);
				}
				throw new HopperReleaseError(cleanupFailed ? "cleanup_failed" : "verification_unavailable", `The Hopper cache repair did not finish; previous evidence is preserved at ${preserved}. Retry approved setup.`, { cause: new AggregateError(causes, "Hopper cache publication and recovery outcomes") });
			}
			async inspectLauncher(path, signal) {
				return this.#runOperation(signal, (resources) => this.#inspectLauncher(path, signal, resources));
			}
			async #inspectLauncher(path, signal, resources) {
				try {
					const observed = await this.#hashFileWithResources(path, signal, resources);
					const cached = await this.#cachedPackage(observed.sha256, signal, resources);
					if (cached.ok) {
						if ((await this.#hashFileWithResources(path, signal, resources)).sha256 !== observed.sha256) return err(new HopperReleaseError("integrity", "The Hopper launcher changed during publisher verification."));
						return ok(launcherIdentity(cached.value, "signed_package_cache"));
					}
					if (cached.error.reason !== "cache_missing") return cached;
					signal?.throwIfAborted();
					const processProof = liveLauncherProofs.get(observed.sha256);
					if (processProof !== undefined) return ok({
						...processProof,
						source: "verified_process_cache"
					});
					const family = await this.packageFamily();
					if (family === undefined) return err(new HopperReleaseError("verification_unavailable", "No native Linux package family is available for Hopper publisher verification."));
					const selected = await this.currentRelease(family, signal);
					if (!selected.ok) return selected;
					if (selected.value.main_exe_hash !== observed.sha256) return err(new HopperReleaseError("unsupported_hopper_build", "The selected Hopper launcher does not match an authenticated cached release or the official current Linux demo."));
					const verified = await this.#withTemporary(async (root, temporaryResources) => {
						const response = await downloadHopperPackage(selected.value.filename, signal === undefined ? {} : { signal });
						if (!response.ok) throw new HopperReleaseError("download", "The official Hopper package is unavailable for publisher verification.");
						const archive = join(root, "archive");
						await writeFile(archive, response.bytes, {
							flag: "wx",
							mode: 384
						});
						const verified = await this.#verifyArchive(family, selected.value, archive, signal, undefined, temporaryResources);
						if (!verified.ok) throw verified.error;
						return verified.value;
					});
					if ((await this.#hashFileWithResources(path, signal, resources)).sha256 !== observed.sha256) return err(new HopperReleaseError("integrity", "The Hopper launcher changed during publisher verification."));
					const identity = launcherIdentity(verified, "signed_vendor_release");
					retainProof(liveLauncherProofs, observed.sha256, identity);
					return ok(identity);
				} catch (cause) {
					return err(releaseFailure(cause, signal, "verification_unavailable"));
				}
			}
			async close() {
				try {
					await this.#resources.close();
					pendingCleanup.delete(this.#resources);
				} catch (cause) {
					pendingCleanup.add(this.#resources);
					throw cause;
				}
			}
			/** Admit once at the publisher boundary; file reads use this operation's child scope. */
			async #runOperation(signal, operation) {
				try {
					return await this.#resources.run(async () => {
						const resources = new ArtifactResourceScope();
						let result;
						try {
							result = await operation(resources);
						} catch (cause) {
							result = err(releaseFailure(cause, signal, "verification_unavailable"));
						}
						const cleanup = await resources.close().then(() => ({ ok: true }), (cause) => ({
							ok: false,
							cause
						}));
						if (!cleanup.ok) {
							const owner = {
								kind: "lease",
								resource: "hopper-publisher-operation-resources",
								lease: { release: () => resources.close() }
							};
							this.#resources.retain(owner);
							pendingCleanup.add(this.#resources);
							throw new HopperReleaseError("cleanup_failed", "Hopper publisher retained operation resource cleanup.", { cause: new AggregateError(result.ok ? [cleanup.cause] : [result.error, cleanup.cause], "Publisher operation and resource cleanup outcomes") });
						}
						return result;
					});
				} catch (cause) {
					return err(releaseFailure(cause, signal, "verification_unavailable"));
				}
			}
			/** Hash an installed launcher under this publisher's cleanup lifetime. */
			async hashLauncher(path) {
				const result = await this.#runOperation(undefined, async (resources) => ok((await this.#hashFileWithResources(path, undefined, resources)).sha256));
				if (!result.ok) throw result.error;
				return result.value;
			}
			async #hashFileWithResources(path, signal, resources) {
				let retainedOwner;
				try {
					return await hashStableFile(path, {
						...signal === undefined ? {} : { signal },
						retainFailedClose: (handle) => {
							retainedOwner = {
								kind: "file-handle",
								resource: path,
								handle
							};
							resources.retain(retainedOwner);
							if (resources === this.#resources) pendingCleanup.add(resources);
						}
					});
				} catch (cause) {
					if (!(cause instanceof RegularFileCleanupFailure)) throw cause;
					const hashFailure = cause;
					const owner = retainedOwner ?? {
						kind: "file-handle",
						resource: path,
						handle: hashFailure.owner
					};
					const released = await resources.release(owner);
					if (released.kind === "failed") {
						if (resources === this.#resources) pendingCleanup.add(resources);
						throw new HopperReleaseError("cleanup_failed", `Hopper publisher retained file descriptor cleanup for ${path}.`, { cause: new AggregateError([cause, released.cause], "Stable file hash and descriptor cleanup failed", { cause }) });
					}
					if (hashFailure.outcome.kind === "failed") {
						if (regularFileCancellation(hashFailure) !== undefined) throw hashFailure.outcome.cause;
						throw new StableFileHashFailure(path, hashFailure.outcome.cause);
					}
					const cancellation = regularFileCancellation(hashFailure);
					if (cancellation !== undefined) throw new RegularFileCancelled(path, hashFailure.owner, {
						outcome: hashFailure.outcome,
						reason: cancellation.reason
					});
					return hashFailure.outcome.value;
				}
			}
			async #cachedPackage(digest, signal, resources) {
				try {
					const root = join(this.cacheRoot, digest);
					try {
						const directory = await lstat(root);
						if (!directory.isDirectory() || directory.isSymbolicLink()) throw new HopperReleaseError("integrity", "The retained Hopper cache entry is not a regular directory.");
					} catch (cause) {
						if (cause instanceof Error && Reflect.get(cause, "code") === "ENOENT") {
							return err(new HopperReleaseError("cache_missing", "No retained signed Hopper package identifies this launcher.", { cause }));
						}
						throw cause;
					}
					for (const name of [
						"release.json",
						"public-key.asc",
						"archive"
					]) await this.#assertCacheFile(join(root, name));
					const metadata = await this.#read(join(root, "release.json"), RELEASE_METADATA_BYTES, signal, resources);
					let value;
					try {
						value = JSON.parse(decodeUtf8(metadata));
					} catch (cause) {
						throw new HopperReleaseError("release_metadata", "The retained Hopper package metadata is malformed.", { cause });
					}
					const parsed = cacheRecordSchema.safeParse(value);
					if (!parsed.success) throw new HopperReleaseError("release_metadata", "The retained Hopper package metadata is malformed.");
					const release = parseLinuxHopperRelease(parsed.data.release, parsed.data.family);
					if (!release.ok) return release;
					if (release.value.main_exe_hash !== digest) throw new HopperReleaseError("integrity", "The retained Hopper metadata does not identify this launcher.");
					const keyBytes = await this.#read(join(root, "public-key.asc"), RELEASE_METADATA_BYTES, signal, resources);
					let key;
					try {
						key = decodeUtf8(keyBytes);
					} catch (cause) {
						throw new HopperReleaseError("publisher_verification_failed", "The retained Hopper public key is malformed.", { cause });
					}
					return this.#verifyArchive(parsed.data.family, release.value, join(root, "archive"), signal, key, resources);
				} catch (cause) {
					return err(releaseFailure(cause, signal, "verification_unavailable"));
				}
			}
			async #assertCacheFile(path) {
				try {
					const stats = await lstat(path);
					if (!stats.isFile() || stats.isSymbolicLink()) throw new HopperReleaseError("integrity", `Required Hopper evidence is not a regular file: ${path}.`);
				} catch (cause) {
					if (cause instanceof Error && Reflect.get(cause, "code") === "ENOENT") throw new HopperReleaseError("integrity", `Required Hopper evidence is missing: ${path}.`, { cause });
					throw cause;
				}
			}
			async #packageLauncherHash(family, archive, root, signal, resources) {
				const commandOptions = {
					env: this.environment,
					signal,
					timeout: 12e4,
					stopSignal: "SIGKILL",
					maxBuffer: RELEASE_METADATA_BYTES
				};
				if (family === "rpm") {
					const output = await execFileOutput("rpm", [
						"-qp",
						"--nosignature",
						"--nodigest",
						"--qf",
						"%{FILEDIGESTALGO}\n[%{FILENAMES}	%{FILEDIGESTS}\n]",
						archive
					], commandOptions);
					const rows = output.stdout.split("\n");
					if (rows.shift() !== "8") throw new HopperReleaseError("integrity", "The signed RPM header does not use SHA-256 file digests.");
					const matches = rows.filter((row) => row.startsWith("/opt/hopper/bin/Hopper	"));
					const digest = matches[0]?.split("	")[1];
					if (matches.length !== 1 || digest === undefined || !/^[a-f0-9]{64}$/u.test(digest)) throw new HopperReleaseError("integrity", "The signed RPM header has no unique Hopper launcher digest.");
					return digest;
				}
				const extracted = join(root, "extracted");
				await mkdir(extracted, { mode: 448 });
				if (family === "deb") await execFileOutput("dpkg-deb", [
					"--extract",
					archive,
					extracted
				], commandOptions);
				else await execFileOutput("tar", [
					"-xf",
					archive,
					"-C",
					extracted,
					"--",
					"opt/hopper/bin/Hopper"
				], commandOptions);
				return (await this.#hashFileWithResources(join(extracted, "opt", "hopper", "bin", "Hopper"), signal, resources)).sha256;
			}
			#read(path, limit, signal, resources) {
				return withRegularFile(path, async (handle, stats) => {
					if (stats.size > limit) throw new HopperReleaseError("integrity", "Retained Hopper evidence exceeds its resource byte budget.");
					const bytes = await readBoundedFileBytes(handle, stats.size, signal);
					if (bytes === undefined) throw new HopperReleaseError("integrity", "Retained Hopper evidence changed during inspection.");
					return bytes;
				}, {
					signal,
					symlinks: "reject",
					resources
				}).catch((cause) => {
					if (resources === this.#resources && cause instanceof RegularFileCleanupFailure) pendingCleanup.add(resources);
					throw cause;
				});
			}
			async #withTemporary(operation, parent) {
				const root = await PrivateRuntimeRoot.create({
					prefix: "rea-hopper-publisher-",
					...parent === undefined ? {} : { parent }
				});
				const temporaryResources = new ArtifactResourceScope();
				const dependency = {
					kind: "lease",
					resource: root.path,
					lease: { release: async () => {
						await temporaryResources.close();
						await root.close();
					} }
				};
				let outcome;
				try {
					outcome = {
						ok: true,
						value: await operation(root.path, temporaryResources)
					};
				} catch (cause) {
					outcome = {
						ok: false,
						cause
					};
				}
				const released = await temporaryResources.close().then(() => ({ ok: true }), (cause) => ({
					ok: false,
					cause
				}));
				if (!released.ok) {
					this.#resources.retain(dependency);
					pendingCleanup.add(this.#resources);
					throw new HopperReleaseError("cleanup_failed", `Hopper publisher verification retained temporary cleanup ownership for ${root.path}.`, { cause: new AggregateError(outcome.ok ? [released.cause] : [outcome.cause, released.cause], "Temporary operation and descendant cleanup outcomes") });
				}
				try {
					await root.close();
				} catch (cleanupCause) {
					this.#resources.retain(dependency);
					pendingCleanup.add(this.#resources);
					throw new HopperReleaseError("cleanup_failed", `Hopper publisher verification retained temporary cleanup ownership for ${root.path}.`, { cause: new AggregateError(outcome.ok ? [cleanupCause] : [outcome.cause, cleanupCause], "Temporary operation and cleanup outcomes") });
				}
				if (!outcome.ok) throw outcome.cause;
				return outcome.value;
			}
			async #withOwnedResource(owner, operation) {
				let outcome;
				try {
					outcome = {
						ok: true,
						value: await operation()
					};
				} catch (cause) {
					outcome = {
						ok: false,
						cause
					};
				}
				if (this.#resources.hasPending) {
					this.#resources.retain(owner);
					pendingCleanup.add(this.#resources);
					throw new HopperReleaseError("cleanup_failed", `Hopper publisher verification retained cleanup ownership for ${owner.resource}.`, { cause: new AggregateError(outcome.ok ? [] : [outcome.cause], "Publisher operation and descendant cleanup outcomes") });
				}
				const cleanup = await this.#resources.release(owner);
				if (cleanup.kind === "failed") {
					pendingCleanup.add(this.#resources);
					const causes = outcome.ok ? [cleanup.cause] : [outcome.cause, cleanup.cause];
					throw new HopperReleaseError("cleanup_failed", `Hopper publisher verification retained cleanup ownership for ${owner.resource}.`, { cause: new AggregateError(causes, "Publisher inspection and cleanup outcomes") });
				}
				if (!outcome.ok) throw outcome.cause;
				return outcome.value;
			}
		};
		retryLinuxHopperPublisherCleanup = async () => {
			const causes = [];
			const observations = [];
			for (const scope of pendingCleanup) {
				try {
					await scope.close();
					pendingCleanup.delete(scope);
				} catch (cause) {
					causes.push(cause);
					observations.push(ArtifactReaderFailure.cleanupObservation(cause, "hopper-publisher-verification"));
				}
			}
			if (causes.length > 0) {
				const cleanup = {
					reason: observations.map(({ reason }) => reason).join("; "),
					resources: [...new Set(observations.flatMap(({ resources }) => resources))]
				};
				throw new ArtifactReaderFailure("unavailable", `Hopper publisher cleanup remains incomplete: ${cleanup.resources.join(", ")}`, {
					cause: new AggregateError(causes, "Hopper publisher cleanup failures"),
					cleanup
				});
			}
		};
		decodeUtf8 = (bytes) => new TextDecoder("utf-8", { fatal: true }).decode(bytes);
		releaseFailure = (cause, signal, fallback) => {
			if (cause instanceof HopperReleaseError) return cause;
			if (cause instanceof ArtifactReaderFailure && cause.cleanup !== undefined) return new HopperReleaseError("cleanup_failed", "Hopper publisher cleanup remains incomplete.", { cause });
			const cancellation = regularFileCancellation(cause);
			if (cancellation !== undefined) return new HopperReleaseError("cancelled", "Hopper publisher verification was cancelled.", { cause: cancellation.reason });
			if (!(cause instanceof StableFileHashFailure) && signal?.aborted === true) return new HopperReleaseError("cancelled", "Hopper publisher verification was cancelled.", { cause });
			return new HopperReleaseError(fallback, "Hopper publisher verification could not complete.", { cause });
		};
		launcherIdentity = (verified, source) => ({
			sha256: verified.release.main_exe_hash,
			version: verified.release.version,
			primaryFingerprint: verified.primaryFingerprint,
			signingFingerprint: verified.signingFingerprint,
			source
		});
	})))();
}

//#endregion
//#region dist/application/LinuxHopper.js
var PACKAGE_MANAGER_OUTPUT_BYTES, linuxHopperInstallDisclosure, supportsReaHost, LinuxHopperTemporaryCleanupOwner, parseLinuxDistribution, readLinuxDistribution, installLinuxHopper, linuxHopperLauncherPath, REA_MANAGED_LINUX_HOPPER_LAUNCHER, systemLinuxHopperLauncherCandidates, linuxHopperLauncherCandidates, systemLinuxHopperInstallHost, systemLinuxHopperPublisher, inspectLinuxHopperLauncher, linuxSharedLibrariesAvailable, installSystemPackage, formatCommandForDisplay, linuxPackageManagerCommands, packageFamilyFor, versionAtLeast, isAbortCause;
function init_LinuxHopper() {
	return (init_LinuxHopper = __esmMin((() => {
		init_ExecFileBoundedOutput();
		init_ExecFileOutput();
		init_ArtifactReader();
		init_HopperDownload();
		init_OwnedRegularFile();
		init_result();
		init_HopperReleaseFeed();
		init_LinuxHopperPublisher();
		PACKAGE_MANAGER_OUTPUT_BYTES = 64 * 1024;
		linuxHopperInstallDisclosure = (family, isRoot) => {
			return {
				networkOrigins: [
					HOPPER_RELEASES_URL,
					HOPPER_PUBLIC_KEY_URL,
					HOPPER_DOWNLOAD_PREFIX
				],
				integrity: `Detached PGP signature · primary ${HOPPER_LINUX_PRIMARY_FINGERPRINT} · package byte identity and installed launcher SHA-256 from the official feed`,
				commands: linuxPackageManagerCommands(family, `<verified-hopper.${family}>`, isRoot).map(({ executable, args }) => formatCommandForDisplay(executable, args))
			};
		};
		supportsReaHost = (distribution) => distribution?.packageFamily !== undefined;
		LinuxHopperTemporaryCleanupOwner = class {
			pending = new Map();
			retain(failure) {
				this.pending.set(failure.path, failure);
			}
			async retry(cleanup) {
				const failures = [];
				for (const path of this.pending.keys()) {
					try {
						await cleanup(path);
						this.pending.delete(path);
					} catch (cause) {
						const reason = cause instanceof Error ? cause.message : String(cause);
						failures.push(`Linux Hopper temporary cleanup failed for ${path}: ${reason}`);
					}
				}
				return failures.length === 0 ? undefined : failures.join("; ");
			}
		};
		parseLinuxDistribution = (text) => {
			const fields = new Map();
			for (const line of text.split("\n")) {
				const match = /^([A-Z_]+)=(.*)$/u.exec(line.trim());
				if (match === null) continue;
				const key = match[1];
				const encoded = match[2];
				if (key === undefined || encoded === undefined) continue;
				const quote = encoded[0];
				const quoted = (quote === "'" || quote === "\"") && encoded.endsWith(quote);
				const value = !quoted ? encoded : quote === "'" ? encoded.slice(1, -1) : encoded.slice(1, -1).replace(/\\(["\\$`])/gu, "$1");
				fields.set(key, value);
			}
			const id = (fields.get("ID") ?? "unknown").toLowerCase();
			const versionId = fields.get("VERSION_ID");
			const packageFamily = packageFamilyFor(id, fields.get("ID_LIKE"));
			const hopperSetupSupported = packageFamily !== undefined && (id === "arch" || id === "cachyos" || id === "omarchy" && packageFamily === "arch" || id === "ubuntu" && versionAtLeast(versionId, 24) || id === "fedora" && versionAtLeast(versionId, 41) || id === "nobara" && versionAtLeast(versionId, 44));
			const identity = {
				id,
				...versionId === undefined ? {} : { versionId }
			};
			return hopperSetupSupported ? {
				...identity,
				packageFamily,
				hopperSetupSupported: true
			} : {
				...identity,
				packageFamily,
				hopperSetupSupported: false
			};
		};
		readLinuxDistribution = async () => {
			try {
				return parseLinuxDistribution(await readFile("/etc/os-release", "utf8"));
			} catch (cause) {
				void cause;
				return undefined;
			}
		};
		installLinuxHopper = async (host = systemLinuxHopperInstallHost(process.env), options = {}) => {
			if (options.signal?.aborted === true) return {
				status: "failed",
				reason: "cancelled"
			};
			const distribution = await host.distribution();
			if (distribution?.hopperSetupSupported !== true) return {
				status: "failed",
				reason: "unsupported_host"
			};
			let temporary;
			let result;
			try {
				result = await (async () => {
					const selected = await host.release(distribution.packageFamily, options.signal);
					if (!selected.ok) return {
						status: "failed",
						verificationFailure: selected.error,
						reason: selected.error.reason === "cancelled" ? "cancelled" : "release_metadata"
					};
					const release = selected.value;
					const archiveDownload = await host.download(release.filename, options);
					if (!archiveDownload.ok) return {
						status: "failed",
						reason: "download"
					};
					temporary = await host.createTemporaryDirectory();
					const archive = join(temporary, `hopper.${distribution.packageFamily}`);
					await host.writeArchive(archive, archiveDownload.bytes);
					const verified = await host.verifyArchive(distribution.packageFamily, release, archive, options.signal);
					if (!verified.ok) return {
						status: "failed",
						verificationFailure: verified.error,
						reason: verified.error.reason === "cache_missing" ? "verification_unavailable" : verified.error.reason
					};
					const retained = await host.retainVerifiedArchive(verified.value, archive, options.signal);
					if (!retained.ok) return {
						status: "failed",
						verificationFailure: retained.error,
						reason: retained.error.reason === "cache_missing" ? "verification_unavailable" : retained.error.reason
					};
					if (options.signal?.aborted === true) return {
						status: "failed",
						reason: "cancelled"
					};
					const install = await host.installPackage(distribution.packageFamily, archive);
					if (install.status === "failed") return {
						status: "failed",
						reason: "authorization_or_package_manager",
						packageFailure: install.failure
					};
					const launcherPath = "/opt/hopper/bin/Hopper";
					const launcherStatus = await host.launcherStatus(launcherPath, release.main_exe_hash);
					if (launcherStatus !== "ready") return {
						status: "failed",
						reason: launcherStatus === "missing" ? "launcher_missing" : launcherStatus
					};
					return {
						status: "installed",
						launcherPath
					};
				})();
			} catch (cause) {
				result = {
					status: "failed",
					reason: isAbortCause(cause) ? "cancelled" : "download"
				};
			}
			if (temporary === undefined) return result;
			try {
				await host.cleanup(temporary);
				return result;
			} catch (cause) {
				return {
					...result,
					cleanupFailure: {
						path: temporary,
						reason: cause instanceof Error ? cause.message : String(cause)
					}
				};
			}
		};
		linuxHopperLauncherPath = (home) => join(home, ".local/share/rea/hopper/bin/Hopper");
		REA_MANAGED_LINUX_HOPPER_LAUNCHER = "/opt/hopper/bin/Hopper";
		systemLinuxHopperLauncherCandidates = ["/opt/hopper-v4/bin/hopper", "/usr/bin/hopper"];
		linuxHopperLauncherCandidates = (home) => [
			REA_MANAGED_LINUX_HOPPER_LAUNCHER,
			linuxHopperLauncherPath(home),
			...systemLinuxHopperLauncherCandidates
		];
		systemLinuxHopperInstallHost = (environment) => {
			const publisher = systemLinuxHopperPublisher(environment);
			return {
				distribution: readLinuxDistribution,
				release: (family, signal) => publisher.currentRelease(family, signal),
				download: downloadHopperPackage,
				createTemporaryDirectory: () => mkdtemp(join(tmpdir(), "rea-hopper-")),
				writeArchive: (path, bytes) => writeFile(path, bytes, { mode: 384 }),
				installPackage: (family, archive) => installSystemPackage(family, archive, environment),
				verifyArchive: (family, release, archive, signal) => publisher.verifyArchive(family, release, archive, signal),
				retainVerifiedArchive: (verified, archive, signal) => publisher.retainVerifiedArchive(verified, archive, signal),
				async launcherStatus(path, expectedSha256) {
					try {
						await access(path);
						const linked = await execFileOutput("ldd", [path], { env: environment });
						if (!linuxSharedLibrariesAvailable(`${linked.stdout}\n${linked.stderr}`)) return "runtime_dependencies";
						return await publisher.hashLauncher(path) === expectedSha256 ? "ready" : "unsupported_hopper_build";
					} catch (cause) {
						if (cause instanceof RegularFileCleanupFailure || cause instanceof HopperReleaseError && cause.reason === "cleanup_failed" || cause instanceof ArtifactReaderFailure && cause.cleanup !== undefined) return "cleanup_failed";
						void cause;
						return "missing";
					}
				},
				cleanup: (path) => rm(path, {
					recursive: true,
					force: true
				}),
				close: async () => {
					await publisher.close();
					await retryLinuxHopperPublisherCleanup();
				}
			};
		};
		systemLinuxHopperPublisher = (environment) => new LinuxHopperPublisher(environment, async () => (await readLinuxDistribution())?.packageFamily);
		inspectLinuxHopperLauncher = async (path, environment, signal) => {
			const publisher = systemLinuxHopperPublisher(environment);
			const result = await publisher.inspectLauncher(path, signal);
			try {
				await publisher.close();
				await retryLinuxHopperPublisherCleanup();
				return result;
			} catch (cause) {
				return err(new HopperReleaseError("cleanup_failed", "Hopper publisher verification retains incomplete cleanup.", { cause: new AggregateError(result.ok ? [cause] : [result.error, cause], "Publisher verification outcomes") }));
			}
		};
		linuxSharedLibrariesAvailable = (output) => !/(?:=>\s+not found|error while loading shared libraries)/iu.test(output);
		installSystemPackage = async (family, archive, environment) => {
			for (const command of linuxPackageManagerCommands(family, archive, process.getuid?.() === 0)) {
				const output = await execFileBoundedOutput(command.executable, command.args, {
					env: environment,
					limit: PACKAGE_MANAGER_OUTPUT_BYTES
				});
				if (output.exitCode !== 0) {
					return {
						status: "failed",
						failure: {
							command: formatCommandForDisplay(command.executable, command.args),
							exitCode: output.exitCode,
							stdout: output.stdout,
							stderr: output.stderr,
							outputTruncated: output.outputTruncated
						}
					};
				}
			}
			return { status: "installed" };
		};
		formatCommandForDisplay = (executable, args) => [executable, ...args].map((part) => /^[A-Za-z0-9_./:@%+=,-]+$/u.test(part) ? part : JSON.stringify(part)).join(" ");
		linuxPackageManagerCommands = (family, archive, isRoot) => {
			const runtimeDependencies = family === "deb" ? [
				"xvfb",
				"xauth",
				"python3",
				"libx11-6",
				"libxtst6"
			] : family === "rpm" ? [
				"xorg-x11-server-Xvfb",
				"xorg-x11-xauth",
				"python3",
				"libX11",
				"libXtst"
			] : [
				"xorg-server-xvfb",
				"xorg-xauth",
				"python",
				"libx11",
				"libxtst"
			];
			const commands = family === "deb" ? [[
				"apt-get",
				"install",
				"-y",
				archive,
				...runtimeDependencies
			]] : family === "rpm" ? [[
				"dnf",
				"install",
				"-y",
				archive,
				...runtimeDependencies
			]] : [[
				"pacman",
				"-S",
				"--needed",
				"--noconfirm",
				...runtimeDependencies
			], [
				"pacman",
				"-U",
				"--noconfirm",
				archive
			]];
			return commands.map((command) => {
				const executable = isRoot ? command[0] : "pkexec";
				if (executable === undefined) throw new Error("package command is empty");
				return {
					executable,
					args: isRoot ? command.slice(1) : command
				};
			});
		};
		packageFamilyFor = (id, idLike) => {
			const identities = new Set([id, ...idLike?.toLowerCase().split(/\s+/u) ?? []]);
			if (identities.has("ubuntu") || identities.has("debian")) return "deb";
			if (identities.has("fedora") || identities.has("rhel")) return "rpm";
			if (identities.has("arch")) return "arch";
			return undefined;
		};
		versionAtLeast = (version, minimum) => version !== undefined && Number.parseInt(version.split(".")[0] ?? "0", 10) >= minimum;
		isAbortCause = (cause) => cause instanceof Error && cause.name === "AbortError";
	})))();
}

//#endregion
//#region dist/process/SharedStartupAttempt.js
var STARTUP_OWNER_CLOSED, SharedStartupAttempt;
function init_SharedStartupAttempt() {
	return (init_SharedStartupAttempt = __esmMin((() => {
		init_AbortablePromise();
		STARTUP_OWNER_CLOSED = Symbol("provider startup owner closed");
		SharedStartupAttempt = class {
			#controller = new AbortController();
			promise;
			#signal;
			#waiters = 0;
			#settlement = { status: "pending" };
			constructor(start, ownerSignal) {
				this.#signal = ownerSignal === undefined ? this.#controller.signal : AbortSignal.any([ownerSignal, this.#controller.signal]);
				this.promise = start(this.#signal);
				void this.promise.then((value) => {
					this.#settlement = {
						status: "completed",
						value
					};
				}, () => {
					this.#settlement = { status: "rejected" };
				});
			}
			/** Signal consumed by the startup producer, never by an individual waiter. */
			get signal() {
				return this.#signal;
			}
			/** Completion includes the producer's final cleanup, not just its abort. */
			get settled() {
				return this.#settlement.status !== "pending";
			}
			/** Parsed completion facts are owned here, rather than copied into adapters. */
			get settlement() {
				return this.#settlement;
			}
			/** Stop startup when its owning provider closes, regardless of active waits. */
			close() {
				if (!this.settled) this.#controller.abort(STARTUP_OWNER_CLOSED);
			}
			/** A peer's departure leaves the producer running; final departure joins cleanup. */
			async wait(signal) {
				this.#waiters += 1;
				try {
					const waited = await waitForAbortable(this.promise, signal);
					if (waited !== ABORTED) return {
						status: "completed",
						value: waited
					};
					if (this.#waiters > 1) return { status: "cancelled" };
					if (!this.settled) this.#controller.abort(signal?.reason);
					return {
						status: "stopped",
						value: await this.promise
					};
				} finally {
					this.#waiters -= 1;
				}
			}
		};
	})))();
}

//#endregion
export { HOPPER_DOWNLOAD_BYTES, HOPPER_LINUX_PRIMARY_FINGERPRINT, LinuxHopperTemporaryCleanupOwner, REA_MANAGED_LINUX_HOPPER_LAUNCHER, STARTUP_OWNER_CLOSED, SharedStartupAttempt, acquireHopperTargetLease, acquireLinuxHopperApplicationLease, downloadHopperPackage, init_HopperDownload, init_HopperLease, init_HopperReleaseFeed, init_LinuxHopper, init_LinuxHopperPublisher, init_SharedStartupAttempt, inspectLinuxHopperLauncher, installLinuxHopper, linuxHopperInstallDisclosure, linuxHopperLauncherCandidates, linuxHopperReleaseCacheDirectory, linuxSharedLibrariesAvailable, readLinuxDistribution, retryLinuxHopperPublisherCleanup, supportsReaHost, systemLinuxHopperInstallHost, systemLinuxHopperLauncherCandidates };