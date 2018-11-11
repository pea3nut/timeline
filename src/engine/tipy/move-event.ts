import EventBody from "@engine/event/body";
import Component from "@engine/common/component";
import {Breakpoint, WalkOnResult} from "@engine/tipy";
import {SN} from "@engine/types";
import {DEBUG} from "@engine/common/config";
import Tipy from "@engine/tipy";
import {isOverlap} from "@engine/common/functions";

export interface Conflict{
    with: EventBody[],
    self: EventBody,
}

export default class MoveEvent{
    constructor(public tipy:Tipy){
        if(DEBUG){
            (<any>window).mover = this;
        }
    };

    conflicts:Conflict[] = [];
    allEventBody = Array.from( // above EventBody is above, below EventBody is below
        this.tipy.components[SN.EventBody] as EventBody[]
    ).sort((eb1,eb2)=>eb1.drawInfo.target.y - eb2.drawInfo.target.y);
    spaceMap = new Map as Map<EventBody, {top:number, bottom:number}>;

    static avoid({mover, fixed, direction}:{mover:Component, fixed:Component, direction:1|-1}){
        if(direction > 0){
            mover.drawInfo.box.y = fixed.drawInfo.box.y + fixed.drawInfo.box.height +1;
        }else{
            mover.drawInfo.box.y = fixed.drawInfo.box.y - mover.drawInfo.box.height - 1;
        }
        mover.apply();
    };
    static isConflict(eb1:EventBody, eb2:EventBody){
        if(eb1 === eb2) return false;

        if(eb1.drawInfo.floated !== eb2.drawInfo.floated){
            const floated = (eb1.drawInfo.floated ? eb1 : eb2) as EventBody;
            const another =  (eb1 === floated ? eb2 : eb1) as EventBody;

            if(
                (floated.drawInfo.target.y > another.drawInfo.box.y)
                && floated.drawInfo.target.y < (another.drawInfo.box.y + another.drawInfo.box.height)
            ) return true;

        }

        return isOverlap(eb1.drawInfo.box,eb2.drawInfo.box);
    }

    public async walkOn(){
        let alleviated = false;

        repair: while(true){
            switch(await this.tryFixOne()){
                case WalkOnResult.NoConflict:
                    return WalkOnResult.NoConflict;
                case WalkOnResult.Alleviated:
                    alleviated = true;
                    continue repair;
                case WalkOnResult.Failed:
                    return alleviated
                        ?WalkOnResult.Alleviated
                        :WalkOnResult.NoConflict
                    ;
            }
        }

    };


    /**
     * @return {boolean} have fixed one of conflicts?
     * */
    private async tryFixOne() :Promise<WalkOnResult>{
        this.countConflict();
        this.countSpace();

        console.log('all', this.conflicts);

        if(this.conflicts.length === 0) return WalkOnResult.NoConflict;
        this.conflicts = this.conflicts.filter(
            conflict => this.isPossible(conflict)
        );
        if(this.conflicts.length === 0) return WalkOnResult.Failed;

        console.log('filtered', this.conflicts);

        const conflict = this.conflicts.find(
            conflict1 => this.conflicts.every(
                conflict2 => this.countCast(conflict1) <= this.countCast(conflict2)
            )
        )!;

        console.log('fix', conflict);

        await this.tipy.setBreakpoint(
            Breakpoint.MoveEventBody,
            {
                onBreak: async ()=>{
                    await Promise.all([
                        ...conflict.with.map(c=>c.draw()),
                        conflict.self.draw(),
                        ...this.tipy.components[SN.Axis].map(c=>c.draw()),
                    ]);
                },
                onNext: ()=>{
                    this.tipy.clearCanvas();
                    [
                        ...conflict.with,
                        conflict.self,
                        ...this.tipy.components[SN.Axis],
                    ].forEach(c=>c.hide());
                },
            },
        );
        await this.fixConflict(conflict);
        await this.tipy.setBreakpoint(
            Breakpoint.MoveEventBody,
            {
                onBreak: async ()=>{
                    await Promise.all([
                        ...conflict.with.map(c=>c.draw()),
                        conflict.self.draw(),
                        ...this.tipy.components[SN.Axis].map(c=>c.draw()),
                    ]);
                },
                onNext: ()=>{
                    this.tipy.clearCanvas();
                    [
                        ...conflict.with,
                        conflict.self,
                        ...this.tipy.components[SN.Axis],
                    ].forEach(c=>c.hide());
                },
            },
        );

        return WalkOnResult.Alleviated;

    };
    private isPossible(conflict:Conflict){
        if(conflict.with.length > 1) return false;

        const needed = this.countNeeded(conflict);
        const space = this.spaceMap.get(conflict.self)!;

        return (needed.bottom === 0 || needed.top === 0)
            && (space.bottom >= needed.bottom && space.top >= needed.top)
        ;
    };
    private async fixConflict(conflict:Conflict){
        const needed = this.countNeeded(conflict);
        const moveDistance = needed.top ? needed.top : -needed.bottom;
        const direction = moveDistance/Math.abs(moveDistance) as (1 | -1);

        // fix conflict
        conflict.self.drawInfo.box.y += moveDistance;
        conflict.self.apply();

        // and fix side-effect
        const effectable = this.allEventBody.filter(
            eb => eb.drawInfo.floated === conflict.self.drawInfo.floated
        );
        for(
            let i = effectable.indexOf(conflict.self) + direction;
            i>=0 && i<effectable.length;
            i += direction
        ){
            const last = effectable[i - direction];
            const now = effectable[i];
            if(MoveEvent.isConflict(last, now)){
                MoveEvent.avoid({
                    mover: now,
                    fixed: last,
                    direction: direction,
                });
            } else break;
        }

    };

