import { FileReader, FileEntry, IFile, FileWriter } from '@ionic-native/file';

export async function readFileEntry(vFile: FileEntry, encoding?: BufferEncoding|null): Promise<string|ArrayBuffer|null> {
  return new Promise(function(resolve, reject) {
    vFile.file(function(file){
      const reader = new FileReader();
      reader.onloadend = function(evt) {
        let content: ArrayBuffer|string = this.result as ArrayBuffer;
        if (content !== undefined || content !== null) {
          if (encoding) {
            content = Buffer.from(content).toString(encoding);
          }
          resolve(content);
        }
        else if (reader.error !== undefined || reader.error !== null) {
            reject(reader.error);
        }
        else {
            reject({ code: null, message: 'READER_ONLOADEND_ERR' });
        }

      };
      reader.onerror = reject;
      reader.onabort = reject;
      reader.readAsArrayBuffer(file);
    }, reject);
  });
}

export async function writeFileEntry(
      vFile: FileEntry, data: ArrayBuffer|Blob|string,
      options: {encoding?: BufferEncoding; append?: boolean;truncate?:number} = {}): Promise<boolean>
{
  if (typeof data === 'string') {
    const encoding = options.encoding ||'utf8';
    data = Buffer.from(data, encoding);
  }

  if (data instanceof Uint8Array) data = data.buffer;
  return new Promise(function(resolve, reject) {
    vFile.createWriter(function(writer){
      if (options.append) {
        writer.seek(writer.length);
      }
      if (options.truncate) {
        writer.truncate(options.truncate);
      }
      writer.onwriteend = function(evt) {
        resolve(true);
      };
      writer.onerror = reject;
      writer.onabort = reject;
      writer.write(data);
    }, reject);
  });
}
