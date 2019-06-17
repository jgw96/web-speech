import { TestWindow } from '@stencil/core/testing';
import { SpeechModal } from './speech-modal';

describe('speech-modal', () => {
  it('should build', () => {
    expect(new SpeechModal()).toBeTruthy();
  });

  describe('rendering', () => {
    let element: HTMLSpeechModalElement;
    let testWindow: TestWindow;
    beforeEach(async () => {
      testWindow = new TestWindow();
      element = await testWindow.load({
        components: [SpeechModal],
        html: '<speech-modal></speech-modal>'
      });
    });

    // See https://stenciljs.com/docs/unit-testing
    {cursor}

  });
});
