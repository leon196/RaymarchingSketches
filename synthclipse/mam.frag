// uniform float synth_Time;
// uniform vec2 synth_Resolution;
// uniform float BPM; //! slider[10, 100, 200]
// #define Beat (synth_Time*BPM/60.)

// uniform vec2 iResolution; // size of the preview
// uniform vec2 iMouse; // cursor in normalized coordinates [0, 1)
// uniform float iGlobalTime; // clock in seconds
precision mediump float;
#define synth_Resolution iResolution
#define Beat mod(iGlobalTime, 100.)

const float PI = 3.14159;
const float TAU = 6.28318;
const float aPaperIn = 3.;
const float aStairIn = 6.;
const float aLampsIn = 12.;
const float aLibraryIn = 18.;

// begin


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
    pTorus.y += innerRadius - roomHeight / 2.;
    pTorus.x += toroidalRadius;
    pTorus.xz = toroidal(pTorus.xz, toroidalRadius);
    //pTorus.z += Beat * .01;
    pTorus.z *= toroidalRadius;
    pTorus.xzy = pTorus.xyz;
    // pTorus.xz *= rot(Beat*.05*speed);

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
    float chairSide = step(0., p.y);

    float lod = 100.;
    // float changeSeed = floor(fract(Beat*.1)*lod)/lod;
    float changeSeed = 0.;//fract(Beat*.1);
    seed += changeSeed;
    float salt = rng(seed);
    float pepper = rng(seed+vec2(.132,0.9023));
    float spice = rng(seed+vec2(.672,0.1973));
    // salt = .5+.5*sin((salt+Beat)*10.);
    // pepper = .5+.5*sin((pepper+Beat)*10.);
    // spice = .5+.5*sin((spice+Beat)*10.);


    // ground
    scene = min(scene, p.x+roomHeight*.5);

    float lamp = 1000.;
    float lampHeight = .3+.6*salt;
    float lampThin = .007;
    float lampFootThin = .005;
    float lampHeadRadius = .04+.08*pepper;
    float lampHeadHeight = .03+.1*salt;
    float lampHeadCoef = .1+.3*pepper;
    float lampFootHeight = .03+.08*spice;
    float lampFootCoef = .1+.5*pepper;
    float lampFootCount = 3.+floor(5.*spice);
    float smoothFactor = .02;
    // lamp trunk
    p.y -= .75;
    p.z -= .5;
    p.x += roomHeight*.5;
    lamp = min(lamp, max(sdist(p.yz, lampThin), abs(p.x-lampHeight*.5-lampFootHeight*lampFootCoef)-lampHeight*.5));
    pp = p;
    p.x -= lampHeight;
    // lamp head
    lamp = min(lamp, max(sdist(p.yz, lampHeadRadius+p.x*lampHeadCoef), abs(p.x)-lampHeadHeight));
    // lamp foot
    p = pp;
    p.x -= lampFootThin*2.;
    amod(p.yz, lampFootCount);
    p.y -= lampFootHeight;
    pp = p;
    p.x += (p.y-lampFootHeight)*lampFootCoef;
    lamp = smin(lamp, max(sdist(p.xz, lampFootThin), abs(p.y)-lampFootHeight), smoothFactor);
    p = pp;
    // lamp foot balls
    p.y -= lampFootHeight;
    lamp = smin(lamp, sdist(p, lampFootThin*2.), smoothFactor);

    float table = 1000.;
    float tableHeight = .1+.2*salt;
    float tableThin = .01+.03*pepper;
    float tableWidth = .1+.2*spice;
    float tableDepth = .1+.1*salt;
    float tableLegThin = .005+.01*pepper;
    p = pRoom;
    p.x += roomHeight/2.-tableHeight;
    p.z += .5-tableDepth;
    pp = p;
    p.yz *= rot((salt*2.-1.)*.2);
    table = min(table, sdBox(p, vec3(tableThin, tableWidth, tableDepth)));
    p.yz = abs(p.yz)-vec2(tableWidth, tableDepth)+tableLegThin;
    p.x += tableHeight*.5;
    table = min(table, sdBox(p, vec3(tableHeight*.5, tableLegThin, tableLegThin)));

    float plate = 1000.;
    float plateRadius = .45 * min(tableDepth, tableWidth);
    float plateThin = .002;
    float plateCurveHeight = .01;
    float plateForkThin = .001;
    float plateForkHeight = .03+.03*salt;
    float plateForkWidth = .001+.003*salt;
    // plate
    p = pp;
    p.y = abs(p.y) - tableWidth * .5;
    p.x -= tableThin;
    pp = p;
    p.x -= plateThin+plateCurveHeight;
    p.x += cos(length(p.yz)*20.)*plateCurveHeight;
    plate = min(plate, max(sdist(p.yz, plateRadius), abs(p.x)-plateThin));
    // food
    float food = 1000.;
    float foodRadiusRatio = .3+.6*mix(pepper, spice, chairSide);
    float foodRepeat = .01;
    float foodEatenRatio = .1+.9*mix(salt, pepper, chairSide);
    ppp = p;
    p.yz = repeat(p.yz, foodRepeat);
    food = min(food, sdist(p, foodRepeat));
    p = ppp;
    food = max(food, sdist(p, plateRadius*foodRadiusRatio));
    food = max(food, step(foodEatenRatio, dot(normalize(p.yz), vec2(1,0))));
    // forks
    p = pp;
    p.x -= plateForkThin*2.;
    p.z = abs(p.z)-plateRadius*1.2;
    p.yz *= rot((spice*.5+.5)*.2);
    p.x -= (sin(p.y*50.)*.5+.5)*.01;
    plateForkWidth *= 1.+.5*sin(p.y*100.);
    plate = min(plate, sdBox(p, vec3(plateForkThin, plateForkHeight, plateForkWidth)));

    float chair = 1000.;
    p = pRoom;
    float chairHeight = .2+.1*mix(salt, pepper, chairSide);
    float chairWidth = .05+.1*mix(pepper, spice, chairSide);
    float chairLegThin = .002+.005*mix(spice, salt, chairSide);
    float chairSitThin = .01;
    float chairBackHeight = .05;
    p.z += .5-tableDepth;
    p.y = abs(p.y) - tableWidth - chairWidth*2.;
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
    float doorThin = .01;
    float doorPadding = .05+.1*salt;
    float doorLockWidth = .02;
    float doorLockThin = .002;
    float doorLockHeight = .002;
    amod(p.xz, roomCount.x);
    pp = p;
    p.z -= doorWidth;
    vec3 lod2 = 1./vec3(1.,roomCount.y, roomCount.x);
    float openRatio = sin(Beat*.2+salt*TAU);
    p.yz *= rot(-PI/2.+.2*openRatio);
    p.z += doorWidth;
    p.x -= innerRadius-roomHeight+doorHeight;
    door = min(door, sdBox(p, vec3(doorHeight, doorThin, doorWidth)));
    door = max(door, -sdBox(p, vec3(doorHeight-doorPadding, 1., doorWidth-doorPadding)));
    p.z += doorWidth-doorPadding/2.;
    p.y = abs(p.y) - doorLockWidth - doorThin - doorLockHeight;
    door = min(door, sdist(p, doorLockWidth));
    p.y += doorLockWidth;
    p.x *= 1.-clamp(.02/abs(p.x),0.,1.);
    door = min(door, max(sdist(p.xz, doorLockWidth), abs(p.y)-doorLockHeight));
    p = pp;
    p.x -= innerRadius-roomHeight+doorHeight;
    wall.x = max(wall.x, -sdBox(p, vec3(doorHeight, .1, doorWidth)));

    float window = 1000.;
    float windowHeight = .4;
    float windowWidth = .8;
    float windowThin = .02;
    float windowPadding = .02;
    float windowRepeatThin = .004;
    float windowSmooth = .01;
    p = pTorus;
    seed.x = amodIndex(p.xz, roomCount.x);
    seed.y = floor((p.y+repeaty/2.)/repeaty);
    seed += changeSeed;
    salt = rng(seed);
    pepper = rng(seed+vec2(.132,0.9023));
    spice = rng(seed+vec2(.672,0.1973));
    vec2 windowRepeatWidth = vec2(.1+.4*salt, .1+.3*pepper);
    p.y = repeat(p.y+repeaty/2., repeaty);
    amod(p.xz, roomCount.x);
    p.x -= innerRadius-roomHeight/2.;
    wall.y = max(wall.y, -sdBox(p, vec3(windowHeight, windowWidth, 1.)));
    window = min(window, sdBox(p, vec3(windowHeight, windowWidth, windowThin)));
    window = max(window, -sdBox(p, vec3(windowHeight-windowPadding, windowWidth-windowPadding, 1.)));
    pp = p;
    p.xy = repeat(p.xy, windowRepeatWidth);
    ppp = p;
    // p.xz *= rot(PI/4.);
    window = min(window, sdBox(p, vec3(windowRepeatThin, windowHeight, windowRepeatThin)));
    p = ppp;
    p.yz *= rot(PI/4.);
    window = smin(window, sdBox(p, vec3(windowHeight, windowRepeatThin, windowRepeatThin)), windowSmooth);
    p = pp;
    window = max(window, sdBox(p, vec3(windowHeight, windowWidth, 2.)));

    scene = min(scene, min(wall.x, wall.y));
    scene = min(scene, window);
    scene = min(scene, door);
    scene = min(scene, lamp);
    scene = min(scene, chair);
    scene = min(scene, paint);
    scene = min(scene, table);
    scene = min(scene, plate);
    scene = min(scene, food);

    return scene;
}


