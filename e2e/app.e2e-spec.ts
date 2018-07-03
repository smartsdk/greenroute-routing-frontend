import { SmartSDKPage } from './app.po';

describe('smart-sdk App', () => {
  let page: SmartSDKPage;

  beforeEach(() => {
    page = new SmartSDKPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!!');
  });
});
