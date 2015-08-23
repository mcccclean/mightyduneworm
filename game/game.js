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
	this.timermax = 1;
	this.resources = {
		log: 2
	};
	this.constructions = 0;
	this.displayresources();
};
TownHall.prototype.makeconstruction = function(type) {
	var ring = Math.floor(this.constructions / 5);
	var ringidx = this.constructions % 5;
	var factor = 1;
	if(ring % 2) { factor = -1; }
	var angle = ringidx * Math.PI * 2 / 5 - factor * Math.PI * 0.5;
	var radius = 250 * (ring + 1);
	var p = polar(angle, radius); 
	console.log(ring, ringidx, angle, radius, p.x, p.y);
	game.addentity(new Construction(p.x, p.y, type));
	this.constructions++;
};
TownHall.prototype.makenearby = function(type) {
	var p = null;
	var tries = 0;
	while(p == null) {
		var th = Math.random() * Math.PI * 2;
		var r = 200 + Math.random()*100 + tries*50;
		p = polar(th, r);
		for(var i = 0; p != null && i < game.entities.length; ++i) {
			var e = game.entities[i];
			if(distance(p.x, p.y, e.x, e.y) < 100) {
				p = null;
			}
		}
		tries++;
	}
	BUILDS = {
		seed: function(x, y) { game.addentity(new Seed(p.x, p.y)); }
	};

	BUILDS[type](p.x, p.y);
};

TownHall.prototype.update = function(dt) {
	this.timer -= dt * 0.2;
	this.hand.rotation = (this.timer/this.timermax) * -360;
	if(this.timer < 0) {
		this.timermax = Math.sqrt(game.mancount + 2);
		this.timer = this.timermax;
		game.addentity(new Man(0, 100));
	}

	var BUILDINGS = {
		'house': { resource: 'log', cost: 3, construction: true },
		'wall': { resource: 'stone', cost: 5, construction: true },
		'seed': { resource: 'seeds', cost: 4, construction: false },
		'grave': { resource: 'skull', cost: 3, construction: true },
	};

	for(var type in BUILDINGS) {
		var cost = BUILDINGS[type].cost;
		var res = BUILDINGS[type].resource;
		if(this.resources[res] >= cost) {
			this.resources[res] -= cost;
			this.displayresources();
			if(BUILDINGS[type].construction) {
				this.makeconstruction(type);
			} else {
				this.makenearby(type);		
			}
		}
	};
}
TownHall.prototype.collide = function(worm) { worm.recoil(this.x, this.y); }
TownHall.prototype.work = function(man, dt) {
	man.workleft -= dt;
	if(man.workleft <= 0) {
		var old = this.resources[man.carrying] || 0;
		this.resources[man.carrying] = old + 1;
		man.carrying = null;
		this.displayresources();
		return true;
	}
};
TownHall.prototype.displayresources = function() {
	var resdisplay = game.resourcedisplay;
	resdisplay.removeAllChildren();
	var yidx = 0;
	for(var type in this.resources) {
		var amt = this.resources[type];
		for(var i = 0; i < amt; ++i) {
			var s = new createjs.Sprite(game.sheet, type);
			s.y = yidx * 40;
			resdisplay.addChild(s);
			yidx++;
		}
	};
};

var Construction = function(x, y, type) {
	this.type = type;
	this.sprite = game.makesprite(this, "con_" + type);	
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
		game.addentity(new House(this.x, this.y, this.type));
		this.destroyed = true;
		return true;
	}
}

var House = function(x, y, type) {
	this.sprite = game.makesprite(this, type);	
	this.x = x;
	this.y = y;
	this.z = 0;
};
House.prototype.update = function(dt) {}
House.prototype.collide = function(worm) { worm.recoil(this.x, this.y); }

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
		worm.recoil(this.x, this.y);
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
Tree.prototype.topple = function() {
	this.brokentimer = 1;
	this.sprite.gotoAndPlay("treebroken");
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
		worm.recoil(this.x, this.y);
		this.topple();
	}
};

var Sapling = function(x, y) {
	this.sprite = game.makesprite(this, "sapling");
	this.x = x;
	this.y = y;
	this.z = 0;
	this.growthtimer = 3 + Math.random() * 2;
};
Sapling.prototype.update = function(dt) {
	this.growthtimer -= dt;
	if(this.growthtimer < 0) {
		this.destroyed = true;
		var t = new Tree(this.x, this.y);
		game.addentity(t);
		t.topple();
	}
};
Sapling.prototype.collide = function(worm) {
	this.destroyed = true;
};

var Seed = function(x, y) {
	this.sprite = game.makesprite(this, "seed");
	this.x = x;
	this.y = y;
	this.z = 0;
	this.workremaining = 1;
	this.job = 20;
};
Seed.prototype.update = function(dt) {}
Seed.prototype.collide = function(worm) {}
Seed.prototype.work = function(man, dt) {
	this.workremaining -= dt;
	if(this.workremaining < 0) {
		this.destroyed = true;
		game.addentity(new Sapling(this.x, this.y));
		return true;
	}
}

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

	var resources = new createjs.Container();
	game.resourcedisplay = resources;
	resources.x = game.stage.canvas.width / 2 - 40;
	resources.y = -game.stage.canvas.height / 2 + 60;
	resources.scaleX = 0.5;
	resources.scaleY = 0.5;
	game.stage.addChild(resources);

	game.sheet = new createjs.SpriteSheet(SPRITES);

	resources.addChild(new createjs.Sprite(game.sheet, "log"));

	game.stage.update();

	game.entities = [];
	game.newentities = [];
	game.mancount = 0;
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
		var priority = pred(e);
		if(priority > 0) {
			var dx = e.x - x;
			var dy = e.y - y;
			var dist = (dx * dx + dy * dy) * priority;
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
