export class Lines{

  constructor(length, angle){
    this.length = length;
    this.angle = angle;
  }

  // we need to know the staring point.
  // this will output the other endpoint.
  otherEndpoint(x0, y0){

    var xcomp = x0 + (this.length * Math.cos(this.angle));
    var ycomp = y0 + (this.length * Math.sin(this.angle));
    var ept = [xcomp, ycomp];

    return ept;
  }
}
