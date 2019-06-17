import { Component, Element, Prop, h } from '@stencil/core';


@Component({
  tag: 'speech-detail',
  styleUrl: 'speech-detail.css'
})
export class SpeechDetail {

  @Element() el: HTMLElement;

  @Prop() session: any;

  public componentDidLoad() {
    console.log(this.session);
  }

  public async dismiss(): Promise<void> {
    await (this.el.closest('ion-modal') as any).dismiss();
  }

  public async share() {

    let messageText = '';

    this.session.messages.forEach(message => {
      messageText = messageText + message + '\n' + '\n'
    });

    try {
      await (navigator as any).share({
        title: this.session.name,
        text: messageText,
        url: null,
      });

    } catch (err) {
      console.error('There was an error trying to share this content'), err;
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

          <ion-buttons slot="end">
            <ion-button onClick={() => this.share()} slot="icon-only">
              <ion-icon name="share"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>,

      <ion-content>
        <div id="infoDiv">
          <p>Recorded on {this.session.date}</p>
        </div>

        <div id="messagesList">
          <ion-list id="detailList">
            {
              this.session.messages.map((message) => {
                return (
                  <ion-item>
                    <ion-label class="messageLabel" text-wrap>
                      {message}
                    </ion-label>

                    <ion-buttons slot="end">
                      <ion-fab-button onClick={() => this.copy(message)} size="small">
                        <ion-icon name="copy"></ion-icon>
                      </ion-fab-button>
                    </ion-buttons>
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
