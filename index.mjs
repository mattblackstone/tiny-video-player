export default class TinyVideoPlayer {
  constructor(source, width, height, options) {
    const self = this;
    let srcName;
    if (typeof window.Event !== 'function') {
      const CustomEvent = function (event, params) {
        params = params || {
          bubbles: false,
          cancelable: false,
          detail: undefined
        };
        let evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
        return evt;
      };
      CustomEvent.prototype = window.Event.prototype;
      window.CustomEvent = CustomEvent;
    }
    (Array.isArray(source)) ? srcName = source[0]: srcName = source;
    this.instanceName = srcName.substring(srcName.lastIndexOf('/') + 1, srcName.lastIndexOf('.'));
    this.videoWidth = width;
    this.videoHeight = height;
    this.options = this.defaultVal(options, {});

    this.id = this.defaultVal(this.options.id, this.instanceName);
    this.container = this.getElem(this.options.container, document.body);
    this.isTouch = this.isTouch();
    (this.options.ignoreTouch === true) ? this.nativeContols = false: this.nativeContols = this.isTouch; // if ignoreTouch is true, touch-screen detection will be ignored
    this.poster = this.options.poster;
    this.posterTouch = this.options.posterTouch || this.poster;
    this.startMuted = this.defaultVal(this.options.muted, false);
    this.autoplay = this.defaultVal(this.options.autoplay, false);
    this.preload = this.defaultVal(this.options.preload, 'auto');
    this.controls = this.defaultVal(this.options.controls, true);
    this.playsinline = this.defaultVal(this.options.playsinline, true);

    this.video = document.createElement('video');
    this.video.setAttribute('id', `${this.id}_video`);
    this.video.setAttribute('width', width);
    this.video.setAttribute('height', height);
    this.video.setAttribute('preload', this.preload);
    if (this.playsinline) {
      this.video.setAttribute('playsinline', '');
    }
    if (this.autoplay) {
      this.video.setAttribute('autoplay', '');
    }
    this.createSource(source, this.video);

    if (this.options.cuepoints) {
      // only relevant if cuePoints present
      const cpts = this.options.cuepoints;
      let i = cpts.length;
      this.cuePoints = [];
      while (i--) {
        const cpt = cpts[i];
        if (cpt.time) {
          if (typeof cpt.time === 'number' && !isNaN(cpt.time)) {
            cpt.past = false;
            this.cuePoints.push(cpt); // only add valid cuePoints
          }
        }
      }
      this.cuePoints = this.cuePoints.sort((a, b) => // sort by time
        parseFloat(a.time) - parseFloat(b.time));
      this.cueNum = 0;
      this.nextCue = this.cuePoints[this.cueNum];
      this.video.addEventListener('seeked', () => {
        let i = this.cuePoints.length;
        const now = this.video.currentTime;
        let cpt;
        while (i--) {
          cpt = this.cuePoints[i];
          if (cpt.time > now) {
            cpt.past = false; // reactivate future cuePoints
            this.cueNum = i;
            this.nextCue = this.cuePoints[this.cueNum];
          } else {
            cpt.past = true; // deactivate past cuePoints
          }
        }
        onVideoProgress();
      }, false);
    } else {
      this.cueNum = -1;
    }

    if (this.nativeContols) {
      // do touch specific things
      if (this.posterTouch) {
        this.video.setAttribute('poster', this.posterTouch);
      } // touch specific poster
      if (this.startMuted) {
        this.video.setAttribute('muted', '');
      }
      if (this.controls) {
        this.video.setAttribute('controls', '');
      }
      this.container.appendChild(this.video);
      if (this.cuePoints) {
        this.video.addEventListener('play', () => {
          this.progIntrvl = setInterval(onVideoProgress, 42);
        }, false);
        this.video.addEventListener('pause', () => {
          clearInterval(this.progIntrvl);
        }, false);
      }
    } else {
      // create custom controls for desktop
      if (this.poster) {
        this.video.setAttribute('poster', this.poster);
      } // default poster
      this.propagation = this.defaultVal(this.options.propagation, true);
      this.audio = this.defaultVal(this.options.audio, true);
      if (typeof this.options.right === 'undefined') {
        this.side = 'left';
        this.margin = this.defaultVal(this.options.left, 0);
      } else {
        this.side = 'right';
        this.margin = this.defaultVal(this.options.right, 0);
      }
      this.controlWidth = this.videoWidth - (this.margin * 2);
      this.color1 = {};
      this.color1.hex = this.defaultVal(this.options.color1, 'cc0000');
      this.color1.rgbo = this.hexToRgb(this.color1.hex);
      this.color1.rgb = `${this.color1.rgbo.r},${this.color1.rgbo.g},${this.color1.rgbo.b}`;
      this.color2 = {};
      this.color2.hex = this.defaultVal(this.options.color2, 'ffffff');
      this.color2.rgbo = this.hexToRgb(this.color2.hex);
      this.color2.rgb = `${this.color2.rgbo.r},${this.color2.rgbo.g},${this.color2.rgbo.b}`;
      this.icons = this.defaultVal(this.options.icons, {});
      this.iconW = this.defaultVal(this.icons.w, 15);
      this.iconH = this.defaultVal(this.icons.h, 15);
      this.barheight = this.defaultVal(this.options.barheight, 4);
      this.below = this.defaultVal(this.options.below, false); // progress bar above or below buttons
      this.height = this.barheight + this.iconH + 5;
      if (this.below) {
        this.barbottom = 0;
        this.iconbottom = this.barheight + 3;
      } else {
        this.barbottom = this.iconH + 10;
        this.iconbottom = 3;
        this.height += 3;
      }
      this.wrapper = document.createElement('div'); // wraps video tag and controls into another div for positioning
      this.wrapper.setAttribute('id', `${this.id}_wrapper`);
      this.wrapper.style.position = 'relative';
      this.wrapper.style.width = `${this.videoWidth}px`;
      this.wrapper.style.height = `${this.videoHeight}px`;
      this.wrapper.appendChild(this.video);
      this.container.appendChild(this.wrapper);
    }

    // ------------------------------------- start private methods ------------------------------------- //
    function loadIcon(icon, obj) {
      if (icon.url) {
        // single image
        obj.url = icon.url;
        if (icon.bw || icon.bh) {
          obj.bw = self.defaultVal(icon.bw, self.iconW);
          obj.bh = self.defaultVal(icon.bh, self.iconH);
          obj.bs = `;background-size:${obj.bw}px ${obj.bh}px`;
        }
      } else if (self.icons.url) {
        // sprite sheet
        obj.url = self.icons.url;
        if (self.icons.bw || self.icons.bh) {
          obj.bw = self.defaultVal(self.icons.bw, self.iconW);
          obj.bh = self.defaultVal(self.icons.bh, self.iconH);
          obj.bs = `;background-size:${obj.bw}px ${obj.bh}px`;
        }
      }
      if (icon.x || icon.y) {
        obj.x = self.defaultVal(icon.x, 0);
        obj.y = self.defaultVal(icon.y, 0);
        obj.bp = `;background-position:${obj.x}px ${obj.y}px`;
      }
    }

    function injectStyles() {
      const commonSVG = `"data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 15 15' enable-background='new 0 0 15 15'%3E%3Cstyle type='text/css'%3E.st0%7Bfill:%23${self.color1.hex}%3B%7D%3C/style%3E%3Cpath class='st0' d=`;
      const iconPlay = {
        bp: '',
        bs: '',
        url: `${commonSVG}'M4 3v9l8-4.5-8-4.5z'/%3E%3C/svg%3E"`
      };
      const iconPause = {
        bp: '',
        bs: '',
        url: `${commonSVG}'M3 3h3v9h-3v-9zm6 0h3v9h-3v-9z'/%3E%3C/svg%3E"`
      };
      const iconUnmute = {
        bp: '',
        bs: '',
        url: `${commonSVG}'M1 5h3l3-3v11l-3-3h-3v-5zM9.3 5.7l-.7.7c.2.3.4.7.4 1.1s-.2.8-.4 1.1l.7.7c.4-.5.7-1.1.7-1.8s-.3-1.3-.7-1.8zm1.4-1.4l-.7.7c.6.6 1 1.5 1 2.5s-.4 1.8-1 2.5l.7.7c.8-.8 1.3-2 1.3-3.2s-.5-2.4-1.3-3.2zm1.4-1.4l-.7.7c1 1 1.6 2.4 1.6 3.9s-.6 2.9-1.6 3.9l.7.7c1.2-1.2 1.9-2.8 1.9-4.6s-.7-3.4-1.9-4.6z'/%3E%3C/svg%3E"`
      };
      const iconMute = {
        bp: '',
        bs: '',
        url: `${commonSVG}'M1 5h3l3-3v11l-3-3h-3v-5zm13.4.3l-.7-.7-2.2 2.1-2.1-2.1-.7.7 2.1 2.2-2.1 2.1.7.7 2.1-2.1 2.1 2.1.7-.7-2.1-2.2 2.2-2.1z'/%3E%3C/svg%3E"`
      };
      if (self.icons.play) {
        loadIcon(self.icons.play, iconPlay);
      }
      if (self.icons.pause) {
        loadIcon(self.icons.pause, iconPause);
      }
      if (self.icons.unmute) {
        loadIcon(self.icons.unmute, iconUnmute);
      }
      if (self.icons.mute) {
        loadIcon(self.icons.mute, iconMute);
      }
      let minMargin = 0;
      if (self.margin < 3) {
        minMargin = 3;
      }
      const btn1 = `.${self.id}-btn-muted{height:${self.iconH}px;width:${self.iconW}px;background:url(${iconMute.url})${iconMute.bp}${iconMute.bs}}`;
      const btn2 = `.${self.id}-btn-unmuted{height:${self.iconH}px;width:${self.iconW}px;background:url(${iconUnmute.url})${iconUnmute.bp}${iconUnmute.bs}}`;
      const btn3 = `.${self.id}-btn-playing{height:${self.iconH}px;width:${self.iconW}px;background:url(${iconPause.url})${iconPause.bp}${iconPause.bs}}`;
      const btn4 = `.${self.id}-btn-paused{height:${self.iconH}px;width:${self.iconW}px;background:url(${iconPlay.url})${iconPlay.bp}${iconPlay.bs}}`;
      const togl = `#${self.id}_toggle_sound,#${self.id}_toggle_play{cursor:pointer;bottom:${self.iconbottom}px;background-color:rgba(${self.color2.rgb},0)}`;
      const togh = `#${self.id}_toggle_sound:hover,#${self.id}_toggle_play:hover{background-color:rgba(${self.color2.rgb},0.15)}#${self.id}_toggle_sound{${self.side}:${self.iconW + 3 + minMargin}px}#${self.id}_toggle_play{${self.side}:${minMargin}px}`;
      const prog = `#${self.id}_progress{width:0;background-color:#${self.color1.hex}}#${self.id}_seek_hit{width:100%;height:100%;cursor:pointer;background-color:rgba(0,0,0,0.001)}#${self.id}_seek_track{width:100%;background-color:#${self.color2.hex};opacity:0.1}#${self.id}_buffer_track{width:0;background-color:#${self.color2.hex};opacity:0.125}#${self.id}_seek_mark{width:0;background-color:#${self.color1.hex};opacity:0.25;pointer-events:none}`;
      const bars = `#${self.id}_progress,#${self.id}_seek_track,#${self.id}_seek_mark,#${self.id}_buffer_track{bottom:${self.barbottom}px;height:${self.barheight}px}`;
      const ctrl = `#${self.id}_controls{margin:0 !important;position:absolute;left:${self.margin}px;top:${self.videoHeight - self.height}px;width:${self.controlWidth}px;height:${self.height}px}`;
      const cdiv = `#${self.id}_controls div{margin:0;position:absolute}`;
      self.writeCSS(cdiv + ctrl + bars + prog + togl + togh + btn1 + btn2 + btn3 + btn4);
    }

    function createControls() {
      self.controls = self.createDiv(self.video.parentNode, `${self.id}_controls`);
      self.progress = self.createDiv(self.controls, `${self.id}_progress`);
      self.seek_mark = self.createDiv(self.controls, `${self.id}_seek_mark`);
      self.buffer_track = self.createDiv(self.controls, `${self.id}_buffer_track`);
      self.seek_track = self.createDiv(self.controls, `${self.id}_seek_track`);
      self.seek_hit = self.createDiv(self.controls, `${self.id}_seek_hit`);
      self.toggle_play = self.createDiv(self.controls, `${self.id}_toggle_play`);
      self.toggle_sound = self.createDiv(self.controls, `${self.id}_toggle_sound`);
      if (self.audio === false) {
        self.toggle_sound.style.visibility = 'hidden';
      }

      showPaused();

      self.toggle_sound.addEventListener('click', onSoundClick, false);
      self.toggle_sound.addEventListener('mouseover', onSoundHover, false);
      self.toggle_play.addEventListener('click', onPlayClick, false);
      self.toggle_play.addEventListener('mouseover', onPlayHover, false);
      self.seek_hit.addEventListener('click', onSeekClick, false);
      self.seek_hit.addEventListener('mouseover', onSeekHover, false);
      self.seek_hit.addEventListener('mouseout', onSeekOut, false);
      self.video.addEventListener('progress', onBufferProgress, false);
      self.video.addEventListener('loadedmetadata', onBufferProgress, false);
      self.video.addEventListener('ended', self.video.pause, false);
      self.video.addEventListener('play', showPlaying, false);
      self.video.addEventListener('pause', showPaused, false);
      self.video.addEventListener('volumechange', onVolumeChange, false);

      if (!self.startMuted) {
        onVolumeChange();
      }
      self.video.muted = self.startMuted;

      onBufferProgress();
    }

    function videoSeek(time) {
      if (typeof time === 'number' && !isNaN(time)) {
        if (self.video.readyState > 2) {
          self.video.currentTime = time;
          onVideoProgress();
        } else {
          self.video.addEventListener('canplay', function canSeek() {
            self.video.removeEventListener('canplay', canSeek, false);
            self.video.currentTime = time;
            onVideoProgress();
          }, false);
        }
      }
    }

    function showPlaying() {
      self.toggle_play.classList.remove(`${self.id}-btn-paused`);
      self.toggle_play.classList.add(`${self.id}-btn-playing`);
      self.progIntrvl = setInterval(onVideoProgress, 42); // approx 24fps since many browsers only fire the 'timeupdate' event at 4fps (250ms)
    }

    function showPaused() {
      self.toggle_play.classList.remove(`${self.id}-btn-playing`);
      self.toggle_play.classList.add(`${self.id}-btn-paused`);
      clearInterval(self.progIntrvl);
    }

    function onVolumeChange() {
      if (self.video.muted) {
        self.toggle_sound.classList.remove(`${self.id}-btn-unmuted`);
        self.toggle_sound.classList.add(`${self.id}-btn-muted`);
      } else {
        self.toggle_sound.classList.remove(`${self.id}-btn-muted`);
        self.toggle_sound.classList.add(`${self.id}-btn-unmuted`);
      }
    }

    function onSoundClick(e) {
      if (!self.propagation) {
        e.stopPropagation();
      }
      if (self.video.muted) {
        self.video.muted = false;
      } else {
        self.video.muted = true;
      }
    }

    function onSoundHover(e) {
      if (!self.propagation) {
        e.stopPropagation();
      }
    }

    function onPlayClick(e) {
      if (!self.propagation) {
        e.stopPropagation();
      }
      if (!self.video.paused) {
        self.video.pause();
      } else {
        self.video.play();
      }
    }

    function onPlayHover(e) {
      if (!self.propagation) {
        e.stopPropagation();
      }
    }

    function onSeekClick(e) {
      if (!self.propagation) {
        e.stopPropagation();
      }
      const newtime = ((e.clientX - (self.controls.getBoundingClientRect().left)) / parseInt(self.seek_hit.getBoundingClientRect().width, 10)) * self.video.duration;
      videoSeek(newtime);
    }

    function onSeekHover(e) {
      if (!self.propagation) {
        e.stopPropagation();
      }
      self.seek_hit.addEventListener('mousemove', onSeekMark, false);
      self.seek_mark.style.visibility = 'visible';
    }

    function onSeekOut() {
      self.seek_hit.removeEventListener('mousemove', onSeekMark, false);
      self.seek_mark.style.visibility = 'hidden';
    }

    function onSeekMark(e) {
      const scale = self.video.getBoundingClientRect().width / self.videoWidth;
      self.seek_mark.style.width = `${Math.round((e.clientX - (self.controls.getBoundingClientRect().left)) / scale)}px`;
    }

    function onVideoProgress() {
      // every 42ms (24fps) when playing
      const now = self.video.currentTime;
      if (!self.nativeContols) {
        let percent;
        percent = (now / self.video.duration * 100);
        if (percent > 100) {
          percent = 100;
        }
        self.progress.style.width = `${percent}%`;
        onBufferProgress();
      }
      if (self.cueNum > -1 && !self.video.seeking) {
        if (now >= self.nextCue.time - 0.02) {
          // shift cuePoints up 0.02 ^ seconds to compensate for fps
          if (!self.nextCue.past) {
            const eventCue = new CustomEvent('cuepoint', {
              detail: {
                data: self.nextCue.data,
                time: self.nextCue.time,
                actual: now
              }
            });
            self.video.dispatchEvent(eventCue);
            self.nextCue.past = true;
            if (self.cueNum === self.cuePoints.length - 1) {
              self.cueNum = -1;
            } else {
              self.cueNum++;
              self.nextCue = self.cuePoints[self.cueNum];
            }
          }
        }
      }
    }

    function onBufferProgress() {
      const buffered = self.video.buffered;
      if (buffered.length > 0) {
        const bufferEnd = buffered.end(buffered.length - 1);
        const percent = bufferEnd / self.video.duration * 100;
        self.buffer_track.style.width = `${percent}%`;
      }
    }
    // ------------------------------------- end private methods ------------------------------------- //

    if (this.nativeContols) {
      this.proxyShowControls = bool => {
        if (bool) {
          if (!this.video.hasAttribute('controls')) {
            this.video.setAttribute('controls', '');
          }
        } else {
          if (this.video.hasAttribute('controls')) {
            this.video.removeAttribute('controls');
          }
        }
      };
      this.proxyCurrentTime = time => {
        this.video.currentTime = time;
      };
    } else {
      this.proxyShowControls = bool => {
        if (bool) {
          this.controls.style.visibility = 'visible';
        } else {
          this.controls.style.visibility = 'hidden';
        }
      };
      this.proxyCurrentTime = time => {
        videoSeek(time);
      };
      injectStyles();
      createControls();
    }
  }
  isTouch() {
    const EVENTS = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
    const AGENT = typeof window.orientation !== 'undefined' || navigator.userAgent.match(/iPhone|iPad|iPod|Android|IEMobile|Kindle|Silk|BlackBerry|Opera Mini/i);
    return EVENTS && AGENT;
  }
  play() {
    this.video.play();
  }
  pause() {
    this.video.pause();
  }
  showControls(bool) {
    this.proxyShowControls(bool);
  }
  writeCSS(styles) {
    const css = document.createElement('style');
    css.type = 'text/css';
    css.appendChild(document.createTextNode(styles));
    document.head.appendChild(css);
  }

  trace(msg) {
    if (window.console) {
      window.console.log(msg);
    }
  }

  getElem(ref) {
    if (ref) {
      if (typeof ref === 'string') {
        if (/^#|^\./.test(ref)) {
          return document.querySelector(ref);
        } else {
          return document.getElementById(ref);
        }
      } else {
        return ref;
      }
    } else {
      return document.body;
    }
  }

  createSource(source, videoElem) {
    if (typeof source === 'string') {
      videoElem.setAttribute('src', source);
    } else {
      for (let i = 0; i < source.length; i++) {
        const src = document.createElement('source');
        const ext = source[i].split('.').pop();
        let type = ext; // default: same type as file extention
        if (/m4v/.test(ext)) {
          type = 'mp4';
        }
        if (/ogv/.test(ext)) {
          type = 'ogg';
        }
        src.setAttribute('src', source[i]);
        src.setAttribute('type', `video/${type}`);
        videoElem.appendChild(src);
      }
    }
  }

  defaultVal(option, defalt) {
    let value;
    (typeof option === 'undefined' || option === '' || typeof option !== typeof defalt) ? value = defalt: value = option;
    return value;
  }

  getStyle(elem, styleProp) {
    let ret;
    (styleProp) ? ret = window.getComputedStyle(elem, null).getPropertyValue(styleProp): ret = window.getComputedStyle(elem, null);
    return ret;
  }

  createDiv(parent, id) {
    const elem = document.createElement('div');
    elem.id = id;
    parent.appendChild(elem);
    return elem;
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
  get muted() {
    return this.video.muted;
  }
  set muted(value) {
    this.video.muted = value;
  }
  get currentTime() {
    return this.video.currentTime;
  }
  set currentTime(time) {
    this.proxyCurrentTime(time);
  }
  get paused() {
    return this.video.paused;
  }
  get seeking() {
    return this.video.seeking;
  }
  get duration() {
    return this.video.duration;
  }
  get videoElement() {
    return this.video;
  }
  get controlsElement() {
    return this.controls;
  }
  addEventListener(type, func, capture) {
    const useCapture = this.defaultVal(capture, false);
    this.video.addEventListener(type, func, useCapture);
  }
  removeEventListener(type, func, capture) {
    const useCapture = this.defaultVal(capture, false);
    this.video.removeEventListener(type, func, useCapture);
  }
}