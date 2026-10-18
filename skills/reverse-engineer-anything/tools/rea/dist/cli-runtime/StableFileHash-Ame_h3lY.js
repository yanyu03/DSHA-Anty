import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { RegularFileCancelled, RegularFileChangedError, RegularFileCleanupFailure, RegularFileOperationCancelled, assertRegularFileActive, init_OwnedRegularFile, init_RegularFile, sameRegularFileState, withOwnedRegularFile } from "./OwnedRegularFile-D1f5nUCx.js";
import { createHash } from "node:crypto";
import { stat } from "node:fs/promises";

//#region dist/filesystem/StableFileHash.js
var StableFileHashFailure, stableFileHashCause, hashStableFile;
function init_StableFileHash() {
	return (init_StableFileHash = __esmMin((() => {
		init_OwnedRegularFile();
		init_RegularFile();
		StableFileHashFailure = class extends Error {
			path;
			cause;
			_tag = "StableFileHashFailure";
			constructor(path, cause) {
				super(`Could not hash ${path}: ${cause instanceof Error ? cause.message : String(cause)}`, { cause });
				this.path = path;
				this.cause = cause;
				this.name = this._tag;
			}
		};
		stableFileHashCause = (cause) => cause instanceof StableFileHashFailure ? cause.cause : cause;
		hashStableFile = async (path, options) => {
			try {
				return await withOwnedRegularFile(path, options, async (handle) => {
					const initial = await handle.stat();
					if (!Number.isSafeInteger(initial.size) || initial.size < 0) throw new RangeError(`Regular file size cannot be represented safely: ${path}`);
					const hash = createHash("sha256");
					const chunk = Buffer.allocUnsafe(64 * 1024);
					let position = 0;
					while (position <= initial.size) {
						assertRegularFileActive(options.signal);
						const length = Math.min(chunk.length, initial.size - position + 1);
						if (length <= 0) break;
						const read = await handle.read(chunk, 0, length, position);
						if (position + read.bytesRead > initial.size || read.bytesRead === 0 && position < initial.size) throw new RegularFileChangedError(path);
						assertRegularFileActive(options.signal);
						if (read.bytesRead === 0) break;
						hash.update(chunk.subarray(0, read.bytesRead));
						position += read.bytesRead;
					}
					assertRegularFileActive(options.signal);
					const [opened, currentPath] = await Promise.all([handle.stat(), stat(path)]);
					if (position !== initial.size || !sameRegularFileState(initial, opened) || !sameRegularFileState(initial, currentPath)) throw new RegularFileChangedError(path);
					assertRegularFileActive(options.signal);
					return {
						sha256: hash.digest("hex"),
						bytes: position
					};
				});
			} catch (cause) {
				if (cause instanceof RegularFileCleanupFailure || cause instanceof RegularFileCancelled || cause instanceof RegularFileOperationCancelled) throw cause;
				throw new StableFileHashFailure(path, cause);
			}
		};
	})))();
}

//#endregion
export { StableFileHashFailure, hashStableFile, init_StableFileHash, stableFileHashCause };