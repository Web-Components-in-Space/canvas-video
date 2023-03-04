export class CanvasVideoEvent extends Event {
    static get ON_VIDEO_PLAYING() {
        return 'videoplaying';
    }

    static get ON_FRAME_UPDATE() {
        return 'frameupdate';
    }

    static get ON_READY() {
        return 'ready';
    }

    public framedata?: ImageData | string;

    constructor(type: string, eventInit?: EventInit) {
        super(type, eventInit);
    }
}