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

void axis (inout Shape scene, vec3 p) {
  Shape shape;
  shape.friction = 1.;
  shape.density = .0;
  shape.dist = cylinder(p.yz, .001);
  shape.color = vec3(1,0,0);
  add(scene, shape, .0);
  shape.dist = cylinder(p.xz, .001);
  shape.color = vec3(0,1,0);
  add(scene, shape, .0);
  shape.dist = cylinder(p.yx, .001);
  shape.color = vec3(0,0,1);
  add(scene, shape, .0);
}

Shape map (vec3 pos) {
  Shape scene;
  scene.dist = 1000.;
  scene.color = vec3(1);
  scene.friction = 1.;
  scene.density = .0;
  vec3 p, pp;
  float index, interval, twist, polar, radius;

  twist = .2;
  interval = 2.;
  polar = 5.;
  radius = 1.;

  // axis(scene, pos);

  Shape abstract;
  abstract.color = vec3(1.);
  abstract.density = .03;
  abstract.friction = .04;
  p = pos;
  float dist = length(p);
  p.xz *= rot(dist*.1);
  p.xy *= rot(dist*.05);
  // p.y = repeat(p.y, 1.);
  pp = p;
  index = amod(p.xz, polar);
  p.x = repeat(p.x + time, interval);
  abstract.dist = disk(p.xzy, .7, .01);
  add(scene, abstract, .1);
  p.xz *= rot(time);
  p.xy *= rot(time+index);
  abstract.dist = sphere(p, .2);
  amod(p.xz, 5.);
  p.x -= .2 + .2 * sin(time+index);
  abstract.dist = smin(abstract.dist, sphere(p, .2), .2);
  abstract.dist = min(abstract.dist, cylinder(p.zy, .1-.2*clamp(abs(p.x)*.5,0.,1.)));
  abstract.dist = max(abstract.dist, -pp.y);
  add(scene, abstract, .1);



  // p = pp;
  // p.xz = toroidal(p.xz, 1.);
  // pp = p;
  // float x = p.x - time + interval/2.;
  // index = floor((p.x - time)/interval);
  // p.y += sin(p.z*10.+time*4.)*(clamp(length(pos)*.1,0.,1.))*.4;
  // // p.y += p.x;
  // p.x = repeat(x, interval);
  // abstract.dist = max(cylinder(p.xy, .4), abs(p.y)-.001);
  // add(scene, abstract, .1);

	// p = pp;
  // interval = PI;
  // p.x += p.z;
  // p.x = repeat(p.x - time, interval);
  // abstract.dist = max(cylinder(p.xy, .2), abs(p.y)-.01);
  // add(scene, abstract, .2);

  // p.xz *= rot(p.y*twist+time*.2);
  // index = amod(p.xz, polar);
  // p.x -= radius + sin(p.y+index) * .5;
  // float shell = cylinder(p.xz, .3 + sin(p.y*.2+index) * .05);
  // p.xz *= rot(p.y);
  // index = amod(p.xz, 3.);
  // p.x -= .1 + sin(p.y+time) * .05;
  // float inner = cylinder(p.xz, .1 + sin(p.y+index) * .05);
  // add(scene, max(shell, -inner), .01, vec3(1), .1);

  return scene;
}

vec3 raymarch (vec3 eye, vec3 ray, float dither) {
  vec3 color = vec3(0.);
  float dist = 0.;
  float volume = 0.;
  for (float i = 0.; i <= 1.; i += 1./30.) {
  	Shape shape = map(eye);
  	if (shape.dist < 0.01) {
      color += shape.color * shape.friction * mix(1., 1.-i, shape.friction);
      volume += shape.friction;
      if (volume >= 1.) {
        break;
      }
  	}
    shape.dist = max(shape.dist, shape.density);
  	shape.dist *= .9 + .1 * dither;
    // shape.dist *= .5;
  	eye += ray * shape.dist;
    dist += shape.dist;
    if (dist > 100.) {
      break;
    }
  }
  return color;
}

vec4 sound (vec2 uv) {
  float x = uv.x;
  float y = uv.y;
  x = abs(atan(uv.y, uv.x)) / TAU;
  y = length(uv) - .1;
  float fft = texture2D(spectrum, vec2(x)).x;
  vec3 color = vec3(abs((1./resolution.y)/(fft-y)));
  // color += .1/volume;
  return vec4(color, 1);
}

vec4 feedback (vec2 uv) {
  float dither = rng(uv+fract(time));
  vec2 offset = angleToDir(dither*TAU, 1./resolution.y);
  float fade = .9 + .1 * dither;
  vec4 color = texture2D(backbuffer, uv+offset) * fade;
  return color;
}

void main () {
	vec2 uv = gl_FragCoord.xy/resolution.xy;
	vec2 viewport = (gl_FragCoord.xy-.5*resolution.xy)/resolution.y;
  vec3 origin = vec3(0,3,-5);
  orbit(origin);
  vec3 ray = lookAt(origin, vec3(0), viewport);
  float dither = rng(viewport+fract(time));
  vec4 color = vec4(raymarch(origin, ray, dither), 1);
  // color += feedback(uv);
  // color.rgb += sound(viewport);
  gl_FragColor = color;
}
