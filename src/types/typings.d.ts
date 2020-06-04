// declare module "quasar";
// Allow .json files imports
declare module "*.json";
// declare module "*.json" {
//   const value: any;
//   export default value;
// }
// declare module "pouchdb";

declare module "worker-loader!*" {
  class WebpackWorker extends Worker {
    constructor();
  }

  export default WebpackWorker;
}
