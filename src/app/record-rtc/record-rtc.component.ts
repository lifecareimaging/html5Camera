import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Platform } from '@ionic/angular';
//const RecordRTC = require('recordrtc/RecordRTC.min');

declare var RecordRTC;
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';


declare var MediaRecorder;
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

  constructor(private platform: Platform, private androidPermissions: AndroidPermissions) {
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
  }

  toggleControls(mute: boolean, controls: boolean) {
    const video: HTMLVideoElement = this.video.nativeElement;
    video.muted = mute;
    video.controls = controls;
    //video.autoplay = !video.autoplay;
  }

  successCallback(stream: MediaStream) {

    const options = {
      mimeType: 'video/webm\;codecs=h264' // or video/webm\;codecs=h264 or video/webm\;codecs=vp9
      //audioBitsPerSecond: 128000,
      //videoBitsPerSecond: 128000,
      //bitsPerSecond: 128000 // if this line is provided, skip above two
    };
    this.stream = stream;


    this.recordRTC = RecordRTC(stream, options);
    this.recordRTC.startRecording();
    const video: HTMLVideoElement = this.video.nativeElement;

    if (this.html5MediaSupportFull) {
      video.srcObject = stream;
    } else if (window.webkitURL) {
      video.src = window.webkitURL.createObjectURL(stream);
    }


    //video.src = window.URL.createObjectURL(stream);
    

    /*if (this.html5MediaSupportFull) {
      this.video.nativeElement.srcObject = stream;
    } else if (window.webkitURL) {
      this.video.nativeElement.src = window.webkitURL.createObjectURL(stream);
    }

    this.video.nativeElement.onloadedmetadata = e =>
      this.video.nativeElement.play();
    // var options = { mimeType : 'video/quicktime'};
    this.mediaRecorder = new MediaRecorder(stream, { mimeType : 'video/webm'});

    this.mediaRecorder.start();
    this.mediaRecorder.onstop = e => {
      this.video.nativeElement.srcObject = null;
      this.video.nativeElement.onloadedmetadata = e2 =>
        this.video.nativeElement.pause();

      const blob = new Blob(this.chunks);
      this.lastStoppedRecord = [...this.chunks];
      this.chunks = [];


      if (this.html5MediaSupportFull) { 
        const src = URL.createObjectURL(blob);
        this.video.nativeElement.src = src;
      } else if (window.webkitURL) {
        const file = new File([blob], 'sample.webm');
        this.video.nativeElement.src = window.webkitURL.createObjectURL(file);
      }
      this.toggleControls(false, true);

    };
    this.mediaRecorder.ondataavailable = this.onDataAvailable.bind(this);*/


  }



  errorCallback(error: any) {
    console.log('Error happened:');
    console.log(error);
    console.log(JSON.stringify(error));

    // handle error here
  }

  processVideo(audioVideoWebMURL: any) {
    const video: HTMLVideoElement = this.video.nativeElement;
    const recordRTC = this.recordRTC;
    video.src = audioVideoWebMURL;
    this.toggleControls(false, true);
    const recordedBlob = recordRTC.getBlob();
    recordRTC.getDataURL( (dataURL: any) => { });
  }

  startRecording() {
    const mediaConstraints: MediaStreamConstraints = {
      video: {
        deviceId: this.deciveId
      },
      audio: false,
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
    /*const recordedBlob = new Blob(this.lastStoppedRecord, { type: 'video/webm' });
    console.log(this.lastStoppedRecord);
    console.log(recordedBlob);
    this.invokeSaveAsDialog(recordedBlob, 'video.webm');*/
  }



  /*invokeSaveAsDialog(file, fileName) {
    if (!file) {
        throw 'Blob object is required.';
    }

    if (!file.type) {
        try {
            file.type = 'video/webm';
        } catch (e) {}
    }

    let fileExtension = (file.type || 'video/webm').split('/')[1];

    if (fileName && fileName.indexOf('.') !== -1) {
        const splitted = fileName.split('.');
        fileName = splitted[0];
        fileExtension = splitted[1];
    }

    const fileFullName = (fileName || (Math.round(Math.random() * 9999999999) + 888888888)) + '.' + fileExtension;

    if (typeof navigator.msSaveOrOpenBlob !== 'undefined') {
        return navigator.msSaveOrOpenBlob(file, fileFullName);
    } else if (typeof navigator.msSaveBlob !== 'undefined') {
        return navigator.msSaveBlob(file, fileFullName);
    }

    const hyperlink = document.createElement('a');
    hyperlink.href = URL.createObjectURL(file);
    hyperlink.download = fileFullName;

    // hyperlink.style = 'display:none;opacity:0;color:transparent;';
    (document.body || document.documentElement).appendChild(hyperlink);

    if (typeof hyperlink.click === 'function') {
        hyperlink.click();
    } else {
        hyperlink.target = '_blank';
        hyperlink.dispatchEvent(new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
        }));
    }

    URL.revokeObjectURL(hyperlink.href);
}*/


}
