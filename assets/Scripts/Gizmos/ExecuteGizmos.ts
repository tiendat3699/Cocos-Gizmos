import { Component, director, Director } from 'cc';
import { Editor } from './Define';

if (Editor) {
    let root = director.getScene();
    const w = window as any;

    if (!sessionStorage.getItem('gizmosUpdating')) {
        sessionStorage.setItem('gizmosUpdating', 'true');
        director.on(Director.EVENT_BEFORE_UPDATE, gizmosUpdate);
        director.on(Director.EVENT_AFTER_SCENE_LAUNCH, () => {
            root = director.getScene();
        });
    }

    function gizmosUpdate() {
        if (!root) return;
        if (!w._componentsGizmos) return;
        const selectedList: string[] = Editor.Selection.getSelected('node');
        for (let i = 0; i < w._componentsGizmos.length; i++) {
            const comps: Component[] = root.getComponentsInChildren(w._componentsGizmos[i]);
            comps.forEach((comp) => {
                comp.onDrawGizmos?.();
                if (selectedList.includes(comp.node.uuid)) {
                    comp.onDrawGizmosSelected?.();
                }
            });
        }
    }
}
