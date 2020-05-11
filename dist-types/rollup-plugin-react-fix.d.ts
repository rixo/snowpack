import { Plugin } from 'rollup';
/**
 * rollup-plugin-react-fix
 *
 * React is such a strange package, and causes some strange bug in
 * Rollup where this export is expected but missing. Adding it back
 * ourselves manually here.
 */
export declare function rollupPluginReactFix(): Plugin;
