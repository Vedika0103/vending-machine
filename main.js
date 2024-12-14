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

// Texture loader for day/night backgrounds
const textureLoader = new THREE.TextureLoader();
const dayTexture = textureLoader.load('day.jpg'); // Load day background
const nightTexture = textureLoader.load('night.jpg'); // Load night background
scene.background = dayTexture; // Set initial background to day

// Add notification element
const notification = document.createElement('div');
notification.style.position = 'absolute';
notification.style.bottom = '20px';
notification.style.left = '50%';
notification.style.transform = 'translateX(-50%)';
notification.style.padding = '10px 20px';
notification.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
notification.style.color = 'white';
notification.style.fontSize = '14px';
notification.style.borderRadius = '8px';
notification.style.display = 'none';
notification.style.zIndex = 20;
notification.innerText = 'Soda can dropped!';
document.body.appendChild(notification);

// Show notification function
function showNotification(message) {
    notification.innerText = message;
    notification.style.display = 'block';
    setTimeout(() => {
        notification.style.display = 'none';
    }, 1500);
}

// Load vending machine
loader.load('models/vending_machine_rendered.glb', (gltf) => {
    vendingMachine = gltf.scene;
    scene.add(vendingMachine);

    // Adjust position, scale, and orientation
    vendingMachine.position.set(0, -0.85, 0); // Center and align with ground
    vendingMachine.scale.set(1.5, 1.5, 1.5); // Slightly larger vending machine
    vendingMachine.rotation.y = Math.PI * 1.5;

    vendingMachine.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.material.metalness = 0.5;
            child.material.roughness = 0.2;
        }
    });

    // Add hover effect for vending machine
    vendingMachine.traverse((child) => {
        if (child.isMesh) {
            child.onPointerOver = () => {
                document.body.style.cursor = 'pointer';
            };
            child.onPointerOut = () => {
                document.body.style.cursor = 'default';
            };
        }
    });

    // Add bulb image to toggle day/night mode
    const bulbImage = document.createElement('img');
    bulbImage.src = 'bulb.png'; // Ensure bulb.png is in the project folder
    bulbImage.alt = 'Toggle Day/Night';
    bulbImage.style.position = 'absolute';
    bulbImage.style.top = '120px';
    bulbImage.style.right = '20px';
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
    showNotification('Soda can dropped!');
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

// Toggle Day/Night Mode with smooth transition
let isDay = true;

function toggleDayNight() {
    scene.background = isDay ? nightTexture : dayTexture; // Set background to day/night
    directionalLight.intensity = isDay ? 0.8 : 1.5;
    ambientLight.intensity = isDay ? 0.4 : 1;
    ambientLight.color.set(isDay ? 0x555555 : 0xFFFFFF);
    isDay = !isDay;
}

// Make scene responsive to window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});