import { Mesh, MeshBasicMaterial, SphereGeometry } from 'three';
import { viewer } from './main';

export const renderMarkerVr = () => {
  const geometry = new SphereGeometry(150, 32, 16);
  const material = new MeshBasicMaterial({ color: 0xffff00 });
  const sphere = new Mesh(geometry, material);
  sphere.position.setFromSphericalCoords(5000, 1.5707963267948966, 1.1902899496825317);
  viewer.renderer.addObject(sphere);
};
