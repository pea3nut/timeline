"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var functions_1 = require("../common/functions");
var Component_1 = require("../common/Component");
var definitions_1 = require("../common/definitions");
/**
 * The milestone on Axis, for indicate time of nearby area.
 * Can conflict with EventBody.
 * */
var AxisMilestone = /** @class */ (function (_super) {
    __extends(AxisMilestone, _super);
    function AxisMilestone(props) {
        var _this = _super.call(this, props) || this;
        _this.name = definitions_1.SN.AxisMilestone;
        _this.drawInfo = {
            bodyDrawInfo: {},
            alignY: 0,
            content: '0_o',
            box: {
                x: 0,
                y: 0,
                width: 0,
                height: 0,
            },
        };
        _this.ext.onConstruct(_this);
        return _this;
    }
    AxisMilestone.prototype.formatDate = function (date, by) {
        var monthAbbr = date.toDateString().split(' ')[1];
        switch (by) {
            case "year" /* Year */: return "" + date.getFullYear();
            case "quarter" /* Quarter */: return monthAbbr + ". " + date.getFullYear();
            case "month" /* Month */: return monthAbbr + ".";
            case "week" /* Week */: return date.getMonth() + 1 + "." + date.getDate();
            case "day" /* Day */: return date.getMonth() + 1 + "." + date.getDate();
            default: return date.toLocaleString();
        }
    };
    AxisMilestone.prototype.createElement = function () {
        var flag = _super.prototype.createElement.call(this); // Must return this flag
        this.element.innerHTML = typeof this.drawInfo.content === 'string'
            ? this.drawInfo.content
            : this.formatDate(new Date(this.drawInfo.content.date), this.drawInfo.content.by);
        var _a = functions_1.parseBox(this.element), width = _a.width, height = _a.height;
        var x = this.drawInfo.bodyDrawInfo.box.x
            + this.drawInfo.bodyDrawInfo.box.width / 2
            - width / 2;
        var y = this.drawInfo.alignY - height / 2;
        this.element.style.left = x + "px";
        this.element.style.top = y + "px";
        return flag;
    };
    AxisMilestone.prototype.createBox = function () {
        this.drawInfo.box = functions_1.parseBox(this.element);
        return _super.prototype.createBox.call(this);
    };
    AxisMilestone.prototype.apply = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.createElement();
                this.element.style.visibility = 'hidden';
                this.createBox();
                return [2 /*return*/, _super.prototype.apply.call(this)];
            });
        });
    };
    AxisMilestone.prototype.draw = function () {
        this.createElement();
        return _super.prototype.draw.call(this);
    };
    AxisMilestone.is = function (comp) {
        return comp.name === definitions_1.SN.AxisMilestone;
    };
    return AxisMilestone;
}(Component_1.default));
exports.default = AxisMilestone;
