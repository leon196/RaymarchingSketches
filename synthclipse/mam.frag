// uniform float synth_Time;
// uniform vec2 synth_Resolution;
// uniform float BPM; //! slider[10, 100, 200]
// #define Beat (synth_Time*BPM/60.)

// uniform vec2 iResolution; // size of the preview
// uniform vec2 iMouse; // cursor in normalized coordinates [0, 1)
// uniform float iGlobalTime; // clock in seconds
precision mediump float;
#define synth_Resolution iResolution
#define Beat (120.+mod(iGlobalTime,20.))
// #define Beat (70.+sin(iGlobalTime))
// #define Beat 100.

const float PI = 3.14159;
const float TAU = 6.28318;
const float aFadeIn1 = 6.;
const float aLampsIn = 20.;
const float aLibraryIn = 20.;
const float aLibrarySwingIn = 60.;
const float aLibraryTwistIn = 45.;
const float aRotate = 80.;
const float aDoor = 70.;
const float aPaper1 = 80.;
const float aPaper2 = 90.;
const float aPaper3 = 100.;
const float aPaper4 = 110.;
const float aDoor1 = 70.;
const float aDoor2 = 80.;
const float aDoor3 = 85.;
const float aDoor4 = 95.;
const float aDoor5 = 105.;

// begin

#define anim(start,delay) smoothstep(start, start+delay, Beat)

float rng (vec2 seed) { return fract(sin(dot(seed*.1684,vec2(54.649,321.547)))*450315.); }
mat2 rot (float a) { float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }
float sdSphere (vec3 p, float r) { return length(p)-r; }
float sdCylinder (vec2 p, float r) { return length(p)-r; }
float sdDisk (vec3 p, vec3 s) { return max(max(length(p.xz)-s.x, s.y), abs(p.y)-s.z); }
float sdIso(vec3 p, float r) { return max(0.,dot(p,normalize(sign(p))))-r; }
float sdBox( vec3 p, vec3 b ) { vec3 d = abs(p) - b; return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0)); }
float sdTorus( vec3 p, vec2 t ) { vec2 q = vec2(length(p.xz)-t.x,p.y); return length(q)-t.y; }
float amod (inout vec2 p, float count) { float an = TAU/count; float a = atan(p.y,p.x)+an/2.; float c = floor(a/an); c = mix(c,abs(c),step(count*.5,abs(c))); a = mod(a,an)-an/2.; p.xy = vec2(cos(a),sin(a))*length(p); return c; }
float amodIndex (vec2 p, float count) { float an = TAU/count; float a = atan(p.y,p.x)+an/2.; float c = floor(a/an); c = mix(c,abs(c),step(count*.5,abs(c))); return c; }
float smoo (float a, float b, float r) { return clamp(.5+.5*(b-a)/r, 0., 1.); }
float smin (float a, float b, float r) { float h = smoo(a,b,r); return mix(b,a,h)-r*h*(1.-h); }
float smax (float a, float b, float r) { float h = smoo(a,b,r); return mix(a,b,h)+r*h*(1.-h); }
vec2 toroidal (vec2 p, float r) { return vec2(length(p.xy)-r, atan(p.y,p.x)); }
void moda(inout vec2 p, float count) {
	float index = floor(mod(atan(p.y,p.x) / TAU * count + .5, count));
	p *= rot(- index / count * TAU);
}

#define repeat(p,c) (mod(p,c)-c/2.)
#define sdist(p,r) (length(p)-r)

