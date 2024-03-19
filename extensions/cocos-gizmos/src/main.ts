import fs from 'fs';
import path from 'path';

/**
 * @en Registration method for the main process of Extension
 * @zh 为扩展的主进程的注册方法
 */
export const methods: { [key: string]: (...any: any) => any } = {
    async installRuntime() {
        let installPath = path.resolve(__dirname, '../../../assets');
        if (!fs.existsSync(installPath + '/cocos-gizmos')) {
            let resourcePath = path.resolve(__dirname, '../packages/cocos-gizmos.zip');
            await Editor.Utils.File.unzip(resourcePath, installPath);
            console.log('[Package] cocos gizmos runtime installed');
            Editor.Message.request('asset-db', 'refresh-asset', 'db://assets');
        }
    },
};

/**
 * @en Hooks triggered after extension loading is complete
 * @zh 扩展加载完成后触发的钩子
 */
export function load() {
    methods.installRuntime();
}

/**
 * @en Hooks triggered after extension uninstallation is complete
 * @zh 扩展卸载完成后触发的钩子
 */
export function unload() {}
