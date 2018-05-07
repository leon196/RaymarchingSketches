precision mediump float;

#define iResolution iResolution
#define time mod(iTime,103.)

const float PI = 3.14159;
const float TAU = 6.28318;
const float aFadeIn1 = 6.;
const float aLampsIn = 20.;
const float aLibraryIn = 28.;
const float aLibrarySwingIn = 50.;
const float aLibraryTwistIn = 40.;
const float aRotate = 80.;
const float aDoor = 60.;
const float aPaper1 = 64.;
const float aPaper2 = 68.;
const float aPaper3 = 75.;
const float aPaper4 = 80.;
const float aDoor1 = 60.;
const float aDoor2 = 70.;
const float aDoor3 = 75.;
const float aDoor4 = 80.;
const float aDoor5 = 85.;
const float toroidalRadius = 30.;
const float innerRadius = 15.;
const vec2 roomCount = vec2(58., 90.);
const float roomHeight = 1.;
const float roomThin = .01;

#define anim(start,delay) smoothstep(start, start+delay, time)
#define repeat(p,c) (mod(p,c)-c/2.)
#define sdist(p,r) (length(p)-r)

float rng (vec2 seed) { return fract(sin(dot(seed*.1684,vec2(54.649,321.547)))*450315.); }
mat2 rot (float a) { float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }
float sdBox( vec3 p, vec3 b ) { vec3 d = abs(p) - b; return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0)); }
float amod (inout vec2 p, float count) { float an = TAU/count; float a = atan(p.y,p.x)+an/2.; float c = floor(a/an); c = mix(c,abs(c),step(count*.5,abs(c))); a = mod(a,an)-an/2.; p.xy = vec2(cos(a),sin(a))*length(p); return c; }
float amodIndex (vec2 p, float count) { float an = TAU/count; float a = atan(p.y,p.x)+an/2.; float c = floor(a/an); c = mix(c,abs(c),step(count*.5,abs(c))); return c; }
vec2 toroidal (vec2 p, float r) { return vec2(length(p.xy)-r, atan(p.y,p.x)); }
vec3 getCamera (vec3 eye, vec3 lookAt, vec2 uv) {
	vec3 forward = normalize(lookAt - eye);
	vec3 right = normalize(cross(forward, vec3(0,1,0)));
	vec3 up = normalize(cross(right, forward));
	return normalize(.6 * forward + uv.x * right + uv.y * up);
}

