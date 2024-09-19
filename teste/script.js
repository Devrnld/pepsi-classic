const w = window.innerWidth;
const h = window.innerHeight;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000);
const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
camera.position.z = 10;
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);


const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(1024, { format: THREE.RGBFormat });
const cubeCamera = new THREE.CubeCamera(0.1, 100, cubeRenderTarget);

const geometry = new THREE.TorusGeometry(2, .3, 100, 100);

const material = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0.0 },
        envMap: { value: cubeCamera.renderTarget.texture },
    },
    vertexShader: `
        varying vec2 vUv;
        uniform float time;

        mat2 getRotationMatrix(float angle) {
            float cosA = cos(angle);
            float sinA = sin(angle);
            return mat2(cosA, -sinA, sinA, cosA);
        }

        void main() {
            vUv = uv;
            // Aplica la rotación a las coordenadas UV
            float angle = time * -0.0005; // Ajusta la velocidad de rotación
            vUv = getRotationMatrix(angle) * (vUv - 0.5) + 0.5;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        varying vec2 vUv;
        uniform float time;
        uniform samplerCube envMap;

        void main() {
            float lines = abs(sin((vUv.y - time) * 20.80)); // Ajusta la velocidad con el valor de multiplicación
            vec3 lineColor = mix(vec3(0.424, 0.008, 0.027), vec3(0.0), step(0.2, lines));

            vec3 reflectedColor = textureCube(envMap, normalize(reflect(vec3(0.0, 0.0, 1.0), vec3(vUv, 1.0)))).rgb;

            vec3 finalColor = mix(lineColor, reflectedColor, 0.3); // Mezcla de líneas y reflejo

            gl_FragColor = vec4(finalColor, 1.0); // Mantener opaco (sin transparencia)
        }
    `,
    side: THREE.DoubleSide,
    transparent: false,
});


const torus = new THREE.Mesh(geometry, material);
const torus2 = new THREE.Mesh(geometry, material);
const torus3 = new THREE.Mesh(geometry, material);

torus.scale.set(1.8, 1.8, 1.8);
torus.rotation.x = Math.PI / 2;
torus.rotation.y = -10;
torus2.rotation.x = 10;
torus2.scale.set(1.8, 1.8, 1.8);
torus3.rotation.x = -10;
torus3.rotation.y = -10;
torus3.scale.set(1.8, 1.8, 1.8);

scene.add(torus);
scene.add(torus2);
scene.add(torus3);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x555555);
scene.add(hemiLight);

const pointLight1 = new THREE.PointLight(0xffffff, 2, 100);
pointLight1.position.set(0, 0, 0);
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0xffffff, 1.5, 100);
pointLight2.position.set(0, 0, 5);
scene.add(pointLight2);

const vertexShader = `
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  varying vec2 vUv;
  
  void main() {
    vec2 grid = mod(vUv * 20.0, 1.0); // Ajusta el tamaño de la cuadrícula
    float line = min(grid.x, grid.y);
    float visible = smoothstep(0.02, 0.03, line); // Ajusta el grosor de las líneas

    vec3 color1 = vec3(0.0, 1.0, 1.0); // Color cyan
    vec3 color2 = vec3(1.0, 0.0, 1.0); // Color magenta
    
    vec3 color = mix(color1, color2, vUv.y); // Mezcla los colores según la posición vertical
    gl_FragColor = vec4(color * visible, 1.0);
  }
`;

const gridMaterial = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    time: { value: 0.0 }
  },
  side: THREE.DoubleSide
});

const planeGeometry = new THREE.PlaneGeometry(100, 100);
const gridPlane = new THREE.Mesh(planeGeometry, gridMaterial);
gridPlane.rotation.x = -Math.PI / 2;
gridPlane.position.y = -10;
gridPlane.receiveShadow = true;
scene.add(gridPlane);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minPolarAngle = Math.PI / 2;
controls.maxPolarAngle = Math.PI / 2;
controls.minDistance = 15;
controls.maxDistance = 15.02;

let angle = 0;

function animate() {
    requestAnimationFrame(animate);

    angle -= 0.0010;
    camera.position.x = 20 * Math.sin(angle);
    camera.position.z = 20 * Math.cos(angle);
    camera.lookAt(scene.position); 

    material.uniforms.time.value += 0.0007; 

    controls.update();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
});
