'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var rollupPluginAlias = _interopDefault(require('@rollup/plugin-alias'));
var rollupPluginCommonjs = _interopDefault(require('@rollup/plugin-commonjs'));
var rollupPluginJson = _interopDefault(require('@rollup/plugin-json'));
var rollupPluginNodeResolve = _interopDefault(require('@rollup/plugin-node-resolve'));
var rollupPluginReplace = _interopDefault(require('@rollup/plugin-replace'));
var chalk = _interopDefault(require('chalk'));
var fs = require('fs');
var fs__default = _interopDefault(fs);
var isNodeBuiltin = _interopDefault(require('is-builtin-module'));
var mkdirp = _interopDefault(require('mkdirp'));
var ora = _interopDefault(require('ora'));
var path = _interopDefault(require('path'));
var rimraf = _interopDefault(require('rimraf'));
var rollup = require('rollup');
var validatePackageName = _interopDefault(require('validate-npm-package-name'));
var yargs = _interopDefault(require('yargs-parser'));
var events = require('events');
var execa = _interopDefault(require('execa'));
var npmRunPath = _interopDefault(require('npm-run-path'));
var glob = _interopDefault(require('glob'));
var ansiEscapes = _interopDefault(require('ansi-escapes'));
var util = _interopDefault(require('util'));
var http = _interopDefault(require('http'));
var mime = _interopDefault(require('mime-types'));
var url = _interopDefault(require('url'));
var os = _interopDefault(require('os'));
var CheapWatch = _interopDefault(require('cheap-watch'));
var cosmiconfig = require('cosmiconfig');
var jsonschema = require('jsonschema');
var deepmerge = require('deepmerge');
var cacache = _interopDefault(require('cacache'));
var PQueue = _interopDefault(require('p-queue'));
var got = _interopDefault(require('got'));
var cachedir = _interopDefault(require('cachedir'));
var tar = _interopDefault(require('tar'));
var zlib = _interopDefault(require('zlib'));
var babel = _interopDefault(require('@babel/core'));
var esModuleLexer = require('es-module-lexer');

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly) symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    });
    keys.push.apply(keys, symbols);
  }

  return keys;
}

function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};

    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }

  return target;
}

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;

  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }

  return target;
}

function _objectWithoutProperties(source, excluded) {
  if (source == null) return {};

  var target = _objectWithoutPropertiesLoose(source, excluded);

  var key, i;

  if (Object.getOwnPropertySymbols) {
    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);

    for (i = 0; i < sourceSymbolKeys.length; i++) {
      key = sourceSymbolKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
      target[key] = source[key];
    }
  }

  return target;
}

function getStateString(workerState, isWatch) {
  if (workerState.state) {
    if (Array.isArray(workerState.state)) {
      return chalk[workerState.state[1]](workerState.state[0]);
    }

    return chalk.dim(workerState.state);
  }

  if (workerState.done) {
    return workerState.error ? chalk.red('FAILED') : chalk.green('DONE');
  }

  if (isWatch) {
    if (workerState.config.watch) {
      return chalk.dim('WATCHING');
    }
  }

  return chalk.dim('READY');
}

