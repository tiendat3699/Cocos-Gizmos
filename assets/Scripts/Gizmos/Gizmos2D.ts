import {
    _decorator,
    CCObject,
    Color,
    Component,
    Graphics,
    IVec2Like,
    Label,
    Layers,
    Node,
    Sprite,
    SpriteFrame,
    toRadian,
    Vec2,
    Vec3,
} from 'cc';

const { ccclass, executeInEditMode } = _decorator;

class GizmosRenderer {
    private _graphic: Graphics;
    private _drawCalls: ((graphic: Graphics) => void)[] = [];

    public addDrawCall(drawCall: (graphic: Graphics) => void) {
        this._drawCalls.push(drawCall);
    }

    public addDrawTextCall(labelID: string, drawCall: () => void) {
        this._drawCalls.push(() => drawCall());
    }

    public addDrawSpriteCall(spriteID: string, drawCall: (sprite: Sprite) => void) {}

    constructor(graphic: Graphics) {
        this._graphic = graphic;
    }

    public clear() {
        this._graphic.clear();
    }

    public setLayer(layer: Layers.Enum) {
        this._graphic.node.layer = layer;
    }

    public draw() {
        this._drawCalls.forEach((drawCall) => {
            drawCall(this._graphic);
        });

        this._drawCalls = [];
    }
}

@ccclass('Gizmos2D.GizmosDebugDraw')
@executeInEditMode
class GizmosDebugDraw extends Component {
    private _renderers: Map<string, GizmosRenderer> = new Map();
    private _labelMap: Map<string, Label> = new Map();
    private _spriteMap: Map<string, Sprite> = new Map();
    private _color: Color = Gizmos2D.DEFAULT_COLOR;
    private _useLocalPosition: boolean = false;
    private _layer: Layers.Enum = Gizmos2D.DEFAULT_LAYER;
    private _drawCallsNoneGeometry: (() => void)[] = [];

    protected lateUpdate(dt: number): void {
        this._labelMap.forEach((label) => {
            label.string = '';
        });

        this._spriteMap.forEach((sprite) => {
            sprite.spriteFrame = null;
        });

        this._renderers.forEach((renderer) => {
            renderer.clear();
            renderer.draw();
        });

        this._drawCallsNoneGeometry.forEach((drawCall) => {
            drawCall();
        });

        this._drawCallsNoneGeometry = [];

        this._color = Gizmos2D.DEFAULT_COLOR;
        this._useLocalPosition = false;
        this._layer = Gizmos2D.DEFAULT_LAYER;
    }

    private createRenderer(color: Color) {
        const hex = color.toHEX();
        const g = new Node(`color ${hex}`).addComponent(Graphics);
        g.lineWidth = 5;
        g.strokeColor = color;
        g.fillColor = color;
        g.node.layer = this.node.layer;
        g.node.parent = this.node;
        g.node.setPosition(Vec3.ZERO);
        const renderer = new GizmosRenderer(g);
        return renderer;
    }

    private getRenderer(color: Color): GizmosRenderer {
        const hex = color.toHEX();
        let renderer = this._renderers.get(hex);
        if (!renderer) {
            renderer = this.createRenderer(color);
            this._renderers.set(hex, renderer);
        }
        return renderer;
    }

    private worldToLocal(world: IVec2Like): IVec2Like {
        const local = new Vec3();
        this.node.inverseTransformPoint(local, new Vec3(world.x, world.y));
        return local;
    }

    private getSprite(id: string) {
        let sprite = this._spriteMap.get(id);
        if (!sprite) {
            sprite = new Node('spriteID: ' + id).addComponent(Sprite);
            this._spriteMap.set(id, sprite);
            sprite.node.layer = this.node.layer;
            sprite.node.setParent(this.node);
        }

        return sprite;
    }

    private getLabel(id: string): Label {
        let label = this._labelMap.get(id);
        if (!label) {
            label = new Node('labelID: ' + id).addComponent(Label);
            this._labelMap.set(id, label);
            label.node.layer = this.node.layer;
            label.node.setParent(this.node);
        }

        return label;
    }

    public setColor(color: Color) {
        this._color = color;
    }

    public setUseLocalPosition(value: boolean) {
        this._useLocalPosition = value;
    }

    public setLayer(layer: Layers.Enum) {
        this._layer = layer;
    }

