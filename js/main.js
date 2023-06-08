let camera;
let scene;
let renderer;
let center_coords = (0, 20, 0);
let plane;
let interaction;
let zoomedIn = false;
let orbitControl;
let timeSphere = 0;
let followedObject = 0;

let texture_paths = [
  "images/center.jpg",
  "images/1.jpg",
  "images/2.jpg",
  "images/3.jpg",
  "images/4.jpg",
  "images/5.jpg",
  "images/6.jpg",
  "images/7.jpg",
  "images/8.jpg",
];

let planet_positions = JSON.parse(
  "[[0,20,0],[-38.54248650828258,12.519253740076834,-9.812846829067894],[-26.791500398665058,14.772434320824889,16.57897913740534],[-26.155773977102132,16.212462010536928,-28.38844674595198],[23.957897842342646,13.896435662691596,10.461275901063644],[26.476039777463683,16.058257818668743,-28.708144114677935],[3.176107330997638,14.335054873160985,35.171898013561034],[12.786671796035094,16.604018796820043,27.128402753034138],[14.794872005290628,16.323836166740406,-30.7208535562821865]]"
);

let planet_radius = [5, 4, 4, 3.5, 3.5, 3.5, 3, 3, 3];

let planets = [];

let emits_light = (i) => {
  return i == 0;
};

let setup_camera = () => {
  camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.x = 50;
  camera.position.y = 50;
  camera.position.z = 50;
};

let setup_renderer = () => {
  let container = document.querySelector(".container");
  renderer = new THREE.WebGLRenderer();
  renderer.physicallyCorrectLights = true;
  renderer.gammaInput = true;
  renderer.gammaOutput = true;
  renderer.shadowMap.enabled = true;
  renderer.toneMapping = THREE.ReinhardToneMapping;
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);
};

let setup_orbits = () => {
  orbitControl = new THREE.OrbitControls(camera, renderer.domElement);
  orbitControl.target.set(0, 0, 0);
  orbitControl.update();
  orbitControl.maxPolarAngle = Math.PI / 2 - 0.01;
  orbitControl.minPolarAngle = 0;
  orbitControl.maxDistance = 1000;
  orbitControl.minDistance = 3;
  orbitControl.autoRotate = true;
  orbitControl.autoRotateSpeed = 0.8;
};

let add_plane = () => {
  let texture = new THREE.TextureLoader().load("images/galaxy.jpg");
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 9;
  texture.repeat.set(1, 1);

  plane = new THREE.MeshStandardMaterial({
    map: texture,
    needsUpdate: true,
    roughness: 1,
    color: 0x872580,
  });
  let planeGeometry = new THREE.PlaneBufferGeometry(100, 100);
  let planeMesh = new THREE.Mesh(planeGeometry, plane);
  planeMesh.receiveShadow = true;
  planeMesh.rotation.x = -Math.PI / 2.0;
  scene.add(planeMesh);
};

let add_planet = (texture_path, x, y, z, radius, emits_light, index) => {
  let planet_geometry = new THREE.SphereGeometry(radius, 100, 100);
  let material = new THREE.MeshBasicMaterial({
    map: new THREE.TextureLoader().load(texture_path),
    side: THREE.BackSide,
  });
  planet = new THREE.PointLight(0x008ae6, 2, 50);

  planet_mesh = new THREE.Mesh(planet_geometry, material);
  planet.add(planet_mesh);
  if (emits_light) {
    planet.power = 9000;
  } else {
    planet.power = 0;
  }
  planet.position.set(x, y, z);
  scene.add(planet);

  handle_zoom(planet_mesh, planet, index);
  return planet;
};

let handle_zoom = (mesh, obj, index) => {
  mesh.on("click", function (ev) {
    if (zoomedIn) return;
    zoomedIn = true;
    followedObject = index;
    fitCameraToObject(obj, 0.1);
  });
};

let init = () => {
  setup_camera();
  setup_renderer();

  scene = new THREE.Scene();
  interaction = new THREE.Interaction(renderer, scene, camera);

  setup_orbits();

  for (let i = 0; i < planet_positions.length; i++) {
    let [x, y, z] = planet_positions[i];
    let texture_path = texture_paths[i];
    let radius = planet_radius[i];
    planets.push(add_planet(texture_path, x, y, z, radius, emits_light(i), i));
  }
  
  add_plane();
  window.addEventListener("resize", onWindowResize, false);
};

let onWindowResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};

let animate = () => {
  requestAnimationFrame(animate);
  render();
};

let rotatePoint = (point, center, angle) => {
  let rotatedX =
    Math.cos(angle) * (point.position.x - center.position.x) -
    Math.sin(angle) * (point.position.z - center.position.z) +
    center.position.x;
  let rotatedZ =
    Math.sin(angle) * (point.position.x - center.position.x) +
    Math.cos(angle) * (point.position.z - center.position.z) +
    center.position.z;
  let rotatedY = point.position.y;
  return [rotatedX, rotatedY, rotatedZ];
};

let render = () => {
  timeSphere = Date.now() / 1000000000000000;
  planets[0].rotateZ(timeSphere);
  for (let i = 1; i < planets.length; i++) {
    planet = planets[i];
    let [rotatedX, rotatedY, rotatedZ] = rotatePoint(
      planet,
      planets[0],
      timeSphere
    );
    planet.position.set(rotatedX, rotatedY, rotatedZ);
    planet.rotateZ(timeSphere);
  }

  renderer.render(scene, camera);
};
init();

animate();

const fitCameraToObject = function (object) {
  const boundingBox = new THREE.Box3();

  // get bounding box of object - this will be used to setup controls and camera
  boundingBox.setFromObject(object);
  const center = boundingBox.getCenter();

  const size = boundingBox.getSize();
  object.add(camera);
  camera.position.z = center.z - 3;
  camera.position.x = center.x - 3;
  camera.position.y = center.y - 3;
  if (followedObject != 0) {
    orbitControl.dIn(
      Math.sqrt(
        center.x * center.x + center.y * center.y + center.z * center.z
      ) * 0.1
    );
  } else {
    orbitControl.dIn(1.5);
  }
  orbitControl.update();
};

let setupKeyControls = () => {
  cube = scene.getObjectByName("cube");
  document.onkeydown = (e) => {
    if (e.which == 27) {
      if (!zoomedIn) return;
      zoomedIn = false;
      camera.position.x = 50;
      camera.position.y = 50;
      camera.position.z = 50;
      camera.fov = 55;
      camera.lookAt(center_coords);
      camera.updateProjectionMatrix();
      orbitControl.target.set(0, 0, 0);
      orbitControl.maxDistance = 1000;
      orbitControl.saveState();
      orbitControl.update();
      orbitControl.autoRotate = true;
      followedObject = 0;
      camera.parent.remove(camera);
    }
  };
};

setupKeyControls();
