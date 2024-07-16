import { merge } from 'lodash-es';
import { ref } from 'vue';

export interface TypewriterProps {
  content: string[];
  speed: number;
  hold: number;
  loop: boolean;
}
const defaultTypewriterProps: TypewriterProps = {
  content: [],
  speed: 100,
  hold: 1000,
  loop: true,
};
export default function useTypewriter(props: TypewriterProps) {
  const { content, speed, hold, loop } = merge(
    {},
    defaultTypewriterProps,
    props,
  );

  let timer: ReturnType<typeof setTimeout>;
  let cursorTimer: ReturnType<typeof setTimeout>;
  const text = ref('');
  const blink = ref(false);

  let index = 0;
  let isDeleting = false;

  const typeText = async () => {
    const currentText = content[index]!;
    stopBlink();
    if (isDeleting) {
      text.value = currentText.substring(0, text.value.length - 1);
    } else {
      text.value = currentText.substring(0, text.value.length + 1);
    }

    if (isDeleting) {
      if (!text.value.length) {
        isDeleting = false;
        index = (index + 1) % content.length;
      }
    } else {
      if (text.value === currentText) {
        isDeleting = true;
        startBlink();
        await new Promise(resolve => setTimeout(resolve, hold));
      }
    }

    if (!loop && index === content.length - 1 && text.value === currentText) {
      stop();
      return;
    }

    timer = setTimeout(typeText, isDeleting ? speed * 0.5 : speed);
  };
  typeText();

  function stop() {
    clearTimeout(timer);
  }

  function startBlink() {
    cursorTimer = setInterval(() => {
      blink.value = !blink.value;
    }, 500);
  }
  function stopBlink() {
    clearInterval(cursorTimer);
    blink.value = true;
  }

  return {
    text,
    blink,
    stop,
  };
}
