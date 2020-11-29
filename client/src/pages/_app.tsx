import React from "react";
import { CSSReset, ThemeProvider } from "@chakra-ui/core";

import theme from "../theme";

const MyApp: React.FC<any> = ({ Component, pageProps }) => (
  <ThemeProvider theme={theme}>
    <CSSReset />
    <Component {...pageProps} />
  </ThemeProvider>
);

export default MyApp;
