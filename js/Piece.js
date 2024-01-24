(function(window) {
	var Piece = function(canvas, config)
	{
		this.initialize(canvas, config);
	}
	var p = Piece.prototype = new BasePiece();
	//
	p.initialize = function(canvas, config)
	{
		BasePiece.prototype.initialize.call(this, canvas, config);
		this.initInteraction();
		this.widthOrig = config.viewportOriginal[0];
		this.heightOrig = config.viewportOriginal[1];
	}

	p.onKeyUp = function(e)
	{
		BasePiece.prototype.onKeyUp.call(this, e);
		var cfg = this.config;
		var dt = 0;
		var k = e.which || e.keyCode;
		//log(k,e.shiftKey);
		if (e.shiftKey) {//SPECIAL ACTIONS
			if (k==40) this.setSpeed(this.speed==0?cfg.autospeed:0);//DOWN: toggle auto rolldown 
			else if (k==38) this.setSpeed(this.speed==0?-cfg.autospeed:0);//UP: toggle auto rollup 
			else if (k==34) this.changeTrail(1.01*cfg.sheetLength);//PGDN
			else if (k==33) this.changeTrail(-1.01*cfg.sheetLength);//PGUP
			else if (k==36) this.setTrail(cfg.trailMin);//HOME
			else if (k==35) this.setTrail(cfg.rollLength-cfg.sheetLength);//END
			else if (k==12) this.setSpeed(0);//CLEAR (numpad 5)
		} 
		//NORMAL ACTION
		else if (k==40) this.changeTrail(cfg.keyspeed);//DOWN
		else if (k==38) this.changeTrail(-cfg.keyspeed);//UP
		//
		if (!this.config.debug) return;
		var c = String.fromCharCode(e.which);
		if (c=="R") this.reset();
		else if (c=="D") { this.debugNoFill = !this.debugNoFill; this.draw(); }
	}
		
	
	/*********************************
	 *		    INTERACTION
	 ********************************/
	
	p.initInteraction = function()
	{
		this.stage.addEventListener("stagemousedown", this.handleMouseDown.bind(this));
		this.stage.addEventListener("stagemousemove", this.handleMouseMove.bind(this));
		this.stage.addEventListener("stagemouseup", this.handleMouseUp.bind(this));
		window.onwheel = this.handleMouseWheel.bind(this);
		this.lastMouseUp = -1;
	}
	p.handleMouseDown = function(e)
	{
		if (this.pointerID) return;
		this.pointerID = e.pointerID;
		var x = e.localX, y = e.localY;
		this.dragY = y;
		this.lastMouseDown = Date.now();
		this.mouseIsDown = true;
		this.setFalling(false);
		this.setSpeed(0);
	}
	p.handleMouseMove = function(e)
	{
		if (e.pointerID!=this.pointerID) return;
		var x = e.localX, y = e.localY;
		var dy = y-this.dragY;
		if (x>0) dy = - dy;
		this.dragY = y;
		var cfg = this.config;
		if (dy>this.speed && dy>5) this.setSpeed(Math.min(cfg.maxSpeed, dy));
		else if (dy<-this.speed && dy<-5) this.setSpeed(Math.max(-cfg.maxSpeed, dy));
		else this.changeTrail(dy, true);
	}
	p.handleMouseUp = function(e)
	{
		if (e.pointerID!=this.pointerID) return;
		this.pointerID = null;
		this.mouseIsDown = false;
		var x = e.localX, y = e.localY;
		//Doubleclick?
		var now = Date.now();
		if (now-this.lastMouseDown<300)
		{
			if (now-this.lastMouseUp<this.config.doubleClickInterval)
			{
				//dblclick: reset if empty
				if (this.trail>this.config.rollLength) this.setTrail(0);
			}
			else
			{
				this.lastMouseUp = now;
			}
		}
	}
	p.handleMouseWheel = function(e)
	{
		this.setFalling(false);
		var d = (e.detail<0 || e.wheelDelta>0) ? 1 : -1;
		var cfg = this.config;
		var dt = -d * cfg.scrollspeed;
		this.changeSpeed(dt);
	}
	

	 
	/*********************************
	 *			    FLOW
	 ********************************/
	
	p.setSize = function(w,h,dpr)
	{
		this.dpr = dpr;
		w = Math.floor(w*dpr);
		h = Math.floor(h*dpr);
		//
		var cfg = this.config;
		var wo = this.widthOrig, ho = this.heightOrig;
		var s = Math.min(w/wo,h/ho);
		this.scale = this.stage.scaleX = this.stage.scaleY = s;
		this.stage.x = w/2 + cfg.rollX*s;
		this.stage.y = h/2 + cfg.rollY*s;
		this.width = w/s;
		this.height = h/s;
		this.bottom = this.height/2-cfg.rollY;
		//
		if (this.tickLast) this.reset();
	}

	p.start = function()
	{
		BasePiece.prototype.start.apply(this);
		log("start",this.width, this.height, this.dpr);
		var cfg = this.config;
		this.shape = this.stage.addChild(new Shape());
		//Precalc oft-used values:
		cfg.rollLength = cfg.sheetCount*cfg.sheetLength;
		var n = cfg.rollLength / (Math.PI * (cfg.radiusMin + cfg.radiusMax));
		cfg.thickness = (cfg.radiusMax-cfg.radiusMin)/n;
		cfg.perimeterMin = cfg.radiusMin*2*Math.PI;//perimeter of roll at minimal radius
		//
		window.onbeforeunload = this.onbeforeunload.bind(this);
		//read cookie
		var trail = Number(CookieUtil.getCookie(TRAIL)) || cfg.trail;
		if (getQueryParam("reset")=="1" || !cfg.cookieEnabled) trail = cfg.trail;
		log("start, trail: ", trail, cfg.cookieEnabled);
		this.setTrail(trail);
		//
		if (this.width) this.reset();
	}
	
	p.onbeforeunload = function()
	{
		if (this.config.cookieEnabled) CookieUtil.setCookie(TRAIL, Math.round(this.trail), 9999);
	}
	
	p.reset = function()
	{
		var cfg = this.config, w = this.width, h = this.height, w2 = w/2, h2 = h/2;
		this.drawRoll(this.radius, this.trail, this.remainder);
	}
	
	p.update = function()
	{	
		var cfg = this.config
		if (this.falling) this.setSpeed(Math.min(cfg.maxSpeed, this.speed*cfg.gravity));
		else this.setSpeed(this.speed*cfg.friction);
		//
		if (this.speed!=0) 
		{
			this.changeTrail(this.speed);
		}
		//start auto rolloff when almost empty
		if (!this.mouseIsDown) this.updateFalling();
		//
		return this.undirty();
	}	
	p.undirty = function()
	{
		var dirty = this.dirty;
		this.draw();
		this.dirty = false;
		return dirty;
	}
	
	p.setTrail = function(value, dontResetSpeed)
	{
		var cfg = this.config;
		if (!dontResetSpeed) this.speed = 0;
		this.trail = Math.max(cfg.trailMin, value);
		this.remainder = Math.round(cfg.rollLength - this.trail);
		this.radius = cfg.radiusMax-(cfg.radiusMax-cfg.radiusMin)*(this.trail/cfg.rollLength);
		//
		this.dirty = true;
	}
	p.changeTrail = function(delta, resetSpeed)
	{
		this.setTrail(this.trail+delta, !resetSpeed);
	}	
	
	p.setSpeed = function(value)
	{
		this.speed = value;
		if (Math.abs(value)<.001) this.speed = 0;
	}
	p.changeSpeed = function(delta)
	{
		this.setSpeed(this.speed+delta);
	}
	
	p.updateFalling = function()
	{
		var bool = this.remainder<this.config.perimeterMin/2;
		this.setFalling(bool);
		return bool;
	}
	p.setFalling = function(bool)
	{
		if (this.falling==bool) return;
		this.falling = bool;
		if (bool) this.setSpeed(5);
	}
	
	 
	/*********************************
	 *			    DRAWING
	 ********************************/
	
		
	p.draw = function() 
	{
		this.drawRoll(this.radius, this.trail, this.remainder);
	}
	p.drawRoll = function(radius, trail, remainder) 
	{
		var m = Math, PI = m.PI, PI2 = PI*2, PI5 = PI*.5;
		var cfg = this.config, px = cfg.perspectiveOffsetX, py = cfg.perspectiveOffsetY, f = cfg.perspectiveFactor;
		var lw = this.dpr;
		var fill = !this.debugNoFill;//debug
		var g = this.shape.graphics.c();
		//
		var maxStraight = (this.bottom-py)/f+5;
		var trailStraight = m.min(maxStraight, trail);
		radius = m.max(radius, cfg.radiusMin);
		//
		var radius2 = radius * f;
		var rest = trail % cfg.sheetLength;//straight part of first hanging sheet
		//calc points of contact of top&bottom line to circle
		//angle from 0,0 to pTop (=perpendicular to tangent at top of 'depth' line to circle)
		var aTop = this.getPerspectiveAngle(0,-radius)+PI5;
		var pTop = new Point(radius*Math.cos(aTop), radius*Math.sin(aTop));
		var pTop2 = new Point(px + radius2*Math.cos(aTop), py + radius2*Math.sin(aTop));

		//aBtm is angle from origin to point of contact of bottom 'depth' line to circle
		var aBtm = this.getPerspectiveAngle(0, radius)-PI5;// < 0
		aBtm += PI2;// > 0
		var pBtm = new Point(radius*Math.cos(aBtm), radius*Math.sin(aBtm));
		var pBtm2 = new Point(px + radius2*Math.cos(aBtm), py + radius2*Math.sin(aBtm));
		
		var aOrigin = this.getPerspectiveAngle(0,radius)+2.5*PI;//angle of depth line at PI (='endpoint' of roll)
		var curveTopLen = -aTop*radius;//length of curve from endpoint of roll to top (point of contact with depth line)
				
		//Draw underside of roll (dark part)
		//remainder/radius-PI is radians of paper remaining on roll minus a half circle (because remainder is calced from left)
		//We never have to draw more than PI radians because it would be covered by trail
		//arc ( x  y  radius  startAngle  endAngle  anticlockwise )
		var arc = m.min(PI, remainder/radius-PI);
		if (arc>aBtm) 
		{
			var tx = radius*m.cos(arc), ty = radius*m.sin(arc);
			if (fill) g.f(cfg.colorUnder);
			g.s(cfg.colorUnder).ss(lw)
			.mt(pBtm.x, pBtm.y)
			.lt(pBtm2.x, pBtm2.y)
			.arc(px, py, radius2, aBtm, arc, false)
			.lt(tx, ty)
			.arc(0,0, radius, arc, aBtm, true)
			.ef().es();
		}
		if (remainder>cfg.perimeterMin) 
		{
			//draw dashed line(s) on curved bottom part (dark side of the roll)
			var sheetArc = cfg.sheetLength/radius;//arc per sheet for current radius
			var firstArc = (cfg.sheetLength-rest)/radius;//arc of first dashed line (on top)
			var perspAngle = this.getPerspectiveAngle(0,radius)+2.5*PI;
			var arc = firstArc+sheetArc*m.ceil((aOrigin-firstArc)/sheetArc)-PI;
			g.s(cfg.colorLines).ss(lw).sd([4,6], 0);
			while (arc<PI) {
				var p1 = new Point(radius*m.cos(arc), radius*m.sin(arc));
				var p2 = new Point(px+radius2*m.cos(arc), py+radius2*m.sin(arc));
				g.mt(p1.x,p1.y).lt(p2.x,p2.y);
				arc += sheetArc;
			}
			g.sd();
		}
	
		//Draw side and hole
		if (remainder>=cfg.perimeterMin) 
		{
			if (fill) g.f(cfg.colorSide);
			g.s(cfg.colorSide).ss(lw).dc(0,0,radius).f(cfg.backgroundColor).dc(0,0,cfg.radiusMin);
		}
		else if (remainder>cfg.perimeterMin/4) 
		{
			//draw arc for side of last sheet
			var a = remainder/radius-PI;
			if (a>aTop) 
			{
				g.ef().s(cfg.colorSide).ss(lw)
				.arc(0,0,radius, aTop, a)
				.es();
			}
		}	
		//Draw trail
		if (fill) g.f(cfg.colorTrail);
		g.s(cfg.colorTrail).ss(lw);
		if (remainder<curveTopLen) {
			if (remainder>0) 
			{
				var ang = PI2*remainder/cfg.perimeterMin;
				var p = new Point(radius*m.cos(ang-PI), radius*m.sin(ang-PI));
				g.mt(-radius, 0)
				.lt(-radius, trailStraight)
				.lt(px-radius2, py+trailStraight*f)
				.lt(px-radius2, py)
				.arc(px, py, radius2, PI, ang+PI)
				.lt(p.x, p.y)
				.arc(0,0,radius, ang+PI, PI, true);
			} 
			else 
			{
				g.mt(-radius, -remainder)
				.lt(-radius,trailStraight)
				.lt(px-radius2, py+trailStraight*f)
				.lt(px-radius2, py-remainder*f);
			}
		} else {
			var perspAngle = this.getPerspectiveAngle(0,-radius)-PI5;
			if (perspAngle<-PI) perspAngle += PI2;
			g.mt(-radius, 0)
			.lt(-radius, trailStraight)
			.lt(px-radius2, py+trailStraight*f)
			.lt(px-radius2, py)
			.arc(px, py, radius2, PI, aTop)
			.lt(pTop.x, pTop.y)
			.arc(0,0,radius, aTop, PI, true);
		}
		g.cp().ef();
		
		//Draw (dashed) lines indicating sheet ends
		if (trail<cfg.rollLength+maxStraight)
		{
			//When out of paper, lines are still drawn, so this is not working properly
			//	but we dont see the lines (black on black) so it's ok..
			if (fill) g.s(cfg.colorLines);
			else g.s("yellow");
			g.ss(lw).sd([4,6], 0);
			//	straight part
			//var y0 = Math.max(rest,-remainder+cfg.sheetLength);// for no dashed line on last sheet
			var y0 = Math.max(rest,-remainder);
			var n = trailStraight/cfg.sheetLength;
			for (var i=0;i<n;i++) 
			{
				var len = i*cfg.sheetLength, y = y0+len;
				var p = this.projectXY(-radius, y);
				g.mt(-radius, y)
				.lt(p.x,p.y);
			}
			//	curved part top
			if (remainder>cfg.sheetLength)// for no dashed line on last sheet
			//if (remainder>0)
			{
				for (var i=1;i<(rest+curveTopLen)/cfg.sheetLength;i++) 
				{
					var ang = m.PI+(i*cfg.sheetLength-rest)/radius;
					g.mt(radius*m.cos(ang), radius*m.sin(ang))
					.lt(px+radius2*m.cos(ang), py+radius2*m.sin(ang));
				}
			}
		}
		//
		this.dirty = true;
	}
	
	var r2d = 180/Math.PI;
	
	
	p.getPerspectiveAngle = function(x, y) 
	{
		var cfg = this.config, f = cfg.perspectiveFactor;
		var x2 = cfg.perspectiveOffsetX + x*f;
		var y2 = cfg.perspectiveOffsetY + y*f;
		return Math.atan2(y2-y,x2-x);
	}
	p.projectXY = function(x, y) 
	{
		var cfg = this.config, f = cfg.perspectiveFactor;
		var x2 = cfg.perspectiveOffsetX + x*f;
		var y2 = cfg.perspectiveOffsetY + y*f;
		return new Point(x2,y2);
	}
	
	var TRAIL = getQueryParam("cookie") || "TRAIL";
	
	window.Piece = Piece;
	

}(window));

