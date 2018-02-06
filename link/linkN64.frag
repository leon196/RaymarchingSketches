// Author:
// Title:

#ifdef GL_ES
precision mediump float;
#endif

#define STEPS 100.
#define VOLUME .001
#define FAR 20.
#define PI 3.14159
#define TAU 2.*PI

// raymarch toolbox
float rng (vec2 seed) { return fract(sin(dot(seed*.1684,vec2(54.649,321.547)))*450315.); }
mat2 rot (float a) { float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }
float sdSphere (vec3 p, float r) { return length(p)-r; }
float sdCylinder (vec2 p, float r) { return length(p)-r; }
float sdIso(vec3 p, float r) { return max(0.,dot(p,normalize(sign(p))))-r; }
float sdIso(vec2 p, float r) { return max(0.,dot(p,normalize(sign(p))))-r; }
float sdBox( vec3 p, vec3 b ) { vec3 d = abs(p) - b; return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0)); }
float sdTorus( vec3 p, vec2 t ) { vec2 q = vec2(length(p.xz)-t.x,p.y); return length(q)-t.y; }
float amod (inout vec2 p, float count) { float an = TAU/count; float a = atan(p.y,p.x)+an/2.; float c = floor(a/an); c = mix(c,abs(c),step(count*.5,abs(c))); a = mod(a,an)-an/2.; p.xy = vec2(cos(a),sin(a))*length(p); return c; }
float repeat (float v, float c) { return mod(v,c)-c/2.; }
vec2 repeat (vec2 v, float c) { return mod(v,c)-c/2.; }
vec3 repeat (vec3 v, float c) { return mod(v,c)-c/2.; }
float smoo (float a, float b, float r) { return clamp(.5+.5*(b-a)/r, 0., 1.); }
float smin (float a, float b, float r) { float h = smoo(a,b,r); return mix(b,a,h)-r*h*(1.-h); }
float smax (float a, float b, float r) { float h = smoo(a,b,r); return mix(a,b,h)+r*h*(1.-h); }
vec2 toroidal (vec2 p, float r) { return vec2(length(p.xy)-r, atan(p.y,p.x)); }
struct Shape { float dist; vec3 color; float spec; float glow; };
Shape newShape () { Shape shape; shape.dist = 1000.; shape.color = vec3(1.); shape.spec = 0.; shape.glow = 0.; return shape; }
Shape add (Shape a, Shape b) { Shape c = newShape(); c.dist = min(a.dist, b.dist); float op = step(b.dist, a.dist); c.color = mix(a.color, b.color, op); c.spec = mix(a.spec, b.spec, op); c.glow = mix(a.glow, b.glow, op); return c; }
Shape map (vec3 p);
vec3 getNormal (vec3 p) { vec2 e = vec2(.01,0); return normalize(vec3(map(p+e.xyy).dist-map(p-e.xyy).dist,map(p+e.yxy).dist-map(p-e.yxy).dist,map(p+e.yyx).dist-map(p-e.yyx).dist)); }
float getShadow (vec3 pos, vec3 at, float k) {
    vec3 dir = normalize(at - pos);
    float maxt = length(at - pos);
    float f = 1.;
    float t = VOLUME*10.;
    for (float i = 0.; i <= 1.; i += 1./STEPS) {
        float dist = map(pos + dir * t).dist;
        if (dist < VOLUME) return 0.;
        f = min(f, k * dist / t);
        t += dist;
        if (t >= maxt) break;
    }
    return f;
}

const vec3 pink = vec3(0.917,0.482,0.663);
const vec3 red = vec3(0.825,0.142,0.111);
const vec3 beige = vec3(0.905, 0.670, 0.235);
const vec3 blue = vec3(0.058, 0.074, 0.560);
const vec3 blueSky = vec3(0.741, 0.941, 1);
const vec3 green1 = vec3(0.298,0.830,0.153);
const vec3 green2 = vec3(0.038,0.260,0.047);
const vec3 gold = vec3(1, 0.858, 0.058);

Shape sdLink (vec3 pos) {
    Shape link = newShape();
    pos.x = abs(pos.x);
    vec3 p = pos;
    float faceSize = .87;
    float faceShell = .97;
    mat2 rotPI4 = rot(PI/4.);

    p = pos;
    float head = sdBox(p, vec3(faceSize));
    head = max(head, sdIso(p, faceShell));
    p.xz *= rotPI4;
    head = max(head, sdBox(p, vec3(faceSize)));
    head = max(head, sdIso(p, faceShell));

    p = pos + vec3(-faceSize,-.2,-.2);
    float ear = max(sdIso(p, .25), -sdIso(p+vec3(.1,-.2,-.2), .5));
    head = min(ear, head);

    p = pos + vec3(0,.2,faceSize);
    float nose = sdIso(p, .15);
    head = min(head, nose);

    p = pos + vec3(0,-.07,0);
    p.zy *= rot(PI/2.5);
    p += vec3(0,-.7,0);
    float capSize = 1.;
    float cap = max(abs(p.y)-.4,max(sdIso(p.xz, capSize), sdIso(p.xz*rotPI4, capSize)));
    cap = min(cap, max(abs(p.y)-.4,max(sdIso(p.xz, capSize), sdIso(p.xz*rotPI4, capSize))));
    head = min(head, cap);

    link.dist = head;
    return link;
}

Shape map (vec3 pos) {
    Shape scene = newShape();
    vec3 p = pos;
    scene = add(scene, sdLink(p));
    return scene;
}
vec3 camera (vec3 p) {
    p.xz *= rot((PI*(.4*sin(u_time*.3))));
    return p;
}
vec3 lookAt (vec3 eye, vec3 target, vec2 uv) {
  vec3 forward = normalize(target-eye);
  vec3 right = normalize(cross(vec3(0,1,0), forward));
  vec3 up = normalize(cross(forward, right));
  return normalize(forward + uv.x * right + uv.y * up);
}

void main() {
    vec2 uv = (gl_FragCoord.xy-.5*u_resolution.xy)/u_resolution.y;
    vec3 eye = camera(vec3(0,1,-5.5));
    vec3 ray = lookAt(eye, vec3(0), uv);
    float shade = 0., dist = 0.;
    vec3 pos = eye;
    Shape shape;
    for (float i = 0.; i <= 1.; i += 1./STEPS) {
        shape = map(pos);
        if (shape.dist < VOLUME || dist > FAR) { shade = 1.-i; break; }
        shape.dist *= .9 + .1 * rng(uv+fract(u_time));
        dist += shape.dist;
        pos = eye + ray * dist*.5;
    }
    vec3 color = vec3(1);
    vec3 normal = getNormal(pos);
    vec3 view = normalize(eye-pos);
    color *= dot(view, normal)*.5+.5;
    color *= shade;
    float far = 1.-smoothstep(FAR/2.,FAR,dist);
    color *= far;
    gl_FragColor = vec4(color,1.0);
}