    public drawSprite(
        id: string,
        spriteFrame: SpriteFrame,
        position: IVec2Like,
        scale: Vec2 = Vec2.ONE,
        color: Color = Color.WHITE,
    ) {
        const sprite = this.getSprite(id);
        sprite.node.layer = this._layer;
        this._drawCallsNoneGeometry.push(() => {
            sprite.color = color;
            sprite.spriteFrame = spriteFrame;
            sprite.node.setScale(new Vec3(scale.x, scale.y));
            const p = new Vec3(position.x, position.y);
            if (this._useLocalPosition) {
                sprite.node.setPosition(p);
            } else {
                sprite.node.setWorldPosition(p);
            }
        });
    }

    public drawLabel(id: string, text: string, position: IVec2Like, fontSize: number = 40, scale: Vec2 = Vec2.ONE) {
        const color = this._color.clone();
        const label = this.getLabel(id);
        label.node.layer = this._layer;
        this._drawCallsNoneGeometry.push(() => {
            label.color = color;
            label.fontSize = fontSize;
            label.lineHeight = fontSize;
            label.string = text;
            label.node.setScale(new Vec3(scale.x, scale.y));
            const p = new Vec3(position.x, position.y);
            if (this._useLocalPosition) {
                label.node.setPosition(p);
            } else {
                label.node.setWorldPosition(p);
            }
        });
    }

    public drawLine(point1: IVec2Like, point2: IVec2Like) {
        const color = this._color.clone();
        const renderer = this.getRenderer(color);
        renderer.setLayer(this._layer);
        const p1 = this._useLocalPosition ? point1 : this.worldToLocal(point1);
        const p2 = this._useLocalPosition ? point1 : this.worldToLocal(point2);
        renderer.addDrawCall((g) => {
            g.moveTo(p1.x, p1.y);
            g.lineTo(p2.x, p2.y);
            g.stroke();
        });
    }

    public drawLineList(points: IVec2Like[], close: boolean = false) {
        const color = this._color.clone();
        const renderer = this.getRenderer(color);
        renderer.setLayer(this._layer);
        const pointList = this._useLocalPosition ? points : points.map((p) => this.worldToLocal(p));
        renderer.addDrawCall((g) => {
            if (points.length > 0) {
                const p0 = pointList[0];
                g.moveTo(p0.x, p0.y);
                for (let i = 1; i < pointList.length; i++) {
                    const p = pointList[i];
                    g.lineTo(p.x, p.y);
                }
                if (close) g.close();
                g.stroke();
            }
        });
    }

    public drawCircle(center: IVec2Like, radius: number) {
        const color = this._color.clone();
        const renderer = this.getRenderer(color);
        renderer.setLayer(this._layer);
        const c = this._useLocalPosition ? center : this.worldToLocal(center);
        renderer.addDrawCall((g) => {
            g.circle(c.x, c.y, radius);
            g.stroke();
        });
    }

    public drawSolidCircle(center: IVec2Like, radius: number) {
        const color = this._color.clone();
        const renderer = this.getRenderer(color);
        renderer.setLayer(this._layer);
        const c = this._useLocalPosition ? center : this.worldToLocal(center);
        renderer.addDrawCall((g) => {
            g.circle(c.x, c.y, radius);
            g.fill();
        });
    }

    public drawRect(position: IVec2Like, width: number, height: number) {
        const color = this._color.clone();
        const renderer = this.getRenderer(color);
        renderer.setLayer(this._layer);
        const p = this._useLocalPosition ? position : this.worldToLocal(position);
        renderer.addDrawCall((g) => {
            g.rect(p.x, p.y, width, height);
            g.stroke();
        });
    }

    public drawSolidRect(position: IVec2Like, width: number, height: number) {
        const color = this._color.clone();
        const renderer = this.getRenderer(color);
        renderer.setLayer(this._layer);
        const p = this._useLocalPosition ? position : this.worldToLocal(position);
        const topLeft = {
            x: p.x - width / 2,
            y: p.y - height / 2,
        };
        renderer.addDrawCall((g) => {
            g.rect(topLeft.x, topLeft.y, width, height);
            g.fill();
        });
    }

