import {
    _decorator,
    Camera,
    CCObject,
    Color,
    Component,
    director,
    geometry,
    GeometryRenderer,
    Label,
    Layers,
    Mat4,
    Node,
    RenderRoot2D,
    Sprite,
    SpriteFrame,
    toRadian,
    Vec2,
    Vec3,
} from 'cc';
import { cce } from './Define';

const { ccclass, executeInEditMode } = _decorator;

@ccclass('Gizmos3D.GizmosDebugDraw')
@executeInEditMode
class GizmosDebugDraw extends Component {
    private _color: Color = Gizmos3D.DEFAULT_COLOR;
    private _renderer: GeometryRenderer = null;
    private _depthTest: boolean = true;
    private _useLocalPosition: boolean = false;
    private _camera: Node;
    private _labelMap: Map<string, Label> = new Map();
    private _spriteMap: Map<string, Sprite> = new Map();
    private _root2D: Node;
    private _drawCalls2D: (() => void)[] = [];

    protected onLoad(): void {
        this._root2D = new Node('Root2D');
        this._root2D.addComponent(RenderRoot2D);
        this._root2D.setParent(this.node);
        if (cce) {
            this._camera = cce.Camera._camera.camera.node;
            cce.Camera._camera.camera.initGeometryRenderer();
            this._renderer = cce.Camera._camera.camera.geometryRenderer;
        } else {
            const camera = director.getScene().getComponentInChildren(Camera).camera;
            this._camera = camera.node;
            camera.initGeometryRenderer();
            this._renderer = camera.geometryRenderer;
        }

        if (!this._renderer) {
            console.warn(
                'Unable to initialize geometryRenderer for Gizmos3D, please ensure the Geometry Renderer feature is enabled in project settings if you want to use Gizmos3D in play mode',
            );
        }
    }

    protected lateUpdate(dt: number): void {
        this._labelMap.forEach((label) => {
            label.string = '';
            label.node.setRotationFromEuler(this._camera.eulerAngles);
        });

        this._spriteMap.forEach((sprite) => {
            sprite.spriteFrame = null;
            sprite.node.setRotationFromEuler(this._camera.eulerAngles);
        });

        this._drawCalls2D.forEach((drawCall) => drawCall());

        this._drawCalls2D = [];
        this._color = Gizmos3D.DEFAULT_COLOR;
        this._useLocalPosition = false;
    }

    private worldToLocal(world: Vec3): Vec3 {
        const local = new Vec3();
        Vec3.add(local, this.node.worldPosition, world);
        return local;
    }

    public setDepthTest(value: boolean) {
        this._depthTest = value;
    }

    public setColor(color: Color) {
        this._color = color;
    }

    public setUseLocalPosition(value: boolean) {
        this._useLocalPosition = value;
    }

    private rotate(pos: Vec3, rot: Vec3 = Vec3.ZERO): Mat4 {
        let result = new Mat4();
        let transform = new Mat4();

        Mat4.fromTranslation(result, pos);

        Mat4.fromXRotation(transform, toRadian(rot.x));
        result.multiply(transform);

        Mat4.fromYRotation(transform, toRadian(rot.y));
        result.multiply(transform);

        Mat4.fromZRotation(transform, toRadian(rot.z));
        result.multiply(transform);

        Mat4.fromTranslation(transform, new Vec3(-pos.x, -pos.y, -pos.z));
        result.multiply(transform);

        return result;
    }

    private getSprite(id: string): Sprite {
        let sprite = this._spriteMap.get(id);
        if (!sprite) {
            sprite = new Node('spriteID: ' + id).addComponent(Sprite);
            this._spriteMap.set(id, sprite);
            sprite.node.setParent(this._root2D);
        }
        return sprite;
    }

    private getLabel(id: string): Label {
        let label = this._labelMap.get(id);
        if (!label) {
            label = new Node('LabelID: ' + id).addComponent(Label);
            this._labelMap.set(id, label);
            label.node.setParent(this._root2D);
        }
        return label;
    }

    public drawSprite(id: string, spriteFrame: SpriteFrame, position: Vec3, scale: Vec2, color: Color = Color.WHITE) {
        const sprite = this.getSprite(id);
        this._drawCalls2D.push(() => {
            sprite.spriteFrame = spriteFrame;
            sprite.color = color;
            sprite.node.setScale(new Vec3(scale.x, scale.y));
            if (this._useLocalPosition) {
                sprite.node.setPosition(position);
            } else {
                sprite.node.setWorldPosition(position);
            }
        });
    }

