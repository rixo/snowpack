import { Plugin } from 'rollup';
export declare type EnvVarReplacements = Record<string, string | number | true>;
export declare type DevScript = {
    cmd: string;
    watch: string | undefined;
};
export declare type DevScripts = {
    [id: string]: DevScript;
};
export interface SnowpackConfig {
    extends?: string;
    include?: string;
    exclude: string[];
    knownEntrypoints: string[];
    webDependencies?: {
        [packageName: string]: string;
    };
    scripts: DevScripts;
    devOptions: {
        port: number;
        out: string;
        dist: string;
        fallback: string;
        bundle: boolean;
        hot: boolean;
    };
    installOptions: {
        dest: string;
        clean: boolean;
        env: EnvVarReplacements;
        installTypes: boolean;
        sourceMap?: boolean | 'inline';
        externalPackage: string[];
        alias: {
            [key: string]: string;
        };
    };
    rollup: {
        plugins: Plugin[];
        dedupe?: string[];
        namedExports?: {
            [filepath: string]: string[];
        };
    };
}
export interface CLIFlags extends Omit<Partial<SnowpackConfig['installOptions']>, 'env'> {
    help?: boolean;
    version?: boolean;
    reload?: boolean;
    config?: string;
    env?: string[];
    bundle?: boolean;
}
export declare function loadAndValidateConfig(flags: CLIFlags, pkgManifest: any): SnowpackConfig;
