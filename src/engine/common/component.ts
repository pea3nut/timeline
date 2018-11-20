import {ComponentDrawInfo} from "@engine/types";
import {ExtensionManager} from "@/extensions";
import {DEBUG, SN} from "@engine/common/config";

export default abstract class Component{
    name :SN;

    /**
     * The data which be used in Extensions.
     * @property id - using in GeneratorId
     * @property boxElement - using in BoxElementGenerator
     * @property realLength - using in PositionCounter, existing in Axis only.
     * @property needed - using in ConflictFixer, existing in EventBody only.
     * @property space - using in ConflictFixer, existing in EventBody only.
     * */
    extraData :{
        boxElement ?:HTMLElement,
        id ?:string,
        realLength ?:number,
        needed?: {top:number, bottom:number},
        space?: {top:number, bottom:number},
    } = {};

    /**
     * There are must be init before self.apply called.
     * */
    canvas :HTMLCanvasElement;
    container :HTMLElement;

    ext: ExtensionManager;
    public constructor(
        {ext,canvas,container}
        :{ext:ExtensionManager, canvas?:HTMLCanvasElement, container?:HTMLElement}
    ){
        if(!(this.constructor.name in SN)) {
            throw new TypeError(`Class name "${this.constructor.name}" illegal, it must following ${Object.keys(SN)}`);
        }

        this.name = SN[this.constructor.name as any] as SN;

        this.ext = ext;

        this.canvas = canvas as any;
        this.container = container as any;

        this.ext.onConstruct(this);
    };

    /**
     * All info about draw.
     * Must can be JSON.stringify.
     * */
    abstract drawInfo: ComponentDrawInfo;

    /**
     * Draw self base on self.drawInfo.
     * It should can be call multiple times.
     * */
    draw(){
        this._checkDestroy();

        if(this.element) this.element.style.visibility = 'visible';
        this.ext.onDraw(this);
    };

    /**
     * If the view of component depend on DOM element, that's element will set here.
     * */
    element ?:HTMLElement;

    /**
     * Hide self. It should hide all element created by self.
     * Don't clear Canvas in there!
     * This method will try set "visibility: 'hidden'" for self.element
     * */
    hide(){
        this._checkDestroy();

        if(this.element) this.element.style.visibility = 'hidden';
        this.canvas.getContext('2d')!.clearRect(
            0, 0, this.canvas.width, this.canvas.height
        );

        this.ext.onHide(this);
    };

    /**
     * Update component use self.drawInfo
     * */
    async apply(...args :any[]) :Promise<any> {
        this._checkDestroy();
        await this.ext.onApply(this);
    };

    /**
     * The component has bean destroyed.
     * Call any method on component destroyed will got an error.
     * */
    destroyed: boolean = false;
    /**
     * Destroy this component.
     * It should remove all element from dom if that's created by this component
     * */
    destroy(){
        this._checkDestroy();
        this.destroyed = true;

        this.ext.onDestroy(this);
    };

    /**
     * Print log if DEBUG is true.
     * @example this.l`Hello world`
     * */
    l(stringArr:TemplateStringsArray, ...values:any[]){
        if(!DEBUG) return;

        let message = [stringArr[0]];
        for (let index = 0; index < values.length; index++) {
            message.push(values[index], stringArr[index+1]);
        }
        console.log(`${this.name} #`, ...message);
    };

    /**
     * Verify a component is destroyed or not, if yes throw an error.
     * */
    private _checkDestroy(){
        if(this.destroyed) throw new Error(`${this.name} has bean destroyed, however, you still call it's method.`);
    };
}