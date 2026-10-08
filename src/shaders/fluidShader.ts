// Ambient Google Developer Mesh & Digital Grid Shader
// Replaces the chaotic iridescent oil-slick with a sleek, high-end Google I/O ambient aurora
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
  uniform float uIsDark; // 1.0 for dark mode, 0.0 for light mode
  
  varying vec2 vUv;
  
  // Authentic Google brand palette
  const vec3 BLUE   = vec3(0.259, 0.522, 0.957); // #4285F4
  const vec3 RED    = vec3(0.918, 0.263, 0.208); // #EA4335
  const vec3 YELLOW = vec3(0.984, 0.737, 0.016); // #FBBC04
  const vec3 GREEN  = vec3(0.204, 0.659, 0.325); // #34A853

  // High-performance smooth glow function
  float blob(vec2 uv, vec2 center, float radius) {
    float d = length(uv - center);
    return exp(-pow(d / radius, 1.8));
  }

  void main() {
    vec2 uv = vUv;
    vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
    vec2 aspectUv = (uv - 0.5) * aspect + 0.5;
    vec2 aspectMouse = (uMouse - 0.5) * aspect + 0.5;

    float t = uTime * 0.35;

    // Organic, elegant paths for the 4 Google color ambient lights
    vec2 pBlue   = vec2(0.28 + 0.16 * sin(t * 0.7),         0.68 + 0.12 * cos(t * 0.6));
    vec2 pRed    = vec2(0.72 + 0.14 * cos(t * 0.8 + 1.2),   0.70 + 0.15 * sin(t * 0.9 + 0.5));
    vec2 pYellow = vec2(0.55 + 0.18 * sin(t * 0.5 + 2.4),   0.28 + 0.12 * cos(t * 0.7 + 1.8));
    vec2 pGreen  = vec2(0.22 + 0.15 * cos(t * 0.6 + 3.1),   0.32 + 0.14 * sin(t * 0.5 + 2.2));

    // Calculate smooth soft ambient light contributions
    float bBlue   = blob(aspectUv, pBlue, 0.52);
    float bRed    = blob(aspectUv, pRed, 0.48);
    float bYellow = blob(aspectUv, pYellow, 0.45);
    float bGreen  = blob(aspectUv, pGreen, 0.46);

    // Interactive mouse glow (soft highlight tracking cursor)
    float mouseGlow = blob(aspectUv, aspectMouse, 0.32) * (0.45 + min(uMouseVelocity * 0.25, 0.55));

    // Subtle, elegant digital tech grid
    vec2 gridUv = fract(uv * vec2(36.0 * aspect.x, 36.0));
    vec2 gridDist = abs(gridUv - 0.5);
    float gridLine = max(gridDist.x, gridDist.y);
    float gridMask = smoothstep(0.485, 0.5, gridLine);
    
    // Vignette for dark mode
    float vignette = 1.0 - length((uv - 0.5) * 1.35);
    vignette = clamp(vignette, 0.0, 1.0);
    vignette = smoothstep(0.0, 1.0, vignette);

    // Soft grain to prevent banding
    float grain = (fract(sin(dot(uv + t * 0.01, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.018;

    // --- DARK MODE COMPOSITION ---
    vec3 darkBg = vec3(0.024, 0.027, 0.035); // #060709 Deep Obsidian
    vec3 darkColor = darkBg;
    darkColor += BLUE * (bBlue * 0.42);
    darkColor += RED * (bRed * 0.35);
    darkColor += YELLOW * (bYellow * 0.32);
    darkColor += GREEN * (bGreen * 0.36);
    darkColor += mix(BLUE, vec3(0.5, 0.8, 1.0), 0.5) * (mouseGlow * 0.28);
    darkColor += vec3(0.12, 0.15, 0.22) * (gridMask * 0.14 * vignette);
    darkColor += vec3(grain);
    darkColor *= mix(0.7, 1.0, vignette);

    // --- LIGHT MODE COMPOSITION ---
    // Warm clean white / off-white matching --surface-100 (#FAFAFA)
    vec3 lightBg = vec3(0.985, 0.985, 0.988);
    vec3 lightColor = lightBg;
    // Gentle pastel washes of Google colors in light mode
    lightColor = mix(lightColor, BLUE, bBlue * 0.13);
    lightColor = mix(lightColor, RED, bRed * 0.10);
    lightColor = mix(lightColor, YELLOW, bYellow * 0.10);
    lightColor = mix(lightColor, GREEN, bGreen * 0.11);
    lightColor = mix(lightColor, BLUE, mouseGlow * 0.10);
    // Delicate soft tech grid for light mode
    lightColor = mix(lightColor, vec3(0.80, 0.84, 0.90), gridMask * 0.18);
    lightColor += vec3(grain * 0.5);

    // Smoothly blend between light and dark modes
    vec3 finalColor = mix(lightColor, darkColor, uIsDark);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;