    public drawSolidPolygon(points: IVec2Like[]) {
        const color = this._color.clone();
        const renderer = this.getRenderer(color);
        renderer.setLayer(this._layer);
        const pointList = this._useLocalPosition ? points : points.map((p) => this.worldToLocal(p));
        renderer.addDrawCall((g) => {
            if (points.length > 0) {
                const p0 = pointList[0];
                g.moveTo(p0.x, p0.y);
                for (let i = 1; i < pointList.length; i++) {
                    const p = pointList[i];
                    g.lineTo(p.x, p.y);
                }
                g.close();
                g.fill();
            }
        });
    }

    public drawEllipse(center: IVec2Like, radiusX: number, radiusY: number) {
        const color = this._color.clone();
        const renderer = this.getRenderer(color);
        renderer.setLayer(this._layer);
        const c = this._useLocalPosition ? center : this.worldToLocal(center);
        renderer.addDrawCall((g) => {
            g.ellipse(c.x, c.y, radiusX, radiusY);
            g.stroke();
        });
    }

    public drawSolidEllipse(center: IVec2Like, radiusX: number, radiusY: number) {
        const color = this._color.clone();
        const renderer = this.getRenderer(color);
        renderer.setLayer(this._layer);
        const c = this._useLocalPosition ? center : this.worldToLocal(center);
        renderer.addDrawCall((g) => {
            g.ellipse(c.x, c.y, radiusX, radiusY);
            g.fill();
        });
    }

    public drawArc(
        center: IVec2Like,
        radius: number,
        startAngle: number,
        endAngle: number,
        counterclockwise: boolean = false,
    ) {
        const color = this._color.clone();
        const renderer = this.getRenderer(color);
        renderer.setLayer(this._layer);
        const c = this._useLocalPosition ? center : this.worldToLocal(center);
        renderer.addDrawCall((g) => {
            g.arc(c.x, c.y, radius, toRadian(startAngle), toRadian(endAngle), counterclockwise);
            g.stroke();
        });
    }

    public drawSolidArc(
        center: IVec2Like,
        radius: number,
        startAngle: number,
        endAngle: number,
        counterclockwise: boolean = false,
    ) {
        const color = this._color.clone();
        const renderer = this.getRenderer(color);
        renderer.setLayer(this._layer);
        const c = this._useLocalPosition ? center : this.worldToLocal(center);
        renderer.addDrawCall((g) => {
            g.arc(c.x, c.y, radius, toRadian(startAngle), toRadian(endAngle), counterclockwise);
            g.lineTo(c.x, c.y);
            g.fill();
        });
    }

    public drawBezierCurves(point1: IVec2Like, point2: IVec2Like, point3: IVec2Like, point4: IVec2Like) {
        const color = this._color.clone();
        const renderer = this.getRenderer(color);
        renderer.setLayer(this._layer);
        const p1 = this._useLocalPosition ? point1 : this.worldToLocal(point1);
        const p2 = this._useLocalPosition ? point2 : this.worldToLocal(point2);
        const p3 = this._useLocalPosition ? point3 : this.worldToLocal(point3);
        const p4 = this._useLocalPosition ? point4 : this.worldToLocal(point4);
        renderer.addDrawCall((g) => {
            g.moveTo(p1.x, p1.y);
            g.bezierCurveTo(p2.x, p2.y, p3.x, p3.y, p4.x, p4.y);
            g.stroke();
        });
    }

    public drawQuadraticCurve(point1: IVec2Like, point2: IVec2Like, point3: IVec2Like) {
        const color = this._color.clone();
        const renderer = this.getRenderer(color);
        renderer.setLayer(this._layer);
        const p1 = this._useLocalPosition ? point1 : this.worldToLocal(point1);
        const p2 = this._useLocalPosition ? point2 : this.worldToLocal(point2);
        const p3 = this._useLocalPosition ? point3 : this.worldToLocal(point3);
        renderer.addDrawCall((g) => {
            g.moveTo(p1.x, p1.y);
            g.quadraticCurveTo(p2.x, p2.y, p3.x, p3.y);
            g.stroke();
        });
    }
}

export default class Gizmos2D {
    public static readonly DEFAULT_COLOR = Color.BLUE;
    public static readonly DEFAULT_LAYER = Layers.Enum.GIZMOS;

    private static getDebugNode(node: Node) {
        let debugNode = node.getComponentInChildren(GizmosDebugDraw);
        if (!debugNode) {
            debugNode = new Node('DEBUG_DRAW2D_NODE').addComponent(GizmosDebugDraw);
            debugNode.node.layer = this.DEFAULT_LAYER;
            debugNode.node.hideFlags |= CCObject.Flags.DontSave | CCObject.Flags.HideInHierarchy;
            debugNode.node.parent = node;
            debugNode.node.setPosition(Vec3.ZERO);
        }
        return debugNode;
    }

