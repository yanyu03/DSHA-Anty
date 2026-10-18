import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { PRODUCT_IDENTITY, compareUnicodeCodePoints, err, init_identity, init_result, init_unicodeCodePointOrder, ok } from "./reconstructionObligationLedgerSchemas-Bi6sect1.js";
import { ConfigurationError, init_configurationErrors } from "./errorSchemas-Ixz_q7qt.js";
import { RegularFileCleanupFailure, init_OwnedRegularFile } from "./OwnedRegularFile-D1f5nUCx.js";
import { init_RegularFileRead, readRegularFileText } from "./RegularFileRead-mbgGYtxe.js";
import { classifyClientRegistrationCommand, clientEvidencePaths, clientRegistrationPackageReference, init_ClientRegistrationIdentity, init_SupportedClients, init_environment, manualRegistrationRemediation, npxRegistrationCommand, packageRunnerRegistrationCommand, parseEnvironment, parseEnvironmentValues, supportedClients } from "./SupportedClients-DMafjitv.js";
import { CURRENT_ENTRYPOINT_PATH, init_CurrentEntrypointPath } from "./CurrentEntrypointPath-m7QCIVN0.js";
import { MCP_STARTUP_POLICY, init_mcpStartupPolicy, mcpProviderDeadlineAllowanceMs, recommendedMcpToolTimeoutMs, recommendedMcpToolTimeoutSeconds } from "./mcpStartupPolicy-imCbM3qo.js";
import { clientConfigurationValuesEqual, clientRegistrationEntry, clientServerForcedEnabled, clientServerListedDisabled, dshDocument, effectiveClientServer, geminiServerPolicyBlock, init_ClientConfigurationDocument, init_DshCordisPatch, parseClientConfiguration, parseGeminiMcpPolicy } from "./ClientConfigurationDocument-C9T8MNGc.js";
import { z } from "zod";
import { dirname, isAbsolute, resolve } from "node:path";
import { lstat, realpath, stat } from "node:fs/promises";
import { valid } from "semver";
import { stripComments } from "jsonc-parser";

//#region dist/application/ClientRegistrationEnvironment.js
var clientRegistrationEnvironment, clientRegistrationEnvironmentDetails, validatedDetails;
function init_ClientRegistrationEnvironment() {
	return (init_ClientRegistrationEnvironment = __esmMin((() => {
		init_environment();
		init_configurationErrors();
		init_result();
		init_ClientConfigurationDocument();
		init_identity();
		init_unicodeCodePointOrder();
		init_DshCordisPatch();
		clientRegistrationEnvironment = (parsed, overrides = {}, validation = "effective") => {
			if (parsed?.dialect === "dsh") return dshDocument(parsed.document).environment(overrides, validation);
			const details = clientRegistrationEnvironmentDetails(parsed, overrides, validation);
			return details.ok ? ok(details.value.values) : details;
		};
		clientRegistrationEnvironmentDetails = (parsed, overrides = {}, validation = "effective", resolveProviderRequestBudget) => {
			if (parsed?.dialect === "dsh") {
				const environment = dshDocument(parsed.document).environment(overrides, validation);
				if (!environment.ok) return environment;
				return validatedDetails(environment.value, validation, resolveProviderRequestBudget);
			}
			const key = parsed?.dialect === "opencode" || parsed?.dialect === "opencode_v2" ? "environment" : "env";
			const registration = parsed === undefined ? undefined : effectiveClientServer(parsed, PRODUCT_IDENTITY.mcpServerKey);
			const raw = typeof registration === "object" && registration !== null ? Reflect.get(registration, key) : undefined;
			const existing = z.record(z.string(), z.string()).safeParse(raw === undefined ? {} : raw);
			if (!existing.success) return err(new ConfigurationError("Invalid REA server environment", { settings: existing.error.issues.map((issue) => ({
				setting: [key, ...issue.path].join("."),
				constraint: "Server environment must be an object containing only string values"
			})) }));
			const environment = {
				...existing.data,
				...overrides
			};
			return validatedDetails(environment, validation, resolveProviderRequestBudget);
		};
		validatedDetails = (environment, validation, resolveProviderRequestBudget) => {
			const validated = validation === "fragment" ? parseEnvironmentValues(environment) : parseEnvironment(environment);
			if (!validated.ok) return validated;
			const providerRequestBudget = resolveProviderRequestBudget?.(validated.value.REA_ANALYSIS_PROVIDER, environment) ?? ok(undefined);
			if (!providerRequestBudget.ok) return providerRequestBudget;
			return ok({
				values: Object.fromEntries(Object.entries(environment).sort(([left], [right]) => compareUnicodeCodePoints(left, right))),
				timeoutInputs: {
					analysisProvider: validated.value.REA_ANALYSIS_PROVIDER,
					ghidraStartupTimeoutMs: validated.value.REA_GHIDRA_STARTUP_TIMEOUT_MS,
					hopperStartupTimeoutMs: validated.value.REA_HOPPER_STARTUP_TIMEOUT_MS,
					...validated.value.REA_JEB_MCP_TIMEOUT_MS === undefined ? {} : { jebMcpTimeoutMs: validated.value.REA_JEB_MCP_TIMEOUT_MS },
					...providerRequestBudget.value === undefined ? {} : { providerRequestTimeoutMs: providerRequestBudget.value }
				}
			});
		};
	})))();
}