float mapRooms (vec3 pos) {

	float scene = 1000.;
	vec3 p = pos;
	vec3 pRoom = pos;
	vec3 pWall = pos;
	vec2 seed;
	float repeaty = toroidalRadius*TAU/roomCount.y;

	// toroidal distortion
	vec3 pTorus = p;
	pTorus.y += innerRadius + roomHeight / 2.75;
	pTorus.x += toroidalRadius;
	pTorus.xz = toroidal(pTorus.xz, toroidalRadius);
	pTorus.z += time * .03 + anim(aDoor2, 20.);
	pTorus.z *= toroidalRadius;
	pTorus.xzy = pTorus.xyz;
	pTorus.xz *= rot(anim(aDoor4, 30.) * 5.);

	// walls
	p = pTorus;
	p.y = repeat(p.y, repeaty);
	vec2 wall = vec2(1000.);
	wall.x = max(abs(p.y)-roomThin, sdist(p.xz, innerRadius));
	amod(p.xz, roomCount.x);
	p.x -= innerRadius;
	wall.y = max(abs(p.z)-roomThin, p.x);
	pWall = p;

	// room cell
	p = pTorus;
	p.xz *= rot(PI/roomCount.x);
	float py = p.y+repeaty/2.;
	seed.y = floor(py/repeaty);
	p.y = repeat(py, repeaty);
	seed.x = amod(p.xz, roomCount.x);
	p.x -= innerRadius-roomHeight/2.;

	pRoom = p;
	float chairSide = step(0., p.x);

	float salt = rng(seed);
	float pepper = rng(seed+vec2(.612,0.5023));
	float spice = rng(seed+vec2(.698,0.756));

	// ground
	scene = min(scene, p.x+roomHeight*.5);

	float table = 1000.;
	float tableHeight = .2+.1*salt;
	float tableThin = .001+.001*pepper;
	float tableWidth = .1+.2*spice;
	float tableLegThin = .005+.003*pepper;
	p = pRoom;
	p.x += roomHeight/2.-tableHeight;
	p.yz *= rot((salt*2.-1.)*.2);
	table = min(table, max(abs(p.x)-tableThin, sdist(p.yz, tableWidth)));
	p.yz *= rot(pepper*TAU);
	p.yz = abs(p.yz)-tableWidth*.5+tableLegThin;
	p.x += tableHeight*.5;
	table = min(table, sdBox(p, vec3(tableHeight*.5, tableLegThin, tableLegThin)));

	float chair = 1000.;
	p = pRoom;
	float chairHeight = .15+.07*mix(salt, pepper, chairSide);
	float chairWidth = .06+.07*mix(pepper, spice, chairSide);
	float chairLegThin = .002+.005*mix(spice, salt, chairSide);
	float chairSitThin = .01;
	float chairBackHeight = .05;
	p.yz *= rot(sin(salt * TAU));
	p.z = abs(p.z) - tableWidth - chairWidth*2.;
	p.yz *= rot(sin(mix(salt, pepper, chairSide)*TAU)*.6 + PI/2.);
	p.x -= chairHeight;
	p.x += roomHeight/2.;
	chair = min(chair, sdBox(p, vec3(chairSitThin, chairWidth, chairWidth)));
	chair = min(chair, sdBox(p+vec3(-chairHeight+chairBackHeight,chairWidth-chairLegThin,0), vec3(chairBackHeight, chairLegThin, chairWidth)));
	float chairArm = step(0.,p.y);
	p.yz = abs(p.yz)-chairWidth+chairLegThin;
	p.x += chairArm * chairHeight * .5;
	chair = min(chair, sdBox(p, vec3(chairHeight*mix(1.,.5,chairArm), chairLegThin, chairLegThin)));

	float door = 1000.;
	p = pTorus;
	seed.y = floor(p.y/repeaty);
	p.y = repeat(p.y, repeaty);
	p.xz *= rot(PI/roomCount.x);
	seed.x = amodIndex(p.xz, roomCount.x);
	salt = rng(seed);
	pepper = rng(seed+vec2(.132,0.9023));
	spice = rng(seed+vec2(.672,0.1973));
	float doorWidth = .2+.05*pepper;
	float doorHeight = .3+.15*spice;
	amod(p.xz, roomCount.x);
	p.x -= innerRadius-roomHeight+doorHeight;
	wall.x = max(wall.x, -sdBox(p, vec3(doorHeight, .1, doorWidth)));
	p.x += .2;
	p.z = abs(p.z)-.4;
	wall.x = max(wall.x, -sdBox(p, vec3(doorHeight, .1, doorWidth * .5)));

	// window
	p = pTorus;
	seed.x = amodIndex(p.xz, roomCount.x);
	seed.y = floor((p.y+repeaty/2.)/repeaty);
	salt = rng(seed);
	pepper = rng(seed+vec2(.132,0.9023));
	spice = rng(seed+vec2(.672,0.1973));
	vec2 windowRepeatWidth = vec2(.2+.2*salt, .4+.4*pepper);
	p.y = repeat(p.y+repeaty/2., repeaty);
	amod(p.xz, roomCount.x);
	p.x -= innerRadius-roomHeight/2.;
	wall.y = max(wall.y, -sdBox(p, vec3(windowRepeatWidth.x, windowRepeatWidth.y, 1.)));

	return min(scene, min(chair, min(table, min(wall.x, wall.y))));
}

float sdStairs (vec3 p) {
	float stairs = max(abs(p.x)-1., abs(p.y + 1. + floor(p.z) * .2)-.2);
	stairs = max(stairs, -(p.y + p.z * .2 + 1.));
	stairs = max(stairs, p.z-aDoor);
	return stairs;
}

