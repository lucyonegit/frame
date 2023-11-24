export class Render {
  constructor(){
    this.dpr = window.devicePixelRatio;
    this.canvas = null
    this.canvasCtx = null;
    this.width = 0;
    this.height = 0;
    this.hasInit = false
  }
  setWidth = (width)=>{
    this.width = width
  }
  setHeight = (height)=>{
    this.height = height
  }
  _getContainer = () => {
    let container = this.containerId
      ? document.querySelector(`#${this.containerId}`)
      : document.body;
    return container;
  };
  _initCanvasCtx = () => {
    let container = this._getContainer();
    let { clientWidth, clientHeight } = container
    // while (container.hasChildNodes()) {
    //   container.removeChild(container.firstChild);
    // }
    this.setWidth(clientWidth);
    this.setHeight(clientHeight);
    this.canvas = this.canvas || document.createElement("canvas");
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    let context = this.canvas.getContext("2d",{ alpha: true });
    context.width = this.width * this.dpr;
    context.height = this.height * this.dpr;
    context.scale(this.dpr, this.dpr);
    if(!this.hasInit){
      container.appendChild(this.canvas);
      this.hasInit = true
    }
    this.canvasCtx = context;
  };
}
export class FrameBar extends Render {
  constructor(config) {
    super();
    const { containerId } = config || {};
    this.containerId = containerId;
    this.maxHeight = [];
    this.rAFId = null
    this.close = ()=>{}
    this.getData = ()=>([])
    this.styleConfig = {
      fftSize:256,
      vertexColor: '#0f0'
    }
  }
  init = () => {
    this._initCanvasCtx();
  };
  _getDesktopAudioMediaStream = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });
    return stream;
  };
  /**
   *
   * @param {MediaStream} stream
   */
  _createAnalyser = (stream) => {
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    source.connect(analyser);
    // analyser.connect(audioCtx.destination);
    analyser.fftSize = this.styleConfig.fftSize;
    const getData = () => {
      let dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);
      return dataArray;
    };
    this.getData = getData
    return () => {
      audioCtx.close();
    };
  };
  /**
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {{():Uint8Array}} getData
   */
  _draw() {
    cancelAnimationFrame(this.rAFId);
    const dpr = this.dpr
    const originalWidth = this.canvasCtx.width / dpr
    const originalHeight = this.canvasCtx.height / dpr
    const data = this.getData();
    const bar_w = Math.round(originalWidth / data.length);
    this.canvasCtx.clearRect(0, 0, originalWidth, originalHeight);
    this.canvasCtx.antialias = "none"
    for (let i = 0; i < data.length; i++) {
      let x = Math.round((i * bar_w));
      let barHeight = Math.round((data[i] / 255) * originalHeight);
      let y = Math.round(originalHeight - barHeight);
      let color = i / data.length * 360
      this.canvasCtx.fillStyle =  `hsl(${color},50%,50%)`
      this.canvasCtx.fillRect(
        x ,
        y,
        bar_w ,
        barHeight
      );
      if (this.maxHeight[i]) {
        if (this.maxHeight[i] < y) {
          this.maxHeight[i] += 1.5;
        } else {
          this.maxHeight[i] = y;
        }
      } else {
        this.maxHeight[i] = y;
      }
      this.canvasCtx.fillStyle = this.styleConfig.vertexColor;
      this.canvasCtx.beginPath();
      this.canvasCtx.arc(
        Math.round(x + bar_w / 2),
        Math.round(this.maxHeight[i] + bar_w / 2), 
        Math.round(bar_w / 2),
        0, 
        2 * Math.PI)
      this.canvasCtx.fill()
      this.canvasCtx.closePath();
      // this.canvasCtx.fillRect(
      //   x ,
      //   this.maxHeight[i],
      //   bar_w,
      //   5
      // );
    }

    this.rAFId = requestAnimationFrame(() => this._draw());
  }
  run = async () => {
    this.init();
    const mediaStream = await this._getDesktopAudioMediaStream();
    this.close = this._createAnalyser(mediaStream);
    this._draw();
  };
  reset = () => {
    this.dpr = window.devicePixelRatio;
    cancelAnimationFrame(this.rAFId);
    this.maxHeight = [];
    this.init();
    this._draw()
  };
}

