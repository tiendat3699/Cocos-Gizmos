import { EDITOR, EDITOR_NOT_IN_PREVIEW } from 'cc/env';

export const cce = EDITOR_NOT_IN_PREVIEW && (window as any).cce;
export const Editor = EDITOR && (window as any).Editor;