float sdPaper (vec3 pos) {
	pos.z -= 3.;
	float z = pos.z;
	float door = 1.-smoothstep(aDoor - 6., aDoor - 3., pos.z) * (1.-smoothstep(aDoor + 3., aDoor + 6., pos.z));
	pos.z -= time * 2.;
	float id = floor(pos.z/.5);
	pos.y += min(id, aDoor) * .1 + .35 + min(time, aDoor+1.) * .4 + sin(id*.5+time) * .3 * door;
	pos.y -= anim(aDoor, 1.);
	pos.xy *= rot(sin(pos.z * .3 + time));
	pos.x += sin(id*.5+time*2.+sin(pos.y+time))*.6*door;
	pos.z = repeat(pos.z, .5);
	vec3 p = pos;
	float d = sin(pos.x*2. - time);
	p.x = mix(p.x, abs(p.x), step(aPaper1, z)) - 2. * (1.-smoothstep(z - 10., z, aPaper1));
	p.y = mix(p.y, abs(p.y), step(aPaper2, z)) - 2. * (1.-smoothstep(z - 10., z, aPaper2));
	p.x = mix(p.x, abs(p.x), step(aPaper3, z)) - 2. * (1.-smoothstep(z - 10., z, aPaper3));
	p.y = mix(p.y, abs(p.y), step(aPaper4, z)) - 2. * (1.-smoothstep(z - 10., z, aPaper4));
	p.xz *= rot(d*.9);
	p.yz *= rot(d*2.6+id);
	float paper = max(0.,max(abs(p.y),max(abs(p.x)-.1, abs(p.z)-.1)));
	paper = max(paper, id+8.);
	return paper;
}

float sdLibrary (vec3 pos) {
	float scene = max(0., -abs(pos.x) + 1.5);
	float a = 1.-anim(aLibraryIn + abs(floor(pos.z)-25.)*.4, 10.);
	pos.y += a * 50.;
	pos.y -= 2.5;
	vec3 id = vec3(floor(pos.yz),0);
	pos.y += mix(1.,-1.,mod(id.y, 2.))*sin(time) * anim(aLibrarySwingIn, 5.);
	vec3 p = pos;
	p.y += id.y * .2;
	float y = p.y;
	id.x = floor(p.y);
	p.yz = repeat(p.yz, 1.);
	scene = max(scene, min(-abs(p.y) + .49, -abs(p.z) + .49));
	id.z = floor(pos.z/.1);
	float offset = .05 * sin((id.z+id.y+id.x) * 4.);
	p = pos;
	p.z = repeat(p.z, .1);
	scene = min(scene, max(-abs(p.x) + 1.7 - offset, abs(p.z)-.04));
	scene = max(scene, abs(pos.x) - 2.);
	scene = max(scene, y);
	scene = max(scene, pos.z-aDoor);
	return scene;
}

float sdLamp (vec3 pos) {
	vec3 p = pos;
	float a = anim(aLampsIn, 5.);
	float z = floor(pos.z/2.);
	p.y -= 20. - 18. * a - z * .2*2.;
	p.z = repeat(p.z, 2.);
	p.y -= 10.;
	p.xy *= rot(sin(time * 2. + z)*.07);
	p.y += 10.;
	p.xz *= rot(p.y * 8. + time);
	float scene = sdist(p,.2);
	amod(p.xz, 5.);
	p.x -= max(.01, .19 * (1.-clamp(p.y*2., 0., 1.)));
	scene = min(scene, max(sdist(p.xz, .01*a), -p.y));
	scene = mix(10., scene, anim(aLampsIn, 1.));
	scene = max(scene, pos.z - aDoor);
	return scene;
}

