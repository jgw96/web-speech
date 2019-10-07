import { Component, Element, State, h } from '@stencil/core';

import { modalController as modalCtrl, actionSheetController as actionSheetCtrl } from '@ionic/core';

import { get } from 'idb-keyval';

@Component({
  tag: 'app-home',
  styleUrl: 'app-home.css'
})
export class AppHome {

  @State() sessions: Array<any> | null = null;
  @State() supportsShare: boolean;

  @Element() el: HTMLElement;

  public async componentDidLoad() {
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
    const audioFile = new File([session.audio], `${session.name}.mp4`, {type: 'audio/mp4', lastModified: Date.now()});

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

  playAudio(audioString, session) {
    if (audioString) {
      const audio = this.el.querySelector('audio');
      audio.src = window.URL.createObjectURL(audioString);

      audio.oncanplay = async () => {
        await audio.play();

        const sheet = await actionSheetCtrl.create({
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

      }
    }
  }

  render() {
    return [
      <ion-header no-border>
        <ion-toolbar color="primary">
          <ion-title>ConvoNotes</ion-title>
        </ion-toolbar>
      </ion-header>,

      <ion-content>

        <audio></audio>

        {this.sessions ?

          <div>
            <ion-toolbar id="mobileSearch" color="primary">
              <ion-searchbar onIonChange={(ev) => this.search(ev.detail.value)}></ion-searchbar>
            </ion-toolbar>

            <ion-searchbar color="primary" id="desktopSearch" onIonChange={(ev) => this.search(ev.detail.value)}></ion-searchbar>

            {
              <div id="desktopHeader">
                <h2 id="sessionsHeader">Sessions</h2>

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


                      <ion-buttons id="desktopButtons">
                        {this.supportsShare ? <ion-fab-button size="small" onClick={() => this.share(session)} color="dark">
                          <ion-icon size="small" name="share"></ion-icon>
                        </ion-fab-button> : null}
                        <ion-fab-button size="small" onClick={() => this.playAudio(session.audio ? session.audio : null, session)} color="dark">
                          <ion-icon size="small" name="play"></ion-icon>
                        </ion-fab-button>
                      </ion-buttons>

                    </ion-item>

                  )
                })
              }
            </ion-list>
          </div> :

          <div>
            {/*<h1>Welcome to ConvoNotes</h1>

            <p>Hit the button below to start transcribing your conversation!</p>

            <ion-button onClick={() => this.newSpeech()}>
              Get Started
            </ion-button>*/

              <ion-slides pager={true}>
                <ion-slide>

                  <img src="/assets/ai.svg"></img>

                  <h1>Welcome to ConvoNotes</h1>

                  <p>
                    ConvoNotes gives you the ability to transcribe speech to text in realtime,
                    trying in with all your favorite services to give you in depth knowledge into whats going on in the world around you
                  </p>
                </ion-slide>

                <ion-slide>

                  <img src="/assets/firmware.svg"></img>

                  <ion-button id="startButton" onClick={() => this.newSpeech()}>
                    Get Started
                  </ion-button>
                </ion-slide>
              </ion-slides>
            }
          </div>
        }

        {this.sessions ? <ion-fab id="mobileFab" vertical="bottom" horizontal="end" slot="fixed">
          <ion-fab-button onClick={() => this.newSpeech()}>
            <ion-icon name="add"></ion-icon>
          </ion-fab-button>
        </ion-fab> : null}
      </ion-content>
    ];
  }
}
