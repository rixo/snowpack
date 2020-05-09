import { SnowpackConfig } from './config.js';
import { InstallTarget } from './scan-imports.js';
import { ImportMap } from './util.js';
interface InstallOptions {
    hasBrowserlistConfig: boolean;
    lockfile: ImportMap | null;
}
export declare function install(installTargets: InstallTarget[], { hasBrowserlistConfig, lockfile }: InstallOptions, config: SnowpackConfig): Promise<boolean | undefined>;
export declare function cli(args: string[]): Promise<void>;
export {};
