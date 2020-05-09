export declare const PIKA_CDN = "https://cdn.pika.dev";
export declare const CACHE_DIR: any;
export declare const RESOURCE_CACHE: string;
export declare const HAS_CDN_HASH_REGEX: RegExp;
export interface ImportMap {
    imports: {
        [packageName: string]: string;
    };
}
export declare function readLockfile(cwd: string): Promise<ImportMap | null>;
export declare function writeLockfile(loc: string, importMap: ImportMap): Promise<void>;
export declare function fetchCDNResource(resourceUrl: string, responseType?: 'text' | 'json' | 'buffer'): any;
export declare function isTruthy<T>(item: T | false | null | undefined): item is T;
/**
 * Given a package name, look for that package's package.json manifest.
 * Return both the manifest location (if believed to exist) and the
 * manifest itself (if found).
 *
 * NOTE: You used to be able to require() a package.json file directly,
 * but now with export map support in Node v13 that's no longer possible.
 */
export declare function resolveDependencyManifest(dep: string, cwd: string): any[];
/**
 * If Rollup erred parsing a particular file, show suggestions based on its
 * file extension (note: lowercase is fine).
 */
export declare const MISSING_PLUGIN_SUGGESTIONS: {
    [ext: string]: string;
};
