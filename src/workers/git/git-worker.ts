import { PWBHost } from "promise-worker-bi";

import Worker from 'worker-loader!./git.worker';
import { getDataDir } from '@libs/cordova';
import { IWorkerMessage, IWorkerFunctions } from '../types';

const worker = new Worker();
const promiseWorker = new PWBHost(worker);
let uuid = 0;
const events: IWorkerFunctions = {};

promiseWorker.register(function(message: any) {
  if (message) {
    return notify(message.id, message.name, message.args);
  } else {
    throw new TypeError('missing message argument');
  }

});

async function notify(id, name, args?) {
  if (!id) throw new TypeError('missing event id in message');
  const func = events[id];
  if (func)
    return (args) ? func(...args) : func();
  else {
    throw new Error(`No Such event '${name}' callback: ${id}`);
  }
}

export async function init(dir?: string) {
  const vMsg: IWorkerMessage = {type: 'exec', name: 'init'};
  const vRoot = await getDataDir();
  console.log('TCL::: init -> vRoot', vRoot);
  const vArgs = vMsg.args = [vRoot];
  if (dir) vArgs.push(dir);
  return promiseWorker.postMessage(vMsg);
}

export async function clone(options: any) {
  if (!options) throw new TypeError('missing clone options');
  const vMsg: IWorkerMessage = {type: 'exec', name: 'clone', args: [options]};
  const vCBs: any[] = [];
  ['onProgress', 'onMessage', 'onAuth', 'onAuthFailure', 'onAuthSuccess'].forEach(function(name) {
    const vCallback = options[name];
    if (vCallback) {
      const id = uuid++;
      vCBs.push(id);
      options[name] = id;
      events[uuid] = vCallback;
    }
  });
  try {
    const result = await promiseWorker.postMessage(vMsg);
    return result;
  } finally {
    vCBs.forEach(id => delete events[id]);
  }
}
