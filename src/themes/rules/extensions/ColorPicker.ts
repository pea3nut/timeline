import { Extension, ExtensionManager } from '@/engine/extensions';
import { Timeline, Event, EventBody, EventMark, EventAxis, Component } from '@engine';

export default class ColorPicker implements Partial<Extension> {
    colors = ['rgb(213, 57, 38)', 'rgb(252, 200, 29)', 'rgb(0, 163, 201)'];
    startIndex = Math.floor(Math.random() * 3);
    constructor(public etx:ExtensionManager) {}
    async onApply(comp:Component) {
        if (Timeline.is(comp)) this.createColor(comp);
        if (
            EventBody.is(comp)
            || EventMark.is(comp)
            || EventAxis.is(comp)
        ) this.setColorIntoDrawInfo(comp);
    }

    onConstruct(comp:Component) {
        if (Event.is(comp)) comp.extraData.mainColor = '#000';
    }

    setColorIntoDrawInfo(comp:EventBody|EventMark|EventAxis) {
        const etx = this.etx;

        Object.defineProperty(comp.drawInfo, 'mainColor', {
            get() {
                return etx.getParent(comp).extraData.mainColor;
            },
        });
    }

    createColor(timeline:Timeline) {
        for (let i = 0; i < timeline.events.length; i++) {
            const colorIndex = (i + this.startIndex) % this.colors.length;
            timeline.events[i].extraData.mainColor = this.colors[colorIndex];
        }
    }
}