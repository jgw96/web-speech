import { TestWindow } from '@stencil/core/testing';
import { SpeechDetail } from './speech-detail';

describe('speech-detail', () => {
  it('should build', () => {
    expect(new SpeechDetail()).toBeTruthy();
  });

  describe('rendering', () => {
    let element: HTMLSpeechDetailElement;
    let testWindow: TestWindow;
    beforeEach(async () => {
      testWindow = new TestWindow();
      element = await testWindow.load({
        components: [SpeechDetail],
        html: '<speech-detail></speech-detail>'
      });
    });

    // See https://stenciljs.com/docs/unit-testing
    {cursor}

  });
});
