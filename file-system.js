'use strict';

const fs = require('fs');
const fsExtra = require('fs-extra');
const pathUtil = require('path');
const promisify = require('es6-promisify');
const rimraf = require('rimraf');
const mkdirpCallback = require('mkdirp');
const globCb = require('glob');
const unlink = promisify(fs.unlink);
const rename = promisify(fs.rename);
const copy = promisify(fsExtra.copyFile);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const rmrf = promisify(rimraf);
const mkdirp = promisify(mkdirpCallback);
const glob = promisify(globCb);

class FileUtil {

    removeFile(path) {
        return unlink(path)
            .then(() => true)
            .catch(err => {
                if (err.code === 'ENOENT') return false; // don't throw if the file doesn't exist
                throw err;
            });
    }

    removeDir(path) {
        return rmrf(path); // rm -rf, doesn't throw if the dir doesn't exist
    }

    createDir(path) {
        return mkdirp(path); // mkdir -p, creates parent dirs, doesn't throw if already exists
    }

    createEmptyDir(path) {
        return this.removeDir(pathUtil.join(path, '*')) // on docker you can't remove the entire folder because it's a volume, only its contents
            .then(() => this.createDir(path));
    }

    createDirForFile(path) {
        let dirPath = path.slice(0, path.lastIndexOf('/'));
        return this.createDir(dirPath);
    }

    moveFile(pathFrom, pathTo) {
        return rename(pathFrom, pathTo)
            .catch(err => {
                if (err.code === 'EXDEV') { // in docker the app files are in a mounted volume, but koa uploads to the unmounted /tmp
                    return copy(pathFrom, pathTo)
                        .then(() => unlink(pathFrom));
                }
                throw err;
            });
    }

    exists(path) {
        return stat(path)
            .then(() => true)
            .catch(err => {
                if (err.code === 'ENOENT') return false;
                throw err;
            });
        // 'fs.exists' is deprecated, if stat does't throw then the file or dir exists
    }

    getFileStats(path) {
        return stat(path);
    }

    // Utility only return filenames
    findFiles(dir, pattern) {
        return glob(`${dir}/${pattern}`);
    }

    readFile(path, encoding) {
        return encoding ? readFile(path, encoding) : readFile(path);
    }

    writeFile(path, data) {
        return writeFile(path, data);
    }
}

module.exports = new FileUtil();