const WORKER_BASE_STATE = {
  done: false,
  error: null,
  output: ''
};
function paint(bus, registeredWorkers, buildMode, devMode) {
  let consoleOutput = '';
  let hasBeenCleared = false;
  let missingWebModule = null;
  const allWorkerStates = {};

  for (const [workerId, config] of registeredWorkers) {
    allWorkerStates[workerId] = _objectSpread2(_objectSpread2({}, WORKER_BASE_STATE), {}, {
      config
    });
  }

  function repaint() {
    process.stdout.write(ansiEscapes.clearTerminal);
    process.stdout.write(`${chalk.bold('Snowpack')}\n\n`); // Dashboard

    if (devMode) {
      process.stdout.write(`  ${chalk.bold.cyan(`http://localhost:${devMode.port}`)}`);

      for (const ip of devMode.ips) {
        process.stdout.write(`${chalk.cyan(` > `)}${chalk.bold.cyan(`http://${ip}:${devMode.port}`)}`);
      }

      process.stdout.write('\n' + chalk.dim(`  Server started in ${devMode.startTimeMs}ms.\n\n`));
    }

    if (buildMode) {
      process.stdout.write('  ' + chalk.bold.cyan(buildMode.dest));
      process.stdout.write(chalk.dim(` Building your application...\n\n`));
    }

    for (const [workerId, config] of registeredWorkers) {
      const workerState = allWorkerStates[workerId];
      const dotLength = 24 - workerId.length;
      const dots = ''.padEnd(dotLength, '.');
      const stateStr = getStateString(workerState, !!devMode);
      process.stdout.write(`  ${workerId}${chalk.dim(dots)}[${stateStr}]\n`);
    }

    process.stdout.write('\n');

    if (missingWebModule) {
      let [missingPackageName, ...deepPackagePathParts] = missingWebModule.split('/');

      if (missingPackageName.startsWith('@')) {
        missingPackageName += '/' + deepPackagePathParts.shift();
      }

      process.stdout.write(`${chalk.red.underline.bold('▼ Snowpack')}\n\n`);
      process.stdout.write(`  Package ${chalk.bold(missingWebModule)} could not be found!\n`);
      process.stdout.write(`    1. Make sure that your ${chalk.bold('web_modules/')} directory is mounted correctly.\n`);

      if (deepPackagePathParts.length > 0) {
        process.stdout.write(`    2. Add ${chalk.bold(missingPackageName)} to your package.json "dependencies".\n`);
        process.stdout.write(`    3. Add ${chalk.bold('"' + missingWebModule + '"')} to your Snowpack "entrypoints".\n`);
      } else {
        process.stdout.write(`    2. Add ${chalk.bold(missingPackageName)} to your Snowpack "webDependencies".\n`);
      }

      process.stdout.write('\n');
    }

    for (const [workerId, config] of registeredWorkers) {
      const workerState = allWorkerStates[workerId];

      if (workerState && workerState.output) {
        const chalkFn = Array.isArray(workerState.error) ? chalk.red : chalk;
        process.stdout.write(`${chalkFn.underline.bold('▼ ' + workerId)}\n\n`);
        process.stdout.write(workerState.output ? '  ' + workerState.output.trim().replace(/\n/gm, '\n  ') : hasBeenCleared ? chalk.dim('  Output cleared.') : chalk.dim('  No output, yet.'));
        process.stdout.write('\n\n');
      }
    }

    if (consoleOutput) {
      process.stdout.write(`${chalk.underline.bold('▼ Console')}\n\n`);
      process.stdout.write(consoleOutput ? '  ' + consoleOutput.trim().replace(/\n/gm, '\n  ') : hasBeenCleared ? chalk.dim('  Output cleared.') : chalk.dim('  No output, yet.'));
      process.stdout.write('\n\n');
    }

    const overallStatus = Object.values(allWorkerStates).reduce((result, {
      done,
      error
    }) => {
      return {
        done: result.done && done,
        error: result.error || error
      };
    });

    if (overallStatus.error) {
      process.stdout.write(`${chalk.underline.red.bold('▼ Result')}\n\n`);
      process.stdout.write('  ⚠️  Finished, with errors.');
      process.stdout.write('\n\n');
      process.exit(1);
    } else if (overallStatus.done) {
      process.stdout.write(`${chalk.underline.green.bold('▶ Build Complete!')}\n\n`);
    }
  }

  bus.on('WORKER_MSG', ({
    id,
    msg
  }) => {
    allWorkerStates[id].output += msg;
    repaint();
  });
  bus.on('WORKER_UPDATE', ({
    id,
    state
  }) => {
    if (typeof state !== undefined) {
      allWorkerStates[id].state = state;
    }

    repaint();
  });
  bus.on('WORKER_COMPLETE', ({
    id,
    error
  }) => {
    allWorkerStates[id].state = null;
    allWorkerStates[id].done = true;
    allWorkerStates[id].error = allWorkerStates[id].error || error;
    repaint();
  });
  bus.on('WORKER_RESET', ({
    id
  }) => {
    allWorkerStates[id] = _objectSpread2(_objectSpread2({}, WORKER_BASE_STATE), {}, {
      config: allWorkerStates[id].config
    });
    repaint();
  });
  bus.on('CONSOLE', ({
    level,
    args
  }) => {
    consoleOutput += `[${level}] ${util.format.apply(util, args)}\n`;
    repaint();
  });
  bus.on('NEW_SESSION', () => {
    missingWebModule = null;

    if (consoleOutput) {
      consoleOutput = ``;
      hasBeenCleared = true;
      repaint();
    }
  });
  bus.on('MISSING_WEB_MODULE', ({
    specifier
  }) => {
    missingWebModule = specifier;
    repaint();
  }); // const rl = readline.createInterface({
  //   input: process.stdin,
  //   output: process.stdout,
  // });
  // rl.on('line', (input) => {
  //   for (const [workerId, config] of registeredWorkers) {
  //     if (!allWorkerStates[workerId].done && !allWorkerStates[workerId].state) {
  //       allWorkerStates[workerId].output = '';
  //     }
  //   }
  //   hasBeenCleared = true;
  //   repaint();
  // });
  // unmountDashboard = render(<App bus={bus} registeredWorkers={registeredWorkers} />).unmount;

  repaint();
}

var _srcFileExtensionMapping = {
  js: 'js',
  jsx: 'js',
  ts: 'js',
  tsx: 'js',
  vue: 'js',
  svelte: 'js'
};

const {
  parse
} = require('es-module-lexer');

function spliceString(source, withSlice, start, end) {
  return source.slice(0, start) + (withSlice || '') + source.slice(end);
}

async function scanCodeImportsExports(code) {
  const [imports] = await parse(code);
  return imports.filter(imp => {
    //imp.d = -2 = import.meta.url = we can skip this for now
    if (imp.d === -2) {
      return false;
    }

    return true;
  });
}
async function transformEsmImports(_code, replaceImport) {
  const imports = await scanCodeImportsExports(_code);
  let rewrittenCode = _code;

  for (const imp of imports.reverse()) {
    const spec = rewrittenCode.substring(imp.s, imp.e);
    const rewrittenImport = replaceImport(spec);
    rewrittenCode = spliceString(rewrittenCode, rewrittenImport, imp.s, imp.e);
  }

  return rewrittenCode;
}

const {
  copy
} = require('fs-extra');

async function command({
  cwd,
  config
}) {
  process.env.NODE_ENV = 'production';
  const messageBus = new events.EventEmitter();
  const allRegisteredWorkers = Object.entries(config.scripts);
  const relevantWorkers = [];
  const allWorkerPromises = [];
  const isBundled = config.devOptions.bundle;
  const finalDirectoryLoc = config.devOptions.out;
  const buildDirectoryLoc = isBundled ? path.join(cwd, `.build`) : config.devOptions.out;
  const distDirectoryLoc = path.join(buildDirectoryLoc, config.devOptions.dist);
  const dependencyImportMapLoc = path.join(config.installOptions.dest, 'import-map.json');

  const dependencyImportMap = require(dependencyImportMapLoc);

  if (allRegisteredWorkers.filter(([id]) => id.startsWith('build')).length === 0) {
    console.error(chalk.red(`No build scripts found, so nothing to build.`));
    console.error(`See https://www.snowpack.dev/#build-scripts for help configuring your build.`);
    return;
  }

  rimraf.sync(finalDirectoryLoc);
  mkdirp.sync(finalDirectoryLoc);

  if (finalDirectoryLoc !== buildDirectoryLoc) {
    rimraf.sync(buildDirectoryLoc);
    mkdirp.sync(buildDirectoryLoc);
  }

  const extToWorkerMap = {};

  for (const [id, workerConfig] of allRegisteredWorkers) {
    if (id.startsWith('build:') || id.startsWith('plugin:') || id.startsWith('lintall:') || id.startsWith('mount:')) {
      relevantWorkers.push([id, workerConfig]);
    }

    if (id.startsWith('build:') || id.startsWith('plugin:')) {
      const exts = id.split(':')[1].split(',');

      for (const ext of exts) {
        extToWorkerMap[ext] = extToWorkerMap[ext] || [];
        extToWorkerMap[ext].push([id, workerConfig]);
      }
    }
  }

  if (isBundled) {
    relevantWorkers.push(['bundle:*', {
      cmd: 'NA',
      watch: undefined
    }]);
  }

  console.log = (...args) => {
    messageBus.emit('CONSOLE', {
      level: 'log',
      args
    });
  };

  console.warn = (...args) => {
    messageBus.emit('CONSOLE', {
      level: 'warn',
      args
    });
  };

  console.error = (...args) => {
    messageBus.emit('CONSOLE', {
      level: 'error',
      args
    });
  };

  let relDest = path.relative(cwd, config.devOptions.out);

  if (!relDest.startsWith(`..${path.sep}`)) {
    relDest = `.${path.sep}` + relDest;
  }

  paint(messageBus, relevantWorkers, {
    dest: relDest
  }, undefined);

  for (const [id, workerConfig] of relevantWorkers) {
    if (!id.startsWith('lintall:')) {
      continue;
    }

    messageBus.emit('WORKER_UPDATE', {
      id,
      state: ['RUNNING', 'yellow']
    });
    const workerPromise = execa.command(workerConfig.cmd, {
      env: npmRunPath.env(),
      extendEnv: true,
      shell: true
    });
    allWorkerPromises.push(workerPromise);
    workerPromise.catch(err => {
      messageBus.emit('WORKER_MSG', {
        id,
        level: 'error',
        msg: err.toString()
      });
      messageBus.emit('WORKER_COMPLETE', {
        id,
        error: err
      });
    });
    workerPromise.then(() => {
      messageBus.emit('WORKER_COMPLETE', {
        id,
        error: null
      });
    });
    const {
      stdout,
      stderr
    } = workerPromise;
    stdout === null || stdout === void 0 ? void 0 : stdout.on('data', b => {
      let stdOutput = b.toString();

      if (stdOutput.includes('\u001bc') || stdOutput.includes('\x1Bc')) {
        messageBus.emit('WORKER_RESET', {
          id
        });
        stdOutput = stdOutput.replace(/\x1Bc/, '').replace(/\u001bc/, '');
      }

      if (id.endsWith(':tsc')) {
        if (stdOutput.includes('\u001bc') || stdOutput.includes('\x1Bc')) {
          messageBus.emit('WORKER_UPDATE', {
            id,
            state: ['RUNNING', 'yellow']
          });
        }

        if (/Watching for file changes./gm.test(stdOutput)) {
          messageBus.emit('WORKER_UPDATE', {
            id,
            state: 'WATCHING'
          });
        }

        const errorMatch = stdOutput.match(/Found (\d+) error/);

        if (errorMatch && errorMatch[1] !== '0') {
          messageBus.emit('WORKER_UPDATE', {
            id,
            state: ['ERROR', 'red']
          });
        }
      }

      messageBus.emit('WORKER_MSG', {
        id,
        level: 'log',
        msg: stdOutput
      });
    });
    stderr === null || stderr === void 0 ? void 0 : stderr.on('data', b => {
      messageBus.emit('WORKER_MSG', {
        id,
        level: 'error',
        msg: b.toString()
      });
    });
  }

  for (const [id, workerConfig] of relevantWorkers) {
    if (!id.startsWith('mount:')) {
      continue;
    }

    const cmdArr = workerConfig.cmd.split(/\s+/);

    if (cmdArr[0] !== 'mount') {
      throw new Error(`script[${id}] must use the mount command`);
    }

    cmdArr.shift();
    let dirUrl, dirDisk;

    if (cmdArr.length === 1) {
      dirDisk = path.resolve(cwd, cmdArr[0]);
      dirUrl = '/' + cmdArr[0];
    } else {
      const {
        to
      } = yargs(cmdArr);
      dirDisk = path.resolve(cwd, cmdArr[0]);
      dirUrl = to;
    }

    const destinationFile = dirUrl === '/' ? buildDirectoryLoc : path.join(buildDirectoryLoc, dirUrl);
    await copy(dirDisk, destinationFile).catch(err => {
      messageBus.emit('WORKER_MSG', {
        id,
        level: 'error',
        msg: err.toString()
      });
      messageBus.emit('WORKER_COMPLETE', {
        id,
        error: err
      });
      throw err;
    });
    messageBus.emit('WORKER_COMPLETE', {
      id,
      error: null
    });
  }

  if (config.include) {
    const allFiles = glob.sync(`${config.include}/**/*`, {
      nodir: true,
      ignore: [`${config.include}/**/__tests__`, `${config.include}/**/*.{spec,test}.*`]
    });

    for (const [id, workerConfig] of relevantWorkers) {
      if (!id.startsWith('build:') && !id.startsWith('plugin:')) {
        continue;
      }

      messageBus.emit('WORKER_UPDATE', {
        id,
        state: ['RUNNING', 'yellow']
      });

      for (const f of allFiles) {
        const fileExtension = path.extname(f).substr(1);

        if (!id.includes(`:${fileExtension}`) && !id.includes(`,${fileExtension}`)) {
          continue;
        }

        let {
          cmd
        } = workerConfig;

        if (id.startsWith('build:')) {
          const {
            stdout,
            stderr
          } = await execa.command(cmd, {
            env: npmRunPath.env(),
            extendEnv: true,
            shell: true,
            input: fs.createReadStream(f)
          });

          if (stderr) {
            console.error(stderr);
          }

          if (!stdout) {
            continue;
          }

          let outPath = f.replace(config.include, distDirectoryLoc);
          const extToFind = path.extname(f).substr(1);
          const extToReplace = _srcFileExtensionMapping[extToFind];

          if (extToReplace) {
            outPath = outPath.replace(new RegExp(`${extToFind}$`), extToReplace);
          }

          let code = stdout;

          if (path.extname(outPath) === '.js') {
            code = await transformEsmImports(code, spec => {
              if (spec.startsWith('http') || spec.startsWith('/')) {
                return spec;
              }

              if (spec.startsWith('./') || spec.startsWith('../')) {
                const ext = path.extname(spec).substr(1);

                if (!ext) {
                  return spec + '.js';
                }

                const extToReplace = _srcFileExtensionMapping[ext];

                if (extToReplace) {
                  return spec.replace(new RegExp(`${ext}$`), extToReplace);
                }

                return spec;
              }

              if (dependencyImportMap.imports[spec]) {
                return `/web_modules/${dependencyImportMap.imports[spec]}`;
              }

              messageBus.emit('MISSING_WEB_MODULE', {
                specifier: spec
              });
              return `/web_modules/${spec}.js`;
            });
          }

          await fs.promises.mkdir(path.dirname(outPath), {
            recursive: true
          });
          await fs.promises.writeFile(outPath, code);
        }

        if (id.startsWith('plugin:')) {
          const modulePath = require.resolve(cmd, {
            paths: [cwd]
          });

          const {
            build
          } = require(modulePath);

          try {
            var {
              result
            } = await build(f);
          } catch (err) {
            err.message = `[${id}] ${err.message}`;
            console.error(err);
            messageBus.emit('WORKER_COMPLETE', {
              id,
              error: err
            });
            continue;
          }

          let outPath = f.replace(config.include, distDirectoryLoc);
          const extToFind = path.extname(f).substr(1);
          const extToReplace = _srcFileExtensionMapping[extToFind];

          if (extToReplace) {
            outPath = outPath.replace(new RegExp(`${extToFind}$`), extToReplace);
          }

          let code = result;

          if (path.extname(outPath) === '.js') {
            code = await transformEsmImports(code, spec => {
              if (spec.startsWith('http') || spec.startsWith('/')) {
                return spec;
              }

              if (spec.startsWith('./') || spec.startsWith('../')) {
                const ext = path.extname(spec).substr(1);

                if (!ext) {
                  console.error(`${f}: Import ${spec} is missing a required file extension.`);
                  return spec;
                }

                const extToReplace = _srcFileExtensionMapping[ext];

                if (extToReplace) {
                  return spec.replace(new RegExp(`${ext}$`), extToReplace);
                }

                return spec;
              }

              return `/web_modules/${spec}.js`;
            });
          }

          await fs.promises.mkdir(path.dirname(outPath), {
            recursive: true
          });
          await fs.promises.writeFile(outPath, code);
        }
      }

      messageBus.emit('WORKER_COMPLETE', {
        id,
        error: null
      });
    }
  }

  await Promise.all(allWorkerPromises);

  if (isBundled) {
    var _bundleAppPromise$std, _bundleAppPromise$std2;

    messageBus.emit('WORKER_UPDATE', {
      id: 'bundle:*',
      state: ['RUNNING', 'yellow']
    });

    async function prepareBuildDirectoryForParcel() {
      // Prepare the new build directory by copying over all static assets
      // This is important since sometimes Parcel doesn't pick these up.
      await copy(buildDirectoryLoc, finalDirectoryLoc, {
        filter: srcLoc => {
          return !srcLoc.startsWith(buildDirectoryLoc + path.sep + 'web_modules') && !srcLoc.startsWith(buildDirectoryLoc + path.sep + config.devOptions.dist.substr(1));
        }
      }).catch(err => {
        messageBus.emit('WORKER_MSG', {
          id: 'bundle:*',
          level: 'error',
          msg: err.toString()
        });
        messageBus.emit('WORKER_COMPLETE', {
          id: 'bundle:*',
          error: err
        });
        throw err;
      });
      const tempBuildManifest = JSON.parse(await fs.promises.readFile(path.join(cwd, 'package.json'), {
        encoding: 'utf-8'
      }));
      delete tempBuildManifest.name;
      tempBuildManifest.devDependencies = tempBuildManifest.devDependencies || {};
      tempBuildManifest.devDependencies['@babel/core'] = tempBuildManifest.devDependencies['@babel/core'] || '^7.9.0';
      await fs.promises.writeFile(path.join(buildDirectoryLoc, 'package.json'), JSON.stringify(tempBuildManifest, null, 2));
      await fs.promises.writeFile(path.join(buildDirectoryLoc, '.babelrc'), `{"plugins": [["${require.resolve('@babel/plugin-syntax-import-meta')}"]]}`);
    }

    await prepareBuildDirectoryForParcel();
    const bundleAppPromise = execa('parcel', ['build', config.devOptions.fallback, '--out-dir', finalDirectoryLoc], {
      cwd: buildDirectoryLoc,
      env: npmRunPath.env(),
      extendEnv: true
    });
    (_bundleAppPromise$std = bundleAppPromise.stdout) === null || _bundleAppPromise$std === void 0 ? void 0 : _bundleAppPromise$std.on('data', b => {
      messageBus.emit('WORKER_MSG', {
        id: 'bundle:*',
        level: 'log',
        msg: b.toString()
      });
    });
    (_bundleAppPromise$std2 = bundleAppPromise.stderr) === null || _bundleAppPromise$std2 === void 0 ? void 0 : _bundleAppPromise$std2.on('data', b => {
      messageBus.emit('WORKER_MSG', {
        id: 'bundle:*',
        level: 'log',
        msg: b.toString()
      });
    });
    bundleAppPromise.catch(err => {
      messageBus.emit('WORKER_MSG', {
        id: 'bundle:*',
        level: 'error',
        msg: err.toString()
      });
      messageBus.emit('WORKER_COMPLETE', {
        id: 'bundle:*',
        error: err
      });
    });
    bundleAppPromise.then(() => {
      messageBus.emit('WORKER_COMPLETE', {
        id: 'bundle:*',
        error: null
      });
    });
    await bundleAppPromise;

    if (finalDirectoryLoc !== buildDirectoryLoc) {
      rimraf.sync(buildDirectoryLoc);
    }
  }
}

/**
 * This license applies to parts of this file originating from the
 * https://github.com/lukejacksonn/servor repository:
 *
 * MIT License
 * Copyright (c) 2019 Luke Jackson
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const LIVE_RELOAD_SNIPPET = `
  <script>
    const source = new EventSource('/livereload');
    const reload = () => location.reload(true);
    source.onmessage = reload;
    source.onerror = () => (source.onopen = reload);
    console.log('[snowpack] listening for file changes');
  </script>
`;
const gid = '__ROLLUP_PLUGIN_HOT_RUNTIME';
const host = 'localhost';
const port = '3000';
const ws = false;
const HOT_RELOAD_SNIPPET = `
  <script>
    window['${gid}'] = {
      host: ${JSON.stringify(host)},
      port: ${JSON.stringify(port)},
      ws: ${JSON.stringify(ws)},
      then: function(cb) {
        if (loaded) {
          setTimeout(cb, 0);
        } else {
          callbacks.push(cb);
        }
      }
    };
  </script>
  <script src="/hmr/hmr-runtime.js"></script>
`;

function getEncodingType(ext) {
  if (ext === '.js' || ext === '.css' || ext === '.html') {
    return 'utf8';
  } else {
    return 'binary';
  }
}

function watch(fileLoc, notify) {
  // NOTE recursive watch doesn't work for me with fs watch (plus, I get duplicated
  // events, which doesn't help with HMR)
  const watch = new CheapWatch({
    dir: fileLoc
  });
  watch.on('+', ({
    path,
    isNew
  }) => notify(isNew ? 'rename' : 'change', path));
  watch.on('-', ({
    path
  }) => notify('rename', path));
  watch.init().catch(err => {
    console.error(err);
    process.exit();
  }); // if (process.platform !== 'linux') {
  //   fsWatch(fileLoc, {recursive: true}, notify);
  //   return;
  // }
  // // For performance: don't step into node_modules directories
  // if (fileLoc.endsWith('node_modules')) {
  //   return;
  // }
  // if (statSync(fileLoc).isDirectory()) {
  //   fsWatch(fileLoc, notify);
  // } else {
  //   readdirSync(fileLoc).forEach((entry) => watch(path.join(fileLoc, entry), notify));
  // }
}

const sendFile = (res, file, ext = '.html') => {
  res.writeHead(200, {
    'Content-Type': mime.contentType(ext) || 'application/octet-stream',
    'Access-Control-Allow-Origin': '*'
  });
  res.write(file, getEncodingType(ext));
  res.end();
};

const sendError = (res, status) => {
  res.writeHead(status);
  res.end();
};

const sendMessage = (res, channel, data) => {
  const msg = (channel ? `event: ${channel}\n` : '') + `id: 0\ndata: ${data}\n`;
  res.write(msg);
  res.write('\n\n');
};

async function command$1({
  cwd,
  port,
  config,
  hot
}) {
  console.log(chalk.bold('Snowpack Dev Server (Beta)'));
  console.log('NOTE: Still experimental, default behavior may change.');
  console.log('Starting up...');
  console.log(hot);
  const fileBuildCache = new Map();
  const liveReloadClients = [];
  const hmrClients = [];
  const messageBus = new events.EventEmitter();
  const serverStart = Date.now();
  const dependencyImportMapLoc = path.join(config.installOptions.dest, 'import-map.json');

  const dependencyImportMap = require(dependencyImportMapLoc);

  const registeredWorkers = Object.entries(config.scripts);
  const workerDirectories = [];
  const mountedDirectories = []; // NOTE rewritting extensions doesn't play well with HMR / SystemJS

  const srcFileExtensionMapping = hot ? {} : _srcFileExtensionMapping;
  const RELOAD_SNIPPET = hot ? HOT_RELOAD_SNIPPET : LIVE_RELOAD_SNIPPET;

  for (const [id, workerConfig] of registeredWorkers) {
    if (!id.startsWith('mount:')) {
      continue;
    }

    const cmdArr = workerConfig.cmd.split(/\s+/);

    if (cmdArr[0] !== 'mount') {
      throw new Error(`script[${id}] must use the mount command`);
    }

    cmdArr.shift();
    let dirUrl, dirDisk;

    if (cmdArr.length === 1) {
      dirDisk = path.resolve(cwd, cmdArr[0]);
      dirUrl = '/' + cmdArr[0];
    } else {
      const {
        to
      } = yargs(cmdArr);
      dirDisk = path.resolve(cwd, cmdArr[0]);
      dirUrl = to;
    }

    mountedDirectories.push([dirDisk, dirUrl]);
    setTimeout(() => messageBus.emit('WORKER_UPDATE', {
      id,
      state: ['DONE', 'green']
    }), 400);
  }

  for (const [id, workerConfig] of registeredWorkers) {
    let {
      cmd
    } = workerConfig;

    if (!id.startsWith('lintall:')) {
      continue;
    }

    if (workerConfig.watch) {
      cmd += workerConfig.watch.replace('$1', '');
    }

    const tempBuildDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), `snowpack-${id}`));
    workerDirectories.unshift(tempBuildDir);
    cmd = cmd.replace(/\$DIST/g, tempBuildDir);
    const workerPromise = execa.command(cmd, {
      env: npmRunPath.env(),
      extendEnv: true,
      shell: true
    });
    const {
      stdout,
      stderr
    } = workerPromise;
    stdout === null || stdout === void 0 ? void 0 : stdout.on('data', b => {
      let stdOutput = b.toString();

      if (stdOutput.includes('\u001bc') || stdOutput.includes('\x1Bc')) {
        messageBus.emit('WORKER_RESET', {
          id
        });
        stdOutput = stdOutput.replace(/\x1Bc/, '').replace(/\u001bc/, '');
      }

      if (id.endsWith(':tsc')) {
        if (stdOutput.includes('\u001bc') || stdOutput.includes('\x1Bc')) {
          messageBus.emit('WORKER_UPDATE', {
            id,
            state: ['RUNNING', 'yellow']
          });
        }

        if (/Watching for file changes./gm.test(stdOutput)) {
          messageBus.emit('WORKER_UPDATE', {
            id,
            state: 'WATCHING'
          });
        }

        const errorMatch = stdOutput.match(/Found (\d+) error/);

        if (errorMatch && errorMatch[1] !== '0') {
          messageBus.emit('WORKER_UPDATE', {
            id,
            state: ['ERROR', 'red']
          });
        }
      }

      messageBus.emit('WORKER_MSG', {
        id,
        level: 'log',
        msg: stdOutput
      });
    });
    stderr === null || stderr === void 0 ? void 0 : stderr.on('data', b => {
      messageBus.emit('WORKER_MSG', {
        id,
        level: 'error',
        msg: b.toString()
      });
    });
    stderr === null || stderr === void 0 ? void 0 : stderr.on('data', b => {});
    workerPromise.catch(err => {
      messageBus.emit('WORKER_COMPLETE', {
        id,
        error: err
      });
    });
    workerPromise.then(() => {
      messageBus.emit('WORKER_COMPLETE', {
        id,
        error: null
      });
    });
  }

  http.createServer(async (req, res) => {
    const reqUrl = req.url;
    let reqPath = url.parse(reqUrl).pathname; // const requestStart = Date.now();

    res.on('finish', () => {
      const {
        method,
        url
      } = req;
      const {
        statusCode
      } = res;

      if (statusCode !== 200) {
        messageBus.emit('SERVER_RESPONSE', {
          method,
          url,
          statusCode
        });
      }
    });

    if (reqPath === '/livereload') {
      res.writeHead(200, {
        Connection: 'keep-alive',
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*'
      });
      sendMessage(res, 'connected', 'ready');
      setInterval(sendMessage, 60000, res, 'ping', 'waiting');
      liveReloadClients.push(res);
      return;
    }

    if (reqPath === '/~hot') {
      req.socket.setTimeout(0);
      res.writeHead(200, {
        Connection: 'keep-alive',
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*'
      });
      sendMessage(res, null, JSON.stringify({
        greeting: {
          clearConsole: false,
          inMemory: false,
          reload: true,
          autoAccept: false
        }
      })); // setInterval(sendMessage, 60000, res, 'ping', 'waiting');

      hmrClients.push(res);
      return;
    }

    const attemptedFileLoads = [];

    function attemptLoadFile(requestedFile) {
      attemptedFileLoads.push(requestedFile);
      return fs.promises.stat(requestedFile).then(stat => stat.isFile() ? requestedFile : null).catch(() => null
      /* ignore */
      );
    }

    const resource = decodeURI(reqPath);
    let requestedFileExt = path.parse(resource).ext.toLowerCase();
    let isRoute = false;
    let fileLoc = null;
    let fileContents = null;
    let fileBuilder;

    for (const [id, workerConfig] of registeredWorkers) {
      if (fileLoc || !resource.startsWith(config.devOptions.dist) || !requestedFileExt || !config.include || !id.startsWith('build:') && !id.startsWith('plugin:')) {
        continue;
      }

      if (!config.include) {
        console.error('"include" directory required to build');
        return;
      }

      const srcExtMatchers = id.split(':')[1].split(',');
      const {
        cmd
      } = workerConfig;
      let requestedFile = path.join(config.include, resource.replace(`${config.devOptions.dist}`, ''));

      for (const ext of srcExtMatchers) {
        if (!srcFileExtensionMapping[ext] || srcFileExtensionMapping[ext] === requestedFileExt.substr(1)) {
          const srcFile = requestedFile.replace(requestedFileExt, `.${ext}`);
          fileLoc = fileLoc || (await attemptLoadFile(srcFile));
        }
      }

      if (!fileLoc) {
        continue;
      }

      if (id.startsWith('plugin:')) {
        const modulePath = require.resolve(cmd, {
          paths: [cwd]
        });

        const {
          build
        } = require(modulePath);

        fileBuilder = async code => {
          messageBus.emit('WORKER_UPDATE', {
            id,
            state: ['RUNNING', 'yellow']
          });

          try {
            let {
              result
            } = await build(fileLoc);
            return result;
          } catch (err) {
            err.message = `[${id}] ${err.message}`;
            console.error(err);
            return '';
          } finally {
            messageBus.emit('WORKER_UPDATE', {
              id,
              state: null
            });
          }
        };

        continue;
      }

      if (id.startsWith('build:')) {
        fileBuilder = async code => {
          messageBus.emit('WORKER_UPDATE', {
            id,
            state: ['RUNNING', 'yellow']
          });
          const {
            stdout,
            stderr
          } = await execa.command(cmd, {
            env: npmRunPath.env(),
            extendEnv: true,
            shell: true,
            input: code
          });

          if (stderr) {
            console.error(stderr);
          }

          messageBus.emit('WORKER_UPDATE', {
            id,
            state: null
          });
          return stdout;
        };
      }
    }

    for (const dirDisk of workerDirectories) {
      if (fileLoc || !requestedFileExt || !resource.startsWith(config.devOptions.dist)) {
        continue;
      }

      let requestedFile = path.join(dirDisk, resource.replace(`${config.devOptions.dist}`, ''));
      fileLoc = await attemptLoadFile(requestedFile);
    }

    for (const [dirDisk, dirUrl] of mountedDirectories) {
      if (fileLoc) {
        continue;
      }

      if (resource.startsWith(config.devOptions.dist)) {
        continue;
      }

      let requestedFile;

      if (dirUrl === '/') {
        requestedFile = path.join(dirDisk, resource);
      } else if (resource.startsWith(dirUrl)) {
        requestedFile = path.join(dirDisk, resource.replace(dirUrl, '/'));
      } else {
        continue;
      }

      fileLoc = fileLoc || (await attemptLoadFile(requestedFile));

      if (requestedFileExt) {
        continue;
      }

      fileLoc = fileLoc || (await attemptLoadFile(requestedFile + '.html')) || (await attemptLoadFile(requestedFile + '/index.html')) || (await attemptLoadFile(requestedFile + 'index.html'));

      if (!fileLoc && dirUrl === '/' && config.devOptions.fallback) {
        const fallbackFile = dirUrl === '/' ? path.join(dirDisk, config.devOptions.fallback) : path.join(cwd, config.devOptions.fallback);
        fileLoc = await attemptLoadFile(fallbackFile);
      }

      if (fileLoc) {
        requestedFileExt = '.html';
        isRoute = true;
      }
    }

    if (isRoute) {
      messageBus.emit('NEW_SESSION');
    }

    if (!fileLoc) {
      const prefix = chalk.red('  ✘ ');
      console.error(`[404] ${reqUrl}\n${attemptedFileLoads.map(loc => prefix + loc).join('\n')}`);
      return sendError(res, 404);
    }

    fileContents = fileBuildCache.get(fileLoc) || null;

    if (!fileContents) {
      try {
        fileContents = await fs.promises.readFile(fileLoc, getEncodingType(requestedFileExt));

        if (fileBuilder) {
          fileContents = await fileBuilder(fileContents);
        }

        if (isRoute) {
          fileContents += RELOAD_SNIPPET;
        }

        if (requestedFileExt === '.js') {
          fileContents = await transformEsmImports(fileContents, spec => {
            if (spec.startsWith('http') || spec.startsWith('/')) {
              return spec;
            }

            if (spec.startsWith('./') || spec.startsWith('../')) {
              const ext = path.extname(spec).substr(1);

              if (!ext) {
                return spec + '.js';
              }

              const extToReplace = srcFileExtensionMapping[ext];

              if (extToReplace) {
                return spec.replace(new RegExp(`${ext}$`), extToReplace);
              }

              return spec;
            }

            if (dependencyImportMap.imports[spec]) {
              return `/web_modules/${dependencyImportMap.imports[spec]}`;
            }

            messageBus.emit('MISSING_WEB_MODULE', {
              specifier: spec
            });
            return `/web_modules/${spec}.js`;
          });
        }
      } catch (err) {
        console.error(fileLoc, err);
        return sendError(res, 500);
      }
    }

    fileBuildCache.set(fileLoc, fileContents);
    sendFile(res, fileContents, requestedFileExt);
  }).listen(port);
  const hotDebounce = 50;
  let hotChanges = [];
  let hotTimeout;

  const flushHotChanges = () => {
    const changes = [...new Set(hotChanges)];
    hotChanges = [];

    for (const client of hmrClients) {
      sendMessage(client, null, JSON.stringify({
        changes
      }));
    }
  };

  const notifyHotChange = url => {
    hotChanges.push(url);
    clearTimeout(hotTimeout);
    hotTimeout = setTimeout(flushHotChanges, hotDebounce);
  };

  async function onWatchEvent(event, _fileLoc) {
    const fileLoc = path.resolve(config.include, _fileLoc);
    fileBuildCache.delete(fileLoc);

    while (liveReloadClients.length > 0) {
      sendMessage(liveReloadClients.pop(), 'message', 'reload');
    }

    notifyHotChange('/_dist_/' + _fileLoc); // let requestId = fileLoc;
    // if (requestId.startsWith(cwd)) {
    //   requestId = requestId.replace(/\.(js|ts|jsx|tsx)$/, '.js');
    // }
    // FILE_CACHE.delete(requestId);
    // if (babelFileErrors.has(fileLoc)) {
    //   const fileContents = await fs.readFile(fileLoc, 'utf-8').catch((err) => null /* ignore */);
    //   if (!fileContents) {
    //     babelFileErrors.delete(fileLoc);
    //   } else {
    //     buildBabelFile(fileLoc, fileContents);
    //   }
    // }
  }

  if (config.include) {
    watch(config.include, onWatchEvent);
  }

  process.on('SIGINT', () => {
    for (const client of liveReloadClients) {
      client.end();
    }

    process.exit(0);
  });

  console.log = (...args) => {
    messageBus.emit('CONSOLE', {
      level: 'log',
      args
    });
  };

  console.warn = (...args) => {
    messageBus.emit('CONSOLE', {
      level: 'warn',
      args
    });
  };

  console.error = (...args) => {
    messageBus.emit('CONSOLE', {
      level: 'error',
      args
    });
  };

  const ips = Object.values(os.networkInterfaces()).reduce((every, i) => [...every, ...(i || [])], []).filter(i => i.family === 'IPv4' && i.internal === false).map(i => i.address);
  paint(messageBus, registeredWorkers, undefined, {
    port,
    ips,
    startTimeMs: Date.now() - serverStart
  }); // sorry... can't stand this
  // openInBrowser(port);

  return new Promise(() => {});
}

