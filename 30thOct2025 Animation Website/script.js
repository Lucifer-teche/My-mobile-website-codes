// 🌌 Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 1);
document.getElementById('webGLContainer').appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0x444444);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 2, 1000);
scene.add(pointLight);

// 🌠 Starfield
const starCount = 8000;
const starGeometry = new THREE.BufferGeometry();
const starPositions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  starPositions[i * 3] = (Math.random() - 0.5) * 4000;
  starPositions[i * 3 + 1] = (Math.random() - 0.5) * 4000;
  starPositions[i * 3 + 2] = (Math.random() - 0.5) * 4000;
}
starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xffffff, size: 1 }));
scene.add(stars);

// 🌎 Central Core
const core = new THREE.Mesh(new THREE.SphereGeometry(3, 64, 64), new THREE.MeshBasicMaterial({ color: 0x00ffff }));
scene.add(core);

const glow = new THREE.Mesh(new THREE.SphereGeometry(4, 64, 64), new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.2 }));
scene.add(glow);

// 🪐 Create Universes
function createUniverse(x, y, z, color) {
  const group = new THREE.Group();
  const core = new THREE.Mesh(new THREE.SphereGeometry(2, 32, 32), new THREE.MeshPhongMaterial({ color, emissive: color, emissiveIntensity: 0.5 }));
  core.userData = { baseColor: color };
  group.add(core);

  for (let i = 0; i < 4; i++) {
    const planet = new THREE.Mesh(new THREE.SphereGeometry(Math.random() * 0.5 + 0.3, 32, 32), new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff }));
    planet.userData = { orbitRadius: Math.random() * 4 + 2, angle: Math.random() * Math.PI * 2, speed: 0.005 + Math.random() * 0.01 };
    group.add(planet);
  }
  group.position.set(x, y, z);
  scene.add(group);
  return group;
}

const universes = [
  createUniverse(15, 10, -30, 0xff00ff),
  createUniverse(-20, -5, -50, 0x00ff99),
  createUniverse(30, -15, -70, 0xffaa00),
  createUniverse(-40, 25, -90, 0x0099ff),
];

camera.position.z = 20;

// 🖱️ Mouse Motion
let mouseX = 0, mouseY = 0;
document.addEventListener('mousemove', e => {
  mouseX = (e.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
});

// 🎵 Audio Setup
const bgMusic = document.getElementById("bgMusic");
const hoverSound = document.getElementById("hoverSound");
const soundControl = document.getElementById("soundControl");
let soundEnabled = false;
let musicStarted = false;

soundControl.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  if (soundEnabled) {
    soundControl.classList.add("sound-on");
    soundControl.classList.remove("sound-off");
    soundControl.title = "Mute Sound";
    startMusic();
  } else {
    soundControl.classList.remove("sound-on");
    soundControl.classList.add("sound-off");
    soundControl.title = "Unmute Sound";
    gsap.to(bgMusic, { volume: 0, duration: 1.5 });
  }
});

function startMusic() {
  if (!musicStarted) {
    musicStarted = true;
    bgMusic.volume = 0;
    bgMusic.play().catch(() => {});
    gsap.to(bgMusic, { volume: 0.5, duration: 3 });
  } else {
    gsap.to(bgMusic, { volume: 0.5, duration: 1.5 });
  }
}

document.addEventListener("click", () => {
  if (!musicStarted && soundEnabled) startMusic();
});

// 🌈 Interactivity
let mouse = new THREE.Vector2();
let raycaster = new THREE.Raycaster();
let hoveredUniverse = null;
let activeUniverse = null;

document.addEventListener('mousemove', e => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

document.addEventListener('click', () => {
  if (hoveredUniverse && !activeUniverse) {
    activeUniverse = hoveredUniverse;
    const target = hoveredUniverse.parent.position;
    gsap.to(camera.position, { duration: 2, x: target.x, y: target.y, z: target.z + 5, ease: "power2.inOut" });
  } else if (activeUniverse) {
    gsap.to(camera.position, { duration: 2, x: 0, y: 0, z: 20, ease: "power2.inOut", onComplete: () => (activeUniverse = null) });
  }
});

// 🌀 Animate Everything
function animate() {
  requestAnimationFrame(animate);
  stars.rotation.x += 0.0003;
  stars.rotation.y += 0.0002;
  core.rotation.y += 0.01;
  glow.rotation.y += 0.005;

  // Hover logic
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(universes.map(u => u.children[0]));

  if (intersects.length > 0) {
    const hit = intersects[0].object;
    if (hoveredUniverse !== hit) {
      if (hoveredUniverse) {
        hoveredUniverse.material.emissive.setHex(hoveredUniverse.userData.baseColor);
        hoveredUniverse.scale.set(1, 1, 1);
      }
      hoveredUniverse = hit;
      gsap.to(hit.scale, { duration: 0.5, x: 2, y: 2, z: 2 });
      gsap.to(hit.material.emissive, { r: 1, g: 1, b: 1, duration: 0.3 });
      if (soundEnabled) {
        hoverSound.currentTime = 0;
        hoverSound.play().catch(() => {});
      }
    }
  } else if (hoveredUniverse) {
    hoveredUniverse.material.emissive.setHex(hoveredUniverse.userData.baseColor);
    gsap.to(hoveredUniverse.scale, { duration: 0.5, x: 1, y: 1, z: 1 });
    hoveredUniverse = null;
  }

  universes.forEach(u => {
    u.rotation.y += 0.002;
    u.children.forEach(obj => {
      if (obj.userData.orbitRadius) {
        obj.userData.angle += obj.userData.speed;
        obj.position.x = Math.cos(obj.userData.angle) * obj.userData.orbitRadius;
        obj.position.z = Math.sin(obj.userData.angle) * obj.userData.orbitRadius;
      }
    });
  });

  if (!activeUniverse) {
    camera.position.x += (mouseX * 10 - camera.position.x) * 0.05;
    camera.position.y += (mouseY * 10 - camera.position.y) * 0.05;
  }

  camera.lookAt(scene.position);
  pointLight.position.copy(camera.position);
  renderer.render(scene, camera);

  updateCursorTrail();
}
animate();

// 🔁 Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ✨ Cursor Trail
const cursorTrailCount = 15;
const trails = [];
for (let i = 0; i < cursorTrailCount; i++) {
  const div = document.createElement('div');
  div.className = 'cursor-trail';
  document.body.appendChild(div);
  trails.push({ el: div, x: 0, y: 0 });
}

let mousePos = { x: window.innerWidth/2, y: window.innerHeight/2 };
document.addEventListener('mousemove', e => {
  mousePos.x = e.clientX;
  mousePos.y = e.clientY;
});

function updateCursorTrail() {
  let x = mousePos.x, y = mousePos.y;
  trails.forEach(t => {
    t.x += (x - t.x) * 0.2;
    t.y += (y - t.y) * 0.2;
    t.el.style.transform = `translate(${t.x}px, ${t.y}px)`;
    x = t.x;
    y = t.y;
  });
}
