import * as THREE from "https://threejs.org/build/three.module.js";
import { OrbitControls } from 'https://threejs.org/examples/jsm/controls/OrbitControls.js';
import Stats from 'https://threejs.org/examples/jsm/libs/stats.module.js'
import {BufferGeometryUtils} from 'https://threejs.org/examples/jsm/utils/BufferGeometryUtils.js'; 

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement);

var camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 500);
camera.position.set( 100, 50, 50 );
camera.lookAt( 0, 0, 0 );

const controls = new OrbitControls(camera, renderer.domElement);

const bgcolor = new THREE.Color( 0xC7D7C4 );
var scene = new THREE.Scene();
scene.background= new THREE.Color( bgcolor );

var parts = [];
//The code returns a Promise with the contents of the file at url
async function loadFile(url) {
  const req = await fetch(url);
  return req.text();
}

function parseData(text) {
  const data = [];
  const settings = {data};
  //split into lines
  text.split('\n').forEach((line) => {
    parts.push(line.trim().split(/\,+/));
    // let positions = parts.map(parseFloat);
    return parts;
  });
  // data.push(parts);
  // return Object.assign(settings, {})
  return parts;
};


// const option = 1;
// if (option == 1) {
//   handleData('./cosmicstrings.txt')
// } else if (option == 2) {
//   handleDataPlanes('./cosmicstrings.txt');
// }

var points = [];
var i;
var j;
async function handleData(file){
  const parts = await loadFile(file).then(parseData); //to fix later. Surely it's not efficient to have to load and wait everytime for the promise to finish.
  for (i = 0; i < parts.length; i++) {
    let positions = parts[i].map(parseFloat);
    addPoint( positions[0], positions[1], positions[2] );
  }
  var material = new THREE.LineBasicMaterial( { color: 0x0000ff } );
  var geometry = new THREE.BufferGeometry().setFromPoints( points );
  var line = new THREE.Line( geometry, material );
    line.name = 'cosmicstrings';
  scene.add( line );
}

handleData('./cosmicstrings.txt')

function addPoint( xpos, ypos, zpos ) {
  points.push( new THREE.Vector3( xpos, ypos, zpos ) );
  return points;
}


//INPUT FROM HTML PAGE
var pointer = new THREE.Vector3();
export function setPointer() {
  var xpos, ypos, zpos, text;

  xpos = document.getElementById("xset").value;
  ypos = document.getElementById("yset").value;
  zpos = document.getElementById("zset").value;

  //If x is Not a Number or less than zero or greater than 40.
  if (isNaN(xpos) || xpos < 0 || xpos > 40) {
    text = "Input not valid";
  } else {
    text = "";
  }
  if (isNaN(ypos) || ypos < 0 || ypos > 40) {
    text = "Input not valid";
  } else {
    text = "";
  }
  if (isNaN(zpos) || zpos < 0 || zpos > 40) {
    text = "Input not valid";
  } else {
    text = "";
  }
  document.getElementById("response").innerHTML = text;

  //THE VECTOR
  if (text != "Input not valid") {
    makePointer(xpos,ypos,zpos);
  }
}

function makePointer(x,y,z){
  pointer.set(x,y,z);

  if (typeof scene.getObjectByName("redDot") !== 'undefined'){
    removeEntity(scene.getObjectByName("redDot"));
  }

  var sphere = new THREE.Mesh(
    new THREE.SphereBufferGeometry(1,10,10),
    new THREE.MeshBasicMaterial({
      color:0xE53242,
      wireframe:false
    })
  );
  sphere.name = "redDot";
  sphere.position.set(pointer.x,pointer.y,pointer.z);
  scene.add(sphere);

}

export function startWalksignal() {
  var text;
  console.log('stwalk!')
  //if the pointer is on the scene.
  if (typeof scene.getObjectByName("redDot") !== 'undefined'){
    startWalk();

  } else {
    text = "Please place the pointer at the desired position.";
    document.getElementById("response").innerHTML = text;
  }


}

var i = 1;
function startWalk() {

  var xpos,ypos,zpos,text;
  console.log(points.length);
  for (i = 1; i < points.length; i++ ){

    if (points[i].x == 5){
      console.log(i);
      xpos = points[i].x;
      ypos = points[i].y;
      zpos = points[i].z;
      text = '(' + xpos.toString() +','+ ypos.toString() +','+ zpos.toString() + ')'
      document.getElementById("response").innerHTML = text;
      render();
      // setTimeout(function (){
      //   scene.getObjectByName("redDot").position.set(xpos,ypos,zpos);
      //   render();
      //
      // }, 3000);
    }
  }

  // scene.getObjectByName("cosmicstrings")
}
// sphere.position = pointer;
//Geometry that's using the Vector
// var geometry = new THREE.Geometry();
// geometry.vertices.push(
//   new THREE.Vector3(0, 0, 0), pointer);
//
// //using the geometry in a line
// var line = new THREE.Line(geometry, new THREE.LineBasicMaterial({
//   color: 0xE53242
// }));
  // scene.add(line);
function removeEntity(object) {
  var selectedObject = scene.getObjectByName(object.name);
  scene.remove( selectedObject );
  render();
}

renderer.render( scene, camera );

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
}, false);

// const stats = Stats();
// document.getElementById("fps").appendChild(stats.dom);
var animate = function () {

  //render the 3D scene
    render();
  //relaunch the 'timer'
    requestAnimationFrame(animate);

    controls.update();
 //update the stats
    // stats.update();


};

function render() {
    renderer.render(scene, camera);
}

animate();
