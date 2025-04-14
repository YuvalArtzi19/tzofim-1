declare module '@emoji-mart/data' {
  const data: any;
  export default data;
}

declare module '@emoji-mart/react' {
  import { FC } from 'react';

  interface PickerProps {
    data: any;
    onEmojiSelect: (emoji: {
      id: string;
      native: string;
      unified: string;
    }) => void;
    theme?: 'light' | 'dark';
  }

  const Picker: FC<PickerProps>;
  export default Picker;
}