    public drawLabel(id: string, text: string, position: Vec3, fontSize: number = 40, scale: number = 1) {
        const color = this._color.clone();
        const label = this.getLabel(id);
        this._drawCalls2D.push(() => {
            label.string = text;
            label.color = color;
            label.fontSize = fontSize;
            label.lineHeight = fontSize;
            label.node.setScale(new Vec3(scale, scale));
            if (this._useLocalPosition) {
                label.node.setPosition(position);
            } else {
                label.node.setWorldPosition(position);
            }
        });
    }

    public drawLine(point1: Vec3, point2: Vec3) {
        const color = this._color.clone();
        const p1 = this._useLocalPosition ? this.worldToLocal(point1) : point1;
        const p2 = this._useLocalPosition ? this.worldToLocal(point2) : point2;
        this._renderer?.addLine(p1, p2, color, this._depthTest);
    }

    public drawLineList(points: Vec3[], close: boolean = false) {
        const color = this._color.clone();
        const pointList = this._useLocalPosition ? points.map((p) => this.worldToLocal(p)) : points;
        if (pointList.length > 0) {
            for (let i = 0; i < pointList.length - 1; i++) {
                this._renderer?.addLine(pointList[i], pointList[i + 1], color, this._depthTest);
            }

            if (close) {
                this._renderer?.addLine(pointList[pointList.length - 1], pointList[0], color, this._depthTest);
            }
        }
    }

    public drawDashLine(point1: Vec3, point2: Vec3) {
        const color = this._color.clone();
        const p1 = this._useLocalPosition ? this.worldToLocal(point1) : point1;
        const p2 = this._useLocalPosition ? this.worldToLocal(point2) : point2;
        this._renderer?.addDashedLine(p1, p2, color, this._depthTest);
    }

    public drawDashLineList(points: Vec3[], close: boolean = false) {
        const color = this._color.clone();
        const pointList = this._useLocalPosition ? points.map((p) => this.worldToLocal(p)) : points;
        if (pointList.length > 0) {
            for (let i = 0; i < pointList.length - 1; i++) {
                this._renderer?.addDashedLine(pointList[i], pointList[i + 1], color, this._depthTest);
            }

            if (close) {
                this._renderer?.addDashedLine(pointList[pointList.length - 1], pointList[0], color, this._depthTest);
            }
        }
    }

    public drawCircle(center: Vec3, radius: number, rot: Vec3 = Vec3.ZERO, segments: number = 32) {
        const color = this._color.clone();
        const c = this._useLocalPosition ? this.worldToLocal(center) : center;
        const transform = this.rotate(c, rot);
        this._renderer?.addCircle(c, radius, color, segments, this._depthTest, true, transform);
    }

    public drawDisc(
        center: Vec3,
        radius: number,
        rot: Vec3 = Vec3.ZERO,
        wireFrame: boolean = false,
        segments: number = 32,
    ) {
        const color = this._color.clone();
        const c = this._useLocalPosition ? this.worldToLocal(center) : center;
        const transform = this.rotate(c, rot);
        this._renderer?.addDisc(c, radius, color, segments, wireFrame, this._depthTest, true, true, transform);
    }

    public drawQuad(point1: Vec3, point2: Vec3, point3: Vec3, point4: Vec3, wireFrame: boolean = false) {
        const color = this._color.clone();
        const p1 = this._useLocalPosition ? this.worldToLocal(point1) : point1;
        const p2 = this._useLocalPosition ? this.worldToLocal(point2) : point2;
        const p3 = this._useLocalPosition ? this.worldToLocal(point3) : point3;
        const p4 = this._useLocalPosition ? this.worldToLocal(point4) : point4;
        this._renderer?.addQuad(p1, p2, p3, p4, color, wireFrame, this._depthTest);
    }

    public drawSphere(
        center: Vec3,
        radius: number,
        wireFrame: boolean = false,
        segmentsX: number = 32,
        segmentsY: number = 16,
    ) {
        const color = this._color.clone();
        const c = this._useLocalPosition ? this.worldToLocal(center) : center;
        this._renderer?.addSphere(c, radius, color, segmentsX, segmentsY, wireFrame, this._depthTest);
    }

