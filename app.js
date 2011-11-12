/* GLOBAL */
(function(global){
    global.HOPPING = global.HOPPING || {};

    global.HOPPING = {
        version: "0.1",
        boxScrollPerFrame: -1,
        initialBoxes: [
            {pos:{x:195,y:400},size:{x:30,y:10}},
            {pos:{x:30,y:500},size:{x:100,y:50}},
            {pos:{x:50,y:600},size:{x:100,y:10}}
        ]
    };
    
    global.HOPPING.namespace = function(str){
        var arr = str.split('.');
        var space = global;
        for (var i=0,l = arr.length; i < l ; i++){
            space[arr[i]] = space[arr[i]] || {};
            space = space[arr[i]];
        }
        return space;
    };

    HOPPING.Se = (function(){
        return function(filename){
            /* properties and methods */
            var audio;
            try {
                audio = new Audio("");
                audio.autoplay=false;
                var canPlayMp3 = ("" != audio.canPlayType("audio/mpeg"));
                var canPlayWav = ("" != audio.canPlayType("audio/wave"));
                var canPlayOgg = ("" != audio.canPlayType("audio/ogg"));
                if (canPlayMp3){
                    audio = new Audio(filename+".mp3");
                    audio.load();
                }
                else if (canPlayOgg){
                    audio = new Audio(filename+".ogg");
                    audio.load();
                }
                else if (canPlayWav){
                    audio = new Audio(filename+".wav");
                    audio.load();
                }
                else {
                    audio = false;
                }
            } catch (e) {
                audio = false;
            }
            var play;
            if (audio) {
                play = function(){
                    try{
                        audio.currentTime = 0;
                    }
                    catch(x){
                        //do nothing;
                    }
                    audio.play();
                    return true;
                };
            }
            else {
                play = function(){
                     return false;
                };
            }
            this.play = play;
            this.audio = audio;
        };
    }());
    HOPPING.se = {
        pi:new HOPPING.Se("./pi"),
        end:new HOPPING.Se("./end")
    };
}(this));

/* UTIL */
(function(global){
    var utils = HOPPING.namespace("HOPPING.utils");

    utils.addHandler = (function(){
        function strToDomElement(elm){
            if (typeof elm === "string") {
                elm = document.getElementById(elm);
            }
            if(!elm) {
                throw {
                    name: "SetHandlerError",
                    message: "No such Element"
                };
            }
            return elm;
        };
    
        if( typeof window.addEventListener === 'function') {
            // for W3C
            return function(elm,type,func){
                elm = strToDomElement(elm);
                elm.addEventListener(type, func, false);
            };
        } else if (typeof window.attachEvent === 'function') {
            //for IE
            return function(elm,type,func){
                elm = strToDomElement(elm);
                elm.attachEvent('on'+type, func);
            };
        } else {
            return function(elm,type,func){
                elm = strToDomElement(elm);
                elm['on' + type] = func;
            };
        }

    }());
}(this));

