import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// WebGL Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x87CEEB); // Daytime sky blue
document.body.appendChild(renderer.domElement);

// Enable shadows
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Lights
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(5, 10, 7.5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1);
scene.add(ambientLight);

// Add a spotlight for extra lighting
const spotLight = new THREE.SpotLight(0xffffff, 1);
spotLight.position.set(2, 5, 3);
spotLight.angle = Math.PI / 4;
spotLight.castShadow = true;
scene.add(spotLight);

// GLTFLoader setup
const loader = new GLTFLoader();
let vendingMachine = null;
let sodaCanTemplate = null;

// Load vending machine
loader.load('models/vending_machine_rendered.glb', (gltf) => {
    vendingMachine = gltf.scene;
    scene.add(vendingMachine);

    vendingMachine.position.set(0, -0.85, 0); // Adjust Y position to align with the ground
    vendingMachine.scale.set(1.2, 1.2, 1.2);
    vendingMachine.rotation.y = Math.PI * 1.5;

    vendingMachine.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.material.metalness = 0.5;
            child.material.roughness = 0.2;
        }
    });

    // Add bulb image to toggle day/night mode
    const bulbImage = document.createElement('img');
    bulbImage.src = 'bulb.png'; // Ensure bulb.png is in the project folder
    bulbImage.alt = 'Toggle Day/Night';
    bulbImage.style.position = 'absolute';
    bulbImage.style.top = '120px';
    bulbImage.style.right = '20px'; // Position the bulb image on the right
    bulbImage.style.width = '50px';
    bulbImage.style.height = '50px';
    bulbImage.style.cursor = 'pointer';
    bulbImage.style.zIndex = 10;
    document.body.appendChild(bulbImage);

    bulbImage.addEventListener('click', toggleDayNight);
});

// Load soda can template
loader.load('models/soda_can.glb', (gltf) => {
    sodaCanTemplate = gltf.scene;
    sodaCanTemplate.scale.set(1.0, 1.0, 1.0);
});

// Plane to receive shadows
const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.5 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -1; // Ground position
ground.receiveShadow = true;
scene.add(ground);

// Camera setup
camera.position.set(0, 1.5, 5);
camera.lookAt(new THREE.Vector3(0, 1.5, 0));

// Raycaster for interaction
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

window.addEventListener('click', (event) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);

    if (vendingMachine && sodaCanTemplate) {
        const intersects = raycaster.intersectObject(vendingMachine, true);
        if (intersects.length > 0) {
            dropNewSodaCan();
        }
    }
});

// Function to create and drop a new soda can
function dropNewSodaCan() {
    const sodaCan = sodaCanTemplate.clone();
    sodaCan.position.set((Math.random() - 0.5) * 0.3, 0.5, 0);
    scene.add(sodaCan);
    dropFood(sodaCan);
}

// Drop animation for soda cans
function dropFood(foodItem) {
    const startY = foodItem.position.y;
    const targetY = -1;
    const duration = 1500;
    const startTime = Date.now();

    function animateDrop() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = progress * progress * (3 - 2 * progress);

        foodItem.position.y = startY * (1 - easedProgress) + targetY * easedProgress;
        foodItem.rotation.x += 0.05;
        foodItem.rotation.z += 0.03;

        if (progress < 1) {
            requestAnimationFrame(animateDrop);
        }
    }

    animateDrop();
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();

// Toggle Day/Night Mode
let isDay = true;

function toggleDayNight() {
    if (isDay) {
        renderer.setClearColor(0x000033); // Dark blue for night
        directionalLight.intensity = 0.8;
        ambientLight.intensity = 0.4;
        ambientLight.color.set(0x555555);
    } else {
        renderer.setClearColor(0x87CEEB); // Light blue for day
        directionalLight.intensity = 1.5;
        ambientLight.intensity = 1;
        ambientLight.color.set(0xFFFFFF);
    }
    isDay = !isDay;
}
