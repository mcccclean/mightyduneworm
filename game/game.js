var start;

var game = {};

var Jewels = function(x, y) {
	this.sprite = game.makesprite(this, "gems");	
	this.x = x;
	this.y = y;
	this.z = 0;
	this.dibs = null;
	this.type = "jewels";
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

	var MAPW = game.stage.canvas.width * 2;
	var MAPH = game.stage.canvas.height * 2;

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
		game.entities.push(new Tree(Math.random() * MAPW - MAPW*0.5, Math.random() * MAPH - MAPH * 0.5));
	}
	for(var i = 0; i < 3; ++i) {
		game.entities.push(new Man(Math.random() * MAPW - MAPW*0.5, Math.random() * MAPH - MAPH * 0.5));
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

game.getclosest = function(x, y, pred) {
	var best = 10000000;
	var candidate = null;
	for(var i = 0; i < game.entities.length; ++i) {
		var e = game.entities[i];
		if(pred(e)) {
			var dx = e.x - x;
			var dy = e.y - y;
			var dist = dx * dx + dy * dy;
			if(dist < best) {
				candidate = e;
				best = dist;
			}
		}
	}
	return candidate;
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

	var MAXZOOM = 0.8;

	var dx = game.worm.x;
	var dy = game.worm.y;
	var distFromTown = 300 / distance(0, 0, game.worm.x, game.worm.y);
	if(distFromTown > MAXZOOM) {
		distFromTown = MAXZOOM;
	}
	game.scene.scaleX = game.scene.scaleX * 0.95 + distFromTown * 0.05;
	game.scene.scaleY = game.scene.scaleY * 0.95 + distFromTown * 0.05;
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


function distance(x0, y0, x1, y1) {
	var dx = x0 - x1;
	var dy = y0 - y1;
	return Math.sqrt(dx * dx + dy * dy);
};

function distancesq(x0, y0, x1, y1) {
	var dx = x0 - x1;
	var dy = y0 - y1;
	return (dx * dx + dy * dy);
};
