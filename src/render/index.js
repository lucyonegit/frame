class FrameBar {
  constructor(config) {
    const { containerId } = config || {};
    this.containerId = containerId;
    this.width = 0;
    this.height = 0;
    this.maxHeight = [];
    this.dpr = window.devicePixelRatio;
    this.canvasCtx = null;
    this.rAFId = null
  }
  _getContainer = () => {
    let container = this.containerId
      ? document.querySelector(`#${this.containerId}`)
      : document.body;
    while (container.hasChildNodes()) {
      container.removeChild(container.firstChild);
    }
    return container;
  };
  init = () => {
    let { clientWidth, clientHeight } = this._getContainer();
    this.width = clientWidth;
    this.height = clientHeight;
    this._initCanvasCtx();
  };
  _initCanvasCtx = () => {
    let canvas = document.createElement("canvas");
    canvas.width = this.width * this.dpr;
    canvas.height = this.height * this.dpr;
    canvas.style.width = `${this.width}px`;
    canvas.style.height = `${this.height}px`;
    let context = canvas.getContext("2d");
    context.width = this.width * this.dpr;
    context.height = this.height * this.dpr;
    context.scale(this.dpr, this.dpr);
    this._getContainer().appendChild(canvas);
    this.canvasCtx = context;
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
  // 屏幕画面
  _createAnalyser = (stream) => {

    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    analyser.fftSize = 128;
    const getData = () => {
      let dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);
      return dataArray;
    };
    this._draw(getData);
    return () => {
      audioCtx.close();
    };
  };
  /**
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {{():Uint8Array}} getData
   */
  _draw(getData) {
    const data = getData();
    const bar_w = this.canvasCtx.width / data.length;
    this.canvasCtx.clearRect(0, 0, this.canvasCtx.width, this.canvasCtx.height);
    this.canvasCtx.beginPath();
    for (let i = 0; i < data.length; i++) {
      let bar_x = i * bar_w;
      let bar_h = (data[i] / 255) * this.canvasCtx.height;
      let bar_y = this.canvasCtx.height - bar_h;
      this.canvasCtx.fillStyle = `#000`;
      this.canvasCtx.fillRect(
        bar_x / this.dpr,
        bar_y / this.dpr,
        bar_w / this.dpr,
        bar_h / this.dpr
      );
      this.canvasCtx.fillText(i + 1 + "", bar_x / this.dpr, 100);
      this.canvasCtx.fillStyle = "#0f0";
      if (this.maxHeight[i]) {
        if (this.maxHeight[i] < bar_y / this.dpr) {
          this.maxHeight[i] += 1;
        } else {
          this.maxHeight[i] = bar_y / this.dpr;
        }
      } else {
        this.maxHeight[i] = bar_y / this.dpr;
      }
      this.canvasCtx.fillRect(
        bar_x / this.dpr,
        this.maxHeight[i],
        bar_w / this.dpr,
        5
      );
    }
    this.canvasCtx.closePath();
    this.rAFId = requestAnimationFrame(() => this._draw(getData));
  }
  run = async () => {
    this.init();
    const mediaStream = await this._getDesktopAudioMediaStream();
    this._createAnalyser(mediaStream);
  };
  reset = () => {
    cancelAnimationFrame(this.rAFId);
    this.init();
  };
}

window.addEventListener("load", () => {
  let frameBar = new FrameBar();
  frameBar.run();
  window.addEventListener("resize", () => {
    frameBar.reset();
    frameBar.run();
  });
});