const CONFIG_NAME = 'snowpack'; // default settings

const DEFAULT_CONFIG = {
  exclude: ['__tests__/*', '**/*.@(spec|test).*'],
  knownEntrypoints: [],
  installOptions: {
    clean: false,
    dest: 'web_modules',
    externalPackage: [],
    installTypes: false,
    env: {},
    alias: {}
  },
  devOptions: {
    port: 8080,
    out: 'build',
    dist: '/_dist_',
    fallback: 'index.html',
    bundle: false,
    hot: false
  },
  rollup: {
    plugins: [],
    dedupe: []
  }
};
const configSchema = {
  type: 'object',
  properties: {
    extends: {
      type: 'string'
    },
    knownEntrypoints: {
      type: 'array',
      items: {
        type: 'string'
      }
    },
    include: {
      type: 'string'
    },
    exclude: {
      type: 'array',
      items: {
        type: 'string'
      }
    },
    webDependencies: {
      type: ['object'],
      additionalProperties: {
        type: 'string'
      }
    },
    installOptions: {
      type: 'object',
      properties: {
        clean: {
          type: 'boolean'
        },
        dest: {
          type: 'string'
        },
        externalPackage: {
          type: 'array',
          items: {
            type: 'string'
          }
        },
        installTypes: {
          type: 'boolean'
        },
        sourceMap: {
          oneOf: [{
            type: 'boolean'
          }, {
            type: 'string'
          }]
        },
        alias: {
          type: 'object',
          additionalProperties: {
            type: 'string'
          }
        },
        env: {
          type: 'object',
          additionalProperties: {
            oneOf: [{
              id: 'EnvVarString',
              type: 'string'
            }, {
              id: 'EnvVarNumber',
              type: 'number'
            }, {
              id: 'EnvVarTrue',
              type: 'boolean',
              enum: [true]
            }]
          }
        }
      }
    },
    devOptions: {
      type: 'object',
      properties: {
        port: {
          type: 'number'
        },
        out: {
          type: 'string'
        },
        dist: {
          type: 'string'
        },
        fallback: {
          type: 'string'
        },
        bundle: {
          type: 'boolean'
        },
        hot: {
          type: 'boolean'
        }
      }
    },
    scripts: {
      type: 'object',
      additionalProperties: {
        type: ['string']
      }
    },
    rollup: {
      type: 'object',
      properties: {
        plugins: {
          type: 'array',
          items: {
            type: 'object'
          }
        },
        dedupe: {
          type: 'array',
          items: {
            type: 'string'
          }
        },
        namedExports: {
          type: 'object',
          additionalProperties: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        }
      }
    }
  }
};
/**
 * Convert CLI flags to an incomplete Snowpack config representation.
 * We need to be careful about setting properties here if the flag value
 * is undefined, since the deep merge strategy would then overwrite good
 * defaults with 'undefined'.
 */

