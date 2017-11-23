
// using code from IQ, Mercury, LJ, Duke, Koltes

#define STEPS 100.
#define VOLUME 0.0001
#define PI 3.14159
#define TAU (2.*PI)
#define time iGlobalTime

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
float repeat (float v, float c) { return mod(v,c)-c/2.; }
vec2 repeat (vec2 v, vec2 c) { return mod(v,c)-c/2.; }
vec3 repeat (vec3 v, float c) { return mod(v,c)-c/2.; }
float smoo (float a, float b, float r) { return clamp(.5+.5*(b-a)/r, 0., 1.); }
float smin (float a, float b, float r) { float h = smoo(a,b,r); return mix(b,a,h)-r*h*(1.-h); }
float smax (float a, float b, float r) { float h = smoo(a,b,r); return mix(a,b,h)+r*h*(1.-h); }
vec2 displaceLoop (vec2 p, float r) { return vec2(length(p.xy)-r, atan(p.y,p.x)); }
float hash (float n) { return fract(sin(n)*43758.5453); }
float noiseIQ( vec3 x ) {
  vec3 p = floor(x);
  vec3 f = fract(x);
  f = f*f*(3.0-2.0*f);
  float n = p.x + p.y*57.0 + 113.0*p.z;
  return mix(mix(mix( hash(n+0.0), hash(n+1.0),f.x),
  mix( hash(n+57.0), hash(n+58.0),f.x),f.y),
  mix(mix( hash(n+113.0), hash(n+114.0),f.x),
  mix( hash(n+170.0), hash(n+171.0),f.x),f.y),f.z);
}
float map (vec3);
float getShadow (vec3 pos, vec3 at, float k, float dither) {
    vec3 dir = normalize(at - pos);
    float maxt = length(at - pos);
    float f = 01.;
    float t = VOLUME*100.;
    for (float i = 0.; i <= 1.; i += 1./15.) {
        float dist = map(pos + dir * t);
        if (dist < VOLUME) return 0.;
        dist *= .9 + .1 * dither;
        f = min(f, k * dist / t);
        t += dist;
        if (t >= maxt) break;
    }
    return f;
}
vec3 getNormal (vec3 p) { vec2 e = vec2(.01,0); return normalize(vec3(map(p+e.xyy)-map(p-e.xyy),map(p+e.yxy)-map(p-e.yxy),map(p+e.yyx)-map(p-e.yyx))); }

void orbit (inout vec3 p) {
  float t = iGlobalTime * .5;
  p.xz *= rot(t*.9);
  p.xy *= rot(t*.6);
  p.yz *= rot(t*.3);
}

float stairs (vec3 pos, float height, float depth) {
  float scene = 1000.;
  scene = min(scene, sdBox(pos, vec3(100,height,depth)));
  return scene;
}

float map (vec3 pos) {
  float scene = 1000.;
  float radius = 8.;
  float radiusStairs = 6.;
  float radiusHeight = .2;
  float radiusDepth = 1.;
  float stairCount = 32.;
  float thin = .1;
  vec2 cell = vec2(2.,2.5);
  vec3 p;

  float hole1 = sdCylinder(pos.xz, radius);
  float hole2 = sdCylinder(pos.xz, radiusStairs);

  // pos.y += time;

  // walls
  p = pos;
  // p.xz *= rot(p.y*.1+time);
  amod(p.xz, radius*cell.x);
  p.x -= radius;
  scene = min(scene, max(-p.x, abs(p.z)-thin));
  scene = max(scene, -hole1);

  // floors
  p = pos;
  p.y = repeat(p.y, cell.y);
  float disk = max(sdCylinder(p.xz, 1000.), abs(p.y)-thin);
  disk = max(disk, -hole1);
  scene = min(scene, disk);

  // stairs
  p = pos;
  float stair = amodIndex(p.xz, stairCount);
  p.y = repeat(p.y, stairCount*radiusHeight);
  p.y += stair*radiusHeight;
  scene = min(scene, max(stairs(p, radiusHeight*.5, radiusDepth), max(hole1, -hole2)));
  // disk = max(sdCylinder(p.xz, 1000.), abs(p.y)-thin);
  // disk = max(disk, -hole2);
  // scene = min(scene, disk);

  return scene;
}

void main () {
  vec2 uv = (gl_FragCoord.xy-.5*iResolution.xy)/iResolution.y;
  vec3 eye = vec3(0,4,-5);
  float fov = .5;
  vec3 lookAt = vec3(0.);
  vec3 forward = normalize(lookAt - eye);
  vec3 right = normalize(cross(vec3(0,1,0), forward));
  vec3 up = normalize(cross(forward, right));
  vec3 ray = normalize(fov * forward + uv.x * right + uv.y * up);
	float dither = rng(uv+fract(time));
  vec3 pos = eye;
  float shade = 0.;
  for (float i = 0.; i <= 1.; i += 1./STEPS) {
    float dist = map(pos);
		if (dist < VOLUME) {
			shade = 1.-i;
			break;
		}
    dist *= .9 + .1 * dither;
    pos += ray * dist;
  }
  vec3 color = vec3(1);
  vec3 normal = getNormal(pos);
  vec3 view = normalize(eye-pos);
  shade *= dot(normal, view)*.5+.5;
  color *= shade;
  vec3 light = vec3(20.,20.,0.);
	// color *= getShadow(pos, light, 1., dither);
  // color = pow(color, vec3(1./2.));
  gl_FragColor = vec4(color, 1);
}
