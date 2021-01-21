import * as THREE from "https://threejs.org/build/three.module.js";
import Stats from 'https://threejs.org/examples/jsm/libs/stats.module.js';
// import { OrbitControls } from 'https://threejs.org/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'https://threejs.org/examples/jsm/libs/dat.gui.module.js';

var height = 400;
var width = 400;
var depth = 400;
var maxSpeed = 2.5;

var xMin = 0;
var yMin = 0;
var zMin = 0;

var xMax = width;
var yMax = height;
var zMax = depth;

var boids = []; //this is where I'll be able to keep track of all the fields. It's separate from the mesh.
boids.velocity = [];
boids.accel = [];
boids.separationDistance = 20;
boids.cohesionDistance = 40;
boids.alignmentDistance = 100;
boids.separationForce = 1.5;
boids.cohesionForce = 1;
boids.alignmentForce = 2.5;
boids.accelerationLimitRoot = 3;
boids.speedLimit = 5;
boids.accelerationLimit = Math.pow(boids.accelerationLimitRoot, 2);

var sforceX = 0; var sforceY = 0; var sforceZ = 0;
var cforceX = 0; var cforceY = 0; var cforceZ = 0;
var aforceX = 0; var aforceY = 0; var aforceZ = 0;
var spareX = 0; var spareY = 0; var spareZ = 0;

var xmaxN = new THREE.Vector3( -1, 0, 0 ); var xminN = new THREE.Vector3( 1, 0, 0 );
var ymaxN = new THREE.Vector3( 0, -1, 0 ); var yminN = new THREE.Vector3( 0, 1, 0 );
var zmaxN = new THREE.Vector3( 0, 0, -1 ); var zminN = new THREE.Vector3( 0, 0, 1);

/* GUI Parameters */
const count = parseInt( window.location.search.substr( 1 ) ) || 300;
const sepForce = parseInt( window.location.search.substr( 2 ) ) || boids.separationForce;
const cohForce = parseInt( window.location.search.substr( 3 ) ) || boids.cohesionForce;
const aliForce = parseInt( window.location.search.substr( 4 ) ) || boids.alignmentForce;
const sepDist = parseInt( window.location.search.substr( 5 ) ) || boids.separationDistance;
const cohDist = parseInt( window.location.search.substr( 6 ) ) || boids.cohesionDistance;
const aliDist = parseInt( window.location.search.substr( 7 ) ) || boids.alignmentDistance;

//

var scene = new THREE.Scene();
  scene.background = new THREE.Color( 0x01374c );
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 450;
  camera.position.y = 0;
  camera.position.x = 50;

var position = new THREE.Vector3();

var renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener( 'resize', onWindowResize, false );
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}

const geometry = new THREE.ConeGeometry( 1, 4, 5.3 );
const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
let mesh = new THREE.InstancedMesh( geometry, material, count );
mesh.instanceMatrix.setUsage( THREE.DynamicDrawUsage ); //will be updated every frame
const matrix = new THREE.Matrix4();
const color = new THREE.Color();

let i = 0;
while (i < (count)){
  matrix.setPosition( Math.floor(Math.random() * width) - width/2,
                      Math.floor(Math.random() * height) - height/2,
                      Math.floor(Math.random() * depth) - depth/2
                    );
  boids.velocity.push( new THREE.Vector3( 0.01, 0.01, 0.01 ) );
  boids.accel.push( new THREE.Vector3( 0.01, 0.01, 0.01 ) );
  mesh.setMatrixAt( i, matrix );
  // mesh.setColorAt( i, color.setHex( Math.random() * 0xffffff ) );
  mesh.setColorAt( i, color.setHex( 0xffffff ) );
  i++;
}
scene.add( mesh );



/* GUI & Stats */
function buildGui() {
  const gui = new GUI();
  const params = {
    //count is not included here
    sepDist  : boids.separationDistance,
    cohDist  : boids.cohesionDistance,
    aliDist  : boids.alignmentDistance,
    sepForce : boids.separationForce,
    cohForce : boids.cohesionForce,
    aliForce : boids.alignmentForce
  };

  gui.add( mesh, 'count', 0, count);

  gui.add( params, 'sepDist', 0, 1000 ).onChange( function ( val ) {
    boids.separationDistance = val;
    render();
  });

  gui.add( params, 'cohDist', 0, 1000 ).onChange( function ( val ) {
    boids.cohesionDistance = val;
    render();
  });

  gui.add( params, 'aliDist', 0, 1000 ).onChange( function ( val ) {
    boids.alignmentDistance = val;
    render();
  });

  gui.add( params, 'sepForce', 0, 20 ).onChange( function ( val ) {
    boids.separationForce = val;
    render();
  });

  gui.add( params, 'cohForce', 0, 20 ).onChange( function ( val ) {
    boids.cohesionForce = val;
    render();
  });

  gui.add( params, 'aliForce', 0, 20 ).onChange( function ( val ) {
    boids.alignmentForce = val;
    render();
  });
}
buildGui();

let stats = new Stats();
document.body.appendChild( stats.dom );

//

/* Boids Methods */

function getBoidPos( boidIndex ) {
  mesh.getMatrixAt( boidIndex, matrix );
  position.setFromMatrixPosition( matrix );
  return position;
}

