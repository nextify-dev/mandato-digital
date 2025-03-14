// src/utils/styles/globals.ts

import styled, { createGlobalStyle } from 'styled-components'

export const Globals = {
  breakpoints: {
    desktop: '1000px',
    tablet: '760px',
    mobile: '500px'
  },
  layout: {
    padding: '15px',
    header: {
      height: '60px'
    },
    sidebar: {
      width: {
        expanded: '220px',
        collapsed: '70px'
      }
    },
    content: {
      maxWidth: '1180px',
      headerHeight: '60px'
    }
  }
}

const GlobalStyle = createGlobalStyle`
  :root {
    font-size: 14px;

    @media screen and (min-width: 1024px) {
      font-size: 16px;
    }
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    border: none;
    outline: none;
    font-family: 'Roboto', sans-serif;
    /* font-family: "Montserrat", sans-serif; */
    /* font-family: "Baloo Paaji 2", sans-serif; */
    /* font-family: "Barlow", sans-serif; */
    /* font-family: "Open Sans", sans-serif; */
    text-decoration: none;
    /* user-select: none; */

    -webkit-tap-highlight-color: transparent !important;
  }

  scroll-behavior: smooth;
`

export default GlobalStyle

/* ::-webkit-scrollbar {
    width: 4px;
    border-radius: 10px;
    z-index: 1000;
  }

  ::-webkit-scrollbar-track {
    background: ${Colors.scrollbarTrack};
  }

  ::-webkit-scrollbar-thumb {
    border-radius: 10px;
    background: ${Colors.scrollbarThumb};
  } */
