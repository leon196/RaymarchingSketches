// Author:
// Title:

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

#define STEPS 50.
#define VOLUME .01
#define FAR 10.
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
vec2 displaceLoop (vec2 p, float r) { return vec2(length(p.xy)-r, atan(p.y,p.x)); }
struct Shape { float dist; vec3 color; float spec; };
Shape newShape () { Shape shape; shape.dist = 1000.; shape.color = vec3(1.); shape.spec = 0.; return shape; }
Shape add (Shape a, Shape b) { Shape c = newShape(); c.dist = min(a.dist, b.dist); float op = step(b.dist, a.dist); c.color = mix(a.color, b.color, op); c.spec = mix(a.spec, b.spec, op); return c; }
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

const vec3 pink = vec3(0.917, 0.564, 0.635);
const vec3 red = vec3(0.843, 0.145, 0.113);
const vec3 beige = vec3(0.905, 0.670, 0.235);

Shape sdKirby (vec3 pos) {
    Shape kirby = newShape();
    vec3 p;
    
    // foot
    p = pos;
    p.x = abs(p.x)-.4;
    p.y += 1.;
    p.z += .35;
    p.z *= .65;
    float foot = sdSphere(p, .4);
    foot = smax(foot, -p.y, .2);
    
    // breath animation
    float wave = .5+.5*sin(u_time*5.);
    pos.y += 1.;
    pos.y *= 1.+.1*wave;
    pos.y -= 1.;
    pos.xz *= 1.-.1*wave;
    
    // body
    p = pos;
    float body = sdSphere(p, 1.);
    
    // hand
    p = pos;
    p.x = abs(p.x)-1.;
    p.xy *= rot(PI/3.);
    p.x *= .75;
    p.y *= 1.5;
    float hand = sdSphere(p, .4);
    
    // final compo
    kirby.dist = min(min(body, foot), hand);
    kirby.color = mix(pink, red, step(foot, body));
    kirby.spec = 1.;
    
    // head
    return kirby;
}

Shape sdGround (vec3 pos) {
    Shape ground = newShape();
    vec3 p;
    p = pos;
    float cell = 1.;
    float height = .05;
    float padding = .45;
    p.xz = repeat(p.xz, cell);
    p.y += 1. + height;
    ground.dist = smin(p.y, sdBox(p, vec3(cell*padding, height, cell*padding)), .2);
    
    //float x = sin(p.x*10.)*.5+.5;
    p = pos;
    p.xz = repeat(p.xz+cell/2., cell);
    float r = abs(p.x*p.z)*.9+.1;
    ground.color = beige * r;
    return ground;
}

Shape map (vec3 pos) {
    Shape scene = newShape();
    vec3 p = pos;
    scene = add(scene, sdKirby(p));
    scene = add(scene, sdGround(p));
    return scene;
}


vec3 camera (vec3 p) {
    // p.yz *= rot((.5*PI*(u_mouse.y/u_resolution.y-.5)));
    // p.xz *= rot((.5*PI*(u_mouse.x/u_resolution.x-.5)));
    p.yz *= rot((.5*PI*(.65-.5)));
    p.xz *= rot((.5*PI*(.4*sin(u_time*.1))));
    return p;
}

void main() {
    vec2 uv = (gl_FragCoord.xy-.5*u_resolution.xy)/u_resolution.y;
    vec3 eye = camera(vec3(0,0,-3.5)), ray = camera(normalize(vec3(uv,.7)));
    float shade = 0., dist = 0.;
    vec3 pos = eye;
    Shape shape;
    for (float i = 0.; i <= 1.; i += 1./STEPS) {
        shape = map(pos);
        if (shape.dist < VOLUME || dist > FAR) { shade = 1.-i; break; }
        shape.dist *= .9 + .1 * rng(uv+fract(u_time));
        dist += shape.dist;
        pos = eye + ray * dist;
    }
	vec3 color = shape.color;
    vec3 normal = getNormal(pos);
    vec3 view = normalize(eye-pos);
    vec3 lightPos = vec3(1.,0,-2.);
    lightPos.xy *= rot(u_time*.5);
    lightPos.y += 2.;
    vec3 lightDir = normalize(lightPos-pos);
    float light = clamp(dot(lightDir, normal),0.,1.);
    float ambient = .1;
    color = mix(shape.color * ambient, shape.color, light);
    color = mix(color, vec3(1), shape.spec*clamp(pow(light,16.),0.,1.));
    color *= .1+.9*getShadow(pos, lightPos, 8.)*clamp(dot(lightDir,normal),0.,1.);
    //color *= dot(normal,view);
    //color *= shade;
    color *= 1.-smoothstep(FAR/2.,FAR,dist);
    color = pow(color, vec3(1./2.));
    gl_FragColor = vec4(color,1.0);
}