/* MODELS */
(function(global){

    var model = global.HOPPING.namespace("HOPPING.Model");

    model.screen = {
        size:{
            x:400,
            y:600
        }
    };
    
    model.Player = (function(){

        // CONSTANT VALUE
        var DEFAULT_POS = {
            x: 200,
            y: 0
        };
        var DEFAULT_SIZE = {
            x: 10,
            y: 10
        };

        var Constructor = function (pos,size){
            // force constructor */
            if (! (this instanceof HOPPING.Model.Player) ){
                return new HOPPING.Model.Player(pos,size);
            }

            // properties and method*/
            pos = pos || {};
            size = pos || {};

            pos = {
                x: pos.x || DEFAULT_POS.x,
                y: pos.y || DEFAULT_POS.y
            };
            size = {
                x: size.x || DEFAULT_SIZE.x,
                y: size.y || DEFAULT_SIZE.y
            };
            
            var motion = {
                x:0,
                y:0
            };
            var collision = {
                left:false,
                right:false,
                top:false,
                bottom:false
            };
            var score = 0;
            
            var moveRight = function(quantity){
                motion.x += quantity;
            };

            var moveLeft = function(quantity){
                motion.x -= quantity;
            };

            var moveDown = function(){
                motion.y += 0.05;
            };
            var setMotionY = function(set){
                motion.y = -set;
            };
            var getPos = function(){
                return {x:parseInt(pos.x),y:parseInt(pos.y)};
            };
            var getSize = function(){
                return {x:size.x,y:size.y};
            };

            var move = function(){
                if (collision.left && motion.x < 0) {
                    motion.x = 0;
                }
                if (collision.right && motion.x > 0) {
                    motion.x = 0;
                }
                if (collision.bottom) {
                    motion.y = -4;
                }
                if (collision.top && motion.y < 0) {
                    motion.y = 0;
                }
                if (collision.top || collision.bottom) {
                    HOPPING.se.pi.play();
                }
                pos.x += motion.x;
                pos.y += motion.y;
                collision = {
                    left:false,
                    right:false,
                    top:false,
                    bottom:false
                };
            };

            var collisionLeftWith = function(box){
                collision.left = true;
            };
            var collisionRightWith = function(box){
                collision.right = true;
            };
            var collisionTopWith = function(box){
                score += box.getScore();
                collision.top = true;
            };
            var collisionBottomWith = function(box){
                var boxPos = box.getPos();
                pos.y = boxPos.y - size.y;
                score += box.getScore();
                collision.bottom = true;
            };
            var getScore = function(){
                return score;
            };
            
            this.moveRight  = moveRight;
            this.moveLeft   = moveLeft;
            this.moveDown   = moveDown;
            this.setMotionY = setMotionY;
            this.getPos     = getPos;
            this.getSize    = getSize;
            this.getScore    = getScore;
            this.move       = move;
            this.collisionLeftWith   = collisionLeftWith;
            this.collisionRightWith  = collisionRightWith;
            this.collisionTopWith    = collisionTopWith;
            this.collisionBottomWith = collisionBottomWith;
            return this;
        };
        return Constructor;
    }());


    model.Box = (function(){

        var Constructor = function(pos,size,color){
            // force construction
            if (!(this instanceof model.Box)){
                return new model.Box(pos,size);
            }

            //check parameters
            pos = {
                x: pos.x || null,
                y: pos.y || null
            };
            size = {
                x: size.x || null,
                y: size.y || null
            };
            color = color || "#000000";
            /*if ( !pos.x || !pos.y || !size.x || !size.y){
                throw {
                    name: "bad Parmeter",
                    message: "failed to create BOX"
                };
            }*/
            
            var tasks = ['show','keep','hide','delete'];
            var task_index = 0;
            /* propaties and methods */
            var getPos = function(){
                return {x:pos.x,y:pos.y};
            };
            var getSize = function(){
                return {x:size.x,y:size.y};
            };
            var getScore = function(){
                return 200 - size.x;
            };
            var move = function(){
                pos.y += HOPPING.boxScrollPerFrame;
            };
            var getColor = function(){
                return color;
            };
            
            var getCurrentTask = function(){
                return tasks[task_index];
            };
            var nextTask = function(){
                task_index++;
            };
            
            //export
            this.getPos  = getPos;
            this.getSize = getSize;
            this.getScore = getScore;
            this.getColor = getColor;
            this.getCurrentTask = getCurrentTask;
            this.nextTask = nextTask;
            this.move = move;
        };
        return Constructor;
    }());

    model.input = (function(){
        var left  = false,
            right = false;

        var pressLeft = function(){
            left = true;
        };
        var pressRight = function(){
            right = true;
        };
        var upLeft = function(){
            left = false;
        };
        var upRight = function(){
            right = false;
        };

        var isLeftPressed = function(){
            return left;
        };
        var isRightPressed = function(){
            return right;
        };
        return {
            pressLeft:pressLeft,
            pressRight:pressRight,
            upLeft : upLeft,
            upRight : upRight,
            isLeftPressed : isLeftPressed,
            isRightPressed : isRightPressed
        };
    }());

    model.app = (function(){
        
        var init = function(){
            /* properties and methods */
            var player = new HOPPING.Model.Player();
            var boxes = [];
            for (var i=0,l=HOPPING.initialBoxes.length;i<l;i++){
                boxes.push(HOPPING.Model.Box(HOPPING.initialBoxes[i].pos,HOPPING.initialBoxes[i].size));
            }
            var pushBox = function(box){
                boxes.push(box);
            };
            var refreshBoxes = function(){
                var toDeleteIndex = [];
                var pos;
                var size;
                for(var i=0,l=this.boxes.length; i<l; i++){
                    this.boxes[i].move();
                    switch(this.boxes[i].getCurrentTask() ) {
                      case "show":
                        this.boxes[i].nextTask();
                            break;
                      case "keep":
                        pos = this.boxes[i].getPos();
                        size = this.boxes[i].getSize();
                        if (pos.y + size.y < 0) {
                            this.boxes[i].nextTask();
                        }
                        break;
                      case "hide":
                        this.boxes[i].nextTask();
                        break;
                      case "delete":
                        toDeleteIndex.push(i);
                        break;
                    default:
                        // do nothing;
                    }
                }
                var newBoxes = [];
                var found;
                for(i=0,l=HOPPING.Model.app.boxes.length; i<l; i++){
                    found = false;
                    for (var j=0,m=toDeleteIndex.length;j<m;j++) {
                        if (i == j) {
                            found = true;
                        }
                    }
                    if (!found) {
                        newBoxes.push(this.boxes[i]);
                    }
                }
                this.boxes = newBoxes;
            };

            var checkCollision = function(){
                var playerPos = this.player.getPos();
                var playerSize = this.player.getSize();
                var playerTopY = playerPos.y;
                var playerBottomY = playerPos.y + playerSize.y;
                var playerLeftX = playerPos.x;
                var playerRightX = playerPos.x + playerSize.x;
                var boxPos,boxSize,boxTopY,boxBottomY,boxLeftX,boxRightX;
                for (var i=0,l=this.boxes.length;i<l;i++) {
                    boxPos = this.boxes[i].getPos();
                    boxSize = this.boxes[i].getSize();
                    boxTopY = boxPos.y;
                    boxBottomY = boxPos.y + boxSize.y;
                    boxLeftX = boxPos.x;
                    boxRightX = boxPos.x + boxSize.x;
                    //collision top
                    if (playerRightX >= boxLeftX
                        && playerLeftX <= boxRightX
                        && playerTopY <= boxBottomY
                        && playerBottomY >= boxBottomY) {
                        player.collisionTopWith(this.boxes[i]);
                    }
                    //collision bottom
                    if (playerRightX >= boxLeftX
                        && playerLeftX <= boxRightX
                        && playerBottomY >= boxTopY
                        && playerTopY <= boxTopY
                       ) {
                        player.collisionBottomWith(this.boxes[i]);
                    }
                    //collision left
                    if (playerLeftX <= boxRightX
                        && playerRightX >= boxRightX
                        && playerTopY <= boxBottomY
                        && playerBottomY >= boxTopY) {
                        player.collisionLeftWith(this.boxes[i]);
                    }
                    //collision right
                    if (playerRightX >= boxLeftX
                        && playerLeftX <= boxLeftX
                        && playerTopY <= boxBottomY
                        && playerBottomY >= boxTopY) {
                        player.collisionRightWith(this.boxes[i]);
                    }
                }
            };

            var checkGameOver = function(){
                var pos = this.player.getPos();
                var size = this.player.getSize();
                if( pos.x < 0) {
                    this.gameOver = true;
                }
                if (pos.x + size.x > HOPPING.Model.screen.size.x){
                    this.gameOver = true;
                }
                if( pos.y < 0) {
                    this.gameOver = true;
                }
                if (pos.y + size.y > HOPPING.Model.screen.size.y){
                    this.gameOver = true;
                }
                if (this.gameOver) {
                    HOPPING.se.end.play();
                }
            };
            
            //export
            this.gameOver = false;
            this.playing = false;
            this.player = player;
            this.boxes = boxes;
            this.refreshBoxes = refreshBoxes;
            this.checkCollision = checkCollision;
            this.checkGameOver = checkGameOver;
            this.pushBox = pushBox;
        };
        
        return new init();
    })();
}(this));

