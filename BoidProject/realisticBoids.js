import * as THREE from "https://threejs.org/build/three.module.js";
import Stats from 'https://threejs.org/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'https://threejs.org/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'https://threejs.org/examples/jsm/libs/dat.gui.module.js';

let latticePitchContents = [];
let finLoading = false;
let clicked = false;
let latticeSidelen = 40;
var slen = 600;
var divisor = slen / latticeSidelen;

var height = slen;
var width = slen;
var depth = slen;

var xMin = 0; var xMax = width;
var yMin = 0; var yMax = height;
var zMin = 0; var zMax = depth;

var boids = []; //this is where I'll be able to keep track of all the fields. It's separate from the mesh.
boids.velocity = [];
boids.accel = [];
boids.separationDistance = divisor*2;
boids.cohesionDistance = slen*.35;
boids.alignmentDistance = slen*.6;
boids.separationForce = divisor*0.55;
boids.cohesionForce = divisor*0.25;
boids.alignmentForce = divisor*1.1;
boids.accelerationLimitRoot = 1.5;
boids.speedLimit = 3;
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
  camera.position.z = slen;
  camera.position.y = slen;
  camera.position.x = slen;

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

const controls = new OrbitControls( camera, renderer.domElement );


// const geometry = new THREE.ConeGeometry(1, 4, 5.3);
const geometry = new THREE.SphereGeometry( 1, 8, 8 );
const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
let mesh = new THREE.InstancedMesh( geometry, material, count );
mesh.instanceMatrix.setUsage( THREE.DynamicDrawUsage ); //will be updated every frame
const matrix = new THREE.Matrix4();
const color = new THREE.Color();

let i = 0;
while (i < (count)){
  matrix.setPosition( Math.floor(Math.random() * width),
                      Math.floor(Math.random() * height),
                      Math.floor(Math.random() * depth)
                    );
  boids.velocity.push( new THREE.Vector3( 0, 0, 0 ) );
  boids.accel.push( new THREE.Vector3( 1, 1, 1 ) );
  mesh.setMatrixAt( i, matrix );
  // mesh.setColorAt( i, color.setHex( 0xffffff ) );
  mesh.setColorAt( i, color.setHex( Math.random() * 0xffffff ) );
  i++;
}
scene.add( mesh );

