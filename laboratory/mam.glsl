
// using code from IQ, Mercury, LJ, Duke, Koltes

#define STEPS 100.
#define VOLUME 0.001
#define DENSITY .1
#define MIN_DIST 0.001
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
vec2 repeat (vec2 v, float c) { return mod(v,c)-c/2.; }
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
float getShadow (vec3 pos, vec3 at, float k) {
    vec3 dir = normalize(at - pos);
    float maxt = length(at - pos);
    float f = 1.;
    float t = VOLUME*50.;
    for (float i = 0.; i <= 1.; i += 1./15.) {
        float dist = map(pos + dir * t);
        if (dist < VOLUME) return 0.;
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

void camera (inout vec3 p) {
	p.yz *= rot(PI/8.);
}

float applyDonut (inout vec3 pos, float donut, float radius, float cell, float thin) {
	float speed = 4.;
	pos.x += donut;
	pos.y += radius;
	pos.xz = displaceLoop(pos.xz, donut);
	pos.z *= donut;
	pos.xzy = pos.xyz;
	float indexY = floor((pos.y+time*speed) / (cell+thin));
	pos.y = repeat(pos.y+time*speed, cell+thin);
	pos.xz *= rot(-time/speed/2.);
	return indexY;
}

float map (vec3 pos) {
  float scene = 1000.;
  vec3 p = pos;
	float donut = 30.;
	float cell = 4.;
	float height = 1.;
	float thin = .05;
	float radius = 15.;
	float segments = PI*radius;
	vec3 pDonut = p;
	float indexY = applyDonut(pDonut, donut, radius, cell, thin);

	// rooms
	p = pDonut;
	scene = max(abs(p.y)-thin, sdCylinder(p.xz, radius));
	amod(p.xz, segments);
	p.x -= radius;
	scene = min(scene, max(abs(p.z)-thin, p.x));

	// elements
	p = pDonut;
	p.xz *= rot(PI);
	float indexX = amodIndex(p.xz, segments);
	amod(p.xz, segments);
	vec2 seed = vec2(indexX, indexY);
	float salt = rng(seed);
	p.x -= radius - .1 - 1. * salt;
	p.z -= sin(salt*10.)*.5;
	vec3 pp = p;

	// boxes
	scene = min(scene, sdBox(p, vec3(.1+.4*salt)));
	p = pp;
	p.x += .5;
	scene = min(scene, sdBox(p, vec3(.2,.5,.5)*(.5+.5*salt)));
	p = pp;
	p.x += 1.;
	scene = min(scene, sdBox(p, vec3(.5,.2,.5)));

	// window
	p = pp;
	p.x += .5;
	p.y += cell/2.;
	scene = max(scene, -sdBox(p, vec3(.5,1.,2.)));
	p = pp;
	float cros = sdBox(p, vec3(.01,2.,2.));
	// scene = min(scene, cros);

  return scene;
}

void main () {
  vec2 uv = (gl_FragCoord.xy-.5*iResolution.xy)/iResolution.y;
  vec3 eye = vec3(-10,-6,-20);
  vec3 ray = normalize(vec3(uv, 1.75));
	camera(eye);
	camera(ray);
	float dither = rng(uv+fract(time));
  vec3 pos = eye;
  float shade = 0.;
  for (float i = 0.; i <= 1.; i += 1./STEPS) {
    float dist = map(pos);
		if (dist < VOLUME) {
			shade = 1.-i;
			break;
		}
    dist *= .6 + .1 * dither;
    dist = max(MIN_DIST, dist);
    pos += ray * dist;
  }
  vec3 color = vec3(1);
  // vec3 normal = getNormal(pos);
  // vec3 view = normalize(eye-pos);
  // color = normal*.5+.5;
  // color *= dot(view, normal)*.5+.5;
	vec3 light = vec3(0.,40.,-10.);
  color *= shade;
	float shadow = getShadow(pos, light, 32.);
	color *= shadow;
  color = pow(color, vec3(1./2.));
	// color = step(.01,color);
  gl_FragColor = vec4(color, 1);
}
