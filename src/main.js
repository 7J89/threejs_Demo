import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const canvas = document.querySelector("#three-canvas");
const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

// ------------------------------------------------------- 相機位置
// 初始化
camera.position.z = 9;
camera.position.y = 6.5;
// const positionDisplay = document.getElementById("position-display");

// ------------------------------------------------------- 環境光

const ambientLight = new THREE.AmbientLight(0x404040, 50);
scene.add(ambientLight);

// ------------------------------------------------------- 加載 & 滑鼠操作提示

const loadingScreen = document.getElementById("loading-screen");
const loadingText = document.getElementById("loading-text");
const mouseInstruction = document.getElementById("mouse-instruction");
const actionIcon = document.getElementById("action-icon");

let totalItems = 0;
let loadedItems = 0;

function updateLoadingProgress() {
  if (totalItems > 0) {
    const progress = Math.floor((loadedItems / totalItems) * 100);
    loadingText.textContent = `Loading... ${progress}%`;
  }
}

function hideLoadingScreen() {
  loadingScreen.classList.add("disappear");

  setTimeout(() => {
    loadingScreen.style.display = "none";

    // 加載完畢顯示操作提示
    mouseInstruction.classList.add("visible");
    actionIcon.classList.add("visible");
  }, 2000);
}

// -驚嘆號-重新顯示操作提示
actionIcon.addEventListener("click", () => {
  mouseInstruction.classList.add("visible");
});

// 隱藏提示
window.addEventListener("click", (event) => {
  if (!actionIcon.contains(event.target)) {
    mouseInstruction.classList.remove("visible");
  }
});

// ------------------------------------------------------- skybox環境模型

const loader = new GLTFLoader();
totalItems += 1;
loader.load(
  "./models/sky.glb",
  (gltf) => {
    const skybox = gltf.scene;
    skybox.scale.set(0.05, 0.05, 0.05);
    skybox.position.set(0, 0, 0);
    scene.add(skybox);
    loadedItems += 1;
    updateLoadingProgress();
  },
  (xhr) => {
    console.log(`${(xhr.loaded / xhr.total) * 100}% loaded`);
  },
  (error) => {
    console.error("An error happened", error);
  }
);

// ------------------------------------------------------- model場景模型
// 動畫
let mixer;
const clock = new THREE.Clock();

const modelLoader = new GLTFLoader();
totalItems += 1;
modelLoader.load(
  "./models/free_low_poly_game_assets.glb",
  (gltf) => {
    const model = gltf.scene;
    model.scale.set(1, 1, 1);
    model.position.set(0, 0, 0);
    scene.add(model);

    if (gltf.animations && gltf.animations.length > 0) {
      mixer = new THREE.AnimationMixer(model);
      gltf.animations.forEach((clip) => {
        const action = mixer.clipAction(clip);
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.clampWhenFinished = false; // 確保動畫可以立即重新開始
        action.play();
      });

      loadedItems += 1;
      updateLoadingProgress();

      if (loadedItems === totalItems) {
        hideLoadingScreen();
      }
    } else {
      console.warn("模型不包含動畫！");
    }
  },
  (xhr) => {
    console.log(`${(xhr.loaded / xhr.total) * 100}% loaded`);
  },
  (error) => {
    console.error("加載模型時發生錯誤", error);
  }
);

// ------------------------------------------------------- 平移縮放限制
// 控制器
const controls = new OrbitControls(camera, renderer.domElement);

controls.minDistance = 6;
controls.maxDistance = 25;

const panLimits = {
  min: new THREE.Vector3(-2, -2, -2),
  max: new THREE.Vector3(2, 2, 2),
};

function enforcePanLimits() {
  const target = controls.target;
  target.x = Math.max(panLimits.min.x, Math.min(panLimits.max.x, target.x));
  target.y = Math.max(panLimits.min.y, Math.min(panLimits.max.y, target.y));
  target.z = Math.max(panLimits.min.z, Math.min(panLimits.max.z, target.z));
}

// ------------------------------------------------------- 動畫渲染場景

function animate() {
  renderer.render(scene, camera);

  // 動畫渲染
  requestAnimationFrame(animate);
  if (mixer) {
    const delta = clock.getDelta();
    mixer.update(delta);
  }

  // 控制器更新
  controls.update();

  // 平移限制
  enforcePanLimits();

  // 更新相機位置顯示
  //   positionDisplay.textContent = `Camera Position: x=${camera.position.x.toFixed(
  //     2
  //   )} y=${camera.position.y.toFixed(2)} z=${camera.position.z.toFixed(2)}`;
}

animate();

// ------------------------------------------------------- RWD

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
