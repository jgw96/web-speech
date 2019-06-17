import { Component, Element, Prop, State, h } from '@stencil/core';

import { get } from 'idb-keyval';

@Component({
  tag: 'app-home',
  styleUrl: 'app-home.css'
})
export class AppHome {

  @Prop({ connect: 'ion-modal-controller' }) modalCtrl: HTMLIonModalControllerElement | null = null;

  @State() sessions: Array<any> | null = null;

  @Element() el: HTMLElement;

  public async componentDidLoad() {
    const saved: Array<any> = await get('savedSessions');

    if (saved) {
      console.log(saved);
      this.sessions = saved;
    }
  }

  public async newSpeech(): Promise<void> {
    const modal = await this.modalCtrl.create({
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
    const modal = await this.modalCtrl.create({
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

    let messageText = '';

    session.messages.forEach(message => {
      messageText = messageText + message + '\n' + '\n'
    });

    try {
      await (navigator as any).share({
        title: session.name,
        text: messageText,
        url: null,
      });

    } catch (err) {
      console.error('There was an error trying to share this content'), err;
    }
  }

  playAudio(audioString) {
    if (audioString) {
      const audio = this.el.querySelector('audio');
      audio.src= window.URL.createObjectURL(audioString);

      audio.oncanplay = () => {
        audio.play();
      }
    }
  }

  render() {
    return [
      <ion-header no-border>
        <ion-toolbar color="primary">
          <ion-title>EasyConvo</ion-title>
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
                    <ion-item-sliding>
                      <ion-item>
                        <ion-label onClick={() => this.viewSession(session)} class="items">
                          <h2>{session.name}</h2>
                          <p>Recorded on {session.date}</p>
                        </ion-label>

                        {
                          window.matchMedia("(min-width: 1200px)").matches ?
                            <ion-buttons id="desktopButtons">
                              <ion-button fill="solid" shape="round" color="primary">
                                <ion-icon size="small" name="share"></ion-icon>
                              </ion-button>
                              <ion-button onClick={() => this.playAudio(session.audio ? session.audio : null)} fill="solid" shape="round" color="primary">
                                <ion-icon size="small" name="play"></ion-icon>
                              </ion-button>
                            </ion-buttons>
                            : null
                        }
                      </ion-item>

                      {
                        window.matchMedia("(min-width: 1200px)").matches ?
                          null
                          :
                          <ion-item-options side="end">
                            <ion-item-option onClick={() => this.playAudio(session.audio ? session.audio : null)} color="secondary">
                              <ion-icon slot="icon-only" name="play"></ion-icon>
                            </ion-item-option>
                            <ion-item-option color="primary">
                              <ion-icon slot="icon-only" name="share"></ion-icon>
                            </ion-item-option>
                          </ion-item-options>
                      }
                    </ion-item-sliding>

                  )
                })
              }
            </ion-list>
          </div> :

          <div>
            {/*<h1>Welcome to EasyConvo</h1>

            <p>Hit the button below to start transcribing your conversation!</p>

            <ion-button onClick={() => this.newSpeech()}>
              Get Started
            </ion-button>*/

              <ion-slides pager={true}>
                <ion-slide>

                  <img src="/assets/ai.svg"></img>

                  <h1>Welcome to EasyConvo</h1>

                  <p>
                    EasyConvo gives you the ability to transcribe speech to text in realtime,
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
