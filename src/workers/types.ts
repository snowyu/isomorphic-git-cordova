export interface IWorkerFunctions {
  [name: string]: (...args: any[]) => any;
  [name: number]: (...args: any[]) => any;
}

export interface IWorkerMessage {
  id?: string|number;
  name: string; // function name
  args?: any; // functions args
  type: 'exec'|'addEvt'|'rmEvt';
}

