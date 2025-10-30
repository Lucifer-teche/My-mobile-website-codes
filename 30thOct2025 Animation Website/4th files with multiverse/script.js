// 🌌 Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 1);
document.getElementById('webGLContainer').appendChild(renderer.domElement);

// Lights
const ambientLight = new THREE.AmbientLight(0x444444);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 2, 5000);
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

// 🪐 Create Universes
function createUniverse(x, y, z, color, galaxyColors) {
  const universe = new THREE.Group();
  universe.position.set(x, y, z);

  // Universe Core
  const core = new THREE.Mesh(new THREE.SphereGeometry(5, 64, 64),
    new THREE.MeshPhongMaterial({ color, emissive: color, emissiveIntensity: 0.7 }));
  core.userData = { baseColor: color };
  universe.add(core);

  // Galaxies inside universe
  galaxyColors.forEach((gColor, idx) => {
    const galaxy = new THREE.Group();
    const gCore = new THREE.Mesh(new THREE.SphereGeometry(2, 32, 32),
      new THREE.MeshPhongMaterial({ color: gColor, emissive: gColor, emissiveIntensity: 0.5 }));
    galaxy.add(gCore);

    // Add stars/planets in galaxy
    for (let i = 0; i < 5; i++) {
      const planet = new THREE.Mesh(new THREE.SphereGeometry(Math.random() * 0.6 + 0.3, 32, 32),
        new THREE.MeshPhongMaterial({ color: randomPlanetColor() }));
      planet.userData = { orbitRadius: 4 + Math.random() * 3, angle: Math.random() * Math.PI * 2, speed: 0.005 + Math.random() * 0.01 };
      galaxy.add(planet);
    }

    galaxy.position.set(Math.random()*15-7, Math.random()*15-7, Math.random()*15-7);
    universe.add(galaxy);
  });

  scene.add(universe);
  return universe;
}

// 🌈 Planet Colors
function randomPlanetColor() {
  const colors = [
    0x1f77b4, // water blue
    0xd62728, // lava red
    0x2ca02c, // greenery
    0xffc107, // sand
    0xaaaaaa, // rock
    0xadd8e6, // ice
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Create 4 universes
const universes = [
  createUniverse(-60, 0, -200, 0x00ffff, [0xffdd33,0x33ffdd,0xdd33ff]),
  createUniverse(60, 0, -250, 0xff33aa, [0x33ff33,0xff3333,0x3333ff]),
  createUniverse(0, 60, -220, 0x33aaff, [0xffaa33,0xaa33ff,0x33ffaa]),
  createUniverse(0, -60, -180, 0xffaa00, [0x33ffff,0xff33ff,0xffff33]),
];

camera.position.z = 50;

// 🖱️ Mouse Motion
let mouseX = 0, mouseY = 0;
let mouse = new THREE.Vector2();
let raycaster = new THREE.Raycaster();
let hoveredObj = null;
let activeUniverse = null;

document.addEventListener('mousemove', e => {
  mouseX = (e.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
  mouse.x = mouseX;
  mouse.y = mouseY;
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

// 🌌 Animate & Interactivity
document.addEventListener('click', () => {
  if (hoveredObj && hoveredObj.parent && universes.includes(hoveredObj.parent)) {
    activeUniverse = hoveredObj.parent;
    gsap.to(camera.position, {
      x: activeUniverse.position.x,
      y: activeUniverse.position.y,
      z: activeUniverse.position.z + 20,
      duration: 2,
      ease: "power2.inOut"
    });
  }
});

function animate() {
  requestAnimationFrame(animate);

  // Rotate universes
  universes.forEach(u => u.rotation.y += 0.001);

  // Orbit planets
  universes.forEach(u => {
    u.children.forEach(galaxy => {
      if (galaxy.children) {
        galaxy.children.forEach(obj => {
          if (obj.userData.orbitRadius) {
            obj.userData.angle += obj.userData.speed;
            obj.position.x = Math.cos(obj.userData.angle) * obj.userData.orbitRadius;
            obj.position.z = Math.sin(obj.userData.angle) * obj.userData.orbitRadius;
          }
        });
      }
    });
  });

  // Hover detection
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(universes, true);
  if (intersects.length > 0) {
    if (hoveredObj !== intersects[0].object) {
      hoveredObj = intersects[0].object;
      if (soundEnabled) hoverSound.play();
    }
  } else hoveredObj = null;

  renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
