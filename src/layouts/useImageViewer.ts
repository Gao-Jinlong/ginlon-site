import Viewer from 'viewerjs';
import 'viewerjs/dist/viewer.css';
export interface UseImageViewerProps {
  element: HTMLElement;
  options?: Viewer.Options;
}
export function useImageViewer(props: UseImageViewerProps) {
  const { element, options } = props;
  document.addEventListener('astro:page-load', () => {
    const images = document.querySelectorAll('img');

    const gallery = new Viewer(element, options);

    images.forEach((img, index) => {
      img.style.cursor = 'pointer';
      img.addEventListener('click', () => {
        gallery.view(index);
      });
    });
  });
}