    public drawArc(
        center: Vec3,
        radius: number,
        startAngle: number,
        endAngle: number,
        rot: Vec3 = Vec3.ZERO,
        segments: number = 32,
    ) {
        const color = this._color.clone();
        const c = this._useLocalPosition ? this.worldToLocal(center) : center;
        const transform = this.rotate(c, rot);
        this._renderer?.addArc(c, radius, color, startAngle, endAngle, segments, this._depthTest, true, transform);
    }

    public drawSolidArc(
        center: Vec3,
        radius: number,
        startAngle: number,
        endAngle: number,
        rot: Vec3 = Vec3.ZERO,
        wireFrame: boolean = false,
        segments: number = 32,
    ) {
        const color = this._color.clone();
        const c = this._useLocalPosition ? this.worldToLocal(center) : center;
        const transform = this.rotate(c, rot);
        this._renderer?.addSector(
            c,
            radius,
            color,
            startAngle,
            endAngle,
            segments,
            wireFrame,
            this._depthTest,
            true,
            true,
            transform,
        );
    }

    public drawPolygon(
        position: Vec3,
        radius: number,
        segments: number,
        rot: Vec3 = Vec3.ZERO,
        wireFrame: boolean = false,
    ) {
        const color = this._color.clone();
        const p = this._useLocalPosition ? this.worldToLocal(position) : position;
        const transform = this.rotate(p, rot);
        this._renderer?.addPolygon(p, radius, color, segments, wireFrame, this._depthTest, true, true, transform);
    }

    public drawOctahedron(position: Vec3, radius: number, rot: Vec3 = Vec3.ZERO, wireFrame: boolean = false) {
        const color = this._color.clone();
        const p = this._useLocalPosition ? this.worldToLocal(position) : position;
        const transform = this.rotate(p, rot);
        this._renderer?.addOctahedron(p, radius, color, wireFrame, this._depthTest, false, true, transform);
    }

    public drawCross(position: Vec3, size: number) {
        const color = this._color.clone();
        const p = this._useLocalPosition ? this.worldToLocal(position) : position;
        this._renderer?.addCross(p, size, color, this._depthTest);
    }

    public drawCapsule(
        position: Vec3,
        radius: number,
        height: number,
        rot: Vec3 = Vec3.ZERO,
        wireFrame: boolean = false,
        segmentsX: number = 32,
        segmentsY: number = 8,
    ) {
        const color = this._color.clone();
        const p = this._useLocalPosition ? this.worldToLocal(position) : position;
        const transform = this.rotate(p, rot);
        this._renderer?.addCapsule(
            p,
            radius,
            height,
            color,
            segmentsX,
            segmentsY,
            wireFrame,
            this._depthTest,
            false,
            true,
            transform,
        );
    }

    public drawBox(position: Vec3, size: Vec3, rot: Vec3 = Vec3.ZERO, wireFrame: boolean = false) {
        const color = this._color.clone();
        const p = this._useLocalPosition ? this.worldToLocal(position) : position;
        const transform = this.rotate(p, rot);
        let box = geometry?.AABB.create(p.x, p.y, p.z, size.x, size.y, size.z);
        this._renderer?.addBoundingBox(box, color, wireFrame, this._depthTest, false, true, transform);
    }

    public drawCylinder(
        position: Vec3,
        radius: number,
        height: number,
        rot: Vec3 = Vec3.ZERO,
        wireFrame: boolean = false,
        segments: number = 32,
    ) {
        const color = this._color.clone();
        const p = this._useLocalPosition ? this.worldToLocal(position) : position;
        const transform = this.rotate(p, rot);
        this._renderer?.addCylinder(
            p,
            radius,
            height,
            color,
            segments,
            wireFrame,
            this._depthTest,
            false,
            true,
            transform,
        );
    }

    public drawCone(
        position: Vec3,
        radius: number,
        height: number,
        rot: Vec3 = Vec3.ZERO,
        wireFrame: boolean = false,
        segments: number = 32,
    ) {
        const color = this._color.clone();
        const p = this._useLocalPosition ? this.worldToLocal(position) : position;
        const transform = this.rotate(p, rot);
        this._renderer?.addCone(p, radius, height, color, segments, wireFrame, this._depthTest, false, true, transform);
    }