float mapRooms (vec3 pos) {

    float scene = 1000.;
    vec3 p = pos;
    vec3 pp = pos;
    vec3 ppp = pos;
    vec3 pRoom = pos;
    vec3 pWall = pos;

    float toroidalRadius = 30.;
    float innerRadius = 15.;

    float speed = 0.;

    vec2 roomCount = vec2(58., 90.);
    float roomHeight = 1.;
    float roomThin = .01;

    vec2 seed;
    float repeaty = toroidalRadius*TAU/roomCount.y;

    // toroidal distortion
    vec3 pTorus = p;
    pTorus.y += innerRadius + roomHeight / 2.75;// * 1.56;
    pTorus.x += toroidalRadius;
    pTorus.xz = toroidal(pTorus.xz, toroidalRadius);
    pTorus.z += Beat * .03;
    pTorus.z *= toroidalRadius;
    pTorus.xzy = pTorus.xyz;
    // pTorus.xz *= rot(Beat*.05);

    // walls
    p = pTorus;
    p.y = repeat(p.y, repeaty);
    vec2 wall = vec2(1000.);
    wall.x = max(abs(p.y)-roomThin, sdCylinder(p.xz, innerRadius));
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

    float lod = 100.;
    // float changeSeed = floor(fract(Beat*.1)*lod)/lod;
    float changeSeed = 0.;//fract(Beat*.1);
    seed += changeSeed;
    float salt = rng(seed);
    float pepper = rng(seed+vec2(.612,0.5023));
    float spice = rng(seed+vec2(.698,0.756));


    // ground
    scene = min(scene, p.x+roomHeight*.5);

    float table = 1000.;
    float tableHeight = .1+.2*salt;
    float tableThin = .01+.01*pepper;
    float tableWidth = .1+.2*spice;
    float tableDepth = .1+.1*salt;
    float tableLegThin = .005+.01*pepper;
    p = pRoom;
    p.x += roomHeight/2.-tableHeight;
    pp = p;
    p.yz *= rot((salt*2.-1.)*.2);
    table = min(table, sdBox(p, vec3(tableThin, tableWidth, tableDepth)));
    p.yz = abs(p.yz)-vec2(tableWidth, tableDepth)+tableLegThin;
    p.x += tableHeight*.5;
    table = min(table, sdBox(p, vec3(tableHeight*.5, tableLegThin, tableLegThin)));

    float chair = 1000.;
    p = pRoom;
    float chairHeight = .15+.07*mix(salt, pepper, chairSide);
    float chairWidth = .025+.07*mix(pepper, spice, chairSide);
    float chairLegThin = .002+.005*mix(spice, salt, chairSide);
    float chairSitThin = .01;
    float chairBackHeight = .05;
    p.z = abs(p.z) - tableWidth - chairWidth*2.;
    p.yz *= rot(mix(salt, pepper, chairSide)*TAU);
    p.x -= chairHeight;
    p.x += roomHeight/2.;
    // sit
    chair = min(chair, sdBox(p, vec3(chairSitThin, chairWidth, chairWidth)));
    // back
    chair = min(chair, sdBox(p+vec3(-chairHeight+chairBackHeight,chairWidth-chairLegThin,0), vec3(chairBackHeight, chairLegThin, chairWidth)));
    // legs and arm
    float chairArm = step(0.,p.y);
    p.yz = abs(p.yz)-chairWidth+chairLegThin;
    p.x += chairArm * chairHeight * .5;
    chair = min(chair, sdBox(p, vec3(chairHeight*mix(1.,.5,chairArm), chairLegThin, chairLegThin)));

    float paint = 1000.;
    float paintWidth = .05+0.1*salt;
    float paintHeight = .1+.2*pepper;
    float paintDepth = .001;
    p = pRoom;
    p.y -= 1.03;
    p.z += .5;
    p.xz *= rot((salt*2.-1.)*.1);
    paint = min(paint, sdBox(p, vec3(paintHeight, paintDepth, paintWidth)));

    float door = 1000.;
    p = pTorus;
    seed.y = floor(p.y/repeaty);
    p.y = repeat(p.y, repeaty);
    p.xz *= rot(PI/roomCount.x);
    seed.x = amodIndex(p.xz, roomCount.x);
    seed += changeSeed;
    salt = rng(seed);
    pepper = rng(seed+vec2(.132,0.9023));
    spice = rng(seed+vec2(.672,0.1973));
    float doorWidth = .15+.05*pepper;
    float doorHeight = .3+.15*spice;
    amod(p.xz, roomCount.x);
    p.x -= innerRadius-roomHeight+doorHeight;
    wall.x = max(wall.x, -sdBox(p, vec3(doorHeight, .1, doorWidth)));

    scene = min(scene, min(wall.x, wall.y));
    scene = min(scene, chair);
    scene = min(scene, paint);
    scene = min(scene, table);

    return scene;
}

