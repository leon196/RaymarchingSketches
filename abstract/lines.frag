precision mediump float;

/*{ "audio": true }*/

uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;
uniform sampler2D backbuffer;
uniform sampler2D spectrum;
uniform sampler2D samples;
uniform float volume;

#define repeat(v,r) (mod(v+r/2.,r)-r/2.)
#define PI 3.14159
#define TAU (PI*2.)

vec2 angleToDir (float angle, float radius) { return vec2(cos(angle),sin(angle))*radius; }
float rng (vec2 seed) { return fract(sin(dot(seed*.1,vec2(324.654,156.546)))*46556.24); }
mat2 rot (float a) { float c=cos(a),s=sin(a); return mat2(c,s,-s,c); }
float sphere (vec3 p, float r) { return length(p)-r; }
float cylinder (vec2 p, float r) { return length(p)-r; }
float iso (vec3 p, float r) { return dot(p, normalize(sign(p)))-r; }
float disk (vec3 p, float r, float h) { return max(length(p.xy)-r, abs(p.z)-h); }
float torus (vec3 p, vec2 t) { vec2 q = vec2(length(p.xz)-t.x,p.y); return length(q)-t.y; }
vec2 toroidal (vec2 p, float r) { return vec2(length(p.xy)-r, atan(p.y,p.x)); }
float smoo (float a, float b, float r) { return clamp(.5+.5*(b-a)/r,0.,1.); }
float smin (float a, float b, float r) { float h = smoo(a,b,r); return mix(b,a,h)-r*h*(1.-h); }
float amod (inout vec2 p, float c) {
	float ca = (2.*3.14159)/c;
	float a = atan(p.y,p.x)+ca*.5;
	float index = floor(a/ca);
	a = mod(a,ca)-ca*.5;
	p = vec2(cos(a),sin(a))*length(p);
	return index;
}
vec3 lookAt (vec3 eye, vec3 target, vec2 uv) {
  vec3 forward = normalize(target-eye);
  vec3 right = normalize(cross(vec3(0,1,0), forward));
  vec3 up = normalize(cross(forward, right));
  return normalize(forward + uv.x * right + uv.y * up);
}
void orbit (inout vec3 eye) {
  eye.xy *= rot(mouse.y*2.-1.);
  eye.xz *= rot(mouse.x*2.-1.);
}

float map (vec3 pos) {
  vec3 p, pp;
	float index;

  float interval = 2.;
  float interval2 = 1.;
  float polar = 5.;
  float polar2 = 3.;
	float thin = .01;
	float blend = .2;
	float radius = .05;
	float space = .05;

  float abstract = 1000.;
  p = pos;
  index = amod(p.xz, polar);
	float x = p.x-time*.2;
	index = floor(x/interval)*2.;
	p.x = repeat(x, interval);
  p.yz = repeat(p.yz, interval);
	abstract = min(cylinder(p.zy, thin), abstract);
	abstract = min(cylinder(p.xy, thin), abstract);
	p = abs(p);
	p.yx *= rot(time*.1+index);
	p.zx *= rot(time*.2+index);
	p.zy *= rot(time*.3+index);
	amod(p.xz, polar2);
  abstract = min(cylinder(p.zy, thin), abstract);
  abstract = min(cylinder(p.xz, thin), abstract);
  abstract = min(cylinder(p.yz, thin), abstract);
	p.x = repeat(p.x, interval2);
  abstract = smin(sphere(p, radius), abstract, blend);
  abstract = max(-iso(p, radius*1.6), abstract);
  // abstract = max(abstract, -(abs(p.x)-space));

  return abstract;
}

vec3 raymarch (vec3 eye, vec3 ray, float dither) {
  vec3 color = vec3(0.);
  float dist = 0.;
  float volume = 0.;
  for (float i = 0.; i <= 1.; i += 1./30.) {
  	float dist = map(eye);
  	if (dist < 0.001) {
      color = vec3(1.-i);
			break;
  	}
  	dist *= .9 + .1 * dither;
  	eye += ray * dist;
  }
  return color;
}

void main () {
	vec2 uv = gl_FragCoord.xy/resolution.xy;
	vec2 viewport = (gl_FragCoord.xy-.5*resolution.xy)/resolution.y;
  vec3 origin = vec3(0,2,-5);
  orbit(origin);
  vec3 ray = lookAt(origin, vec3(0), viewport);
  float dither = rng(viewport+fract(time));
  vec4 color = vec4(raymarch(origin, ray, dither), 1);
  gl_FragColor = color;
}
