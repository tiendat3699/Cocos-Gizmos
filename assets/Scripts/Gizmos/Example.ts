import { _decorator, Color, Component, Layers, Node, Vec2, Vec3 } from 'cc';
import { registerGizmos } from './Decorator';
import Gizmos2D from './Gizmos2D';
import Gizmos3D from './Gizmos3D';

const { ccclass } = _decorator;

//dùng registerGizmos decorator để đăng kí gọi drawGizmos trong editor
@registerGizmos
@ccclass('Gizmos.Example')
export default class Example extends Component {
    /**
     * Gizmos2D chỉ có thể hiện thị khi được bọc bởi 1 canvas hoặc 1 RenderRoot2D
     * Gizmos 3D có thể hiện thị cả trong canvas và ngoài canvas
     * Với các hình 3D có thể gặp tình trạng lag nếu hình vẽ quá lớn và phức tạp
     * có thể chuyền segment vào để điều chỉnh giảm độ phân giải của 1 số hình vẽ cho tối ưu (mặc định là 32)
     * hoặc tăng độ phân giải đề hình được mượt và đều hơn với những hình nhỏ
     */

    //luôn luôn update mỗi frame trong editor
    onDrawGizmos(): void {
        Gizmos2D.drawEllipse(this.node, this.node.worldPosition, 100, 50);
        Gizmos3D.drawCapsule(this.node, this.node.worldPosition, 2, 1);

        // dùng beginColor để set một màu khác, các lệnh gọi draw sau dòng này sẽ có màu mới được set
        // màu mặc định của gizmos sử dụng Gizmos2D.DEFAULT_COLOR
        Gizmos2D.beginColor(this.node, Color.RED);
        Gizmos2D.drawCircle(this.node, this.node.worldPosition, 100);
        Gizmos2D.drawCircle(this.node, this.node.worldPosition, 200);

        Gizmos3D.beginColor(this.node, Color.RED);
        Gizmos3D.drawSphere(this.node, this.node.worldPosition, 1);

        //layer mặc định là gizmos chỉ hiện thị trên editor để đổi layer dùng beginLayer, các lệnh gọi draw sau dòng này sẽ có layer mới được set
        // layer mặc định của gizmos sử dụng Gizmos2D.DEFAULT_LAYER
        Gizmos2D.beginLayer(this.node, Layers.Enum.UI_2D);
        Gizmos2D.drawCircle(this.node, this.node.worldPosition, 100);
        Gizmos2D.drawCircle(this.node, this.node.worldPosition, 200);
        Gizmos2D.beginLayer(this.node, Layers.Enum.DEFAULT);
        Gizmos2D.drawCircle(this.node, this.node.worldPosition, 100);
        Gizmos2D.drawCircle(this.node, this.node.worldPosition, 200);

        // gizmos 3d không cần set layer mà mặc định đều có thể hiện thị trên cả editor và runtime

        //theo mặc định gizmos sử dụng world position, để chuyển qua sử dụng local position dùng beginLocalPosition
        Gizmos2D.beginLocalPosition(this.node);
        Gizmos2D.drawCircle(this.node, new Vec3(100, 100), 100);
        Gizmos2D.drawCircle(this.node, new Vec3(100, 200), 100);
        // để kết thúc dùng endLocalPosition
        Gizmos2D.endLocalPosition(this.node);
        Gizmos2D.drawCircle(this.node, new Vec3(100, 100), 100);
        Gizmos2D.drawCircle(this.node, new Vec3(100, 200), 100);

        Gizmos3D.beginLocalPosition(this.node);
        Gizmos3D.drawSphere(this.node, new Vec3(2, 3), 1);

        Gizmos3D.endLocalPosition(this.node);
        Gizmos3D.drawSphere(this.node, new Vec3(2, 3), 1);
    }

    //update mỗi frame trong editor khi object được chọn
    onDrawGizmosSelected(): void {
        Gizmos2D.drawSolidCircle(this.node, this.node.worldPosition, 100);
    }

    // nếu muốn debug ở runtime thì có thể dùng update
    protected update(dt: number): void {
        Gizmos2D.drawLine(this.node, new Vec2(0, 0), new Vec2(200, 300));
        Gizmos3D.drawCylinder(this.node, new Vec3(100, 100), 100, 100, new Vec3(), true, 16);
    }
}
