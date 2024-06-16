import {
    _decorator,
    Camera,
    CCObject,
    Color,
    Component,
    director,
    geometry,
    GeometryRenderer,
    gfx,
    Layers,
    Mat4,
    Material,
    Node,
    toRadian,
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
    private _components: (new () => Component)[] = [];

    protected onLoad(): void {
        if (cce) {
            cce.Camera._camera.camera.initGeometryRenderer();
            this._renderer = cce.Camera._camera.camera.geometryRenderer;
        } else {
            const camera = director.getScene().getComponentInChildren(Camera).camera;
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

    public registerDrawGizmos(component: new () => Component) {
        this._components.push(component);
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
    private static _mat: Material;

    public static get DEFAULT_MAT() {
        if (!this._mat) {
            this._mat = new Material();
            this._mat.initialize({
                effectName: 'builtin-unlit',
                defines: { USE_VERTEX_COLOR: true },
                states: { primitive: gfx.PrimitiveMode.LINE_LOOP },
            });
            this._mat.passes.forEach((v) => v.tryCompile());
        }

        return this._mat;
    }

    public static readonly DEFAULT_COLOR = Color.BLUE;
    public static readonly DEFAULT_LAYER = Layers.Enum.GIZMOS;

    private static getDebugNode(node: Node) {
        let debugNode = node.getComponentInChildren(GizmosDebugDraw);
        if (!debugNode) {
            debugNode = new Node('DEBUG_DRAW_NODE').addComponent(GizmosDebugDraw);
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
