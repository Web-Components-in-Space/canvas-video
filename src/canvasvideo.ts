/**
 * CanvasVideo supports both video files and camera feeds
 * Blit your video to a canvas, get frame data, scale the frame/canvas output, and render video to an external canvas of your choosing
 */
import { CanvasVideoEvent } from './canvasvideoevent';

export class CanvasVideo extends HTMLElement {
    /** how the video is scaled */
    public videoScaleMode = 'contain';

    /** what type of data comes back with frame data event */
    public frameDataMode = 'none';

    /** determines whether to use the canvas element for display instead of the video element */
    public useCanvasForDisplay = false;

    /** render scale for canvas frame data */
    public canvasScale = 1.0;

    /** canvas is flipped horizontally */
    public flipCanvasHorizontally = false;

    /** video source file or stream */
    protected _source: string = '';

    /** use camera */
    protected _useCamera: boolean = false;

    /** video element */
    protected videoElement?: HTMLVideoElement;

    /** camera sources list */
    // protected cameraSources = [];

    /** canvas element */
    protected canvasElement?: HTMLCanvasElement;

    /** is component ready  */
    protected _isReady = false;

    /** is video playing */
    protected _isPlaying = false;

    /** interval timer to draw frame redraws */
    protected tick?: number;

    /** refresh interval when using the canvas for display */
    protected canvasRefreshInterval = 0;

    /** canvas context */
    protected canvasctx?: CanvasRenderingContext2D | null;

    /** has the canvas context been overridden from the outside? */
    protected _canvasOverride = false;

    /** _width of component */
    protected _width = 0;

    /** _height of component */
    protected _height = 0;

    /** left offset for letterbox of video */
    protected letterBoxLeft = 0;

    /** top offset for letterbox of video */
    protected letterBoxTop = 0;

    /** aspect ratio of video */
    protected _aspectRatio = 0;

    /** visible area bounding box */
    protected _visibleVideoRect = { x: 0, y: 0, width: 0, height: 0 };

    /** width of scaled video */
    protected videoScaledWidth = 0;

    /** height of scaled video */
    protected videoScaledHeight = 0;

    public get width() {
        return this._width;
    }

    public get height() {
        return this._height;
    }

    public get aspectRatio() {
        return this._aspectRatio;
    }

    public get videoRect() {
        return this._visibleVideoRect;
    }

    public get isReady() {
        return this._isReady;
    }

    public get isPlaying() {
        return this._isPlaying;
    }

    constructor() {
        super();
        this.attachShadow({mode: 'open' });
        this.shadowRoot!.innerHTML = `
                <style>
                    :host {
                        display: inline-block;
                        background-color: black;
                        position: relative;
                        overflow: hidden;
                    }
                    
                    canvas {
                        position: absolute;
                    }
                    
                    video {
                        position: absolute;
                    }
                </style>
                <video autoplay="true"></video>
                <canvas></canvas>`;
    }

    protected connectedCallback() {
        this.parseAttributes();
        window.addEventListener('resize', () => { this.resize(); });

        this.videoElement = this.shadowRoot?.querySelector('video') as HTMLVideoElement;
        this.videoElement.addEventListener('play', () => this.onPlaying());
        this.canvasElement = this.shadowRoot?.querySelector('canvas') as HTMLCanvasElement;

        if (this.flipCanvasHorizontally) {
            this.canvasElement.style.transform = 'scale(1, -1)';
        }
        this.videoElement.onloadedmetadata = () => {
            this.resize();
        };

        this.source = this._source;
        if (this.useCanvasForDisplay) {
            this.videoElement.style.display = 'none';
        } else {
            this.canvasElement.style.display = 'none';
        }

        if (this.canvasRefreshInterval > 0) {
            this.tick = setInterval(() => {
                if (this._width === 0 || this._height === 0) { return; }
                if (!this._isPlaying) { return; }

                const event = new CanvasVideoEvent(CanvasVideoEvent.ON_FRAME_UPDATE);
                event.framedata = this.getCurrentFrameData();
                this.dispatchEvent(event);
            }, this.canvasRefreshInterval);
        }

        this._isReady = true;
        const event = new CanvasVideoEvent(CanvasVideoEvent.ON_READY);
        this.dispatchEvent(event);
    }

    /**
     * on video playing handler
     */
    protected onPlaying() {
        this._isPlaying = true;
        const event = new CanvasVideoEvent(CanvasVideoEvent.ON_READY);
        this.dispatchEvent(event);

        if (this.canvasElement) {
            this.canvasElement.width = this.videoScaledWidth * this.canvasScale;
            this.canvasElement.height = this.videoScaledHeight * this.canvasScale;
        }
        this.canvasctx = this.createContext();
    }

