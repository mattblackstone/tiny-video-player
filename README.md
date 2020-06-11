# Vanilla Javascript self-contained HTML5 video player
Use this library to replace the default HTML5 video controls with custom graphics. Default control graphics for play/pause, mute/unmute and progress bars can be styled with different colors and dimensions. Custom images can also be defined through the constructor to replace some or all 4 icons (play,pause,mute,unmute).

### Usage
Script tag:
```html
<script src="https://unpkg.com/tiny-video-player/index.js"></script>
```
ES Module Import:
```javascript
import TinyVideoPlayer from 'tiny-video-player/index.mjs';
```
CommonJS Module Import:
```javascript
const TinyVideoPlayer = require('tiny-video-player');
```

#### Constructor:
The first three constructor arguments are required. The 4th arg is optional.
1. source: path to the video file or an array of paths that will be used to generate the video tag
2. width: video width (integer)
3. height: video height (integer)
4. options: object [details below](#options)
```typescript
TinyVideoPlayer(source: string | string[], width: number, height: number, options: object)
```

### Minimal Instantiation
After loading TinyVideoPlayer via scrip tag or import
```javascript
var myPlayer = new TinyVideoPlayer('my-video.mp4', 320, 180);
// this will create a video tag with the default custom controls in document.body
```

### Basic Customization
You can pass several video sources in an array as the first argument. All options are wrapped in an object and passed through the fourth argument in the constructor. Options include container element, theme colors, margins, icon positions (left/right), progress bar thickness and position (above/below icons) etc [see full options](#options).
```javascript
var options = {container: '#my_container', poster:'poster.jpg', autoplay:true, muted:true, barheight:1, left:5, color1:'00b3e3', color2:'ffffff'};
var myPlayer = new TinyVideoPlayer(['my-video.mp4', 'my-video.webm', 'my-video.ogv'], 320, 180, options);
// the options specified above will display poster.jpg until the video loads,
// the video will autoplay muted, the progress bar will be 1px thick and the color #00b3e3
// the play,pause,mute,unmute color will also be #00b3e3
// color2 is a secondary color that is used for the semi-transparent buffer indicator etc
```

### Advanced Customization
The default play, pause, mute, unmute icons can be overridden with custom images. Each icon must be explicitly overridden allowing for mix and match scenarios. You can use individual images or a sprite-sheet to replace some or all of the 4 icons. All custom icon options must be defined within an object named 'icons'. Use the url property to point to your image(s) and use the coordinate properties (w,h,bw,bh,x,y) to define which imagery should be used for each icon. [see full options](#options).
```javascript
var separateImages = {play:{url:'play.png'},pause:{url:'pause.png'}};
var myPlayer = new TinyVideoPlayer('video-one.mp4', 320, 180, {poster:'poster.jpg', color1:'cc00cc', icons:separateImages});
// this is a minimal implementation of custom play and pause icons using individual image files
// only play and pause have been defined so the default mute and unmute buttons will be used
// no coordinates or dimensions have been specified, so the default values will be used based on the default icons
var spriteSheet = {w:15,h:15,bw:30,bh:30,url:'sprite.png',play:{x:0,y:0},pause:{x:-15,y:0},mute:{x:0,y:-15},unmute:{x:-15,-15}}
var myPlayer2 = new TinyVideoPlayer('video-two.mp4', 320, 180, {poster:'poster.jpg', color1:'336699', icons:spriteSheet});
// this is a demonstration of a 30x30px square sprite-sheet containing 4 15x15px icons (play:top-left, pause:top-right, mute:bottom-left, unmute:bottom-right)
// the properies w,h,bw,bh,url specified on the root of the icons object will be inherited by play,pause,mute,unmute unless overridden within those child objects
// w,h define the universal dimension for each icon, bw,bh (background-width/height) define CSS background-size
// x,y supply CSS background-position coordinates (just like any sprite-sheet)
// w,h are only specified on the root while x,y are only specified within play,pause,mute,unmute child objects
// url,bw,bh can all be overridden inside individual child objects
```

### Touch-screen Detection
If touch-screen capability with mobile attributes is detected, the native video controls will be used instead. The TinyVideoPlayer object makes no attempt to style the shadow DOM. If the option *posterTouch* has been specified it, will be implemented otherwise *poster* will be used if available. Differentiation between a laptop with touch capability and a tablet cannot be guaranteed. The touch-screen detection can be disabled by passing 'ignoreTouch:true' via the options argument, but disabling touch detection is strongly discouraged. Cuepoint functionality should work for touch-screen devices provided that the video is playing inline (not fullscreen).

### Methods
This lib mimics the functionality of the native html5 video element. Most methods are exactly the same as the native player.
#### play()
```javascript
myPlayer.play();
```
#### pause()
```javascript
myPlayer.pause();
```
#### showControls(Boolean)
```javascript
myPlayer.showControls(true);
```

### Getters
#### muted : Boolean
```javascript
var isMuted = myPlayer.muted;
```
#### currentTime : Number
```javascript
var secondsElapsed = myPlayer.currentTime;
```
#### seeking : Boolean
```javascript
var isSeeking = myPlayer.seeking;
```
#### controlsElement : HTMLElement
Returns the the current TinyVideoPlayer object
```javascript
var controlsElem = myPlayer.controlsElement;
```
#### videoElement : HTMLElement
Returns the video element associated with the current TinyVideoPlayer object
```javascript
var myVideoElem = myPlayer.videoElement;
```

### Setters
#### muted : Boolean
```javascript
myPlayer.muted = true;
```
#### currentTime : Number
Seeks video to the specified time in seconds
```javascript
myPlayer.currentTime = 5.25;
```

### <a name="events"></a>Events
Any event listeners added to the TinyVideoPlayer instance will be forwarded on to the video element.
#### generic events
```javascript
myPlayer.addEventListener('mouseover', myHandler);
// is equivalent to...
myVideoElem.addEventListener('mouseover', myHandler);
```
#### cuepoint events (when present)
```javascript
myPlayer.addEventListener('cuepoint', function(e){
  window.console.log(e.detail);
  // e.detail.data (optional data defined in constructor)
  // e.detail.time (time defined in constructor)
  // e.detail.actual (actual video.currentTime +-0.02 seconds approx)
});
```

### <a name="options"></a>Options
All options below are passed inside a container object as the second argument in the constructor. All options that take Number values should be unit-less (no px/%/em units)
#### poster : String (default: undefined)
Path to an image that will display until playback has started
#### posterTouch : String (default: undefined)
Path to an image that will display until playback has started specifically for touch-screen scenarios. An animated GIF poster may be well suited for a desktop browser, but touch-screen devices often add a play button overlay to video elements, hence the need for this option. If not *posterTouch* is not specified, the normal *poster* will be shown if available.
#### id : String (default: 'vc[number]')
Specifies an id for the video element being created
#### container : CSS Selector or HTMLElement (default: document.body)
Specifies target element for the video element to be created appended to
#### playsinline : Boolean (default: true)
For touch-screen devices: specifies whether or not the video should attempt to play without going fullscreen
#### muted : Boolean (default: false)
Specifies whether video playback should start with the sound muted or unmuted
#### audio : Boolean (default: true)
Specifies whether or not to display the sound toggle button. Can be set to false for videos with no audio track.
#### autoplay : Boolean (default: false)
Specifies whether video playback should start immediately without user interaction
#### cuepoints : Array (default: undefined)
Specifies an array of objects containing times and optional data that will be dispatched via events at pre-determined time codes in the video. Example: [{time: 1.2, data: 'one'}, {time: 3.4, data: 'two'}, {time: 5.67}] [See events section](#events) for more detail regarding listening for cuepoint events
#### cuepoints.cuepoint : Object (default: undefined)
Specifies an individual cue point within the cuepoint array. Each cuepoint is an object with the required member (time:[number in seconds]) and an optional member (data:[any type]). Example: {time: 2.45, data: 'whatever'}
#### left : Number (default: 0)
Defines margin in pixels from both sides of the video with *left* indicating that the icons should be left-aligned
#### right : Number (default: 0)
Defines margin in pixels from both sides of the video with *right* indicating that the icons should be right-aligned. If values for both *left* and *right* are passed, *left* will be ignored.
#### color1 : String (default: 'cc0000')
Defines the main color that will be used for the default icons and progress bar. Six digit hex color values only. Do not include '#' before the hex number.
#### color2 : String (default: 'ffffff')
Defines the secondary color that will be used for the progress bar background, buffer indicator and icon hover background color. The secondary color is never fully opaque, so white or black will work best in most cases. Six digit hex color values only. Do not include '#' before the hex number.
#### barheight : Number (default: 4)
Defines the thickness of the progress bar in pixels
#### below : Boolean (default: false)
Specifies whether the progress bar should be underneath the icons
#### propagation : Boolean (default: true)
If set to false, event propagation will be stopped on all videocontrol mouse events. You may need to set this to false when adding mouse listeners to the parentNode containing the video.
#### icons : Object (default: undefined)
Complex object used to define custom icons. See below.
#### icons.w : Number (default: 15)
Specifies a universal icon width in pixels
#### icons.h : Number (default: 15)
Specifies a universal icon height in pixels
#### icons.url : String (default: undefined)
Specifies a path to a sprite-sheet image. bw,bh must be specified in conjunction with this option. See below.
#### icons.bw : Number (default: 15)
Specifies a CSS background-size (width) in pixels for the image specified in *icons.url*
#### icons.bh : Number (default: 15)
Specifies a CSS background-size (height) in pixels for the image specified in *icons.url*
#### icons.[icon] : Object (default: undefined)
*icons.[icon]* is a convention only used here in the documentation to refer to the 4 individual child icon objects *icons.play, icons.pause, icon.mute, icon.unmute*
#### icons.[icon].x : Number (default: 0)
Specifies a CSS background-position (x) in pixels for the image specified in *icons.url* or *icons.[icon].url*
#### icons.[icon].y : Number (default: 0)
Specifies a CSS background-position (y) in pixels for the image specified in *icons.url* or *icons.[icon].url*
#### icons.[icon].url : String (default: icon.url)
Specifies a path to an individual image or sprite-sheet for a specific icon
#### icons.[icon].bw : Number (default: icon.bw)
Specifies a CSS background-size (width) in pixels for the image specified in *icons.url* or *icons.[icon].url*
#### icons.[icon].bh : Number (default: icon.bh)
Specifies a CSS background-size (height) in pixels for the image specified in *icons.url* or *icons.[icon].url*
#### ignoreTouch : Boolean (default: undefined)
If set to true, will disable touch-screen detection. Use this option with extreme caution. The default size of these controls is small and not touch-friendly. Additionally, many touch environments (like iPhone) will not permit autoplay or inline video.