/* VIEW */
(function(global){
    var space = global.HOPPING.namespace("HOPPING.View");
    space.createBoxElement = function(box){
        var el = document.createElement('span');
        var pos = box.getPos();
        var size = box.getSize();
        el.className = "box";
        el.style.width = size.x;
        el.style.height = size.y;
        el.style.backgroundColor = box.getColor();
        el.style.margin = 0;
        el.style.padding = 0;
        el.box = box;
        return el;
    };
    
    var boxElements = [];
    space.render = function(app){

        var screenEl = document.getElementById('screen');
        screenEl.style.width = HOPPING.Model.screen.size.x;
        screenEl.style.height = HOPPING.Model.screen.size.y;

        var playerEl = document.getElementById('player');
        var playerPos = app.player.getPos();
        var playerSize = app.player.getSize();
        playerEl.style.left = playerPos.x;
        playerEl.style.top = playerPos.y;
        playerEl.style.width = playerSize.x;
        playerEl.style.height = playerSize.y;
        playerEl.style.margin = 0;
        playerEl.style.padding = 0;

        var statusEl = document.getElementById('status');
        statusEl.style.position = 'absolute';
        statusEl.style.left = HOPPING.Model.screen.size.x + 20;
        var scoreEl = document.getElementById('score');
        scoreEl.innerHTML= app.player.getScore();
        
        for (var i=0,l=app.boxes.length; i<l; i++) {
            switch (app.boxes[i].getCurrentTask()) {
              case 'show':
                var newBoxElement = space.createBoxElement(app.boxes[i]);
                boxElements.push(newBoxElement);
                screenEl.appendChild(newBoxElement);
                break;
              case 'hide':
                var newArray = [];
                for (var j=0,m=boxElements.length; j<m; j++) {
                    //remove elements from boxElements
                    if ( boxElements[j].box === app.boxes[i]) {
                        screenEl.removeChild(boxElements[j]);
                    } else{
                        newArray.push(boxElements[j]);
                    }
                }
                boxElements = [];
                boxElements = newArray;
                break;
            }
        }
        var boxPos;
        for (var k=0,n=boxElements.length; k<n; k++) {
            boxPos = boxElements[k].box.getPos();
            boxElements[k].style.top = boxPos.y;
            boxElements[k].style.left = boxPos.x;
        }
    };
}(this));

