
var behaviours = {
	jump: function(man, dt) {
		man.z += man.zvel * dt;
		man.zvel -= 850 * dt;
		if(man.z < 0) {
			man.z = 0;
			return true;
		} 
	},
	flee: function(man, dt) {
		if(man.z > 0 && behaviours.jump(man, dt)) {
			man.sprite.gotoAndPlay("run");
		}
		var dx = man.x - game.worm.x;
		var dy = man.y - game.worm.y;
		var dist = Math.sqrt(dx * dx + dy * dy);
		var speed = this.speed * dt;
		man.x += dx * speed / dist;
		man.y += dy * speed / dist;
		if(dist > 500) {
			return true;
		}
	},
	pursue: function(man, dt) {
		if(man.target) {
			var dx = man.target.x - man.x;
			var dy = man.target.y - man.y;
			var dist = Math.sqrt(dx * dx + dy * dy);
			var speed = this.speed * dt;
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
	this.speed = 100;
	this.beginJump();
	this.behaviour = behaviours.jump;
	this.thinkingtime = 1;
	this.target = null;
	this.alive = true;
};

Man.prototype.isValidTarget = function(t) {
	if(t) {
		if(t.dibs && t.dibs.alive) {
			return t.dibs == this;
		} else {
			return true;
		}
	}
	return false;
}

Man.prototype.update = function(dt) {
	this.checkflee();
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

Man.prototype.die = function() {
	game.removeentity(this);
	this.alive = false;
};

Man.prototype.collide = function(worm) {
	if(worm.z > 1) {
		this.die();
	}
};

Man.prototype.beginJump = function() {
	this.zvel = 300;
	if(this.z == 0) {
		this.z += 0.001;
	}
};

Man.prototype.checkflee = function() {
	if(this.behaviour != behaviours.flee) {
		if(game.worm.z > 1) {
			var dist = distance(this.x, this.y, game.worm.x, game.worm.y);
			if(dist < 300) {
				this.sprite.gotoAndPlay("jump");
				this.beginJump();
				if(this.target && (this.target.dibs == this)) {
					this.target.dibs = null;
				}
				this.behaviour = behaviours.flee;
			}
		}
	}
};

Man.prototype.pursue = function(target) {
	if(target) {
		target.dibs = this;
		this.target = target;
		this.sprite.gotoAndPlay("run");
		this.behaviour = behaviours.pursue;
	}
};

Man.prototype.gather = function(target) {
	if(target) {
		target.dibs = this;
		this.target = target;
		this.sprite.gotoAndPlay("gather");
		this.behaviour = behaviours.gather;
		this.gathertime = 3;
	}
};

Man.prototype.think = function() {
	this.thinkingtime = 1;
	var me = this;
	var closest = game.getclosest(this.x, this.y, function(e) {
		return e.type == "jewels" && me.isValidTarget(e);
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