//#endregion
//#region dist/application/ClientConfigurationFiles.js
var invalidEnvironment, readConfigurationText, readConfigurationFile, readClientConfigurationFiles, mergeConfigurationValue, isObject, effectiveClientConfiguration, readEffectiveClientRegistrationConfiguration;
function init_ClientConfigurationFiles() {
	return (init_ClientConfigurationFiles = __esmMin((() => {
		init_result();
		init_RegularFileRead();
		init_ClientConfigurationDocument();
		init_ClientRegistrationEnvironment();
		invalidEnvironment = (path, error) => ({
			kind: "malformed",
			path,
			detail: `Configuration ${path} has an invalid REA server environment: ${error.settings.map(({ setting, constraint }) => `${setting}: ${constraint}`).join("; ")}. Repair it before rerunning setup.`
		});
		readConfigurationText = async (path, resources) => {
			try {
				return ok(await readRegularFileText(path, resources === undefined ? {} : { resources }));
			} catch (cause) {
				if (cause instanceof Error && "code" in cause && cause.code === "ENOENT") return ok(undefined);
				return err({
					kind: "unreadable",
					path,
					detail: `Configuration ${path} could not be read: ${cause instanceof Error ? cause.message : String(cause)}`,
					...cause instanceof RegularFileCleanupFailure ? { cleanupFailure: cause } : {}
				});
			}
		};
		readConfigurationFile = async (path, format, resources) => {
			const source = await readConfigurationText(path, resources);
			if (!source.ok) return source;
			const content = source.value;
			if (content === undefined) return ok(undefined);
			try {
				return ok(parseClientConfiguration(content, format));
			} catch (cause) {
				return err({
					kind: "malformed",
					path,
					detail: `Configuration ${path} is malformed: ${cause instanceof Error ? cause.message : String(cause)}`
				});
			}
		};
		readClientConfigurationFiles = async (client, resources) => {
			const documents = [];
			for (const path of client.configPaths ?? [client.configPath]) {
				const document = await readConfigurationFile(path, client.format, resources);
				if (!document.ok) return document;
				if (document.value !== undefined) {
					const environment = clientRegistrationEnvironment(document.value, {}, "fragment");
					if (!environment.ok) return err(invalidEnvironment(path, environment.error));
					documents.push({
						...document.value,
						sourcePath: path
					});
				}
			}
			const environment = clientRegistrationEnvironment(effectiveClientConfiguration(documents));
			if (!environment.ok) return err(invalidEnvironment(client.configPath, environment.error));
			return ok(documents);
		};
		mergeConfigurationValue = (previous, next) => {
			if (!isObject(previous) || !isObject(next)) return next;
			return Object.fromEntries([...new Set([...Object.keys(previous), ...Object.keys(next)])].map((key) => [key, Object.hasOwn(next, key) ? mergeConfigurationValue(previous[key], next[key]) : previous[key]]));
		};
		isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
		effectiveClientConfiguration = (sources, target) => {
			const documents = target === undefined ? sources : (target.client.configPaths ?? [target.client.configPath]).flatMap((path) => {
				const document = path === target.client.configPath ? target.document : sources.find(({ sourcePath }) => sourcePath === path);
				return document === undefined ? [] : [document];
			});
			const last = documents.at(-1);
			if (last === undefined) return undefined;
			if (documents.length === 1) return last;
			const servers = {};
			for (const document of documents) {
				const names = new Set([...Object.keys(document.legacyServers), ...Object.keys(document.servers)]);
				for (const name of names) servers[name] = mergeConfigurationValue(servers[name], effectiveClientServer(document, name));
			}
			return {
				...last,
				servers,
				legacyServers: {}
			};
		};
		readEffectiveClientRegistrationConfiguration = async (client, resources) => {
			const nativeSources = await readClientConfigurationFiles(client, resources);
			if (!nativeSources.ok) return nativeSources;
			const nativeDocument = effectiveClientConfiguration(nativeSources.value);
			const fallbackPath = client.format === "zcode" ? client.zcodeFallbackPath : undefined;
			if (fallbackPath === undefined || nativeDocument !== undefined && Object.keys(nativeDocument.servers).length > 0) return ok({
				document: nativeDocument,
				configPath: client.configPath
			});
			const fallbackClient = {
				...client,
				configPath: fallbackPath,
				configPaths: [fallbackPath],
				format: "zcode_fallback"
			};
			const fallbackSources = await readClientConfigurationFiles(fallbackClient, resources);
			if (!fallbackSources.ok) return fallbackSources;
			const fallbackDocument = effectiveClientConfiguration(fallbackSources.value);
			return ok(fallbackDocument === undefined ? {
				document: nativeDocument,
				configPath: client.configPath
			} : {
				document: fallbackDocument,
				configPath: fallbackPath
			});
		};
	})))();
}

