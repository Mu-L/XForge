"use strict";
/**
 * @en Registration method for the main process of Extension
 * @zh 为扩展的主进程的注册方法
 */
/**
 * // 打开panel
 * Editor.Panel.open(`${插件名}.${panel名}`);
 * // 调用普通事件
 * Editor.Message.request(插件名, 消息名, ...args);
 * // 调用场景方法
 * Editor.Message.request('scene', 'execute-scene-script', {
 *      //插件名
 *      name: string,
 *      //方法名
 *      method: string,
 *      //参数列表
 *      args: any[]
 *  });
 *
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unload = exports.load = exports.methods = void 0;
// path.join不能正确处理'db://'结构，会把'//'变成'/'
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const utils_1 = require("./utils");
const adminFolderName = 'app-admin';
const controlFolderName = 'app-control';
const managerFolderName = 'app-manager';
const modelFolderName = 'app-model';
const soundFolderName = 'app-sound';
const viewFolderName = 'app-view';
const builtinFolderName = 'app-builtin';
const bundleFolderName = 'app-bundle';
const builtinFolderUrl = 'db://assets/' + builtinFolderName;
const builtinFolderPath = utils_1.convertUrlToPath(builtinFolderUrl);
const bundleFolderUrl = 'db://assets/' + bundleFolderName;
const bundleFolderPath = utils_1.convertUrlToPath(bundleFolderUrl);
const adminFolderUrl = builtinFolderUrl + '/' + adminFolderName;
const adminFolderPath = builtinFolderPath + '/' + adminFolderName;
const controlFolderUrl = builtinFolderUrl + '/' + controlFolderName;
const controlFolderPath = builtinFolderPath + '/' + controlFolderName;
const managerFolderUrl = builtinFolderUrl + '/' + managerFolderName;
const managerFolderPath = builtinFolderPath + '/' + managerFolderName;
const modelFolderUrl = builtinFolderUrl + '/' + modelFolderName;
const modelFolderPath = builtinFolderPath + '/' + modelFolderName;
const soundFolderUrl = bundleFolderUrl + '/' + soundFolderName;
const soundFolderPath = bundleFolderPath + '/' + soundFolderName;
const viewFolderUrl = bundleFolderUrl + '/' + viewFolderName;
const viewFolderPath = bundleFolderPath + '/' + viewFolderName;
const executorFileUrl = adminFolderUrl + '/executor.ts';
const executorFilePath = adminFolderPath + '/executor.ts';
function isFolderVaild(info) {
    if (!info.path)
        return true;
    if (path_1.default.dirname(info.path) !== 'db://assets')
        return true;
    const basename = path_1.default.basename(info.path);
    if (basename === 'app')
        return true;
    if (basename === 'app-appinit')
        return true;
    if (basename === 'app-builtin')
        return true;
    if (basename === 'app-bundle')
        return true;
    if (basename === 'app-scene')
        return true;
    if (basename === 'res-bundle')
        return true;
    if (basename === 'res-native')
        return true;
    if (basename === 'resources')
        return true;
    return false;
}
async function deleteInvalidFolders() {
    await Editor.Message.request('asset-db', 'query-assets', { pattern: 'db://assets/*' })
        .then(infos => {
        const deletePaths = infos.filter(info => !isFolderVaild(info)).map(info => info.path);
        if (deletePaths.length) {
            Editor.Dialog.error(`${deletePaths.join('\r\n')}\r\n只允许使用插件App创建的文件夹`, { title: '非法文件夹', buttons: ['确认'] });
            deletePaths.forEach(deletePath => {
                Editor.Message.request('asset-db', 'delete-asset', deletePath);
            });
        }
    });
}
function isExecutor(info, strict = true) {
    if (!strict) {
        if (info.path.endsWith('Control') && info.type === 'cc.Script')
            return true;
        if (info.path.endsWith('Manager') && (info.type === 'cc.Script' || info.type === 'cc.Prefab'))
            return true;
        if ((info.name.startsWith('data.') || info.name.startsWith('config.')) && info.type === 'cc.Script')
            return true;
        if ((info.name.startsWith('Page') || info.name.startsWith('Paper') || info.name.startsWith('Pop') || info.name.startsWith('Top'))
            && (info.type === 'cc.Script' || info.type === 'cc.Prefab'))
            return true;
        if (info.type === 'cc.AudioClip')
            return true;
        return false;
    }
    if (info.path === builtinFolderUrl)
        return true;
    if (info.path === bundleFolderUrl)
        return true;
    if (info.path === managerFolderUrl)
        return true;
    if (info.path === controlFolderUrl)
        return true;
    if (info.path === modelFolderUrl)
        return true;
    if (info.path === soundFolderUrl)
        return true;
    if (info.path === viewFolderUrl)
        return true;
    if (info.path.startsWith(controlFolderUrl)) {
        return info.path.endsWith('Control') && info.type === 'cc.Script';
    }
    if (info.path.startsWith(managerFolderUrl)) {
        return info.path.endsWith('Manager') && (info.type === 'cc.Script' || info.type === 'cc.Prefab');
    }
    if (info.path.startsWith(modelFolderUrl)) {
        return (info.name.startsWith('data.') || info.name.startsWith('config.')) && info.type === 'cc.Script';
    }
    if (info.path.startsWith(viewFolderUrl)) {
        return (info.name.startsWith('Page') || info.name.startsWith('Paper') || info.name.startsWith('Pop') || info.name.startsWith('Top'))
            && (info.type === 'cc.Script' || info.type === 'cc.Prefab');
    }
    if (info.path.startsWith(soundFolderUrl)) {
        return info.type === 'cc.AudioClip';
    }
}
function compareStr(str1, str2) {
    if (str1 === str2) {
        return 0;
    }
    const len = Math.max(str1.length, str2.length);
    for (let i = 0, code1 = 0, code2 = 0; i < len; i++) {
        if (str1.length <= i) {
            return -1;
        }
        else if (str2.length <= i) {
            return 1;
        }
        else {
            code1 = str1.charCodeAt(i);
            code2 = str2.charCodeAt(i);
            if (code1 > code2) {
                return 1;
            }
            else if (code1 < code2) {
                return -1;
            }
        }
    }
    return 0;
}
const viewSelect = ['Page', 'Paper', 'Pop', 'Top'];
const viewRegExp = RegExp(`^(${viewSelect.join('|')})`);
function readFileSyncByPath(url) {
    const filepath = utils_1.convertUrlToPath(url);
    return fs_1.existsSync(filepath) ? fs_1.readFileSync(filepath, 'utf8') : '';
}
function isTSDefault(value) {
    const extname = value[3];
    if (extname.endsWith('js')) {
        return false;
    }
    const filename = value[0];
    // const res = cc.require(filename);
    // const keys = Object.keys(res);
    // if (keys.length === 1 && keys[0] === 'default') {
    //     return true;
    // }
    // return false;
    // storage,db://assets/app/lib/storage,storage,ts
    const filepath = path_1.default.join(utils_1.convertUrlToPath(value[1]), filename + '.ts');
    const js = fs_1.readFileSync(filepath, 'utf8');
    return js.search(/export\s+default/) >= 0;
}
const keyWords = [
    'lib', 'manager', 'Manager', 'data', 'config',
    'IViewName', 'IViewNames', 'IMiniViewName', 'IMiniViewNames', 'IMusicName', 'IMusicNames', 'IEffecName', 'IEffecNames',
    'miniViewNames', 'viewNamesEnum', 'musicNamesEnum', 'effecNamesEnum'
];
async function clearExecutor() {
    if (!fs_1.existsSync(executorFilePath))
        return;
    const viewKeys = { never: '' };
    const miniViewKeys = { never: '' };
    const musicKeys = { never: '' };
    const effecKeys = { never: '' };
    let result = '/* eslint-disable */\n' +
        'import { Component } from \'cc\';\n' +
        'import { app } from \'../../app/app\';\n' +
        'import { DEV,EDITOR } from \'cc/env\';\n\n';
    result += 'enum viewNames { \'' + Object.keys(viewKeys).join('\',\'') + '\'}\n';
    result += 'const miniViewNames = ' + JSON.stringify(miniViewKeys) + '\n';
    result += 'enum musicNames { \'' + Object.keys(musicKeys).join('\',\'') + '\'}\n';
    result += 'enum effecNames { \'' + Object.keys(effecKeys).join('\',\'') + '\'}\n\n';
    result += 'export type IViewName = keyof typeof viewNames\n';
    result += 'export type IViewNames = IViewName[]\n';
    result += 'export type IMiniViewName = keyof typeof miniViewNames\n';
    result += 'export type IMiniViewNames = IMiniViewName[]\n';
    result += 'export type IMusicName = keyof typeof musicNames\n';
    result += 'export type IMusicNames = IMusicName[]\n';
    result += 'export type IEffecName = keyof typeof effecNames\n';
    result += 'export type IEffecNames = IEffecName[]\n\n';
    // data
    result += 'if(!EDITOR||DEV) Object.assign(app.data, {})\n';
    // config
    result += 'if(!EDITOR||DEV) Object.assign(app.config, {})\n\n';
    result += 'export type IApp = {\n';
    result += '    Manager: {},\n';
    result += '    manager: {},\n';
    result += '    data: {},\n';
    result += '    config: {}\n';
    result += '}\n';
    // 修正windows系统中的\为/
    result = result.replace(/\\/g, '/');
    // save
    if (readFileSyncByPath(executorFileUrl) !== result) {
        await Editor.Message.request('asset-db', 'create-asset', executorFileUrl, result, {
            overwrite: true
        });
    }
}
async function updateExecutor() {
    // app-builtin文件夹不存在, 创建
    if (!fs_1.existsSync(builtinFolderPath))
        await utils_1.createFolderByUrl(builtinFolderUrl, { readme: utils_1.getReadme(builtinFolderName) });
    // app-admin文件夹不存在, 创建
    if (!fs_1.existsSync(adminFolderPath))
        await utils_1.createFolderByUrl(adminFolderUrl, { meta: utils_1.getMeta(adminFolderName), readme: utils_1.getReadme(adminFolderName) });
    const mgrs = [];
    const datas = [];
    const confs = [];
    const viewKeys = {};
    const miniViewKeys = {};
    const musicKeys = {};
    const effecKeys = {};
    // app-control app-manager app-model
    const result1 = await Editor.Message.request('asset-db', 'query-assets', { pattern: builtinFolderUrl + '/{app-control,app-manager/*,app-model}/*.ts' })
        .then(res => {
        return res.sort((a, b) => compareStr(a.name, b.name));
    })
        .catch(() => []);
    // app-sound
    const result2 = await Editor.Message.request('asset-db', 'query-assets', { pattern: soundFolderUrl + '/{music,effect}/**/*.*' })
        .then(res => {
        return res.sort((a, b) => compareStr(a.name, b.name));
    })
        .catch(() => []);
    // app-view
    const result3 = await Editor.Message.request('asset-db', 'query-assets', { pattern: viewFolderUrl + '/{page,pop,top,paper/*}/*/native/*.prefab' })
        .then(res => {
        return res.sort((a, b) => compareStr(a.name, b.name));
    })
        .catch(() => []);
    // manager
    const result4 = await Editor.Message.request('asset-db', 'query-assets', { pattern: 'db://app/manager/**/*.ts' })
        .then(res => {
        return res.sort((a, b) => compareStr(a.name, b.name));
    })
        .catch(() => []);
    // 集合
    const results = result1.slice().concat(result2).concat(result3).concat(result4);
    for (let index = 0; index < results.length; index++) {
        const result = results[index];
        const fileurl = result.url;
        // 文件名.扩展名
        const basename = path_1.default.basename(result.url || '') || '';
        // 扩展名
        const extname = path_1.default.extname(result.url || '') || '';
        // 文件名
        const filename = basename.slice(0, -extname.length);
        // 文件目录名
        const dirname = path_1.default.dirname(result.url || '') || '';
        if (!basename)
            continue;
        if (!extname)
            continue;
        if (!filename)
            continue;
        if (!dirname)
            continue;
        if (extname === '.ts') {
            // 变量名
            const varname = filename.replace(/[.-]/g, '_');
            if (keyWords.indexOf(varname) >= 0) {
                console.log(`[跳过此文件] [${filename}] 原因: ${varname}与关键字中(${JSON.stringify(keyWords)})的一个重复`);
            }
            else if (fileurl.startsWith(managerFolderUrl)) {
                // 用户manager
                if (filename.endsWith('Manager') && dirname.endsWith(utils_1.stringCaseNegate(filename.slice(0, -7)))) {
                    mgrs.push([filename, dirname, varname, extname]);
                }
            }
            else if (fileurl.startsWith('db://app/manager/')) {
                // 系统manager
                if (filename.endsWith('Manager') && dirname.endsWith(filename.slice(0, -7).toLocaleLowerCase())) {
                    mgrs.push([filename, dirname, varname, extname]);
                }
            }
            else if (fileurl.startsWith(modelFolderUrl)) {
                // model
                if (filename.startsWith('data.')) {
                    datas.push([filename, dirname, varname, extname]);
                }
                else if (filename.startsWith('config.')) {
                    confs.push([filename, dirname, varname, extname]);
                }
            }
        }
        else if (extname === '.prefab') {
            if (fileurl.startsWith(viewFolderUrl) && viewRegExp.test(filename)) {
                const dirArray = dirname.split('/');
                const index = dirArray.indexOf(viewFolderName);
                const viewDirArray = dirArray.slice(index + 1);
                // viewKeys
                if (['page', 'paper', 'pop', 'top'].indexOf(viewDirArray[0].toLowerCase()) >= 0) {
                    // 主界面
                    if (filename === `${utils_1.stringCase(viewDirArray[0], false)}${utils_1.stringCase(viewDirArray[1], false)}`) {
                        viewKeys[filename] = filename;
                    }
                    // 子界面
                    else if (filename === `${utils_1.stringCase(viewDirArray[0], false)}${utils_1.stringCase(viewDirArray[1], false)}${utils_1.stringCase(viewDirArray[2], false)}`) {
                        miniViewKeys[filename] = `${utils_1.stringCase(viewDirArray[0], false)}${utils_1.stringCase(viewDirArray[1], false)}`;
                    }
                }
                else {
                    if (filename === `${utils_1.stringCase(viewDirArray[1], false)}${utils_1.stringCase(viewDirArray[2], false)}`) {
                        viewKeys[filename] = filename;
                    }
                    // 子界面
                    else if (filename === `${utils_1.stringCase(viewDirArray[1], false)}${utils_1.stringCase(viewDirArray[2], false)}${utils_1.stringCase(viewDirArray[3], false)}`) {
                        miniViewKeys[filename] = `${utils_1.stringCase(viewDirArray[0], false)}${utils_1.stringCase(viewDirArray[1], false)}`;
                    }
                }
            }
        }
        else if (fileurl.startsWith(soundFolderUrl)) {
            const dir = path_1.default.join(dirname.split(soundFolderName + '/').pop(), filename);
            if (dir.startsWith('music')) {
                // musicKeys
                musicKeys[dir] = dir;
            }
            else {
                // effecKeys
                effecKeys[dir] = dir;
            }
        }
    }
    let result = '/* eslint-disable */\n' +
        'import { Component } from \'cc\';\n' +
        'import { app } from \'../../app/app\';\n' +
        'import { DEV,EDITOR } from \'cc/env\';\n\n';
    const handle = function handle(arr, module) {
        arr.forEach(function (value, index, array) {
            // storage
            const filename = value[0];
            // db://assets/app/lib/storage
            const dirname = value[1];
            // storage
            const varname = value[2];
            if (isTSDefault(value)) {
                result += `import ${varname} from '${path_1.default.join(path_1.default.relative(adminFolderPath, utils_1.convertUrlToPath(dirname)), filename)}'\n`;
            }
            else if (module) {
                result += `import {${varname}} from '${path_1.default.join(path_1.default.relative(adminFolderPath, utils_1.convertUrlToPath(dirname)), filename)}'\n`;
            }
            else {
                result += `import * as ${varname} from '${path_1.default.join(path_1.default.relative(adminFolderPath, utils_1.convertUrlToPath(dirname)), filename)}'\n`;
            }
            array[index] = varname;
        });
    };
    // manager
    handle(mgrs, true);
    let MgrStr = '';
    let mgrStr = '';
    mgrs.forEach(function (varname, index, array) {
        MgrStr += `${varname.slice(0, -7)}:Omit<typeof ${varname},keyof Component>`;
        if (varname === 'UIManager') {
            mgrStr += `${varname.slice(0, -7).toLocaleLowerCase()}:Omit<${varname}<IViewName,IMiniViewName>,keyof Component>`;
        }
        else if (varname === 'SoundManager') {
            mgrStr += `${varname.slice(0, -7).toLocaleLowerCase()}:Omit<${varname}<IEffecName,IMusicName>,keyof Component>`;
        }
        else {
            mgrStr += `${varname.slice(0, -7).toLocaleLowerCase()}:Omit<${varname},keyof Component>`;
        }
        if (index < array.length - 1) {
            MgrStr += ',';
            mgrStr += ',';
        }
    });
    if (Object.keys(viewKeys).length === 0)
        viewKeys['never'] = '';
    if (Object.keys(miniViewKeys).length === 0)
        miniViewKeys['never'] = '';
    if (Object.keys(musicKeys).length === 0)
        musicKeys['never'] = '';
    if (Object.keys(effecKeys).length === 0)
        effecKeys['never'] = '';
    result += 'enum viewNames { \'' + Object.keys(viewKeys).join('\',\'') + '\'}\n';
    result += 'const miniViewNames = ' + JSON.stringify(miniViewKeys) + '\n';
    result += 'enum musicNames { \'' + Object.keys(musicKeys).join('\',\'') + '\'}\n';
    result += 'enum effecNames { \'' + Object.keys(effecKeys).join('\',\'') + '\'}\n\n';
    result += 'export type IViewName = keyof typeof viewNames\n';
    result += 'export type IViewNames = IViewName[]\n';
    result += 'export type IMiniViewName = keyof typeof miniViewNames\n';
    result += 'export type IMiniViewNames = IMiniViewName[]\n';
    result += 'export type IMusicName = keyof typeof musicNames\n';
    result += 'export type IMusicNames = IMusicName[]\n';
    result += 'export type IEffecName = keyof typeof effecNames\n';
    result += 'export type IEffecNames = IEffecName[]\n\n';
    // data
    handle(datas, false);
    result += `if(!EDITOR||DEV) Object.assign(app.data, {${datas.map(varname => `${varname.slice(5)}:new ${varname}()`).join(',')}})\n`;
    // config
    handle(confs, false);
    result += `if(!EDITOR||DEV) Object.assign(app.config, {${confs.map(varname => `${varname.slice(7)}:new ${varname}()`).join(',')}})\n\n`;
    result += 'export type IApp = {\n';
    result += `    Manager: {${MgrStr}},\n`;
    result += `    manager: {${mgrStr}},\n`;
    result += `    data: {${datas.map(varname => `${varname.slice(5)}:${varname}`).join(',')}},\n`;
    result += `    config: {${confs.map(varname => `${varname.slice(7)}:${varname}`).join(',')}}\n`;
    result += '}\n';
    // 修正windows系统中的\为/
    result = result.replace(/\\/g, '/');
    // save
    if (readFileSyncByPath(executorFileUrl) !== result) {
        await Editor.Message.request('asset-db', 'create-asset', executorFileUrl, result, {
            overwrite: true
        });
    }
}
let timer = null;
function callUpdateExecutor(clear = false) {
    if (timer)
        return;
    if (clear) {
        clearExecutor();
        callUpdateExecutor(false);
    }
    else {
        timer = setTimeout(() => {
            updateExecutor().finally(() => {
                timer = null;
            });
        }, 500);
    }
}
exports.methods = {
    ['open-panel']() {
        Editor.Panel.open('app.open-panel');
    },
    ['update-executor']() {
        callUpdateExecutor();
    },
    ['asset-db:ready']() {
        updateExecutor().finally(() => {
            deleteInvalidFolders();
        });
    },
    ['asset-db:asset-add'](uuid, info) {
        if (!isFolderVaild(info)) {
            Editor.Dialog.error(`${info.path}\r\n只允许使用插件App创建的文件夹`, { title: '非法文件夹', buttons: ['确认'] });
            Editor.Message.request('asset-db', 'delete-asset', info.path);
            return;
        }
        if (!isExecutor(info))
            return;
        callUpdateExecutor();
    },
    ['asset-db:asset-change'](uuid, info) {
        if (!isFolderVaild(info)) {
            Editor.Dialog.error(`${info.path}\r\n只允许使用插件App创建的文件夹`, { title: '非法文件夹', buttons: ['确认'] });
            Editor.Message.request('asset-db', 'delete-asset', info.path);
            return;
        }
        if (!isExecutor(info, false))
            return;
        callUpdateExecutor();
    },
    ['asset-db:asset-delete'](uuid, info) {
        if (!isExecutor(info))
            return;
        callUpdateExecutor(true);
    }
};
/**
 * @en Hooks triggered after extension loading is complete
 * @zh 扩展加载完成后触发的钩子
 */
function load() {
    Editor.Message.request('asset-db', 'query-ready')
        .then(ready => {
        if (!ready)
            return;
        updateExecutor().finally(() => {
            deleteInvalidFolders();
        });
    });
}
exports.load = load;
/**
 * @en Hooks triggered after extension uninstallation is complete
 * @zh 扩展卸载完成后触发的钩子
 */
function unload() { }
exports.unload = unload;