/* CONTROLLER */
(function(global){

    var controller = HOPPING.namespace("HOPPING.Controller");

    controller.createBox =function(){
        var app = HOPPING.Model.app;
        if(!app.playing || app.gameOver){
            setTimeout(controller.createBox,Math.floor(Math.random()*3000) + 500);
            return;
        }

        var sizeX = Math.floor(Math.random()*100) + 30;
        var sizeY = Math.floor(Math.random()*20) + 10;
        var posX  = Math.floor(Math.random() * (HOPPING.Model.screen.size.x - sizeX));
        app.boxes.push(HOPPING.Model.Box({x:posX,y:HOPPING.Model.screen.size.y},{x:sizeX,y:sizeY}));
        
        setTimeout(controller.createBox,Math.floor(Math.random()*3000) + 500);
    };
    
    controller.mainloop = function(){
        var input = HOPPING.Model.input;
        var app = HOPPING.Model.app;

        if(!app.playing || app.gameOver){
            return;
        }
        HOPPING.View.render(app);

        app.checkGameOver();
        if (app.gameOver){
            var messageEl = document.getElementById('message');
            messageEl.style.top = HOPPING.Model.screen.size.y/2;
            messageEl.style.display="block";
        }

        //Move
        app.checkCollision();
        if ( input.isRightPressed() ){
            app.player.moveRight(0.015);
        }
        if ( input.isLeftPressed() ){
            app.player.moveLeft(0.015);
        }
        app.player.moveDown(1);
        app.player.move();

        
        app.refreshBoxes();
    };

    
}(this));

/* INITIALIZE APPLICATION */
(function(global){
    var app = HOPPING.Model.app;

    var dispatchKeypress = function(keyCode){
        switch(keyCode){
          case 39: //right
            HOPPING.Model.input.pressRight();
            break;
          case 37: //left
            HOPPING.Model.input.pressLeft();
            break;
          case 32: //space
            app.playing = !app.playing;
            break;
        }
    };
    var dispatchKeyup = function(keyCode){
        switch(keyCode){
          case 39:
            HOPPING.Model.input.upRight();
            break;
          case 37:
            HOPPING.Model.input.upLeft();
            break;
        }
    };

    var touch = function(e){
        app.playing = true;
        if (e.touches[0].pageX < HOPPING.Model.screen.size.x/2) {
            HOPPING.Model.input.pressLeft();
        }
        else {
            HOPPING.Model.input.pressRight();
        }
    };
    var touchEnd = function(e){
        app.playing = true;
        HOPPING.Model.input.upLeft();
        HOPPING.Model.input.upRight();
    };
    window.onload = function(){
        HOPPING.utils.addHandler(document, 'keydown', function(e){dispatchKeypress(e.keyCode);});
        HOPPING.utils.addHandler(document, 'keyup',    function(e){dispatchKeyup(e.keyCode);});
        HOPPING.utils.addHandler(document, 'touchstart',    function(e){touch(e);});
        HOPPING.utils.addHandler(document, 'touchend',    function(e){touchEnd(e);});
        HOPPING.View.render(HOPPING.Model.app);
        setInterval(HOPPING.Controller.mainloop,15);
        setTimeout(HOPPING.Controller.createBox,3000);
    };
}(this));
