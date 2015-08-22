var start;

var game = {};

var Jewels = function(x, y) {
	this.sprite = game.makesprite(this, "gems");	
	this.x = x;
	this.y = y;
	this.z = 0;
}
Jewels.prototype.update = function(dt) {

};
Jewels.prototype.collide = function(worm) {

};

var TownHall = function() {
	this.x = 0;
	this.y = 0;
	this.z = 0;
	this.sprite = game.makesprite(this, "townhall");
	this.hand = game.makesprite(this, "clockhand");
	this.hand.x = -10;
	this.hand.y = -140;
	this.timer = 1;
};
TownHall.prototype.update = function(dt) {
	this.timer -= dt * 0.1;
	this.hand.rotation = this.timer * -360;
	if(this.timer < 0) {
		this.timer = 1;
		game.entities.push(new Man(0, 100));
	}
}
TownHall.prototype.collide = function(worm) {}

var Tree = function(x, y) {
	this.sprite = game.makesprite(this, "tree");	
	this.x = x;
	this.y = y;
	this.z = 0;
	this.brokentimer = 0;
};
Tree.prototype.update = function(dt) {
	if(this.brokentimer > 0) {
		this.brokentimer -= dt;
		if(this.brokentimer < 0) {
			this.sprite.gotoAndPlay("tree");
		}
	}
};
Tree.prototype.collide = function(worm) {
	console.log(worm, worm.z, this.brokentimer);
	if(worm.z == 0 && this.brokentimer <= 0) {
		worm.speed = 0;
		this.brokentimer = 1;
		this.sprite.gotoAndPlay("treebroken");
	}
};

$(function() {
	game.stage = new createjs.Stage("game");
	game.stage.x = game.stage.canvas.width / 2;
	game.stage.y = game.stage.canvas.height / 2;

	var MAPW = 1600;
	var MAPH = 1200;

	var group = new createjs.Container();
	group.scaleX = 0.5;
	group.scaleY = 0.5;
	game.stage.addChild(group);
	game.scene = group;

	game.sheet = new createjs.SpriteSheet(SPRITES);

	game.stage.update();

	game.entities = [];
	game.worm = new Worm();
	game.entities.push(game.worm);

	game.entities.push(new TownHall());

	for(var i = 0; i < 10; ++i) {
		game.entities.push(new Man(Math.random() * MAPW - MAPW*0.5, Math.random() * MAPH - MAPH * 0.5));
		game.entities.push(new Tree(Math.random() * MAPW - MAPW*0.5, Math.random() * MAPH - MAPH * 0.5));
	}

	for(var i = 0; i < 256; ++i) {
		KEYS[i] = false;
	}

	createjs.Ticker.setFPS(30);
});

game.makesprite = function(entity, name) {
	var sprite = new createjs.Sprite(game.sheet, name);
	sprite.entity = entity;
	game.scene.addChildAt(sprite, 0);
	return sprite;
};

game.removeentity = function(entity) {
	var index = game.entities.indexOf(entity);
	game.entities.splice(index, 1);
	game.scene.removeChild(entity.sprite);
};

KEYS = {};
$(window).keydown(function(e) {
	KEYS[e.keyCode] = true;
	$("#checkos").html(e.keyCode);
});
$(window).keyup(function(e) {
	KEYS[e.keyCode] = false;
});

createjs.Ticker.addEventListener("tick", function() {
	var dt = 1.0/30;
	for(var i = 0; i < game.entities.length; ++i) {
		var e = game.entities[i];
		e.update(dt);
		e.sprite.x = e.x;
		e.sprite.y = e.y - e.z;
	}

	var dx = game.worm.x;
	var dy = game.worm.y;
	var distFromTown = 300 / Math.sqrt(dx * dx + dy * dy);
	if(distFromTown > 0.5) {
		distFromTown = 0.5;
	}
	game.scene.scaleX = game.scene.scaleX * 0.9 + distFromTown * 0.1;
	game.scene.scaleY = game.scene.scaleY * 0.9 + distFromTown * 0.1;
	game.scene.x = game.worm.x * -0.25;
	game.scene.y = game.worm.y * -0.25;

	game.scene.sortChildren(function(a, b) {
		var dy = a.entity.y - b.entity.y;
		if(dy == 0) {
			return b.y - a.y;
		} else {
			return dy;
		}
	});

	game.stage.update();
});

