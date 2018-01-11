precision mediump float;

uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

#define PI 3.14159
#define TAU (PI*2.)
#define repeat(v,r) (mod(v+r/2.,r)-r/2.)
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
  return normalize(forward * .5 + uv.x * right + uv.y * up);
}
void orbit (inout vec3 eye) {
	eye.xz *= rot(mouse.x*2.-1.);
	eye.zy *= rot(-(mouse.y*2.-1.));
}
struct Shape {
  float dist, density, friction;
  vec3 color;
};

void add (inout Shape a, Shape b, float smoothFactor) {
  float blend = smoo(b.dist, a.dist, smoothFactor);
  a.color = mix(a.color, b.color, blend);
  a.density = mix(a.density, b.density, blend);
  a.friction = mix(a.friction, b.friction, blend);
  a.dist = smin(a.dist, b.dist, smoothFactor);
}

Shape map (vec3 pos) {
  Shape scene;
  scene.dist = 1000.;
  scene.color = vec3(1);
  scene.friction = .2;
  scene.density = .01;
  vec3 p, pp;
	float shape = 1000.;
  float interval = .6;
  float polar = 5.;
  float radius = 2.;
	float thin = .005;
	float diskRadius = .4;
	float diskThin = .01;
	scene.dist = sphere(pos, radius);

	p = pos;
	float index = amod(p.xz, polar);
	p = abs(p);
	p.yz *= rot(time*.1);
	p.xz *= rot(time*.2);
	p.yx *= rot(time*.3);
	p = repeat(p-time*.5, interval);
	shape = min(shape, cylinder(p.xz, thin));
	shape = min(shape, cylinder(p.yz, thin));
	shape = min(shape, cylinder(p.yx, thin));
	pp = p;
	pp.x = repeat(pp.x+time*.2, .1);
	shape = min(shape, disk(pp.zyx, .02, thin*.5));
	pp = p;
	pp.y = repeat(pp.y+time*.2, .1);
	shape = min(shape, disk(pp.xzy, .02, thin*.5));
	pp = p;
	pp.z = repeat(pp.z+time*.2, .1);
	shape = min(shape, disk(pp, .02, thin*.5));
	p.yz *= rot(time*.9);
	p.xz *= rot(time*.6);
	p.yx *= rot(time*.3);
	diskRadius *= 1.-clamp(length(pos)*.5, 0., 1.);
	shape = min(shape, max(disk(p, diskRadius, thin), -disk(p, diskRadius-diskThin, thin*2.)));
	shape = min(shape, max(disk(p.xzy, diskRadius, thin), -disk(p.xzy, diskRadius-diskThin, thin*2.)));
	shape = min(shape, max(disk(p.zyx, diskRadius, thin), -disk(p.zyx, diskRadius-diskThin, thin*2.)));
	// shape = min(shape, iso(p, .1));

	scene.dist = max(scene.dist, shape);

  return scene;
}

vec3 raymarch (vec2 coord) {
	vec2 viewport = (coord.xy-.5*resolution.xy)/resolution.y;
	vec3 origin = vec3(0,1,-2);
	orbit(origin);
	vec3 eye = origin;
	vec3 ray = lookAt(origin, vec3(0), viewport);
	float dither = rng(viewport+fract(time));
  vec3 color = vec3(0.);
  float volume = 0.;
  for (float i = 0.; i <= 1.; i += 1./50.) {
  	Shape shape = map(eye);
  	if (shape.dist < 0.001) {
      color += shape.color * shape.friction * mix(1., 1.-i, shape.friction);
      volume += shape.friction;
      if (volume >= 1.) {
        break;
      }
  	}
    shape.dist = max(shape.dist, shape.density);
  	shape.dist *= .9 + .1 * dither;
  	eye += ray * shape.dist;
  }
  return color;
}

void main () {
  gl_FragColor = vec4(raymarch(gl_FragCoord.xy), 1);
}