    public drawBezier(
        point1: Vec3,
        point2: Vec3,
        point3: Vec3,
        point4: Vec3,
        rot: Vec3 = Vec3.ZERO,
        segments: number = 32,
    ) {
        const color = this._color.clone();
        const p1 = this._useLocalPosition ? this.worldToLocal(point1) : point1;
        const p2 = this._useLocalPosition ? this.worldToLocal(point2) : point2;
        const p3 = this._useLocalPosition ? this.worldToLocal(point3) : point3;
        const p4 = this._useLocalPosition ? this.worldToLocal(point4) : point4;
        const transform = this.rotate(p1, rot);
        this._renderer?.addBezier(p1, p2, p3, p4, color, segments, this._depthTest, true, transform);
    }

    public drawSpline(
        knots: Vec3[],
        mode: geometry.SplineMode = geometry?.SplineMode.BEZIER,
        knotSize = 0.5,
        segments: number = 32,
    ) {
        const color = this._color.clone();
        const knotsList = this._useLocalPosition ? knots.map((knot) => this.worldToLocal(knot)) : knots;
        let spline = geometry?.Spline.create(mode, knotsList);
        this._renderer?.addSpline(spline, color, 0xffffffff, knotSize, segments, this._depthTest);
    }
}

export default class Gizmos3D {
    public static readonly DEFAULT_COLOR = Color.BLUE;
    public static readonly DEFAULT_LAYER = Layers.Enum.GIZMOS;

    private static getDebugNode(node: Node) {
        let debugNode = node.getComponentInChildren(GizmosDebugDraw);
        if (!debugNode) {
            debugNode = new Node('DEBUG_DRAW3D_NODE').addComponent(GizmosDebugDraw);
            debugNode.node.layer = this.DEFAULT_LAYER;
            debugNode.node.hideFlags |= CCObject.Flags.DontSave | CCObject.Flags.HideInHierarchy;
            debugNode.node.parent = node;
        }

        return debugNode;
    }

    public static beginColor(node: Node, color: Color) {
        this.getDebugNode(node)?.setColor(color);
    }

    static beginLocalPosition(node: Node) {
        this.getDebugNode(node)?.setUseLocalPosition(true);
    }

    static endLocalPosition(node: Node) {
        this.getDebugNode(node)?.setUseLocalPosition(false);
    }

    public static drawSprite(
        node: Node,
        id: string,
        spriteFrame: SpriteFrame,
        position: Vec3,
        scale: Vec2 = Vec2.ONE,
        color: Color = Color.WHITE,
    ) {
        this.getDebugNode(node).drawSprite(id, spriteFrame, position, scale, color);
    }

    public static drawLabel(
        node: Node,
        id: string,
        text: string,
        position: Vec3,
        fontSize: number = 15,
        scale: number = 1,
    ) {
        this.getDebugNode(node)?.drawLabel(id, text, position, fontSize, scale);
    }

    public static drawLine(node: Node, point1: Vec3, point2: Vec3) {
        const debugNode = this.getDebugNode(node);
        debugNode?.drawLine(point1, point2);
    }

    public static drawLineList(node: Node, points: Vec3[], close: boolean = false) {
        const debugNode = this.getDebugNode(node);
        debugNode?.drawLineList(points, close);
    }

    public static drawDashLine(node: Node, point1: Vec3, point2: Vec3) {
        const debugNode = this.getDebugNode(node);
        debugNode?.drawDashLine(point1, point2);
    }

    public static drawDashLineList(node: Node, points: Vec3[], close: boolean = false) {
        const debugNode = this.getDebugNode(node);
        debugNode?.drawLineList(points, close);
    }

    public static drawCircle(node: Node, center: Vec3, radius: number, rot: Vec3 = Vec3.ZERO, segments: number = 32) {
        const debugNode = this.getDebugNode(node);
        debugNode?.drawCircle(center, radius, rot, segments);
    }

    public static drawDisc(
        node: Node,
        center: Vec3,
        radius: number,
        rot: Vec3 = Vec3.ZERO,
        wireFrame: boolean = false,
        segments: number = 32,
    ) {
        const debugNode = this.getDebugNode(node);
        debugNode?.drawDisc(center, radius, rot, wireFrame, segments);
    }