//#endregion
//#region dist/application/GeminiClientSettings.js
var folderTrustSchema, trustRulesSchema, sourceFailure, normalizedPath, workspaceTrusted, readClientPolicyBlock;
function init_GeminiClientSettings() {
	return (init_GeminiClientSettings = __esmMin((() => {
		init_result();
		init_identity();
		init_ClientRegistrationIdentity();
		init_ClientConfigurationDocument();
		init_ClientConfigurationFiles();
		folderTrustSchema = z.object({ security: z.object({ folderTrust: z.object({ enabled: z.boolean().optional() }).passthrough().optional() }).passthrough().optional() }).passthrough();
		trustRulesSchema = z.record(z.string(), z.enum([
			"TRUST_FOLDER",
			"TRUST_PARENT",
			"DO_NOT_TRUST"
		]));
		sourceFailure = (path, cause) => ({
			kind: "malformed",
			path,
			detail: `Gemini settings in ${path} are malformed: ${cause instanceof Error ? cause.message : String(cause)}`
		});
		normalizedPath = async (path, platform) => {
			const physical = await realpath(path).catch(() => path);
			const absolute = resolve(physical).replaceAll("\\", "/");
			return platform === "win32" || platform === "darwin" ? absolute.toLowerCase() : absolute;
		};
		workspaceTrusted = async (settings, sources, resources) => {
			let enabled = true;
			for (const { path, document } of sources) {
				const parsed = folderTrustSchema.safeParse(document.document);
				if (!parsed.success) return err(sourceFailure(path, parsed.error));
				enabled = parsed.data.security?.folderTrust?.enabled ?? enabled;
			}
			if (settings.trustOverride !== undefined) return ok(settings.trustOverride);
			if (!enabled) return ok(true);
			const text = await readConfigurationText(settings.trustedFoldersPath, resources);
			if (!text.ok) return text;
			if (text.value === undefined) return ok(false);
			let rules;
			try {
				rules = trustRulesSchema.parse(JSON.parse(stripComments(text.value)));
			} catch (cause) {
				return err(sourceFailure(settings.trustedFoldersPath, cause));
			}
			const workspace = await normalizedPath(settings.workspaceDirectory, settings.platform);
			let longest = -1;
			let trusted = false;
			for (const [path, level] of Object.entries(rules)) {
				const effective = await normalizedPath(level === "TRUST_PARENT" ? dirname(path) : path, settings.platform);
				if ((workspace === effective || workspace.startsWith(effective.endsWith("/") ? effective : `${effective}/`)) && path.length > longest) {
					longest = path.length;
					trusted = level !== "DO_NOT_TRUST";
				}
			}
			return ok(trusted);
		};
		readClientPolicyBlock = async (client, userDocument, desiredRegistration, resources) => {
			if (client.name !== "gemini_cli" || client.geminiSettings === undefined) return ok(undefined);
			const settings = client.geminiSettings;
			const sources = [];
			const higher = [];
			for (const path of [
				settings.defaultsPath,
				client.configPath,
				settings.systemPath
			]) {
				const parsed = path === client.configPath && userDocument !== undefined ? ok(userDocument) : await readConfigurationFile(path, "json", resources);
				if (!parsed.ok) return parsed;
				if (parsed.value !== undefined) sources.push({
					path,
					document: parsed.value
				});
			}
			const workspace = await normalizedPath(settings.workspaceDirectory, settings.platform);
			const home = await normalizedPath(dirname(dirname(client.configPath)), settings.platform);
			if (workspace !== home) {
				const path = resolve(settings.workspaceDirectory, ".gemini", "settings.json");
				const present = await stat(path).then(() => ok(true), (cause) => cause instanceof Error && "code" in cause && cause.code === "ENOENT" ? ok(false) : err({
					kind: "unreadable",
					path,
					detail: `Configuration ${path} could not be read: ${cause instanceof Error ? cause.message : String(cause)}`
				}));
				if (!present.ok) return present;
				const includeWorkspace = present.value ? await workspaceTrusted(settings, sources, resources) : ok(false);
				if (!includeWorkspace.ok) return includeWorkspace;
				if (includeWorkspace.value) {
					const document = await readConfigurationFile(path, "json", resources);
					if (!document.ok) return document;
					if (document.value !== undefined) {
						const source = {
							path,
							document: document.value
						};
						const systemIndex = sources.findIndex((item) => item.path === settings.systemPath);
						sources.splice(systemIndex < 0 ? sources.length : systemIndex, 0, source);
						higher.push(source);
					}
				}
			}
			const system = sources.find(({ path }) => path === settings.systemPath);
			if (system !== undefined) higher.push(system);
			const policies = [];
			for (const { path, document } of sources) {
				try {
					policies.push(parseGeminiMcpPolicy(document));
				} catch (cause) {
					return err(sourceFailure(path, cause));
				}
			}
			const policy = geminiServerPolicyBlock(policies, PRODUCT_IDENTITY.mcpServerKey);
			if (policy !== undefined) return ok(`${policy} Settings sources: ${sources.map(({ path }) => path).join(", ")}.`);
			const override = higher.findLast(({ document }) => Object.hasOwn(document.servers, PRODUCT_IDENTITY.mcpServerKey));
			const desired = desiredRegistration ?? userDocument?.servers[PRODUCT_IDENTITY.mcpServerKey] ?? clientRegistrationEntry("json", npxRegistrationCommand(), {});
			if (override !== undefined && !clientConfigurationValuesEqual(override.document.servers[PRODUCT_IDENTITY.mcpServerKey], desired)) return ok(`Gemini mcpServers.${PRODUCT_IDENTITY.mcpServerKey} in ${override.path} overrides the user registration. Review that settings file before rerunning setup; REA does not modify system or workspace settings.`);
			return ok(undefined);
		};
	})))();
}

