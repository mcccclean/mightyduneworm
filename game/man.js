
var behaviours = {
	jump: function(man, dt) {
		man.z += man.zvel * dt;
		man.zvel -= 850 * dt;
		if(man.z < 0) {
			man.behaviour = null;	
			man.z = 0;
			man.sprite.gotoAndPlay("man");
		} 
	},
	pursue: function(man, dt) {
		
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
};

Man.prototype.update = function(dt) {
	if(this.behaviour) {
		this.behaviour(this, dt);
	} else {
		this.thinkingtime -= dt;
		if(this.thinkingtime < 0) {
			
		}
	}
};

Man.prototype.collide = function(worm) {
	if(worm.z > 1) {
		game.removeentity(this);
	}
};

Man.prototype.think = function() {
	this.thinkingtime = 1;
};