function move() {

  for (let i = 0; i < count; i++ ) {
    sforceX = 0; sforceY = 0; sforceZ = 0;
    cforceX = 0; cforceY = 0; cforceZ = 0;
    aforceX = 0; aforceY = 0; aforceZ = 0;

    let currBoidPos = getBoidPos( i );
    let cPos = new THREE.Vector3( currBoidPos.x, currBoidPos.y, currBoidPos.z);
    for (let tar = 0; tar < count; tar++ ) {
      if (i == tar) continue
      let targetPos = getBoidPos( tar );
      let diff = new THREE.Vector3( cPos.x-targetPos.x, cPos.y-targetPos.y, cPos.z-targetPos.z );
      let distSqrtRoot = hypot3( diff.x, diff.y, diff.z );

      if (distSqrtRoot < sepDist) {
        sforceX += diff.x;
        sforceY += diff.y;
        sforceZ += diff.z;
      } else {
        if (distSqrtRoot < cohDist) {
          cforceX += diff.x;
          cforceY += diff.y;
          cforceZ += diff.z;
        }
        if (distSqrtRoot < aliDist) {
          aforceX += boids.velocity[tar].x;
          aforceY += boids.velocity[tar].y;
          aforceZ += boids.velocity[tar].z;
        }
      }
    }

    separation( sepForce, sforceX, sforceY, sforceZ, i );
    cohesion(   cohForce, cforceX, cforceY, cforceZ, i );
    alignment(  aliForce, aforceX, aforceY, aforceZ, i );
  }

  for (let i = 0; i < count; i++ ) {
    let currAccel = boids.accel[i];
    if ( boids.accelerationLimit ) {
      let accelSqrtRoot = hypot3( currAccel.x, currAccel.y, currAccel.z );
      if ( accelSqrtRoot > boids.accelerationLimit ) {
        let ratio = boids.accelerationLimitRoot / accelSqrtRoot;
        boids.accel[i].multiplyScalar( ratio );
      }
    }

    boids.velocity[i].add( boids.accel[i] );
    let currVel = boids.velocity[i];
    if ( boids.speedLimit ) {
      let velSqrtRoot = hypot3( currVel.x, currVel.y, currVel.z );
      if ( velSqrtRoot > boids.speedLimit ) {
        let ratio = boids.speedLimit / velSqrtRoot;
        boids.velocity[i].multiplyScalar( ratio );
      }
    }

    let boundV = boundPositions( i );
    boids.velocity[i].add( boundV );

    mesh.getMatrixAt( i, matrix );
    position.setFromMatrixPosition( matrix );
      let center = boids.velocity[i];
      center.multiplyScalar(-1);
      let up = new THREE.Vector3( position.x, position.y, position.z+1 );
      matrix.lookAt( position, center, up );
    position.add( boids.velocity[i] );
    matrix.setPosition( position );
    mesh.setMatrixAt( i, matrix );
    mesh.instanceMatrix.needsUpdate = true;
  }
}

// splits the 3d triangle into two hypot.
// supposedly FAST
function hypot3(a, b, c) {
  a = Math.abs(a);
  b = Math.abs(b);
  var lo = Math.min(a, b)
  var hi = Math.max(a, b)
  var ab = hi + 3 * lo / 32 + Math.max(0, 2 * lo - hi) / 8 + Math.max(0, 4 * lo - hi) / 16;

  c = Math.abs(c);
  var lo = Math.min(ab, c)
  var hi = Math.max(ab, c)
  return hi + 3 * lo / 32 + Math.max(0, 2 * lo - hi) / 8 + Math.max(0, 4 * lo - hi) / 16;
}

function separation( sepForce, sfX, sfY, sfZ, ind) {
  let length = hypot3( sfX, sfY, sfZ );
  let addv = new THREE.Vector3( 0.01, 0.01, 0.01);
  if (length != 0){
    addv.x = (sepForce * sfX / length);
    addv.y = (sepForce * sfY / length);
    addv.z = (sepForce * sfZ / length);
  }
  boids.accel[ind].add( addv );
}

function cohesion( cohForce, cfX, cfY, cfZ , ind) {
  let length = hypot3( cfX, cfY, cfZ );
  let addv = new THREE.Vector3( 0, 0, 0 );
  if (length != 0){
  addv.x = (cohForce * cfX / length);
  addv.y = (cohForce * cfY / length);
  addv.z = (cohForce * cfZ / length);
  }
  boids.accel[ind].sub( addv );
}

function alignment( aliForce, afX, afY, afZ , ind) {
  let length = hypot3( afX, afY, afZ );
  let addv = new THREE.Vector3( 0, 0, 0 );
  if (length != 0){
  addv.x = (aliForce * afX / length);
  addv.y = (aliForce * afY / length);
  addv.z = (aliForce * afZ / length);
  }
  boids.accel[ind].sub( addv );
}

function boundPositions( boidIndex ) {
  var v = new THREE.Vector3();
  let b = getBoidPos( boidIndex );

  if (b.x < xMin + 20) {
    boids.velocity[boidIndex].reflect( xminN );
  } else if (b.x > xMax - 20) {
    boids.velocity[boidIndex].reflect( xmaxN );
  }

  if (b.y < yMin + 20) {
    boids.velocity[boidIndex].reflect( yminN );
  } else if (b.y > yMax - 20) {
    boids.velocity[boidIndex].reflect( ymaxN );
  }

  if (b.z < zMin + 20) {
    boids.velocity[boidIndex].reflect( zminN );
  } else if (b.z > zMax - 20) {
    boids.velocity[boidIndex].reflect( zmaxN );
  }
  return v;
}

//

/* rendering stuff */

function animate() {
  requestAnimationFrame(animate);
  move();
  stats.update();
  render();
}

function render() {
  // move();
  renderer.render( scene, camera );

}
animate();
//
// drawBoids();
// animate();
