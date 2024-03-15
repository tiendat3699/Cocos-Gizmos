import { _decorator, Component, director, Mat4, Material, primitives, renderer, utils, Vec3, misc, Color } from 'cc';
import { EDITOR } from 'cc/env';
const { ccclass, property, executeInEditMode, executionOrder } = _decorator;

class DrawCall {
    public draw: () => void;
    public model: renderer.scene.Model;
}

@ccclass('Gizmos')
@executeInEditMode
export default class Gizmos extends Component {
    //singleton
    private static _instance: Gizmos;
    public static get instance(): Gizmos {
        // if (!!!Gizmos._instance) {
        //     Gizmos._instance = new Node('Gizmos').addComponent(Gizmos);
        //     Gizmos._instance.node.setParent(director.getScene());
        //     Gizmos._instance._mat = new Material();
        //     Gizmos._instance._mat._uuid = 'gizmos_mat';
        //     Gizmos._instance._mat.initialize({
        //         effectName: 'builtin-unlit',
        //         defines: { USE_VERTEX_COLOR: true },
        //         states: { primitive: gfx.PrimitiveMode.LINE_LOOP },
        //     });
        //     Gizmos._instance._mat.passes.forEach((v) => v.tryCompile());
        // }
        return Gizmos._instance;
    }

    @property({ type: Material, visible: true, readonly: true })
    private _mat: Material;
    private _drawCalls: DrawCall[] = [];

    protected onLoad(): void {
        Gizmos._instance = this;
        this.node.setSiblingIndex(0);
    }

    private detachFromScene(model: renderer.scene.Model) {
        if (model?.scene) {
            model.scene.removeModel(model);
            model.destroy();
        }
    }

    protected update(dt: number): void {
        if (EDITOR && Gizmos._instance && this._drawCalls.length > 0) {
            this._drawCalls.forEach((drawCall) => {
                this.detachFromScene(drawCall.model);
            });
            this._drawCalls = [];
        }
    }

    protected lateUpdate(dt: number): void {
        if (EDITOR && this._mat && Gizmos._instance && this._drawCalls.length > 0) {
            this._drawCalls.forEach((drawCall) => {
                drawCall.draw();
            });
        }
    }

    public static drawLine(p1: Vec3, p2: Vec3, color: Color = Color.BLACK) {
        const positions: number[] = [];
        const colors: number[] = [];
        Vec3.toArray(positions, p1, positions.length);
        Vec3.toArray(positions, p2, positions.length);
        colors.push(color.r, color.g, color.b, color.a);
        colors.push(color.r, color.g, color.b, color.a);
        const mesh = utils.MeshUtils.createMesh({ positions, colors });
        const model = director.root!.createModel(renderer.scene.Model);
        model.node = model.transform = Gizmos.instance.node;
        model.enabled = true;
        Gizmos.instance._getRenderScene().addModel(model);
        const drawCall = new DrawCall();
        drawCall.model = model;
        drawCall.draw = () => {
            model.initSubModel(0, mesh.renderingSubMeshes[0], Gizmos.instance._mat);
        };
        Gizmos.instance._drawCalls.push(drawCall);
    }

    public static drawLineList(points: Vec3[], color: Color = Color.BLACK, loop: boolean = false) {
        const positions: number[] = [];
        const colors: number[] = [];
        for (let i = 0; i < points.length; i++) {
            let p = points[i];
            Vec3.toArray(positions, p, positions.length);
            colors.push(color.r, color.g, color.b, color.a);
        }

        if (!loop) {
            for (let i = points.length - 1; i >= 0; i--) {
                let p = points[i];
                Vec3.toArray(positions, p, positions.length);
                colors.push(color.r, color.g, color.b, color.a);
            }
        }

        const mesh = utils.MeshUtils.createMesh({ positions, colors });
        const model = director.root!.createModel(renderer.scene.Model);
        model.node = model.transform = Gizmos.instance.node;
        model.enabled = true;
        Gizmos.instance._getRenderScene().addModel(model);
        const drawCall = new DrawCall();
        drawCall.model = model;
        drawCall.draw = () => {
            model.initSubModel(0, mesh.renderingSubMeshes[0], Gizmos.instance._mat);
        };
        Gizmos.instance._drawCalls.push(drawCall);
    }