    private countConflict(){
        this.conflicts.length = 0;

        for(let eb of this.allEventBody){
            const conflict = {
                self: eb,
                with: this.tipy.components[SN.EventBody].filter(
                    target => MoveEvent.isConflict(eb, <EventBody>target)
                ) as EventBody[],
            };
            if(conflict.with.length) this.conflicts.push(conflict);
        }
    }
    private countCast(conflict:Conflict){
        const needed = this.countNeeded(conflict);
        return needed.bottom + needed.top;
    }
    /**
     * Count the number how many space needed for fix the conflict by verticalMove
     * */
    private countNeeded(conflict:Conflict) :{top:number, bottom:number}{
        const origin = conflict.self;
        const result = {
            top: 0,
            bottom: 0,
        };
        const above:EventBody[] = conflict.with.filter(cb => cb.drawInfo.target.y < origin.drawInfo.target.y);
        const below:EventBody[] = conflict.with.filter(cb => cb.drawInfo.target.y > origin.drawInfo.target.y);

        if(above.length){
            result.top = Math.max(
                ...above.map(upper => {
                    if(upper.drawInfo.floated === origin.drawInfo.floated)
                        return upper.drawInfo.box.y + upper.drawInfo.box.height - origin.drawInfo.box.y;
                    else if (origin.drawInfo.floated)
                        return (upper.drawInfo.box.y + upper.drawInfo.box.height) - origin.drawInfo.target.y;
                    else if (upper.drawInfo.floated)
                        return upper.drawInfo.target.y - origin.drawInfo.box.y;
                    else throw SyntaxError('floated is not a boolean');
                })
            );
        }
        if(below.length){
            result.bottom = Math.max(
                ...below.map(lower => {
                    if(lower.drawInfo.floated === origin.drawInfo.floated)
                        return origin.drawInfo.box.y + origin.drawInfo.box.height - lower.drawInfo.box.y;
                    else if (origin.drawInfo.floated)
                        return origin.drawInfo.target.y - lower.drawInfo.box.y;
                    else if (lower.drawInfo.floated)
                        return (origin.drawInfo.box.y + origin.drawInfo.box.height) - lower.drawInfo.target.y;
                    else throw SyntaxError('floated is not a boolean');
                })
            );
        }

        // margin 1 to target of conflict
        if(result.top) result.top++;
        if(result.bottom) result.bottom++;

        if(DEBUG){
            origin.drawInfo.debug=Object.assign(
                {},
                origin.drawInfo.debug,
                {needed: result},
            );
        }

        return result;
    };
    /**
     * Count the number how many space the component can move
     * */
    private countSpace(){
        const spacePadding = 4;//FIXME: remove supported

        // Itself's can move space
        this.allEventBody.forEach(
            eb => this.spaceMap.set(eb, {
                top: eb.drawInfo.target.y - eb.drawInfo.box.y - spacePadding,
                bottom: eb.drawInfo.box.y + eb.drawInfo.box.height - eb.drawInfo.target.y - spacePadding,
            })
        );
        
        const applyLimiting = (allEventBody:EventBody[]) => {
            if(allEventBody.length === 0) return;

            // An item is limited from

            // it's first that prevent out of canvas
            const first = allEventBody[0];
            this.spaceMap.get(first)!.bottom = Math.min(
                this.spaceMap.get(first)!.bottom,
                first.drawInfo.box.y,
            );
            // it's last that prevent out of canvas
            const last = allEventBody[allEventBody.length-1];
            this.spaceMap.get(last)!.top = Math.min(
                this.spaceMap.get(last)!.top,
                this.tipy.canvas.height - (last.drawInfo.box.y + last.drawInfo.box.height),
            );
            // clamp by neighbor
            for(let i = 1; i<allEventBody.length; i++){
                const previous = allEventBody[i-1];
                const now = allEventBody[i];
                const nowData = this.spaceMap.get(now)!;
                const previousData = this.spaceMap.get(previous)!;

                const distance = now.drawInfo.box.y - (previous.drawInfo.box.y + previous.drawInfo.box.height);

                nowData.bottom = Math.min(
                    nowData.bottom,
                    distance + previousData.bottom
                );
            }
            for(let i = allEventBody.length-2; i>=0; i--){
                const next = allEventBody[i+1];
                const now = allEventBody[i];
                const nowData = this.spaceMap.get(now)!;
                const nextData = this.spaceMap.get(next)!;

                const distance = next.drawInfo.box.y - (now.drawInfo.box.y + now.drawInfo.box.height);

                nowData.top = Math.min(
                    nowData.top,
                    distance + nextData.top
                );
            }

            //Set number which < 0 as 0
            Array.from(this.spaceMap.values()).forEach(value => {
                value.top = Math.max(0, value.top);
                value.bottom = Math.max(0, value.bottom);
            });
        };

        applyLimiting(this.allEventBody.filter(eb => eb.drawInfo.floated));
        applyLimiting(this.allEventBody.filter(eb => !eb.drawInfo.floated));

        if(DEBUG){
            this.allEventBody.forEach(eb => eb.drawInfo.debug=Object.assign(
                {},
                eb.drawInfo.debug,
                {space: this.spaceMap.get(eb)},
            ))
        }
    }
};
