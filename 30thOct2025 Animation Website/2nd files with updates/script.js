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
const starColors = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
    starPositions[i * 3] = (Math.random() - 0.5) * 4000;
    starPositions[i * 3 + 1] = (Math.random() - 0.5) * 4000;
    starPositions[i * 3 + 2] = (Math.random() - 0.5) * 4000;

    // Star colors: Milky Way mostly white/yellow, other galaxies mix
    const rand = Math.random();
    if(rand<0.7){
        starColors[i*3]=1; starColors[i*3+1]=1; starColors[i*3+2]=0.9; // white-yellow
    } else if(rand<0.85){
        starColors[i*3]=0.5; starColors[i*3+1]=0.7; starColors[i*3+2]=1; // blue
    } else{
        starColors[i*3]=1; starColors[i*3+1]=0.4; starColors[i*3+2]=0.7; // pinkish
    }
}
starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ vertexColors: true, size: 1 }));
scene.add(stars);

// 🌎 Central Core
const core = new THREE.Mesh(new THREE.SphereGeometry(3, 64, 64), new THREE.MeshBasicMaterial({ color: 0x00ffff }));
scene.add(core);
const glow = new THREE.Mesh(new THREE.SphereGeometry(4, 64, 64), new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.2 }));
scene.add(glow);

// 🪐 Create Universes
function createUniverse(x, y, z, color, galaxyType) {
    const group = new THREE.Group();
    const core = new THREE.Mesh(new THREE.SphereGeometry(2, 32, 32), new THREE.MeshPhongMaterial({ color, emissive: color, emissiveIntensity: 0.3 }));
    core.userData = { baseColor: color, galaxyType };
    group.add(core);

    for (let i = 0; i < 4; i++) {
        // Planet types
        let planetColor;
        if(galaxyType==="milky") {
            const type = Math.random();
            if(type<0.2) planetColor=0x2e8b57; // greenery
            else if(type<0.4) planetColor=0xd2b48c; // sand/soil
            else if(type<0.6) planetColor=0x1e90ff; // water
            else if(type<0.8) planetColor=0xffffff; // ice
            else planetColor=0xff4500; // lava
        } else {
            planetColor = Math.random()*0xffffff;
        }

        const planet = new THREE.Mesh(new THREE.SphereGeometry(0.5 + Math.random()*0.5, 32, 32),
            new THREE.MeshPhongMaterial({ color: planetColor, emissive: planetColor*0.2, emissiveIntensity: 0.1 }));
        planet.userData = {
            orbitRadius: 3 + i*2,
            angle: Math.random()*Math.PI*2,
            speed: 0.002 + Math.random()*0.002
        };
        planet.position.x = Math.cos(planet.userData.angle)*planet.userData.orbitRadius;
        planet.position.z = Math.sin(planet.userData.angle)*planet.userData.orbitRadius;
        group.add(planet);
    }

    group.position.set(x, y, z);
    return group;
}

// 🌌 Add universes
const universes = [
    createUniverse(0,0,0,0xffffaa,"milky"),   // Milky Way
    createUniverse(50,0,-50,0xff88ff,"exotic"),
    createUniverse(-50,10,-60,0x88ff88,"exotic"),
    createUniverse(0,-30,40,0x8888ff,"exotic")
];

universes.forEach(u => scene.add(u));

// 🌌 Extra Objects for Milky Way
function addAsteroidBelt(planet, radius) {
    const belt = new THREE.Group();
    const count = 200;
    for (let i = 0; i < count; i++) {
        const rock = new THREE.Mesh(
            new THREE.SphereGeometry(Math.random() * 0.05 + 0.02, 8, 8),
            new THREE.MeshPhongMaterial({ color: 0x888888 })
        );
        const angle = Math.random() * Math.PI * 2;
        const dist = radius + Math.random() * 0.3;
        rock.position.set(Math.cos(angle) * dist, (Math.random()-0.5)*0.1, Math.sin(angle) * dist);
        belt.add(rock);
    }
    planet.add(belt);
}

// 🌌 Extra Objects for Exotic Galaxies
function addGasCloud(universe) {
    const cloudGeo = new THREE.SphereGeometry(5 + Math.random()*5, 32, 32);
    const cloudMat = new THREE.MeshPhongMaterial({
        color: 0xff33aa + Math.random()*0x00ffff,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide
    });
    const cloud = new THREE.Mesh(cloudGeo, cloudMat);
    cloud.position.set((Math.random()-0.5)*10, (Math.random()-0.5)*10, (Math.random()-0.5)*10);
    universe.add(cloud);
}

// Apply extra objects
universes.forEach((u, i) => {
    if(i===0){ // Milky Way
        u.children.forEach(p => { if(p.geometry.type==="SphereGeometry") addAsteroidBelt(p, 2 + Math.random()*2); });
    } else { // Exotic
        for(let j=0;j<3;j++) addGasCloud(u);
    }
});

// 🖱️ Hover Detection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let INTERSECTED;

document.addEventListener('mousemove', e => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

function handleHover() {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    if(intersects.length>0){
        const obj = intersects[0].object;
        if(obj.geometry && obj.geometry.type==="SphereGeometry"){
            if(INTERSECTED!==obj){
                if(INTERSECTED){
                    gsap.to(INTERSECTED.scale, {x:1,y:1,z:1,duration:0.3});
                    INTERSECTED.material.emissiveIntensity = 0;
                }
                INTERSECTED = obj;
                gsap.to(obj.scale, {x:1.3,y:1.3,z:1.3,duration:0.3});
                obj.material.emissiveIntensity = 0.5;
                if(soundEnabled) hoverSound.play();
            }
        }
    } else {
        if(INTERSECTED){
            gsap.to(INTERSECTED.scale, {x:1,y:1,z:1,duration:0.3});
            INTERSECTED.material.emissiveIntensity = 0;
            INTERSECTED = null;
        }
    }
}

// 🔊 Sound Control
const bgMusic = document.getElementById("bgMusic");
const hoverSound = document.getElementById("hoverSound");
let soundEnabled = false;
const soundControl = document.getElementById("soundControl");
soundControl.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    if(soundEnabled){
        bgMusic.play();
        soundControl.classList.remove('sound-off'); soundControl.classList.add('sound-on');
    } else {
        bgMusic.pause();
        soundControl.classList.remove('sound-on'); soundControl.classList.add('sound-off');
    }
});

// 🔄 Animate
let mouseX=0, mouseY=0;
document.addEventListener('mousemove', e=> { mouseX = (e.clientX/window.innerWidth - 0.5)*2; mouseY = (e.clientY/window.innerHeight - 0.5)*2; });

function animate() {
    requestAnimationFrame(animate);

    handleHover();

    camera.position.x += (mouseX * 20 - camera.position.x) * 0.05;
    camera.position.y += (mouseY * 20 - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    universes.forEach(u => {
        u.rotation.y += 0.001;
        u.children.forEach(p => {
            if (p.userData.orbitRadius) {
                p.userData.angle += p.userData.speed;
                p.position.x = Math.cos(p.userData.angle) * p.userData.orbitRadius;
                p.position.z = Math.sin(p.userData.angle) * p.userData.orbitRadius;
            }
        });
    });

    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', ()=>{
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
