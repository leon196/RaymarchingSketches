// Kirby
// Leon 2018/01/24
// Using code from IQ, Mercury, LJ, Duke, Koltes

#define STEPS 30.
#define VOLUME .01
#define FAR 10.
#define PI 3.14159
#define TAU 2.*PI

const vec3 pink = vec3(0.917,0.482,0.663);
const vec3 red = vec3(0.825,0.142,0.111);
const vec3 beige = vec3(0.905, 0.670, 0.235);
const vec3 blue = vec3(0.058, 0.074, 0.560);
const vec3 blueSky = vec3(0.741, 0.941, 1);
const vec3 green1 = vec3(0.298,0.830,0.153);
const vec3 green2 = vec3(0.038,0.260,0.047);
const vec3 gold = vec3(1, 0.858, 0.058);

// sdf toolbox
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
vec3 lookAt (vec3 eye, vec3 target, vec2 uv) {
  vec3 forward = normalize(target-eye);
  vec3 right = normalize(cross(vec3(0,1,0), forward));
  vec3 up = normalize(cross(forward, right));
  return normalize(forward + uv.x * right + uv.y * up);
}

struct Shape {
    float dist;
    vec3 color;
    float spec;
    float glow;
};
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
    float wave = .5+.5*sin(iTime*5.);
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

    // body compo
    kirby.dist = min(min(body, foot), hand);
    kirby.color = mix(pink, red, step(foot, body));
    // kirby.spec = 1.;
    kirby.glow = 1.;

    // eyes
    p = pos;
    p.y -= .3;
    p.y *= 1./smoothstep(.0,.1,abs(sin(iTime)));
    p.x = abs(p.x) - .2;
    p.x *= 2.;
    p.y *= .75;
    kirby.color = mix(kirby.color, vec3(0), step(length(p.xy), .2));
    p.y -= .1;
    p.y *= 1.6;
    kirby.color = mix(kirby.color, vec3(1), step(length(p.xy), .1));
    p.y += .2;
    p.x *= .75;
    p.y *= .4;
    kirby.color = mix(kirby.color, blue, clamp(-p.y*10.,0.,1.)*step(length(p.xy), .1));

    // open mouth
    p = pos;
    p.x *= .5;
    p.y += .2-abs(p.x*.2);
    float d = length(p.xy);
    float mouth = step(d, .1);
    kirby.color = mix(kirby.color, red, mouth);
    kirby.color = mix(kirby.color, red*.1, mouth*(1.-clamp(-p.y*10.+.5,0.,1.)));

    // cheeks
    p = pos;
    p.x = abs(p.x) - .5;
    p *= 6.;
    p.x *= .75;
    kirby.color = mix(kirby.color, red, .75*(1.-smoothstep(0.5,1.,length(p.xy))));

    return kirby;
}

Shape sdGround (vec3 pos) {
    Shape ground = newShape();
    vec3 p;
    p = pos;
    p.y += 1.;
    float cell = .5;
    float height = .2;
    float padding = .45;
    p.xz = repeat(p.xz, cell);
    p.y += 1. + height;
    ground.dist = smin(p.y, sdBox(p, vec3(cell*padding, height, cell*padding)), .2);
    p.y -= 1.;
    ground.dist = smin(ground.dist, max(sdBox(pos,vec3(1,3,1)),sdBox(p, vec3(cell*padding, height, cell*padding))), .2);
    ground.color = beige;
    return ground;
}

Shape sdPlant (vec3 pos) {
    Shape plant = newShape();
    plant.spec = .5;
    plant.glow = 1.;
    float radius = 2.;
    pos.y += 1.;
    pos.xyz = pos.zxy;
    vec3 p = pos;
    p.xy = toroidal(p.xy, radius);
    p.y *= 2.;
    p.xz *= rot(p.y * 2.+sin(p.y+iTime));
    float id = amod(p.xz,2.);
    p.x -= .2;
    p.xz *= rot(-p.y+iTime+sin(p.y-iTime*2.)*5.);
    id += amod(p.xz, 4.);
    p.x -= .1;
    plant.dist = sdCylinder(p.xz, .04);
    plant.color = mix(green1, green2, mod(id,2.));
    return plant;
}


Shape sdStar (vec3 pos) {
    Shape star = newShape();
    star.spec = 1.;
    star.glow = 1.;
    float radius = 5.;
    float size = .2;
    vec3 p = pos;
    p.y -= radius;
    p.xy *= rot(-iTime*.5);
    float index = amod(p.xy, 16.);
    p.x -= radius-1.5;
    p.xy *= rot(iTime+index);
    amod(p.xy, 5.);
    star.dist = sdIso(p, size);
    star.color = gold;
    return star;
}

Shape map (vec3 pos) {
    Shape scene = newShape();
    vec3 p = pos;
    scene = add(scene, sdKirby(p));
    scene = add(scene, sdGround(p));
    scene = add(scene, sdPlant(p));
    scene = add(scene, sdStar(p));
    return scene;
}


vec3 camera (vec3 p) {
    // p.yz *= rot((.5*PI*(iMouse.y/iResolution.y-.5)));
    // p.xz *= rot((.5*PI*(iMouse.x/iResolution.x-.5)));
    p.xz *= rot((.5*PI*(.4*sin(iTime*.1))));
    return p;
}

vec3 raymarch (vec2 uv) {
    vec3 eye = camera(vec3(0,1,-5.5));
    vec3 ray = lookAt(eye, vec3(0), uv);
    float shade = 0., dist = 0.;
    vec3 pos = eye;
    Shape shape;
    for (float i = 0.; i <= 1.; i += 1./STEPS) {
        shape = map(pos);
        if (shape.dist < VOLUME || dist > FAR) { shade = 1.-i; break; }
        shape.dist *= .9 + .1 * rng(uv+fract(iTime));
        dist += shape.dist;
        pos = eye + ray * dist;
    }
	   vec3 color = shape.color;
    vec3 normal = getNormal(pos);
    vec3 view = normalize(eye-pos);
    vec3 lightPos = vec3(1.,0,-2.);
    lightPos.xy *= rot(iTime*.5);
    lightPos.y += 2.;
    vec3 lightDir = normalize(lightPos-pos);
    float light = clamp(dot(lightDir, normal),0.,1.);
    float ambient = .8;
    color = mix(shape.color * ambient, shape.color, light);
    color = mix(color, vec3(1), shape.spec*clamp(pow(light,16.),0.,1.));
    color *= .3+.7*getShadow(pos, lightPos, 64.)*clamp(dot(lightDir,normal),0.,1.);
    color = mix(color, shape.color, (1.-abs(dot(normal, view))) * shape.glow);
    color *= shade;
    float far = 1.-smoothstep(FAR/2.,FAR,dist);
    float y = uv.y + sin(uv.x*3.-iTime+sin(uv.x*6.+iTime))*.05;
    color = mix(beige*abs(y), color, far);
    color = pow(color, vec3(1./2.));
    color = mix(color, mix(blueSky, blue, y), (1.-far)*step(0.,y));
    return color;
}
