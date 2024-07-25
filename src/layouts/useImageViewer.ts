import Viewer from 'viewerjs';

export interface UseImageViewerProps {
  element: HTMLElement;
  options?: Viewer.Options;
}
export function useImageViewer(props: UseImageViewerProps) {
  const { element, options } = props;
  document.addEventListener('astro:page-load', () => {
    const gallery = new Viewer(element, options);
    gallery.show();
    console.log('🚀 ~ document.addEventListener ~ gallery:', gallery);
  });
}