//#endregion
//#region dist/application/ClientRegistrationStatus.js
var tomlTimeoutSchema, registrationSchema, readClientRegistrationStatuses, readClientRegistrationInspections, registrationActivation, registrationAligned, parseRegistration, remediation, unknownEntryPointRemediation, configuredStatus, timeoutAdvisory, exactRegisteredPackageVersion, packageVersionRemediation, unavailableStatus, clientEvidencePresent, isMissing;
function init_ClientRegistrationStatus() {
	return (init_ClientRegistrationStatus = __esmMin((() => {
		init_GeminiClientSettings();
		init_ClientConfigurationFiles();
		init_ClientConfigurationDocument();
		init_result();
		init_RegularFileRead();
		init_identity();
		init_CurrentEntrypointPath();
		init_mcpStartupPolicy();
		init_ClientRegistrationIdentity();
		init_SupportedClients();
		init_unicodeCodePointOrder();
		init_DshCordisPatch();
		init_ClientRegistrationEnvironment();
		tomlTimeoutSchema = z.union([z.number().positive(), z.bigint().positive()]);
		registrationSchema = z.object({
			command: z.string().min(1),
			args: z.array(z.string()).default([]),
			startup_timeout_sec: tomlTimeoutSchema.optional(),
			tool_timeout_sec: tomlTimeoutSchema.optional(),
			startupTimeoutMs: z.number().positive().optional(),
			toolTimeoutMs: z.number().positive().optional(),
			type: z.string().optional(),
			transport: z.string().optional(),
			serverName: z.string().optional(),
			tools: z.array(z.string()).optional(),
			disabled: z.boolean().optional(),
			enabled: z.boolean().optional()
		}).passthrough();
		readClientRegistrationStatuses = async (home, currentCommandPath = CURRENT_ENTRYPOINT_PATH, options = {}) => (await readClientRegistrationInspections(home, currentCommandPath, options)).map(({ status }) => status);
		readClientRegistrationInspections = async (home, currentCommandPath = CURRENT_ENTRYPOINT_PATH, options = {}) => {
			const inspections = [];
			const record = (status, activation = "unknown") => {
				inspections.push({
					status,
					activation
				});
			};
			for (const client of supportedClients(home, options.platform, options.environment)) {
				if (client.configPathError !== undefined) {
					record({
						client: client.name,
						config_path: client.configPath,
						command: [],
						state: "invalid",
						remediation: client.configPathError
					});
					continue;
				}
				const presence = await clientEvidencePresent(client);
				if (!presence.ok) {
					record({
						client: client.name,
						config_path: presence.error.path,
						command: [],
						state: "invalid",
						remediation: presence.error.detail
					});
					continue;
				}
				if (!presence.value) continue;
				const manualRemediation = manualRegistrationRemediation(client.name);
				if (client.format === "unsupported") {
					if (manualRemediation !== undefined) record({
						client: client.name,
						config_path: client.markerPath ?? client.configPath,
						command: [],
						state: "manual",
						remediation: manualRemediation
					});
					continue;
				}
				let selectedConfigPath = client.configPath;
				try {
					const configuration = await readEffectiveClientRegistrationConfiguration(client, options.resources);
					if (!configuration.ok) {
						if (options.resources === undefined && configuration.error.cleanupFailure !== undefined) throw configuration.error.cleanupFailure;
						record({
							client: client.name,
							config_path: configuration.error.path,
							command: [],
							state: "invalid",
							remediation: configuration.error.detail
						});
						continue;
					}
					const { document: parsed, configPath } = configuration.value;
					selectedConfigPath = configPath;
					if (parsed === undefined) {
						record(unavailableStatus(client, "missing", configPath));
						continue;
					}
					const policy = await readClientPolicyBlock(client, parsed, undefined, options.resources);
					if (!policy.ok) {
						if (options.resources === undefined && policy.error.cleanupFailure !== undefined) throw policy.error.cleanupFailure;
						record({
							client: client.name,
							config_path: configPath,
							command: [],
							state: "invalid",
							remediation: policy.error.detail
						});
						continue;
					}
					const policyBlock = policy.value;
					const raw = effectiveClientServer(parsed, PRODUCT_IDENTITY.mcpServerKey);
					if (raw === undefined) {
						const editabilityError = parsed.dialect === "dsh" ? dshDocument(parsed.document).editabilityError : undefined;
						if (editabilityError !== undefined) {
							record({
								client: client.name,
								config_path: configPath,
								command: [],
								state: "invalid",
								remediation: editabilityError.message
							});
							continue;
						}
						record(unavailableStatus(client, "missing", configPath));
						continue;
					}
					const effectiveClient = parsed.dialect === "zcode_fallback" ? {
						...client,
						configPath,
						configPaths: [configPath],
						format: "zcode_fallback"
					} : client;
					const registration = parseRegistration(raw, effectiveClient);
					const registrationEnvironment = client.name === "kimi" || client.name === "codex" ? clientRegistrationEnvironmentDetails(parsed, {}, "effective", options.resolveProviderRequestBudget) : undefined;
					if (registrationEnvironment !== undefined && !registrationEnvironment.ok) {
						record({
							client: client.name,
							config_path: configPath,
							command: [],
							state: "invalid",
							remediation: registrationEnvironment.error.message
						});
						continue;
					}
					const command = [registration.command, ...registration.args];
					const packageReference = clientRegistrationPackageReference(command);
					const activation = registrationActivation(registration, client, parsed);
					const packageVersion = exactRegisteredPackageVersion(packageReference);
					const packageVersionDrift = packageVersion !== undefined && packageVersion !== PRODUCT_IDENTITY.packageVersion;
					const alignment = registrationAligned({
						registration,
						client: effectiveClient,
						currentCommandPath,
						platform: options.platform ?? process.platform,
						kimiInputSchemaProfileSelected: registrationEnvironment?.ok === true && registrationEnvironment.value.values.REA_MCP_INPUT_SCHEMA_PROFILE !== undefined
					});
					record(configuredStatus(effectiveClient, command, alignment === "unknown" ? "unknown" : activation === "enabled" && !packageVersionDrift && alignment === "aligned" && (parsed.dialect !== "dsh" || dshDocument(parsed.document).ready) && policyBlock === undefined ? "aligned" : "stale", policyBlock ?? (packageVersionDrift ? packageVersionRemediation(packageReference ?? "", client) : alignment === "unknown" ? unknownEntryPointRemediation() : undefined), packageReference, registrationEnvironment?.ok === true ? timeoutAdvisory(client, registration, registrationEnvironment.value.timeoutInputs) : undefined), activation);
				} catch (cause) {
					if (options.resources === undefined && cause instanceof RegularFileCleanupFailure) throw cause;
					record(unavailableStatus(client, isMissing(cause) ? "missing" : "invalid", selectedConfigPath));
				}
			}
			return inspections.sort((left, right) => compareUnicodeCodePoints(left.status.client, right.status.client));
		};
		registrationActivation = (registration, client, parsed) => client.format !== "grok" && registration.disabled === true || registration.enabled === false && !clientServerForcedEnabled(parsed, PRODUCT_IDENTITY.mcpServerKey) || (parsed.dialect === "zcode" || parsed.dialect === "zcode_fallback") && registration.enable === false || clientServerListedDisabled(parsed, PRODUCT_IDENTITY.mcpServerKey) ? "disabled" : "enabled";
		registrationAligned = ({ registration, client, currentCommandPath, platform, kimiInputSchemaProfileSelected }) => {
			const command = [registration.command, ...registration.args];
			const identity = classifyClientRegistrationCommand(command, currentCommandPath);
			if (identity === "unknown") return "unknown";
			if (identity === "foreign") return "stale";
			if (client.name === "grok_build" && registration.startup_timeout_sec !== MCP_STARTUP_POLICY.codexStartupTimeoutSeconds) return "stale";
			if (client.name === "codex" && (registration.startup_timeout_sec === undefined || registration.tool_timeout_sec === undefined)) return "stale";
			if (client.name === "kimi" && (registration.startupTimeoutMs === undefined || registration.toolTimeoutMs === undefined)) return "stale";
			if (client.name === "kimi" && !kimiInputSchemaProfileSelected) return "stale";
			if ((client.format === "kimi" || client.format === "omp" || client.format === "pi") && registration.type !== undefined && registration.type !== "stdio") return "stale";
			if (client.format === "vscode" && registration.type !== "stdio") return "stale";
			if (client.format === "dsh" && (registration.serverName !== "rea" || registration.transport !== "stdio")) return "stale";
			if (client.format === "copilot_cli" && (registration.type !== "stdio" || JSON.stringify(registration.tools) !== JSON.stringify(["*"]))) return "stale";
			if (client.format === "commandcode" && registration.transport !== "stdio") return "stale";
			if (["npx", "bunx"].some((runner) => {
				const expected = packageRunnerRegistrationCommand(runner, platform);
				return command.length === expected.length && command.every((argument, index) => argument === expected[index]);
			})) return "aligned";
			if (clientRegistrationPackageReference(command) !== undefined) return "stale";
			return isAbsolute(command[0] ?? "") ? "aligned" : "stale";
		};
		parseRegistration = (value, client) => {
			if (client.format === "dsh") return registrationSchema.pick({
				command: true,
				args: true,
				serverName: true,
				transport: true
			}).strip().parse(value);
			if (client.format === "opencode") {
				const entry = z.object({
					type: z.literal("local"),
					command: z.array(z.string()).min(1),
					environment: z.record(z.string(), z.string()).optional()
				}).passthrough().parse(value);
				const [command = "", ...args] = entry.command;
				return registrationSchema.parse({
					...entry,
					command,
					args
				});
			}
			const registration = registrationSchema.parse(value);
			if (client.format === "kimi" && registration.transport !== undefined && registration.transport !== "stdio") throw new TypeError("Expected an stdio registration");
			if ((client.format === "vscode" || client.format === "copilot_cli") && registration.type !== "stdio") throw new TypeError("Expected an stdio registration");
			if (client.format === "commandcode" && registration.transport !== "stdio") throw new TypeError("Expected an stdio registration");
			if ((client.format === "kimi" || client.format === "omp" || client.format === "pi") && registration.type !== undefined && registration.type !== "stdio") throw new TypeError("Expected an stdio registration");
			return registration;
		};
		remediation = (client) => {
			if (client.quitBeforeSetup !== true) return "Run rea setup to refresh this registration, then restart the client.";
			const name = client.displayName ?? client.name;
			return `Quit ${name} fully, run rea setup to refresh this registration, then start ${name} again. A running ${name} can rewrite its configuration from memory and drop the registration.`;
		};
		unknownEntryPointRemediation = () => "The existing registration was retained because its executable identity cannot be verified. Check the registered launcher path, symlink targets and access permissions. Run the installed REA CLI or a supported package runner, then rerun rea doctor; no registration was changed.";
		configuredStatus = (client, command, state, policyRemediation, packageReference, advisory) => state === "aligned" ? {
			client: client.name,
			config_path: client.configPath,
			command,
			...packageReference === undefined ? {} : { package_reference: packageReference },
			state,
			remediation: null,
			...advisory === undefined ? {} : { advisory }
		} : {
			client: client.name,
			config_path: client.configPath,
			command,
			...packageReference === undefined ? {} : { package_reference: packageReference },
			state,
			remediation: policyRemediation ?? remediation(client)
		};
		timeoutAdvisory = (client, registration, timeoutInputs) => {
			const toolTimeout = client.name === "kimi" ? registration.toolTimeoutMs : client.name === "codex" ? registration.tool_timeout_sec : undefined;
			if (toolTimeout === undefined) return undefined;
			const providerAllowance = mcpProviderDeadlineAllowanceMs(timeoutInputs);
			const isKimi = client.name === "kimi";
			const toolTimeoutMs = Number(toolTimeout) * (isKimi ? 1 : 1e3);
			if (toolTimeoutMs >= providerAllowance) return undefined;
			const setting = isKimi ? "toolTimeoutMs" : "tool_timeout_sec";
			const currentValue = isKimi ? `${String(toolTimeout)} ms` : `${String(toolTimeout)} seconds`;
			const recommendedValue = isKimi ? `${String(recommendedMcpToolTimeoutMs(timeoutInputs))} ms` : `${String(recommendedMcpToolTimeoutSeconds(timeoutInputs))} seconds`;
			const headroom = isKimi ? `${String(MCP_STARTUP_POLICY.toolOperationHeadroomMs)} ms` : `${String(MCP_STARTUP_POLICY.toolOperationHeadroomMs / 1e3)} seconds`;
			return `The configured ${setting} (${currentValue}) is shorter than REA's known provider allowance (${String(providerAllowance)} ms), so provider startup or an upstream request may exceed this client deadline. REA recommends ${setting} = ${recommendedValue} to cover that allowance plus ${headroom} of operation headroom; this additional headroom is a recommendation, not a guarantee for every analysis.`;
		};
		exactRegisteredPackageVersion = (packageReference) => {
			if (packageReference === undefined) return undefined;
			const prefix = `${PRODUCT_IDENTITY.packageName}@`;
			if (!packageReference.startsWith(prefix)) return undefined;
			const version = packageReference.slice(prefix.length);
			return valid(version) === version ? version : undefined;
		};
		packageVersionRemediation = (packageReference, client) => `This registration requests ${packageReference}, while the current REA CLI package is ${PRODUCT_IDENTITY.packageVersion}. REA does not resolve package-runner requests during doctor; update the registration with rea setup --client ${client.name}, then restart the client.`;
		unavailableStatus = (client, state, configPath = client.configPath) => ({
			client: client.name,
			config_path: configPath,
			command: [],
			state,
			remediation: remediation(client)
		});
		clientEvidencePresent = async (client) => {
			let unavailable;
			for (const path of clientEvidencePaths(client)) {
				try {
					await lstat(path);
					return ok(true);
				} catch (cause) {
					if (!isMissing(cause)) unavailable ??= {
						path,
						detail: `Client configuration evidence at ${path} could not be inspected: ${cause instanceof Error ? cause.message : String(cause)}. Check file permissions and rerun rea doctor.`
					};
				}
			}
			return unavailable === undefined ? ok(false) : err(unavailable);
		};
		isMissing = (cause) => cause instanceof Error && "code" in cause && cause.code === "ENOENT";
	})))();
}

//#endregion
export { clientRegistrationEnvironment, clientRegistrationEnvironmentDetails, effectiveClientConfiguration, init_ClientConfigurationFiles, init_ClientRegistrationEnvironment, init_ClientRegistrationStatus, init_GeminiClientSettings, readClientConfigurationFiles, readClientPolicyBlock, readClientRegistrationInspections, readClientRegistrationStatuses, readConfigurationText };