float sdStairs (vec3 p) {
	float stairs = max(abs(p.x)-1., abs(p.y + 1. + floor(p.z) * .2)-.2);
	stairs = max(stairs, -(p.y + p.z * .2 + 1.));
	stairs = max(stairs, p.z-aDoor);
    return stairs;
}

float sdPaper (vec3 pos) {
    pos.z -= 1.;
		float z = pos.z;
		float door = 1.-smoothstep(aDoor - 3., aDoor, pos.z) * (1.-smoothstep(aDoor, aDoor + 3., pos.z));
		pos.z -= Beat * 2.;
    float id = floor(pos.z);
    pos.y += min(id, aDoor) * .2 + .35 + min(Beat, aDoor+1.) * .4 + sin(id+Beat) * .3 * door;
		pos.y -= anim(aDoor, 1.);
		pos.xy *= rot(sin(pos.z * .3 + Beat));

    // pos.y += id * .2 + .35 + Beat * .4 + sin(id+Beat) * .3;
    pos.x += sin(id+Beat*2.+sin(pos.y+Beat))*.3*door;
    pos.z = repeat(pos.z, 1.);
    vec3 p = pos;
    float d = sin(pos.x*2. - Beat);
		p.x = mix(p.x, abs(p.x), step(aPaper1, z)) - 2. * (1.-smoothstep(z - 10., z, aPaper1));
		p.y = mix(p.y, abs(p.y), step(aPaper2, z)) - 2. * (1.-smoothstep(z - 10., z, aPaper2));
		p.x = mix(p.x, abs(p.x), step(aPaper3, z)) - 2. * (1.-smoothstep(z - 10., z, aPaper3));
		p.y = mix(p.y, abs(p.y), step(aPaper4, z)) - 2. * (1.-smoothstep(z - 10., z, aPaper4));
		// p.y -= door * 2.5;
		vec3 pp = p;
    p.xz *= rot(d*.9);
    p.yz *= rot(d*2.6+id);
    float paper = max(0.,max(abs(p.y),max(abs(p.x)-.1, abs(p.z)-.1)));
		paper = max(paper, id+4.);
		return paper;
}

float sdLibrary (vec3 pos) {
  float scene = max(0., -abs(pos.x) + 1.5);
	float a = 1.-anim(aLibraryIn + abs(floor(pos.z)-25.)*.4, 10.);
	pos.y += a * 50.;
	pos.y -= 2.5;
  // pos.y += sin(pos.z*.5 + Beat) * .5;
  vec3 id = vec3(floor(pos.yz),0);
  pos.y += mix(1.,-1.,mod(id.y, 2.))*sin(Beat) * anim(aLibrarySwingIn, 5.);
  // pos.z += mix(1.,-1.,mod(id.x, 2.))*Beat;
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
	p.xy *= rot(sin(Beat + z)*.07);
	p.y += 10.;
	p.xz *= rot(p.y * 8. + Beat);
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
	p.xz *= rot(.5+smoothstep(aDoor-2., aDoor + 2., Beat) * 1.5);
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
	float door = 1. - anim(aDoor, 1.);
	float fade = (1.-smoothstep(aPaper1, aPaper1 + 5.,Beat));
  p.xz *= rot(sin(p.z * .2 + Beat) * .35);// * (1.-clamp(p.z/50.,0.,1.)) * door);
	p.xy *= rot(sin(-p.z * .2 + Beat)*.5 * anim(aLibraryTwistIn, 5.) * fade);
  p.y -= min(Beat, aDoor) * .2;
	p.y -= sin(pos.z * .4) * .3 + pos.z * pos.z * .01;
  p.z += Beat;
	float paper = sdPaper(p);
	float dist = 10.;
	vec2 m = vec2(0);
	if (Beat < aDoor + 2.) {
		dist = min(min(min(sdLamp(p), sdStairs(p)), sdLibrary(p)), sdDoor(p));
		m.y = step(dist, paper);
	} else {
		// pos.xz *= rot(Beat);
		pos.zy *= rot(.3);
		pos.y -= 1.7;//mix(0., 1.7, anim(aDoor+3., 1.));
		dist = min(dist, mapRooms(pos+vec3(0,.25,0)));
		m.y = step(dist, paper) * 2.;
	}
	m.x = min(paper, dist);
	return m;
}

