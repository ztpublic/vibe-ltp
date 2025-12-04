declare module '*.css' {
  const content: string;
  export default content;
}

declare module '*.svg' {
  const content: any;
  export default content;
}

declare module 'react-conditionally-render' {
  import type { ReactNode } from 'react';

  export interface ConditionallyRenderProps {
    condition: boolean;
    show: ReactNode;
    elseShow?: ReactNode;
  }

  const ConditionallyRender: React.FC<ConditionallyRenderProps>;
  export default ConditionallyRender;
}
