// the cordova file system for isomorphic-git
import { File, Entry, FileEntry, Metadata } from '@ionic-native/file';
import { path } from './isomorphic-git/src/utils/path';

import { readFileEntry, writeFileEntry } from './file-entry';

const queue = [] as (()=>void)[];
let dataDir!: string;

export function getFS(root: string) {
  dataDir = root;
  return fs;
}
// let dataDir: string = File.dataDirectory;
export const fs: any = {};
// console.log('TCL::: File.externalDataDirectory', File.externalDataDirectory);
// console.log('TCL::: File.dataDirectory', File.dataDirectory);

interface IReadFileOptions {
  encoding?: BufferEncoding; // default to utf8
  flag?: string; // rwx not supported on Cordova File. 也不支持符号链接 symlink
}

interface IWriteFileOptions extends IReadFileOptions{
  mode?: number; /// Default: 0o666 not supported on Cordova File
  append?: boolean;
  replace?: boolean;
}

  fs.promises = {
    async readFile(aPath: string| Buffer, options?: IReadFileOptions|BufferEncoding) {
      if (aPath && typeof aPath !== 'string') {
        aPath = aPath.toString('hex');
      }
      // console.log('TCL::: readFile -> ', aPath);
      aPath = path.join(dataDir, aPath as string);
      const encoding = (options && typeof options === 'object') ? options.encoding: options as BufferEncoding;
      try {
        const vEntry = await File.resolveLocalFilesystemUrl(aPath) as FileEntry;
        if (!vEntry.isFile) {throw new Error('this is not a file:' + aPath)};
        const result = await readFileEntry(vEntry, encoding);
        return result;

      } catch (error) {
        if (error.code !== 1) console.log('TCL::: readFile -> error', aPath, error);
        if (error.code === 1) error.code = 'ENOENT'
        throw error;
      }
    },
    async writeFile(aPath: string|Buffer, data: ArrayBuffer | Blob | string,
      options: IWriteFileOptions|BufferEncoding = {})
    {
      if (aPath && typeof aPath !== 'string') {
        aPath = aPath.toString('hex');
      }
      // console.log('TCL::: writeFile -> ', aPath, options);
      aPath = path.join(dataDir, aPath as string);
      if (typeof options === 'string') options = {encoding: options};
      const encoding = options.encoding ||'utf8';
      const getFileOpts = {
        create: !options.append,
        exclusive: !options.replace,
      };
      try {
        const vEntry = await File.resolveLocalFilesystemUrl(aPath);
        if (vEntry.isFile) getFileOpts.create = false;
      } catch (error) {
        // console.log('TCL::: writeFile -> error', aPath, error);
        if (error.code !== 1) throw error;
      }
      const {dir, filename} = splitPath(aPath);
      const vDirEntry = await File.resolveDirectoryUrl(dir);
      // console.log('TCL::: writeFile -> vDirEntry', vDirEntry);
      // if (!vEntry.isFile) {throw new Error('this is not a file:' + aPath)};
      const vEntry = await File.getFile(vDirEntry, filename, getFileOpts);
      // console.log('TCL::: writeFile -> vEntry', vEntry);
      try {
        return await writeFileEntry(vEntry, data, options as any);

      } catch (error) {
        if (error.code !== 1) console.log('TCL::: writeFile -> error', aPath, error);
        if (error.code === 1) error.code = 'ENOENT'
        throw error;
      }
    },
    async unlink(aPath: string) {
      // console.log('TCL::: unlink -> ', aPath);
      aPath = path.join(dataDir, aPath);
      const {dir, filename} = splitPath(aPath);
      try {
        const result = await File.removeFile(dir, filename);
        return result;
      } catch (error) {
        if (error.code !== 1) console.log('TCL::: unlink -> error', aPath, error);
        if (aPath.endsWith('/3.txt')) console.log(`'TCL::: unlink -> error', ${aPath}, ${error.code}, ${error.message}`);
        if (error.code === 1) error.code = 'ENOENT'
        if (aPath.endsWith('/3.txt')) console.log(`'TCL::: unlink -> error', ${error.code}, ${error.message}`);
        throw error;
      }
    },
    async readdir(aPath: string, options: {exclusive?: boolean} = {}) {
      // console.log('TCL::: readdir -> ', aPath);
      aPath = path.join(dataDir, aPath);
      if (options.exclusive == null) options.exclusive = false;
      const {dir, filename} = splitPath(aPath);
      try {
        const vDirEntry = await File.resolveDirectoryUrl(dir);
        const vDir = await File.getDirectory(vDirEntry, filename, options);
        const vEntries = await (File as any).readEntries(vDir.createReader());
        const result = vEntries.map((entry: Entry) => entry.name);
        // console.log('TCL::: readdir -> result', aPath, result);
        return result;
      } catch (error) {
        if (error.code !== 1 && error.code !== 11) console.log('TCL::: readdir -> error', aPath, error);
        if (error.code === 1 || error.code === 11) error.code = 'ENOTDIR'
        throw error;
      }
    },
    async mkdir(aPath: string, options?: {replace?: boolean}) {
      // console.log('TCL::: mkdir -> ', aPath);
      aPath = path.join(dataDir, aPath);
      const replace = options && options.replace || false;
      const {dir, filename} = splitPath(aPath);
      try {
        const result = await File.createDir(dir, filename, replace);
        // console.log('TCL::: mkdir -> result', result);
        return result;

      } catch (error) {
        if (error.code !== 1 && error.code !== 12 && error.code !== 13) console.log(`TCL::: mkdir -> error', ${aPath}, ${error.code}, ${error.message}`);
        if (error.code === 1) error.code = 'ENOENT';
        else if (error.code === 12 || error.code === 13) error.code = 'EEXIST';
        throw error;
      }
    },
    async rmdir(aPath: string) {
      // console.log('TCL::: rmdir -> ', aPath);
      aPath = path.join(dataDir, aPath);
      const {dir, filename} = splitPath(aPath);
      try {
        return await File.removeDir(dir, filename);
      } catch (error) {
        if (error.code !== 1) console.log('TCL::: rmdir -> error', aPath, error);
        if (error.code === 1) error.code = 'ENOENT';
        // else if (error.code === 12) error.code = 'EEXIST';
        throw error;
      }
    },
    async rename(aPath: string, newPath: string) {
      // console.log('TCL::: rename -> ', aPath);
      aPath = path.join(dataDir, aPath);
      const {dir, filename} = splitPath(aPath);
      const {dir: newDir, filename: newFilename} = splitPath(newPath);
      try {
        return await File.moveFile(dir, filename, newDir, newFilename);
      } catch (error) {
        if (error.code !== 1) console.error('TCL::: rename -> error', aPath, error);
        if (error.code === 1) error.code = 'ENOENT';
        // else if (error.code === 12) error.code = 'EEXIST';
        throw error;
      }
    },
    async stat(aPath: string) {
      // console.log('TCL::: stat -> ', aPath);
      aPath = path.join(dataDir, aPath);
      try {
        const vEntry = await File.resolveLocalFilesystemUrl(aPath);
        const meta = await getMetadata(vEntry);
        const type = vEntry.isDirectory ? 'dir' :'file';
        // console.log('TCL::: stat ->', aPath, meta, type);
        const mtime = meta.modificationTime;
        const mtimeMs = mtime.valueOf();
        const size = meta.size;
        return new Stat({type, size, mtime, mtimeMs, mode: 33188})
      } catch (error) {
        if (error.code !== 1) console.error('TCL::: stat -> error', aPath, error);
        if (error.code === 1) error.code = 'ENOENT'
        throw error;
      }
    },
    async lstat(aPath: string) {
      // console.log('TCL::: lstat -> ', aPath);
      return this.stat(aPath);
    },
    async readlink(aPath: string, options?: IReadFileOptions|BufferEncoding) {
      // console.log('TCL::: readlink -> ', aPath);
      return this.readFile(aPath, options);
    },
    async symlink(aPath: string, aTarget: string) {
      aTarget = path.join(dataDir, aTarget);
      const {dir: newDir, filename: newFilename} = splitPath(aTarget);
      const {dir, filename} = splitPath(path.resolve(newDir, aPath));
      return File.copyFile(dir, filename, newDir, newFilename);
    },
    async isFileExists(aPath: string) {
      let result;
      try {
        // result = await File.checkDir(dataDir, aPath);
        aPath = path.join(dataDir, aPath);
        const vEntry = await File.resolveLocalFilesystemUrl(aPath);
        result = vEntry.isFile;
      } catch (error) {
        if (error.code !== 1) throw error;
        result = false;
      }
      return result;
    },
    async isDirExists(aPath: string) {
      let result;
      try {
        aPath = path.join(dataDir, aPath);
        const vEntry = await File.resolveLocalFilesystemUrl(aPath);
        result = vEntry.isDirectory;
      } catch (error) {
        // console.log('TCL::: isDirExists -> error', error);
        if (error.code !== 1) throw error;
        result = false;
      }
      // console.log('TCL::: isDirExists -> result', aPath, result);
      return result;
    },
  }

function splitPath(aPath: string) {
  const i = aPath.lastIndexOf('/');
  const dir = aPath.substring(0, i);
  const filename = aPath.substring(i+1);
  return {dir, filename};
}

function getMetadata(vEntry: Entry): Promise<Metadata> {
  return new Promise((resolve, reject)=>{
    vEntry.getMetadata((meta)=>resolve(meta), (err)=>reject(err));
  })
}

class Stat {
  type: string;
  mode: number;
  size: number;
  ino: number;
  mtimeMs: number;
  ctimeMs: number;
  uid: number;
  gid: number;
  dev: number;

  constructor(stats: any) {
    this.type = stats.type;
    this.mode = stats.mode;
    this.size = stats.size;
    this.ino = stats.ino;
    this.mtimeMs = stats.mtimeMs;
    this.ctimeMs = stats.ctimeMs || stats.mtimeMs;
    this.uid = 1;
    this.gid = 1;
    this.dev = 1;
  }

  isFile() {
    return this.type === 'file';
  }

  isDirectory() {
    return this.type === 'dir';
  }

  isSymbolicLink() {
    return this.type === 'symlink';
  }
}