float hardShadow (vec3 pos, vec3 light) {
    vec3 dir = normalize(light - pos);
    float maxt = length(light - pos);
    float t = .05;
    for (float i = 0.; i <= 1.; i += 1./10.) {
        float dist = map(pos + dir * t).x;
        if (dist < .01) return 0.;
        t += dist;
        if (t >= maxt) break;
    }
    return 1.;
}
vec3 getNormal (vec3 p) { vec2 e = vec2(.001,0); return normalize(vec3(map(p+e.xyy).x-map(p-e.xyy).x,map(p+e.yxy).x-map(p-e.yxy).x,map(p+e.yyx).x-map(p-e.yyx).x)); }

vec3 getCamera (vec3 eye, vec3 lookAt, vec2 uv) {
  vec3 forward = normalize(lookAt - eye);
  vec3 right = normalize(cross(forward, vec3(0,1,0)));
  vec3 up = normalize(cross(right, forward));
  return normalize(.6 * forward + uv.x * right + uv.y * up);
}

vec4 getLight (vec3 pos, vec3 eye, float ao) {
	float door1 = smoothstep(aDoor + 20., aDoor + 40., Beat);
  vec3 light = mix(vec3(.1,2,-2), vec3(.1,20., -4.), door1);
  // vec3 normal = getNormal(pos);
  // vec3 view = normalize(eye-pos);
  float shade = ao;// * dot(normal, view);
  // shade *= hardShadow(pos, light);
  shade = smoothstep(.0, .9, shade);
  shade = sqrt(shade);
  return vec4(vec3(shade),1.);
}

vec4 raymarch () {
  vec2 uv = (gl_FragCoord.xy-.5*synth_Resolution.xy)/synth_Resolution.y;
  float dither = rng(uv.xx+uv.yy);
  vec3 eye = vec3(0,1,-1);
	vec3 target = vec3(0,0,1);
	eye.y = mix(eye.y, 2., anim(aDoor, 5.));
	eye.y = mix(eye.y, .75, anim(aDoor2, 5.));
	target.y = mix(target.y, 1., anim(aDoor, 5.));
	eye = mix(eye, vec3(0,1.,-1.5), anim(aDoor3, 5.));
	eye = mix(eye, vec3(0,12.,-1.5), anim(aDoor4, 5.));
	target = mix(target, vec3(0,1,3), anim(aDoor3, 5.));
	target = mix(target, vec3(0,1,8), anim(aDoor4, 5.));
	target = mix(target, vec3(-15,0,3), anim(aDoor5, 5.));
	// eye = vec3(0,0,-1);
	// target = vec3(0,-1,1);
  vec3 ray = getCamera(eye, target, uv);
  vec3 pos = eye;
  float shade = 0.;
	float total = 0.;
	vec2 sdf;
  for (float i = 0.; i <= 1.; i += 1./100.) {
    sdf = map(pos);
		float dist = sdf.x;
		if (dist < .0001) {
			shade = 1.-i;
			break;
		}
		if (total > 100.) {
			shade = 0.;
			break;
		}
		total += dist;
    dist *= .5 + .1 * dither;
    pos += ray * dist;
  }

	shade *= 1. - smoothstep(50., 99., total);
	shade *= mix(1.-clamp(sdf.y,0.,1.), 1., anim(aFadeIn1, 5.));
	shade *= mix(1., anim(aDoor + 4., 5.), step(1.5, sdf.y));
  return getLight(pos, eye, shade);
}

void main () {
	vec4 color = raymarch();
	color *= smoothstep(0.1, 1., Beat);
  gl_FragColor = color;
}