function expandCliFlags(flags) {
  const result = {
    installOptions: {},
    devOptions: {}
  };

  const relevantFlags = _objectWithoutProperties(flags, ["help", "version", "config"]);

  for (const [flag, val] of Object.entries(relevantFlags)) {
    if (flag === '_' || flag.includes('-')) {
      continue;
    }

    if (configSchema.properties[flag]) {
      result[flag] = val;
      continue;
    }

    if (configSchema.properties.installOptions.properties[flag]) {
      result.installOptions[flag] = val;
      continue;
    }

    if (configSchema.properties.devOptions.properties[flag]) {
      result.devOptions[flag] = val;
      continue;
    }

    console.error(`Unknown CLI flag: "${flag}"`);
    process.exit(1);
  }

  if (result.installOptions.env) {
    result.installOptions.env = result.installOptions.env.reduce((acc, id) => {
      const index = id.indexOf('=');
      const [key, val] = index > 0 ? [id.substr(0, index), id.substr(index + 1)] : [id, true];
      acc[key] = val;
      return acc;
    }, {});
  }

  return result;
}
/** resolve --dest relative to cwd, etc. */


function normalizeConfig(config) {
  const cwd = process.cwd();

  if (config.include) {
    config.include = path.resolve(cwd, config.include);
  } else {
    const potentialIncludeDir = path.resolve(cwd, 'src');

    if (fs__default.existsSync(potentialIncludeDir)) {
      config.include = potentialIncludeDir;
    }
  }

  config.installOptions.dest = path.resolve(cwd, config.installOptions.dest);
  config.devOptions.out = path.resolve(cwd, config.devOptions.out);
  const scriptsBase = {
    'mount:web_modules': 'mount web_modules'
  };

  if (!config.scripts) {
    scriptsBase['mount:/'] = 'mount . --to /';
  } else if (fs__default.existsSync(path.resolve(cwd, 'public'))) {
    scriptsBase['mount:public'] = scriptsBase['mount:public'] || 'mount public --to /';
  } // @ts-ignore


  config.scripts = _objectSpread2(_objectSpread2({}, scriptsBase), config.scripts);

  for (const scriptId of Object.keys(config.scripts)) {
    if (scriptId.includes('::watch')) {
      continue;
    }

    config.scripts[scriptId] = {
      cmd: config.scripts[scriptId],
      watch: config.scripts[`${scriptId}::watch`]
    };
  }

  for (const scriptId of Object.keys(config.scripts)) {
    if (scriptId.includes('::watch')) {
      delete config.scripts[scriptId];
    }
  }

  return config;
}

function handleConfigError(msg) {
  console.error(`[error]: ${msg}`);
  process.exit(1);
}

function handleValidationErrors(filepath, errors) {
  console.error(chalk.red(`! ${filepath || 'Configuration error'}`));
  console.error(errors.map(err => `    - ${err.toString()}`).join('\n'));
  console.error(`    See https://www.snowpack.dev/#configuration for more info.`);
  process.exit(1);
}

function handleDeprecatedConfigError(msg) {
  console.error(chalk.red(msg));
  console.error(`See https://www.snowpack.dev/#configuration for more info.`);
  process.exit(1);
}

function validateConfigAgainstV1(rawConfig, cliFlags) {
  var _rawConfig$installOpt, _rawConfig$installOpt2, _rawConfig$installOpt3, _rawConfig$installOpt4, _rawConfig$installOpt5, _rawConfig$installOpt6, _rawConfig$installOpt7;

  // Moved!
  if (rawConfig.dedupe || cliFlags.dedupe) {
    handleDeprecatedConfigError('[Snowpack v1 -> v2] `dedupe` is now `rollup.dedupe`.');
  }

  if (rawConfig.namedExports || cliFlags.namedExports) {
    handleDeprecatedConfigError('[Snowpack v1 -> v2] `namedExports` is now `rollup.namedExports`.');
  }

  if ((_rawConfig$installOpt = rawConfig.installOptions) === null || _rawConfig$installOpt === void 0 ? void 0 : _rawConfig$installOpt.include) {
    handleDeprecatedConfigError('[Snowpack v1 -> v2] `installOptions.include` is now `include` but its syntax has also changed!');
  }

  if ((_rawConfig$installOpt2 = rawConfig.installOptions) === null || _rawConfig$installOpt2 === void 0 ? void 0 : _rawConfig$installOpt2.exclude) {
    handleDeprecatedConfigError('[Snowpack v1 -> v2] `installOptions.exclude` is now `exclude`.');
  }

  if (Array.isArray(rawConfig.webDependencies)) {
    handleDeprecatedConfigError('[Snowpack v1 -> v2] The `webDependencies` array is now `knownEntrypoints`.');
  }

  if (rawConfig.entrypoints) {
    handleDeprecatedConfigError('[Snowpack v1 -> v2] `entrypoints` is now `knownEntrypoints`.');
  } // Replaced!


  if (rawConfig.source || cliFlags.source) {
    handleDeprecatedConfigError('[Snowpack v1 -> v2] `source` is now detected automatically, this config is safe to remove.');
  }

  if (rawConfig.stat || cliFlags.stat) {
    handleDeprecatedConfigError('[Snowpack v1 -> v2] `stat` is now the default output, this config is safe to remove.');
  } // Removed!


  if (rawConfig.hash || cliFlags.hash) {
    handleDeprecatedConfigError('[Snowpack v1 -> v2] `installOptions.hash` has been replaced by `snowpack build`.');
  }

  if (((_rawConfig$installOpt3 = rawConfig.installOptions) === null || _rawConfig$installOpt3 === void 0 ? void 0 : _rawConfig$installOpt3.nomodule) || cliFlags.nomodule) {
    handleDeprecatedConfigError('[Snowpack v1 -> v2] `installOptions.nomodule` has been replaced by `snowpack build --bundle`.');
  }

  if (((_rawConfig$installOpt4 = rawConfig.installOptions) === null || _rawConfig$installOpt4 === void 0 ? void 0 : _rawConfig$installOpt4.nomoduleOutput) || cliFlags.nomoduleOutput) {
    handleDeprecatedConfigError('[Snowpack v1 -> v2] `installOptions.nomoduleOutput` has been replaced by `snowpack build --bundle`.');
  }

  if (((_rawConfig$installOpt5 = rawConfig.installOptions) === null || _rawConfig$installOpt5 === void 0 ? void 0 : _rawConfig$installOpt5.babel) || cliFlags.babel) {
    handleDeprecatedConfigError('[Snowpack v1 -> v2] `installOptions.babel` has been replaced by `snowpack build --bundle`.');
  }

  if (((_rawConfig$installOpt6 = rawConfig.installOptions) === null || _rawConfig$installOpt6 === void 0 ? void 0 : _rawConfig$installOpt6.optimize) || cliFlags.optimize) {
    handleDeprecatedConfigError('[Snowpack v1 -> v2] `installOptions.optimize` has been replaced by `snowpack build --bundle`.');
  }

  if (((_rawConfig$installOpt7 = rawConfig.installOptions) === null || _rawConfig$installOpt7 === void 0 ? void 0 : _rawConfig$installOpt7.strict) || cliFlags.strict) {
    handleDeprecatedConfigError('[Snowpack v1 -> v2] `installOptions.strict` is no longer supported.');
  }
}

