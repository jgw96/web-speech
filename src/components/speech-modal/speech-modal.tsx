import { Component, Element, State, h } from '@stencil/core';

import { alertController as alertCtrl } from '@ionic/core';

import { get, set } from 'idb-keyval';
// import * as Comlink from "comlink";

declare var MediaRecorder: any;

@Component({
  tag: 'speech-modal',
  styleUrl: 'speech-modal.css'
})
export class SpeechModal {

  @Element() el: HTMLElement;

  @State() transcript: string = 'You can start talking...';
  @State() messages: Array<string> | null = [];
  // @Prop({ connect: 'ion-alert-controller' }) alertCtrl: HTMLIonAlertControllerElement | null = null;

  audioContext: AudioContext;
  recog: any;
  chunks: any[] = [];
  mediaRecorder;

  public async dismiss(): Promise<void> {
    await (this.el.closest('ion-modal') as any).dismiss();
  }

  public async componentDidLoad() {
    console.log('Component has been rendered');

    const AudioContext = (window as any).AudioContext // our preferred impl
      || (window as any).webkitAudioContext       // fallback, mostly when on Safari
      || false;

    if (AudioContext) {
      this.audioContext = new AudioContext();

      const audioConfig = (window as any).SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
      const speechConfig = (window as any).SpeechSDK.SpeechConfig.fromSubscription('45edad3ebc1149c89075a9bd75955b6b', 'westus');

      speechConfig.speechRecognitionLanguage = 'en-us';

      this.recog = new (window as any).SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

      this.setUpListeners();

      this.recog.startContinuousRecognitionAsync();
    }

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia(
        // constraints - only audio needed for this app
        {
          audio: true
        });

      this.setupRecord(stream);
    }
  }

  setupRecord(stream) {
    this.mediaRecorder = new MediaRecorder(stream);
    console.log(this.mediaRecorder);

    this.mediaRecorder.start();

    this.chunks = [];

    this.mediaRecorder.ondataavailable = (e) => {
      console.log('e', e);
      this.chunks.push(e.data);
    }
  }

  public setUpListeners() {
    if (this.recog) {
      this.recog.recognizing = (s?: any, e?: any) => {
        console.log(s);
        window.console.log(e.result);

        if ('requestIdleCallback' in window) {
          // Use requestIdleCallback to schedule work.
          (window as any).requestIdleCallback(() => {
            this.transcript = e.result.text;

            this.el.querySelector('ion-content').scrollToBottom();
          });
        } else {
          // Do what you’d do today.
          this.transcript = e.result.text;

          this.el.querySelector('ion-content').scrollToBottom();
        }
      };

      this.recog.recognized = (s?: any, e?: any) => {
        console.log(s);
        console.log('recognized', e);

        if (e.result.text.length > 0) {
          if (this.messages) {
            this.messages = [...this.messages, e.result.text];

            (window as any).requestIdleCallback(() => {
              this.el.querySelector('ion-content').scrollToBottom();
            });
          }
          else {
            this.messages = [e.result.text];

            (window as any).requestIdleCallback(() => {
              this.el.querySelector('ion-content').scrollToBottom();
            });
          }
          console.log(this.messages);
        }
      }
    }
  }

  public async save() {
    this.recog.stopContinuousRecognitionAsync();
    this.mediaRecorder.stop();

    const alert = await alertCtrl.create({
      header: "Save Session",
      message: "Would you like to save this session?",
      inputs: [
        {
          placeholder: 'new session',
          name: 'sessionName',
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
          text: 'Save',
          handler: async (data) => {
            // prime for worker
            console.log('Confirm Ok');

            if (data.sessionName.length === 0) {
              data.sessionName = 'Convo'
            }

            let blob = null;
            if (this.chunks) {
              /*const worker = new Worker("/assets/workers/save-worker.js");
              const state = await Comlink.wrap(worker);
              Comlink.transfer(data, this.chunks);*/

              let audioBlob = new Blob(this.chunks, { 'type': 'audio/mp4;' });
              console.log(audioBlob);
              console.log(this.chunks);
              this.chunks = [];
              blob = audioBlob;
            }

            const sessions = (await get('savedSessions') as any[]);

            if (sessions) {
              await set('savedSessions', [...sessions, { name: data.sessionName, messages: this.messages, audio: blob, date: new Date().toLocaleDateString() }]);

              await (this.el.closest('ion-modal') as any).dismiss();
            }
            else {
              await set('savedSessions', [{ name: data.sessionName, messages: this.messages, audio: blob, date: new Date().toLocaleDateString() }]);

              await (this.el.closest('ion-modal') as any).dismiss();
            }

          }
        }
      ]
    });
    await alert.present();
  }

  public componentWillUnload() {
    console.log('stopping');
    this.recog.stopContinuousRecognitionAsync();
    this.mediaRecorder.stop();
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

          <ion-title>New Session</ion-title>

          <ion-buttons slot="end">
            <ion-button onClick={() => this.save()}>
              <ion-icon name="save"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>,

      <ion-content>
        <ion-list lines="none" id="speechModalList">
          {
            this.messages ? this.messages.map((message) => {
              return (
                <ion-item>
                  <ion-label text-wrap>
                    {message}
                  </ion-label>
                </ion-item>
              )
            }) : null
          }
        </ion-list>
      </ion-content>,

      <ion-footer>
        <ion-toolbar color="primary">
          <p id="textP">
            {this.transcript}
          </p>

          <ion-buttons slot="end">
            <ion-spinner></ion-spinner>
          </ion-buttons>
        </ion-toolbar>
      </ion-footer>
    ]
  }
}
