import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Platform } from '@ionic/angular';
import { DomSanitizer } from '@angular/platform-browser';
import { WebView } from '@ionic-native/ionic-webview/ngx';
//const RecordRTC = require('recordrtc/RecordRTC.min');

declare var RecordRTC;
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';

declare var WhammyRecorder;
declare var MediaStreamRecorder;
declare var window: any;
@Component({
  selector: 'record-rtc',
  templateUrl: './record-rtc.component.html',
  styleUrls: ['./record-rtc.component.scss']
})
export class RecordRTCComponent implements AfterViewInit {

  private stream: MediaStream;
  private recordRTC: any;
  private deciveId: string;
  private mediaRecorder: any;
  private chunks = [];
  private lastStoppedRecord = [];

  @ViewChild('video', {static: false}) video;
  private html5MediaSupportFull = false;

  constructor(private platform: Platform, private androidPermissions: AndroidPermissions, private webView: WebView,
    private sanitizer: DomSanitizer) {
    // Do stuff
  }

  ngAfterViewInit() {
    // set the initial state of the video
    const video: HTMLVideoElement = this.video.nativeElement;
    video.muted = true;
    video.controls = false;
    video.autoplay = false;

    if (this.platform.is('cordova')) {
      this.platform.ready().then(() => {
        this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.CAMERA).then(
          result => console.log('Has permission?', result.hasPermission),
          err => { this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.CAMERA)
          .then(
            (data ) => {
              console.log('Camera permissions granted');
              console.log(data);
          }
            )
            .catch((status: any) => {
            console.log('No permissions for camera reason: ');
            console.log(status);
          });
        }
        );

        this.androidPermissions.requestPermissions([this.androidPermissions.PERMISSION.CAMERA]).then(
            (data ) => {
              console.log('Camera permissions granted');
              console.log(data);
          }
          )
          .catch((status: any) => {
          console.log('No permissions for camera reason: ');
          console.log(status);
        });
      });
    }

    navigator.mediaDevices.enumerateDevices()
    .then((devices) => {
    devices.forEach((device) => {
      console.log('Found input device:');
      console.log(device);
      if (device.kind === 'videoinput') {
        this.deciveId = device.deviceId;
      }

    });
  });
    console.log(this.platform.platforms());

  }

  toggleControls(mute: boolean, controls: boolean) {
    const video: HTMLVideoElement = this.video.nativeElement;
    video.muted = mute;
    video.controls = controls;
    //video.autoplay = !video.autoplay;
  }

  successCallback(stream: MediaStream) {

    const options = {
      mimeType: 'video/webm', // or video/webm\;codecs=h264 or video/webm\;codecs=vp9
      //audioBitsPerSecond: 128000,
      //videoBitsPerSecond: 128000,
      //bitsPerSecond: 128000 // if this line is provided, skip above two
      recorderType: (this.platform.is('ios') || this.platform.is('iphone')) ? WhammyRecorder : MediaStreamRecorder
    };
    this.stream = stream;

    console.log('Recorder type:' + options.recorderType);

    const video: HTMLVideoElement = this.video.nativeElement;

    if (this.html5MediaSupportFull) {
      video.srcObject = stream;
      video.play();
    } else if (window.webkitURL) {
      video.src = URL.createObjectURL(stream);
    }

    this.recordRTC = RecordRTC(stream, options);
    this.recordRTC.startRecording();

  }



  errorCallback(error: any) {
    console.log('Error happened:');
    console.log(error);
    console.log(JSON.stringify(error));

    // handle error here
  }

  processVideo(audioVideoWebMURL: any) {
    const video: HTMLVideoElement = this.video.nativeElement;
    video.src = video.srcObject = null;
    //video.src =  this.convertFileSrc(audioVideoWebMURL);
    console.log(audioVideoWebMURL);
    if (this.html5MediaSupportFull) {
      video.src = URL.createObjectURL(this.recordRTC.getBlob());
    } else {
      video.src =  audioVideoWebMURL;
    }
    this.toggleControls(false, true);
    //const recordedBlob = recordRTC.getBlob();
    //recordRTC.getDataURL( (dataURL: any) => { });
  }


  

  startRecording() {
    const mediaConstraints: MediaStreamConstraints = {
      video: {
        deviceId: this.deciveId
      },
      audio: true,
    };


    if (navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
      .getUserMedia(mediaConstraints)
      .then(this.successCallback.bind(this), this.errorCallback.bind(this));

      this.html5MediaSupportFull = true;
      return;
    }
    if (navigator.getUserMedia) {
      navigator
      .getUserMedia(mediaConstraints, this.successCallback.bind(this),  this.errorCallback.bind(this));
      return;
    }


  }

  stopRecording() {
    const recordRTC = this.recordRTC;
    recordRTC.stopRecording(this.processVideo.bind(this));
    const stream = this.stream;
    stream.getAudioTracks().forEach(track => track.stop());
    stream.getVideoTracks().forEach(track => track.stop());
   /* this.mediaRecorder.stop();
    const stream = this.stream;
    stream.getTracks().forEach(track => track.stop());*/

  }

  public download() {
    this.recordRTC.save('video.webm');
  }

}