while ( i < (count)) {
  setInitialMovVal( i );
}



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

  gui.add( params, 'sepDist', 0, slen ).onChange( function ( val ) {
    boids.separationDistance = val;
    render();
  });

  gui.add( params, 'cohDist', 0, slen ).onChange( function ( val ) {
    boids.cohesionDistance = val;
    render();
  });

  gui.add( params, 'aliDist', 0, slen ).onChange( function ( val ) {
    boids.alignmentDistance = val;
    render();
  });

  gui.add( params, 'sepForce', 0, 100 ).onChange( function ( val ) {
    boids.separationForce = val;
    render();
  });

  gui.add( params, 'cohForce', 0, 100 ).onChange( function ( val ) {
    boids.cohesionForce = val;
    render();
  });

  gui.add( params, 'aliForce', 0, 100 ).onChange( function ( val ) {
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

function setInitialMovVal( boidIndex ) {


  var randDir = new THREE.Vector3( randNum(), randNum(), randNum() );
  randDir.normalize;
  boids.velocity[boidIndex] = randDir.multiplyScalar( 2 );
  boids.accel[boidIndex] = randDir.multiplyScalar( 2 );
}

//returns a number from -1 to 1
function randNum() {
  // you'll only have even numbers but that's ok.
  return 2*(Math.random() - 0.5);
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

    boundPositions( i );

    mesh.getMatrixAt( i, matrix );
    position.setFromMatrixPosition( matrix );
      // let center = boids.velocity[i];
      // center.multiplyScalar(-1);
      // let up = new THREE.Vector3( position.x, position.y, position.z+1 );
      // matrix.lookAt( position, center, up );
    position.add( boids.velocity[i] );
    matrix.setPosition( position );
    mesh.setMatrixAt( i, matrix );
    mesh.instanceMatrix.needsUpdate = true;

     //this is only here bc the bounds don't work well.
    teleport( i );
    if ( finLoading) {
      mesh.getMatrixAt( i, matrix );
      position.setFromMatrixPosition( matrix );
      let posIndex = convertToLatticeInd( position.x , position.y , position.z );
      if (posIndex < 0 || posIndex > 63999 ) continue
      triggerReceive( i, posIndex )
    }
  }
}

// add this when movement is right
function lookRightDir() {
  let center = boids.velocity[i];
  center.multiplyScalar(-1);
  let up = new THREE.Vector3( position.x, position.y, position.z+1 );
  matrix.lookAt( position, center, up );
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
  let addv = new THREE.Vector3( 0, 0, 0 );
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

// directly changes velocity and accel values.
function boundPositions( boidIndex ) {

  let b = getBoidPos( boidIndex )
  if (b.x < xMin + 20) {
    boids.accel[boidIndex].setComponent( 0, (2)*Math.abs(boids.accel[boidIndex].x) );
  } else if (b.x > xMax - 20) {
    boids.accel[boidIndex].setComponent( 0, (-2)*Math.abs(boids.accel[boidIndex].x) );
  }

  if (b.y < yMin + 20) {
    boids.accel[boidIndex].setComponent( 1, (2)*Math.abs(boids.accel[boidIndex].y) );
  } else if (b.y > yMax - 20) {
    boids.accel[boidIndex].setComponent( 1, (-2)*Math.abs(boids.accel[boidIndex].y) );
  }

  if (b.z < zMin + 20) {
    boids.accel[boidIndex].setComponent( 2, (2)*Math.abs(boids.accel[boidIndex].z) );
  } else if (b.z > zMax - 20) {
    boids.accel[boidIndex].setComponent( 2, (-2)*Math.abs(boids.accel[boidIndex].z) );
  }
}

function teleport( boidIndex ) {
  let b = getBoidPos( boidIndex )
  if (b.x < xMin ) {
    b.setComponent( 0, 10 );
  } else if (b.x > xMax ) {
    b.setComponent( 0, 390 );
  }
  if (b.y < yMin ) {
    b.setComponent( 1, 10 );
  } else if (b.y > yMax ) {
    b.setComponent( 1, 390 );
  }
  if (b.z < zMin ) {
    b.setComponent( 2, 10 );
  } else if (b.z > zMax ) {
    b.setComponent( 2, 390 );
  }

  mesh.getMatrixAt( boidIndex, matrix );
  position.setFromMatrixPosition( matrix );
  matrix.setPosition( b );
  mesh.setMatrixAt( boidIndex, matrix );
  mesh.instanceMatrix.needsUpdate = true;
}

// This is a helper function to envision the walls.
function putInFrame() {

  const fcount = 4;

  // const geometry = new THREE.ConeGeometry(1, 4, 5.3);
  const fgeo = new THREE.SphereBufferGeometry( 5, 32, 32 );
  const fmat = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
  let fmesh = new THREE.InstancedMesh( fgeo, fmat, fcount );
  const fmatrix = new THREE.Matrix4();

  let i = 0;
  fmatrix.setPosition( 0, 0, 0 );
  fmesh.setMatrixAt( i, fmatrix );
  fmesh.setColorAt( i, color.setHex( 0x000000 ) );
  i++;
  fmatrix.setPosition( slen, 0, 0 );
  fmesh.setMatrixAt( i, fmatrix );
  fmesh.setColorAt( i, color.setHex( 0x7F194A ) );
  i++;
  fmatrix.setPosition( 0, slen, 0 );
  fmesh.setMatrixAt( i, fmatrix );
  fmesh.setColorAt( i, color.setHex( 0xff0000 ) );
  i++;
  fmatrix.setPosition( 0, 0, slen );
  fmesh.setMatrixAt( i, fmatrix );
  fmesh.setColorAt( i, color.setHex( 0x008000 ) );
  scene.add( fmesh );
}
// putInFrame();

//

/* rendering stuff */

function animate() {
  requestAnimationFrame(animate);
  move();
  stats.update();
  controls.update();
  render();
}

function render() {
  renderer.render( scene, camera );
}
animate();

//

/* LOADS FILE */

let parts = [];
let points = [];

async function loadFile(url) {
  const req = await fetch(url);
  return req.text();
}

function parseData( text ) {
  //split into lines
  text.split('\n').forEach( (line) => {
    parts.push( line );
  });
  return parts;
};

async function handleData( file ){
  latticePitchContents = await loadFile(file).then(parseData); //to fix later. Surely it's not efficient to have to load and wait everytime for the promise to finish.
  finLoading = true;
  // for (let i = 0; i < 20; i++ ) {
  //   move();
  // }
}
handleData('./sept11pValuesByLine.txt')

//

/* Handles Boid Position to sound */

// cartesian coordinates to array index
function convertToLatticeInd( xpos, ypos, zpos) {
  var xp = Math.round(xpos / divisor);
  var yp = Math.round(ypos / divisor);
  var zp = Math.round(zpos / divisor);
  var ind = (1600*(xp - 1)) + (40*(yp-1)) + zp;
  return ind;
}

// sends to pureData
function triggerReceive( boidIndex, posIndex ) {
  var val = Math.round( latticePitchContents[posIndex] * 440 );
  let receiver = 'num' + boidIndex.toString();

  Pd.send( receiver , [parseFloat(val)] );
}
