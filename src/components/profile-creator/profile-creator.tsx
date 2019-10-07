import { Component, State, h } from '@stencil/core';

import { alertController as alertCtrl, loadingController as loadingCtrl } from '@ionic/core';

import { get, set } from 'idb-keyval';

declare var MediaRecorder: any;

@Component({
  tag: 'profile-creator',
  styleUrl: 'profile-creator.css'
})
export class ProfileCreator {

  /*@Prop({ connect: 'ion-alert-controller' }) alertCtrl: HTMLIonAlertControllerElement | null = null;
  @Prop({ connect: 'ion-loading-controller' }) loadingCtrl: HTMLIonLoadingControllerElement | null = null;*/

  @State() speakerName: string;

  stream: MediaStream;
  recorder: any;
  chunks: Array<any> = [];

  public async newSpeaker() {
    const alert = await alertCtrl.create({
      header: "New Speaker",
      message: "Create a new speaker profile",
      inputs: [
        {
          placeholder: 'New User...',
          name: 'username',
          type: 'text'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            console.log('Confirm Cancel')
          }
        }, {
          text: 'Create',
          handler: async (data) => {
            console.log('Confirm Ok');

            this.speakerName = data.username;

            await alert.dismiss();

            await recordAlert.present();
          }
        }
      ]
    });

    await alert.present();

    const recordAlert = await alertCtrl.create({
      header: "test audio",
      message: "We need to listen to this user speak for 30 seconds to identify them in the session",
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            console.log('Confirm Cancel')
          }
        }, {
          text: 'Start',
          handler: async () => {
            console.log('Confirm Ok');

            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
              try {
                this.stream = await navigator.mediaDevices.getUserMedia({
                  audio: true,
                  video: false
                });

                this.recorder = new MediaRecorder(this.stream, {
                  mimeType: 'audio/wav'
                });

                if ('requestIdleCallback' in window) {
                  (window as any).requestIdleCallback(async () => {
                    this.recorder.start();

                    await this.handleEvents();

                    setTimeout(() => {
                      console.log('stopped')
                      this.recorder.stop();
                    }, 30000);
                  });
                }
                else {
                  this.recorder.start();

                  await this.handleEvents();

                  setTimeout(() => {
                    console.log('stopped')
                    this.recorder.stop();
                  }, 30000);

                }


              } catch (err) {
                console.error(err);
              }
            }

          }
        }
      ]
    });
  }

  async handleEvents() {
    console.log('handling events');
    const loading = await loadingCtrl.create({
      message: "Keep talking..."
    });
    await loading.present();


    console.log('trying to push');
    this.recorder.ondataavailable = (e) => {
      console.log('pushing');
      this.chunks.push(e.data);
    };

    this.recorder.onstop = (e) => {

      console.log(e);

      setTimeout(async () => {
        const audioBlob = new Blob(this.chunks, { 'type': 'audio/wav' });

        // this.chunks = [];

        /*const url = window.URL.createObjectURL(audioBlob);
        console.log(url);
        this.audioEl.src = url;

        console.log(this.recogs);

        if (this.recogs.length > 0) {
          this.transcript = this.recogs.join('.');
        } else {
          this.transcript = 'No transcript'
        }*/
        console.log(audioBlob);

        await this.sendOffBlob(audioBlob);

        await loading.dismiss();
      }, 300);

    }
  }

  async sendOffBlob(audioBlob: Blob) {
    const response = await fetch('https://westus.api.cognitive.microsoft.com/spid/v1.0/identificationProfiles', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": '6cfad2a0d3e245bbb3f09f892982a7ba'
      },
      body: JSON.stringify({
        "locale": "en-us",
      })
    });

    const data = await response.json();

    if (data) {
      const id = data.identificationProfileId;

      await this.saveUser(id);



      const response = await fetch(`https://westus.api.cognitive.microsoft.com/spid/v1.0/identificationProfiles/${id}/enroll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "Ocp-Apim-Subscription-Key": '6cfad2a0d3e245bbb3f09f892982a7ba'
        },
        body: audioBlob
      });

      const profileData = await response.json();
      console.log(profileData);
    }
  }

  async saveUser(id: string) {
    const users: Array<any> = await get("dishelperUsers");

    if (users) {
      await set('dishelperUsers', [...users, { name: this.speakerName, key: id }])
    }
    else {
      await set('dishelperUsers', [{ name: this.speakerName, key: id }])
    }
  }

  render() {
    return (
      <ion-button fill="clear" onClick={() => this.newSpeaker()}>
        <ion-icon name="person-add"></ion-icon>
      </ion-button>
    );
  }
}
