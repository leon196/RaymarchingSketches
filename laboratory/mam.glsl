
// using code from IQ, Mercury, LJ, Duke, Koltes

#define STEPS 100.
#define VOLUME 0.001
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
float getShadow (vec3 pos, vec3 at, float k) {
    vec3 dir = normalize(at - pos);
    float maxt = length(at - pos);
    float f = 01.;
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

void applyDonut (inout vec3 pos, float donut, float radius, float cell, float thin) {
	pos.x += donut;
	pos.y += radius;
	pos.xz = displaceLoop(pos.xz, donut);
	pos.z *= donut;
	pos.xzy = pos.xyz;
}

// width,height,thin,depth
float windowCross (vec3 pos, vec4 size, float salt) {
  vec3 p = pos;
  float sx = size.x * (.6+salt*.4);
  float sy = size.y * (.3+salt*.7);
  vec2 sxy = vec2(sx,sy);
  p.xy = repeat(p.xy+sxy/2., sxy);
  float scene = sdBox(p, size.zyw*2.);
  scene = min(scene, sdBox(p, size.xzw*2.));
  scene = max(scene, sdBox(pos, size.xyw));
  return scene;
}

float window (vec3 pos, vec2 dimension, float salt) {
  float width = dimension.x;
  float height = dimension.y;
  float thin = .008;
  float depth = .04;
  float depthCadre = .06;
  float padding = .08;
  float scene = windowCross(pos, vec4(width,height,thin,depth), salt);
  float cadre = sdBox(pos, vec3(width, height, depthCadre));
  cadre = max(cadre, -sdBox(pos, vec3(width-padding, height-padding, depthCadre*2.)));
  scene = min(scene, cadre);
  return scene;
}

float map (vec3 pos) {
  vec3 camOffset = vec3(-3,-0,10.);

  float scene = 1000.;
  vec3 p = pos + camOffset;
	float donut = 30.;
	float cell = 4.;
	float height = 1.;
	float thin = .04;
	float radius = 15.;
  float speed = 1.;
	float segments = PI*radius;
  float indexX, indexY, salt;
  vec2 seed;
	vec3 pDonut = p;
  applyDonut(pDonut, donut, radius, cell, thin);

	// walls
	p = pDonut;
  float py = p.y + time * speed;
  indexY = floor(py / (cell+thin));
	p.y = repeat(py, cell+thin);
	scene = max(abs(p.y)-thin, sdCylinder(p.xz, radius));
	amod(p.xz, segments);
	p.x -= radius;
	scene = min(scene, max(abs(p.z)-thin, p.x));

	// horizontal
  p = pDonut;
	p.xz *= rot(PI/segments);
  py = p.y + time * speed;
  indexY = floor(py / (cell+thin));
	p.y = repeat(py, cell+thin);
	indexX = amodIndex(p.xz, segments);
	amod(p.xz, segments);
	seed = vec2(indexX, indexY);
	salt = rng(seed);
	p.x -= radius;

	// window
  p.x +=  height;
	scene = max(scene, -sdBox(p, vec3(.75, 1., .5)));
  scene = min(scene, window(p.xzy, vec2(.75,.5), salt));

	// vertical
  p = pDonut;
	p.xz *= rot(PI/segments);
  py = p.y + time * speed;
  indexY = floor(py / (cell+thin));
	p.y = repeat(py, cell+thin);
	indexX = amodIndex(p.xz, segments);
	amod(p.xz, segments);
	seed = vec2(indexX, indexY);
	salt = rng(seed);
	p.x -= radius;

	// window
  p.x +=  height;
	scene = max(scene, -sdBox(p, vec3(.75, 1., .5)));
  scene = min(scene, window(p.xzy, vec2(.75,.5), salt));

  p = pos;
  float px = p.x;
  float rx = 3.;
  float sx = floor(px/rx);
  float nx = rng(vec2(sx,sx)*100.);
  p.x = repeat(px, rx);

  return scene;
}

void main () {
  vec2 uv = (gl_FragCoord.xy-.5*iResolution.xy)/iResolution.y;
  vec3 eye = vec3(0,0,-20);
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
    dist *= .5 + .1 * dither;
    pos += ray * dist;
  }
  vec3 color = vec3(1);
  // vec3 normal = getNormal(pos);
  // vec3 view = normalize(eye-pos);
  // color = normal*.5+.5;
  // color *= dot(view, normal)*.5+.5;
	vec3 light = vec3(20.,40.,0.);
  color *= shade;
	float shadow = getShadow(pos, light, 32.);
	color *= shadow;
  color = pow(color, vec3(1./2.));
	// color = step(.01,color);
  gl_FragColor = vec4(color, 1);
}
