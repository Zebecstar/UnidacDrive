import type { PropsWithChildren } from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#0C1710" />
        <link rel="icon" href="/zebecstar-mark.svg" type="image/svg+xml" />
        <title>Unidac Drive</title>
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
