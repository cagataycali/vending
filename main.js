import {KNNImageClassifier} from 'deeplearn-knn-image-classifier';
import * as dl from 'deeplearn';

// Number of classes to classify
const NUM_CLASSES = 4;
// Webcam Image size. Must be 227.
const IMAGE_SIZE = 227;
// K value for KNN
const TOPK = 10;

let [selected] = [0]

const ENUM = [20, 10, 5, 1]

let coin = [10, 10, 10, 10]
let result = {
  1: 0,
  5: 0,
  10: 0
}

window.coin = coin

const change = id => {
  console.log(ENUM[id])
  coin[id] = parseInt(document.getElementById(`${ENUM[id]}-input`).value)
}

window.change = change

class Main {
  constructor(){
    // Initiate variables
    this.infoTexts = [];
    this.training = -1; // -1 when no class is being trained
    this.videoPlaying = false;

    // Initiate deeplearn.js math and knn classifier objects
    this.knn = new KNNImageClassifier(NUM_CLASSES, TOPK);

    // Create video element that will contain the webcam image
    this.video = document.createElement('video');
    this.video.setAttribute('autoplay', '');
    this.video.setAttribute('playsinline', '');

    // Add video element to DOM
    document.body.appendChild(this.video);

    // Create training buttons and info texts
    for(let i=0;i<NUM_CLASSES; i++){
      const div = document.createElement('div');
      document.body.appendChild(div);
      div.style.marginBottom = '10px';

      // Create training button
      const button = document.createElement('button')
      if (i === 0) {
        button.innerText = "5 ₺";
      } else if (i === 1) {
        button.innerText = "10 ₺";
      } else if (i === 2) {
        button.innerText = "20 ₺";
      } else {
        button.innerText = 'FALLBACK';
      }

      button.classList.add('btn')
      button.classList.add('btn-primary')
      div.appendChild(button);

      // Listen for mouse events when clicking the button
      button.addEventListener('mousedown', () => this.training = i);
      button.addEventListener('touchstart', () => this.training = i);
      button.addEventListener('mouseup', () => this.training = -1);
      button.addEventListener('touchend', () => this.training = -1);

      // Create info text
      const infoText = document.createElement('span')
      infoText.innerText = " henüz örnek öğrenilmedi.";
      div.appendChild(infoText);
      this.infoTexts.push(infoText);
    }


    // Setup webcam
    navigator.mediaDevices.getUserMedia({video: true, audio: false})
    .then((stream) => {
      this.video.srcObject = stream;
      this.video.width = IMAGE_SIZE;
      this.video.height = IMAGE_SIZE;

      this.video.addEventListener('playing', ()=> this.videoPlaying = true);
      this.video.addEventListener('paused', ()=> this.videoPlaying = false);
    })

    // Load knn model
    this.knn.load()
    .then(() => this.start());
  }

  start(){
    if (this.timer) {
      this.stop();
    }
    this.video.play();
    this.timer = requestAnimationFrame(this.animate.bind(this));
  }

  stop(){
    this.video.pause();
    cancelAnimationFrame(this.timer);
  }

  animate(){
    if(this.videoPlaying){
      // Get image data from video element
      const image = dl.fromPixels(this.video);

      // Train class if one of the buttons is held down
      if(this.training != -1){
        // Add current image to classifier
        this.knn.addImage(image, this.training)
      }

      // If any examples have been added, run predict
      const exampleCount = this.knn.getClassExampleCount();
      if(Math.max(...exampleCount) > 0){
        this.knn.predictClass(image)
        .then((res)=>{
          // console.log(res);
          for(let i=0;i<NUM_CLASSES; i++){
            // Make the predicted class bold
            if(res.classIndex == i){
              this.infoTexts[i].style.fontWeight = 'bold';
            } else {
              this.infoTexts[i].style.fontWeight = 'normal';
            }

            // Update info text
            if(exampleCount[i] > 0){
              // console.log('burada', res.classIndex);
              if (res.confidences[i]*100 > 75 && res.classIndex !== selected) {
                selected = res.classIndex
                console.log(selected);
                if (selected !== 3) {

                  result = {
                    1: 0,
                    5: 0,
                    10: 0
                  }

                  let input;

                    switch (res.classIndex) {
                      case 0:
                        input = 5
                        break;
                      case 1:
                        input = 10
                        break;
                      case 2:
                        input = 20
                        break;
                    }

                    let index = ENUM.findIndex(i => i === ENUM.filter(coin => input > coin)[0])
                    const vending = (input, index) => {
                      if (index < ENUM.length) {
                        if (index === ENUM.length-1) {
                          result[ENUM[index]] = 5
                        } else {
                          input = input - ENUM[index]
                          result[ENUM[index]]++
                          index++
                          vending(input, index)
                        }
                      }
                    }

                    vending(input, index)
                    console.log(`${result[1]} adet 1 ₺, ${result[5]} adet 5 ₺, ${result[10]} adet 10 ₺.`)
                    document.getElementById("1").innerText = result[1] + ' adet';
                    document.getElementById("5").innerText = result[5]  + ' adet';
                    document.getElementById("10").innerText = result[10] + ' adet';
                } else {
                  result = {
                    1: 0,
                    5: 0,
                    10: 0
                  }
                  document.getElementById("1").innerText = result[1] + ' adet';
                  document.getElementById("5").innerText = result[5]  + ' adet';
                  document.getElementById("10").innerText = result[10] + ' adet';
                }
              }
              this.infoTexts[i].innerText = ` ${exampleCount[i]} örnek üzerinden - ${res.confidences[i]*100}%`
            }
          }
        })
        // Dispose image when done
        .then(()=> image.dispose())
      } else {
        image.dispose()
      }
    }
    this.timer = requestAnimationFrame(this.animate.bind(this));
  }
}

window.addEventListener('load', () => new Main());
