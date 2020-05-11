export function wrapEsmProxyResponse(url, code, ext, hasHmr = false) {
    if (ext === '.css') {
        return `
    const styleEl = document.createElement("style");
    styleEl.type = 'text/css';
    styleEl.appendChild(document.createTextNode(${JSON.stringify(code)}));
    document.head.appendChild(styleEl);
    ${hasHmr
            ? `
    import {apply} from '/web_modules/@snowpack/hmr.js';
    apply(window.location.origin + ${JSON.stringify(url)}, ({code}) => {
      styleEl.innerHtml = '';
      styleEl.appendChild(document.createTextNode(code));
    });
    `
            : ''}
  `;
    }
    if (!hasHmr)
        return code;
    return `
    import * as __SNOWPACK_HMR_API__ from '/web_modules/@snowpack/hmr.js';
    import.meta.hot = __SNOWPACK_HMR_API__.createHotContext(window.location.origin + ${JSON.stringify(url)});
  `.split('\n').map(x => x.trim()).join(' ') + code;
    // return `
    //   export * from ${JSON.stringify(url)};
    //   export {default} from ${JSON.stringify(url)};
    // `;
}
