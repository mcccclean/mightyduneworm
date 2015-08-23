
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
			var speed = man.speed * dt;
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
	work: function(man, dt) {
		return man.target.work(man, dt);
	},
	gohome: function(man, dt) {
		if(distance(man.x, man.y, man.target.x, man.target.y) < 50) {
			man.workleft = 1;
			man.sprite.gotoAndPlay("gather");
			man.target = game.townhall;
			man.behaviour = behaviours.work;
		} else {
			behaviours.pursue(man, dt);
		}
	},
	bored: function(man, dt) {
		man.boredtimer -= dt;
		if(man.boredtimer < 0) {
			man.think();
		}
	}
};

var Man = function(x, y) {
	this.sprite = game.makesprite(this, "jump");	
	this.x = x;
	this.y = y;
	this.z = 0;
	this.speed = 120 + Math.random() * 30;
	this.beginJump();
	this.behaviour = behaviours.jump;
	this.thinkingtime = 1;
	this.workleft = 3;
	this.target = null;
	this.alive = true;
	this.boredtimer = 3;
	game.mancount += 1;
};

Man.prototype.getTargetPriority = function(t) {
	if(t && t.job) {
		if(t.dibs && t.dibs.alive) {
			return (t.dibs == this) * t.job;
		} else {
			return t.job;
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
	this.destroyed = true;
	this.alive = false;
	game.mancount -= 1;
	if(this.carrying) {
		game.addentity(new Resource(this.x, this.y, this.carrying));
	}
	game.addentity(new Resource(this.x, this.y, "skull"));
};

Man.prototype.collide = function(worm) {
	if(worm.z > 1) {
		this.die();
		playSound("eaten");
	}
};

Man.prototype.beginJump = function() {
	this.zvel = 300;
	if(this.z == 0) {
		this.z += 0.001;
	}
	this.sprite.gotoAndPlay("jump");
};

Man.prototype.checkflee = function() {
	if(this.behaviour != behaviours.flee) {
		if(game.worm.z > 1) {
			var dist = distance(this.x, this.y, game.worm.x, game.worm.y);
			if(dist < 300) {
				this.beginJump();
				if(this.target && (this.target.dibs == this)) {
					this.target.dibs = null;
				}
				this.behaviour = behaviours.flee;
				playSound("scream");
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

Man.prototype.work = function(target) {
	if(target) {
		target.dibs = this;
		this.target = target;
		this.sprite.gotoAndPlay("gather");
		this.behaviour = behaviours.work;
	}
};

Man.prototype.think = function() {
	this.thinkingtime = 1;
	var me = this;
	if(!this.carrying) {
		var closest = game.getclosest(this.x, this.y, function(e) {
			return me.getTargetPriority(e);
		});
		if(closest) {
			this.boredtimer = 5;
			var dist = distancesq(this.x, this.y, closest.x, closest.y);
			if(dist < 100) {
				this.work(closest);
			} else {
				this.pursue(closest);
			}
		} else {
			if(this.boredtimer > 0) {
				this.behaviour = behaviours.bored;
				this.sprite.gotoAndPlay("dying");
				playSound("bored");
			} else {
				this.die();
				playSound("boreddeath");
			}
		}
	} else {
		this.target = { x: 0, y: 100 };
		this.sprite.gotoAndPlay("run");
		this.behaviour = behaviours.gohome;
	}
};

