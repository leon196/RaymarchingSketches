precision mediump float;
#define resolution iResolution
#define time iGlobalTime
#define PI 3.14158
#define TAU (2.*PI)
#define repeat(p,c) (mod(p+c/2.,c)-c/2.)
#define sdist(p,r) (length(p)-r)

float rand (vec2 seed) { return fract(sin(dot(seed*.1684,vec2(54.649,321.547)))*450315.); }
mat2 rot (float a) { float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }
float amod (inout vec2 p, float count) { float an = TAU/count; float a = atan(p.y,p.x)+an/2.; float c = floor(a/an); c = mix(c,abs(c),step(count*.5,abs(c))); a = mod(a,an)-an/2.; p.xy = vec2(cos(a),sin(a))*length(p); return c; }
float sdcyl (vec3 p, float r, float h) { return max(sdist(p.xz, r), abs(p.y)-h); }
float sdIso(vec3 p, float r) { return max(0.,dot(p,normalize(sign(p))))-r; }
float sdBox( vec3 p, vec3 b ) { vec3 d = abs(p) - b; return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0)); }
float smin (float a, float b, float r) { float h = clamp(.5+.5*(b-a)/r, 0., 1.); return mix(b,a,h)-r*h*(1.-h); }
float smax (float a, float b, float r) { float h = clamp(.5+.5*(b-a)/r,0.,1.); return mix(a,b,h)+r*h*(1.-h); }
struct Shape { float dist, mat; };

vec3 lookAt (vec3 o, vec3 t, vec2 uv) {
  vec3 forward = normalize(t - o);
  vec3 right = normalize(cross(forward, vec3(0,1,0)));
  vec3 up = normalize(cross(right, forward));
  return normalize(forward * 1.5 + right * uv.x + up * uv.y);
}

Shape map (vec3 pos) {
  vec3 p = pos;

  float scene = 10.;
  float lines = 10.;
  const float thin = .02;
  const float radius = .5;
  const float count = 8.;
  float w = sin(time) * .5 + .5;
  for (float s = 0.; s < count; ++s) {
    float r = 1. - s / count;
    p = abs(p) - .2 * r;
    float d = sin(length(p) * 10.) * .5;
    p.xz *= rot(d + time*.9);
    p.yz *= rot(d + time*.5);
    p.yx *= rot(d + time*.1);
    // p.xz *= rot(time*.9564);
    // p.yz *= rot(time*.34665);
    // p.yx *= rot(time*.66354);
    // scene = smin(scene, sdist(p, radius * r), blend);
    // scene = smin(scene, sdIso(p, .05 * r), .01);
    // lines = smin(lines, sdist(p.xz, thin * r), .1);
    lines = smin(lines, max(max(p.z,p.y), p.x), .05);
    // scene = smin(scene, sdist(p.xz, thin), blend);
  }

  scene = min(scene, sdist(pos,1.));
  scene = smax(scene, -lines, .3);
  // scene = max(scene, -sdist(pos, 1.0));
  // scene = min(scene, lines);
  // scene = max(scene, sdist(pos, 1.5));

  Shape shape;
  shape.dist = scene;
  return shape;
}

vec3 getNormal (vec3 p) {
  vec2 e = vec2(.001,0);
  return normalize(vec3(map(p+e.xyy).dist-map(p-e.xyy).dist, map(p+e.yxy).dist-map(p-e.yxy).dist, map(p+e.yyx).dist-map(p-e.yyx).dist));
}

void main () {
  vec2 uv = (gl_FragCoord.xy - .5 * resolution) / resolution.y;
  float dither = rand(uv);
  vec3 eye = vec3(0,0,-3.);
  // eye.xz *= rot(.2);
  // eye.yz *= rot(.2);
  eye.xz *= rot(iMouse.x * 2. - 1.);
  eye.yz *= rot(-(iMouse.y * 2. - 1.));
  vec3 target = vec3(0,0,0);
  vec3 ray = lookAt(eye, target, uv);
  vec3 pos = eye;
  float shade = 0.;
  Shape shape;
  for (float s = 0.; s < 1.; s += 1. / 50.) {
    shape = map(pos);
    float dist = shape.dist;
    if (dist < .001) {
      shade = 1. - s;
      break;
    }
    dist *= .9 + .1 * dither;
    pos += ray * dist;
  }
  // float t = time + shade * 2.;//+ length(pos) * 10.;
  // vec3 normal = getNormal(pos) * .5 + .5;
  // vec3 color = vec3(.9) + vec3(.1) * cos(normal*t);
  vec3 color = vec3(1);
  color *= shade;
  gl_FragColor = vec4(color, 1.);
}
