import * as THREE from "https://threejs.org/build/three.module.js";
import Stats from 'https://threejs.org/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'https://threejs.org/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'https://threejs.org/examples/jsm/libs/dat.gui.module.js';

let altWidt = 0.75;
let altHeig = 1;
let inWidth = window.innerWidth * altWidt;
let inHeight = window.innerHeight * altHeig;

let latticePitchContents = [];
let finLoading = false;
let clicked = false;

let thereIsAGoal = false;
let pitchGoalval = -1;

//webpd fields
let indArr = []; //this is the lattice index
let itArr = [];  //this is the number of boids that were found in the lattice index.
let vc = new Array( 64000 );

// size
var height = slen;
var width = slen;
var depth = slen;

var xMin = 0; var xMax = width;
var yMin = 0; var yMax = height;
var zMin = 0; var zMax = depth;

var sforceX = 0; var sforceY = 0; var sforceZ = 0;
var cforceX = 0; var cforceY = 0; var cforceZ = 0;
var aforceX = 0; var aforceY = 0; var aforceZ = 0;

let cenOM = new THREE.Vector3( 400.0, 400.0, 400.0 );

var xmaxN = new THREE.Vector3( -1, 0, 0 ); var xminN = new THREE.Vector3( 1, 0, 0 );
var ymaxN = new THREE.Vector3( 0, -1, 0 ); var yminN = new THREE.Vector3( 0, 1, 0 );
var zmaxN = new THREE.Vector3( 0, 0, -1 ); var zminN = new THREE.Vector3( 0, 0, 1);

/* GUI Parameters */
const count = 280;
//

var scene = new THREE.Scene();
  scene.background = new THREE.Color( 0x002330 );
var camera = new THREE.PerspectiveCamera(75, inWidth / inHeight, 0.1, 1000);
  camera.position.z = slen;
  camera.position.y = slen;
  camera.position.x = slen;

var position = new THREE.Vector3();

var renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize(inWidth, inHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener( 'resize', onWindowResize, false );
function onWindowResize() {
  inWidth = window.innerWidth * altWidt;
  inHeight = window.innerHeight * altHeig;
  camera.aspect = inWidth / inHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( inWidth, inHeight );
}

const controls = new OrbitControls( camera, renderer.domElement );


// const geometry = new THREE.ConeGeometry(1, 4, 5.3);
const geometry = new THREE.SphereGeometry( 1.5, 6, 6 );
const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
let mesh = new THREE.InstancedMesh( geometry, material, count );
mesh.instanceMatrix.setUsage( THREE.DynamicDrawUsage ); //will be updated every frame
const matrix = new THREE.Matrix4();
const color = new THREE.Color();

function init() {
  let i = 0;
  while (i < (count)){
    let x0 = Math.floor(Math.random() * (width*0.5) + 100);
    let y0 = Math.floor(Math.random() * (height*0.5)+ 100);
    let z0 = Math.floor(Math.random() * (depth*0.5)+ 100);
    matrix.setPosition( x0, y0, z0 );
    boids.velocity.push( new THREE.Vector3( 0.1, 0.1, 0.1 ) );
    boids.accel.push( new THREE.Vector3( 0.1, 0.1, 0.1 ) );
    mesh.setMatrixAt( i, matrix );
      let pInt = getPitchInteger( convertToLatticeInd( x0, y0, z0 ) );
    mesh.setColorAt( i, getColor( pInt ) );
    // mesh.setColorAt( i, color.setHex( Math.random() * 0xffffff ) );\
    i++;

  }
  scene.add( mesh );

  while ( i < (count)) {
    setInitialMovVal( i );
  }
}

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

function calcChange() {

  for (let i = 0; i < count; i++ ) {
    sforceX = 0; sforceY = 0; sforceZ = 0;
    cforceX = 0; cforceY = 0; cforceZ = 0;
    aforceX = 0; aforceY = 0; aforceZ = 0;

    let currBoidPos = getBoidPos( i );
    let cPos = new THREE.Vector3( currBoidPos.x, currBoidPos.y, currBoidPos.z);
    for (let tar = 0; tar < count; tar++ ) {
      if (i == tar) continue
      let targetPos = getBoidPos( tar );
      // let diff = new THREE.Vector3( cPos.x-targetPos.x, cPos.y-targetPos.y, cPos.z-targetPos.z );
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

      cenOM.add(targetPos);
    }
    cenOM.normalize();

    let addition = new THREE.Vector3();
    addition.add( separation( sepForce, sforceX, sforceY, sforceZ, i ) );
    addition.sub( cohesion(   cohForce, cforceX, cforceY, cforceZ, i ) );
    addition.sub( alignment(  aliForce, aforceX, aforceY, aforceZ, i ) );

    // if (thereIsAGoal) {
    //   let oldMag = addition.length();
    //   addition.normalize();
    //   addition.multiplyScalar( 0.4 );
    //
    //   let pitchGoalIndFound = setPitchGoal( pitchGoalval );
    //   let pitchGoalxyz = convertToXYZ( pitchGoalIndFound ) //THREE.Vector3;
    //   pitchGoalxyz.normalize();
    //   pitchGoalxyz.multiplyScalar( 0.6 );
    //
    //   addition.add(pitchGoalxyz);
    //   addition.normalize();
    //   addition.multiplyScalar( oldMag );
    //
    //   if (convertToLatticeInd(getAvgBoidPos()) == pitchGoalIndFound){
    //     thereIsAGoal = false;
    //   }
    // }

    boids.accel[i].add( addition );

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
  }
}

function move( centerOfMass ) {
  calcChange();
  for (let i = 0; i < count; i++ ) {
    stayInGroup( i, centerOfMass );
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
    let pInt = getPitchInteger( convertToLatticeInd( position.x, position.y, position.z ) );
    mesh.setColorAt( i, getColor( pInt ) );


     //this is only here bc the bounds don't work well.
    teleport( i );
    if ( finLoading && ( i < 31 )) {
      mesh.getMatrixAt( i, matrix );
      position.setFromMatrixPosition( matrix );
      let posIndex = convertToLatticeInd( position.x , position.y , position.z );
      if (posIndex < 0 || posIndex > 63999 ) continue
      triggerReceive( i+1, posIndex )
      positionCounter( i );
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
    addv.x = (sepForce * sfX / Math.pow(length,2));
    addv.y = (sepForce * sfY / Math.pow(length,2));
    addv.z = (sepForce * sfZ / Math.pow(length,2));
  }
  // boids.accel[ind].add( addv );
  return addv;
}

function cohesion( cohForce, cfX, cfY, cfZ , ind) {
  let length = hypot3( cfX, cfY, cfZ );
  let addv = new THREE.Vector3( 0, 0, 0 );
  if (length != 0){
  addv.x = (cohForce * cfX / Math.pow(length,2));
  addv.y = (cohForce * cfY / Math.pow(length,2));
  addv.z = (cohForce * cfZ / Math.pow(length,2));
  }
  // boids.accel[ind].sub( addv );
  return addv;
}

function alignment( aliForce, afX, afY, afZ , ind) {
  let length = hypot3( afX, afY, afZ );
  let addv = new THREE.Vector3( 0, 0, 0 );
  if (length != 0){
  addv.x = (aliForce * afX / Math.pow(length,2));
  addv.y = (aliForce * afY / Math.pow(length,2));
  addv.z = (aliForce * afZ / Math.pow(length,2));
  }
  // boids.accel[ind].sub( addv );
  return addv;
}

// In theory, this works the same as boundPositions();
// If a boid gets too far from the center of mass, I have the boid change acceleration to point to the center of mass.
function stayInGroup( boidIndex, cenOM ) {
  let b = getBoidPos( boidIndex );
  let n = new THREE.Vector3( cenOM.x, cenOM.y, cenOM.z);
  let r = Math.abs(b.distanceTo( n ));

  if (r > flockRad) {
    let tocenOM = n.sub( b );
    // console.log(tocenOM)
    let oldmag = boids.accel[boidIndex].length();
    tocenOM.normalize();
    tocenOM.multiplyScalar( oldmag*2 );

    boids.accel[boidIndex] = tocenOM;
  }
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
  mesh.instanceColor.needsUpdate = true;
}

// let old = sepDist;

function animate() {
  requestAnimationFrame(animate);
  move( cenOM );
  if (finLoading) {
    vue_det.message = mostCommonPitch();
  }
  // if (old != sepDist) {
  //   console.log( 1 );
  // }
  stats.update();
  controls.update();
  render();
}
// init();
// move( cenOM );

function render() {
  renderer.render( scene, camera );
}

// animate(); THIS IS CALLED ONCE DATA IS FINISHED LOADING

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
  init();
  animate();
}
handleData('./sept11pValuesByLine.txt')
//

/* Handles above data*/

function getColor( int ) {
  switch(int) {
    case 0:
      return (new THREE.Color( 0xef1011 ));
      break;
    case 1:
      return (new THREE.Color( 0xe67b19 ));
      break;
    case 2:
      return (new THREE.Color( 0xe4d41b ));
      break;
    case 3:
      return (new THREE.Color( 0x7ce718 ));
      break;
    case 4:
      return (new THREE.Color( 0x1de21d ));
      break;
    case 5:
      return( new THREE.Color( 0x1ee192 ));
      break;
    case 6:
      return (new THREE.Color( 0x10efee ));
      break;
    case 7:
      return (new THREE.Color( 0x1984e6 ));
      break;
    case 8:
      return (new THREE.Color( 0x1b2be4 ));
      break;
    case 9:
      return (new THREE.Color( 0x8318e7 ));
      break;
    case 10:
      return (new THREE.Color( 0xe21d32 ));
      break;
    case 11:
      return (new THREE.Color( 0xe11e6d ));
      break;
    case 12:
      return (new THREE.Color( 0xef1011 ));
      break;
    default:
      return (new THREE.Color( 0x002330 ));
  }
}

// cartesian coordinates to array index
function convertToLatticeInd( xpos, ypos, zpos) {
  var xp = Math.round(xpos / divisor);
  var yp = Math.round(ypos / divisor);
  var zp = Math.round(zpos / divisor);
  var ind = (1600*(xp - 1)) + (40*(yp-1)) + zp;
  return ind;
}

function convertToXYZ( latticeInd ) {
  let xpos = Math.floor(latticeInd/1600);
  let ypos = Math.floor((latticeInd % 1600)/40); //this is equivalent to ypos = Math.floor( (latticeInd-(1600*xpos))/40)
  let zpos = Math.floor(latticeInd % 40);
  return new THREE.Vector3( xpos, ypos, zpos );
}

function mostCommonPitch() {
  let tempArr = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
  for (let i=0; i<count; i++) {
    let p = getBoidPos(i);
    let posInd = convertToLatticeInd( p.x, p.y, p.z );
    let val = latticePitchContents[posInd]; //The output is between 0 and 1.
    switch(Math.round(val*12)) {
      case 0:
        tempArr[0]++;
        break;
      case 1:
        tempArr[1]++;
        break;
      case 2:
        tempArr[2]++;
        break;
      case 3:
        tempArr[3]++;
        break;
      case 4:
        tempArr[4]++;
        break;
      case 5:
        tempArr[5]++;
        break;
      case 6:
        tempArr[6]++;
        break;
      case 7:
        tempArr[7]++;
        break;
      case 8:
        tempArr[8]++;
        break;
      case 9:
        tempArr[9]++;
        break;
      case 10:
        tempArr[10]++;
        break;
      case 11:
        tempArr[11]++;
        break;
      case 12:
        tempArr[0]++;
    }
  }
  let mostFrequent = 0;
  for (let i=0; i<tempArr.length; i++){
    if (tempArr[i] > tempArr[mostFrequent]) {
      mostFrequent = i;
    }
  }
  let msg = "O";
  switch( mostFrequent ) {
    case 0:
      msg="A";
      break;
    case 1:
      msg="A#";
      break;
    case 2:
      msg="B";
      break;
    case 3:
      msg="C";
      break;
    case 4:
      msg="C#";
      break;
    case 5:
      msg="D";
      break;
    case 6:
      msg="D#";
      break;
    case 7:
      msg="E";
      break;
    case 8:
      msg="F";
      break;
    case 9:
      msg="F#";
      break;
    case 10:
      msg="G";
      break;
    case 11:
      msg="G#";
      break;
    case 12:
      msg="A";
  }
  return msg;
}

function mostCommonPitchInteger() {
  let tempArr = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
  for (let i=0; i<count; i++) {
    let p = getBoidPos(i);
    let posInd = convertToLatticeInd( p.x, p.y, p.z );
    let val = latticePitchContents[posInd]; //The output is between 0 and 1.
    switch(Math.round(val*12)) {
      case 0:
        tempArr[0]++;
        break;
      case 1:
        tempArr[1]++;
        break;
      case 2:
        tempArr[2]++;
        break;
      case 3:
        tempArr[3]++;
        break;
      case 4:
        tempArr[4]++;
        break;
      case 5:
        tempArr[5]++;
        break;
      case 6:
        tempArr[6]++;
        break;
      case 7:
        tempArr[7]++;
        break;
      case 8:
        tempArr[8]++;
        break;
      case 9:
        tempArr[9]++;
        break;
      case 10:
        tempArr[10]++;
        break;
      case 11:
        tempArr[11]++;
        break;
      case 12:
        tempArr[0]++;
    }
  }
  let mostFrequent = 0;
  for (let i=0; i<tempArr.length; i++){
    if (tempArr[i] > tempArr[mostFrequent]) {
      mostFrequent = i;
    }
  }
  return mostFrequent;
}

function getPitchInteger( latticePitchIndex ) {
  let val = latticePitchContents[latticePitchIndex];
  switch(Math.round(val*12)) {
    case 0:
      return 0;
      break;
    case 1:
      return 1;
      break;
    case 2:
      return 2;
      break;
    case 3:
      return 3;
      break;
    case 4:
      return 4;
      break;
    case 5:
      return 5;
      break;
    case 6:
      return 6;
      break;
    case 7:
      return 7;
      break;
    case 8:
      return 8;
      break;
    case 9:
      return 9;
      break;
    case 10:
      return 10;
      break;
    case 11:
      return 11;
      break;
    case 12:
      return 0;
  }
}

function setPitchGoal( val ) {
  let mostFreqInt = mostCommonPitchInteger();
  let pitchGoalInt = (mostFreqInt + val) % 12;

  let avgP = getAvgBoidPos();
  // I choose slightly less than the divisor here. It's the same if I increase by the divisor or a bit less,
  // maybe this helps with avoiding the boundary conditions in the extreme conditions.

  // start rad a distance away from adjacent blocks.
  for (let rad = divisor*3.9; i<= latticeSidelen; i=i+(divisor*.9)) {
    let lattIndArr = fibonacci_sphere( rad, 100, avgP.x, avgP.y, avgP.z );


    let viablePositions = findPitches( lattIndArr, pitchGoalInt );
    let result = largeEnoughDomain( viablePositions, pitchGoalInt );
    if (result != 0 ){
      thereIsAGoal = true;
      return result;
    }
  }
  console.log('1') // either no good results (positions to move towards), or some other problem.
}

function getAvgBoidPos() {
  let avgBoidPos = new THREE.Vector3();
  for (let i=0; i<count; i++) {
    avgBoidPos.add( getBoidPos( i ) );
  }
  avgBoidPos.multiplyScalar( 1/count );
  if (avgBoidPos.length == 0) {
    console.log('2') //something went wrong with getAvgBoidPos()
  }
  return avgBoidPos;
}

// The sphere made below is a unit sphere, rad acts as a multiplier to grow the sphere
function fibonacci_sphere( rad, samples, x0, y0, z0 ) {
  let points = new Array( samples );
  let phi = Math.PI * (3 - Math.pow( 5, 1/2 ) );

  for (let i=0; i<samples; i++) {
    let y = ((1 - (i / (samples - 1) ) * 2)*rad) + y0;
    let radius = Math.pow(1 - (y*y),1/2 );

    let theta = phi*i;

    let x = ((Math.cos(theta) *radius)*rad) + x0;
    let z = ((Math.sin(theta) *radius)*rad) + z0;

    // B.C.
    if (x < 0) {
      x = 0;
    } else if (x > slen) {
      x = slen;
    }
    if (y < 0) {
      y = 0;
    } else if (x > slen) {
      y = slen;
    }
    if (z < 0) {
      z = 0;
    } else if (x > slen) {
      z = slen;
    }
    points[i] = convertToLatticeInd( x, y, z );
  }
  return points;
}

function findPitches( p_indArr, pitchGoal ) {
  let gotcha = [];

  for (let i=0; i<p_indArr.length; i++) {
    if (((p_indArr[i] - (((pitchGoal*2)-1)/24)) > 0) && ((p_indArr[i] - (((pitchGoal*2)+1)/24)) < 0)) {
      gotcha.push(p_indArr[i]);
    }
  }
  return gotcha;
}

function largeEnoughDomain( gotcha, pitchGoalInt ) {
  let i = 0;
  while( i < gotcha.length) {
    let center = gotcha[i];
    let counter = 1;
    while (counter < 3) { //looking for a pitch domain of at least 3 blocks in size.
      //check +-z, then +-y, then +-x
      if ( getPitchInteger(latticePitchContents[center+1]) == pitchGoalInt ) { counter++; }
      if ( getPitchInteger(latticePitchContents[center-1]) == pitchGoalInt ) { counter++; }
      if ( getPitchInteger(latticePitchContents[center+40]) == pitchGoalInt ) { counter++; }
      if ( getPitchInteger(latticePitchContents[center-40]) == pitchGoalInt ) { counter++; }
      if ( getPitchInteger(latticePitchContents[center+1600]) == pitchGoalInt ) { counter++; }
      if ( getPitchInteger(latticePitchContents[center-1600]) == pitchGoalInt ) { counter++; }
      if (counter < 3) { counter = 100; }
    }

    if ((counter >=3) || (counter < 100)) {
      i = Number.MAX_SAFE_INTEGER; //exit out of while loop
      return center;
    }
    i++;
  }
  return 0; //the gotcha array did not have a domain big enough.
}

/* WEBPD */

// sends to pureData
function triggerReceive( boidIndex, posIndex ) {
  var val = latticePitchContents[posIndex];
  val = Math.pow(2,val) * 220;
  let receiver = 'num' + boidIndex.toString();
  // console.log(val);
  Pd.send( receiver , [parseFloat(val)] );
}

//goal is to minimize the #of times we send to webpd.
function positionCounter( boidIndex ) {
  let ind = getBoidPos( boidIndex );
  let latInd = convertToLatticeInd( ind.x, ind.y, ind.z );
  vc[latInd]++;
}

function cleanVolArray( vc ) {
  let totItNum = 0;
  vc.forEach( (itNum) => {
    totItNum += itNum;
  })
  vc.forEach( (itNum, latInd) => {
    if (itNum != 0){
      itArr.push( itNum/totItNum );
      indArr.push( latInd );
    }
  });
}

function send2PD() {
  for (let i=0; i<indArr.length; i++){
    let val = Math.round( latticePitchContents[indArr[i]] * 440 ); //this sends the pitch.
    let vol = itArr[i]; //this sends the volume multiplier.
    Pd.send( 'pitch', [ parseFloat(val)] );
    // Pd.send( 'volMult', [parseFloat(vol)] );
  }
}

let numOfosc = 0;
let maxOsc = 0;
function tconnect( indArr, msgArr, volArr, oscArr ) {
  // var triggerObject = patch.createObject('trigger', ['bang', 'float', 'float'])
  if (maxOsc == 0){
    maxOsc = indArr.length;

    // not done, make a lot of osc for the first execution of this function.

  } else if (numOfosc > indArr.length) { //there are more boids in diff positions than existing oscs.
    let make = indArr.length - numOfosc;
    for (let i=0; i<make; i++){
      oscArr.push( patch.createObject( 'msg', [parseFloat( sOOOOOOOO )]) );
      msgArr.push( patch.createObject( 'osc~' ) );
      msgArr[msgArr.length-1].o(0).connect( oscArr[oscArr.length-1].i(0) )
    }
    numOfosc = indArr.length;
  } else { //the boids are more clumped together, and we can reuse past osc~s.
    let dum = numOfosc;
    while (dum < indArr.length) {
      oscArr()
      dum++;
    }
  }
}
