import {Lines} from './Lines.js';

// Grid settings
var canvasElement = document.querySelector("#grid");
canvasElement.width = window.innerWidth;
canvasElement.height = window.outerHeight;
var context = canvasElement.getContext("2d");

// Start of mouse triggered drawing
let coord = { x: 0, y: 0 };
document.addEventListener("mousedown", start);
document.addEventListener("mouseup", stop);
window.addEventListener("resize", resize);

function resize() {
  canvasElement.width = window.innerWidth;
  canvasElement.height = window.innerHeight;
}
resize();

function start(event) {
  document.addEventListener("mousemove", draw);
  reposition(event);
}
function reposition(event) {
  coord.x = event.clientX - canvasElement.offsetLeft;
  coord.y = event.clientY - canvasElement.offsetTop;
}
function stop() {
  document.removeEventListener("mousemove", draw);
}

function draw(event) {
  context.beginPath();
  context.lineWidth = 5;
  context.lineCap = "round";
  context.strokeStyle = "#ACD3ED";
  context.moveTo(coord.x, coord.y);
  reposition(event);
  context.lineTo(coord.x, coord.y);
  context.stroke();
}


// Lines

// Start of  horizontal lines
const hline = new Lines( window.innerWidth, 0);

var x0 = 0;
var y0 = 0;
const alt = 80;
while (Math.abs(y0) < window.outerHeight){

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
  // console.log(ldlineIt);
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
  // console.log(rdlineIt);
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
  // console.log(rdlineIt);
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
  // console.log(rdlineIt);
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
while (y < window.outerHeight) {

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

// end of labeling
