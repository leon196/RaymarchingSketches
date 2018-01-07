precision mediump float;
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

#define PI 3.14159
#define TAU (2.*PI)

// raymarch toolbox
float rng (vec2 seed) { return fract(sin(dot(seed*.1684,vec2(54.649,321.547)))*450315.); }
mat2 rot (float a) { float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }
float sdSphere (vec2 p, float r) { return length(p)-r; }
float sdCylinder (vec2 p, float r) { return length(p)-r; }
float amod (inout vec2 p, float count) { float an = TAU/count; float a = atan(p.y,p.x)+an/2.; float c = floor(a/an); c = mix(c,abs(c),step(count*.5,abs(c))); a = mod(a,an)-an/2.; p.xy = vec2(cos(a),sin(a))*length(p); return c; }
float repeat (float v, float c) { return mod(v,c)-c/2.; }
vec2 repeat (vec2 v, float c) { return mod(v,c)-c/2.; }
float smoo (float a, float b, float r) { return clamp(.5+.5*(b-a)/r, 0., 1.); }
float smin (float a, float b, float r) { float h = smoo(a,b,r); return mix(b,a,h)-r*h*(1.-h); }
float smax (float a, float b, float r) { float h = smoo(a,b,r); return mix(a,b,h)+r*h*(1.-h); }
vec2 displaceLoop (vec2 p, float r) { return vec2(length(p.xy)-r, atan(p.y,p.x)); }
struct Shape { float dist; vec3 color; };

#define sdist(p,s) (length(p)-s)
const vec3 skin = vec3(0.960, 0.854, 0.592);
const vec3 white = vec3(.98);

float fill (float edge, float value) {
  return smoothstep(edge-.01,edge,value);
}

vec4 map (vec2 uv) {
  uv *= 2.;
  vec2 p = uv;
  vec3 color = vec3(0);
  p.y *= 1.25;
  float l = length(p);
  color = mix(color, skin, fill(l, .5));
  p.x = abs(p.x)-.5;
  p.y += sin(-p.x*20.)*.03;
  p.x += cos(p.y*20.+.5)*.05;
  l = length(p);
  color = mix(color, skin, fill(l, .1));
  p = uv;
  p.x = abs(p.x) - .2;
  p.y = abs(p.y) + .05;
  l = length(p);
  color = mix(color, white, fill(l, .15));
  return vec4(color,1);
}

void main() {
    vec2 uv = (gl_FragCoord.xy-.5*resolution.xy)/resolution.y;
    vec4 color = map(uv);
    gl_FragColor = color;
}