float mapStairs (vec3 pos) {
  float scene = 1000.;
  float wallThin = .2;
  float wallRadius = 8.;
  float wallOffset = .2;
  float wallCount = 10.;
  float floorThin = .1;
  float stairRadius = 5.;
  float stairHeight = .4;
  float stairCount = 40.;
  float stairDepth = .31;
  float bookCount = 100.;
  float bookRadius = 9.5;
  float bookSpace = 1.75;
  vec3 bookSize = vec3(1.,.2,.2);
  vec3 panelSize = vec3(.03,.2,.7);
  vec2 cell = vec2(1.4,3.);
  float paperRadius = 4.;
  vec3 paperSize = vec3(.3,.01,.4);
  vec3 p;

  // move it
  pos.y += Beat * .1;

  // twist it
  // pos.xz *= rot(pos.y*.05+time*.1);
  // pos.xz += normalize(pos.xz) * sin(pos.y*.5+time);

  // holes
  float holeWall = sdist(pos.xz, wallRadius);
  float holeStair = sdist(pos.xz, stairRadius);

  // walls
  p = pos;
  amod(p.xz, wallCount);
  p.x -= wallRadius;
  scene = min(scene, max(-p.x, abs(p.z)-wallThin));
  scene = max(scene, -sdist(pos.xz, wallRadius-wallOffset));

  // floors
  p = pos;
  p.y = repeat(p.y, cell.y);
  float disk = max(sdist(p.xz, 1000.), abs(p.y)-floorThin);
  disk = max(disk, -sdist(pos.xz, wallRadius));
  scene = min(scene, disk);

  // stairs
  p = pos;
  float stairIndex = amod(p.xz, stairCount);
  p.y -= stairIndex*stairHeight;
  p.y = repeat(p.y, stairCount*stairHeight);
  float stair = sdBox(p, vec3(100,stairHeight,stairDepth));
  scene = min(scene, max(stair, max(holeWall, -holeStair)));
  p = pos;
  p.xz *= rot(PI/stairCount);
  stairIndex = amod(p.xz, stairCount);
  p.y -= stairIndex*stairHeight;
  p.y = repeat(p.y, stairCount*stairHeight);
  stair = sdBox(p, vec3(100,stairHeight,stairDepth));
  scene = min(scene, max(stair, max(holeWall, -holeStair)));
  p = pos;
  p.y += stairHeight*.5;
  p.y -= stairHeight*stairCount*atan(p.z,p.x)/TAU;
  p.y = repeat(p.y, stairCount*stairHeight);
  scene = min(scene, max(max(sdist(p.xz, wallRadius), abs(p.y)-stairHeight), -holeStair));

  // books
  p = pos;
  p.y -= cell.y*.5;
  vec2 seed = vec2(floor(p.y/cell.y), 0);
  p.y = repeat(p.y, cell.y);
  p.xz *= rot(PI/wallCount);
  seed.y += amod(p.xz, wallCount)/10.;
  seed.y += floor(p.z/(bookSize.z*bookSpace));
  p.z = repeat(p.z, bookSize.z*bookSpace);
  float salt = rng(seed);
  bookSize.x *= .5+.5*salt;
  bookSize.y += salt;
  bookSize.z *= .5+.5*salt;
  p.x -= bookRadius + wallOffset;
  p.x += cos(p.z*2.) - bookSize.x;
  p.x += .01*smoothstep(.99,1.,sin(p.y*(1.+10.*salt)));
  scene = min(scene, max(sdBox(p, vec3(bookSize.x,100.,bookSize.z)), p.y-bookSize.y));

  // panel
  p = pos;
  p.y = repeat(p.y, cell.y);
  p.xz *= rot(PI/wallCount);
  amod(p.xz, wallCount);
  p.x -= wallRadius;
  float panel = sdBox(p, panelSize);
  float pz = p.z;
  p.z = repeat(p.z, .2+.3*salt);
  panel = min(panel, max(sdBox(p, vec3(.1,.1,.04)), abs(pz)-panelSize.z*.8));
  scene = min(scene, panel);

  // papers
  p = pos;
  p.y -= stairHeight;
  p.y += Beat*.2;
  p.xz *= rot(PI/stairCount);
  float ry = 8.;//stairHeight*stairCount;
  float iy = floor(p.y/ry);
  salt = rng(vec2(iy));
  float a = iy;
  p.xz -= vec2(cos(a),sin(a))*paperRadius;

  p.y = repeat(p.y, ry);
  p.xy *= rot(p.z);
  p.xz *= rot(PI/4.+salt+Beat*.1);
  scene = min(scene, sdBox(p, paperSize));

  return scene;
}

