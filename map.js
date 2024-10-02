import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import Scrolling from './Scrolling.js'
import infos from './infoData.js'

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

const mcba = document.querySelector('.mcba')
const mudac = document.querySelector('.mudac')

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

// mcba.addEventListener('click', () => {
//     setInfoPanelData("mcba")
// });

// mudac.addEventListener('click', () => {
//     setInfoPanelData("mudac")
// });

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

renderer.domElement.addEventListener('click', onClick, false);

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    controls.update();
    renderer.render(scene, camera);

    scrolling.update()

    // Render and position clickable interestPoints
    for(const point of interestPoints) {
        const screenPosition = point.position.clone()
        screenPosition.project(camera)
  
        point.element.classList.add('visible')
  
        const translateX = screenPosition.x * window.innerWidth * 0.5
        const translateY = - screenPosition.y * window.innerHeight * 0.5
        point.element.style.transform = `translateX(${translateX}px) translateY(${translateY}px)`
      }
  }
  
  animate();
  
  // Handle window resizing
  window.addEventListener('resize', () => {
    const newCanvasWidth = window.innerWidth * 0.8;
    camera.aspect = newCanvasWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(newCanvasWidth, window.innerHeight);
  });