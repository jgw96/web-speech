import { Component, Element, Listen, Prop, h, State } from '@stencil/core';
import { toastController, actionSheetController } from '@ionic/core';


@Component({
  tag: 'speech-detail',
  styleUrl: 'speech-detail.css'
})
export class SpeechDetail {

  @Element() el: HTMLElement;

  @Prop() session: any;

  @State() supportsShare: boolean;

  public componentWillLoad() {
    console.log(this.session);

    if ((navigator as any).canShare) {
      this.supportsShare = true;
    }
    else {
      this.supportsShare = false;
    }

    history.pushState({modal: true}, null);
  }

  @Listen('popstate', { target: 'window' })
  async handleDismiss() {
    await this.dismiss();
  }

  public async dismiss(): Promise<void> {
    await (this.el.closest('ion-modal') as any).dismiss();
  }

  async share(): Promise<any> {
    const audioFile = new File([this.session.audio], `${this.session.name}.mp4`, { type: 'audio/mp4', lastModified: Date.now() });

    if ((navigator as any).canShare && (navigator as any).canShare({ files: [audioFile] })) {
      try {
        await (navigator as any).share({
          files: [audioFile],
          title: 'New notes',
          text: 'Here is that new audio note',
        })
      }
      catch (err) {
        const toast = await toastController.create({
          message: "Downloading for sharing",
          duration: 2000
        });
        await toast.present();

        await this.download();
      }
    } else {
      const toast = await toastController.create({
        message: "Downloading for sharing",
        duration: 2000
      });
      await toast.present();

      await this.download();
    }
  }

  async download() {
    const audioFile = new File([this.session.audio], `${this.session.name}.mp4`, { type: 'audio/mp4', lastModified: Date.now() });

    if ("chooseFileSystemEntries" in window) {
      const opts = {
        type: 'saveFile',
        accepts: [{
          description: 'Audio file',
          extensions: ['mp4']
        }],
      };
      const handle = await (window as any).chooseFileSystemEntries(opts);

      if (handle) {
        const writer = await handle.createWriter();
        await writer.write(0, audioFile);
        await writer.close();
      }
    }
    else {
      const link = document.createElement('a');
      const url = URL.createObjectURL(this.session.audio);

      link.setAttribute('href', url);
      link.type = "audio/mp4";
      link.setAttribute('download', `${this.session.name}.mp4`);
      link.click();
    }
  }

  async playAudio() {
    if (this.session.audio) {
      const audio = this.el.querySelector('audio');
      audio.src = window.URL.createObjectURL(this.session.audio);

      audio.oncanplay = async () => {
        await audio.play();

        const sheet = await actionSheetController.create({
          header: 'Audio Control',
          buttons: [
            {
              text: 'stop',
              icon: 'pause',
              handler: () => {
                audio.pause();
              }
            },
            {
              text: 'share',
              icon: 'share',
              handler: () => {
                this.share();
              }
            }
          ]
        });
        await sheet.present();

        audio.onpause = async () => {
          await sheet.dismiss();
        }
      }
    }
  }

  render() {
    return [
      <ion-header no-border>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-button onClick={() => this.dismiss()}>
              <ion-icon name="close"></ion-icon>
            </ion-button>
          </ion-buttons>

          <ion-title>{this.session.name}</ion-title>

          <ion-buttons slot="end">
            <ion-button onClick={() => this.playAudio()} slot="icon-only">
              <ion-icon name="play"></ion-icon>
            </ion-button>

            <ion-button onClick={() => this.download()} slot="icon-only">
              <ion-icon name="download"></ion-icon>
            </ion-button>

            {this.supportsShare ? <ion-button onClick={() => this.share()} slot="icon-only">
              <ion-icon name="share"></ion-icon>
            </ion-button> : null}
          </ion-buttons>
        </ion-toolbar>
      </ion-header>,

      <ion-content>
        <audio></audio>
        
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
