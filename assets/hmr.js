const hotStates = {};

const globalState = {
  beforeUpdateCallbacks: {},
  afterUpdateCallbacks: {},
};

class HotState {
  constructor(id) {
    this.id = id;
    this.data = {}
  }

  dispose(cb) {
    this.disposeCallback = cb;
  }

  accept(cb = true) {
    this.acceptCallback = cb;
  }

  beforeUpdate(cb) {
    globalState.beforeUpdateCallbacks[this.id] = cb;
  }

  afterUpdate(cb) {
    globalState.afterUpdateCallbacks[this.id] = cb;
  }
}

const getHotState = id => {
  const existing = hotStates[id];
  if (existing) {
    return existing;
  }
  const state = new HotState(id);
  hotStates[id] = state;
  return state;
};

export const createHotContext = getHotState;

const serial = f => {
  let promise
  return (...args) => (promise = promise ? promise.then(() => f(...args)) : f(...args))
}

const applyUpdate = serial(async (event, id) => {
  if (event === 'add') {
    await import(id + `.proxy.js?mtime=${Date.now()}`);
    return true
  }

  const state = getHotState(id);
  const acceptCallback = state.acceptCallback;
  const disposeCallback = state.disposeCallback;

  delete globalState.afterUpdateCallbacks[id];
  delete globalState.beforeUpdateCallbacks[id];
  delete state.acceptCallback;
  delete state.disposeCallback;

  if (typeof disposeCallback === 'function') {
    await disposeCallback(state.data);
  }

  if (event === 'change') {
    if (!acceptCallback) return false;

    await import(id + `.proxy.js?mtime=${Date.now()}`);

    if (typeof acceptCallback === 'function') {
      await acceptCallback();
    }
  }

  return true;
})


const listeners = {};
export function apply(url, callback) {
  const fullUrl = url.split('?')[0];
  listeners[fullUrl] = callback;
}

const source = new EventSource('/livereload');

const reload = () => location.reload(true);

source.onerror = () => (source.onopen = reload);

source.onmessage = async (e) => {
  const data = JSON.parse(e.data);
  console.log(e.data);
  if (!data.url) {
    reload();
    return;
  }
  const fullUrl = window.location.origin + data.url.split('?')[0];
  console.log(fullUrl, listeners);
  if (fullUrl.endsWith('.js')) {
    applyUpdate(data.event, fullUrl)
      .then(ok => {
        if (!ok) reload();
      })
      .catch(err => {
        console.error(err)
        reload();
      })
  } else {
    const listener = listeners[fullUrl];
    if (!listener) {
      reload();
      return;
    }
    const response = await fetch(fullUrl);
    const code = await response.text();
    listener({code});
  }
};

console.log('[snowpack] listening for file changes');