function loadAndValidateConfig(flags, pkgManifest) {
  const explorerSync = cosmiconfig.cosmiconfigSync(CONFIG_NAME, {
    // only support these 3 types of config for now
    searchPlaces: ['package.json', 'snowpack.config.js', 'snowpack.config.json'],
    // don't support crawling up the folder tree:
    stopDir: path.dirname(process.cwd())
  });
  let result; // if user specified --config path, load that

  if (flags.config) {
    result = explorerSync.load(path.resolve(process.cwd(), flags.config));

    if (!result) {
      handleConfigError(`Could not locate Snowpack config at ${flags.config}`);
    }
  } // If no config was found above, search for one.


  result = result || explorerSync.search(); // If still no config found, assume none exists and use the default config.

  if (!result || !result.config || result.isEmpty) {
    result = {
      config: _objectSpread2({}, DEFAULT_CONFIG)
    };
  } // validate against schema; throw helpful user if invalid


  const config = result.config;
  const cliConfig = expandCliFlags(flags);
  validateConfigAgainstV1(result.config, flags);
  const validation = jsonschema.validate(config, configSchema, {
    allowUnknownAttributes: false,
    propertyName: CONFIG_NAME
  });

  if (validation.errors && validation.errors.length > 0) {
    handleValidationErrors(result.filepath, validation.errors);
    process.exit(1);
  }

  let extendConfig = {};

  if (config.extends) {
    const extendConfigLoc = config.extends.startsWith('.') ? path.resolve(path.dirname(result.filepath), config.extends) : require.resolve(config.extends, {
      paths: [process.cwd()]
    });
    const extendResult = explorerSync.load(extendConfigLoc);

    if (!extendResult) {
      handleConfigError(`Could not locate Snowpack config at ${flags.config}`);
      process.exit(1);
    }

    extendConfig = extendResult.config;
    const extendValidation = jsonschema.validate(extendConfig, configSchema, {
      allowUnknownAttributes: false,
      propertyName: CONFIG_NAME
    });

    if (extendValidation.errors && extendValidation.errors.length > 0) {
      handleValidationErrors(result.filepath, extendValidation.errors);
      process.exit(1);
    }
  } // if valid, apply config over defaults


  const overwriteMerge = (destinationArray, sourceArray, options) => sourceArray;

  const mergedConfig = deepmerge.all([DEFAULT_CONFIG, extendConfig, {
    webDependencies: pkgManifest.webDependencies
  }, config, cliConfig], {
    arrayMerge: overwriteMerge
  }); // if CLI flags present, apply those as overrides

  return normalizeConfig(mergedConfig);
}

const PIKA_CDN = `https://cdn.pika.dev`;
const CACHE_DIR = cachedir('snowpack');
const RESOURCE_CACHE = path.join(CACHE_DIR, 'pkg-cache-1.4');
const HAS_CDN_HASH_REGEX = /\-[a-zA-Z0-9]{16,}/;
async function readLockfile(cwd) {
  try {
    var lockfileContents = fs__default.readFileSync(path.join(cwd, 'snowpack.lock.json'), {
      encoding: 'utf8'
    });
  } catch (err) {
    // no lockfile found, ignore and continue
    return null;
  } // If this fails, we actually do want to alert the user by throwing


  return JSON.parse(lockfileContents);
}
async function writeLockfile(loc, importMap) {
  const sortedImportMap = {
    imports: {}
  };

  for (const key of Object.keys(importMap.imports).sort()) {
    sortedImportMap.imports[key] = importMap.imports[key];
  }

  fs__default.writeFileSync(loc, JSON.stringify(sortedImportMap, undefined, 2), {
    encoding: 'utf8'
  });
}
function fetchCDNResource(resourceUrl, responseType) {
  if (!resourceUrl.startsWith(PIKA_CDN)) {
    resourceUrl = PIKA_CDN + resourceUrl;
  } // @ts-ignore - TS doesn't like responseType being unknown amount three options


  return got(resourceUrl, {
    responseType: responseType,
    headers: {
      'user-agent': `snowpack/v1.4 (https://snowpack.dev)`
    },
    throwHttpErrors: false
  });
}
function isTruthy(item) {
  return Boolean(item);
}
/**
 * Given a package name, look for that package's package.json manifest.
 * Return both the manifest location (if believed to exist) and the
 * manifest itself (if found).
 *
 * NOTE: You used to be able to require() a package.json file directly,
 * but now with export map support in Node v13 that's no longer possible.
 */

function resolveDependencyManifest(dep, cwd) {
  // Attempt #1: Resolve the dependency manifest normally. This works for most
  // packages, but fails when the package defines an export map that doesn't
  // include a package.json. If we detect that to be the reason for failure,
  // move on to our custom implementation.
  try {
    const depManifest = require.resolve(`${dep}/package.json`, {
      paths: [cwd]
    });

    return [depManifest, require(depManifest)];
  } catch (err) {
    // if its an export map issue, move on to our manual resolver.
    if (err.code !== 'ERR_PACKAGE_PATH_NOT_EXPORTED') {
      throw new Error(`Cannot resolve "${dep}/package.json" via "${cwd}".`);
    }
  } // Attempt #2: Resolve the dependency manifest manually. This involves resolving
  // the dep itself to find the entrypoint file, and then haphazardly replacing the
  // file path within the package with a "./package.json" instead. It's not as
  // thorough as Attempt #1, but it should work well until export maps become more
  // established & move out of experimental mode.


  let result = [null, null];

  try {
    const fullPath = require.resolve(dep, {
      paths: [cwd]
    }); // Strip everything after the package name to get the package root path
    // NOTE: This find-replace is very gross, replace with something like upath.


    const searchPath = `${path.sep}node_modules${path.sep}${dep.replace('/', path.sep)}`;
    const indexOfSearch = fullPath.lastIndexOf(searchPath);

    if (indexOfSearch >= 0) {
      const manifestPath = fullPath.substring(0, indexOfSearch + searchPath.length + 1) + 'package.json';
      result[0] = manifestPath;
      const manifestStr = fs__default.readFileSync(manifestPath, {
        encoding: 'utf8'
      });
      result[1] = JSON.parse(manifestStr);
    }
  } catch (err) {// ignore
  } finally {
    return result;
  }
}
/**
 * If Rollup erred parsing a particular file, show suggestions based on its
 * file extension (note: lowercase is fine).
 */

const MISSING_PLUGIN_SUGGESTIONS = {
  '.css': 'Try installing rollup-plugin-postcss and adding it to Snowpack (https://www.snowpack.dev/#custom-rollup-plugins)',
  '.svelte': 'Try installing rollup-plugin-svelte and adding it to Snowpack (https://www.snowpack.dev/#custom-rollup-plugins)',
  '.vue': 'Try installing rollup-plugin-vue and adding it to Snowpack (https://www.snowpack.dev/#custom-rollup-plugins)'
};

/**
 * Given an install specifier, attempt to resolve it from the CDN.
 * If no lockfile exists or if the entry is not found in the lockfile, attempt to resolve
 * it from the CDN directly. Otherwise, use the URL found in the lockfile and attempt to
 * check the local cache first.
 *
 * All resolved URLs are populated into the local cache, where our internal Rollup engine
 * will load them from when it installs your dependencies to disk.
 */

async function resolveDependency(installSpecifier, packageSemver, lockfile, canRetry = true) {
  // Right now, the CDN is only for top-level JS packages. The CDN doesn't support CSS,
  // non-JS assets, and has limited support for deep package imports. Snowpack
  // will automatically fall-back any failed/not-found assets from local
  // node_modules/ instead.
  if (!validatePackageName(installSpecifier).validForNewPackages) {
    return null;
  } // Grab the installUrl from our lockfile if it exists, otherwise resolve it yourself.


  let installUrl;
  let installUrlType;

  if (lockfile && lockfile.imports[installSpecifier]) {
    installUrl = lockfile.imports[installSpecifier];
    installUrlType = 'pin';
  } else {
    if (packageSemver === 'latest') {
      console.warn(`warn(${installSpecifier}): Not found in "dependencies". Using latest package version...`);
    }

    if (packageSemver.startsWith('npm:@reactesm') || packageSemver.startsWith('npm:@pika/react')) {
      throw new Error(`React workaround packages no longer needed! Revert to the official React & React-DOM packages.`);
    }

    if (packageSemver.includes(' ') || packageSemver.includes(':')) {
      console.warn(`warn(${installSpecifier}): Can't fetch complex semver "${packageSemver}" from remote CDN.`);
      return null;
    }

    installUrlType = 'lookup';
    installUrl = `${PIKA_CDN}/${installSpecifier}@${packageSemver}`;
  } // Hashed CDN urls never change, so its safe to grab them directly from the local cache
  // without a network request.


  if (installUrlType === 'pin') {
    const cachedResult = await cacache.get.info(RESOURCE_CACHE, installUrl).catch(() => null);

    if (cachedResult) {
      if (cachedResult.metadata) {
        const {
          pinnedUrl
        } = cachedResult.metadata;
        return pinnedUrl;
      }
    }
  } // Otherwise, resolve from the CDN remotely.


  const {
    statusCode,
    headers,
    body
  } = await fetchCDNResource(installUrl);

  if (statusCode !== 200) {
    console.warn(`Failed to resolve [${statusCode}]: ${installUrl} (${body})`);
    console.warn(`Falling back to local copy...`);
    return null;
  }

  let importUrlPath = headers['x-import-url'];
  let pinnedUrlPath = headers['x-pinned-url'];
  const buildStatus = headers['x-import-status'];
  const typesUrlPath = headers['x-typescript-types'];
  const typesUrl = typesUrlPath && `${PIKA_CDN}${typesUrlPath}`;

  if (installUrlType === 'pin') {
    const pinnedUrl = installUrl;
    await cacache.put(RESOURCE_CACHE, pinnedUrl, body, {
      metadata: {
        pinnedUrl,
        typesUrl
      }
    });
    return pinnedUrl;
  }

  if (pinnedUrlPath) {
    const pinnedUrl = `${PIKA_CDN}${pinnedUrlPath}`;
    await cacache.put(RESOURCE_CACHE, pinnedUrl, body, {
      metadata: {
        pinnedUrl,
        typesUrl
      }
    });
    return pinnedUrl;
  }

  if (buildStatus === 'SUCCESS') {
    console.warn(`Failed to lookup [${statusCode}]: ${installUrl}`);
    console.warn(`Falling back to local copy...`);
    return null;
  }

  if (!canRetry || buildStatus === 'FAIL') {
    console.warn(`Failed to build: ${installSpecifier}@${packageSemver}`);
    console.warn(`Falling back to local copy...`);
    return null;
  }

  console.log(chalk.cyan(`Building ${installSpecifier}@${packageSemver}... (This takes a moment, but will be cached for future use)`));

  if (!importUrlPath) {
    throw new Error('X-Import-URL header expected, but none received.');
  }

  const {
    statusCode: lookupStatusCode
  } = await fetchCDNResource(importUrlPath);

  if (lookupStatusCode !== 200) {
    throw new Error(`Unexpected response [${lookupStatusCode}]: ${PIKA_CDN}${importUrlPath}`);
  }

  return resolveDependency(installSpecifier, packageSemver, lockfile, false);
}