float sdStairs (vec3 p) {
    return max(abs(p.x)-1., abs(p.y + 1. + floor(p.z) * .2)-.2);
}

float sdPaper (vec3 pos) {
    pos.z -= 1.;
    float id = floor(pos.z);
    pos.y += id * .2 + .35 + sin(id+Beat) * .3;
    pos.x += sin(id+Beat*2.+sin(pos.y+Beat))*.3;
    pos.z = repeat(pos.z, 1.);
    vec3 p = pos;
    float d = sin(pos.x*2. - Beat);
    p.xz *= rot(d*.9);
    p.yz *= rot(d*2.6+id);
    return max(0.,max(abs(p.y),max(abs(p.x)-.1, abs(p.z)-.1)));
}

float sdLibrary (vec3 pos) {
  float scene = max(0., -abs(pos.x) + 1.5);
  // pos.y += sin(pos.z*.5 + Beat) * .5;
  vec3 id = vec3(floor(pos.yz),0);
  // pos.z += mix(1.,-1.,mod(id.x, 2.))*Beat;
  vec3 p = pos;
  p.yz = repeat(p.yz, 1.);
  scene = max(scene, min(-abs(p.y) + .49, -abs(p.z) + .49));
  id.z = floor(pos.z/.1);
  float offset = .05 * sin((id.z+id.y+id.x) * 4.);
  p = pos;
  p.z = repeat(p.z, .1);
  scene = min(scene, max(-abs(p.x) + 1.7 - offset, abs(p.z)-.04));
	scene = max(scene, p.y + 100.);
  return scene;
}

