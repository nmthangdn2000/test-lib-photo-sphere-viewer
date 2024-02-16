import '@lottiefiles/lottie-player';
import { Viewer } from '@photo-sphere-viewer/core';
import { EquirectangularTilesAdapter } from '@photo-sphere-viewer/equirectangular-tiles-adapter';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import { Raycaster, Scene, Vector2, Vector3, WebGLRenderer } from 'three';
import './style.css';

import '@photo-sphere-viewer/core/index.css';
import '@photo-sphere-viewer/markers-plugin/index.css';
import { CSS3DObject, CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js';
import { changePano, markersPluginOptions } from './marker';
import { delay } from './util';

const pathSvgElement = document.getElementById('path-svg')!;

export const viewer = new Viewer({
  container: 'viewer',
  adapter: EquirectangularTilesAdapter,
  plugins: [[MarkersPlugin, markersPluginOptions]],

  // fisheye: true,
});

// const pointRadar = document.getElementById('point-radar')!;

rotateAndZoom(viewer.getPosition().yaw - Math.PI / 6, viewer.getZoomLevel());

viewer.addEventListener('before-rotate', (e) => {
  rotateAndZoom(e.position.yaw - Math.PI / 6, viewer.getZoomLevel());
});

viewer.addEventListener('zoom-updated', (e) => {
  rotateAndZoom(viewer.getPosition().yaw - Math.PI / 6, e.zoomLevel);
});

function rotateAndZoom(radian: number, zoom: number) {
  const radius = 24;

  const scale = 1 - zoom / 100;
  const radiusScaled = scale * (Math.PI / 8) + Math.PI / 8;

  const startX = radius * Math.cos(radian - radiusScaled) + radius;
  const startY = radius * Math.sin(radian - radiusScaled) + radius;

  const endX = radius * Math.cos(radian + radiusScaled) + radius;
  const endY = radius * Math.sin(radian + radiusScaled) + radius;

  const path = `M 24.5,24.5 L ${startX},${startY} A ${radius},${radius} 0 0 1 ${endX},${endY} Z`;

  pathSvgElement.setAttribute('d', path);
}

export const transitionPanorama = async (panorama: string, cb: () => void, isFirtLoadPano: boolean) => {
  if (isFirtLoadPano) {
    await setPanorama(panorama);
    if (cb) cb();
    return;
  }

  const render = (viewer.renderer as any).renderer as WebGLRenderer;
  viewer.needsUpdate();

  viewer.addEventListener(
    'render',
    () => {
      render.domElement.toBlob(
        (blob) => {
          if (!blob) return;

          console.log('blob', blob);

          const url = URL.createObjectURL(blob);
          const imgElement = document.createElement('img');
          imgElement.id = 'panorama-image-transition';
          imgElement.src = url;

          document.body.appendChild(imgElement);

          imgElement.onload = async () => {
            await setPanorama(panorama);

            if (cb) cb();

            imgElement.style.opacity = '0';
            imgElement.style.transform = 'scale(1.5)';

            await delay(700);
            imgElement.remove();
          };
        },
        'image/jpeg',
        0.5
      );
    },
    { once: true }
  );
};

const setPanorama = async (panorama: string) => {
  const path = `static/${panorama}`;

  await viewer.setPanorama(
    {
      name: 'equirectangular',
      width: 5000,
      cols: 16,
      rows: 8,
      baseUrl: `${path}/pano_low.jpg`,
      tileUrl: (col: string, row: string) => {
        return `${path}/pano_${col}_${row}.jpg`;
      },
    },
    {
      speed: 0,
      zoom: 50,
      showLoader: false,
      transition: false,
    }
  );
};

const videoElement = document.getElementById('video')! as HTMLVideoElement;

const scene = new Scene();
const renderer = new CSS3DRenderer();
renderer.setSize(viewer.getSize().width, viewer.getSize().height);
document.body.appendChild(renderer.domElement);

const videoObject = new CSS3DObject(videoElement);
// videoObject.position.set(5000, 0, 2000);
videoObject.position.setFromSphericalCoords(5000, 1.5707963267948966, 1.1902899496825317);
videoObject.rotation.set(0, Math.PI / 4, 0);
scene.add(videoObject);

var position = videoObject.position;

// Tính toán bán kính từ vị trí của đối tượng
var radius = position.distanceTo(new Vector3(0, 0, 0));

// Tính toán góc theta
var theta = Math.atan2(position.x, position.z);

// Tính toán góc phi
var phi = Math.acos(position.y / radius);

console.log('radius', radius, 'theta', theta, 'phi', phi);

videoElement.onclick = () => {
  console.log(videoElement.parentNode);
  videoElement.classList.add('video');
  videoElement.classList.add('active');
  videoElement.parentNode!.classList.add('container-video');
  videoElement.parentNode!.classList.add('active');
};

viewer.addEventListener('click', async ({ data }) => {
  console.log(`${data.rightclick ? 'right ' : ''}clicked at yaw: ${data.yaw} pitch: ${data.pitch}`);
  console.log({
    yaw: data.yaw,
    pitch: data.pitch,
  });

  videoElement.classList.remove('active');
  videoElement.parentNode!.classList.remove('active');
  await delay(700);

  videoElement.classList.remove('video');
  videoElement.parentNode!.classList.remove('container-video');
});

const animate = () => {
  if (videoElement.children[0]!.played.length === 0) {
    videoElement.children[0]!.play();
  }
  requestAnimationFrame(animate);
  renderer.render(scene, viewer.renderer.camera);
};

animate();

viewer.addEventListener('size-updated', () => {
  const markersPlugin = viewer.getPlugin<MarkersPlugin>(MarkersPlugin);
  const currentPanoImage = markersPlugin.getCurrentMarker();
  console.log(currentPanoImage);

  console.log(`viewer size updated to ${viewer.getSize().width}x${viewer.getSize().height}`);
  viewer.needsUpdate();
  renderer.setSize(viewer.getSize().width, viewer.getSize().height);
});

const container = document.querySelector('.psv-container')! as HTMLElement;

container.style.cursor = 'default';

container.addEventListener('pointerdown', (e) => {
  console.log('pointerdown');
  document.body.style.cursor = 'move';
});

container.addEventListener('pointerup', (e) => {
  document.body.style.cursor = 'default';
  console.log('pointerup');
});

const render = async () => {
  await changePano('１Fショップテナント');
};

render();

// cut tiles from image
//magick.exe pano.jpg -crop 625x625 -quality 95 -set filename:tile "%[fx:page.x/625]_%[fx:page.y/625]" -set filename:orig %t %[filename:orig]_%[filename:tile].jpg