async function resolveTargetsFromRemoteCDN(lockfile, pkgManifest, config) {
  const downloadQueue = new PQueue({
    concurrency: 16
  });
  const newLockfile = {
    imports: {}
  };
  let resolutionError;

  for (const [installSpecifier, installSemver] of Object.entries(config.webDependencies)) {
    downloadQueue.add(async () => {
      try {
        const resolvedUrl = await resolveDependency(installSpecifier, installSemver, lockfile);

        if (resolvedUrl) {
          newLockfile.imports[installSpecifier] = resolvedUrl;
        }
      } catch (err) {
        resolutionError = resolutionError || err;
      }
    });
  }

  await downloadQueue.onIdle();

  if (resolutionError) {
    throw resolutionError;
  }

  return newLockfile;
}
function clearCache() {
  return cacache.rm.all(RESOURCE_CACHE);
}

const IS_DEEP_PACKAGE_IMPORT = /^(@[\w-]+\/)?([\w-]+)\/(.*)/;
/**
 * rollup-plugin-entrypoint-alias
 *
 * Aliases any deep imports from a package to the package name, so that
 * chunking can happen more accurately.
 *
 * Example: lit-element imports from both 'lit-html' & 'lit-html/lit-html.js'.
 * Even though both eventually resolve to the same place, without this plugin
 * we lose the ability to mark "lit-html" as an external package.
 */

function rollupPluginEntrypointAlias({
  cwd
}) {
  return {
    name: 'snowpack:rollup-plugin-entrypoint-alias',

    resolveId(source, importer) {
      if (!IS_DEEP_PACKAGE_IMPORT.test(source)) {
        return null;
      }

      const [, packageScope, packageName] = source.match(IS_DEEP_PACKAGE_IMPORT);
      const packageFullName = packageScope ? `${packageScope}${packageName}` : packageName;
      const [, manifest] = resolveDependencyManifest(packageFullName, cwd);

      if (!manifest) {
        return null;
      }

      let needsAlias = typeof manifest.module === 'string' && source === path.posix.join(packageFullName, manifest.module) || typeof manifest.browser === 'string' && source === path.posix.join(packageFullName, manifest.browser) || typeof manifest.main === 'string' && source === path.posix.join(packageFullName, manifest.main);

      if (!needsAlias) {
        return null;
      }

      return this.resolve(packageFullName, importer, {
        skipSelf: true
      }).then(resolved => {
        return resolved || null;
      });
    }

  };
}

const CACHED_FILE_ID_PREFIX = 'snowpack-pkg-cache:';
const PIKA_CDN_TRIM_LENGTH = PIKA_CDN.length;
/**
 * rollup-plugin-remote-cdn
 *
 * Load import URLs from a remote CDN, sitting behind a local cache. The local
 * cache acts as a go-between for the resolve & load step: when we get back a
 * successful CDN resolution, we save the file to the local cache and then tell
 * rollup that it's safe to load from the cache in the `load()` hook.
 */

function rollupPluginDependencyCache({
  installTypes,
  log
}) {
  const allTypesToInstall = new Set();
  return {
    name: 'snowpack:rollup-plugin-remote-cdn',

    async resolveId(source, importer) {
      let cacheKey;

      if (source.startsWith(PIKA_CDN)) {
        cacheKey = source;
      } else if (source.startsWith('/-/')) {
        cacheKey = PIKA_CDN + source;
      } else if (source.startsWith('/pin/')) {
        cacheKey = PIKA_CDN + source;
      } else {
        return null;
      } // If the source path is a CDN path including a hash, it's assumed the
      // file will never change and it is safe to pull from our local cache
      // without a network request.


      log(cacheKey);

      if (HAS_CDN_HASH_REGEX.test(cacheKey)) {
        const cachedResult = await cacache.get.info(RESOURCE_CACHE, cacheKey).catch(() =>
        /* ignore */
        null);

        if (cachedResult) {
          return CACHED_FILE_ID_PREFIX + cacheKey;
        }
      } // Otherwise, make the remote request and cache the file on success.


      const response = await fetchCDNResource(cacheKey);

      if (response.statusCode === 200) {
        const typesUrlPath = response.headers['x-typescript-types'];
        const pinnedUrlPath = response.headers['x-pinned-url'];
        const typesUrl = typesUrlPath && `${PIKA_CDN}${typesUrlPath}`;
        const pinnedUrl = pinnedUrlPath && `${PIKA_CDN}${pinnedUrlPath}`;
        await cacache.put(RESOURCE_CACHE, cacheKey, response.body, {
          metadata: {
            pinnedUrl,
            typesUrl
          }
        });
        return CACHED_FILE_ID_PREFIX + cacheKey;
      } // If lookup failed, skip this plugin and resolve the import locally instead.
      // TODO: Log that this has happened (if some sort of verbose mode is enabled).


      const packageName = cacheKey.substring(PIKA_CDN_TRIM_LENGTH).replace('/-/', '').replace('/pin/', '').split('@')[0];
      return this.resolve(packageName, importer, {
        skipSelf: true
      }).then(resolved => {
        let finalResult = resolved;

        if (!finalResult) {
          finalResult = {
            id: packageName
          };
        }

        return finalResult;
      });
    },

    async load(id) {
      var _cachedResult$metadat;

      if (!id.startsWith(CACHED_FILE_ID_PREFIX)) {
        return null;
      }

      const cacheKey = id.substring(CACHED_FILE_ID_PREFIX.length);
      log(cacheKey);
      const cachedResult = await cacache.get(RESOURCE_CACHE, cacheKey);
      const typesUrl = (_cachedResult$metadat = cachedResult.metadata) === null || _cachedResult$metadat === void 0 ? void 0 : _cachedResult$metadat.typesUrl;

      if (typesUrl && installTypes) {
        const typesTarballUrl = typesUrl.replace(/(mode=types.*?)\/.*/, '$1/all.tgz');
        allTypesToInstall.add(typesTarballUrl);
      }

      return cachedResult.data.toString('utf8');
    },

    async writeBundle(options) {
      if (!installTypes) {
        return;
      }

      await mkdirp(path.join(options.dir, '.types'));
      const tempDir = await cacache.tmp.mkdir(RESOURCE_CACHE);

      for (const typesTarballUrl of allTypesToInstall) {
        let tarballContents;
        const cachedTarball = await cacache.get(RESOURCE_CACHE, typesTarballUrl).catch(() =>
        /* ignore */
        null);

        if (cachedTarball) {
          tarballContents = cachedTarball.data;
        } else {
          const tarballResponse = await fetchCDNResource(typesTarballUrl, 'buffer');

          if (tarballResponse.statusCode !== 200) {
            continue;
          }

          tarballContents = tarballResponse.body;
          await cacache.put(RESOURCE_CACHE, typesTarballUrl, tarballContents);
        }

        const typesUrlParts = url.parse(typesTarballUrl).pathname.split('/');
        const typesPackageName = url.parse(typesTarballUrl).pathname.startsWith('/-/@') ? typesUrlParts[2] + '/' + typesUrlParts[3].split('@')[0] : typesUrlParts[2].split('@')[0];
        fs__default.writeFileSync(path.join(tempDir, `${typesPackageName}.tgz`), tarballContents);
        const typesPackageLoc = path.join(options.dir, `.types/${typesPackageName}`);
        await mkdirp(typesPackageLoc);
        await tar.x({
          file: path.join(tempDir, `${typesPackageName}.tgz`),
          cwd: typesPackageLoc
        });
      }
    }

  };
}

function rollupPluginDependencyStats(cb) {
  let outputDir;
  let existingFileCache = {};
  let statsSummary = {
    direct: {},
    common: {}
  };

  function buildExistingFileCache(bundle) {
    for (let fileName of Object.keys(bundle)) {
      const filePath = path.join(outputDir, fileName);

      if (fs__default.existsSync(filePath)) {
        const {
          size
        } = fs__default.statSync(filePath);
        existingFileCache[fileName] = size;
      }
    }
  }

  function compareDependencies(files, type) {
    for (let {
      fileName,
      contents
    } of files) {
      const size = contents.byteLength;
      statsSummary[type][fileName] = {
        size: size,
        gzip: zlib.gzipSync(contents).byteLength,
        brotli: zlib.brotliCompressSync(contents).byteLength
      };

      if (existingFileCache[fileName]) {
        const delta = (size - existingFileCache[fileName]) / 1000;
        statsSummary[type][fileName].delta = delta;
      }
    }
  }

  return {
    name: 'snowpack:rollup-plugin-stats',

    generateBundle(options, bundle) {
      outputDir = options.dir;
      buildExistingFileCache(bundle);
    },

    writeBundle(options, bundle) {
      const directDependencies = [];
      const commonDependencies = [];

      for (const [fileName, assetOrChunk] of Object.entries(bundle)) {
        const raw = assetOrChunk.type === 'asset' ? assetOrChunk.source : assetOrChunk.code;
        const contents = Buffer.isBuffer(raw) ? raw : typeof raw === 'string' ? Buffer.from(raw, 'utf8') : Buffer.from(raw);

        if (fileName.startsWith('common')) {
          commonDependencies.push({
            fileName,
            contents
          });
        } else {
          directDependencies.push({
            fileName,
            contents
          });
        }
      }

      compareDependencies(directDependencies, 'direct');
      compareDependencies(commonDependencies, 'common');
      cb(statsSummary);
    }

  };
}

const WEB_MODULES_TOKEN = 'web_modules/';
const WEB_MODULES_TOKEN_LENGTH = WEB_MODULES_TOKEN.length; // [@\w] - Match a word-character or @ (valid package name)
// (?!.*(:\/\/)) - Ignore if previous match was a protocol (ex: http://)

const BARE_SPECIFIER_REGEX = /^[@\w](?!.*(:\/\/))/;
const HAS_NAMED_IMPORTS_REGEX = /^[\t-\r ,0-9A-Z_a-z\xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]*\{([\s\S]*)\}/;
const SPLIT_NAMED_IMPORTS_REGEX = /\bas[\t-\r \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]+[0-9A-Z_a-z]+|,/;
const DEFAULT_IMPORT_REGEX = /import[\t-\r \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]+([0-9A-Z_a-z])+(,[\t-\r \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]\{[\t-\r 0-9A-Z_a-z\xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]*\})?[\t-\r \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]+from/;
const HTML_JS_REGEX = /<script.*?>(.*)<\/script>/gm;

function stripJsExtension(dep) {
  return dep.replace(/\.m?js$/i, '');
}

function createInstallTarget(specifier, all = true) {
  return {
    specifier,
    all,
    default: false,
    namespace: false,
    named: []
  };
}

function removeSpecifierQueryString(specifier) {
  const queryStringIndex = specifier.indexOf('?');

  if (queryStringIndex >= 0) {
    specifier = specifier.substring(0, queryStringIndex);
  }

  return specifier;
}

