// Author:
// Title:

#ifdef GL_ES
precision mediump float;
#endif

#define STEPS 30.
#define VOLUME .01
#define FAR 20.
#define PI 3.14159
#define TAU 2.*PI

// raymarch toolbox
float rng (vec2 seed) { return fract(sin(dot(seed*.1684,vec2(54.649,321.547)))*450315.); }
mat2 rot (float a) { float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }
float sdSphere (vec3 p, float r) { return length(p)-r; }
float sdCylinder (vec2 p, float r) { return length(p)-r; }
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

Shape sdRope (vec3 pos) {
    Shape plant = newShape();
    plant.spec = .5;
    plant.glow = 1.;

    float radius = 1.5;
    float range = .0;
    float angle = 0.;
    float cell = 3.;
    float wave = sin(pos.y-u_time);
    float wave2 = sin(atan(pos.z,pos.x)-u_time+pos.y);
    float speed = .5;
    float blend = .2;
    radius += .2*wave;

    vec3 p = pos;
    p.xyz = p.zxy;
    p.xy = toroidal(p.xy, radius);
    p.z = repeat(p.z+u_time*speed, cell);
    p.y *= 2.;
    p.xz *= rot(p.y * 2.+sin(p.y+u_time));
    
    float id = amod(p.xz,3.);
    p.x -= .1+(.5+.5*wave2)*.5;
    p.xz *= rot(-p.y+u_time+sin(p.y-u_time*2.)*5.);
    id += amod(p.xz, 4.);
    p.x -= .05;
    plant.dist = smin(plant.dist, sdCylinder(p.xz, .03), blend);

    p = pos;
    p.xz *= rot(-u_time*.2);
    p.y = repeat(p.y+u_time*speed, cell);
    id = amod(p.xz, 16.);
    p.x -= radius;
    p.xy *= rot(-u_time*2.);
    p.xy = toroidal(p.xy, .3+.1*wave+(.5+.5*wave2)*.5);
    p.xz *= rot(p.y*2.+sin(p.y*2.+u_time+id)*.5-u_time);
    id += amod(p.xz, 4.);
    p.x -= 0.06+.02*wave;
    plant.dist = smin(plant.dist, sdCylinder(p.xz, .03), blend);

    // center
    p = pos;
    p.xz *= rot(p.y*.5+sin(p.y*.5+u_time)*.5-u_time);
    id = amod(p.xz, 5.);
    p.x -= .8+.2*wave;
    angle = -p.y*2.+sin(p.y*2.+u_time+id)+u_time+id;
    p.xz *= rot(angle);
    id += amod(p.xz, 5.);
    p.x -= .2 + .05 * sin(angle);
    p.xz *= rot(-p.y*2.);
    id += amod(p.xz, 2.);
    p.x -= .05;
    plant.dist = smin(plant.dist, sdCylinder(p.xz, .04), blend);

    return plant;
}

Shape map (vec3 pos) {
    Shape scene = newShape();
    vec3 p = pos;
    scene = add(scene, sdRope(p));
    return scene;
}


vec3 camera (vec3 p) {
    p.xz *= rot((.5*PI*(.4*sin(u_time*.1))));
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
    vec3 lightPos = vec3(1.,0,-2.);
    lightPos.xy *= rot(u_time*.5);
    lightPos.y += 2.;
    vec3 lightDir = normalize(lightPos-pos);
    // float light = clamp(dot(view, normal),0.,1.);
    float light = dot(-view, normal)*.5+.5;
    float spec = dot(view, normal)*.5+.5;
    color = mix(vec3(0), vec3(1), light);
    color = mix(color, vec3(1), clamp(pow(spec,32.),0.,1.));
    //color *= .3+.7*getShadow(pos, lightPos, 64.)*clamp(dot(lightDir,normal),0.,1.);
    color = mix(color, vec3(1), (1.-abs(dot(normal, view))) * shape.glow);
    color *= shade;
    color = smoothstep(.25, 1., color);
    color = sqrt(color);
    float far = 1.-smoothstep(FAR/2.,FAR,dist);
    color *= far;
    gl_FragColor = vec4(color,1.0);
}
