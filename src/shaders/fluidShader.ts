// Fluid simulation shader - GPU-based Navier-Stokes solver
export const fluidVertexShader = `
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const fluidFragmentShader = `
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  uniform float uMouseVelocity;
  
  varying vec2 vUv;
  
  // Google brand colors
  #define BLUE vec3(0.259, 0.522, 0.957)    // #4285F4
  #define RED vec3(0.918, 0.263, 0.208)     // #EA4335
  #define YELLOW vec3(0.984, 0.737, 0.016)  // #FBBC04
  #define GREEN vec3(0.204, 0.659, 0.325)   // #34A853
  
  // Simplex noise functions
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
  
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
             -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
  
  // Fluid simulation using curl noise
  vec2 curl(vec2 p, float t) {
    float eps = 0.01;
    float n1 = snoise(p + vec2(eps, 0.0) + t * 0.1);
    float n2 = snoise(p - vec2(eps, 0.0) + t * 0.1);
    float n3 = snoise(p + vec2(0.0, eps) + t * 0.1);
    float n4 = snoise(p - vec2(0.0, eps) + t * 0.1);
    float dx = (n3 - n4) / (2.0 * eps);
    float dy = -(n1 - n2) / (2.0 * eps);
    return vec2(dx, dy);
  }
  
  void main() {
    vec2 uv = vUv;
    vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
    
    // Mouse influence
    vec2 mouse = uMouse;
    float dist = length((uv - mouse) * aspect);
    float mouseInfluence = smoothstep(0.5, 0.0, dist) * uMouseVelocity;
    
    // Multi-layer fluid simulation
    vec2 flow = vec2(0.0);
    float scale = 3.0;
    
    for(int i = 0; i < 4; i++) {
      float fi = float(i);
      vec2 offset = curl(uv * scale + fi * 0.5, uTime * (0.5 + fi * 0.2));
      flow += offset * (1.0 / (fi + 1.0));
      scale *= 1.5;
    }
    
    // Add mouse-driven vortex
    vec2 toMouse = (uv - mouse) * aspect;
    float angle = atan(toMouse.y, toMouse.x);
    vec2 vortex = vec2(-sin(angle), cos(angle)) * mouseInfluence * 0.5;
    flow += vortex;
    
    // Distort UV with flow
    vec2 distortedUv = uv + flow * 0.08;
    
    // Create color bands based on distorted position
    float colorIndex = snoise(distortedUv * 2.0 + uTime * 0.1) * 0.5 + 0.5;
    colorIndex += mouseInfluence * 0.5;
    
    // Mix Google colors with smooth transitions
    vec3 color;
    if(colorIndex < 0.25) {
      color = mix(BLUE, RED, colorIndex * 4.0);
    } else if(colorIndex < 0.5) {
      color = mix(RED, YELLOW, (colorIndex - 0.25) * 4.0);
    } else if(colorIndex < 0.75) {
      color = mix(YELLOW, GREEN, (colorIndex - 0.5) * 4.0);
    } else {
      color = mix(GREEN, BLUE, (colorIndex - 0.75) * 4.0);
    }
    
    // Add iridescent glow effect
    float glow = snoise(distortedUv * 4.0 - uTime * 0.2) * 0.5 + 0.5;
    glow = pow(glow, 3.0);
    color += glow * 0.3;
    
    // Mouse highlight
    color += vec3(1.0) * mouseInfluence * 0.5;
    
    // Vignette
    float vignette = 1.0 - length((uv - 0.5) * 1.5);
    vignette = smoothstep(0.0, 1.0, vignette);
    
    // Final color with dark base
    vec3 finalColor = color * vignette * 0.6;
    finalColor = mix(vec3(0.02), finalColor, 0.8);
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;