function getWebModuleSpecifierFromCode(code, imp) {
  // import.meta: we can ignore
  if (imp.d === -2) {
    return null;
  } // Static imports: easy to parse


  if (imp.d === -1) {
    return code.substring(imp.s, imp.e);
  } // Dynamic imports: a bit trickier to parse. Today, we only support string literals.


  const importStatement = code.substring(imp.s, imp.e);
  const importSpecifierMatch = importStatement.match(/^\s*['"](.*)['"]\s*$/m);
  return importSpecifierMatch ? importSpecifierMatch[1] : null;
}
/**
 * parses an import specifier, looking for a web modules to install. If a web module is not detected,
 * null is returned.
 */


function parseWebModuleSpecifier(specifier) {
  if (!specifier) {
    return null;
  } // If specifier is a "bare module specifier" (ie: package name) just return it directly


  if (BARE_SPECIFIER_REGEX.test(specifier)) {
    return specifier;
  } // Clean the specifier, remove any query params that may mess with matching


  const cleanedSpecifier = removeSpecifierQueryString(specifier); // Otherwise, check that it includes the "web_modules/" directory

  const webModulesIndex = cleanedSpecifier.indexOf(WEB_MODULES_TOKEN);

  if (webModulesIndex === -1) {
    return null;
  } // Check if this matches `@scope/package.js` or `package.js` format.
  // If it is, assume that this is a top-level pcakage that should be installed without the “.js”


  const resolvedSpecifier = cleanedSpecifier.substring(webModulesIndex + WEB_MODULES_TOKEN_LENGTH);
  const resolvedSpecifierWithoutExtension = stripJsExtension(resolvedSpecifier);

  if (validatePackageName(resolvedSpecifierWithoutExtension).validForNewPackages) {
    return resolvedSpecifierWithoutExtension;
  } // Otherwise, this is an explicit import to a file within a package.


  return resolvedSpecifier;
}

function parseImportStatement(code, imp) {
  const webModuleSpecifier = parseWebModuleSpecifier(getWebModuleSpecifierFromCode(code, imp));

  if (!webModuleSpecifier) {
    return null;
  }

  const importStatement = code.substring(imp.ss, imp.se);

  if (/^import\s+type/.test(importStatement)) {
    return null;
  }

  const dynamicImport = imp.d > -1;
  const defaultImport = !dynamicImport && DEFAULT_IMPORT_REGEX.test(importStatement);
  const namespaceImport = !dynamicImport && importStatement.includes('*');
  const namedImports = (importStatement.match(HAS_NAMED_IMPORTS_REGEX) || [, ''])[1].split(SPLIT_NAMED_IMPORTS_REGEX).map(name => name.trim()).filter(isTruthy);
  return {
    specifier: webModuleSpecifier,
    all: dynamicImport,
    default: defaultImport,
    namespace: namespaceImport,
    named: namedImports
  };
}

function getInstallTargetsForFile(code) {
  const [imports] = esModuleLexer.parse(code) || [];
  const allImports = imports.map(imp => parseImportStatement(code, imp)).filter(isTruthy);
  return allImports;
}

function scanDepList(depList, cwd) {
  return depList.map(whitelistItem => {
    if (!glob.hasMagic(whitelistItem)) {
      return [createInstallTarget(whitelistItem, true)];
    } else {
      const nodeModulesLoc = path.join(cwd, 'node_modules');
      return scanDepList(glob.sync(whitelistItem, {
        cwd: nodeModulesLoc,
        nodir: true
      }), cwd);
    }
  }).reduce((flat, item) => flat.concat(item), []);
}
async function scanImports({
  include,
  exclude
}) {
  await esModuleLexer.init;
  const includeFiles = glob.sync(`**/*`, {
    ignore: exclude,
    cwd: include,
    absolute: true,
    nodir: true
  });

  if (!includeFiles.length) {
    console.warn(`[SCAN ERROR]: No files matching "${include}"`);
    return [];
  } // Scan every matched JS file for web dependency imports


  const loadedFiles = await Promise.all(includeFiles.map(async filePath => {
    // Our import scanner can handle normal JS & even TypeScript without a problem.
    if (filePath.endsWith('.js') || filePath.endsWith('.mjs') || filePath.endsWith('.ts')) {
      return fs__default.promises.readFile(filePath, 'utf-8');
    } // JSX breaks our import scanner, so we need to transform it before sending it to our scanner.


    if (filePath.endsWith('.jsx') || filePath.endsWith('.tsx')) {
      const result = await babel.transformFileAsync(filePath, {
        plugins: [[require('@babel/plugin-transform-react-jsx'), {
          runtime: 'classic'
        }], [require('@babel/plugin-syntax-typescript'), {
          isTSX: true
        }]],
        babelrc: false,
        configFile: false
      });
      return result && result.code;
    }

    if (filePath.endsWith('.vue') || filePath.endsWith('.svelte')) {
      const result = await fs__default.promises.readFile(filePath, 'utf-8'); // TODO: Replace with matchAll once Node v10 is out of TLS.
      // const allMatches = [...result.matchAll(HTML_JS_REGEX)];

      const allMatches = [];
      let match;

      while (match = HTML_JS_REGEX.exec(result)) {
        allMatches.push(match);
      }

      return allMatches.map((full, code) => code).join('\n');
    } // If we don't recognize the file type, it could be source. Warn just in case.


    if (!mime.lookup(path.extname(filePath))) {
      console.warn(chalk.dim(`ignoring unsupported file "${path.relative(process.cwd(), filePath)}"`));
    }

    return null;
  }));
  return loadedFiles.filter(code => !!code).map(code => getInstallTargetsForFile(code)).reduce((flat, item) => flat.concat(item), []).sort((impA, impB) => impA.specifier.localeCompare(impB.specifier));
}

/** The minimum width, in characters, of each size column */

const SIZE_COLUMN_WIDTH = 11;
/** Generic Object.entries() alphabetical sort by keys. */

function entriesSort([filenameA], [filenameB]) {
  return filenameA.localeCompare(filenameB);
}
/** Pretty-prints number of bytes as "XXX KB" */


function formatSize(size) {
  let kb = Math.round(size / 1000 * 100) / 100;

  if (kb >= 1000) {
    kb = Math.floor(kb);
  }

  let color;

  if (kb < 15) {
    color = 'green';
  } else if (kb < 30) {
    color = 'yellow';
  } else {
    color = 'red';
  }

  return chalk[color](`${kb} KB`.padEnd(SIZE_COLUMN_WIDTH));
}

function formatDelta(delta) {
  const kb = Math.round(delta * 100) / 100;
  const color = delta > 0 ? 'red' : 'green';
  return chalk[color](`Δ ${delta > 0 ? '+' : ''}${kb} KB`);
}

function formatFileInfo(filename, stats, padEnd, isLastFile) {
  const lineGlyph = chalk.dim(isLastFile ? '└─' : '├─');
  const lineName = filename.padEnd(padEnd);
  const fileStat = formatSize(stats.size);
  const gzipStat = formatSize(stats.gzip);
  const brotliStat = formatSize(stats.brotli);
  const lineStat = fileStat + gzipStat + brotliStat;
  let lineDelta = '';

  if (stats.delta) {
    lineDelta = chalk.dim('[') + formatDelta(stats.delta) + chalk.dim(']');
  } // Trim trailing whitespace (can mess with formatting), but keep indentation.


  return `    ` + `${lineGlyph} ${lineName} ${lineStat} ${lineDelta}`.trim();
}

function formatFiles(files, padEnd) {
  const strippedFiles = files.map(([filename, stats]) => [filename.replace(/^common\//, ''), stats]);
  return strippedFiles.map(([filename, stats], index) => formatFileInfo(filename, stats, padEnd, index >= files.length - 1)).join('\n');
}

function printStats(dependencyStats) {
  let output = '';
  const {
    direct,
    common
  } = dependencyStats;
  const allDirect = Object.entries(direct).sort(entriesSort);
  const allCommon = Object.entries(common).sort(entriesSort);
  const maxFileNameLength = [...allCommon, ...allDirect].reduce((max, [filename]) => Math.max(filename.length, max), 'web_modules/'.length) + 1;
  output += `  ⦿ ${chalk.bold('web_modules/'.padEnd(maxFileNameLength + 4))}` + chalk.bold.underline('size'.padEnd(SIZE_COLUMN_WIDTH - 2)) + '  ' + chalk.bold.underline('gzip'.padEnd(SIZE_COLUMN_WIDTH - 2)) + '  ' + chalk.bold.underline('brotli'.padEnd(SIZE_COLUMN_WIDTH - 2)) + `\n`;
  output += `${formatFiles(allDirect, maxFileNameLength)}\n`;

  if (Object.values(common).length > 0) {
    output += `  ⦿ ${chalk.bold('web_modules/common/ (Shared)')}\n`;
    output += `${formatFiles(allCommon, maxFileNameLength)}\n`;
  }

  return `\n${output}\n`;
}

const cwd = process.cwd();
const banner = chalk.bold(`snowpack`) + ` installing... `;
const installResults = [];
let dependencyStats = null;
let spinner = ora(banner);
let spinnerHasError = false;

function printHelp() {
  console.log(`
${chalk.bold(`snowpack`)} - Install npm dependencies to run natively on the web.
${chalk.bold('Options:')}
  --dest [path]             Specify destination directory (default: "web_modules/").
  --clean                   Clear out the destination directory before install.
  --optimize                Transpile, minify, and optimize installed dependencies for production.
  --env                     Set environment variable(s) inside dependencies:
                                - if only NAME given, reads value from real env var
                                - if \`NAME=value\`, uses given value
                                - NODE_ENV defaults to "production" with "--optimize" (overridable)
  --babel                   Transpile installed dependencies. Also enabled with "--optimize".
  --include [glob]          Auto-detect imports from file(s). Supports glob.
  --exclude [glob]          Exclude files from --include. Follows glob’s ignore pattern.
  --config [path]           Location of Snowpack config file.
  --strict                  Only install pure ESM dependency trees. Fail if a CJS module is encountered.
  --no-source-map           Skip emitting source map files (.js.map) into dest
  --stat                    Logs install statistics after installing, with information on install targets and file sizes. Useful for CI, performance review.
  --nomodule [path]         Your app’s entry file for generating a <script nomodule> bundle
  --nomodule-output [path]  Filename for nomodule output (default: "app.nomodule.js")
    ${chalk.bold('Advanced:')}
  --external-package [val]  Internal use only, may be removed at any time.
    `.trim());
}

function formatInstallResults() {
  return installResults.map(([d, result]) => {
    if (result === 'SUCCESS') {
      return chalk.green(d);
    }

    if (result === 'ASSET') {
      return chalk.yellow(d);
    }

    if (result === 'FAIL') {
      return chalk.red(d);
    }

    return d;
  }).join(', ');
}

function logError(msg) {
  if (!spinnerHasError) {
    spinner.stopAndPersist({
      symbol: chalk.cyan('⠼')
    });
  }

  spinnerHasError = true;
  spinner = ora(chalk.red(msg));
  spinner.fail();
}

function logUpdate(msg) {
  spinner.text = banner + msg;
}

class ErrorWithHint extends Error {
  constructor(message, hint) {
    super(message);
    this.hint = hint;
  }

} // Add common, well-used non-esm packages here so that Rollup doesn't die trying to analyze them.


const PACKAGES_TO_AUTO_DETECT_EXPORTS = [path.join('react', 'index.js'), path.join('react-dom', 'index.js'), 'react-is', 'prop-types', 'scheduler', 'rxjs', 'exenv', 'body-scroll-lock'];

function detectExports(filePath) {
  try {
    const fileLoc = require.resolve(filePath, {
      paths: [cwd]
    });

    if (fs__default.existsSync(fileLoc)) {
      return Object.keys(require(fileLoc)).filter(e => e[0] !== '_');
    }
  } catch (err) {// ignore
  }
}
/**
 * Resolve a "webDependencies" input value to the correct absolute file location.
 * Supports both npm package names, and file paths relative to the node_modules directory.
 * Follows logic similar to Node's resolution logic, but using a package.json's ESM "module"
 * field instead of the CJS "main" field.
 */


function resolveWebDependency(dep, isExplicit) {
  // if dep includes a file extension, check that dep isn't a package before returning
  if (path.extname(dep) && !validatePackageName(dep).validForNewPackages) {
    const isJSFile = ['.js', '.mjs', '.cjs'].includes(path.extname(dep));
    return {
      type: isJSFile ? 'JS' : 'ASSET',
      loc: require.resolve(dep, {
        paths: [cwd]
      })
    };
  }

  const [depManifestLoc, depManifest] = resolveDependencyManifest(dep, cwd);

  if (!depManifest) {
    throw new ErrorWithHint(`"${dep}" not found. Have you installed the package via npm?`, depManifestLoc && chalk.italic(depManifestLoc));
  }

  if (depManifest.name && (depManifest.name.startsWith('@reactesm') || depManifest.name.startsWith('@pika/react'))) {
    throw new Error(`React workaround packages no longer needed! Revert back to the official React & React-DOM packages.`);
  }

  let foundEntrypoint = depManifest['browser:module'] || depManifest.module || depManifest['main:esnext'] || depManifest.browser; // Some packages define "browser" as an object. We'll do our best to find the
  // right entrypoint in an entrypoint object, or fail otherwise.
  // See: https://github.com/defunctzombie/package-browser-field-spec

  if (typeof foundEntrypoint === 'object') {
    foundEntrypoint = foundEntrypoint[dep] || foundEntrypoint['./index.js'] || foundEntrypoint['./index'] || foundEntrypoint['./'] || foundEntrypoint['.'];
  } // If the package was a part of the explicit whitelist, fallback to it's main CJS entrypoint.


  if (!foundEntrypoint && isExplicit) {
    foundEntrypoint = depManifest.main || 'index.js';
  }

  if (dep === 'react' && (!foundEntrypoint || foundEntrypoint === 'index.js')) {
    foundEntrypoint = 'umd/react.production.min.js';
  }

  if (dep === 'react-dom' && (!foundEntrypoint || foundEntrypoint === 'index.js')) {
    foundEntrypoint = 'umd/react-dom.production.min.js';
  }

  if (typeof foundEntrypoint !== 'string') {
    throw new Error(`"${dep}" has unexpected entrypoint: ${JSON.stringify(foundEntrypoint)}.`);
  }

  return {
    type: 'JS',
    loc: path.join(depManifestLoc, '..', foundEntrypoint)
  };
}
/**
 * Formats the snowpack dependency name from a "webDependencies" input value:
 * 2. Remove any ".js"/".mjs" extension (will be added automatically by Rollup)
 */


function getWebDependencyName(dep) {
  return dep.replace(/\.m?js$/i, '');
}
/**
 * Takes object of env var mappings and converts it to actual
 * replacement specs as expected by @rollup/plugin-replace. The
 * `optimize` arg is used to derive NODE_ENV default.
 *
 * @param env
 * @param optimize
 */


function getRollupReplaceKeys(env) {
  const result = Object.keys(env).reduce((acc, id) => {
    const val = env[id];
    acc[`process.env.${id}`] = `${JSON.stringify(val === true ? process.env[id] : val)}`;
    return acc;
  }, {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    'process.env.': '({}).'
  });
  return result;
}

async function install(installTargets, {
  hasBrowserlistConfig,
  lockfile
}, config) {
  const {
    webDependencies,
    installOptions: {
      installTypes,
      dest: destLoc,
      externalPackage: externalPackages,
      alias: installAlias,
      sourceMap,
      env
    },
    rollup: userDefinedRollup,
    devOptions: {
      hot
    }
  } = config;

  const knownNamedExports = _objectSpread2({}, userDefinedRollup.namedExports);

  for (const filePath of PACKAGES_TO_AUTO_DETECT_EXPORTS) {
    knownNamedExports[filePath] = knownNamedExports[filePath] || detectExports(filePath) || [];
  }

  if (!webDependencies && !fs__default.existsSync(path.join(cwd, 'node_modules'))) {
    logError('no "node_modules" directory exists. Did you run "npm install" first?');
    return;
  }

  const allInstallSpecifiers = new Set(installTargets.map(dep => dep.specifier).map(specifier => installAlias[specifier] || specifier).sort());
  const installEntrypoints = {};
  const assetEntrypoints = {};
  const importMap = {
    imports: {}
  };
  const installTargetsMap = {};

  for (const installSpecifier of allInstallSpecifiers) {
    const targetName = getWebDependencyName(installSpecifier);

    if (lockfile && lockfile.imports[installSpecifier]) {
      installEntrypoints[targetName] = lockfile.imports[installSpecifier];
      importMap.imports[installSpecifier] = `./${targetName}.js`;
      installResults.push([targetName, 'SUCCESS']);
      logUpdate(formatInstallResults());
      continue;
    }

    try {
      const {
        type: targetType,
        loc: targetLoc
      } = resolveWebDependency(installSpecifier, true);

      if (targetType === 'JS') {
        installEntrypoints[targetName] = targetLoc;
        importMap.imports[installSpecifier] = `./${targetName}.js`;
        Object.entries(installAlias).filter(([key, value]) => value === installSpecifier).forEach(([key, value]) => {
          importMap.imports[key] = `./${targetName}.js`;
        });
        installTargetsMap[targetLoc] = installTargets.filter(t => installSpecifier === t.specifier);
        installResults.push([installSpecifier, 'SUCCESS']);
      } else if (targetType === 'ASSET') {
        assetEntrypoints[targetName] = targetLoc;
        installResults.push([installSpecifier, 'ASSET']);
      }

      logUpdate(formatInstallResults());
    } catch (err) {
      installResults.push([installSpecifier, 'FAIL']);
      logUpdate(formatInstallResults());


      logError(err.message || err);

      if (err.hint) {
        // Note: Wait 1ms to guarantee a log message after the spinner
        setTimeout(() => console.log(err.hint), 1);
      }

      return false;
    }
  }

  if (Object.keys(installEntrypoints).length === 0 && Object.keys(assetEntrypoints).length === 0) {
    logError(`No ESM dependencies found!`);
    console.log(chalk.dim(`  At least one dependency must have an ESM "module" entrypoint. You can find modern, web-ready packages at ${chalk.underline('https://www.pika.dev')}`));
    return false;
  }

  const inputOptions = {
    input: installEntrypoints,
    external: externalPackages,
    treeshake: {
      moduleSideEffects: 'no-external'
    },
    plugins: [rollupPluginReplace(getRollupReplaceKeys(env)), rollupPluginEntrypointAlias({
      cwd
    }), !!webDependencies && rollupPluginDependencyCache({
      installTypes,
      log: url => logUpdate(chalk.dim(url))
    }), rollupPluginAlias({
      entries: Object.entries(installAlias).map(([alias, mod]) => ({
        find: alias,
        replacement: mod
      }))
    }), rollupPluginNodeResolve({
      mainFields: ['browser:module', 'module', 'browser', 'main'].filter(isTruthy),
      extensions: ['.mjs', '.cjs', '.js', '.json'],
      // whether to prefer built-in modules (e.g. `fs`, `path`) or local ones with the same names
      preferBuiltins: false,
      dedupe: userDefinedRollup.dedupe
    }), rollupPluginJson({
      preferConst: true,
      indent: '  ',
      compact: false,
      namedExports: true
    }), rollupPluginCommonjs({
      extensions: ['.js', '.cjs'],
      namedExports: knownNamedExports
    }), rollupPluginDependencyStats(info => dependencyStats = info), ...userDefinedRollup.plugins].filter(Boolean),

    onwarn(warning, warn) {
      if (warning.code === 'UNRESOLVED_IMPORT') {
        logError(`'${warning.source}' is imported by '${warning.importer}', but could not be resolved.`);

        if (isNodeBuiltin(warning.source)) {
          console.log(chalk.dim(`  '${warning.source}' is a Node.js builtin module that won't exist in the browser.`));
          console.log(chalk.dim(`  Find a more web-friendly alternative, or add the "rollup-plugin-node-polyfills" plugin to your Snowpack config file.`));
        } else {
          console.log(chalk.dim(`  Make sure that the package is installed and that the file exists.`));
        }

        return;
      }

      warn(warning);
    }

  };
  const outputOptions = {
    dir: destLoc,
    format: 'system',
    sourcemap: sourceMap,
    exports: 'named',
    chunkFileNames: 'common/[name]-[hash].js'
  };

  if (Object.keys(installEntrypoints).length > 0) {
    try {
      const packageBundle = await rollup.rollup(inputOptions);
      logUpdate(formatInstallResults());
      await packageBundle.write(outputOptions);
    } catch (err) {
      const {
        loc
      } = err;

      if (!loc || !loc.file) {
        throw err;
      } // NOTE: Rollup will fail instantly on error. Because of that, we can
      // only report one error at a time. `err.watchFiles` also exists, but
      // for now `err.loc.file` has all the information that we need.


      const failedExtension = path.extname(loc.file);
      const suggestion = MISSING_PLUGIN_SUGGESTIONS[failedExtension];

      if (!suggestion) {
        throw err;
      } // Display posix-style on all environments, mainly to help with CI :)


      const fileName = loc.file.replace(cwd + path.sep, '').replace(/\\/g, '/');
      logError(`${chalk.bold('snowpack')} could not import ${fileName}. ${suggestion}`);
      return;
    }
  }

  await writeLockfile(path.join(destLoc, 'import-map.json'), importMap);
  Object.entries(assetEntrypoints).forEach(([assetName, assetLoc]) => {
    mkdirp.sync(path.dirname(`${destLoc}/${assetName}`));
    fs__default.copyFileSync(assetLoc, `${destLoc}/${assetName}`);
  });
  return true;
}
async function cli(args) {
  // parse CLI flags
  const cliFlags = yargs(args, {
    array: ['env', 'exclude', 'externalPackage']
  }); // if printing help, stop here

  if (cliFlags.help) {
    printHelp();
    process.exit(0);
  }

  if (cliFlags.reload) {
    console.log(`${chalk.yellow('ℹ')} clearing CDN cache...`);
    await clearCache();
  }

  if (cliFlags['_'].length > 3) {
    console.log(`Unexpected multiple commands`);
    process.exit(1);
  } // Load the current package manifest


  let pkgManifest;

  try {
    pkgManifest = require(path.join(cwd, 'package.json'));
  } catch (err) {
    console.log(chalk.red('[ERROR] package.json required but no file was found.'));
    process.exit(1);
  } // load config


  const config = loadAndValidateConfig(cliFlags, pkgManifest); // load lockfile

  let lockfile = await readLockfile(cwd);
  let newLockfile = null;

  if (cliFlags['_'][2] === 'build') {
    await command({
      cwd,
      config
    });
    return;
  }

  if (cliFlags['_'][2] === 'dev') {
    await command$1({
      cwd,
      port: cliFlags.port || 3000,
      config,
      hot: cliFlags.hot || config.dev.hot
    });
    return;
  }

  const {
    exclude,
    include,
    installOptions: {
      clean,
      dest
    },
    knownEntrypoints,
    webDependencies
  } = config;
  const hasBrowserlistConfig = !!pkgManifest.browserslist || !!process.env.BROWSERSLIST || fs__default.existsSync(path.join(cwd, '.browserslistrc')) || fs__default.existsSync(path.join(cwd, 'browserslist'));
  const installTargets = [];

  if (knownEntrypoints) {
    installTargets.push(...scanDepList(knownEntrypoints, cwd));
  }

  if (webDependencies) {
    installTargets.push(...scanDepList(Object.keys(webDependencies), cwd));
  }

  if (include) {
    installTargets.push(...(await scanImports({
      include,
      exclude
    })));
  }

  if (installTargets.length === 0) {
    logError('Nothing to install.');
    return;
  }

  spinner.start();
  const startTime = Date.now();

  if (webDependencies && Object.keys(webDependencies).length > 0) {
    newLockfile = await resolveTargetsFromRemoteCDN(lockfile, pkgManifest, config).catch(err => {
      logError(err.message || err);
      process.exit(1);
    });
  }

  if (clean) {
    rimraf.sync(dest);
  }

  await mkdirp(dest);
  const finalResult = await install(installTargets, {
    hasBrowserlistConfig,
    lockfile: newLockfile
  }, config).catch(err => {
    if (err.loc) {
      console.log('\n' + chalk.red.bold(`✘ ${err.loc.file}`));
    }

    if (err.url) {
      console.log(chalk.dim(`👉 ${err.url}`));
    }

    throw err;
  });

  if (finalResult) {
    spinner.succeed(chalk.bold(`snowpack`) + ` install complete.` + chalk.dim(` [${((Date.now() - startTime) / 1000).toFixed(2)}s]`));

    if (!!dependencyStats) {
      console.log(printStats(dependencyStats));
    }
  }

  if (newLockfile) {
    await writeLockfile(path.join(cwd, 'snowpack.lock.json'), newLockfile);
  } // If an error happened, set the exit code so that programmatic usage of the CLI knows.
  // We were seeing race conditions here, so add a little buffer.


  if (spinnerHasError) {
    setTimeout(() => {
      spinner.warn(chalk(`Finished with warnings.`));
      process.exitCode = 1;
    }, 20);
  }
}

exports.cli = cli;
exports.install = install;
//# sourceMappingURL=index.js.map
