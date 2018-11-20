import {DateBy, GridConfig} from "@engine/types";

export const DEBUG = true;

export enum SN{
    Timeline = 'time_line',
    Axis = 'axis',
    AxisBody = 'axis_body',
    AxisScale = 'axis_scale',
    AxisMilestone = 'axis_milestone',
    Event = 'event',
    EventBody = 'event_body',
    EventMark = 'event_mark',
    EventAxis = 'event_axis',
}

export const GRID :{ [canvasWidth:number]:GridConfig } = {
    700: {
        axisAlign: {
            x: 550,
            y: 10,
        },
        eventWidth: 350,
        canvasWidth: 700,
    },
};

export const DATE_COUNT_EXTRA = {
    [DateBy.Day]:       1000*60*60*24 / 2,
    [DateBy.Week]:      1000*60*60*24*7 / 2,
    [DateBy.Month]:     1000*60*60*24*30 / 2,
    [DateBy.Quarter]:   1000*60*60*24*30*3 / 2,
    [DateBy.Year]:      1000*60*60*24*30*12 / 2,
};

export const WALK_ON = {
    [SN.EventAxis]: {
        offsetOneStep: 15,
    }
};