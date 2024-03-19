'use strict';
var __importDefault =
    (this && this.__importDefault) ||
    function (mod) {
        return mod && mod.__esModule ? mod : { default: mod };
    };
function load() {
    exports.methods.installRuntime();
}
function unload() {}
Object.defineProperty(exports, '__esModule', { value: !0 });
exports.unload = exports.load = exports.methods = void 0;
const fs_1 = __importDefault(require('fs'));
const path_1 = __importDefault(require('path'));
exports.methods = {
    async installRuntime() {
        let installPath = path_1.default.resolve(__dirname, '../../../assets');
        if (!fs_1.default.existsSync(installPath + '/cocos-gizmos')) {
            let resourcePath = path_1.default.resolve(__dirname, '../packages/cocos-gizmos.zip');
            await Editor.Utils.File.unzip(resourcePath, installPath);
            console.log('[Package] cocos gizmos runtime installed');
            Editor.Message.request('asset-db', 'refresh-asset', 'db://assets');
        }
    },
};
exports.load = load;
exports.unload = unload;
