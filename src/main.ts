import './style.css';
import '@lottiefiles/lottie-player';
import { Viewer } from '@photo-sphere-viewer/core';
import { EquirectangularTilesAdapter } from '@photo-sphere-viewer/equirectangular-tiles-adapter';
import { WebGLRenderer } from 'three';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';

import '@photo-sphere-viewer/core/index.css';
import '@photo-sphere-viewer/markers-plugin/index.css';
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

  viewer.addEventListener(
    'render',
    () => {
      render.domElement.toBlob(
        (blob) => {
          if (!blob) return;
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

viewer.addEventListener('click', ({ data }) => {
  console.log(`${data.rightclick ? 'right ' : ''}clicked at yaw: ${data.yaw} pitch: ${data.pitch}`);
  console.log({
    yaw: data.yaw,
    pitch: data.pitch,
  });
});

const render = async () => {
  await changePano('１Fショップテナント');
};

render();

// cut tiles from image
//magick.exe pano.jpg -crop 625x625 -quality 95 -set filename:tile "%[fx:page.x/625]_%[fx:page.y/625]" -set filename:orig %t %[filename:orig]_%[filename:tile].jpg
