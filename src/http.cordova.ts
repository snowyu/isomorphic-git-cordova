import { HTTP } from '@ionic-native/http';
import { collect } from './isomorphic-git/src/utils/collect';

export interface GitProgressEvent {
  phase: string;
  loaded: number;
  total: number;
}

export type ProgressCallback = (progress: GitProgressEvent) => void | Promise<void>;

export type GitHttpRequest = {
  /**
   * - The URL to request
   */
  url: string;
  /**
   * - The HTTP method to use
   */
  method?: string;
  /**
   * - Headers to include in the HTTP request
   */
  headers?: {
      [x: string]: string;
  };
  /**
   * - An async iterator of Uint8Arrays that make up the body of POST requests
   */
  body?: any;
  /**
   * - Reserved for future use (emitting `GitProgressEvent`s)
   */
  onProgress?: ProgressCallback;
  /**
   * - Reserved for future use (canceling a request)
   */
  signal?: any;
};

export type GitHttpResponse = {
  /**
   * - The final URL that was fetched after any redirects
   */
  url: string;
  /**
   * - The HTTP method that was used
   */
  method?: string;
  /**
   * - HTTP response headers
   */
  headers?: {
      [x: string]: string;
  };
  /**
   * - An async iterator of Uint8Arrays that make up the body of the response
   */
  body?: any;
  /**
   * - The HTTP status code
   */
  statusCode: number;
  /**
   * - The HTTP status message
   */
  statusMessage: string;
};

interface GitHttpRequestEx extends GitHttpRequest {
  method: "GET" | "POST" | "PUT" | "PATCH" | "HEAD" | "DELETE" | "OPTIONS" | "UPLOAD" | "DOWNLOAD" |
          "get" | "post" | "put" | "patch" | "head" | "delete" | "options" | "upload" | "download";
  timeout?: number;
}

export async function request({
  onProgress,
  url,
  method = 'get',
  headers = {},
  timeout = 68,
  body,
}: GitHttpRequestEx): Promise<GitHttpResponse> {
  // streaming uploads aren't possible yet in the browser
  if (body) {
    body = await collect(body)
  }
  method = method.toLowerCase() as any;
  const opts: any = {
    method, headers, timeout,
    data: body,
    serializer: 'raw',
    responseType: 'arraybuffer',
  };
  let res;
  try {
    res = await HTTP.sendRequest(url, opts)
  } catch(err) {
    if (err.status < 0) throw err;
    res = err;
  }
  const iter = res.data ? [new Uint8Array(res.data)]: undefined;
  // convert Header object to ordinary JSON
  headers = res.headers;
  return {
    url: res.url,
    method,
    statusCode: res.status,
    statusMessage: res.error||'OK',
    body: iter,
    headers,
  }
}

export default { request }

