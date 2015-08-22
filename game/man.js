
var behaviours = {
	jump: function(man, dt) {
		man.z += man.zvel * dt;
		man.zvel -= 850 * dt;
		if(man.z < 0) {
			man.z = 0;
			return true;
		} 
	},
	pursue: function(man, dt) {
		if(man.target) {
			var dx = man.target.x - man.x;
			var dy = man.target.y - man.y;
			var speed = 100 * dt;
			var dist = Math.sqrt(dx * dx + dy * dy);
			if(dist > speed) {
				man.x += dx * speed / dist;
				man.y += dy * speed / dist;
			} else {
				man.x += dx;
				man.y += dy;
				return true;
			}
		} else {
			return true;
		}
	},
	gather: function(man, dt) {
		man.gathertime -= dt;
		if(man.gathertime < 0) {
			game.removeentity(man.target);
			return true;
		}
	},
	gohome: function(man, dt) {
		return pursue(man, dt);
	},
};

var Man = function(x, y) {
	this.sprite = game.makesprite(this, "jump");	
	this.x = x;
	this.y = y;
	this.z = 0;
	this.zvel = 300;
	this.behaviour = behaviours.jump;
	this.thinkingtime = 1;
	this.target = null;
};

Man.prototype.update = function(dt) {
	if(this.behaviour) {
		if(this.behaviour(this, dt)) {
			this.behaviour = null;
			this.sprite.gotoAndPlay("man");
		}
	} else {
		this.thinkingtime -= dt;
		if(this.thinkingtime < 0) {
			this.think();
		}
	}
};

Man.prototype.collide = function(worm) {
	if(worm.z > 1) {
		game.removeentity(this);
	}
};

Man.prototype.pursue = function(target) {
	if(target) {
		this.target = target;
		this.sprite.gotoAndPlay("run");
		this.behaviour = behaviours.pursue;
	}
};

Man.prototype.gather = function(target) {
	if(target) {
		this.target = target;
		this.sprite.gotoAndPlay("gather");
		this.behaviour = behaviours.gather;
		this.gathertime = 3;
	}
};

Man.prototype.think = function() {
	this.thinkingtime = 1;
	var closest = game.getclosest(this.x, this.y, function(e) {
		return e.type == "jewels";
	});
	if(closest) {
		var dist = distancesq(this.x, this.y, closest.x, closest.y);
		if(dist < 100) {
			this.gather(closest);
		} else {
			this.pursue(closest);
		}
	}
};

