import { BoxGeometry, Mesh, MeshBasicMaterial } from 'three';
import { viewer } from './main';

export const renderMarkerVr = () => {
  const geometry = new BoxGeometry(100, 100, 100);
  const material = new MeshBasicMaterial({ color: 0xffff00 });
  const sphere = new Mesh(geometry, material);

  sphere.position.set(0, 0, 0);
  viewer.renderer.addObject(sphere);
  viewer.needsUpdate();
};
