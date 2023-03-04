<canvas-video>
==========

&lt;canvas-video&gt; plays back video or web camera feeds. Playback is offered on an internal canvas as well. Consumers can draw directly into this canvas, get a copy
of the framedata or even take the canvas context for use on another canvas


Attributes
------------------

note: attributes are not observed and therefore will not react to changes

- **useCamera** *(boolean)* If present, the component will use your webcam

- **src** *(string)* If present, this will set the source video of your component. If **useCamera** is present, this source can either be an integer or ID to represent your webcam

- **useCanvasForDisplay** *(boolean)* If present, this component will hide the video, and instead show the internal canvas that draws the frames from the vidoe

- **frameDataMode** *(string: "imagedataurl" (default), or "imagedata"* Setting for the data in the event that occurs when the frame is redrawn.

    - **imagedataurl** good for setting the source of an img tag or similar

    - **imagedata** good for applying to another canvas element

- **canvasRefreshInterval** (integer) How often, in milliseconds, the internal canvas is refreshed. Default is 250ms which is a bit choppy To see results, be sure to use with "useCanvasForDisplay". Alternately, use this to drive regular update events

- **canvasScale** (float/number) Scaling of the canvas and scale of image data from the frame update events. 0.5, for example will show content at half size

Properties
------------------

- **src** *(string)* source of component

- **canvasContext** *(context 2D)* canvas render context

- **useCanvasForDisplay** *(boolean)* If present, this component will hide the video, and instead show the internal canvas that draws the frames from the vidoe

- **frameDataMode** *(string: "imagedataurl" (default), or "imagedata"* Setting for the data in the event that occurs when the frame is redrawn.

  - **imagedataurl** good for setting the source of an img tag or similar

  - **imagedata** good for applying to another canvas element

- **canvasRefreshInterval** (integer) How often, in milliseconds, the internal canvas is refreshed. Default is 250ms which is a bit choppy To see results, be sure to use with "useCanvasForDisplay". Alternately, use this to drive regular update events

- **canvasScale** (float/number) Scaling of the canvas and scale of image data from the frame update events. 0.5, for example will show content at half size

- **flipCanvasHorizontally** (boolean) flips the canvas horizontally


Properties (read only)
------------------

- **width** *(number)* width of component

- **height** *(number)* height of component

- **aspectRatio** *(number)* aspect ratio of video

- **videoRect** *({x: number, y: number, width: number, height: number })* video rectangle relative to component bounding box

- **isReady** *(boolean)* is component ready

- **isPlaying** *(boolean)* is video source playing


Methods
------------------

- **resize** force a component resize


Events
--------------

canvasvideo.addEventListener
- **ready** the component is ready. No event detail is provided

- **frameupdate** the internal canvas has been updated, a new video frame is available. Event details provided are:

    - *event.framedata* image data for the video frame
