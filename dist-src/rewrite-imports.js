const { parse } = require('es-module-lexer');
function spliceString(source, withSlice, start, end) {
    return source.slice(0, start) + (withSlice || '') + source.slice(end);
}
export async function scanCodeImportsExports(code) {
    const [imports] = await parse(code);
    return imports.filter((imp) => {
        //imp.d = -2 = import.meta.url = we can skip this for now
        if (imp.d === -2) {
            return false;
        }
        return true;
    });
}
export async function transformEsmImports(_code, replaceImport) {
    const imports = await scanCodeImportsExports(_code);
    let rewrittenCode = _code;
    for (const imp of imports.reverse()) {
        const spec = rewrittenCode.substring(imp.s, imp.e);
        const rewrittenImport = replaceImport(spec);
        rewrittenCode = spliceString(rewrittenCode, rewrittenImport, imp.s, imp.e);
    }
    return rewrittenCode;
}