    public static beginColor(node: Node, color: Color) {
        this.getDebugNode(node).setColor(color);
    }

    public static beginLocalPosition(node: Node) {
        this.getDebugNode(node).setUseLocalPosition(true);
    }

    public static endLocalPosition(node: Node) {
        this.getDebugNode(node).setUseLocalPosition(false);
    }

    public static drawSprite(
        node: Node,
        id: string,
        spriteFrame: SpriteFrame,
        position: IVec2Like,
        scale: Vec2 = Vec2.ONE,
        color: Color = Color.WHITE,
    ) {
        this.getDebugNode(node).drawSprite(id, spriteFrame, position, scale, color);
    }

    public static drawLabel(
        node: Node,
        id: string,
        text: string,
        point: IVec2Like,
        fontSize: number = 40,
        scale: Vec2 = Vec2.ONE,
    ) {
        this.getDebugNode(node).drawLabel(id, text, point, fontSize, scale);
    }

    public static beginLayer(node: Node, layer: Layers.Enum) {
        this.getDebugNode(node).setLayer(layer);
    }

    public static drawLine(node: Node, point1: IVec2Like, point2: IVec2Like) {
        const debugNode = this.getDebugNode(node);
        debugNode.drawLine(point1, point2);
    }

    public static drawLineList(node: Node, points: IVec2Like[], close: boolean = false) {
        const debugNode = this.getDebugNode(node);
        debugNode.drawLineList(points, close);
    }

    public static drawCircle(node: Node, center: IVec2Like, radius: number) {
        const debugNode = this.getDebugNode(node);
        debugNode.drawCircle(center, radius);
    }

    public static drawSolidCircle(node: Node, center: IVec2Like, radius: number) {
        const debugNode = this.getDebugNode(node);
        debugNode.drawSolidCircle(center, radius);
    }

    public static drawRect(node: Node, position: IVec2Like, width: number, height: number) {
        const debugNode = this.getDebugNode(node);
        debugNode.drawRect(position, width, height);
    }

    public static drawSolidRect(node: Node, position: IVec2Like, width: number, height: number) {
        const debugNode = this.getDebugNode(node);
        debugNode.drawSolidRect(position, width, height);
    }

    public static drawSolidPolygon(node: Node, positions: IVec2Like[]) {
        const debugNode = this.getDebugNode(node);
        debugNode.drawSolidPolygon(positions);
    }

    public static drawEllipse(node: Node, center: IVec2Like, radiusX: number, radiusY: number) {
        const debugNode = this.getDebugNode(node);
        debugNode.drawEllipse(center, radiusX, radiusY);
    }

    public static drawSolidEllipse(node: Node, center: IVec2Like, radiusX: number, radiusY: number) {
        const debugNode = this.getDebugNode(node);
        debugNode.drawSolidEllipse(center, radiusX, radiusY);
    }

    public static drawArc(
        node: Node,
        center: IVec2Like,
        radius: number,
        startAngle: number,
        endAngle: number,
        counterclockwise: boolean = false,
    ) {
        const debugNode = this.getDebugNode(node);
        debugNode.drawArc(center, radius, startAngle, endAngle, counterclockwise);
    }

    public static drawSolidArc(
        node: Node,
        center: IVec2Like,
        radius: number,
        startAngle: number,
        endAngle: number,
        counterclockwise: boolean = false,
    ) {
        const debugNode = this.getDebugNode(node);
        debugNode.drawSolidArc(center, radius, startAngle, endAngle, counterclockwise);
    }

    public static drawBezierCurves(
        node: Node,
        point1: IVec2Like,
        point2: IVec2Like,
        point3: IVec2Like,
        point4: IVec2Like,
    ) {
        const debugNode = this.getDebugNode(node);
        debugNode.drawBezierCurves(point1, point2, point3, point4);
    }

    public static drawQuadraticCurve(node: Node, point1: IVec2Like, point2: IVec2Like, point3: IVec2Like) {
        const debugNode = this.getDebugNode(node);
        debugNode.drawQuadraticCurve(point1, point2, point3);
    }
}
