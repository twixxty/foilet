var Config = {};

//base:
Config.debug = false;
Config.framerate = 60;
Config.backgroundColor = '#000';

//piece:
Config.dashPattern = [4,6];
Config.colorLines = "#000000";
Config.colorTrail = "#FFFFFF";
Config.colorSide = "#DBDBDB";
Config.colorUnder = "#535353";

Config.perspectiveFactor = .92;
Config.perspectiveOffsetX = -222;
Config.perspectiveOffsetY = -45;

Config.cookieEnabled = true;//state of roll will be remembered on exit

Config.trail = 250;//initial length of trailing paper
Config.trailMin = 225;

Config.viewportOriginal = [800,600];
Config.rollX = 107;
Config.rollY = -5;

Config.radiusMax = 225;//maximum radius van rol (compleet opgerold)
Config.radiusMin = 70;//radius van binnen-rol (zwart gat)

Config.sheetLength = 350;//pixels
Config.sheetCount = 100;//aantal vellen op rol

Config.scrollspeed = 10;
Config.keyspeed = 20;//aantal pixels af/oprollen per keypress (down/up)
Config.autospeed = 20;//for debug
Config.friction = .97;;//zowel voor normaal als terug zwiepen
Config.minSpeed = .5;//zowel voor normaal als terug zwiepen
Config.maxSpeed = 50;//zowel voor normaal als terug zwiepen
Config.gravity = 1.1;//voor vallen van laatste velletjes

Config.doubleClickInterval = 350;//voor terug naar volle rol bij lege rol