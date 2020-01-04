import { Component, Element, Listen, Prop, h, State } from '@stencil/core';
import { toastController } from '@ionic/core';


@Component({
  tag: 'speech-detail',
  styleUrl: 'speech-detail.css'
})
export class SpeechDetail {

  @Element() el: HTMLElement;

  @Prop() session: any;

  @State() supportsShare: boolean;

  @State() audioTotalTime: number;
  @State() audioCurrentTime: number;

  @State() paused: boolean = true;

  public componentWillLoad() {
    console.log(this.session);

    if ((navigator as any).canShare) {
      this.supportsShare = true;
    }
    else {
      this.supportsShare = false;
    }

    history.pushState({ modal: true }, null);
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

  pause() {
    /*this.el.querySelector("#playButton").animate(
      [
        {
          transform: 'translateY(-20px)'
        },
        {
          transform: 'translateY(0px)'
        }
      ],
      {
        duration: 200,
        fill: "forwards"
      }
    );*/

    const range = this.el.querySelector('ion-range');
    console.log(range);
    
    const pauseButton = this.el.querySelector("#pauseButton");

    range.animate(
      [
        {
          transform: 'translateY(0px)'
        },
        {
          transform: 'translateY(20px)'
        }
      ],
      {
        duration: 200,
        fill: "forwards"
      }
    )

    const ani2 = pauseButton.animate(
      [
        {
          transform: 'translateY(0px)'
        },
        {
          transform: 'translateY(20px)'
        }
      ],
      {
        duration: 200,
        fill: "forwards"
      }
    )

    ani2.onfinish = () => {
      console.log('pausing');
      const audio: HTMLAudioElement = this.el.querySelector('#detailAudio');
      audio.pause();
      audio.pause();

      setTimeout(() => {
        audio.pause();
      }, 16);

      this.paused = true;
    }
  }

  async playAudio() {
    const animation = this.el.querySelector('#playButton').animate(
      [
        {
          transform: 'translateY(0px)'
        },
        {
          transform: 'translateY(-20px)'
        }
      ],
      {
        duration: 200,
        fill: "forwards"
      });

    animation.onfinish = () => {
      this.paused = false;

      if (this.session.audio) {
        const audio: HTMLAudioElement = this.el.querySelector('#detailAudio');
        audio.src = window.URL.createObjectURL(this.session.audio);

        audio.oncanplay = async () => {
          await audio.play();
        };

        audio.onloadedmetadata = () => {
          console.log(audio.duration);
          this.audioTotalTime = audio.duration;
        }

        audio.ontimeupdate = async () => {
          await this.updateTime(audio);
        }
      }
    }
  }

  updateTime(audio) {
    return new Promise((resolve) => {
      console.log(audio.currentTime);
      this.el.querySelector('ion-range').value = audio.currentTime;
      resolve();
    })
  }

  updateRange(event) {
    console.log(event);
    const audio: HTMLAudioElement = this.el.querySelector('#detailAudio');
    audio.currentTime = event.detail.value;
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
        <audio id="detailAudio"></audio>

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
      </ion-content>,

      <ion-footer>
        <ion-toolbar>
          {!this.paused ? <ion-range onIonChange={(event) => this.updateRange(event)} min={0} max={100}>
            <ion-icon slot="start" name="musical-note"></ion-icon>
          </ion-range> : null}

          <ion-buttons slot="end">
            {!this.paused ? <ion-fab-button size="small" color="danger" id="pauseButton" onClick={() => this.pause()}>
              <ion-icon size="small" name="pause"></ion-icon>
            </ion-fab-button>
              :
              <ion-button shape="round" color="primary" size="small" id="playButton" onClick={() => this.playAudio()}>
                <ion-text>play recording</ion-text>
              </ion-button>}
          </ion-buttons>
        </ion-toolbar>
      </ion-footer>
    ]
  }
}
