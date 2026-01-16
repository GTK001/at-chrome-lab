
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.160/examples/jsm/loaders/GLTFLoader.js";

let scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.5, 4);
camera.lookAt(0, 0.5, 0);


let renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setSize(window.innerWidth - 280, window.innerHeight - 60);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById("canvas3d").appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff, 0x333333, 1.2));
const light = new THREE.DirectionalLight(0xffffff, 1.5);
light.position.set(3,5,2);
scene.add(light);

let scooter;
let parts = { tank:null, fairing:null, wheel:[] };
let selectedPart = "tank";
let mode = "metallic";

const material = new THREE.MeshPhysicalMaterial({
  color: 0xff0000,
  metalness: 0.7,
  roughness: 0.25,
  clearcoat: 1,
  clearcoatRoughness: 0.05
});

new GLTFLoader().load(
  "3d/scooter.glb",
  (gltf) => {
    scooter = gltf.scene;

    // === 1. คำนวณขนาดโมเดลจริง ===
    const box = new THREE.Box3().setFromObject(scooter);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // === 2. จัดโมเดลให้อยู่กลางโลก ===
    scooter.position.x += scooter.position.x - center.x;
    scooter.position.y += scooter.position.y - center.y;
    scooter.position.z += scooter.position.z - center.z;

    // === 3. ปรับกล้องตามขนาดโมเดล ===
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / Math.tan(fov / 2));
    cameraZ *= 1.4;

    camera.position.set(0, maxDim * 0.6, cameraZ);
    camera.lookAt(0, 0, 0);

    // === 4. ใส่วัสดุให้เห็นชัด ===
    scooter.traverse((obj) => {
      if (obj.isMesh) {
        obj.material = material;
        obj.material.side = THREE.DoubleSide;
      }
    });

    scene.add(scooter);
    console.log("✅ Scooter loaded", size);
  },
  undefined,
  (error) => {
    console.error("❌ GLB Load Error", error);
  }
);



function animate(){
  requestAnimationFrame(animate);
  if (scooter) scooter.rotation.y += 0.002;
  renderer.render(scene, camera);
}
animate();

window.selectPart = p => selectedPart = p;

window.setMode = m => {
  mode = m;
  if (m === "metallic") material.metalness = 0.7;
  if (m === "pearl") material.metalness = 0.4;
  if (m === "chrome") material.metalness = 1.0;
};

["hue","bright","gloss"].forEach(id =>
  document.getElementById(id).addEventListener("input", updateColor)
);

function updateColor(){
  const h = hue.value / 360;
  const b = bright.value / 100;
  const g = gloss.value / 100;

  material.color.setHSL(h, 1, b);
  material.roughness = 1 - g;
}

window.captureImage = () => {
  const img = renderer.domElement.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = img;
  a.download = "AT-Chrome-Lab.png";
  a.click();
};

window.saveFormula = () => {
  const data = {
    shop:"AT Chrome Lab",
    part:selectedPart,
    mode,
    color: material.color.getHexString(),
    date:new Date().toLocaleString()
  };
  let list = JSON.parse(localStorage.getItem("formulas")) || [];
  list.push(data);
  localStorage.setItem("formulas", JSON.stringify(list));
  localStorage.setItem("lastFormula", JSON.stringify(data));
  alert("บันทึกสูตรเรียบร้อย");
};

window.sendLine = () => {
  const msg = `
AT Chrome Lab 🏍️
ชิ้นส่วน: ${selectedPart}
โหมดสี: ${mode}
สี: #${material.color.getHexString()}
`;
  window.open("https://line.me/R/msg/text/?" + encodeURIComponent(msg));
};
