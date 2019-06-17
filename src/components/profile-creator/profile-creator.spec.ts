import { TestWindow } from '@stencil/core/testing';
import { ProfileCreator } from './profile-creator';

describe('profile-creator', () => {
  it('should build', () => {
    expect(new ProfileCreator()).toBeTruthy();
  });

  describe('rendering', () => {
    let element: HTMLProfileCreatorElement;
    let testWindow: TestWindow;
    beforeEach(async () => {
      testWindow = new TestWindow();
      element = await testWindow.load({
        components: [ProfileCreator],
        html: '<profile-creator></profile-creator>'
      });
    });

    // See https://stenciljs.com/docs/unit-testing
    {cursor}

  });
});
