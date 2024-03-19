import { _decorator, Component, macro, Node } from 'cc';
import { EDITOR } from 'cc/env';

const { ccclass } = _decorator;

@ccclass('Visualization')
export default class Visualization extends Component {
    protected onDrawGizmos?(): void;
    protected onDrawGizmosSelected?(): void;
    private _onFocus: boolean = false;

    protected update(dt: number): void {
        if (EDITOR) {
            this.onDrawGizmos?.();
            this._onFocus && this.onDrawGizmosSelected?.();
        }
    }

    onFocusInEditor(): void {
        this._onFocus = true;
    }

    onLostFocusInEditor(): void {
        this._onFocus = false;
    }
}