    protected createContext() {
        if (!this._canvasOverride) {
            return this.canvasElement?.getContext('2d', { willReadFrequently: true });
        }
        return this.canvasctx;
    }

    /**
     * update canvas dimensions when resized
     * @private
     */
    resize() {
        if (this.offsetWidth === 0 || this.offsetHeight === 0) {
            return;
        }

        // set size properties based on component _height
        this._width = this.offsetWidth;
        this._height = this.offsetHeight;

        if (this.videoElement && this.videoElement.videoWidth > 0 && this.videoElement.videoHeight > 0) {
            this._aspectRatio = this.videoElement.videoWidth / this.videoElement.videoHeight;
        }

        this.videoScaledWidth = this._width;
        this.videoScaledHeight = this._height;
        const componentAspectRatio = this._width/this._height;

        if (this.videoScaleMode === 'contain') {
            // calculate letterbox borders
            if (componentAspectRatio < this._aspectRatio) {
                this.videoScaledHeight = this._width / this._aspectRatio;
                this.letterBoxTop = this._height/2 - this.videoScaledHeight/2;
                this.letterBoxLeft = 0;
            } else if (componentAspectRatio > this._aspectRatio) {
                this.videoScaledWidth = this._height * this._aspectRatio;
                this.letterBoxLeft = this._width/2 - this.videoScaledWidth/2;
                this.letterBoxTop = 0;
            } else {
                this.letterBoxTop = 0;
                this.letterBoxLeft = 0;
            }

            this._visibleVideoRect.x = 0;
            this._visibleVideoRect.y = 0;
            this._visibleVideoRect.width = this.videoScaledWidth;
            this._visibleVideoRect.height = this.videoScaledHeight;

        } else if (this.videoScaleMode === 'cover') {
            if (componentAspectRatio > this._aspectRatio) {
                this.videoScaledWidth = this._width;
                this.videoScaledHeight = this._width / this._aspectRatio;
                this.letterBoxLeft = 0;
                this.letterBoxTop = -(this.videoScaledHeight/2 - this._height/2);
            } else {
                this.videoScaledHeight = this._height;
                this.videoScaledWidth = this._height * this._aspectRatio;
                this.letterBoxTop = 0;
                this.letterBoxLeft = -(this.videoScaledWidth/2 - this._width/2);
            }

            this._visibleVideoRect.x = -(this.letterBoxLeft);
            this._visibleVideoRect.y = -(this.letterBoxTop);
            this._visibleVideoRect.width = this.videoScaledWidth - (this._visibleVideoRect.x *2);
            this._visibleVideoRect.height = this.videoScaledHeight - (this._visibleVideoRect.y *2);
        }

        // set video/canvas to component size
        if (this.videoElement) {
            this.videoElement.setAttribute('_width', String(this.videoScaledWidth));
            this.videoElement.setAttribute('_height', String(this.videoScaledHeight));
            this.videoElement.style.top = this.letterBoxTop + 'px';
            this.videoElement.style.left = this.letterBoxLeft + 'px';
        }
        if (this.canvasElement) {
            this.canvasElement.setAttribute('_width', String(this.videoScaledWidth));
            this.canvasElement.setAttribute('_height', String(this.videoScaledHeight));
            this.canvasElement.style.top = this.letterBoxTop + 'px';
            this.canvasElement.style.left = this.letterBoxLeft + 'px';
        }
    };

    /**
     * set video source
     * @param {string | int} src video source uri
     */
    set source(src) {
        if (this._useCamera) {
            navigator.mediaDevices.getUserMedia({ audio: false, video: true }).then( stream => this.onCameraStream(stream));
        } else if (this.videoElement) {
            this.videoElement.src = src;
            this._source = src;

        }

        /*if (this._useCamera && this.cameraSources.length === 0) {
            this.refreshCameraSources();
            return;
        }
        if (this._useCamera || parseInt(src) === src) {
            this.setCameraSourceByIndex(src);
        } else if (this._useCamera) {
            this.setCameraSourceByID(src);
        } else {
            this.videoElement.src = src;
        }*/
    };

    /**
     * get video source
     * @return {string | int} src video source uri
     */
    get source() {
        return this._source;
    };

    /**
     * get canvas context for drawing into it
     * @return {object} context canvas context
     */
    get canvasContext() {
        return this.canvasctx;
    };

    /**
     * get canvas context for drawing into it
     * @param {object} context canvas context
     */
    set canvasContext(context) {
        this.canvasctx = context;
        this._canvasOverride = true;
    };

