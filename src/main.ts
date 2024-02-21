// @ts-nocheck

import '@lottiefiles/lottie-player';
import { Viewer } from '@photo-sphere-viewer/core';
import { EquirectangularTilesAdapter } from '@photo-sphere-viewer/equirectangular-tiles-adapter';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import { Audio, AudioListener, AudioLoader, PositionalAudio, Scene, Vector3 } from 'three';
import './style.css';

import '@photo-sphere-viewer/core/index.css';
import '@photo-sphere-viewer/markers-plugin/index.css';
import { CSS3DObject, CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js';
import { changePano, markersPluginOptions } from './marker';
import { renderMarkerVr } from './marker-vr';
import { delay } from './util';
import { GyroscopePlugin } from '@photo-sphere-viewer/gyroscope-plugin';

const pathSvgElement = document.getElementById('path-svg')!;

export const viewer = new Viewer({
  container: 'viewer',
  adapter: EquirectangularTilesAdapter,
  plugins: [
    [MarkersPlugin, markersPluginOptions],
    [
      GyroscopePlugin,
      {
        absolutePosition: false,
        touchmove: true,
      },
    ],
  ],
  // fisheye: true,
});

// gyroscope
document.querySelector('.gyroscope').addEventListener('click', () => {
  document.querySelector('.psv-button.psv-button--hover-scale.psv-gyroscope-button')!.click();
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

  let isGotoMarkerDone = false;

  const markersPlugin = viewer.getPlugin<MarkersPlugin>(MarkersPlugin);
  markersPlugin.addEventListener(
    'goto-marker-done',
    () => {
      isGotoMarkerDone = true;
    },
    { once: true }
  );

  viewer.textureLoader
    .preloadPanorama({
      name: 'equirectangular',
      width: 5000,
      cols: 16,
      rows: 8,
      baseUrl: `static/${panorama}/pano_low.jpg`,
      tileUrl: (col: string, row: string) => {
        return `static/${panorama}/pano_${col}_${row}.jpg`;
      },
    })
    .then((textureData: any) => {
      const handleChangePano = async () => {
        (document.querySelector('.psv-container canvas')! as HTMLCanvasElement).toBlob(
          (blob) => {
            if (!blob) return;

            const url = URL.createObjectURL(blob);
            const imgElement = document.createElement('img');
            imgElement.id = 'panorama-image-transition';
            imgElement.src = url;
            document.body.appendChild(imgElement);

            imgElement.onload = async () => {
              await viewer.setPanorama(textureData.panorama, {
                panoData: textureData.panoData,
                speed: 0,
                zoom: 50,
                showLoader: false,
                transition: false,
              });

              if (cb) cb();

              imgElement.style.opacity = '0';
              imgElement.style.transform = 'scale(1.5)';

              await delay(1300);
              imgElement.remove();
            };
          },
          'image/jpeg',
          0.5
        );
      };

      if (isGotoMarkerDone) {
        return handleChangePano();
      }

      return markersPlugin.addEventListener('goto-marker-done', handleChangePano, { once: true });
    });
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

const listener = new AudioListener();
viewer.renderer.camera.add(listener);

// create a global audio source
const sound = new PositionalAudio(listener);

// load a sound and set it as the Audio object's buffer
const audioLoader = new AudioLoader();
audioLoader.load(
  'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  function (buffer) {
    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(1);
    sound.play();
    videoElement.children[0]!.play();
  },
  (e) => {
    console.log(e);
  }
);

// videoObject.add(sound);

const animate = () => {
  requestAnimationFrame(animate);
  renderer.render(scene, viewer.renderer.camera);
};

// animate();

viewer.addEventListener('size-updated', () => {
  const markersPlugin = viewer.getPlugin<MarkersPlugin>(MarkersPlugin);
  const currentPanoImage = markersPlugin.getCurrentMarker();
  console.log(currentPanoImage);

  console.log(`viewer size updated to ${viewer.getSize().width}x${viewer.getSize().height}`);
  // viewer.needsUpdate();
  renderer.setSize(viewer.getSize().width, viewer.getSize().height);
});

const container = document.querySelector('.psv-container')! as HTMLElement;

container.style.cursor = 'default';

container.addEventListener('pointerdown', (_e) => {
  console.log('pointerdown');
  document.body.style.cursor = 'move';
});

container.addEventListener('pointerup', (_e) => {
  document.body.style.cursor = 'default';
  console.log('pointerup');
});

const render = async () => {
  await changePano('１Fショップテナント');
  renderMarkerVr();
};

render();

// cut tiles from image
//magick.exe pano.jpg -crop 625x625 -quality 95 -set filename:tile "%[fx:page.x/625]_%[fx:page.y/625]" -set filename:orig %t %[filename:orig]_%[filename:tile].jpg
