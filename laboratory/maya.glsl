
#define STEPS 100.
#define VOLUME 0.1
#define DENSITY .1
#define MIN_DIST 0.001
#define PI 3.14159
#define TAU (2.*PI)

// raymarch toolbox
float rng (vec2 seed) { return fract(sin(dot(seed*.1684,vec2(54.649,321.547)))*450315.); }
mat2 rot (float a) { float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }
float sdSphere (vec3 p, float r) { return length(p)-r; }
float sdCylinder (vec2 p, float r) { return length(p)-r; }
float sdDisk (vec3 p, vec3 s) { return max(max(length(p.xz)-s.x, s.y), abs(p.y)-s.z); }
float sdIso(vec3 p, float r) { return max(0.,dot(p,normalize(sign(p))))-r; }
float sdBox( vec3 p, vec3 b ) { vec3 d = abs(p) - b; return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0)); }
float sdTorus( vec3 p, vec2 t ) { vec2 q = vec2(length(p.xz)-t.x,p.y); return length(q)-t.y; }
float amod (inout vec2 p, float count) { float an = TAU/count; float a = atan(p.y,p.x)+an/2.; float c = floor(a/an); c = mix(c,abs(c),step(count*.5,abs(c))); a = mod(a,an)-an/2.; p.xy = vec2(cos(a),sin(a))*length(p); return c; }
float repeat (float v, float c) { return mod(v,c)-c/2.; }
vec2 repeat (vec2 v, float c) { return mod(v,c)-c/2.; }
vec3 repeat (vec3 v, float c) { return mod(v,c)-c/2.; }
float smoo (float a, float b, float r) { return clamp(.5+.5*(b-a)/r, 0., 1.); }
float smin (float a, float b, float r) { float h = smoo(a,b,r); return mix(b,a,h)-r*h*(1.-h); }
float smax (float a, float b, float r) { float h = smoo(a,b,r); return mix(a,b,h)+r*h*(1.-h); }
vec2 displaceLoop (vec2 p, float r) { return vec2(length(p.xy)-r, atan(p.y,p.x)); }
float fOpUnionStairs(float a, float b, float r, float n) {
	float s = r/n, u = b-r;
  return min(min(a,b), 0.5 * (u + a + abs ((mod (u - a + s, 2. * s)) - s)));
}
float map (vec3);
vec3 getNormal (vec3 p) { vec2 e = vec2(.01,0); return normalize(vec3(map(p+e.xyy)-map(p-e.xyy),map(p+e.yxy)-map(p-e.yxy),map(p+e.yyx)-map(p-e.yyx))); }
vec3 getNormal2 (vec3 pos) {
  vec2 e = vec2(1.0,-1.0)*0.5773*0.0005;
  return normalize( e.xyy*map( pos + e.xyy ) +
  e.yyx*map( pos + e.yyx ) +
  e.yxy*map( pos + e.yxy ) +
  e.xxx*map( pos + e.xxx ) );
}

void orbit (inout vec3 p) {
  float t = iGlobalTime * .5;
  p.xz *= rot(t*.9);
  p.xy *= rot(t*.6);
  p.yz *= rot(t*.3);
}

// noise
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
float fbm (vec3 p) {
  float value = 0.0;
  float amplitud = .5;
  for (float i = 1.; i <= 3.; i++) {
		// p.x += iGlobalTime;
		// p.y += iGlobalTime;
    value += amplitud * noiseIQ(p);
    p *= 2.;
    amplitud *= .5;
  }
  return value;
}
float pattern (vec3 p) {
  vec3 q = vec3(fbm(p), fbm(p+vec3(10.5,51.5,7.5423)), fbm(p+vec3(1501.24,1254.324,658.6)));
	q.xz *= rot(iGlobalTime*.2);
  return fbm(p + 4. * q);
}

void camera (inout vec3 p) {
	p.yz *= rot((PI*(u_mouse.y-.5)));
  p.xz *= rot((.5*PI*(u_mouse.x-.5)));
}

float map (vec3 pos) {

  float scene = 1000.;
  vec3 p;
	float w, h;

	p = pos;
	float nn = pattern(p);
	nn = 1.-sin(nn*PI);
	// pos.y += nn;
	// pos.yz *= rot(nn*.2);

  // ground
  scene = min(scene, pos.y);

  // trees
  p = pos;
  amod(p.xz, 32.);
  p.x -= 30.;
  p.y -= 1.;
  scene = min(scene, sdSphere(p, 4.));

  // temple steps
  // p = pos;
  // h = .5;
  // float cy = floor(p.y/h);
  // w = 5. - cy*.45;
  // scene = min(scene, max(max(abs(p.x),abs(p.z))-w, abs(p.y)-5.));

  // temple stairs
  p = pos;
  amod(p.xz, 4.);
  p.x -= 6.;
  scene = min(scene, max((p.y-5.), max(p.x+p.y, abs(p.z)-1.)));

	p = pos;
	p.y -= 2.;
	scene = max(scene, -sdSphere(p, 4.+nn*.5));
	scene = min(scene, sdSphere(p, 2.+nn*2.));

	// calendar
  vec3 eye = vec3(0,2,-15);
	p = pos;
	p -= eye;
	p.z -= 2.5;
	scene = min(scene, sdDisk(p.xzy, vec3(.5, .25,.1)));

	vec3 loop = p;
	loop.xy = displaceLoop(loop.xy, 1.);
	p = loop;
	h = .2;
	scene = min(scene, sdBox(p, vec3(.01,100,h)));
	p.y = repeat(p.y, .25);
	p.x += .14;
	scene = min(scene, sdBox(p, vec3(.05,.1,h)));
	p = loop;
	p.y = repeat(p.y, .05);
	p.x += .05;
	scene = min(scene, sdDisk(p.xzy, vec3(.01,0.,h)));

  return scene;
}

void main () {
  vec2 uv = (gl_FragCoord.xy-.5*iResolution.xy)/iResolution.y;
  vec3 eye = vec3(0,2,-10);
  vec3 ray = normalize(vec3(uv, 1.));
	float dither = rng(uv.yy+uv.xx);
  camera(eye); camera(ray);
  vec3 pos = eye;
  float shade = 0.;
  for (float i = 0.; i <= 1.; i += 1./STEPS) {
    float dist = map(pos);
		if (dist < VOLUME) {
			shade = 1.-i;
			break;
		}
    // if (dist < VOLUME) shade += DENSITY;
		// if (shade >= 1.) break;
    dist *= .2 + .01 * dither;
    dist = max(MIN_DIST, dist);
    pos += ray * dist;
  }
  vec3 color = vec3(1);
  vec3 normal = getNormal(pos);
  vec3 view = normalize(eye-pos);
  // color = normal*.5+.5;
  color *= dot(view, normal)*.5+.5;
  color *= shade;
  // color = pow(color, vec3(1./2.));
  gl_FragColor = vec4(color, 1);
}