float sdDoor (vec3 pos) {
	pos.z -= aDoor;
	pos.y += .1 + aDoor*.2;
	vec3 p = pos;
	p.x = abs(p.x) - .5;
	p.x -= .5;
	p.xz *= rot(.6+smoothstep(aDoor-2., aDoor + 2., time) * 1.5);
	p.x += .5;
	p.y -= .5;
	float scene = sdBox(p, vec3(.5,1,.02));
	scene = min(scene, max(sdist(p.xy-vec2(0,1.), .5), abs(p.z)-.02));
	float x = p.x;
	p.x = repeat(p.x, .2);
	scene = max(scene, -abs(p.x)+.02);
	p.x = x;
	p.z += .04;
	p.y = abs(p.y)-.775;
	p.xy *= rot(-.1);
	scene = min(scene, sdBox(p, vec3(.39,.1,.01)));
	p.x = abs(p.x) - .2;
	scene = min(scene, max(sdist(p.xy, .02), abs(p.z)-.04));
	return scene;
}

vec2 map (vec3 pos) {
	vec3 p = pos;
	float fade = (1.-smoothstep(aPaper1, aPaper1 + 5.,time));
	p.xz *= rot(sin(p.z * .2 + time) * .35*(1.-clamp(length(pos.z)/50., 0., 1.)));
	p.xy *= rot(sin(-p.z * .2 + time)*.5 * anim(aLibraryTwistIn, 5.) * fade);
	p.y -= min(time, aDoor) * .2;
	p.y -= sin(pos.z * .4) * .3 + pos.z * pos.z * .01;
	p.z += time;
	float paper = sdPaper(p);
	float dist = 100.;
	vec2 sdf = vec2(0);
	if (time < aDoor + 2.) {
		dist = min(min(min(sdLamp(p), sdStairs(p)), sdLibrary(p)), sdDoor(p));
		sdf.y = step(dist, paper);
	} else {
		pos.zy *= rot(.3);
		pos.y -= 1.7;
		dist = mapRooms(pos+vec3(0,.25,0));
		sdf.y = step(dist, paper) * 2.;
	}
	sdf.x = min(paper, dist);
	return sdf;
}

void animCamera (inout vec3 eye, inout vec3 target) {
	eye.y = mix(eye.y, 1., anim(aDoor1, 5.));
	target.y = mix(target.y, 1.1, anim(aDoor1, 5.));
	eye = mix(eye, vec3(0,.9,-1.5), anim(aDoor1, 5.));
	eye = mix(eye, vec3(0,12.,-1.5), anim(aDoor4, 5.));
	eye = mix(eye, vec3(6,12.,-1.5), anim(aDoor5, 5.));
	target = mix(target, vec3(0,1,3), anim(aDoor3, 5.));
	target = mix(target, vec3(0,1,8), anim(aDoor4, 5.));
	target = mix(target, vec3(-15,0,3), anim(aDoor5, 5.));
}

vec4 raymarch () {
	vec2 uv = (gl_FragCoord.xy-.5*iResolution.xy)/iResolution.y;
	float dither = rng(uv.xx+uv.yy);
	vec3 eye = vec3(0,1,-1);
	vec3 target = vec3(0,0,1);
	animCamera(eye, target);
	vec3 ray = getCamera(eye, target, uv);
	vec3 pos = eye;
	float shade = 0.;
	float total = 0.;
	vec2 sdf;
	for (float i = 0.; i <= 1.; i += 1./100.) {
		sdf = map(pos);
		float dist = sdf.x;
		if (dist < .0001) { shade = 1.-i; break; }
		if (total > 100.) { shade = 0.; break; }
		total += dist;
		dist *= .5 + .1 * dither;
		pos += ray * dist;
	}

	shade *= 1. - smoothstep(50., 99., total);
	shade *= mix(step(sdf.y,0.5), 1., anim(aFadeIn1, 5.));
	shade *= mix(anim(aDoor + 1., 5.), 1., step(sdf.y, 1.5));
	shade *= smoothstep(0.1, 1., time) * (1.-smoothstep(100., 103., time));
	return vec4(smoothstep(.0, .8, shade));
}

void main () {
	gl_FragColor = raymarch();
}
