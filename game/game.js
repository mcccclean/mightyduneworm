var start;

var game = {};

(function() {

	var Worm = function() {
		this.angle = 0;
		this.sprite = game.makesprite(this, "head");
		this.x = 100;
		this.y = 100;
		this.z = 0;
		this.speed = 0;
		this.zvel = 0;

		this.follows = [];
		var lastfollow = this;
		for(var i = 0; i < 8; ++i) {
			var newfollow = new BodySegment(lastfollow, i==7);
			this.follows.push(newfollow);
			lastfollow = newfollow;
		}
	};

	var LEFT = 37;
	var RIGHT = 39;
	var SPACE = 32;

	var proto = Worm.prototype;
	proto.update = function(dt) {
		var TURN = 4;
		if(this.z > 1)
			TURN = 0.5;

		if(KEYS[LEFT])
			this.angle -= dt * TURN;
		else if(KEYS[RIGHT])
			this.angle += dt * TURN;

		if(this.speed < 500) {
			this.speed += 100 * dt;
		} else if(this.speed > 500) {
			this.speed = 500;
		}
		this.x += dt * Math.cos(this.angle)*this.speed;
		this.y += dt * Math.sin(this.angle)*this.speed*0.75;

		for(var i = 0; i < this.follows.length; ++i) {
			this.follows[i].update(dt);
		}

		if(KEYS[SPACE] && this.z == 0) {
			this.zvel = 300;
		}

		this.z += this.zvel * dt;
		this.zvel -= 850 * dt;
		if(this.z < 0) {
			this.z = 0;
			this.zvel = 0;
		}

		for(var i = 0; i < game.entities.length; ++i) {
			var e = game.entities[i];
			if(e != this) {
				var dx = this.x - e.x;
				var dy = this.y - e.y;
				if(dx * dx + dy * dy < 2000) {
					e.collide(this);
				}
			}
		}

		if(this.z < 1) {
			if(this.sprite.currentAnimation != "rumble") {
				this.sprite.gotoAndPlay("rumble");
			}
			this.sprite.rotation = 0;
		} else {
			if(this.sprite.currentAnimation != "head") {
				this.sprite.gotoAndPlay("head");
			}
			this.sprite.rotation = this.angle * 180 / Math.PI;
		}
	};

	var BodySegment = function(follow, jewel) {
		this.follow = follow;
		this.jewel = jewel;
		this.abovegroundanimation = "body";
		if(jewel) {
			this.abovegroundanimation = "jewel";
		}
		this.sprite = game.makesprite(this, "rumble");
		this.shadow = game.makesprite(this, "shadow");
		this.x = follow.x;
		this.y = follow.y;
		this.z = follow.z;
		this.rotation = 0;
		this.followframes = [];
		this.followframes.push([follow.x, follow.y, follow.z, follow.rotation]);
	};
	BodySegment.prototype.update = function(dt) {
		var follow = this.follow;
		this.followframes.push([follow.x, follow.y, follow.z, follow.rotation]);
		this.oldz = this.z;
		if(this.followframes.length > 3) {
			var o = this.followframes.shift();
			this.x = o[0];
			this.y = o[1];
			this.z = o[2];
			this.rotation = o[3];
		}

		this.sprite.x = this.x;
		this.sprite.y = this.y - this.z;
		if(this.z < 1) {
			if(this.sprite.currentAnimation != "rumble") {
				this.sprite.gotoAndPlay("rumble");
			}
			this.sprite.rotation = 0;
			this.shadow.visible = false;
		} else {
			if(this.sprite.currentAnimation != this.abovegroundanimation) {
				this.sprite.gotoAndPlay(this.abovegroundanimation);
			}
			this.shadow.visible = true;
			this.shadow.x = this.x;
			this.shadow.y = this.y;
			//this.sprite.rotation = this.angle * 180 / Math.PI;
		}

		if(this.oldz <= 0 && this.z > 0 && this.jewel) {
			game.entities.push(new Jewels(this.x, this.y));
		}
	};

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

	var Man = function(x, y) {
		this.sprite = game.makesprite(this, "man");	
		this.x = x;
		this.y = y;
		this.z = 0;
	};
	Man.prototype.update = function(dt) {
	};
	Man.prototype.collide = function(worm) {
		
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
		console.log(worm, worm.z, this.brokentimer);
		if(worm.z == 0 && this.brokentimer <= 0) {
			worm.speed = 0;
			this.brokentimer = 1;
			this.sprite.gotoAndPlay("treebroken");
		}
	};


	$(function() {
		game.stage = new createjs.Stage("game");
		
		var group = new createjs.Container();
		group.scaleX = 0.5;
		group.scaleY = 0.5;
		game.stage.addChild(group);
		game.scene = group;

		game.sheet = new createjs.SpriteSheet(SPRITES);

		game.stage.update();

		game.entities = [];
		var worm = new Worm();
		game.entities.push(worm);

		for(var i = 0; i < 10; ++i) {
			game.entities.push(new Man(Math.random() * 1600, Math.random() * 1200));
			game.entities.push(new Tree(Math.random() * 1600, Math.random() * 1200));
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

		game.scene.sortChildren(function(a, b) {
			return a.entity.y - b.entity.y;
		});

		game.stage.update();
	});
})();
