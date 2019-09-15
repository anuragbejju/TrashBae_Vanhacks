/*
On init
 On screen rotation
 Update the ball's initial position
*/

// wait until DOM is ready
var myjson;
$.getJSON("https://anuragbejju.github.io/thrashbae_vanhacks/game/svg_file.json", function(json){
myjson = json;
});

var jQuery_1_12_4 = jQuery.noConflict(true);

document.addEventListener("DOMContentLoaded", function(event) {

 // wait until window, stylesheets, images, links, and other media assets are loaded
 window.onload = function() {

  // All ready, let's go!


  /* ***************************
  Things we are going to need
  **************************** */

  // A Vector
  var Vector = {
   _x: 1,
   _y: 0,

   create: function(x, y) {


   var obj = Object.create(this);
   obj.setX(x);
   obj.setY(y);
   return obj;
   },

   setX: function(value) {
   this._x = value;
   },

   getX: function() {
   return this._x
   },

   setY: function(value) {
   this._y = value;
   },

   getY: function() {
   return this._y;
   },

   setAngle: function(angle) {
   var length = this.getLength();
   this._x = Math.cos(angle) * length;
   this._y = Math.sin(angle) * length;
   },

   getAngle: function() {
   return Math.atan2(this._y, this._x);
   },

   setLength: function(length) {
   var angle = this.getAngle();
   this._x = Math.cos(angle) * length;
   this._y = Math.sin(angle) * length;
   },

   getLength: function() {
   return Math.sqrt(this._x * this._x + this._y * this._y);
   },

   add: function(v2) {
   return Vector.create(this._x + v2.getX(), this._y + v2.getY());
   },

   subtract: function(v2) {
   return Vector.create(this._x - v2.getX(), this._y - v2.getY());
   },

   scale: function(value) {
   return Vector.create(this._x * value, this._x * value);
   }
  };



  // A Particle
  var Particle = {
   position: null,
   velocity: null,
   gravity: null,

   create: function(x, y, speed, direction, grav) {



   var obj = Object.create(this);
   obj.position = Vector.create(x, y);
   obj.velocity = Vector.create(0, 0);
   obj.velocity.setLength(speed);
   obj.velocity.setAngle(direction);
   obj.gravity = Vector.create(0, grav || 0);

   return obj;
   },

   accelerate: function(vector) {
   this.velocity = this.velocity.add(vector);
   },

   update: function() {
   this.velocity = this.velocity.add(this.gravity);
   this.position = this.position.add(this.velocity);
   }
  };



  // Ball and basket vars
  var ball = document.getElementById("ball"),
      offsetY,
      ballRadius,
      basket = document.getElementById("basket"),
      basketWidth,
      ratio,
      scale,
      w,
      h;


  // Motion vars
  var p,
      start,
      force,
      timestamp = null,
      lastMouse,
      hasThrown = false,
      highEnough = false,
      lastY,
      rot;

  // Score vars
  var shots = 0,
      hits = 0,
      score = 0,
      accuracy = 0,
      inside_bin = 0;



  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", resize);


  resize();


  // Wait a second before fading the elements in to prevent a flash of unpositioned/unstyled content
  TweenMax.to(".stage", 1, {autoAlpha:1, delay:1});

  function addEvents() {

   ball.addEventListener("mousedown", grabBall);
   ball.addEventListener("touchstart", grabBall);
   ball.addEventListener("mouseup", releaseBall);
   ball.addEventListener("touchend", releaseBall);

  }

  function removeEvents() {

   ball.removeEventListener("mousedown", grabBall);
   ball.removeEventListener("touchstart", grabBall);
   ball.removeEventListener("mouseup", releaseBall);
   ball.removeEventListener("touchend", releaseBall);

  }

  function resize() {

   // For some reason, we need to re-add the touch events every time the orientation change, if we don't the touchmove fails after the touchstart. Bizzarre.
   removeEvents();

   addEvents();


   offsetY = ball.getBoundingClientRect().height*1.5;

   // Find the smallest value of the SVG holding the basketball - it will give us the ball's radius
   ballRadius = Math.min(ball.getBoundingClientRect().width, ball.getBoundingClientRect().height);

   basketWidth = Math.round(basket.querySelector("rect").getBoundingClientRect().width);

   // Work out how the ratio between the basket's width and the ball's radius, make it a tiny smaller just for safety
   ratio = basketWidth / ballRadius - 0.1;

   w = window.innerWidth;
   h = window.innerHeight;

   // Make sure the basketall has no previous GSAP's transforms on it
   TweenMax.set(ball, {clearProps:"all"});

   // Move the basketball to its starting offset
  TweenMax.set(ball, {y:"+="+offsetY}); // We need a number rather than a percentage to use later with collision calculation.

   scale = TweenMax.to(ball, 0.5, {scale:ratio, ease:Power1.easeInOut}).progress(1).pause(0);

  }


  function tick() {

   var currY = p.position.getY();
   var currX = p.position.getX();

   if(hasThrown) {

    if(currY < 0) highEnough = true;

      // Has the ball been thrown high enough
      if(highEnough) {

        // Is it falling?
       if(lastY < currY && force.getLength() > 15) {
         basket.style.zIndex = 1;

         // Has it hit the basket
         if(currY < 10 && currY > -10) {
           hasThrown = false;
           ball.style.display = "none";

           // Was it on target?
           if(currX > basketWidth*0.1 && currX < basketWidth || currX < -basketWidth*0.1 && currX > -basketWidth) {

             // Create an oposite force angled in relation to the basket
             force.setX(currX/10);
             force.setLength(force.getLength()*0.7);
             p.velocity = force;

             basket.style.zIndex = 0;

            } else if(currX <= basketWidth && currX >= -basketWidth) {
              // Yes

              hits += 1;

              inside_bin = 1;
              if (myjson[shots-1]["result"] == 0){
                score -= 1;
                  sendFailure();
                  $("#bad")[0].play();

              }
              else{
                score += 1;
                  sendSuccess();
                  $("#good")[0].play();
              }


             TweenMax.to("#net", 1, {scaleY:1.1, transformOrigin:"50% 0", ease:Elastic.easeOut});
             TweenMax.to("#net", 0.3, {scale:1, transformOrigin:"50% 0", ease:Power2.easeInOut, delay:0.6});
            }

          }
        }
      }
   }

   p.update();
   TweenMax.set(ball, {
    x:p.position.getX(),
    y:currY,
    rotation:rot
   });


   lastY = currY;

  };

  function grabBall(e) {


   e.preventDefault();

   p = Particle.create(0, offsetY, 0, 0, 0);
   force = Vector.create(0,0);
   start = Vector.create(getMouse(e).x, getMouse(e).y-offsetY);

   document.addEventListener("mousemove", moveBall);
   document.addEventListener("touchmove", moveBall);
  };

  function moveBall(e) {

   e.preventDefault();

   getSpeed(e);

   //  Update the ball's position
   TweenMax.set(ball, {x:p.position.getX(), y:p.position.getY()});

  };

  function releaseBall() {

   // Stop tracking the mousedown/touchdown
   ball.removeEventListener("mousedown", grabBall);
   ball.removeEventListener("touchstart", grabBall);
   // Stop tracking the mousemove
   document.removeEventListener("mousemove", moveBall);
   document.removeEventListener("touchmove", moveBall);
   // Reset the mouse tracking defaults
   timestamp = null;
   lastMouseX = null;
   lastMouseY = null;

   hasThrown = true;

   shots += 1;


   scale.play(0)

   // Limit how hard the ball can be thrown. Improves user accuracy diminishes realistic movement
   if(force.getLength() > 30) force.setLength(30);
   p.velocity = force;
   p.gravity = Vector.create(0,0.8);

   if(force.getX() > 0) {
    rot = "-=4";
   } else {
    rot = "+=4";
   }

   //  Start GSAP's tick so more physics-like movement can take place
   TweenMax.ticker.addEventListener("tick", tick);

   // Stop it after some period of time - saves having to write edges and floor logic and the user can shoot every three seconds or so
   TweenMax.delayedCall(1.5, reset);

  };


  function reset() {

   TweenMax.ticker.removeEventListener("tick", tick);

   p.gravity = 0;

   hasThrown = false;
   highEnough = false;

   basket.style.zIndex = 0;

   ball.addEventListener("mousedown", grabBall);
   ball.addEventListener("touchstart", grabBall);

   updateScore();
   ball.style.display = "";


   TweenMax.to(ball, 1, {
    x:0,
    y:offsetY,
    scale:1,
    rotation:0,
    ease:Power3.easeOut
   });

  };


  function getMouse(e) {

   return {
    x:e.clientX || e.targetTouches[0].clientX,
    y:e.clientY || e.targetTouches[0].clientY
   };

  };


  function getSpeed(e) {

   e.preventDefault();

   if(timestamp === null) {
    timestamp = Date.now();
    lastMouse = getMouse(e);
    return;
   };

   var now = Date.now(),
   currMouse = getMouse(e),
   dx = currMouse.x - lastMouse.x,
   dy = currMouse.y - lastMouse.y;

   // Let's make the angle less steep
   dy *= 8;
   dx /= 8;

   timestamp = now;
   lastMouse = currMouse;

   force = Vector.create(dx, dy);
   p.position.setX(getMouse(e).x - start.getX());
   p.position.setY(getMouse(e).y - start.getY());

  };

  function updateScore() {
    d3.select("#ball").html(myjson[shots%10][1]).attr("viewBox", myjson[shots%10]["viewBox"]);

   accuracy = hits / shots;
   if (inside_bin == 0){
     if(myjson[shots-1]["result"] == 1){
       score -= 1;
        sendFailure();
        $("#bad")[0].play();
     }
     else if(myjson[shots-1]["result"] == 0){
       score += 1;
        sendSuccess();
        $("#good")[0].play();
     }
   }

   inside_bin = 0;
   if (shots == 10){

    var contents_finish = `<div class="finish-message"><p><Strong>Score:`+score.toString()+`</Strong><br/><b>Good Job! Learn more about recycling at: </b>
          <br/>  <a href="https://recyclebc.ca/what-can-i-recycle/">More information!</a>
    <br/></p><button onclick="location.reload()" class="finish-button">Play Again</button></div>`;
    setTimeout(
      jQuery_1_12_4("#finishdialog").html(contents_finish).dialog("open"), 2500)
   }
   document.getElementById("shots").innerHTML = "Shots: " + shots;
   document.getElementById("hits").innerHTML = "Score: " + score;
  }
 };
});

function sendSuccess() {
  $(".notify").toggleClass("active");
  $("#notifyType").toggleClass("success");
  $("#notifyType").parent().css("background","#0a6e24");

  setTimeout(function(){
    $(".notify").removeClass("active");
    $("#notifyType").removeClass("success");
  },2000);
}

function sendFailure() {
  $(".notify").addClass("active");
  $("#notifyType").addClass("failure");
  $("#notifyType").parent().css("background","#d42c2c");


  setTimeout(function(){
    $(".notify").removeClass("active");
    $("#notifyType").removeClass("failure");
  },2000);
}



jQuery_1_12_4(function() {
  // this initializes the dialog (and uses some common options that I do)
  jQuery_1_12_4("#dialog").dialog({autoOpen : false, modal : true, show : "blind", hide : "blind"});
  // next add the onclick handler
  jQuery_1_12_4("#instruction-title").click(function(){
    jQuery_1_12_4("#dialog").dialog("open");
    return false;
  });
});

jQuery_1_12_4(function() {
  jQuery_1_12_4("#finishdialog").dialog({autoOpen : false, modal : true, show : "blind", hide : "blind"});
});