    public static drawQuad(
        node: Node,
        point1: Vec3,
        point2: Vec3,
        point3: Vec3,
        point4: Vec3,
        wireFrame: boolean = false,
    ) {
        const debugNode = this.getDebugNode(node);
        debugNode?.drawQuad(point1, point2, point3, point4, wireFrame);
    }

    public static drawSphere(
        node: Node,
        center: Vec3,
        radius: number,
        wireFrame: boolean = false,
        segmentsX: number = 32,
        segmentsY: number = 16,
    ) {
        const debugNode = this.getDebugNode(node);
        debugNode?.drawSphere(center, radius, wireFrame, segmentsX, segmentsY);
    }

    public static drawArc(
        node: Node,
        center: Vec3,
        radius: number,
        startAngle: number,
        endAngle: number,
        rot: Vec3 = Vec3.ZERO,
        segments: number = 32,
    ) {
        const debugNode = this.getDebugNode(node);
        debugNode?.drawArc(center, radius, startAngle, endAngle, rot, segments);
    }

    public static drawSolidArc(
        node: Node,
        center: Vec3,
        radius: number,
        startAngle: number,
        endAngle: number,
        rot: Vec3 = Vec3.ZERO,
        wireFrame: boolean = false,
        segments: number = 32,
    ) {
        const debugNode = this.getDebugNode(node);
        debugNode?.drawSolidArc(center, radius, startAngle, endAngle, rot, wireFrame, segments);
    }

    public static drawPolygon(
        node: Node,
        position: Vec3,
        radius: number,
        segments: number,
        rot: Vec3 = Vec3.ZERO,
        wireFrame: boolean = false,
    ) {
        const debugNode = this.getDebugNode(node);
        debugNode?.drawPolygon(position, radius, segments, rot, wireFrame);
    }

    public static drawOctahedron(
        node: Node,
        position: Vec3,
        radius: number,
        rot: Vec3 = Vec3.ZERO,
        wireFrame: boolean = false,
    ) {
        const debugNode = this.getDebugNode(node);
        debugNode?.drawOctahedron(position, radius, rot, wireFrame);
    }

    public static drawCross(node: Node, center: Vec3, size: number) {
        const debugNode = this.getDebugNode(node);
        debugNode?.drawCross(center, size);
    }

    public static drawCapsule(
        node: Node,
        position: Vec3,
        radius: number,
        height: number,
        rot?: Vec3,
        wireFrame?: boolean,
        segmentsX: number = 32,
        segmentsY: number = 8,
    ) {
        const debugNode = this.getDebugNode(node);
        debugNode?.drawCapsule(position, radius, height, rot, wireFrame, segmentsX, segmentsY);
    }

    public static drawBox(node: Node, center: Vec3, size: Vec3, rot?: Vec3, wireFrame?: boolean) {
        const debugNode = this.getDebugNode(node);
        debugNode?.drawBox(center, size, rot, wireFrame);
    }

    public static drawCylinder(
        node: Node,
        position: Vec3,
        radius: number,
        height: number,
        rot: Vec3 = Vec3.ZERO,
        wireFrame: boolean = false,
        segments: number = 32,
    ) {
        const debugNode = this.getDebugNode(node);
        debugNode?.drawCylinder(position, radius, height, rot, wireFrame, segments);
    }

    public static drawCone(
        node: Node,
        position: Vec3,
        radius: number,
        height: number,
        rot: Vec3 = Vec3.ZERO,
        wireFrame: boolean = false,
        segments: number = 32,
    ) {
        const debugNode = this.getDebugNode(node);
        debugNode?.drawCone(position, radius, height, rot, wireFrame, segments);
    }

    public static drawBezier(
        node: Node,
        point1: Vec3,
        point2: Vec3,
        point3: Vec3,
        point4: Vec3,
        rot?: Vec3,
        segments: number = 32,
    ) {
        const debugNode = this.getDebugNode(node);
        debugNode?.drawBezier(point1, point2, point3, point4, rot, segments);
    }

    public static drawSpline(
        node: Node,
        knots: Vec3[],
        mode: geometry.SplineMode = geometry?.SplineMode.BEZIER,
        knotSize = 0.5,
        segments: number = 32,
    ) {
        const debugNode = this.getDebugNode(node);
        debugNode?.drawSpline(knots, mode, knotSize, segments);
    }
}
