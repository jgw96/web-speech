import { Component, Element, Prop, h, State } from '@stencil/core';


@Component({
  tag: 'speech-detail',
  styleUrl: 'speech-detail.css'
})
export class SpeechDetail {

  @Element() el: HTMLElement;

  @Prop() session: any;

  @State() supportsShare: boolean;

  public componentDidLoad() {
    console.log(this.session);

    if ((navigator as any).canShare) {
      this.supportsShare = true;
    }
    else {
      this.supportsShare = false;
    }
  }

  public async dismiss(): Promise<void> {
    await (this.el.closest('ion-modal') as any).dismiss();
  }

  async share(): Promise<any> {
    const audioFile = new File([this.session.audio], `${this.session.name}.mp4`, {type: 'audio/mp4', lastModified: Date.now()});

    if ((navigator as any).canShare && (navigator as any).canShare( { files: [audioFile] } )) {
      (navigator as any).share({
        files: [audioFile],
        title: 'New notes',
        text: 'Here is that new audio note',
      })
      .then(() => console.log('Share was successful.'))
      .catch((error) => console.log('Sharing failed', error));
    } else {
      console.log('Your system doesn\'t support sharing files.');
    }
  }

  public async copy(message: string) {
    try {
      await navigator.clipboard.writeText(message);
      console.log('Page URL copied to clipboard');
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  }

  render() {
    return [
      <ion-header no-border>
        <ion-toolbar color="primary">
          <ion-buttons slot="start">
            <ion-button onClick={() => this.dismiss()}>
              <ion-icon name="close"></ion-icon>
            </ion-button>
          </ion-buttons>

          <ion-title>{this.session.name}</ion-title>

          {this.supportsShare ? <ion-buttons slot="end">
            <ion-button onClick={() => this.share()} slot="icon-only">
              <ion-icon name="share"></ion-icon>
            </ion-button>
          </ion-buttons> : null}
        </ion-toolbar>
      </ion-header>,

      <ion-content>
        <div id="infoDiv">
          <p>Recorded on {this.session.date}</p>
        </div>

        <div id="messagesList">
          <ion-list lines="none" id="detailList">
            {
              this.session.messages.map((message) => {
                return (
                  <ion-item>
                    <ion-label class="messageLabel" text-wrap>
                      <div class="messageLabelCopyButton">
                        <ion-button onClick={() => this.copy(message)} size="small" fill="clear">
                          <ion-icon name="copy"></ion-icon>
                        </ion-button>
                      </div>

                      {message}
                    </ion-label>

                  </ion-item>
                )
              })
            }
          </ion-list>
        </div>
      </ion-content>
    ]
  }
}
