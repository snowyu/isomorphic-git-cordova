import { PWBWorker } from "promise-worker-bi";
import path from 'path.js/lib/posix';
declare const self: any;
import '../cordova.worker';
self.importScripts("cordova.js");
import git from '@libs/isomorphic-git';
import http from '@libs/isomorphic-git/http';
import { getFS } from '@libs/cordova/fs';
import { IWorkerFunctions } from '../types';

const promiseWorker = new PWBWorker();
let fs: any;
let rootDir: string = '';
const funcs: IWorkerFunctions = {};

promiseWorker.register(async function(message: any) {
  if (message) {
    switch (message.type) {
      case 'exec':
        return exec(message.name, message.args);
      case 'addEvt':
        break;
      case 'rmEvt':
        break;
    }
  } else {
    throw new TypeError('missing message argument');
  }
});

function exec(name: string, args?: any[]) {
  if (!name) throw new TypeError('missing function name in message');
  const func = funcs[name];
  if (func)
    return (args) ? func(...args) : func();
  else {
    throw new Error('No Such function:' + name);
  }
}

funcs.init = async function init(root:string, dir?: string) {
  if (!fs) fs = getFS(root);
  console.log('TCL::: init -> fs', fs);
  const vFS = fs.promises;
  if (dir) {
    if (!await vFS.isDirExists(dir)) {
      const result = await vFS.mkdir(dir);
    }
    rootDir = dir;
  }
}

function checkOpts(options) {
  if (!options) throw new TypeError('missing clone options');
  if (!fs) throw new TypeError('call init first');
  options.fs = fs;
  options.http = http;
  if (rootDir) {
    if (options.dir) options.dir = path.join(rootDir, options.dir);
    if (options.gitdir) options.gitdir = path.join(rootDir, options.gitdir);
  }
}

funcs.clone = async function clone(options) {
  checkOpts(options);
  ['onProgress', 'onMessage', 'onAuth', 'onAuthFailure', 'onAuthSuccess'].forEach(function(name) {
    const vMsgName = options[name];
    if (vMsgName) options[name] = async function() {
      const vMsg = {id: vMsgName, name, args: [...arguments]}
      return await promiseWorker.postMessage(vMsg, undefined);
    }
  })
  return await git.clone(options);
}

funcs.listBranches = async function listBranches(options) {
  checkOpts(options);
  return await git.listBranches(options);
}

funcs.listFiles = async function listFiles(options) {
  checkOpts(options);
  return await git.listFiles(options);
}

funcs.log = async function log(options) {
  checkOpts(options);
  return await git.log(options);
}
