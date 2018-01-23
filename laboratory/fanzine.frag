#ifdef GL_ES
precision mediump float;
#endif

#extension GL_OES_standard_derivatives : enable

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

#define thin 0.005

float circle (vec2 o, vec2 p, float r, float t) {
	float d = length(o-p);
	return (1.-smoothstep(r,r+thin, d))*smoothstep(r-t,r+thin-t, d);
}

float disk (vec2 o, vec2 p, float r) {
	return 1.-smoothstep(r,r+thin,length(o-p));
}

float square (vec2 o, vec2 p, vec2 r) {
	return (1.-smoothstep(r.x,r.x+thin,abs(p.x-o.x)))*(1.-smoothstep(r.y,r.y+thin,abs(p.y-o.y)));
}

mat2 rot (float a) {
  float c=cos(a),s=sin(a);
  return mat2(c,-s,s,c);
}

void main ( void ) {

	vec2 p = (gl_FragCoord.xy-.5*resolution.xy)/resolution.y;

  p *= 1.5;

	float a = atan(p.y,p.x);
	float r = length(p);

	vec3 color = vec3(1,1,0);

  p.x *= 1.+max(0.,p.y-.1)*.5;

vec2 pp = p;
color *= 1.-square(p, vec2(0, -.03), vec2(.26,.207));
color *= 1.-square(p, vec2(0, .2), vec2(.26,.207));
color *= 1.-square(p, vec2(0, .45), vec2(.1));
color += square(p, vec2(0,-.03), vec2(.25,.2));

	p.x = abs(p.x);
	color *= 1.-disk(p, vec2(.12,0), .01);

  color *= 1.-disk(p, vec2(.4,.07), .04);
  color *= 1.-disk(p, vec2(.11,.4), .15);
  color *= 1.-circle(p, vec2(0.12,0.), .1, .01);

    p = pp;
  	color *= 1.-square(p, vec2(0,.07), vec2(.4,.04));

    pp = p;
    p -= vec2(.2,-.3);
    p *= rot(1.5);
    float nose = 1.-smoothstep(0.,thin,(p.x-p.y*3.))*smoothstep(0.,thin,p.y-p.x);

        //color *= nose;

    p = pp;
        p -= vec2(.185,-.28);
        p *= rot(1.5);
    nose = smoothstep(0.,thin,(p.x-p.y*3.))*smoothstep(0.,thin,p.y*1.01-p.x);

    //color += nose;
    p = (gl_FragCoord.xy-.5*resolution.xy)/resolution.y;
    color += .01/abs(sin(p.x*10.+time)-p.y*5.);

	gl_FragColor = vec4( color, 1. );

}
