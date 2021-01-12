import {Lines} from './Lines.js';

// Grid settings
var canvasElement = document.querySelector("#grid");
canvasElement.width = window.innerWidth;
canvasElement.height = 0.8*window.innerHeight;

var context = canvasElement.getContext("2d");

let pathsave = [];
let points = [];
let mouse = { x: 0, y: 0 };

let colorsave = [];
let tcolor = "string";
let colorNum = 2;

// Start of mouse triggered drawing
canvasElement.addEventListener("mousedown", start);
canvasElement.addEventListener("mouseup", stop);
document.onkeydown = KeyPress;

window.addEventListener("resize", resize);

function resize() {
  canvasElement.width = window.innerWidth;
  canvasElement.height = window.innerHeight;
  drawPaths();
}
resize();

function start(event) {
  points = [];
  changeColor( colorNum, 1 );
  context.lineWidth = 4;
  context.lineCap = "round";
  context.strokeStyle = tcolor;
  canvasElement.addEventListener("mousemove", draw);
  reposition(event);
}
function reposition(event) {
  mouse.x = event.clientX - canvasElement.offsetLeft;
  mouse.y = event.clientY - canvasElement.offsetTop;
  points.push({x:mouse.x,y:mouse.y})
}
function stop() {
  canvasElement.removeEventListener("mousemove", draw);
  pathsave.push(points);
}

function draw(event) {
  context.beginPath();
  context.moveTo(mouse.x, mouse.y);
  reposition(event);
  context.lineTo(mouse.x, mouse.y);
  context.stroke();
}


// UNDO

function KeyPress(e) {
  var evtobj = window.event? event : e
  if (evtobj.keyCode == 90 && evtobj.ctrlKey) {
    Undo();
  };
}

function drawPaths(){
  // delete everything
  context.clearRect(0,0,canvasElement.width,canvasElement.height);
  tonnetz(); //redraw tonnetz
  // draw all the paths in the paths array
  let k = 0;
  pathsave.forEach(path=>{
  changeColor( colorsave[k], 2 );
  context.lineWidth = 4;
  context.lineCap = "round";
  context.strokeStyle = tcolor;

  context.beginPath();
  context.moveTo(path[0].x,path[0].y);
  for(let i = 1; i < path.length; i++){
    context.lineTo(path[i].x,path[i].y);
  }
    context.stroke();
    k++;
  })
}

function Undo(){
  // remove the last path from the paths array
  pathsave.splice(pathsave.length-1,1);
  colorsave.splice(colorsave.length-1,1);

  // draw all the paths in the paths array
  drawPaths();
}

// TONNETZ

// Start of  horizontal lines
function tonnetz() {
  context.lineWidth = 1;
  context.lineCap = "round";
  context.strokeStyle = "#000000";

  const hline = new Lines( window.innerWidth, 0);

  var x0 = 0;
  var y0 = 0;
  const alt = 80;
  while (Math.abs(y0) < window.innerHeight){

    var hlineIt = hline.otherEndpoint(x0, y0);
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(hlineIt[0], hlineIt[1]);
    context.closePath();
    context.stroke();

    y0 = y0 + alt;
  }

  // left diagonal lines.
  const ldline = new Lines( window.innerWidth, Math.PI/3);

  var x0 = 0;
  var y0 = 0;
  // const alt = 80;
  var it = 0;
  while (Math.abs(x0) < window.innerWidth){

    var ldlineIt = ldline.otherEndpoint(x0, y0);
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(ldlineIt[0], ldlineIt[1]);
    context.closePath();
    context.stroke();

    x0 = (x0 + (alt/Math.pow(3,0.5))*2);
  }

  // right diagonal lines.
  const rdline = new Lines( window.innerWidth, 2*Math.PI/3);

  var x0 = 0;
  var y0 = 0;
  // const alt = 80;
  while (Math.abs(x0) < window.innerWidth){

    var rdlineIt = rdline.otherEndpoint(x0, y0);
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(rdlineIt[0], rdlineIt[1]);
    context.closePath();
    context.stroke();

    x0 = x0 + (alt/Math.pow(3,0.5))*2;
  }

  // get the mssing rdlines
  x0 = 0;
  while (x0 > -800){

    var ldlineIt = ldline.otherEndpoint(x0, y0);
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(ldlineIt[0], ldlineIt[1]);
    context.closePath();
    context.stroke();

    x0 = x0 - (alt/Math.pow(3,0.5))*2;
  }

  x0 = 0;
  while (x0 < 2000){

    var rdlineIt = rdline.otherEndpoint(x0, y0);
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(rdlineIt[0], rdlineIt[1]);
    context.closePath();
    context.stroke();

    x0 = x0 + (alt/Math.pow(3,0.5))*2;
  }

  // End of lines

  // Start Labeling. THINK ABOUT PUTTING AN ID AT EVERY LABEL, SO THEN I CAN CSS CIRCLES.
  var ind = 0;
  var x = 0;
  var y = 0;
  var fifths = 0;
  var reference = 0;
  while (y < window.innerHeight) {

    //right diagonals are minor thirds, left diagonals are major thirds. im confused, but now the grid is right.
    // up one left (+4), up one right(-3).
    fifths = (reference + 4 - 3) % 11;
    reference = fifths;

    while (x <= window.innerWidth) {
      var text = fifths.toString();
      context.font = '18px Georgia';
      context.fillStyle = '0,0,0';
      context.fillText(text, x, y);

      //minor thirds.
      var m3 = (fifths + 4) % 12;
      context.fillText(m3.toString(), (x + (alt/Math.pow(3,0.5))), y + alt)


      x = x + ((alt/Math.pow(3,0.5))*2);
      fifths = (fifths + 7) % 12;

    }
  x = 0;
  y = y + alt*2;
  }
}
tonnetz();

// extra helper functions
disableScroll();

function disableScroll() {
  // Get the current page scroll position
  var scrollTop =  window.pageYOffset || document.documentElement.scrollTop;
  var scrollLeft =  window.pageXOffset || document.documentElement.scrollLeft;
  // if any scroll is attempted,
  // set this to the previous value
  window.onscroll = function() {
    window.scrollTo(scrollLeft, scrollTop);
  };
  document.body.style.overflow = 'hidden';
}

function changeColor( ind , opt) {
  switch( ind ) {
    case 1:
      tcolor = "#990000";
      break;
    case 2:
      tcolor = "#91A8D0";
      break;
    case 3:
      tcolor = "#283618";
      break;
    case 4:
      tcolor = "#2c1b2d";
      break;
    case 5:
      tcolor = "#595959";
      break;
    default:
      console.log('this should not have happened - color err')
  }

  // opt 1: for draw function, 2: for undo
  if (opt == 1) {
    colorsave.push( ind );
  }
}

//this is shoddy, why do I have a function just to change the number? Does the onclick need to be a function?
function changeColorInd( num ) {
  colorNum = num;
}

document.getElementById("red").onclick =    function(){ changeColorInd( 1 ) };
document.getElementById("blue").onclick =   function(){ changeColorInd( 2 ) };
document.getElementById("green").onclick =  function(){ changeColorInd( 3 ) };
document.getElementById("purple").onclick = function(){ changeColorInd( 4 ) };
document.getElementById("grey").onclick =   function(){ changeColorInd( 5 ) };


// end of labeling
