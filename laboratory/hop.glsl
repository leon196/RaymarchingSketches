
#define STEPS 20.
#define VOLUME 0.1
#define PI 3.14159
#define TAU (2.*PI)
#define time iGlobalTime
#define sDist(p,r) (length(p)-r)
#define repeat(v,s) (mod(v,s)-s/2.)

mat2 rot (float angle) { float c=cos(angle),s=sin(angle); return mat2(c,-s,s,c); }
float rng (vec2 seed) { return fract(sin(dot(seed*.1,vec2(324.654,156.546)))*46556.24); }
float sdBox(vec3 p, vec3 r) { vec3 d = abs(p)-r; return min(0.,max(max(d.x,d.y),d.z)) + length(max(d,0.)); }
float smin (float a, float b, float k) {
  float h = clamp(.5+.5*(b-a)/k, 0., 1.);
  return mix(b,a,h)-k*h*(1.-h);
}
float amod (inout vec2 pos, float count) {
  float an = TAU/count;
  float a = atan(pos.y,pos.x)+an/2.;
  float c = floor(a/an);
  a = mod(a,an)-an/2.;
  pos = vec2(cos(a),sin(a))*length(pos);
  return c;
}
float map(vec3);
vec3 getNormal (vec3 pos) {
  vec2 e = vec2(.01,0);
  return normalize(vec3(map(pos+e.xyy)-map(pos-e.xyy), map(pos+e.yxy)-map(pos-e.yxy), map(pos+e.yyx)-map(pos-e.yyx)));
}

float map (vec3 pos) {
  float scene = 1000.;
  float len = .2;
  float height = .1;
  float depth = 2.;
  vec3 p;
  p = pos;
  float py = p.y;//+time;
  float ry = height*2.;
  float iy = floor(py/ry);
  p.xz *= rot(iy*len+time);
  p.y = repeat(py, ry);
  scene = min(scene, sdBox(p, vec3(len, height, depth)));
  return scene;
}

vec3 getCamera (vec3 eye, vec2 uv) {
  float fov = 1.;
  vec3 lookAt = vec3(0.);
  vec3 forward = normalize(lookAt-eye);
  vec3 right = normalize(cross(vec3(0,1,0), forward));
  vec3 up = normalize(cross(forward, right));
  return normalize(fov * forward + uv.x * right + uv.y * up);
}

vec4 raymarch () {
  vec2 uv = (gl_FragCoord.xy-.5*iResolution.xy)/iResolution.y;
  float dither = rng(uv+fract(time));
  vec3 eye = vec3(3,2,-6);
  vec3 ray = getCamera(eye, uv);
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
  vec4 lightColor = vec4(1,0,0,0);
  vec4 color = vec4(1.);
  vec3 normal = getNormal(pos);
  vec3 view = normalize(pos-eye);
  vec3 lightPos = vec3(5, 0, 0);
  lightPos.xz *= rot(time*3.);
  // color = mix(color, lightColor, clamp(dot(normal, view)*.5+.5,0.,1.));
  color *= shade;
  return color;
}

void main () {
  gl_FragColor = raymarch();
}
