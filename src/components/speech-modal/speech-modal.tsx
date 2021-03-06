import { Component, Element, Listen, State, h } from '@stencil/core';

import { alertController as alertCtrl } from '@ionic/core';

import { get, set } from 'idb-keyval';
// import * as Comlink from "comlink";

@Component({
  tag: 'speech-modal',
  styleUrl: 'speech-modal.css'
})
export class SpeechModal {

  @Element() el: HTMLElement;

  @State() transcript: string = 'You can start talking...';
  @State() messages: Array<string> | null = [];

  audioContext: AudioContext;
  recog: any;
  chunks: any[] = [];
  mediaRecorder;
  wakeLock: any;

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

      await import('../../assets/speech.js');

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

    if ((navigator as any).wakeLock) {
      this.wakeLock = await (navigator as any).wakeLock.request('screen');
    }

    history.pushState({ modal: true }, null);
  }

  @Listen('popstate', { target: 'window' })
  async handleDismiss() {
    await this.dismiss();
  }

  async setupRecord(stream) {
    this.mediaRecorder = new (window as any).MediaRecorder(stream);
    console.log(this.mediaRecorder);

    this.mediaRecorder.start();

    this.recordingAlert();

    this.chunks = [];

    this.mediaRecorder.ondataavailable = (e) => {
      console.log('e', e);
      this.chunks.push(e.data);
    }
  }

  public recordingAlert() {
    if (window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance("Recording started");
      window.speechSynthesis.speak(utterance);
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

    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
    }

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
            console.log('sessions type', typeof (sessions));

            if (sessions) {

              sessions.push({ name: data.sessionName, messages: this.messages, audio: blob, date: new Date().toLocaleDateString() });

              console.log('sessions', sessions);

              try {
                await set('savedSessions', sessions);
              }
              catch (err) {
                console.log(err);

                await set('savedSessions', sessions);
              }

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

  public disconnectedCallback() {
    console.log('stopping');
    this.recog.stopContinuousRecognitionAsync();

    if (this.mediaRecorder) {
      this.mediaRecorder = null;
    }

    if (this.wakeLock) {
      this.wakeLock.release();
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

          <ion-title>New Session</ion-title>

          { window.matchMedia("(min-width: 1000px)").matches ? <ion-buttons slot="end">
            <ion-button onClick={() => this.save()}>
              <ion-icon name="save"></ion-icon>
            </ion-button>
          </ion-buttons> : null}
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
        <ion-toolbar>
          <p id="transcript">{this.transcript}</p>

          {window.matchMedia("(min-width: 1000px)").matches ? null : <ion-buttons slot="end">
            <ion-button onClick={() => this.save()}>
              <ion-icon name="save"></ion-icon>
            </ion-button>
          </ion-buttons>}
        </ion-toolbar>
      </ion-footer>
    ]
  }
}
