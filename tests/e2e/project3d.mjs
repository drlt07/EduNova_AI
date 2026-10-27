// Chiếu điểm 3D (toạ độ thế giới) ra pixel trên canvas, dùng đúng thông số camera mặc định của Scene3D.
import * as THREE from "three";

export default function project(box, world, cam = { pos: [46, 44, 46], zoom: 15 }) {
  const c = new THREE.OrthographicCamera(-box.width / 2, box.width / 2, box.height / 2, -box.height / 2, -200, 400);
  c.position.set(...cam.pos);
  c.zoom = cam.zoom;
  c.lookAt(0, 0, 0);
  c.updateProjectionMatrix();
  c.updateMatrixWorld();
  const v = new THREE.Vector3(...world).project(c);
  return { x: box.x + ((v.x + 1) / 2) * box.width, y: box.y + ((1 - v.y) / 2) * box.height };
}
