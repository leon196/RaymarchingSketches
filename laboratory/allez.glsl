precision mediump float;

const float PI = 3.14159;
const float TAU = 6.28318;

#define time iGlobalTime

#define repeat(p,c) (mod(p,c)-c/2.)
#define sdist(p,r) (length(p)-r)

float rng (vec2 seed) { return fract(sin(dot(seed*.1684,vec2(54.649,321.547)))*450315.); }
mat2 rot (float a) { float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }
float sdBox( vec3 p, vec3 b ) { vec3 d = abs(p) - b; return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0)); }
float amod (inout vec2 p, float count) { float an = TAU/count; float a = atan(p.y,p.x)+an/2.; float c = floor(a/an); c = mix(c,abs(c),step(count*.5,abs(c))); a = mod(a,an)-an/2.; p.xy = vec2(cos(a),sin(a))*length(p); return c; }
float amodIndex (vec2 p, float count) { float an = TAU/count; float a = atan(p.y,p.x)+an/2.; float c = floor(a/an); c = mix(c,abs(c),step(count*.5,abs(c))); return c; }
vec2 toroidal (vec2 p, float r) { return vec2(length(p.xy)-r, atan(p.y,p.x)); }
vec3 getCamera (vec3 eye, vec3 lookAt, vec2 uv) {
	vec3 forward = normalize(lookAt - eye);
	vec3 right = normalize(cross(forward, vec3(0,1,0)));
	vec3 up = normalize(cross(right, forward));
	return normalize(.6 * forward + uv.x * right + uv.y * up);
}

vec2 map (vec3 pos) {
	float scene = 1000.;
	vec3 p = pos;
	p.z = repeat(p.z, 1.);
	p.xz *= rot(time*.9);
	p.yz *= rot(time*.6);
	scene = max(0., max(abs(p.z), max(abs(p.x)-.2, abs(p.y)-.2)));
	return vec2(scene, 0.);
}

vec4 raymarch () {
	vec2 uv = (gl_FragCoord.xy-.5*iResolution.xy)/iResolution.y;
	float dither = rng(uv.xx+uv.yy);
	vec3 eye = vec3(0,2,-1);
	vec3 target = vec3(0,0,0);
	vec3 ray = getCamera(eye, target, uv);
	vec3 pos = eye;
	float shade = 0.;
	float total = 0.;
	vec2 sdf;
	for (float i = 0.; i <= 1.; i += 1./100.) {
		sdf = map(pos);
		float dist = sdf.x;
		if (dist < .0001) { shade = 1.-i; break; }
		if (total > 100.) { shade = 0.; break; }
		total += dist;
		dist *= .9 + .1 * dither;
		pos += ray * dist;
	}
	shade *= 1. - smoothstep(50., 99., total);
	return vec4(vec3(smoothstep(.0, .8, shade)), 1);
}

void main () {
	gl_FragColor = raymarch();
}
