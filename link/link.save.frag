precision mediump float;
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

#define STEPS 50.
#define VOLUME .0001
#define PI 3.14159
#define TAU (2.*PI)

// raymarch toolbox
float rng (vec2 seed) { return fract(sin(dot(seed*.1684,vec2(54.649,321.547)))*450315.); }
mat2 rot (float a) { float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }
float sdSphere (vec3 p, float r) { return length(p)-r; }
float sdCylinder (vec2 p, float r) { return length(p)-r; }
float sdisk (vec3 p, float r, float h) { return max(length(p.xz)-r, abs(p.y)-h); }
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
struct Shape { float dist; vec3 color; };

#define sdist(p,s) (length(p)-s)

Shape map (vec3 pos) {
  vec3 p = pos;
  Shape scene;
  scene.dist = 10000.;
  scene.color = vec3(1);
  p = pos;
  p.x *= .8;
  scene.dist = sdist(p, .5);
  p = pos;
  p.y += 1.;
  p.x *= .5;
  float body = 10000.;
  float smoothFactor = .1;
  float bodyWidth = .2;
  body = smin(body, sdisk(p, bodyWidth, 1.), smoothFactor);
  scene.dist = min(scene.dist, body);
  //p.y += sin(time);
  //scene.dist = max(scene.dist, sdisk(p, 10., .01));
  return scene;
}

vec3 LookAt (vec3 eye, vec3 at, vec2 uv) {
  vec3 forward = normalize(at-eye);
  vec3 right = normalize(cross(vec3(0,1,0),forward));
  vec3 up = normalize(cross(forward, right));
  return normalize(forward + right*uv.x + up*uv.y);
}

void main() {
    vec2 uv = (gl_FragCoord.xy-.5*resolution.xy)/resolution.y;
    vec3 eye = vec3(0,2,-5);
    eye.xz *= rot(PI*(mouse.x*2.-1.));
    eye.zy *= rot(PI*(mouse.y*2.-1.));
    vec3 ray = LookAt(eye, vec3(0,0,0), uv);
    float shade = 0.;
    vec3 pos = eye;
    vec4 color = vec4(1);
    for (float i = 0.; i <= 1.; i += 1./STEPS) {
      Shape shape = map(pos);
      if (shape.dist < VOLUME) {
        shade = 1.-i;
        color.rgb = shape.color;
        break;
      }
      pos += ray*shape.dist;
    }
    color *= shade;
    gl_FragColor = color;
}
