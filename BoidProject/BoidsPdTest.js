import * as THREE from "https://threejs.org/build/three.module.js";
import { OrbitControls } from 'https://threejs.org/examples/jsm/controls/OrbitControls.js';

var latticePitchContents = new Array( 64000 );
var finishedLoading = false;
var ready = true;
var timer = 0;

var slen = 400;
var height = slen;
var width = slen;
var depth = slen;
var maxSpeed = 2.5;

let latticeSidelen = 40;
var divisor = slen / latticeSidelen;

var xMin = divisor;
var yMin = divisor;
var zMin = divisor;

var xMax = width;
var yMax = height;
var zMax = depth;

var boids = [];
var numBoids = 200;
var groupRadius = 100;
var scene = new THREE.Scene();

scene.background = new THREE.Color( 0x01374c );
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
var renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
camera.position.z = 400;
camera.position.x = 200;
camera.position.y = 200;

var Boid = function () {
  this.velocity     = new THREE.Vector3();
  this.acceleration = new THREE.Vector3();
  this.geometry     = new THREE.ConeGeometry(1, 4, 5.3);
  this.material     = new THREE.MeshBasicMaterial({ color: 0xffffff });
  this.mesh         = new THREE.Mesh(this.geometry, this.material);
};


function calculateCenter(boid, boids) {
  // calculate the perceived center position for a given
  // boid included in a group of boids
  var c = new THREE.Vector3();
  boids.forEach(function (currentBoid, index) {
    if (currentBoid !== boid) {
      c.add(currentBoid.mesh.position);
    }
  });
  c.divideScalar(boids.length - 1);
  return c;
}

function calculateCommonDir(boid, boids){
  var xcomp = 0;
  var ycomp = 0;
  var zcomp = 0;
  var numBoids = 0;
  boids.forEach(function (currentBoid, index) {
    if (currentBoid !== boid){
      xcomp += currentBoid.velocity.x;
      ycomp += currentBoid.velocity.y;
      zcomp += currentBoid.velocity.z;
      numBoids++;
    }
  });

  xcomp = xcomp / numBoids;
  ycomp = ycomp / numBoids;
  zcomp = zcomp / numBoids;
  var dir = new THREE.Vector3( xcomp, ycomp, zcomp );
  dir.normalize();
  return dir;
}

function dontCollide(boid, boids) {
  var c = new THREE.Vector3();
  var d = new THREE.Vector3();
  boids.forEach(function (currentBoid, index) {
    if (currentBoid !== boid) {
      if (currentBoid.mesh.position.distanceTo(boid.mesh.position) < 10) {
        d.subVectors(currentBoid.mesh.position, boid.mesh.position);
        c.sub(d);
      }
    }
  });
  return c;
}

function matchVelocity(boid, boids) {
  var pv = new THREE.Vector3();
  boids.forEach(function (currentBoid, index) {
    if (currentBoid !== boid) {
      pv = pv.add(currentBoid.velocity);
    }
  });
  pv.divideScalar(boids.length - 1);
  pv.sub(boid.velocity);
  pv.divideScalar(8);
  return pv;
}

function limitVelocity(b) {
  var v = new THREE.Vector3()
  if (Math.abs(b.velocity.x) > maxSpeed) {
    b.velocity.x = (b.velocity.x / Math.abs(b.velocity.x)) * maxSpeed;
  }
  if (Math.abs(b.velocity.y) > maxSpeed) {
    b.velocity.y = (b.velocity.y / Math.abs(b.velocity.y)) * maxSpeed;
  }
  if (Math.abs(b.velocity.z) > maxSpeed) {
    b.velocity.z = (b.velocity.z / Math.abs(b.velocity.z)) * maxSpeed;
  }
}


function boundPositions(b) {
  var v = new THREE.Vector3();

  if (b.mesh.position.x < xMin + 50) {
    v.x = 10;
  } else if (b.mesh.position.x > xMax - 50) {
    v.x = -10;
  }

  if (b.mesh.position.y < yMin + 50) {
    v.y = 10;
  } else if (b.mesh.position.y > yMax - 50) {
    v.y = -10;
  }

  if (b.mesh.position.z < zMin + 50) {
    v.z = 10;
  } else if (b.mesh.position.z > zMax - 50) {
    v.z = -10;
  }
  return v;
}

