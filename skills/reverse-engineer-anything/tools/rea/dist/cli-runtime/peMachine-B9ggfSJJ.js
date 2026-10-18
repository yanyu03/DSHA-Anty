import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { err, init_result, ok } from "./reconstructionObligationLedgerSchemas-Bi6sect1.js";

//#region dist/domain/elfFixedHeader.js
var readElfFixedHeader, elfArchitecture;
function init_elfFixedHeader() {
	return (init_elfFixedHeader = __esmMin((() => {
		init_result();
		readElfFixedHeader = (bytes, totalBytes = bytes.length) => {
			if (bytes.length >= 4 && bytes.toString("hex", 0, 4) !== "7f454c46") return err("not an ELF image");
			if (bytes.length < 16) return err("ELF identification is truncated");
			const classByte = bytes[4];
			if (classByte !== 1 && classByte !== 2) return err("unsupported ELF class");
			const dataByte = bytes[5];
			if (dataByte !== 1 && dataByte !== 2) return err("unsupported ELF endianness");
			if (bytes[6] !== 1) return err("unsupported ELF identification version");
			const elfClass = classByte === 1 ? 32 : 64;
			const minimumSize = elfClass === 32 ? 52 : 64;
			if (!Number.isSafeInteger(totalBytes) || totalBytes < bytes.length || totalBytes < minimumSize || bytes.length < minimumSize) return err(`truncated ELF header: an ELF${elfClass} header needs ${minimumSize} bytes; the file has ${totalBytes}`);
			const littleEndian = dataByte === 1;
			const readU16 = (offset) => littleEndian ? bytes.readUInt16LE(offset) : bytes.readUInt16BE(offset);
			const readU32 = (offset) => littleEndian ? bytes.readUInt32LE(offset) : bytes.readUInt32BE(offset);
			if (readU32(20) !== 1) return err("unsupported ELF header version");
			const headerSize = readU16(elfClass === 32 ? 40 : 52);
			if (headerSize < minimumSize || headerSize > totalBytes) return err("invalid ELF header size");
			const machine = readU16(18);
			return ok({
				elfClass,
				byteOrder: littleEndian ? "little" : "big",
				headerSize,
				machine,
				architecture: elfArchitecture(machine) ?? null
			});
		};
		elfArchitecture = (machine) => {
			switch (machine) {
				case 3: return "x86";
				case 62: return "x86_64";
				case 8: return "mips";
				case 20: return "powerpc";
				case 40: return "arm";
				case 164: return "hexagon";
				case 183: return "arm64";
				case 243: return "riscv";
			}
			return undefined;
		};
	})))();
}

//#endregion
//#region dist/domain/peMachine.js
var architectureForMachine, peOptionalHeaderMagic, NATIVE_OS_OVERRIDES, decodePeMachine;
function init_peMachine() {
	return (init_peMachine = __esmMin((() => {
		architectureForMachine = (machine) => {
			switch (machine) {
				case 332: return "x86";
				case 34404: return "x86_64";
				case 448:
				case 450:
				case 452: return "arm";
				case 43620: return "arm64";
			}
			return undefined;
		};
		peOptionalHeaderMagic = (architecture) => architecture === "x86_64" || architecture === "arm64" ? 523 : 267;
		NATIVE_OS_OVERRIDES = [
			17988,
			44484,
			44485,
			31609,
			6547,
			6546
		];
		decodePeMachine = (machine) => {
			const direct = architectureForMachine(machine);
			if (direct !== undefined) return {
				architecture: direct,
				nativeOsOverride: false
			};
			for (const override of NATIVE_OS_OVERRIDES) {
				const architecture = architectureForMachine(machine ^ override);
				if (architecture !== undefined) return {
					architecture,
					nativeOsOverride: true
				};
			}
			return undefined;
		};
	})))();
}

//#endregion
export { decodePeMachine, init_elfFixedHeader, init_peMachine, peOptionalHeaderMagic, readElfFixedHeader };