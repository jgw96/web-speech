import { Config } from '@stencil/core';

// https://stenciljs.com/docs/config

export const config: Config = {
  outputTargets: [{ type: 'www', copy: [{ src: '.well-known' }] }],
  globalScript: 'src/global/app.ts',
  globalStyle: 'src/global/app.css'
};