float sdLamp (vec3 pos) {
  vec3 p = pos;
  p.y -= 2. - floor(pos.z/4.) * .2*4.;
  p.z = repeat(p.z, 4.);
  float scene = max(sdist(p.xz, .01), -p.y);
  scene = min(scene, sdSphere(p, .1));
  return scene;
}

float sdDoor (vec3 pos) {
  pos.z -= 2.;
  pos.y += .5;
  vec3 p = pos;
  float scene = max(abs(p.z) - .1, min(-abs(p.x)+1., -abs(p.y)+.5));
  scene = max(scene, -sdist(p.xy-vec2(0.,.5), 1.));
  return scene;
}

float map (vec3 p) {
  p.xz *= rot(sin(p.z * .2) * .5);
  p.y -= Beat * .2;
  p.z += Beat;
	return min(min(min(sdLamp(p), sdStairs(p)), sdPaper(p)), sdLibrary(p));
}

float hardShadow (vec3 pos, vec3 light) {
    vec3 dir = normalize(light - pos);
    float maxt = length(light - pos);
    float t = .05;
    for (float i = 0.; i <= 1.; i += 1./30.) {
        float dist = map(pos + dir * t);
        if (dist < .001) return 0.;
        t += dist;
        if (t >= maxt) break;
    }
    return 1.;
}
vec3 getNormal (vec3 p) { vec2 e = vec2(.001,0); return normalize(vec3(map(p+e.xyy)-map(p-e.xyy),map(p+e.yxy)-map(p-e.yxy),map(p+e.yyx)-map(p-e.yyx))); }

vec3 getCamera (vec3 eye, vec3 lookAt, vec2 uv) {
  vec3 forward = normalize(lookAt - eye);
  vec3 right = normalize(cross(forward, vec3(0,1,0)));
  vec3 up = normalize(cross(right, forward));
  return normalize(.6 * forward + uv.x * right + uv.y * up);
}

vec4 getLight (vec3 pos, vec3 eye, float ao) {
  vec3 light = vec3(.1,1,-1);
  vec3 normal = getNormal(pos);
  vec3 view = normalize(eye-pos);
  float shade = ao;//dot(normal, view);
  shade *= hardShadow(pos, light);
  shade = smoothstep(.0, .9, shade);
  // shade = sqrt(shade);
  return vec4(vec3(shade),1.);
}

vec4 raymarch () {
  vec2 uv = (gl_FragCoord.xy-.5*synth_Resolution.xy)/synth_Resolution.y;
  float dither = rng(uv.xx+uv.yy);
  vec3 eye = vec3(0,0,0);
  vec3 ray = getCamera(eye, vec3(0,0,1), uv);
  vec3 pos = eye;
  float shade = 0.;
  for (float i = 0.; i <= 1.; i += 1./100.) {
    float dist = map(pos);
		if (dist < .001) {
			shade = 1.-i;
			break;
		}
    dist *= .5 + .1 * dither;
    pos += ray * dist;
  }

  return getLight(pos, eye, shade);
}

void main () {
  gl_FragColor = raymarch();
}
