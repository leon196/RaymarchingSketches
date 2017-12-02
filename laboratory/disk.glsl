
// Leon Denise aka ponk
// using code from IQ, Mercury, LJ, Duke, Koltes

#define STEPS 50.
#define VOLUME 0.001
#define PI 3.14159
#define TAU (2.*PI)
#define time iGlobalTime
#define repeat(v,c) (mod(v,c)-c/2.)
#define sDist(v,r) (length(v)-r)

mat2 rot (float a) { float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }
float rng (vec2 seed) { return fract(sin(dot(seed*.1684,vec2(32.649,321.547)))*43415.); }
float sdDisk(vec3 p, float r, float h, float i) { float d = length(p.xz); return max(max(d-r,-(d-i)), abs(p.y)-h); }
float sdBox(vec3 p, vec3 b) { vec3 d = abs(p) - b; return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0)); }
float sdTorus(vec3 p, vec2 t) { vec2 q = vec2(length(p.xz)-t.x,p.y); return length(q)-t.y; }
float amod (inout vec2 p, float count) { float an = TAU/count; float a = atan(p.y,p.x)+an/2.; float c = floor(a/an); c = mix(c,abs(c),step(count*.5,abs(c))); a = mod(a,an)-an/2.; p.xy = vec2(cos(a),sin(a))*length(p); return c; }
float aindex (vec2 p, float count) { float an = TAU/count; float a = atan(p.y,p.x)+an/2.; float c = floor(a/an); return mix(c,abs(c),step(count*.5,abs(c))); }
float smoo (float a, float b, float r) { return clamp(.5+.5*(b-a)/r, 0., 1.); }
float smin (float a, float b, float r) { float h = smoo(a,b,r); return mix(b,a,h)-r*h*(1.-h); }
float smax (float a, float b, float r) { float h = smoo(a,b,r); return mix(a,b,h)+r*h*(1.-h); }
vec2 toroidal (vec2 p, float r) { return vec2(length(p.xy)-r, atan(p.y,p.x)); }
float map (vec3);
vec3 getNormal (vec3 p) { vec2 e = vec2(.1,0); return normalize(vec3(map(p+e.xyy)-map(p-e.xyy),map(p+e.yxy)-map(p-e.yxy),map(p+e.yyx)-map(p-e.yyx))); }
float hardShadow (vec3 pos, vec3 light) {
    vec3 dir = normalize(light - pos);
    float maxt = length(light - pos);
    float t = .02;
    for (float i = 0.; i <= 1.; i += 1./30.) {
        float dist = map(pos + dir * t);
        if (dist < VOLUME) return 0.;
        t += dist;
        if (t >= maxt) break;
    }
    return 1.;
}

float lines1 (vec3 pos) {
  float scene = 1000.;
  vec3 p;
  float speed = -.5;
  p = pos;
  float rl = 10.;
  float pl = floor((length(p)+time*speed)*rl)/rl;
  pl = pl * 20. - time;
  // p.xz = normalize(p.xz)*mod(length(p.xz)*5., 1.1);
  p.xz *= rot(pl*.7);
  p.xy *= rot(pl*.3);
  p.zy *= rot(pl*.5);
  scene = min(scene, sdDisk(p, 10., .001, .0));

  // p = pos;
  amod(p.xz, 30.);//*floor((length(p))*rl)/rl);
  // p.x -= 1.;
  p.x = repeat(p.x+time*speed, 1./rl);
  // scene = max(scene, -sDist(p, .025));
  scene = min(scene, sDist(p, .02));
  return scene;
}

float lines2(vec3 pos) {
  float scene = 1000.;
  vec3 p;
  p = pos;
  float rx = .1;
  float px = length(p.xy);
  float ix = floor(px/rx);
  float pl = length(p)*10.+time;
  p.xz *= rot(pl*.9);
  p.yz *= rot(pl*.7);
  p.yx *= rot(pl*.3);
  p.xy = toroidal(p.xy, 0.);
  p.x = repeat(p.x, rx);
  scene = min(scene, sDist(p.xz, .01));
  return scene;
}

float map (vec3 pos) {
  float scene = 1000.;
  vec3 p;

  scene = min(scene, lines1(pos));
  // scene = min(scene, sDist(p.xy, .01));
  // scene = max(scene, sDist(pos, 1.));
  // scene = min(scene, lines2(pos));

  return scene;
}

vec3 getCamera (vec3 eye, vec2 uv) {
  vec3 lookAt = vec3(0.);
  float fov = 1.;
  vec3 forward = normalize(lookAt - eye);
  vec3 right = normalize(cross(vec3(0,1,0), forward));
  vec3 up = normalize(cross(forward, right));
  return normalize(fov * forward + uv.x * right + uv.y * up);
}

float getLight (vec3 pos, vec3 eye) {
  vec3 light = vec3(-.5,7.,1.);
  vec3 normal = getNormal(pos);
  vec3 view = normalize(eye-pos);
  float shade = dot(normal, view)*.5+.5;
  // shade *= hardShadow(pos, light);
  return shade;
}

vec4 raymarch () {
  vec2 uv = (gl_FragCoord.xy-.5*iResolution.xy)/iResolution.y;
  vec3 eye = vec3(0,1,-3);
  vec3 ray = getCamera(eye, uv);
  // float dither = smoothstep(.5,.6,sin((uv.x+uv.y)*1000.+time*100.)*.5+.5);
  float dither = rng(uv+fract(time));
  vec3 pos = eye;
  float shade = 0.;
  for (float i = 0.; i <= 1.; i += 1./STEPS) {
    float dist = map(pos);
		if (dist < VOLUME) {
      shade = 1.-i;
      break;
		}
    dist *= .2 + .1 * dither;
    pos += ray * dist;
  }

  vec4 color = vec4(shade);

  // color.rgb = getNormal(pos);
  // color *= getLight(pos, eye);
  // color = smoothstep(.0, .5, color);
  color = sqrt(color);
  return color;
}

void main () {
  gl_FragColor = raymarch();
}
