// training for modeling shapes
// using koltes code as base https://www.shadertoy.com/view/XdByD3
// using iq articles
// using Mercury library
// using Sam Hocevar stackoverflow answer

#define PI 3.14159
#define TAU PI*2.
#define iTime iGlobalTime
#define t iTime*.2
vec3 rgb2hsv(vec3 c)
{
	vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
	vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
	vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

	float d = q.x - min(q.w, q.y);
	float e = 1.0e-10;
	return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}
vec3 hsv2rgb(vec3 c)
{
	vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
	vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
	return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}
struct Info { float dist; vec4 color; };
Info info;
mat2 rz2 (float a) { float c=cos(a),s=sin(a); return mat2(c,s,-s,c); }
float sphere (vec3 p, float r) { return length(p)-r; }
float cyl (vec2 p, float r) { return length(p)-r; }
float cyli (vec3 p, float r, float h) { return max(length(p.xy)-r, abs(p.z)-h); }
float iso (vec3 p, float r) { return dot(p,normalize(sign(p)))-r; }
float cube (vec3 p, vec3 r) { return length(max(abs(p)-r,0.)); }
float smin (float a, float b, float r) {
    float h = clamp(.5+.5*(b-a)/r,0.,1.);
    return mix(b,a,h)-r*h*(1.-h);
}
float scol (float a, float b, float r) {
    return clamp(.5+.5*(b-a)/r,0.,1.);
}
vec3 moda (vec2 p, float c) {
    float ca = TAU/c;
    float a = atan(p.y,p.x)+ca*.5;
    float ci = floor(a/ca);
    a = mod(a,ca)-ca*.5;
    return vec3(vec2(cos(a),sin(a))*length(p), ci);
}

float map (vec3 p) {

    vec3 p1 = p;
    p1.xz *= rz2(sin(p.y*.5+t));
    vec3 mod1 = moda(p1.xz, 8.);
    float sens = mix(-1.,1.,mod(mod1.z,2.));
    p1.xz = mod1.xy;
    p1.x -= 2.;
    float c1 = 1.5;
    vec3 p2 = p1;

    // tiges
    p1.y = mod(p1.y+mod1.z+t*sens, c1)-c1*.5;
    float cyl1 = cyl(p1.xz, 0.02);

    // nodes
    c1 = 1.;
    p2.y = mod(p2.y*0.4+mod1.z+t*sens, c1)-c1*.5;
    p2.xz *= rz2(t*.5);
    p2.yz *= rz2(t*.7);
    float sph1 = sphere(p2,.1+.1*(sin(p.y+t*sens)*.5+.5));

    // leaves
    p1.xy *= rz2(.25*sens);
    p1.yz *= rz2(.15*sens);
    p1.x -= .8;
    float l1 = length(p1.xz);
    float a1 = atan(p1.z,p1.x);
    //p1.y += sin(l1*3.)*.1;
    p1.y -= sin(abs(p1.z)*3.)*.1;
    p1.y -= sin(abs(p1.x-.7)*3.)*.1;
    float cyl2 = cyli(p1.xzy,0.7, 0.01*(1.-clamp(l1*10.,0.,1.)));

    // inner tiges
    vec3 p3 = p;
    p3.xz *= rz2(p.y+sin(p.y+t*10.)-t*4.);
    vec3 mod2 = moda(p3.xz, 3.);
    mod2.x -= 0.3+.2*(.5+.5*sin(p.y+t));
    float cyl3 = cyl(mod2.xy, 0.05);

    // inner seeds
    vec3 p4 = p;
    float c4 = 0.6;
    p4.y = mod(p4.y+t*4., c4)-c4*.5;
    float sph2 = sphere(p4, 0.3*(.5+.5*sin(p.y+.5)));

    // water
    vec3 p5 = p;
    p5.xz *= rz2(p.y*.5+t);
    p5.x -= 1.2;
    p5.xz *= rz2(p.y*1.5-t*9.);
    vec3 mod5 = moda(p5.xz, 8.);
    p5.xy = mod5.xy;
    p5.x -= 0.1+(.5*(.5+.5*sin(p.y+3.*t)));
    float a = atan(p5.z,p5.x);
    float l = length(p5.xz);
    float c5 = 4.;
    float cyl4 = cyl(p5.xy, 0.1);

    // colors
    vec4 red = vec4(0.9,0.1,0.2,1);
    vec4 green = vec4(hsv2rgb(vec3(.25,.7,.9)),1);
    vec4 green2 = vec4(hsv2rgb(vec3(.25,.3,.3)),1);
    vec4 blue = vec4(hsv2rgb(vec3(.5,.3,.9)),1);
    vec4 orange = vec4(hsv2rgb(vec3(.15,.7,.9)),1);
    info.color = vec4(1);

    // scene
    float smth = .3;
    float scene;

    float sceneTige = smin(sph1, cyl1, smth);
    float sceneLeaves = smin(cyl2, sceneTige, smth);
    float sceneInner = smin(cyl3, sph2, smth);
    float sceneWater = cyl4;


    info.color = mix(red, orange, scol(cyl3, sph2, .1));

    scene = sceneInner;
    info.color = mix(info.color, green2, scol(sceneTige, scene, smth));

    scene = min(sceneTige, scene);
    info.color = mix(info.color, green, scol(sceneLeaves, scene, .1));

    scene = min(sceneInner, scene);
    info.color = mix(info.color, blue, scol(sceneWater, scene, .9));

    scene = smin(sceneLeaves, sceneInner, smth);
    scene = smin(sceneWater, scene, smth);
    return scene;
}

void main()
{
	vec2 uv = (gl_FragCoord.xy-.5*iResolution.xy)/iResolution.y;
  uv.xy *= rz2(PI/2.);
    vec3 ro = vec3(uv,-8)+vec3(0,1,0), rd = vec3(uv,1), mp = ro;
    int ri = 0;
    for (int i=0;i<50;++i) {
        ri = i;
        float md = map(mp);
        if (md < 0.01) {
            break;
        }
        mp += rd*md*.75;
    }
    float l = length(mp);
    float r = float(ri)/50.;
	gl_FragColor = info.color;
    gl_FragColor *= 1.-r;
}
