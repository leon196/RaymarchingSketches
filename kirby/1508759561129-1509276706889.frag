// Author:
// Title:

#ifdef GL_ES
precision mediump float;
#endif

#define STEPS 1./30.
#define VOLUME .01
#define MIN_STEP .01
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
float smoo (float a, float b, float r) { return clamp(.5+.5*(b-a)/r, 0., 1.); }
float smin (float a, float b, float r) { float h = smoo(a,b,r); return mix(b,a,h)-r*h*(1.-h); }
float smax (float a, float b, float r) { float h = smoo(a,b,r); return mix(a,b,h)+r*h*(1.-h); }
vec2 displaceLoop (vec2 p, float r) { return vec2(length(p.xy)-r, atan(p.y,p.x)); }
struct Shape { float dist; vec3 color; };
Shape newShape () { Shape shape; shape.dist = 1000.; shape.color = vec3(1.); return shape; }
Shape add (Shape a, Shape b) { Shape c = newShape(); c.dist = min(a.dist, b.dist); c.color = mix(a.color, b.color, step(b.dist, a.dist)); return c; }
Shape map (vec3 p);
vec3 getNormal (vec3 p) { vec2 e = vec2(.01,0); return normalize(vec3(map(p+e.xyy).dist-map(p-e.xyy).dist,map(p+e.yxy).dist-map(p-e.yxy).dist,map(p+e.yyx).dist-map(p-e.yyx).dist)); }
float getShadow (vec3 from, vec3 at, float k) {
    vec3 dir = normalize(at - from);
    float t = VOLUME * 10., maxt = length(at - from), f = 1.;
    Shape shape;
    while (t < maxt) {
        shape = map(from + dir * t);
        if (shape.dist < VOLUME) return 0.;
        f = min(f, k * shape.dist / t);
        t += shape.dist;
    }
    return f;
}
vec3 getDiffuse (vec3 color, vec3 lightColor, vec3 pos, vec3 normal, vec3 lightPos) {
    vec3 lightDir = normalize(lightPos-pos);
    float light = clamp(dot(lightDir, normal),0.,1.);
    color = mix(color, lightColor, light);
    return mix(color, vec3(1), clamp(pow(light,16.),0.,1.));
}
const vec3 pink = vec3(0.917, 0.564, 0.635);
const vec3 red = vec3(0.843, 0.145, 0.113);

Shape sdKirby (vec3 pos) {
    Shape kirby = newShape();
    vec3 p;

    // body
    p = pos;
    float body = sdSphere(p, 1.);

    // foot
    p = pos;
    p.x = abs(p.x)-.4;
    p.y += 1.;
    p.z += .35;
    p.z *= .65;
    float foot = sdSphere(p, .4);
    foot = smax(foot, -p.y, .2);

    // hand
    p = pos;
    p.x = abs(p.x)-1.;
    p.xy *= rot(PI/3.);
    p.x *= .75;
    p.y *= 1.5;
    float hand = sdSphere(p, .4);

    kirby.dist = min(min(body, foot), hand);
    kirby.color = mix(pink, red, step(foot, body));
    return kirby;
}

Shape map (vec3 pos) {
    Shape scene = newShape();
    vec3 p = pos;
    Shape kirby = sdKirby(p);
    scene = add(scene, kirby);
    return scene;
}


vec3 camera (vec3 p) {
    p.yz *= rot((.5*PI*(u_mouse.y/u_resolution.y-.5)));
    p.xz *= rot((.5*PI*(u_mouse.x/u_resolution.x-.5)));
    return p;
}

void main() {
    vec2 uv = (gl_FragCoord.xy-.5*u_resolution.xy)/u_resolution.y;
    vec3 eye = camera(vec3(0,0,-2.5));
    vec3 ray = camera(normalize(vec3(uv,.7)));
    vec3 pos = eye;
    float shade = 0.;
    Shape shape;
    for (float i = 0.; i <= 1.; i += STEPS) {
        shape = map(pos);
        if (shape.dist < VOLUME) { shade = 1.-i; break; }
        shape.dist *= .9 + .1 * rng(uv+fract(u_time));
        pos += ray * shape.dist;
    }
	vec3 color = shape.color;
    vec3 normal = getNormal(pos);
    vec3 view = normalize(eye-pos);
    vec3 lightPos = vec3(1.,0,-2.);
    lightPos.xy *= rot(u_time*.5);
    color = getDiffuse(color*.1, color, pos, normal, lightPos);
    color *= dot(normal,view);
    color = pow(color, vec3(1.0/2.2));
    color *= shade;
    gl_FragColor = vec4(color,1.0);
}
