// Author:
// Title:

precision mediump float;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

#define STEP 1./30.
#define VOLUME 0.001
#define MIN_STEP .0001
#define PI 3.14159
#define TAU 2.*PI

// raymarch toolbox
float rng (vec2 seed) { return fract(sin(dot(seed*.1684,vec2(54.649,321.547)))*450315.); }
mat2 rot (float a) { float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }
float sdSphere (vec3 p, float r) { return length(p)-r; }
float sdCylinder (vec2 p, float r) { return length(p)-r; }
float sdIso(vec3 p, float r) { return max(0.,dot(p,normalize(sign(p))))-r; }
float sdBox( vec3 p, vec3 b ) {
  vec3 d = abs(p) - b;
  return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
}
float sdTorus( vec3 p, vec2 t ) {
  vec2 q = vec2(length(p.xz)-t.x,p.y);
  return length(q)-t.y;
}
float amod (inout vec2 p, float count) {
    float an = TAU/count;
    float a = atan(p.y,p.x)+an/2.;
    float c = floor(a/an);
    a = mod(a,an)-an/2.;
    p.xy = vec2(cos(a),sin(a))*length(p);
    return c;
}
float repeat (float v, float c) { return mod(v,c)-c/2.; }
float smin (float a, float b, float r) {
    float h = clamp(.5+.5*(b-a)/r, 0., 1.);
    return mix(b,a,h)-r*h*(1.-h);
}
float smax (float a, float b, float r) {
	float h = clamp(.5+.5*(b-a)/r,0.,1.);
	return mix(a,b,h)+r*h*(1.-h);
}
vec3 displaceLoop (vec3 p, float r) {
    float a = atan(p.y,p.x);
    float l = length(p.xy);
    p.xy = vec2(l-r,a);
    return p;
}
float map (vec3 p);
vec3 getNormal (vec3 p) {
    vec2 e = vec2(.01,0);
    return normalize(vec3(map(p+e.xyy)-map(p-e.xyy),map(p+e.yxy)-map(p-e.yxy),map(p+e.yyx)-map(p-e.yyx)));
}
float getShadow (vec3 pos, vec3 at, float k) {
    vec3 dir = normalize(at - pos);
    float maxt = length(at - pos);
    float f = 1.;
    float t = VOLUME*10.;
    for (float i = 0.; i < 1.; i += STEP) {
        float dist = map(pos + dir * t);
        if (dist < VOLUME) return 0.;
        f = min(f, k * dist / t);
        t += dist;
        if (t >= maxt) break;
    }
    return f;
}

float getGeometry (vec3 pos, float radius) {
    float geo = 1000.;
    vec3 p;
    
    // boxy edges
    p = pos;
    geo = min(geo, sdBox(p,vec3(radius,100.,radius)));
    geo = max(geo, -sdCylinder(p.xz,radius*1.1));
    
    // tubes
    p = pos;
    p.xz *= rot(-p.y*4.);
    amod(p.xz,5.);
    p.x-=radius;
    geo = smin(geo, sdCylinder(p.xz,radius*.1),.2*radius);
    
    return geo;
}

float map (vec3 pos) {
    float scene = 1000.;
    
    float kernelSize = .76;
    
    float wave = .75+.25*sin(pos.z+u_time);
    float fade = (1.-smoothstep(0.,kernelSize*2.,abs(pos.z)));
    float twist;
    
    // spiral1
    vec3 p = pos;
   	p.yz *= rot(PI/2.);
    p.xz *= rot(p.y+u_time);
    amod(p.xz,3.);
    p.x -= .4*wave;
    scene = min(scene, getGeometry(p, .2*wave));
    
    // donuts
    p = pos;
    p.z = repeat(p.z, 3.);
    p = displaceLoop(p, 1.);
    p.xz *= rot(p.y+u_time);
    scene = min(scene, getGeometry(p, .2*wave));
    
    // background
    p = pos;
    p = displaceLoop(p, 5.);
    twist = 2.;
    p.z += p.y*twist;
    p.z = repeat(p.z+u_time, PI*twist);
    p.xz *= rot(p.y*.1+u_time);
    scene = smin(scene, getGeometry(p, 1.5), .1);
    return scene;
}

void camera (inout vec3 p) {
    // p.yz *= rot((PI*(u_mouse.y/u_resolution.y-.5)));
    // p.xz *= rot((PI*(u_mouse.x/u_resolution.x-.5)));
    p.xz *= rot(PI/2.);
}

vec3 getDiffuse (vec3 color, vec3 pos, vec3 normal, vec3 lightPos) {
    const vec3 red = vec3(0.915,0.035,0.087);
    vec3 lightDir = normalize(lightPos-pos);
    float light = clamp(dot(lightDir, normal),0.,1.);
    light *= 1.-smoothstep(2.,4.,length(lightPos-pos));
    color.rgb = mix(color.rgb, red, light);
    color.rgb = mix(color.rgb, vec3(1), clamp(pow(light,16.),0.,1.));
    float shadow = .1+.9*getShadow(pos, lightPos, 64.)*clamp(dot(lightDir,normal),0.,1.);
    color.rgb *= shadow;
    return color;
}

float raymarch (inout vec3 pos, vec3 ray, float rnd) {
    float shade = 0.;
    for (float i = 0.; i <= 1.; i += STEP) {
        float dist = map(pos);
        if (dist < VOLUME) shade += STEP;
        if (shade >= 1.) break;
        dist = dist * (.9 + .1 * rnd);
        dist = max(MIN_STEP, dist);
        pos += ray * dist;
    }
    return shade;
}

void main() {
    vec2 uv = (gl_FragCoord.xy-.5*u_resolution.xy)/u_resolution.y;
	vec3 eye = vec3(0,0,-3.);
    vec3 ray = normalize(vec3(uv, .7));
    float rnd = rng(uv+fract(u_time));
    camera(eye);
    camera(ray);
    vec3 pos = eye;
    
    float shade = raymarch(pos, ray, rnd);
    
    vec3 color = vec3(.1);
    vec3 normal = getNormal(pos);
    vec3 light = vec3(1,2,0);
    light.xy *= rot(u_time);
    color = getDiffuse(color, pos, normal, light);
    color *= shade;
    color = pow(color.rgb, vec3(1.0/2.2));
    gl_FragColor = vec4(color,1.0);
}
















