import * as THREE from "https://threejs.org/build/three.module.js";
import { OrbitControls } from 'https://threejs.org/examples/jsm/controls/OrbitControls.js';

var container = document.getElementById( 'container' );
var renderer = new THREE.WebGLRenderer({ antialias: true } ); // antialias is a setting used in many PCZ video games that help smooth out jagged graphcis.
renderer.setSize( window.innerWidth, window.innerHeight ); //setting the size of the renderer to be the full window size.
container.appendChild( renderer.domElement );
renderer.domElement.style.cursor = 'pointer'; //style of our cursor to pointer.

// scene
var scene = new THREE.Scene();
scene.background = new THREE.Color( 0x01374c );
scene.fog = new THREE.Fog( scene.background, 10, 20 ); //makes an object look denser depending on its distance

// camera
var camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, .1, 100000 );
camera.position.set( 0, -6, 3 );

// controls
var controls = new OrbitControls( camera, renderer.domElement );
renderer.render( scene, camera );

var Boids = function( options ) {

  var color = this.color = options.color || 0x333333;
  var size = this.size = options.size || 0.4;

  var pointCount = this.pointCount = options.pointCount || 40;
  var rangeV = this.rangeV = options.rangeV || 2;
  var rangeH = this.rangeH = options.rangeH || 1;

  var speed = this.speed = this.speedTarget = options.speed || 0.0005;


  THREE.Group.call( this );

  // circle texture

  var canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  var ctx = canvas.getContext( '2d' );

  var centerX = canvas.width / 2;
  var centerY = canvas.height / 2;
  var radius = canvas.width / 3;
  ctx.beginPath();
  ctx.arc( centerX, centerY, radius, 0, 2 *Math.PI, false ); // creates a circular arc.
  ctx.fillStyle = '#fff'; // makes the particles white.
  ctx.fill();

  var texture = new THREE.Texture( canvas );
  texture.premultiplyAlpha = true;
  texture.needsUpdate = true;

  var pointsGeo = new THREE.Geometry();
  var pointsMat = new THREE.PointsMaterial({
    color: color,
    size: size,
    map: texture,
    transparent: true,
    depthWrite: false
  })

  for (var p = 0; p < pointCount; p ++) {
    //so the points move randomly
    var point = new THREE.Vector3(
      THREE.Math.randFloatSpread( rangeH ),
      THREE.Math.randFloatSpread( rangeV ),
      THREE.Math.randFloatSpread( rangeH )
    );
    point.velocity = new THREE.Vector3(
      THREE.Math.randFloatSpread(this.speed),
      THREE.Math.randFloatSpread(this.speed),
      THREE.Math.randFloatSpread(this.speed) )
    point.acceleration = new THREE.Vector3(
        THREE.Math.randFloatSpread(this.speed / 100),
        THREE.Math.randFloatSpread(this.speed / 100),
        THREE.Math.randFloatSpread(this.speed / 100) )

    pointsGeo.vertices.push( point );
  }

  var points = this.points = new THREE.Points( pointsGeo, pointsMat );

  this.add( points );




// console.log(this.velocity);
}

Boids.prototype = Object.create( THREE.Group.prototype );
Boids.prototype.updateConstant = function(){
  var pCount = this.pointCount;
    // var point = this.points.geometry.vertices[i];
    //
    // point.x += this.velocity.x;
    // point.y += this.velocity.y;
    // point.z += this.velocity.z;
    //
    // this.velocity += this.acceleration;

  while ( pCount-- ) {
    var point = this.points.geometry.vertices[pCount];


    // check if we need to rest
    if ( point.y < - this.rangeV / 2 ) {
      point.y = this.rangeV / 2;
    }
    point.y -= point.velocity.y;
    point.x -= point.velocity.x;
    point.z -= point.velocity.z;

    point.velocity.y += point.acceleration.y;
    point.velocity.x += point.acceleration.x;
    point.velocity.z += point.acceleration.z;
  }

  this.points.geometry.verticesNeedUpdate = true;

}

var stars = new Boids({
  color: 0xffffff,
  size: 0.6,
  rangeH: 20,
  rangeV: 20,
  pointCount: 400,
  size: 0.2,
  speed: 0.1
});
scene.add( stars );

var cameraTarget = new THREE.Vector3();
cameraTarget.copy( camera.position );

var mouse = new THREE.Vector2();

function mousemove(e){
  mouse.x = ( e.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1;

  cameraTarget.x = - mouse.x * 1;
  cameraTarget.z = 3 + mouse.y * 1;
}

//these functions will change the speed of our star particles if we move the mouse up or down.
function mousedown(e){
  stars.speedTarget = 0.3;
  randerer.domElement.style.cursor = 'none';
}
function mouseup(e){
  stars.speedTarget = 0.1;
  renderer.domElement.style.cursor = 'pointer';
}

renderer.domElement.addEventListener('mousemove', mousemove, false);
renderer.domElement.addEventListener('mousedown', mousedown, false);
renderer.domElement.addEventListener('mouseup', mouseup, false);

loop();

function loop() {
  requestAnimationFrame( loop );
  controls.update();
  stars.updateConstant();

  lerp(camera.position, 'x', cameraTarget.x);
  lerp(camera.position, 'z', cameraTarget.z);

  lerp(stars, 'speed', stars.speedTarget);

  renderer.render( scene, camera );
}

// interpolate between a starting and ending point.
function lerp( object, prop, destination ) {
  if (object && object[prop] !== destination) {
    object[prop] += (destination - object[prop]) * 0.1;

    if (Math.abs(destination - object[prop]) < 0.01) {
      object[prop] = destination;
    }
  }
}
