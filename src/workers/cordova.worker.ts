declare const self: any;
export {};

self.window = self as any;
self.window.Event = function() {};
self.window.prompt = function() {};
self.window.innerHeight = 1;
self.history = {};
self.document = {
  readyState: "complete",
  addEventListener: function() {},
  querySelector: function() {},
  getElementsByTagName: function() {
    return [];
  },
  createElement: function() {
    return {
      pathname: "",
      setAttribute: function() {}
    };
  },
  createEvent: function() {
    return {
      initEvent: function() {}
    };
  },
  documentElement: {
    style: {
      transition: ""
    }
  },
  head: {
    children: [],
    appendChild: function(child) {
      self.importScripts(child.src);
      child.onload();
    }
  },
  body: {
    classList: {
      add: function() {}
    }
  },
  dispatchEvent: () => {}
};
