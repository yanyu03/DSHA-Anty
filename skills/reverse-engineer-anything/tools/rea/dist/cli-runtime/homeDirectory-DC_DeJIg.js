import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { userInfo } from "node:os";

//#region dist/config/homeDirectory.js
var firstNonempty, homeDirectoryFromEnvironment;
function init_homeDirectory() {
	return (init_homeDirectory = __esmMin((() => {
		firstNonempty = (...values) => values.find((value) => value !== undefined && value.length > 0);
		homeDirectoryFromEnvironment = (environment, platform) => {
			const windowsDriveHome = environment.HOMEDRIVE !== undefined && environment.HOMEDRIVE.length > 0 && environment.HOMEPATH !== undefined && environment.HOMEPATH.length > 0 ? `${environment.HOMEDRIVE}${environment.HOMEPATH}` : undefined;
			const selected = platform === "win32" ? firstNonempty(environment.USERPROFILE, windowsDriveHome, environment.HOME) : firstNonempty(environment.HOME, environment.USERPROFILE);
			return selected ?? userInfo().homedir;
		};
	})))();
}

//#endregion
export { homeDirectoryFromEnvironment, init_homeDirectory };