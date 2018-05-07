precision mediump float;
#define resolution iResolution
#define time iGlobalTime
#define PI 3.14158
#define TAU (2.*PI)
#define repeat(p,c) (mod(p,c)-c/2.)
#define sdist(p,r) (length(p)-r)

float rand (vec2 seed) { return fract(sin(dot(seed*.1684,vec2(54.649,321.547)))*450315.); }
mat2 rot (float a) { float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }
float amod (inout vec2 p, float count) { float an = TAU/count; float a = atan(p.y,p.x)+an/2.; float c = floor(a/an); c = mix(c,abs(c),step(count*.5,abs(c))); a = mod(a,an)-an/2.; p.xy = vec2(cos(a),sin(a))*length(p); return c; }
float sdcyl (vec3 p, float r, float h) { return max(sdist(p.xz, r), abs(p.y)-h); }
struct Shape { float dist, mat; };

vec3 lookAt (vec3 o, vec3 t, vec2 uv) {
  vec3 forward = normalize(t - o);
  vec3 right = normalize(cross(forward, vec3(0,1,0)));
  vec3 up = normalize(cross(right, forward));
  return normalize(forward * .6 + right * uv.x + up * uv.y);
}

Shape map (vec3 pos) {
  vec3 p = pos;
  // p.yx *= rotate(time);

  // big sphere
  float scene = 10.;//sdist(p, r);

  // bottom horizontal lines
  float bottom = 0.;
  p = pos;
  p.y = abs(abs(p.y) - .06) - .01;
  scene = min(scene, max(sdist(pos, 1.02), abs(p.y) - .005));

  // bottom vertical lines
  p = pos;
  amod(p.xz, 48.);
  scene = min(scene, max(abs(pos.y+bottom)-.05, max(sdist(pos, 1.01), abs(p.z) - .005)));
  // lines screw
  p.x -= 1.0075;
  p.z = abs(p.z) - .06;
  p.y = abs(p.y) - .06;
  scene = min(scene, max(abs(p.y) - .02, sdist(p.xz, .005)));
  // grid sphere
  p = pos;
  amod(p.xz, 24.);
  p.y = repeat(p.y + .2, .4);
  scene = min(scene,
    max(
      sdist(pos, 1.),
      -max(
        max(
          sdist(pos, 1.004),
          -sdist(pos, 0.995)
        ),
        min(
          abs(p.y) - .0075,
          abs(p.z) - .0075
        )
      )
    )
  );
  // grid screws
  p.x -= 1.;
  p.yz = abs(p.yz) - .02;
  scene = min(scene, max(sdist(pos, 1.0075), sdist(p.yz, .005)));

  // square holes
  p = pos;
  p.y = abs(p.y) - .2;
  p.xz *= rot(PI/24.);
  amod(p.xz, 24.);
  scene = max(
    min(scene, max(abs(p.x) - 1.02, max(abs(p.z) - .03, abs(p.y) - .05))),
    -max(abs(p.z) - .029, abs(p.y) - .049)
  );

  float bottomBase = 1.35;

  // base square 1
  p = pos;
  p.y += bottomBase;
  amod(p.xz, 24.);
  p.x -= .75;
  scene = min(scene, max(abs(p.z)-.098, max(abs(p.x)-.03, abs(p.y)-.05)));

  // base square 2
  p = pos;
  p.y += bottomBase;
  amod(p.xz, 3.);
  p.x -= .5;
  scene = min(scene, max(abs(p.z)-.2, max(abs(p.x)-.1, abs(p.y)-.1)));
  p.z = abs(p.z)-.1;
  // base tubes
  scene = min(scene, max(abs(p.y-.2)-.3, sdist(p.xz, .04)));
  scene = min(scene, max(sdist(pos,1.01), sdist(p.xz, .07)));
  // base tubes base
  scene = min(scene, max(abs(p.y-.1)-.01, sdist(p.xz, .07)));
  // base tubes screws
  amod(p.xz, 8.);
  p.x -= .05;
  scene = min(scene, max(abs(p.y)-.12, sdist(p.xz, .01)));

  // base tube
  p = pos;
  scene = min(scene, max(sdist(p.xz, .3), abs(p.y+1.)-.45));

  // bottom tubes
  p = pos;
  amod(p.xz, 8.);
  p.x -= .35;
  scene = min(scene, max(abs(p.y+1.)-.1, sdist(p.xz, .05)));
  scene = min(scene, max(abs(p.y+1.1)-.01, sdist(p.xz, .075)));

  // hole
  scene = max(scene, -sdist(pos, .95));

  Shape shape;
  shape.dist = scene;
  return shape;
}

void main () {
  vec2 uv = (gl_FragCoord.xy - .5 * resolution) / resolution.y;
  float dither = rand(uv);
  vec3 eye = vec3(0,0,-2);
  //eye.z += sin(time * .3) * .5;
  eye.xz *= rot(iMouse.x);
  eye.yz *= rot(-iMouse.y);
  //eye.y += sin(time * .3) * .25;
  vec3 target = vec3(0,-.3,0);
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
  gl_FragColor = vec4(vec3(shade), 1.);
}