    /**
     * get image data for current frame
     * @param {boolean} mode data mode (binary or base64)
     * @param {boolean} noredraw do not perform redraw (can be wasteful)
     * @return {object} image data
     */
    getCurrentFrameData(mode = this.frameDataMode, noredraw = false) {
        var data, filtered;
        if (!noredraw) {
            this.canvasctx?.drawImage(
                    this.videoElement as HTMLVideoElement, 0, 0,
                    this.videoScaledWidth * this.canvasScale,
                    this.videoScaledHeight * this.canvasScale);

        }

        switch (mode) {
            /*case 'binary':
                var base64Data = data.replace('data:image/png;base64', '');
                var binaryData = new Buffer(base64Data, 'base64');
                data = binaryData;
                break;*/

            case 'imagedataurl':
                data = this.canvasElement?.toDataURL('image/png');
                break;

            case 'imagedata':
                if (!filtered) {
                    data = this.canvasctx?.getImageData(
                        this._visibleVideoRect.x * this.canvasScale,
                        this._visibleVideoRect.y * this.canvasScale,
                        this._visibleVideoRect.width * this.canvasScale,
                        this._visibleVideoRect.height * this.canvasScale);
                } else {
                    // save some CPU cycles if we already did this
                    data = filtered;
                }
                break;
        }

        return data;
    };

    /**
     * set camera source by index
     * @param {int} index
     */
    /*setCameraSourceByIndex(index) {
        if (!index || index >= this.cameraSources.length) { console.log("Video Source Index does not exist"); return; }
        this.setCameraSourceByID(this.cameraSources[index].id);
    };*/

    /**
     * set camera source by id
     * @param {String} id
     */
    /*setCameraSourceByID(id) {
        navigator.webkitGetUserMedia(
            { video: {optional: [{sourceId: id }]}},
            this.onCameraStream.bind(this),
            function() {}
        );
    };*/

    /**
     * refresh camera sources
     */
    /*refreshCameraSources() {
        this.cameraSources = [];
        MediaDevices.enumerateDevices()( sources => {
            this.onCameraSources(sources);
        });
    };*/

    /**
     * on camera video source stream
     * @param stream
     * @private
     */
    protected onCameraStream(stream: MediaProvider) {
        if (this.videoElement) {
            this.videoElement.srcObject = stream;
            this.videoElement.onloadedmetadata = () => {
                this.resize();
            };
        }
    };

    /**
     * on camera sources callback
     * @param {array} sources found
     * @private
     */
    /*onCameraSources(sources) {
        var storageIndex = 0;
        for (var i=0; i < sources.length; i++) {
            if (sources[i].kind == 'video') {
                var label = sources[i].label;
                if (label == "") { label = "video " + Number(storageIndex+1); }
                sources[storageIndex] = sources[i].id;
                this.cameraSources.push({ label: label, id: sources[i].id });
                storageIndex++;
            }
        }
        var event = new CustomEvent('camerasfound', { detail: { cameras: this.cameraSources } });
        this.dispatchEvent(event);
        if (this._source) { this.source = this._source; }
    };*/

    /**
     * parse attributes on element
     * @private
     */
    protected parseAttributes() {
        if (this.hasAttribute('useCamera') || this.hasAttribute('usecamera')) {
            this._useCamera = true;
        } else {
            this._useCamera = false;
        }

        if (this.hasAttribute('src')) {
            this._source = this.getAttribute('src') as string;
        }

        if (this.hasAttribute('useCanvasForDisplay')) {
            this.useCanvasForDisplay = true;
        } else {
            this.useCanvasForDisplay = false;
        }

        if (this.hasAttribute('frameDataMode')) {
            this.frameDataMode = this.getAttribute('frameDataMode') as string;
        }

        if (this.hasAttribute('canvasRefreshInterval')) {
            this.canvasRefreshInterval = parseInt(this.getAttribute('canvasRefreshInterval') as string);
        }

        if (this.hasAttribute('canvasScale')) {
            this.canvasScale = parseFloat(this.getAttribute('canvasScale') as string);
        }

        if (this.hasAttribute('videoScaleMode')) {
            this.videoScaleMode = this.getAttribute('videoScaleMode') as string;
        }

        if (this.canvasRefreshInterval === 0 && this.useCanvasForDisplay) {
            console.log('Warning: Using canvas for display, but the canvas refresh interval is not set or set to 0. Setting refresh interval to 250ms.');
            this.canvasRefreshInterval = 250;
        }

        if (this.hasAttribute('backgroundColor')) {
            this.style.backgroundColor = this.getAttribute('backgroundColor') as string;
        }
    };
}

if (!customElements.get('canvas-video')) {
    customElements.define('canvas-video', CanvasVideo);
}