import { MarkerConfig, MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import { transitionPanorama, viewer } from './main';
import { btnArrowHtml } from './constants';
import { delay } from './util';

const panoSources: {
  panoImage: string;
  markers: MarkerConfig[];
}[] = [
  {
    panoImage: '１Fショップテナント',
    markers: [
      {
        id: 'marker1',
        zoomLvl: 90,
        position: { yaw: 0.32, pitch: 0.11 },
        html: btnArrowHtml("hostpotClick1('基準階')"),
        style: {
          cursor: 'pointer',
        },
        tooltip: {
          content: '基準階へ',
          className: 'tooltip',
        },
      },
    ],
  },
  {
    panoImage: '基準階',
    markers: [
      {
        id: 'marker2',
        zoomLvl: 90,
        position: { yaw: 0.45, pitch: 0.11 },
        html: btnArrowHtml("hostpotClick2('１Fショップテナント')"),
        style: {
          cursor: 'pointer',
        },
      },
      {
        id: 'marker3',
        zoomLvl: 90,
        position: [
          //
          { yaw: 1.2230436911127225, pitch: 0.14037690546984805 }, // top left
          { yaw: 1.8346766954562461, pitch: 0.15662609693111595 }, // top right
          { yaw: 1.8682788343563637, pitch: -0.10436793519965781 }, // bottom right
          { yaw: 1.277119761142057, pitch: -0.12183787981946459 }, // bottom left
        ],
        videoLayer: 'static/video/videoAI.webm',
        style: {
          cursor: 'pointer',
        },
        // html: `<video id="video" autoplay loop playsinline style="width: 100%; height: 100%;" src="static/video/video-receptionist.webm"/>`,
      },
    ],
  },
];

export const changePano = async (panoImage: string) => {
  const markersPlugin = viewer.getPlugin<MarkersPlugin>(MarkersPlugin);

  const currentPanoImage = markersPlugin.getCurrentMarker();

  if (currentPanoImage) {
    await markersPlugin.gotoMarker(currentPanoImage.id, 700);
    await delay(300);
  }

  panoSources.forEach(async (panoSource) => {
    if (panoSource.panoImage === panoImage) {
      await transitionPanorama(
        panoImage,
        () => {
          viewer.getPlugin<MarkersPlugin>(MarkersPlugin).setMarkers(panoSource.markers);

          const markeVideos = panoSource.markers.filter((marker) => marker.videoLayer);
          if (markeVideos.length < 1) return;

          markeVideos.forEach(async (marker) => {
            const videoElement = markersPlugin.getMarker(marker.id).video;
            videoElement.muted = false;
          });
        },
        !currentPanoImage
      );
    }
  });
};

export const markersPluginOptions = {
  markers: panoSources[0].markers,
};

(window as any).hostpotClick1 = async (toPanoImage: string) => changePano(toPanoImage);

(window as any).hostpotClick2 = async (toPanoImage: string) => changePano(toPanoImage);