function flyTogether(boid, boids) {
  var commonDir = calculateCommonDir(boid, boids);
  return commonDir;
}

function flyTowardsCentre(boid, boids) {
  var boidCenter = calculateCenter(boid, boids);
  boidCenter = boidCenter.sub(boid.mesh.position);
  boidCenter = boidCenter.divideScalar(200); // move 0.5% distance to center
  return boidCenter;
}

function drawBoid() {
  var boid = new Boid();
  boid.mesh.position.x = Math.floor(Math.random() * width);
  boid.mesh.position.y = Math.floor(Math.random() * height);
  boid.mesh.position.z = Math.floor(Math.random() * depth);
  // rotate geometry so cone points in .lookAt() direction
  boid.geometry.applyMatrix4( new THREE.Matrix4().makeRotationX( Math.PI / 2 ) );

  scene.add(boid.mesh);
  boids.push(boid);
}

function drawBoids() {
  for (var i = 0; i < numBoids; i++) {
    drawBoid();
  }
}

function getBoidsWithinRadius(boid, allBoids, radius) {
  var boidsWithinRadius = [];
  allBoids.forEach(function (currentBoid, index) {
      var distance = boid.mesh.position.distanceTo(currentBoid.mesh.position);
      if (distance <= radius) {
        boidsWithinRadius.push(currentBoid)
      }
  });
  return boidsWithinRadius;
}

function move() {
  boids.forEach(function (boid, index) {

    var boidsInGroup = getBoidsWithinRadius(boid, boids, groupRadius)

    var v1 = flyTogether(boid, boidsInGroup); // alignment
    var v2 = dontCollide(boid, boidsInGroup); // separation
    var v3 = flyTowardsCentre(boid, boidsInGroup); // cohesion

    var v4 = boundPositions(boid);
    boid.velocity.add(v1);
    boid.velocity.add(v2);
    boid.velocity.add(v3);
    boid.velocity.add(v4.divideScalar(0.001));

    // only limit velocity when boid is within boundPositions()'s bounded space,
    // don't want to limit boid velocity when it is offscreen
    var t = new THREE.Vector3();
    if (v4 != t){
      limitVelocity(boid)
    }

    var pos = new THREE.Vector3()
    pos.addVectors(boid.velocity, boid.mesh.position)  // calculate next position
    boid.mesh.lookAt(pos)  // "look" (point cone tip) in direction the bird is flying
    boid.mesh.position.add(boid.velocity);  // move boid
  });
}

function sound( res ) {
  boids.forEach((boid) => {

    if (!(isNaN(boid.mesh.position.x))){
      var arrInd = convertToLatticeInd(boid.mesh.position.x, boid.mesh.position.y, boid.mesh.position.z)
      triggerReceive( arrInd );
      }

    });
  ready = true;
}

//   // if ( res == 1 ) {

//     ready = true;
//   })
// }

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  move();

  timer++;
  var res = timer % 120;
  if (finishedLoading && ready && (res == 1)){
    ready = false;
    sound();
  }
}

drawBoids();
animate();



// ==========================================================

/* PureData helper functions */

/* opt: 1 = x, 2 = y, or 3 = z */
/* pos is how far along that axis*/
function convertToLatticeInd( xpos, ypos, zpos) {
  var xpos = Math.round(xpos / divisor);
  var ypos = Math.round(ypos / divisor);
  var zpos = Math.round(zpos / divisor);

  var ind = (1600*(xpos - 1)) + (40*(ypos-1)) + zpos;
  return ind;
}

function triggerReceive( index ) {
  var val = Math.round(latticePitchContents[index] * 440);
    Pd.send('somenumber', val);
}


// ==========================================================

/* Load pitch cube values : J-Query*/
$('#file-input').change(function() {
  let file = document.getElementById('file-input').files[0];
  if (file) {
    var reader = new FileReader();
    reader.readAsText( file );
    reader.onload = function(e) {
      let text = e.target.result;
      let lines = text.split(/[\r\n]+/g);
      let i = 0;
      lines.forEach(function(line) {
        latticePitchContents[i] = line;
        i++;
      })
    }
  }
  finishedLoading = true;
});
