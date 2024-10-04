import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import Scrolling from './Scrolling.js'
import infos from './infoData.js'

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader'

const config = {
    lightColor: "white",
    lightStrength: 5,
    city3dModelPath: "city.glb",
    backgroundColor: 0x2C7869, // '0x' + hex code
    camera: {
        fov: 55,
        initialHeight: 500,
        farClippingPlane: 5000
    }
}

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(config.camera.fov, window.innerWidth / window.innerHeight, 0.1, config.camera.farClippingPlane);
const renderer = new THREE.WebGLRenderer({ alpha: true });
const gltfLoader = new GLTFLoader()
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// State variables
let hoverObject = {
  name: null
}

// Outline render effect
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);  
const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);

composer.addPass(renderPass);
composer.addPass(outlinePass);
composer.addPass(gammaCorrectionPass);

// Set outline color and parameters
outlinePass.edgeStrength = 5;  // Strength of the outline
outlinePass.edgeGlow = 0.0;    // Glow effect at the edges (usually kept low or zero)
outlinePass.edgeThickness = 1; // Thickness of the outline
outlinePass.pulsePeriod = 0;   // If non-zero, it creates a pulsing outline effect
outlinePass.visibleEdgeColor.set('#ffffff');  // Color of the outline (white)
outlinePass.hiddenEdgeColor.set('#000000');   // Color of hidden outline edges (black, or no effect)

// Set the objects you want to outline
outlinePass.selectedObjects = []

// Ambient light
const light = new THREE.AmbientLight(config.lightColor, config.lightStrength);
scene.add(light);

// Background color
scene.background = new THREE.Color(config.backgroundColor)

// Load 3D Model
gltfLoader.load(config.city3dModelPath, async function ( gltf ) {
    const model = gltf.scene;

    console.log(gltf.asset)
    // wait until the model can be added to the scene without blocking due to shader compilation

    await renderer.compileAsync( model, camera, scene );

    scene.add( model );
})

// Clickable labels, opens info panel
let interestPoints = []

/*
interestPoints = [
  {
    position: new THREE.Vector3(200, 200, 200),
    element: document.querySelector('.mcba')
  },
  {
    position: new THREE.Vector3(-200, 200, -200),
    element: document.querySelector('.mudac')
  }
]
*/

let scrolling = new Scrolling({
    element: document.querySelector('.info-panel-content')
})

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(-400, config.camera.initialHeight, 1000);
camera.lookAt(new THREE.Vector3(100, 0, 100))

controls.update();

const closeIcn = document.querySelector('.close')

const infoPanel = document.querySelector('.info-panel')
const infoPanelImage = document.querySelector('.info-panel-image')
const infoPanelLogo = document.querySelector('.info-panel-logo')
const infoPanelTitle = document.querySelector('.info-panel-title')
const infoPanelLead = document.querySelector('.info-panel-lead')
const infoPanelDescription = document.querySelector('.info-panel-description')
const infoPanelPhone = document.querySelector('.info-panel-phone')
const infoPanelEmail = document.querySelector('.info-panel-email')
const infoPanelWebsite = document.querySelector('.info-panel-website')
let infoPanelRightStyle = '0'

const setInfoPanelData = (objId) => {
    scrolling.target = 0
    infoPanel.style.right = '0'
    infoPanelImage.src = infos[objId].image
    infoPanelLogo.src = infos[objId].logo
    infoPanelTitle.innerHTML = infos[objId].title
    infoPanelLead.innerHTML = infos[objId].lead
    infoPanelDescription.innerHTML = infos[objId].description
    infoPanelPhone.innerHTML = infos[objId].contact[0]
    infoPanelEmail.innerHTML = infos[objId].contact[1]
    infoPanelWebsite.href = infos[objId].website
}

closeIcn.addEventListener('click', () => {
    infoPanelRightStyle = infoPanelRightStyle == '0' ? '-33%' : '0'
    infoPanel.style.right = infoPanelRightStyle
});


const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2()

function onClick() {

    event.preventDefault();
  
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
    raycaster.setFromCamera(mouse, camera);
  
    var intersects = raycaster.intersectObjects(scene.children, true);
  
    if (intersects.length > 0) {
  
      console.log('Intersection:', intersects[0].object.name);
      let hitObjectName = intersects[0].object.name
      hitObjectName = hitObjectName.split("TapTarget")[0]
      
      if(hitObjectName in infos) {
        setInfoPanelData(hitObjectName)
      }
    }
}

function onMouseMove() {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
    raycaster.setFromCamera(mouse, camera);
  
    var intersects = raycaster.intersectObjects(scene.children, true);
  
    if (intersects.length > 0) {
      let newHoverObject = intersects[0].object
      let prevHoverObject = hoverObject

      // Only update if hover object has changed
      if (prevHoverObject.name != newHoverObject.name) {
        // TODO Make hover over tap targets highlight associated building
        hoverObject = newHoverObject

        // Don't highlight terrain
        if (newHoverObject.name == "Terrain") return

        // Highlight new hover object
        outlinePass.selectedObjects = [hoverObject]
      }
    }
}

renderer.domElement.addEventListener('click', onClick, false);
renderer.domElement.addEventListener('mousemove', onMouseMove, false);

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    controls.update();
    composer.render(scene, camera);

    scrolling.update()
  }
  
  animate();
  
  // Handle window resizing
  window.addEventListener('resize', () => {
    const newCanvasWidth = window.innerWidth * 0.8;
    camera.aspect = newCanvasWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(newCanvasWidth, window.innerHeight);
  });