import{r as n,u as de,c as be,a as O,_ as Te,D as ue,V as $,O as me,P as he,b as Re,C as fe,d as Ie,j as t,e as Le,F as T}from"./index-BxivTDtF.js";const D=new $,q=new $,Oe=new $,le=new Re;function Ae(e,o,s){const r=D.setFromMatrixPosition(e.matrixWorld);r.project(o);const i=s.width/2,a=s.height/2;return[r.x*i+i,-(r.y*a)+a]}function Ne(e,o){const s=D.setFromMatrixPosition(e.matrixWorld),r=q.setFromMatrixPosition(o.matrixWorld),i=s.sub(r),a=o.getWorldDirection(Oe);return i.angleTo(a)>Math.PI/2}function We(e,o,s,r){const i=D.setFromMatrixPosition(e.matrixWorld),a=i.clone();a.project(o),le.set(a.x,a.y),s.setFromCamera(le,o);const c=s.intersectObjects(r,!0);if(c.length){const m=c[0].distance;return i.distanceTo(s.ray.origin)<m}return!0}function De(e,o){if(o instanceof me)return o.zoom;if(o instanceof he){const s=D.setFromMatrixPosition(e.matrixWorld),r=q.setFromMatrixPosition(o.matrixWorld),i=o.fov*Math.PI/180,a=s.distanceTo(r);return 1/(2*Math.tan(i/2)*a)}else return 1}function Fe(e,o,s){if(o instanceof he||o instanceof me){const r=D.setFromMatrixPosition(e.matrixWorld),i=q.setFromMatrixPosition(o.matrixWorld),a=r.distanceTo(i),c=(s[1]-s[0])/(o.far-o.near),m=s[1]-c*o.far;return Math.round(c*a+m)}}const K=e=>Math.abs(e)<1e-10?0:e;function xe(e,o,s=""){let r="matrix3d(";for(let i=0;i!==16;i++)r+=K(o[i]*e.elements[i])+(i!==15?",":")");return s+r}const He=(e=>o=>xe(o,e))([1,-1,1,1,1,-1,1,1,1,-1,1,1,1,-1,1,1]),ke=(e=>(o,s)=>xe(o,e(s),"translate(-50%,-50%)"))(e=>[1/e,1/e,1/e,1,-1/e,-1/e,-1/e,-1,1/e,1/e,1/e,1,1,1,1,1]);function Ge(e){return e&&typeof e=="object"&&"current"in e}const J=n.forwardRef(({children:e,eps:o=.001,style:s,className:r,prepend:i,center:a,fullscreen:c,portal:m,distanceFactor:l,sprite:j=!1,transform:h=!1,occlude:d,onOcclude:v,castShadow:w,receiveShadow:A,material:Y,geometry:F,zIndexRange:R=[16777271,0],calculatePosition:H=Ae,as:z="div",wrapperClass:_,pointerEvents:Q="auto",...M},ee)=>{const{gl:te,camera:f,scene:oe,size:p,raycaster:ve,events:pe,viewport:ge}=de(),[x]=n.useState(()=>document.createElement(z)),U=n.useRef(),y=n.useRef(null),se=n.useRef(0),k=n.useRef([0,0]),N=n.useRef(null),X=n.useRef(null),I=(m==null?void 0:m.current)||pe.connected||te.domElement.parentNode,C=n.useRef(null),G=n.useRef(!1),V=n.useMemo(()=>d&&d!=="blending"||Array.isArray(d)&&d.length&&Ge(d[0]),[d]);n.useLayoutEffect(()=>{const g=te.domElement;d&&d==="blending"?(g.style.zIndex=`${Math.floor(R[0]/2)}`,g.style.position="absolute",g.style.pointerEvents="none"):(g.style.zIndex=null,g.style.position=null,g.style.pointerEvents=null)},[d]),n.useLayoutEffect(()=>{if(y.current){const g=U.current=be(x);if(oe.updateMatrixWorld(),h)x.style.cssText="position:absolute;top:0;left:0;pointer-events:none;overflow:hidden;";else{const u=H(y.current,f,p);x.style.cssText=`position:absolute;top:0;left:0;transform:translate3d(${u[0]}px,${u[1]}px,0);transform-origin:0 0;`}return I&&(i?I.prepend(x):I.appendChild(x)),()=>{I&&I.removeChild(x),g.unmount()}}},[I,h]),n.useLayoutEffect(()=>{_&&(x.className=_)},[_]);const re=n.useMemo(()=>h?{position:"absolute",top:0,left:0,width:p.width,height:p.height,transformStyle:"preserve-3d",pointerEvents:"none"}:{position:"absolute",transform:a?"translate3d(-50%,-50%,0)":"none",...c&&{top:-p.height/2,left:-p.width/2,width:p.width,height:p.height},...s},[s,a,c,p,h]),je=n.useMemo(()=>({position:"absolute",pointerEvents:Q}),[Q]);n.useLayoutEffect(()=>{if(G.current=!1,h){var g;(g=U.current)==null||g.render(n.createElement("div",{ref:N,style:re},n.createElement("div",{ref:X,style:je},n.createElement("div",{ref:ee,className:r,style:s,children:e}))))}else{var u;(u=U.current)==null||u.render(n.createElement("div",{ref:ee,style:re,className:r,children:e}))}});const L=n.useRef(!0);O(g=>{if(y.current){f.updateMatrixWorld(),y.current.updateWorldMatrix(!0,!1);const u=h?k.current:H(y.current,f,p);if(h||Math.abs(se.current-f.zoom)>o||Math.abs(k.current[0]-u[0])>o||Math.abs(k.current[1]-u[1])>o){const S=Ne(y.current,f);let E=!1;V&&(Array.isArray(d)?E=d.map(P=>P.current):d!=="blending"&&(E=[oe]));const W=L.current;if(E){const P=We(y.current,f,ve,E);L.current=P&&!S}else L.current=!S;W!==L.current&&(v?v(!L.current):x.style.display=L.current?"block":"none");const B=Math.floor(R[0]/2),ye=d?V?[R[0],B]:[B-1,0]:R;if(x.style.zIndex=`${Fe(y.current,f,ye)}`,h){const[P,ie]=[p.width/2,p.height/2],Z=f.projectionMatrix.elements[5]*ie,{isOrthographicCamera:ae,top:we,left:Me,bottom:Ee,right:Ce}=f,Se=He(f.matrixWorldInverse),Pe=ae?`scale(${Z})translate(${K(-(Ce+Me)/2)}px,${K((we+Ee)/2)}px)`:`translateZ(${Z}px)`;let b=y.current.matrixWorld;j&&(b=f.matrixWorldInverse.clone().transpose().copyPosition(b).scale(y.current.scale),b.elements[3]=b.elements[7]=b.elements[11]=0,b.elements[15]=1),x.style.width=p.width+"px",x.style.height=p.height+"px",x.style.perspective=ae?"":`${Z}px`,N.current&&X.current&&(N.current.style.transform=`${Pe}${Se}translate(${P}px,${ie}px)`,X.current.style.transform=ke(b,1/((l||10)/400)))}else{const P=l===void 0?1:De(y.current,f)*l;x.style.transform=`translate3d(${u[0]}px,${u[1]}px,0) scale(${P})`}k.current=u,se.current=f.zoom}}if(!V&&C.current&&!G.current)if(h){if(N.current){const u=N.current.children[0];if(u!=null&&u.clientWidth&&u!=null&&u.clientHeight){const{isOrthographicCamera:S}=f;if(S||F)M.scale&&(Array.isArray(M.scale)?M.scale instanceof $?C.current.scale.copy(M.scale.clone().divideScalar(1)):C.current.scale.set(1/M.scale[0],1/M.scale[1],1/M.scale[2]):C.current.scale.setScalar(1/M.scale));else{const E=(l||10)/400,W=u.clientWidth*E,B=u.clientHeight*E;C.current.scale.set(W,B,1)}G.current=!0}}}else{const u=x.children[0];if(u!=null&&u.clientWidth&&u!=null&&u.clientHeight){const S=1/ge.factor,E=u.clientWidth*S,W=u.clientHeight*S;C.current.scale.set(E,W,1),G.current=!0}C.current.lookAt(g.camera.position)}});const ne=n.useMemo(()=>({vertexShader:h?void 0:`
          /*
            This shader is from the THREE's SpriteMaterial.
            We need to turn the backing plane into a Sprite
            (make it always face the camera) if "transfrom"
            is false.
          */
          #include <common>

          void main() {
            vec2 center = vec2(0., 1.);
            float rotation = 0.0;

            // This is somewhat arbitrary, but it seems to work well
            // Need to figure out how to derive this dynamically if it even matters
            float size = 0.03;

            vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
            vec2 scale;
            scale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );
            scale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );

            bool isPerspective = isPerspectiveMatrix( projectionMatrix );
            if ( isPerspective ) scale *= - mvPosition.z;

            vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale * size;
            vec2 rotatedPosition;
            rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
            rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
            mvPosition.xy += rotatedPosition;

            gl_Position = projectionMatrix * mvPosition;
          }
      `,fragmentShader:`
        void main() {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        }
      `}),[h]);return n.createElement("group",Te({},M,{ref:y}),d&&!V&&n.createElement("mesh",{castShadow:w,receiveShadow:A,ref:C},F||n.createElement("planeGeometry",null),Y||n.createElement("shaderMaterial",{side:ue,vertexShader:ne.vertexShader,fragmentShader:ne.fragmentShader})))}),Ve=[{id:"leads",name:"LEADS",color:"#9E9E9E",position:[-5,0,0]},{id:"techops",name:"TECH_OPS",color:"#4285F4",position:[-2.5,0,0]},{id:"design",name:"DESIGN",color:"#EA4335",position:[0,0,0]},{id:"media",name:"MEDIA",color:"#FBBC04",position:[2.5,0,0]},{id:"logistics",name:"LOGISTICS",color:"#34A853",position:[5,0,0]}],Be={leads:[{id:0,name:"Rakesh",role:"Lead",codename:"ORBIT"},{id:9,name:"Kishore",role:"Co-lead",codename:"PULSE"}],techops:[{id:1,name:"Lokesh JR",role:"Tech-Ops Lead",codename:"CIPHER"},{id:2,name:"Prasanna",role:"Tech-Ops Co-Lead",codename:"VECTOR"}],design:[{id:3,name:"Aishwarya",role:"Design Lead",codename:"PRISM"},{id:4,name:"Akshithaa",role:"Design Co-Lead",codename:"PIXEL"}],media:[{id:5,name:"Benin",role:"Media Lead",codename:"LENS"},{id:6,name:"Madhusha Harini",role:"Media Co-Lead",codename:"SIGNAL"}],logistics:[{id:7,name:"Venkat",role:"Logistics Lead",codename:"NEXUS"},{id:8,name:"Aboorvan",role:"Logistics Co-Lead",codename:"RELAY"}]};function $e(e,o){return e.map(s=>({...s,members:(o==null?void 0:o[s.id])??Be[s.id]}))}const Ye={classic:{width:.8,height:1.1,gapX:.35,gapY:.35,glowPadding:.2,infoOffsetY:.4,infoWidth:90,textScale:1},grid:{width:.55,height:.78,gapX:.32,gapY:.32,glowPadding:.14,infoOffsetY:.28,infoWidth:80,textScale:.85}};function ze(e){return Ye[e]}function _e(e){if(e.codename)return e.codename;const o=e.name.trim();return o?o.split(/\s+/).filter(Boolean).map(r=>r[0].toUpperCase()).join("")||o.toUpperCase():"OPERATIVE"}function Ue(e){return e>24?.6:e>18?.7:e>12?.8:e>8?.9:1}function Xe(e,o){if(e<=0)return[];const s=Math.min(6,Math.max(3,Math.ceil(Math.sqrt(e)))),r=Math.ceil(e/s),i=s*o.width+(s-1)*o.gapX,a=r*o.height+(r-1)*o.gapY,c=-i/2+o.width/2,m=a/2-o.height/2,l=[];for(let j=0;j<e;j+=1){const h=Math.floor(j/s),d=j%s,v=c+d*(o.width+o.gapX),w=m-h*(o.height+o.gapY),A=h*-.12;l.push([v,w,A])}return l}const ce={uniforms:{uTime:{value:0},uColor:{value:new fe("#4285F4")},uHover:{value:0}},vertexShader:`
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec3 vWorldPosition;
    
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,fragmentShader:`
    uniform float uTime;
    uniform vec3 uColor;
    uniform float uHover;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec3 vWorldPosition;
    
    // Noise function for distortion
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }
    
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
        f.y
      );
    }
    
    // Rainbow/iridescent color
    vec3 rainbow(float t) {
      vec3 c = vec3(
        0.5 + 0.5 * cos(6.28318 * (t + 0.0)),
        0.5 + 0.5 * cos(6.28318 * (t + 0.33)),
        0.5 + 0.5 * cos(6.28318 * (t + 0.67))
      );
      return c;
    }
    
    void main() {
      vec2 uv = vUv;
      
      // === NOISE DISTORTION ===
      float noiseVal = noise(uv * 8.0 + uTime * 0.5) * 0.02;
      uv += noiseVal * uHover;
      
      // === FRESNEL / RIM LIGHTING ===
      vec3 viewDir = normalize(vViewPosition);
      float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 4.0);
      
      // === RAINBOW IRIDESCENT FRESNEL ===
      float iridescence = fresnel * 0.5 + uv.y * 0.3 + uTime * 0.1;
      vec3 rainbowColor = rainbow(iridescence) * fresnel * 0.6;
      
      // === ANIMATED SCANLINES ===
      float scanline1 = sin(uv.y * 150.0 - uTime * 3.0) * 0.5 + 0.5;
      float scanline2 = sin(uv.y * 50.0 + uTime * 1.5) * 0.5 + 0.5;
      float scanlines = smoothstep(0.3, 0.7, scanline1) * 0.1 + smoothstep(0.4, 0.6, scanline2) * 0.05;
      
      // === CHROMATIC ABERRATION ===
      float aberrationStrength = 0.01 + uHover * 0.02;
      vec2 redOffset = vec2(aberrationStrength, 0.0);
      vec2 blueOffset = vec2(-aberrationStrength, 0.0);
      
      // === PULSE WAVE ===
      float pulse = sin(uTime * 2.0 + uv.y * 10.0) * 0.5 + 0.5;
      float pulseWave = smoothstep(0.0, 0.1, abs(fract(uv.y - uTime * 0.2) - 0.5) - 0.45) * 0.3;
      
      // === GLITCH EFFECT ===
      float glitch = 0.0;
      if (uHover > 0.3) {
        float glitchTime = uTime * 60.0;
        float glitchLine = step(0.96, sin(glitchTime + uv.y * 25.0));
        float glitchBlock = step(0.98, hash(vec2(floor(uTime * 10.0), floor(uv.y * 8.0))));
        glitch = (glitchLine + glitchBlock * 2.0) * 0.15 * uHover;
      }
      
      // === EDGE GLOW ===
      float edgeX = smoothstep(0.0, 0.15, uv.x) * smoothstep(1.0, 0.85, uv.x);
      float edgeY = smoothstep(0.0, 0.1, uv.y) * smoothstep(1.0, 0.9, uv.y);
      float edgeGlow = (1.0 - edgeX * edgeY) * 0.5;
      
      // === HOLOGRAPHIC GRID ===
      float gridX = smoothstep(0.48, 0.5, abs(fract(uv.x * 20.0) - 0.5));
      float gridY = smoothstep(0.48, 0.5, abs(fract(uv.y * 28.0) - 0.5));
      float grid = (gridX + gridY) * 0.03 * (1.0 - fresnel);
      
      // === COMPOSE FINAL COLOR ===
      vec3 baseColor = uColor * 0.25;
      vec3 rimColor = uColor * fresnel * 2.5;
      vec3 pulseColor = uColor * pulseWave;
      vec3 glowColor = uColor * edgeGlow * 1.5;
      
      vec3 finalColor = baseColor + rimColor + rainbowColor + scanlines + pulseColor + glowColor + grid + glitch;
      
      // === ALPHA ===
      float alpha = 0.5 + fresnel * 0.5 + edgeGlow * 0.3;
      alpha = clamp(alpha, 0.0, 1.0);
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `};function Ze({member:e,color:o,position:s,index:r,metrics:i}){const a=n.useRef(null),c=n.useRef(null),[m,l]=n.useState(!1),j=_e(e),{width:h,height:d,glowPadding:v,infoOffsetY:w,infoWidth:A,textScale:Y}=i,F=h<.7?"text-[10px]":"text-xs",R=n.useMemo(()=>({uTime:{value:0},uColor:{value:new fe(o)},uHover:{value:0}}),[o]);return O(({clock:H})=>{if(c.current){c.current.uniforms.uTime.value=H.elapsedTime;const z=m?1:0;c.current.uniforms.uHover.value+=(z-c.current.uniforms.uHover.value)*.1}}),t.jsx(T,{speed:2,rotationIntensity:.2,floatIntensity:.3,position:s,children:t.jsxs("group",{children:[t.jsxs("mesh",{ref:a,onPointerEnter:()=>l(!0),onPointerLeave:()=>l(!1),children:[t.jsx("planeGeometry",{args:[h,d]}),t.jsx("shaderMaterial",{ref:c,transparent:!0,side:ue,uniforms:R,vertexShader:ce.vertexShader,fragmentShader:ce.fragmentShader})]}),t.jsx(J,{position:[0,-w,.01],center:!0,style:{pointerEvents:"none",width:A,transform:`scale(${Y})`,transformOrigin:"center"},children:t.jsxs("div",{className:"text-center",style:{maxWidth:"100%"},children:[t.jsxs("p",{className:"text-[8px] font-mono tracking-widest mb-0.5 overflow-hidden text-ellipsis whitespace-nowrap",style:{color:o,textShadow:`0 0 10px ${o}`},children:["// ",j]}),t.jsx("p",{className:`text-white font-display leading-tight text-center break-words ${F}`,style:{wordBreak:"break-word",overflowWrap:"break-word",hyphens:"auto"},children:e.name}),t.jsx("p",{className:"text-white/50 text-[8px] text-center leading-tight break-words",style:{wordBreak:"break-word",overflowWrap:"break-word",hyphens:"auto"},children:e.role})]})}),t.jsxs("mesh",{position:[0,0,-.1],children:[t.jsx("planeGeometry",{args:[h+v,d+v]}),t.jsx("meshBasicMaterial",{color:o,transparent:!0,opacity:m?.15:.05})]})]})})}function Ke({color:e}){const o=n.useRef(null),s=e==="#FFFFFF"?"#E6E6E6":e;return O(({clock:r})=>{o.current&&(o.current.rotation.y=r.elapsedTime*.08)}),t.jsxs("group",{ref:o,children:[t.jsxs("mesh",{position:[0,.55,-.4],children:[t.jsx("cylinderGeometry",{args:[.35,.45,.2,32]}),t.jsx("meshStandardMaterial",{color:s,emissive:s,emissiveIntensity:.35,transparent:!0,opacity:.7})]}),t.jsxs("mesh",{position:[0,.85,-.4],rotation:[Math.PI/2,0,0],children:[t.jsx("torusGeometry",{args:[.5,.03,12,48]}),t.jsx("meshStandardMaterial",{color:s,emissive:s,emissiveIntensity:.6,transparent:!0,opacity:.7})]}),t.jsx(T,{speed:1.2,floatIntensity:.2,children:t.jsxs("mesh",{position:[0,1.2,-.4],children:[t.jsx("octahedronGeometry",{args:[.12,0]}),t.jsx("meshStandardMaterial",{color:s,emissive:s,emissiveIntensity:.8,wireframe:!0})]})})]})}function qe({color:e}){const o=n.useRef(null);return O(({clock:s})=>{o.current&&(o.current.rotation.y=s.elapsedTime*.1)}),t.jsxs("group",{ref:o,children:[[...Array(3)].map((s,r)=>t.jsx(T,{speed:1.5,floatIntensity:.2,children:t.jsxs("mesh",{position:[(r-1)*.6,.8+r*.2,-.5],children:[t.jsx("boxGeometry",{args:[.3,.5,.1]}),t.jsx("meshStandardMaterial",{color:e,emissive:e,emissiveIntensity:.3,transparent:!0,opacity:.6})]})},r)),t.jsx("gridHelper",{args:[2,10,e,e],position:[0,-1,0]})]})}function Je({color:e}){const o=n.useRef(null);return O(({clock:s})=>{o.current&&(o.current.rotation.y=-s.elapsedTime*.08)}),t.jsxs("group",{ref:o,children:[t.jsx(T,{speed:2,floatIntensity:.3,children:t.jsxs("mesh",{position:[.5,.7,-.3],rotation:[.5,.5,0],children:[t.jsx("icosahedronGeometry",{args:[.2,0]}),t.jsx("meshStandardMaterial",{color:e,emissive:e,emissiveIntensity:.5,wireframe:!0})]})}),t.jsx(T,{speed:1.8,floatIntensity:.25,children:t.jsxs("mesh",{position:[-.4,.9,-.2],rotation:[.3,.7,0],children:[t.jsx("octahedronGeometry",{args:[.15,0]}),t.jsx("meshStandardMaterial",{color:e,emissive:e,emissiveIntensity:.5,wireframe:!0})]})})]})}function Qe({color:e}){return t.jsx("group",{children:[...Array(8)].map((o,s)=>t.jsx(T,{speed:3,floatIntensity:.5,children:t.jsxs("mesh",{position:[(s-4)*.15,.8,-.4],children:[t.jsx("boxGeometry",{args:[.05,.1+Math.sin(s*.8)*.15,.02]}),t.jsx("meshStandardMaterial",{color:e,emissive:e,emissiveIntensity:.8})]})},s))})}function et({color:e}){return t.jsxs("group",{children:[t.jsx("gridHelper",{args:[2,8,e,e],position:[0,-1,0]}),t.jsx(T,{speed:1.2,floatIntensity:.15,children:t.jsxs("mesh",{position:[.6,.6,-.5],children:[t.jsx("boxGeometry",{args:[.25,.25,.25]}),t.jsx("meshStandardMaterial",{color:e,emissive:e,emissiveIntensity:.3})]})})]})}function tt({bay:e,isActive:o,onClick:s,layoutMode:r}){const i=n.useRef(null),a=r==="classic"&&e.members.length<=2,c=n.useMemo(()=>ze(r),[r]),m=n.useMemo(()=>a?e.members.map((v,w)=>[(w-.5)*1,0,.5]):Xe(e.members.length,c),[e.members.length,e.members,c,a]),l=n.useMemo(()=>a?1:Ue(e.members.length),[e.members.length,a]),j=a?[0,0,0]:[0,-.25,.6],h=r==="grid"?.9:1.1,d=()=>{switch(e.id){case"leads":return t.jsx(Ke,{color:e.color});case"techops":return t.jsx(qe,{color:e.color});case"design":return t.jsx(Je,{color:e.color});case"media":return t.jsx(Qe,{color:e.color});case"logistics":return t.jsx(et,{color:e.color})}};return t.jsxs("group",{ref:i,position:e.position,children:[t.jsxs("mesh",{position:[0,-1.2,0],rotation:[-Math.PI/2,0,0],onClick:s,children:[t.jsx("circleGeometry",{args:[h,32]}),t.jsx("meshStandardMaterial",{color:e.color,emissive:e.color,emissiveIntensity:o?.5:.1,transparent:!0,opacity:.3})]}),d(),o&&e.members.length>0&&t.jsx("group",{scale:l,position:j,children:e.members.map((v,w)=>t.jsx(Ze,{member:v,color:e.color,position:m[w],index:w,metrics:c},v.id))}),t.jsx(J,{position:[0,-1.5,0],center:!0,children:t.jsx("button",{onClick:s,className:"px-4 py-1 font-mono text-xs tracking-widest transition-all",style:{color:e.color,textShadow:o?`0 0 20px ${e.color}`:"none",background:o?`${e.color}20`:"transparent",border:`1px solid ${o?e.color:"transparent"}`,borderRadius:4},children:e.name})})]})}function ot({activeBay:e,baysData:o,overviewZ:s,focusZ:r}){const{camera:i}=de();return O(()=>{const a=o.find(l=>l.id===e);let c=0,m=s;a&&(c=a.position[0],m=r),i.position.x+=(c-i.position.x)*.05,i.position.z+=(m-i.position.z)*.05,i.lookAt(c,0,0)}),null}function st({activeBay:e,onSelectBay:o,isDark:s,baysData:r,layoutMode:i,overviewZ:a,focusZ:c}){const m=s?"#050505":"#FAF6E8";return t.jsxs(t.Fragment,{children:[t.jsx("color",{attach:"background",args:[m]}),t.jsx("fog",{attach:"fog",args:[m,5,15]}),t.jsx(ot,{activeBay:e,baysData:r,overviewZ:a,focusZ:c}),r.map(l=>t.jsx(tt,{bay:l,isActive:e===l.id,onClick:()=>o(l.id),layoutMode:i},l.id)),t.jsx("ambientLight",{intensity:.2}),t.jsx("pointLight",{position:[0,5,5],intensity:1}),r.map(l=>t.jsx("spotLight",{position:[l.position[0],3,2],color:l.color,intensity:e===l.id?2:.3,angle:.5,penumbra:1},l.id))]})}function rt({activeBay:e,baysData:o}){const s=o.find(r=>r.id===e);return t.jsxs("div",{className:"absolute inset-0 pointer-events-none z-10",children:[t.jsxs("div",{className:"absolute top-6 left-6 right-6",children:[t.jsxs("div",{className:"flex items-center gap-3 mb-2",children:[t.jsx("div",{className:"w-2 h-2 rounded-full bg-red-500 animate-pulse"}),t.jsx("p",{className:"text-[10px] font-mono tracking-[0.3em] text-red-500/70",children:"RESTRICTED ACCESS // CLEARANCE LEVEL: CORE"})]}),t.jsxs("h2",{className:"text-4xl md:text-5xl font-display text-[rgb(var(--foreground))] transition-colors duration-300",children:["CORE ",t.jsx("span",{style:{color:s!=null&&s.color?s.color:"rgb(var(--text-primary-raw))"},children:"TEAM"})]}),s&&t.jsxs("p",{className:"text-[rgb(var(--foreground))]/40 font-mono text-xs mt-2 transition-colors duration-300",children:["SELECTED // ",s.members.length," OPERATIVES IN ",s.name]})]}),t.jsxs("div",{className:"absolute bottom-6 left-6 right-6 flex justify-between text-[10px] font-mono text-[rgb(var(--foreground))]/30 transition-colors duration-300",children:[t.jsxs("span",{children:["SYSTEM: ",t.jsx("span",{className:"text-green-600",children:"ONLINE"})]}),t.jsx("span",{children:"SELECT BAY TO VIEW OPERATIVES"})]})]})}function nt({colors:e}){const o=e.length>0?e:["#4285F4","#EA4335","#FBBC04","#34A853"];return t.jsx(J,{center:!0,children:t.jsx("div",{className:"flex gap-2",children:o.map((s,r)=>t.jsx("div",{className:"w-3 h-3 rounded-full animate-pulse",style:{backgroundColor:s,animationDelay:`${r*.15}s`}},s))})})}function at({membersByBay:e,layoutMode:o,bayMeta:s,cameraConfig:r}){const[i,a]=n.useState(null),{theme:c}=Ie(),m=n.useMemo(()=>s??Ve,[s]),l=n.useMemo(()=>$e(m,e),[m,e]),j=n.useMemo(()=>l.map(v=>v.color),[l]),h=o??"classic",d=n.useMemo(()=>({overviewZ:6,overviewY:1,focusZ:3,fov:50,...r}),[r]);return t.jsxs("div",{className:"relative w-full h-screen bg-background transition-colors duration-300",children:[t.jsx(rt,{activeBay:i,baysData:l}),t.jsx(Le,{camera:{position:[0,d.overviewY,d.overviewZ],fov:d.fov},dpr:[1,2],gl:{antialias:!0},children:t.jsx(n.Suspense,{fallback:t.jsx(nt,{colors:j}),children:t.jsx(st,{activeBay:i,onSelectBay:a,isDark:c==="dark",baysData:l,layoutMode:h,overviewZ:d.overviewZ,focusZ:d.focusZ})})}),i&&t.jsx("button",{onClick:()=>a(null),className:"absolute top-6 right-6 px-4 py-2 font-mono text-xs text-[rgb(var(--foreground))]/50 hover:text-[rgb(var(--foreground))] border border-[rgb(var(--foreground))]/20 hover:border-[rgb(var(--foreground))]/40 rounded transition-all z-20",children:"← BACK TO OVERVIEW"})]})}export{at as TeamGarage3D,at as default};
