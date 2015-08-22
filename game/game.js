var start;

var game = {};

var Resource = function(x, y, type) {
	this.sprite = game.makesprite(this, type);
	this.x = x;
	this.y = y;
	this.z = 0;
	this.zvel = 150;
	this.workleft = 3;
	this.dibs = null;
	this.job = 1;
	this.lastworker = null;
	this.type = type;
};
Resource.prototype.update = function(dt) { 
	this.z += this.zvel * dt;
	this.zvel -= 850 * dt;
	if(this.z < 0) {
		this.z = 0;
	}
}
Resource.prototype.collide = function(worm) { }

Resource.prototype.work = function(man, dt) {
	if(man != this.lastworker) {
		this.workleft = 3;
	}
	this.lastworker = man;
	this.workleft -= dt;
	if(this.workleft <= 0) {
		this.destroyed = true;
		man.carrying = this.type;
		return true;
	}
}

var TownHall = function() {
	this.x = 0;
	this.y = 0;
	this.z = 0;
	this.sprite = game.makesprite(this, "townhall");
	this.hand = game.makesprite(this, "clockhand");
	this.hand.x = -10;
	this.hand.y = -140;
	this.timer = 1;
	this.resources = {
		log: 0
	};
	this.constructions = 0;
};
TownHall.prototype.update = function(dt) {
	this.timer -= dt * 0.1;
	this.hand.rotation = this.timer * -360;
	if(this.timer < 0) {
		this.timer = 1;
		game.addentity(new Man(0, 100));
	}

	if(this.resources['log'] >= 3) {
		this.resources['log'] -= 3;
		var ring = Math.floor(this.constructions / 5);
		var ringidx = this.constructions % 5;
		var factor = 1;
		if(ring % 2) { factor = -1; }
		var angle = ringidx * Math.PI * 2 / 5 - factor * Math.PI * 0.5;
		var radius = 250 * (ring + 1);
		var p = polar(angle, radius); 
		console.log(ring, ringidx, angle, radius, p.x, p.y);
		game.addentity(new Construction(p.x, p.y));
		this.constructions++;
	}
}
TownHall.prototype.collide = function(worm) {}
TownHall.prototype.work = function(man, dt) {
	man.workleft -= dt;
	if(man.workleft <= 0) {
		var old = this.resources[man.carrying] || 0;
		this.resources[man.carrying] = old + 1;
		man.carrying = null;
		$("#checkos").html(this.resources);
		return true;
	}
}

var Construction = function(x, y) {
	this.sprite = game.makesprite(this, "construction");	
	this.x = x;
	this.y = y;
	this.z = 0.01;
	this.zvel = 0;
	this.job = 0.5;
	this.dibs = null;
	this.workleft = 5;
};
Construction.prototype.update = function(dt) {}
Construction.prototype.collide = function(worm) {}
Construction.prototype.work = function(man, dt) {
	this.workleft -= dt;
	if(this.workleft < 0) {
		console.log(this);
		game.addentity(new House(this.x, this.y));
		this.destroyed = true;
		return true;
	}
}

var House = function(x, y) {
	this.sprite = game.makesprite(this, "house");	
	this.x = x;
	this.y = y;
	this.z = 0;
};
House.prototype.update = function(dt) {}
House.prototype.collide = function(worm) {}

var Rock = function(x, y) {
	this.sprite = game.makesprite(this, "rock");	
	this.x = x;
	this.y = y;
	this.z = 0;
	this.brokentimer = 0;
};
Rock.prototype.update = function(dt) {
	if(this.brokentimer > 0) {
		this.brokentimer -= dt;
	}
};
Rock.prototype.collide = function(worm) {
	if(worm.z > 1) {
		this.destroyed = true;
		game.addentity(new Resource(this.x, this.y, "stone"));
	} else if(this.brokentimer <= 0) {
		worm.speed = 0;
		this.brokentimer = 1;
	}
};

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
	if(worm.z > 1) {
		this.destroyed = true;
		game.addentity(new Resource(this.x, this.y, "log"));
	} else if(this.brokentimer <= 0) {
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
	game.newentities = [];
	game.worm = new Worm();
	game.addentity(game.worm);

	game.townhall = new TownHall();
	game.addentity(game.townhall);

	var randoms = [];
	var placerandom = function(amount, cb) {
		for(var i = 0; i < amount; ++i) {
			randoms.push(cb);
		}
	};

	placerandom(15, function(x, y) {
		game.addentity(new Tree(x, y));
	});
	placerandom(15, function(x, y) {
		game.addentity(new Rock(x, y));
	});
	placerandom(15, function(x, y) {
		var s = new createjs.Sprite(game.sheet);
		s.gotoAndStop("dune");
		s.currentAnimationFrame = Math.floor(Math.random() * 5);
		s.x = x;
		s.y = y;
		s.entity = {x: x, y: y};
		game.scene.addChild(s);
	});

	var i = 0;
	while(randoms.length > 0) {
		var idx = Math.floor(Math.random() * randoms.length);
		var cb = randoms.shift();
		var r = (i+2) * 80;
		var th = i * Math.PI * 0.6 + Math.random();
		var x = Math.cos(th) * r;
		var y = Math.sin(th) * r * 0.75;
		cb(x, y);
		i++;
	};

	for(var i = 0; i < 3; ++i) {
		game.addentity(new Man(-150 + i*150, 150));
	};

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

game.addentity = function(e) {
	game.newentities.push(e);
	e.sprite.x = e.x;
	e.sprite.y = e.y - e.z;
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

	game.entities = game.entities.concat(game.newentities);
	game.newentities = [];

	game.entities = game.entities.filter(function(e) {
		e.update(dt);
		e.sprite.x = e.x;
		e.sprite.y = e.y - e.z;
		if(e.destroyed) {
			game.scene.removeChild(e.sprite);
			return false;
		} else {
			return true;
		}
	});

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

function polar(th, r) {
	var x = Math.cos(th) * r;
	var y = Math.sin(th) * r;
	return { x: x, y: y };
};
