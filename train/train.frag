
precision mediump float;

#define PI 3.14159
#define TAU (2.*PI)
#define sdist(p,r) (length(p)-r)
#define repeat(p,r) (mod(p+r/2.,r)-r/2.)

float siso(vec3 p, float r) {
  return dot(p, normalize(sign(p)))-r;
}

float sdTorus( vec3 p, vec2 t ) {
  vec2 q = vec2(length(p.xz)-t.x,p.y);
  return length(q)-t.y;
}

float cube(vec3 p,vec3 c)
{
  return length(max(abs(p)-c,0.));
}

vec3 lookAt (vec3 eye, vec3 at, vec2 uv) {
  vec3 forward = normalize(at-eye);
  vec3 right = normalize(cross(vec3(0,1,0), forward));
  vec3 up = normalize(cross(forward, right));
  return normalize(forward + right * uv.x + up * uv.y);
}

mat2 rot (float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c,-s,s,c);
}
float map (vec3);
vec3 getNormal (vec3 pos) {
  vec2 e = vec2(.001,0);
  return normalize(vec3(map(pos+e.xyy)-map(pos-e.xyy),
  map(pos+e.yxy)-map(pos-e.yxy),
  map(pos+e.yyx)-map(pos-e.yyx)));
}

void amod(inout vec2 p, float count) {
  float an = TAU/count;
  float a = atan(p.y,p.x);
  a = mod(a,an)-an/2.;
  p = vec2(cos(a),sin(a))*length(p);
}

float map (vec3 pos) {
  vec3 p = pos;
  float scene = 1000.;
  float patteRadius = .27;
  float patteHeight = 2.;
  float torusThin = .07;
  float torusRadius = patteRadius+torusThin;
  float tableWidth = 2.;
  float period = 1.;
  float patateThin = 0.09;

  p = pos;
  p.y -= patteHeight*0.85;
  p.xz = repeat(p.xz,period);
  scene = min (scene,cube(p,vec3(patateThin,0.01,tableWidth)));
  scene = min (scene,cube(p,vec3(tableWidth,0.01,patateThin)));
  scene = max(abs(pos.x)-tableWidth+(patateThin*1.1), scene);
  scene = max(abs(pos.z)-tableWidth+(patateThin*1.1), scene);

  vec3 ppp = pos;
  amod(ppp.xz, 4.);
  ppp.y += patteHeight*0.6;
  scene = min(scene, sdist(ppp.yz, torusThin));

  vec3 pp = pos;
  pos.xz=abs(pos.xz)-tableWidth;
  p = pos;
  p.y -= patteHeight*0.85;
  scene = min (scene, sdist(p.yz, patteRadius*0.3));
  scene = min (scene, sdist(p.xy, patteRadius*0.3));
  scene = max(abs(pp.x)-tableWidth-(patteRadius*0.3), scene);
  scene = max(abs(pp.z)-tableWidth-(patteRadius*0.3), scene);

  scene = min(scene, max(abs(pos.y)-patteHeight, sdist(pos.xz, patteRadius)));
  p = pos;
  p.y = abs(p.y+patteHeight)-torusThin;
  scene = min(scene, sdTorus(p, vec2(torusRadius-torusThin,torusThin)));
  p = pos;
  p.y = abs(p.y+patteHeight*.6)-torusThin*2.;
  scene = min(scene, sdTorus(p, vec2(torusRadius,torusThin)));
  p = pos;
  p.y = p.y-patteHeight;
  scene = min(scene, sdTorus(p, vec2(torusRadius,torusThin)));
  p = pos;
  p.y = p.y-patteHeight;
  scene = min(scene, sdist(p, patteRadius));
  return scene;
}

vec3 raymarch () {
  vec2 uv = (gl_FragCoord.xy-.5*iResolution)/iResolution.y;
  vec3 color = vec3(1);
  vec3 eye = vec3(0,4,6);
  eye.xz *= rot(u_time*.3);
  vec3 pos = eye;
  vec3 ray = lookAt(eye, vec3(0,0,0), uv);
  float shade = 0.;
  for (float i = 0.; i < 1.; i += 1./50.) {
    float dist = map(pos);
    if (dist < 0.001) {
      shade = 1.-i;
      break;
    }
    pos += ray * dist;
  }
  vec3 normal = getNormal(pos);
  color *= dot(-ray, normal)*.5+.5;
  color *= shade;
  color = pow(color, vec3(2.2));
  return color;
}

void main () {
  gl_FragColor = vec4(raymarch(), 1);
}