    public static drawSphere(center: Vec3, radius: number, color: Color = Color.BLACK, segments?: number) {
        const colors: number[] = [];
        const sphere = primitives.sphere(radius, { segments: segments });
        primitives.translate(sphere, { x: center.x, y: center.y, z: center.z });
        for (let i = 0; i < sphere.positions.length; i++) {
            colors.push(color.r, color.g, color.b, color.a);
        }
        sphere.colors = colors;
        const mesh = utils.MeshUtils.createMesh(sphere);
        const model = director.root!.createModel(renderer.scene.Model);
        model.node = model.transform = Gizmos.instance.node;
        model.enabled = true;
        Gizmos.instance._getRenderScene().addModel(model);
        const drawCall = new DrawCall();
        drawCall.model = model;
        drawCall.draw = () => {
            model.initSubModel(0, mesh.renderingSubMeshes[0], Gizmos.instance._mat);
        };
        Gizmos.instance._drawCalls.push(drawCall);
    }

    public static drawCircle(
        center: Vec3,
        radius: number,
        color: Color = Color.BLACK,
        angle: number = 0,
        axis: Vec3 = new Vec3(0, 0, 0),
    ) {
        const positions: number[] = [];
        const colors: number[] = [];
        const circle = primitives.circle();
        circle.boundingRadius = radius;

        for (let i = 0; i < circle.positions.length; i++) {
            colors.push(color.r, color.g, color.b, color.a);
            if (i % 3 == 0) {
                let pos = new Vec3();
                Vec3.fromArray(pos, circle.positions, i);
                const transform = this.rotate(angle, pos, axis);

                Vec3.transformMat4Normal(pos, pos, transform);
                Vec3.toArray(positions, pos, positions.length);
            }
        }
        circle.positions = positions;
        circle.positions[0] = circle.positions[circle.positions.length];
        primitives.translate(circle, { x: center.x, y: center.y, z: center.z });
        circle.colors = colors;
        const mesh = utils.MeshUtils.createMesh(circle);
        const model = director.root!.createModel(renderer.scene.Model);
        model.node = model.transform = Gizmos.instance.node;
        model.enabled = true;
        Gizmos.instance._getRenderScene().addModel(model);
        const drawCall = new DrawCall();
        drawCall.model = model;
        drawCall.draw = () => {
            model.initSubModel(0, mesh.renderingSubMeshes[0], Gizmos.instance._mat);
        };
        Gizmos.instance._drawCalls.push(drawCall);
    }

    public static drawCube(
        center: Vec3,
        size: Vec3,
        color: Color = Color.BLACK,
        angle: number = 0,
        axis: Vec3 = new Vec3(0, 0, 0),
    ) {
        const positions: Vec3[] = [
            new Vec3(size.x / 2, size.y / 2, size.z / 2),
            new Vec3(-size.x / 2, size.y / 2, size.z / 2),
            new Vec3(-size.x / 2, size.y / 2, -size.z / 2),
            new Vec3(size.x / 2, size.y / 2, -size.z / 2),
            new Vec3(size.x / 2, -size.y / 2, -size.z / 2),
            new Vec3(-size.x / 2, -size.y / 2, -size.z / 2),
            new Vec3(-size.x / 2, -size.y / 2, size.z / 2),
            new Vec3(size.x / 2, -size.y / 2, size.z / 2),
        ];
        positions.forEach((pos) => {
            const transform1 = this.rotate(angle, pos, axis);
            Vec3.transformMat4Normal(pos, pos, transform1);
            pos.add(center);
        });

        this.drawLineList(
            [
                positions[0],
                positions[1],
                positions[2],
                positions[3],
                positions[0],
                positions[7],
                positions[6],
                positions[5],
                positions[4],
                positions[7],
                positions[0],
                positions[1],
                positions[6],
                positions[5],
                positions[2],
                positions[3],
                positions[4],
                positions[7],
            ],
            color,
            true,
        );
    }

    private static rotate(angle: number, pos: Vec3, axis: Vec3): Mat4 {
        let result = new Mat4();
        let transform = new Mat4();

        Mat4.fromTranslation(result, pos);
        Mat4.fromRotation(transform, misc.degreesToRadians(angle), axis);
        result.multiply(transform);
        Mat4.fromTranslation(transform, new Vec3(-pos.x, -pos.y, -pos.z));
        result.multiply(transform);

        return result;
    }
}
