import Viewer from 'viewerjs';
export interface UseImageViewerProps {
  options?: Viewer.Options;
}
export function useImageViewer(props: UseImageViewerProps) {
  const { options } = props;
  let gallery = new Viewer(document.querySelector('body')!, options);
  document.addEventListener('astro:page-load', () => {
    const images = document.querySelectorAll('img');
    gallery.destroy();
    gallery = new Viewer(document.querySelector('body')!, options);

    images.forEach((img, index) => {
      img.style.cursor = 'pointer';
      img.addEventListener('click', () => {
        gallery?.view(index);
      });
    });
  });
}
