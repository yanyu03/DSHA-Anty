import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { join } from "node:path";
import { readdirSync } from "node:fs";

//#region dist/application/MacHopperPaths.js
/** Yield canonical paths first; enumerate renamed bundles only if needed. */
function* macHopperLauncherCandidates(homeDirectory) {
	yield* macHopperCanonicalLauncherCandidates(homeDirectory);
	for (const root of macHopperApplicationRoots(homeDirectory)) yield* macHopperRenamedLauncherCandidates(homeDirectory, new Map([[root, localBundleNames(root)]]));
}
var MAC_HOPPER_APPLICATION_DIRECTORY, MAC_HOPPER_APPLICATION_NAME, MAC_HOPPER_USER_APPLICATIONS_DIRECTORY, MAC_HOPPER_SYSTEM_LAUNCHER, macHopperUserApplicationPath, macHopperApplicationRoots, macHopperCanonicalLauncherCandidates, macHopperRenamedLauncherCandidates, localBundleNames;
function init_MacHopperPaths() {
	return (init_MacHopperPaths = __esmMin((() => {
		MAC_HOPPER_APPLICATION_DIRECTORY = "/Applications";
		MAC_HOPPER_APPLICATION_NAME = "Hopper Disassembler.app";
		MAC_HOPPER_USER_APPLICATIONS_DIRECTORY = "Applications";
		MAC_HOPPER_SYSTEM_LAUNCHER = join(MAC_HOPPER_APPLICATION_DIRECTORY, MAC_HOPPER_APPLICATION_NAME, "Contents/MacOS/hopper");
		macHopperUserApplicationPath = (homeDirectory) => join(homeDirectory, MAC_HOPPER_USER_APPLICATIONS_DIRECTORY, MAC_HOPPER_APPLICATION_NAME);
		macHopperApplicationRoots = (homeDirectory) => [MAC_HOPPER_APPLICATION_DIRECTORY, join(homeDirectory, MAC_HOPPER_USER_APPLICATIONS_DIRECTORY)];
		macHopperCanonicalLauncherCandidates = (homeDirectory) => [MAC_HOPPER_SYSTEM_LAUNCHER, join(macHopperUserApplicationPath(homeDirectory), "Contents/MacOS/hopper")];
		macHopperRenamedLauncherCandidates = (homeDirectory, bundleNamesByRoot) => macHopperApplicationRoots(homeDirectory).flatMap((root) => [...new Set(bundleNamesByRoot.get(root) ?? [])].filter((name) => /^Hopper.*\.app$/iu.test(name) && name.toLocaleLowerCase("en-US") !== "Hopper Disassembler.app".toLocaleLowerCase("en-US")).sort().map((name) => join(root, name, "Contents/MacOS/hopper")));
		localBundleNames = (root) => {
			try {
				return readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isDirectory() && /^Hopper.*\.app$/iu.test(entry.name)).map(({ name }) => name);
			} catch (cause) {
				void cause;
				return [];
			}
		};
	})))();
}

//#endregion
export { MAC_HOPPER_SYSTEM_LAUNCHER, init_MacHopperPaths, macHopperApplicationRoots, macHopperCanonicalLauncherCandidates, macHopperLauncherCandidates, macHopperRenamedLauncherCandidates, macHopperUserApplicationPath };