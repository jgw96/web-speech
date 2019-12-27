import { Component, Element, State, Listen, h } from '@stencil/core';

import { modalController as modalCtrl, actionSheetController, toastController } from '@ionic/core';

import { get } from 'idb-keyval';
import '@pwabuilder/pwainstall';

@Component({
  tag: 'app-home',
  styleUrl: 'app-home.css'
})
export class AppHome {

  @State() sessions: Array<any> | null = null;
  @State() supportsShare: boolean;
  @State() canInstall: boolean = false;

  @Element() el: HTMLElement;

  @Listen('beforeinstallprompt', { target: 'window' })
  handleInstall() {
    this.canInstall = true;
  }

  public async componentWillLoad() {
    if ((navigator as any).canShare) {
      this.supportsShare = true;
    }
    else {
      this.supportsShare = false;
    }

    const saved: Array<any> = await get('savedSessions');

    if (saved) {
      console.log(saved);
      this.sessions = saved;
    }
  }

  public async newSpeech(): Promise<void> {
    const modal = await modalCtrl.create({
      component: 'speech-modal'
    });
    await modal.present();

    await modal.onDidDismiss();

    const saved: Array<any> = await get('savedSessions');

    if (saved) {
      console.log(saved);
      this.sessions = saved;
    }
  }

  public async viewSession(session: any) {
    const modal = await modalCtrl.create({
      component: 'speech-detail',
      componentProps: {
        session
      }
    });
    await modal.present();
  }

  public async search(searchQuery: string) {
    console.log(searchQuery);

    if (searchQuery.length > 0) {
      const lowerCasedSearch = searchQuery.toLowerCase();

      const foundSession = this.sessions.find((element) => {
        return element.name.includes(lowerCasedSearch);
      });

      console.log(foundSession);

      this.sessions = [foundSession];
    }
    else {
      const saved: Array<any> = await get('savedSessions');

      if (saved) {
        console.log(saved);
        this.sessions = saved;
      }
    }
  }

  async share(session): Promise<any> {
    const audioFile = new File([session.audio], `${session.name}.mp4`, { type: 'audio/mp4', lastModified: Date.now() });

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

        await this.download(session);
      }

    } else {
      const toast = await toastController.create({
        message: "Downloading for sharing",
        duration: 2000
      });
      await toast.present();

      await this.download(session);
    }
  }

  async download(session) {
    const audioFile = new File([session.audio], `${session.name}.mp4`, { type: 'audio/mp4', lastModified: Date.now() });

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
      const url = URL.createObjectURL(session.audio);

      link.setAttribute('href', url);
      link.type = "audio/mp4";
      link.setAttribute('download', `${session.name}.mp4`);
      link.click();
    }
  }

  async playAudio(audioString, session) {
    console.log('audioString', audioString);
    if (audioString) {
      const audio = this.el.querySelector('audio');
      audio.src = window.URL.createObjectURL(audioString);

      console.log('here', audio);

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
                this.share(session);
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
          <ion-title>Scribe</ion-title>
        </ion-toolbar>
      </ion-header>,

      <ion-content>

        <audio></audio>

        {this.sessions ?

          <div>

            {this.canInstall ? <pwa-install>Install Scribe</pwa-install> : null}

            <ion-toolbar id="mobileSearch">
              <ion-searchbar color="primary" onIonChange={(ev) => this.search(ev.detail.value)}></ion-searchbar>
            </ion-toolbar>

            <ion-searchbar color="primary" id="desktopSearch" onIonChange={(ev) => this.search(ev.detail.value)}></ion-searchbar>

            {
              <div id="desktopHeader">
                <h2 id="sessionsHeader">Notes</h2>

                <ion-button id="desktopFab" color="primary" onClick={() => this.newSpeech()}>
                  New

                  <ion-icon name="add" slot="end">
                  </ion-icon>
                </ion-button>
              </div>
            }

            <ion-list lines="none">
              {
                this.sessions.map((session) => {
                  return (
                    <ion-item>
                      <ion-label onClick={() => this.viewSession(session)} class="items">
                        <h2>{session.name}</h2>
                        <p>Recorded on {session.date}</p>
                      </ion-label>


                      {window.matchMedia("(min-width: 400px)").matches ? <ion-buttons id="desktopButtons">
                        <ion-fab-button size="small" onClick={() => this.share(session)}>
                          {this.supportsShare ? <ion-icon size="small" name="share"></ion-icon> : <ion-icon size="small" name="download"></ion-icon>}
                        </ion-fab-button>
                        <ion-fab-button size="small" onClick={() => this.playAudio(session.audio ? session.audio : null, session)}>
                          <ion-icon size="small" name="play"></ion-icon>
                        </ion-fab-button>
                      </ion-buttons> : null}

                    </ion-item>

                  )
                })
              }
            </ion-list>
          </div> :

          <div>
            {
              <ion-slides pager={false}>
                <ion-slide>

                  <img src="/assets/ai.svg"></img>

                  <h1>Welcome to Scribe</h1>

                  <p>
                    Scribe is your personal note-taker. Scribe will record and transcribe speech to text in real time, never miss
                    a detail again!
                  </p>

                  <ion-button id="startButton" onClick={() => this.newSpeech()}>
                    Get Started
                  </ion-button>
                </ion-slide>
              </ion-slides>
            }
          </div>
        }

        {this.sessions ? <ion-fab id="mobileFab" vertical="bottom" horizontal="center" slot="fixed">
          <ion-fab-button onClick={() => this.newSpeech()}>
            <ion-icon name="add"></ion-icon>
          </ion-fab-button>
        </ion-fab> : null}
      </ion-content>
    ];
  }
}
