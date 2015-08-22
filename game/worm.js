
var LEFT = 37;
var RIGHT = 39;
var SPACE = 32;

var Worm = function() {
	this.angle = 0;
	this.sprite = game.makesprite(this, "head");
	this.x = 100;
	this.y = 100;
	this.z = 0;
	this.speed = 200;
	this.zvel = 0;

	this.follows = [];
	var lastfollow = this;
	for(var i = 0; i < 8; ++i) {
		var newfollow = new BodySegment(lastfollow, i==7);
		this.follows.push(newfollow);
		lastfollow = newfollow;
	}
};

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

