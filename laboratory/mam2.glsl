
// Leon Denise aka ponk
// using code from IQ, Mercury, LJ, Duke, Koltes

#define STEPS 30.
#define VOLUME 0.001
#define PI 3.14159
#define TAU (2.*PI)
#define time iGlobalTime
#define repeat(v,c) (mod(v,c)-c/2.)
#define sDist(v,r) (length(v)-r)

mat2 rot (float a) { float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }
float rng (vec2 seed) { return fract(sin(dot(seed*.1684,vec2(54.649,321.547)))*450315.); }
float sdBox( vec3 p, vec3 b ) { vec3 d = abs(p) - b; return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0)); }
float sdTorus( vec3 p, vec2 t ) { vec2 q = vec2(length(p.xz)-t.x,p.y); return length(q)-t.y; }
float amod (inout vec2 p, float count) { float an = TAU/count; float a = atan(p.y,p.x)+an/2.; float c = floor(a/an); c = mix(c,abs(c),step(count*.5,abs(c))); a = mod(a,an)-an/2.; p.xy = vec2(cos(a),sin(a))*length(p); return c; }
float smoo (float a, float b, float r) { return clamp(.5+.5*(b-a)/r, 0., 1.); }
float smin (float a, float b, float r) { float h = smoo(a,b,r); return mix(b,a,h)-r*h*(1.-h); }
float smax (float a, float b, float r) { float h = smoo(a,b,r); return mix(a,b,h)+r*h*(1.-h); }
vec2 toroidal (vec2 p, float r) { return vec2(length(p.xy)-r, atan(p.y,p.x)); }
float map (vec3);
vec3 getNormal (vec3 p) { vec2 e = vec2(.01,0); return normalize(vec3(map(p+e.xyy)-map(p-e.xyy),map(p+e.yxy)-map(p-e.yxy),map(p+e.yyx)-map(p-e.yyx))); }

float map (vec3 pos) {
  float scene = 1000.;
  float wallThin = .2;
  float wallRadius = 8.;
  float wallOffset = .2;
  float floorThin = .1;
  float stairRadius = 6.;
  float stairHeight = .2;
  float stairCount = 64.;
  float stairDepth = 1.;
  vec2 cell = vec2(2.,2.5);
  vec3 p;

  // move it
  pos.y += time;

  // twist it
  // pos.xz *= rot(pos.y*.05+time*.1);

  // holes
  float holeWall = sDist(pos.xz, wallRadius);
  float holeStair = sDist(pos.xz, stairRadius);

  // walls
  p = pos;
  amod(p.xz, wallRadius*cell.x);
  p.x -= wallRadius;
  scene = min(scene, max(-p.x, abs(p.z)-wallThin));
  scene = max(scene, -sDist(pos.xz, wallRadius-wallOffset));

  // floors
  p = pos;
  p.y = repeat(p.y, cell.y);
  float disk = max(sDist(p.xz, 1000.), abs(p.y)-floorThin);
  disk = max(disk, -sDist(pos.xz, wallRadius));
  scene = min(scene, disk);

  // stairs 1
  p = pos;
  float stairIndex = amod(p.xz, stairCount);
  p.y -= stairIndex*stairHeight;
  p.y = repeat(p.y, stairCount*stairHeight);
  float stair = sdBox(p, vec3(100,stairHeight,stairDepth));
  scene = min(scene, max(stair, max(holeWall, -holeStair)));
  p = pos;
  p.y += stairHeight*.5;
  p.y -= stairHeight*stairCount*atan(p.z,p.x)/TAU;
  p.y = repeat(p.y, stairCount*stairHeight);
  scene = min(scene, max(max(sDist(p.xz, wallRadius), abs(p.y)-stairHeight), -holeStair));

  return scene;
}

vec3 getCamera (vec3 eye, vec3 lookAt, vec2 uv) {
  float fov = 1.;
  vec3 forward = normalize(lookAt - eye);
  vec3 right = normalize(cross(vec3(0,1,0), forward));
  vec3 up = normalize(cross(forward, right));
  return normalize(fov * forward + uv.x * right + uv.y * up);
}

vec4 raymarch () {
  vec2 uv = (gl_FragCoord.xy-.5*iResolution.xy)/iResolution.y;
  float dither = rng(uv+fract(time));

  vec3 eye = vec3(0,7,-5);
  vec3 lookAt = vec3(0.);
  vec3 ray = getCamera(eye, lookAt, uv);
  vec3 pos = eye;
  float shade = 0.;
  for (float i = 0.; i <= 1.; i += 1./STEPS) {
    float dist = map(pos);
		if (dist < VOLUME) {
			shade = 1.-i;
			break;
		}
    dist *= .9 + .1 * dither;
    pos += ray * dist;
  }
  vec4 color = vec4(1);
  vec3 normal = getNormal(pos);
  vec3 view = normalize(eye-pos);
  shade *= dot(normal, view)*.5+.5;
  color *= shade;
  // color = smoothstep(.0, .5, color);
  return sqrt(color);
}

void main () {
  gl_FragColor = raymarch();
}
